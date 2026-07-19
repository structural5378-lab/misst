<?php
/**
 * mist-sso.php — MIST Single Sign-On bridge for MyBB.
 *
 * MIST is the Identity Provider (IdP); MyBB is a trusted consumer.
 * Deploy this file to insomniacsgmrs.com (e.g. alongside mist-api.php).
 * It must NOT be reachable as a plain login page — it only honors signed
 * MIST tokens or secret-protected admin actions. MyBB never shows its own
 * login/registration once this is wired.
 *
 * Actions (all POST):
 *   - action=sso       : { token }  -> verify HS256 token, create MyBB session, redirect to forum
 *   - action=list_users: (admin)    -> return MyBB user list for migration (X-Mist-Secret required)
 *
 * Configure:
 *   - MIST_BRIDGE_SECRET: the shared secret (same value as the MIST env secret)
 *   - $MYBB_PATH: absolute path to MyBB root (where global.php / init.php lives)
 *   - $FORUM_URL: where to redirect after a successful SSO login
 *
 * Security:
 *   - SSO tokens are HS256-signed with MIST_BRIDGE_SECRET and expire in 120s.
 *   - No password is ever used; no query-string auth. Tokens arrive via POST body.
 *   - list_users requires the X-Mist-Secret header.
 *
 * Rollback: this bridge only creates sessions / reads users. It never deletes or
 * overwrites MyBB data, so SSO can be disabled by simply removing this file.
 */

$MIST_BRIDGE_SECRET = getenv('MIST_BRIDGE_SECRET') ?: 'CHANGE_ME_TO_MATCH_MIST';
$MYBB_PATH = '/path/to/forums';        // <-- set to your MyBB root
$FORUM_URL = 'https://insomniacsgmrs.com/'; // <-- where to land after SSO

header('Content-Type: application/json; charset=utf-8');

function b64url_decode($s) {
    return base64_decode(strtr($s, '-_', '+/'));
}

function verify_hs256($signingInput, $signatureB64, $secret) {
    $expected = hash_hmac('sha256', $signingInput, $secret, true);
    $provided = b64url_decode($signatureB64);
    return hash_equals($expected, $provided);
}

function jwt_verify($token, $secret) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$head, $body, $sig] = $parts;
    if (!verify_hs256("$head.$body", $sig, $secret)) return null;
    $payload = json_decode(b64url_decode($body), true);
    if (!is_array($payload)) return null;
    $now = time();
    if (isset($payload['exp']) && $payload['exp'] < $now) return null;
    return $payload;
}

$action = $_POST['action'] ?? '';

if ($action === 'sso') {
    $token = $_POST['token'] ?? '';
    if (!$token) { http_response_code(400); echo json_encode(['error' => 'Missing token']); exit; }
    $payload = jwt_verify($token, $MIST_BRIDGE_SECRET);
    if (!$payload) { http_response_code(401); echo json_encode(['error' => 'Invalid or expired token']); exit; }

    $mybbUsername = $payload['mybb_username'] ?? '';
    if (!$mybbUsername) { http_response_code(400); echo json_encode(['error' => 'Token missing username']); exit; }

    // Boot MyBB and create a login session for the user WITHOUT a password.
    define('IN_MYBB', 1);
    define('NO_ONLINE', 1); // avoid double session writes
    require_once rtrim($MYBB_PATH, '/') . '/global.php';

    // Look up the MyBB user by username.
    $query = $db->simple_select('users', 'uid, username, loginkey, usergroup', "username='" . $db->escape_string($mybbUsername) . "'", ['limit' => 1]);
    $mybbUser = $db->fetch_array($query);
    if (!$mybbUser) { http_response_code(404); echo json_encode(['error' => 'MyBB user not found: ' . $mybbUsername]); exit; }

    // Establish a MyBB login session (sets the mybbuser login cookie).
    my_setcookie('mybbuser', $mybbUser['uid'] . '_' . $mybbUser['loginkey'], null, true);
    my_setcookie('sid', session_id(), null, true);

    // Record a login session row.
    $db->insert_query('sessions', [
        'sid' => session_id(),
        'uid' => $mybbUser['uid'],
        'ip' => $session->packedip,
        'time' => TIME_NOW,
        'location' => 0,
        'useragent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 100),
        'anonymous' => 0,
        'location1' => 0,
        'location2' => 0
    ]);

    // Redirect into the forum — user is now authenticated.
    header('Location: ' . $FORUM_URL);
    exit;
}

if ($action === 'list_users') {
    $secret = $_SERVER['HTTP_X_MIST_SECRET'] ?? '';
    if (!hash_equals($MIST_BRIDGE_SECRET, $secret)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    define('IN_MYBB', 1);
    define('NO_ONLINE', 1);
    require_once rtrim($MYBB_PATH, '/') . '/global.php';

    $users = [];
    $query = $db->simple_select('users', 'uid, username, email, usergroup, additionalgroups, postcount, reputation, threadcount, avatar', '', ['limit' => 5000]);
    while ($row = $db->fetch_array($query)) {
        $users[] = [
            'uid' => (int)$row['uid'],
            'username' => $row['username'],
            'email' => $row['email'],
            'usergroup' => (int)$row['usergroup'],
            'additionalgroups' => $row['additionalgroups'],
            'postcount' => (int)$row['postcount'],
            'reputation' => (int)$row['reputation'],
            'threadcount' => (int)$row['threadcount'],
            'avatar' => $row['avatar']
        ];
    }
    echo json_encode(['success' => true, 'users' => $users]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action']);
