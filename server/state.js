// In-memory only — no database, no disk persistence.
// Keeps two separate states, as required by the privacy-by-design architecture:
//   loggedInUsers      - named users from the login demo (UC_1)
//   anonymousPresences - anonymous per-zone occupancy from the sensor pipeline

const loggedInUsers = new Map(); // socketId -> { username, avatarColor, location }
const anonymousPresences = new Map(); // zone_id -> { event, receivedAt }

// A zone with no sensor:update in this window is treated as stale and
// dropped, rather than shown to the Digital Twin as permanent occupancy.
const PRESENCE_TTL_MS = 5000;

function isUsernameTaken(username) {
  const lower = username.toLowerCase();
  for (const user of loggedInUsers.values()) {
    if (user.username.toLowerCase() === lower) return true;
  }
  return false;
}

function addLoggedInUser(socketId, { username, avatarColor }) {
  const user = { username, avatarColor, location: { x: 0, y: 0 } };
  loggedInUsers.set(socketId, user);
  return user;
}

function updateUserLocation(socketId, location) {
  const user = loggedInUsers.get(socketId);
  if (!user) return null;
  user.location = location;
  return user;
}

function removeLoggedInUser(socketId) {
  loggedInUsers.delete(socketId);
}

function upsertAnonymousPresence(event) {
  anonymousPresences.set(event.zone_id, { event, receivedAt: Date.now() });
}

function getAnonymousPresences() {
  const now = Date.now();
  const fresh = [];
  for (const [zoneId, entry] of anonymousPresences) {
    if (now - entry.receivedAt > PRESENCE_TTL_MS) {
      anonymousPresences.delete(zoneId);
      continue;
    }
    fresh.push(entry.event);
  }
  return fresh;
}

function getState() {
  return {
    loggedInUsers: Array.from(loggedInUsers.values()),
    anonymousPresences: getAnonymousPresences()
  };
}

module.exports = {
  isUsernameTaken,
  addLoggedInUser,
  updateUserLocation,
  removeLoggedInUser,
  upsertAnonymousPresence,
  getAnonymousPresences,
  getState,
  PRESENCE_TTL_MS
};
