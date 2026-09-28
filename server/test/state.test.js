const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const state = require("../state");

test("addLoggedInUser starts a user at the origin", () => {
  const user = state.addLoggedInUser("socket-1", { username: "alice", avatarColor: "#ff0000" });
  assert.deepEqual(user.location, { x: 0, y: 0 });
  state.removeLoggedInUser("socket-1");
});

test("isUsernameTaken is case-insensitive", () => {
  state.addLoggedInUser("socket-2", { username: "Bob", avatarColor: "#00ff00" });
  assert.equal(state.isUsernameTaken("bob"), true);
  assert.equal(state.isUsernameTaken("carol"), false);
  state.removeLoggedInUser("socket-2");
});

test("updateUserLocation moves a known user and ignores unknown sockets", () => {
  state.addLoggedInUser("socket-3", { username: "dave", avatarColor: "#0000ff" });
  const updated = state.updateUserLocation("socket-3", { x: 5, y: 9 });
  assert.deepEqual(updated.location, { x: 5, y: 9 });
  assert.equal(state.updateUserLocation("no-such-socket", { x: 1, y: 1 }), null);
  state.removeLoggedInUser("socket-3");
});

test("removeLoggedInUser frees the username for reuse", () => {
  state.addLoggedInUser("socket-4", { username: "erin", avatarColor: "#123456" });
  state.removeLoggedInUser("socket-4");
  assert.equal(state.isUsernameTaken("erin"), false);
});

test("upsertAnonymousPresence is queryable immediately by zone", () => {
  const event = {
    timestamp: new Date().toISOString(),
    zone_id: "zone_test_fresh",
    occupancy_count: 1,
    movement_events: [],
    confidence: 0.5
  };
  state.upsertAnonymousPresence(event);
  const presences = state.getAnonymousPresences();
  assert.ok(presences.some((p) => p.zone_id === "zone_test_fresh"));
});

test("getAnonymousPresences drops entries older than PRESENCE_TTL_MS", () => {
  mock.timers.enable({ apis: ["Date"] });
  try {
    state.upsertAnonymousPresence({
      timestamp: new Date().toISOString(),
      zone_id: "zone_test_stale",
      occupancy_count: 1,
      movement_events: [],
      confidence: 0.5
    });
    assert.ok(state.getAnonymousPresences().some((p) => p.zone_id === "zone_test_stale"));

    mock.timers.tick(state.PRESENCE_TTL_MS + 1000);

    assert.equal(state.getAnonymousPresences().some((p) => p.zone_id === "zone_test_stale"), false);
  } finally {
    mock.timers.reset();
  }
});
