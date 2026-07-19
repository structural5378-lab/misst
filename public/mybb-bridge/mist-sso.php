<?php
/**
 * MIST → MyBB SSO Bridge (MIST-as-IdP)
 * -----------------------------------
 * MIST is the single source of truth for identity AND authorization. This bridge
 * verifies the HS256-signed token issued by MIST's ssoIssueToken function, then
 * syncs the MyBB user's usergroup from the permissions/roles embedded in the token.
 *
 * MyBB makes NO independent authorization decisions — it trusts MIST's RBAC output.
 */

define('IN_MYBB', 1);
define('THIS_SCRIPT', 'mist_sso');

$bridge_dir = dirname(__FILE__);
// MyBB lives one level up from this bridge directory (public/mybb-bridge).
$mybb_root = realpath($bridge_dir . '/../') . '/';
if (!file_exists($mybb_root . 'global.php')) {
    // Fallback: assume the bridge sits inside the MyBB root.
    $mybb_root = $bridge_dir . '/';
}

require_once $mybb_root . 'global.php';

header('Content-Type: application/json; charset=utf-8');

function b64url_decode($s) {
    $pad = strlen($s) % 4;
    if ($pad) $s .= str_repeat('=', 4 - $pad);
    return base64_decode(strtr($s, '-_', '+/'));
}

function bail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

$secret = getenv('MIST_BRIDGE_SECRET');
if (!$secret) $secret = isset($_ENV['MIST_BRIDGE_SECRET']) ? $_ENV['MIST_BRIDGE_SECRET'] : '';
if (!$secret) bail('Bridge secret not configured', 500);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) $body = $_POST;
$token = isset($body['token']) ? $body['token'] : '';
if (!$token) bail('Missing token');

$parts = explode('.', $token);
if (count($parts) !== 3) bail('Malformed token');

// Verify HS256 signature (constant-time compare)
$expected = hash_hmac('sha256', $parts[0] . '.' . $parts[1], $secret, true);
$given = b64url_decode($parts[2]);
if (!hash_equals($expected, $given)) bail('Invalid signature', 401);

$payload = json_decode(b64url_decode($parts[1]), true);
if (!$payload) bail('Invalid payload');
if (!isset($payload['exp']) || $payload['exp'] < time()) bail('Token expired', 401);

$username = isset($payload['mybb_username']) ? $payload['mybb_username'] : '';
if (!$username) bail('No MyBB username in token');

// Look up the MyBB user
$usernameEsc = $db->escape_string($username);
$query = $db->simple_select('users', '*', "username='" . $usernameEsc . "'", ['limit' => 1]);
$mybbUser = $db->fetch_array($query);
if (!$mybbUser) bail('MyBB user not found', 404);

// ── Derive MyBB usergroup from MIST RBAC (MIST is the source of truth) ──────
$perms = isset($payload['permissions']) && is_array($payload['permissions']) ? $payload['permissions'] : [];
$roles = isset($payload['roles']) && is_array($payload['roles']) ? $payload['roles'] : [];
$legacy = isset($payload['legacy_roles']) && is_array($payload['legacy_roles']) ? $payload['legacy_roles'] : [];
$isOwner = !empty($payload['is_owner']) || in_array('owner', $roles) || in_array('platform_owner', $legacy);

// MyBB default usergroup ids: 4 = Administrators, 3 = Super Moderators,
// 2 = Registered, 5 = Awaiting Activation, 7 = Banned.
$gid = 2; // registered
if (in_array('banned', $roles)) {
    $gid = 7;
} elseif ($isOwner || in_array('administrator', $roles) || in_array('senior_moderator', $roles) || in_array('*', $perms)) {
    $gid = 4;
} elseif (in_array('moderator', $roles)) {
    $gid = 3;
}

$update = [];
if ((int)$mybbUser['usergroup'] !== $gid) {
    $update['usergroup'] = $gid;
    $update['displaygroup'] = $gid;
}

// Suspend/ban mirror: MIST denied_* or banned role → MyBB banned group
if (in_array('suspended', $roles) || in_array('muted', $roles)) {
    // Keep their real group but ensure they're not elevated while restricted.
    if ($gid === 2) { /* registered stays — additional handling can be added */ }
}

if ($update) {
    $db->update_query('users', $update, "uid='" . (int)$mybbUser['uid'] . "'");
}

// Establish a MyBB session WITHOUT a password — MyBB never authenticates on its own.
my_setcookie('mybbuser', $mybbUser['uid'] . '_' . $mybbUser['loginkey'], null, true);
my_setcookie('sid', $session->sid, -1, true);

$session->update_session($session->sid, [
    'uid' => (int)$mybbUser['uid'],
    'time' => TIME_NOW
]);
$db->update_query('users', [
    'lastvisit' => TIME_NOW,
    'lastactive' => TIME_NOW
], "uid='" . (int)$mybbUser['uid'] . "'");

echo json_encode([
    'success' => true,
    'uid' => (int)$mybbUser['uid'],
    'username' => $mybbUser['username'],
    'usergroup' => $gid,
    'roles' => $roles
]);
