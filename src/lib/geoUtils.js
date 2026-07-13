export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);
  const a = sinHalfLat * sinHalfLat +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * sinHalfLon * sinHalfLon;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearing(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI + 360;
  return brng % 360;
}

export function compassDirection(brng) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(brng / 45) % 8];
}

export function formatDistance(km) {
  if (km < 1) return Math.round(km * 1000) + " m";
  if (km < 10) return km.toFixed(1) + " km";
  return Math.round(km) + " km";
}

export function formatDistanceMixed(km) {
  if (km < 1) return Math.round(km * 1000) + " m";
  const miles = km * 0.621371;
  if (miles < 10) return miles.toFixed(1) + " mi";
  return Math.round(miles) + " mi";
}