# Backend API Spec

Node.js + Express + Socket.IO backend for the Smart Human Presence pilot.
No persistent storage — all state is in-memory only (privacy rules US_2, UC_7).

## Socket.IO events

### Client -> Server

| Event | Payload | Notes |
|---|---|---|
| `login` | `{ username: string, avatarColor: "#rrggbb" }` | UC_1. Rejected with `login:error` if the username is already taken or the payload is invalid. |
| `user:move` | `{ x: number, y: number }` | Updates the caller's avatar location. |
| `logout` | — | Removes the caller from `loggedInUsers`. |
| `sensor:update` | See "Sensor event schema" below | Sent by the Python sensor process (UC_9). Validated with Ajv; invalid payloads get a `sensor:error` reply and are dropped. |

### Server -> Client

| Event | Payload | Notes |
|---|---|---|
| `login:success` | `{ username, avatarColor, location }` | Sent to the socket that just logged in. |
| `login:error` | `{ message }` | |
| `sensor:error` | `{ message, errors }` | |
| `state:update` | `{ loggedInUsers: [...], anonymousPresences: [...] }` | Broadcast to all clients on every change and on a fixed interval (500ms). |

A client disconnecting (tab closed, network drop) is treated the same as `logout`.

## REST

| Method | Path | Response |
|---|---|---|
| GET | `/api/map` | Contents of `server/map.json` — zone polygons for the test area. |

## Sensor event schema

Produced by `sensor/sensor_service.py`, validated by `server/schema.js`:

```json
{
  "timestamp": "2026-09-17T12:00:00.000Z",
  "zone_id": "zone_1",
  "occupancy_count": 2,
  "movement_events": [
    { "x": 120.5, "y": 80.2, "confidence": 0.91 }
  ],
  "confidence": 0.91
}
```

`x`/`y` are already in floor-plan coordinates (post-homography), matching
`server/map.json`'s coordinate space. The raw camera frame is never
transmitted — only this derived, anonymous JSON object.

## Digital Twin integration (UC_13)

The Digital Twin team should only ever see `anonymousPresences`, never
`loggedInUsers`. Two integration options, to be finalized separately:

1. Subscribe to the same Socket.IO server on a dedicated namespace/topic
   that emits only the `anonymousPresences` slice of `state:update`.
2. Poll `GET /api/presence` (to be added) for the latest anonymous state
   as a lighter-weight alternative to a persistent socket connection.

## In-memory state shape (`server/state.js`)

```js
loggedInUsers: Map<socketId, { username, avatarColor, location: { x, y } }>
anonymousPresences: Map<zone_id, latestSensorEvent>
```

Nothing here is written to disk or a database — restarting the server
clears all state.
