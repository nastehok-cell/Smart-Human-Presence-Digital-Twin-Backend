const { test } = require("node:test");
const assert = require("node:assert/strict");

const { validateSensorUpdate, validateLogin } = require("../schema");

function validSensorEvent(overrides = {}) {
  return {
    timestamp: "2026-09-17T12:00:00.000Z",
    zone_id: "zone_1",
    occupancy_count: 2,
    movement_events: [{ x: 120.5, y: 80.2, confidence: 0.91 }],
    confidence: 0.91,
    ...overrides
  };
}

test("validateSensorUpdate accepts a well-formed event", () => {
  assert.equal(validateSensorUpdate(validSensorEvent()), true);
});

test("validateSensorUpdate rejects a missing required field", () => {
  const { confidence, ...event } = validSensorEvent();
  assert.equal(validateSensorUpdate(event), false);
});

test("validateSensorUpdate rejects unknown properties (anonymity boundary)", () => {
  assert.equal(validateSensorUpdate(validSensorEvent({ raw_frame: "..." })), false);
});

test("validateSensorUpdate rejects out-of-range confidence", () => {
  assert.equal(validateSensorUpdate(validSensorEvent({ confidence: 1.5 })), false);
});

test("validateSensorUpdate rejects negative occupancy_count", () => {
  assert.equal(validateSensorUpdate(validSensorEvent({ occupancy_count: -1 })), false);
});

test("validateLogin accepts a well-formed payload", () => {
  assert.equal(validateLogin({ username: "alice", avatarColor: "#ff0000" }), true);
});

test("validateLogin rejects a missing avatarColor", () => {
  assert.equal(validateLogin({ username: "alice" }), false);
});

test("validateLogin rejects a malformed color", () => {
  assert.equal(validateLogin({ username: "alice", avatarColor: "red" }), false);
});

test("validateLogin rejects an empty username", () => {
  assert.equal(validateLogin({ username: "", avatarColor: "#ff0000" }), false);
});
