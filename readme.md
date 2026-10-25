# My project

Smart human presence and digital twin

## What's done

- Node.js + Express + Socket.IO backend in `server/` (login, logout, sensor updates, in-memory state, `/api/map`)
- Python sensor service in `sensor/` (camera + YOLOv8n detection + homography, sends anonymous JSON events)
- API spec in `docs/api-spec.md`
- No frontend yet

## Running the server

```bash
# From the repo's root folder:
cd server
npm run dev
```

## Running with Docker

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/). No Node install needed.

```bash
# From the repo's root folder:
docker compose up --build
```

The server runs on http://localhost:3001 (check http://localhost:3001/api/map).
Stop it with `Ctrl+C`, or `docker compose down` if started with `-d`.

To restrict which site can call the API, set `CORS_ORIGIN` (defaults to `*`):

```bash
CORS_ORIGIN=http://localhost:3000 docker compose up --build
```

`server/map.json` is baked into the image, so rebuild after editing it.
