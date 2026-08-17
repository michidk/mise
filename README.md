# mise

A deliberately small, open-source screen sharing service. Create a room, send a link, and let several participants share at once—no accounts, downloads, or persisted room history.

[![mise landing page](.playwright/screenshots/mise.png)](https://miseshare.vercel.app)

Live demo: [miseshare.vercel.app](https://miseshare.vercel.app)

## Related project

If a direct connection fails, use [icecheck](https://github.com/michidk/icecheck) ([live tool](https://icecheck.vercel.app)) to isolate signaling, ICE candidate, data-channel, and media-path problems between two browsers.

WebRTC data channels carry lossless screen deltas directly between browsers. An embedded, self-hosted PeerServer only brokers the initial connections.

The Node server and browser application are authored in strict TypeScript. The client build compiles `src/app.ts` to the browser bundle in `public/app.js`.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Screen capture works on `localhost`; a deployed instance must use HTTPS.

## Deploy to Vercel

The repository exports its Node HTTP server for Vercel and keeps the local `npm start` entrypoint. With the authenticated Vercel CLI:

```bash
npx vercel@latest --prod
```

Vercel serves files in `public/` from its CDN and runs the embedded PeerServer as a Node Function. WebSocket support on Vercel is currently Public Beta. Existing sockets stay on one Function instance, but a later connection is not guaranteed to reach that same instance. This in-memory PeerServer layout is suitable for a small deployment; reliable horizontal scaling requires an external signaling service or shared cross-instance signaling layer.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `HOST` | `0.0.0.0` | HTTP bind address |
| `BASE_PATH` | _(empty)_ | Optional URL prefix, such as `/previews/mise` |
| `MAX_VIEWERS` | `5` | Maximum viewers per room |
| `STUN_URLS` | `stun:main.lohr.dev:3478,stun:stun.l.google.com:19302` | Comma-separated STUN URLs; the second default is a public fallback and non-STUN entries are ignored |

Browsers receive both defaults and may query them concurrently; WebRTC does not guarantee a strictly sequential failover order.

The app is intentionally STUN-only and does not configure a TURN relay. Connections that cannot establish a direct ICE path will fail instead of relaying media through a third party. A normal reverse proxy can terminate TLS and forward HTTP and WebSocket traffic to this app, but it does not relay WebRTC media.

## How it works

- A room code is the creator's temporary PeerJS ID. The room remains open when sharing stops and closes only when the host leaves or presses **Close room**.
- Every participant can publish independently, so several screens can be live at once. Each publisher opens direct, encrypted connections to the other room participants.
- Rooms remain link-open, but the host issues an ephemeral media credential only after admitting a participant. Text and audio connections must match both the admitted PeerJS ID and that credential, so direct connections cannot bypass the room limit.
- The first media codec is `text-lossless-v1`: it captures native RGBA pixels, compares 128 px tiles exactly, DEFLATE-compresses only changed tiles, and sends a periodic repair keyframe every 15 seconds. Frames are split into 48 KiB messages; a dropped or invalid delta triggers an immediate keyframe request before rendering resumes.
- Stream audio is kept on a separate native WebRTC media track. Publishers can stop sending it without restarting the screen codec, and every receiver can mute each incoming stream independently.
- Codec settings and stream ownership are room metadata. Cards show the host, current codec settings, and audio state without coupling the UI to the encoder implementation.
- A host-coordinated activity log records joins, leaves, stream starts/stops, audio changes, and settings changes alongside chat. Only the latest 100 entries live in the host's browser memory.
- `src/media/index.ts` exposes the media boundary and owns encoder, renderer, transport, backpressure, and presentation cleanup. `src/room/index.ts` exposes validated directional messages and the room state machine. A later 1080p60 WebCodecs pipeline can implement the same room-facing lifecycle while reusing signaling, cards, controls, and activity events.
- Self-hosted [PeerJS](https://peerjs.com/) handles signaling and connection negotiation. PeerServer never receives screen media.
- There is no recording, analytics, database, or authentication.

The one-to-many peer layout is ideal for a small, simple tool. For large audiences, use an SFU instead of adding more host peer connections.

## License

MIT
