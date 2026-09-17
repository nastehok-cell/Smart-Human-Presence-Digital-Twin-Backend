const Ajv = require("ajv");

const ajv = new Ajv({ allErrors: true });

// Anonymous sensor event, as produced by sensor/sensor_service.py
const sensorUpdateSchema = {
  type: "object",
  required: ["timestamp", "zone_id", "occupancy_count", "movement_events", "confidence"],
  additionalProperties: false,
  properties: {
    timestamp: { type: "string" },
    zone_id: { type: "string" },
    occupancy_count: { type: "integer", minimum: 0 },
    movement_events: {
      type: "array",
      items: {
        type: "object",
        required: ["x", "y", "confidence"],
        additionalProperties: false,
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  }
};

const loginSchema = {
  type: "object",
  required: ["username", "avatarColor"],
  additionalProperties: false,
  properties: {
    username: { type: "string", minLength: 1, maxLength: 32 },
    avatarColor: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" }
  }
};

module.exports = {
  validateSensorUpdate: ajv.compile(sensorUpdateSchema),
  validateLogin: ajv.compile(loginSchema)
};
