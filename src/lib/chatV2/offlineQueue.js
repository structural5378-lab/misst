// Chat V2 offline queue — persists unsent messages in localStorage so nothing is
// lost when the connection drops. Messages are flushed back to the server on
// reconnect (window "online" event or manual retry).

const KEY = "mist_chatv2_queue_v1";

export function getQueue() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function save(q) {
  try { localStorage.setItem(KEY, JSON.stringify(q)); } catch { /* storage may be full/unavailable */ }
}

export function enqueue(item) {
  const q = getQueue();
  if (q.find((x) => x.client_temp_id === item.client_temp_id)) return q;
  q.push(item);
  save(q);
  return q;
}

export function remove(clientTempId) {
  const q = getQueue().filter((x) => x.client_temp_id !== clientTempId);
  save(q);
  return q;
}

export function clearQueue() {
  save([]);
}

export function hasQueued() {
  return getQueue().length > 0;
}