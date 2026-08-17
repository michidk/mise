# mise

A deliberately small, open-source screen sharing service. Create a room, send a link, and let several participants share at once—no accounts, downloads, or persisted room history.

[![mise landing page](.playwright/screenshots/mise.png)](https://miseshare.vercel.app)

Live demo: [miseshare.vercel.app](https://miseshare.vercel.app)

## Related project

If a direct connection fails, use [icecheck](https://github.com/michidk/icecheck) ([live tool](https://icecheck.vercel.app)) to isolate signaling, ICE candidate, data-channel, and media-path problems between two browsers.

WebRTC data channels carry lossless screen deltas directly between browsers. A small REST API stores temporary room admission and WebRTC signaling messages in PostgreSQL; it never receives screen, chat, or audio data.

The Node server and browser application are authored in strict TypeScript. The client build compiles `src/app.ts` to the browser bundle in `public/app.js`.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Screen capture works on `localhost`; a deployed instance must use HTTPS.

Without `DATABASE_URL`, local development uses an in-memory room store. The PostgreSQL schema is defined with Drizzle ORM in `src/room-api/internal/schema.ts`, with generated migrations tracked in `drizzle/`. To exercise the production data path, set a PostgreSQL connection string and apply the migrations first:

```bash
export DATABASE_URL='postgresql://...'
npm run db:migrate
npm run dev
```

After changing the schema, generate and validate a migration before applying it:

```bash
npm run db:generate
npm run db:check
npm run db:migrate
```

## Deploy to Vercel

Provision a Neon PostgreSQL database from the Vercel Marketplace, connect it to the project, and run the migration with the production `DATABASE_URL`. The repository exports its Express HTTP server for Vercel and keeps the local `npm start` entrypoint:

```bash
npx vercel@latest env pull .env.production.local --environment=production
set -a && source .env.production.local && set +a
npm run db:migrate
npx vercel@latest --prod
```

Vercel serves files in `public/` from its CDN and runs the room REST API as stateless Node Functions. Every invocation reads the same PostgreSQL room and signaling tables, so participants do not need to reach the same Function instance. `DATABASE_URL` is mandatory on Vercel; the server fails fast instead of silently creating instance-local rooms.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `HOST` | `0.0.0.0` | HTTP bind address |
| `BASE_PATH` | _(empty)_ | Optional URL prefix, such as `/previews/mise` |
| `MAX_PARTICIPANTS` | `12` | Deployment ceiling for total room participants, including the host (2–12) |
| `DATABASE_URL` | _(in-memory locally)_ | PostgreSQL connection string; required on Vercel |
| `STUN_URLS` | `stun:main.lohr.dev:3478,stun:stun.l.google.com:19302` | Comma-separated STUN URLs; the second default is a public fallback and non-STUN entries are ignored |

Browsers receive both defaults and may query them concurrently; WebRTC does not guarantee a strictly sequential failover order.

The app is intentionally STUN-only and does not configure a TURN relay. Connections that cannot establish a direct ICE path will fail instead of relaying media through a third party. A normal reverse proxy can terminate TLS and forward HTTP and WebSocket traffic to this app, but it does not relay WebRTC media.

## How it works

- The REST API creates a random room code, hashes optional room passwords with scrypt, and atomically enforces the host-selected participant limit.
- Room, participant, and signaling records are short-lived. Host heartbeats extend the room while the tab is open; stale participants and signaling messages expire automatically.
- Each browser receives an opaque participant token. The API hashes that token before storage and derives the signaling sender from the authenticated request rather than trusting client-provided identity.
- Browsers exchange SDP descriptions and ICE candidates through authenticated REST mailboxes. Once negotiation completes, native `RTCPeerConnection` data channels and audio tracks communicate directly.
- Every participant can publish independently, so several screens can be live at once. Each publisher opens direct, encrypted connections to the other room participants.
- The first media codec is `text-lossless-v1`: it captures native RGBA pixels, compares 128 px tiles exactly, DEFLATE-compresses only changed tiles, and sends a periodic repair keyframe every 15 seconds. Frames are split into 48 KiB messages; a dropped or invalid delta triggers an immediate keyframe request before rendering resumes.
- Stream audio is kept on a separate native WebRTC media track. Publishers can stop sending it without restarting the screen codec, and every receiver can mute each incoming stream independently.
- Codec settings and stream ownership are room metadata. Cards show the host, current codec settings, and audio state without coupling the UI to the encoder implementation.
- A host-coordinated activity log records joins, leaves, stream starts/stops, audio changes, and settings changes alongside chat. Only the latest 100 entries live in the host's browser memory.
- `src/room-api/index.ts` is the server boundary for room admission and signaling storage. Its Drizzle/PostgreSQL and in-memory implementations remain internal.
- `src/signaling/index.ts` is the browser boundary for REST room lifecycle, heartbeat, and signaling mailboxes.
- `src/rtc/index.ts` owns native WebRTC negotiation, fixed control/screen channels, MessagePack serialization, and audio transceivers.
- `src/media/index.ts` owns encoder, renderer, backpressure, and presentation cleanup. `src/room/index.ts` owns validated host/viewer messages and UI session state.
- There is no recording, analytics, account system, TURN relay, or backend media path.

The one-to-many peer layout is ideal for a small, simple tool. For large audiences, use an SFU instead of adding more host peer connections.

## License

MIT
