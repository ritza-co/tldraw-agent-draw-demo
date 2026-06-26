# tldraw Agent Draw demo

Draw a rectangle on an infinite canvas, **speak** what you want, and an AI agent draws it
inside that region. Drag several rectangles in a row and they queue up, each drawn in turn.

This is built on [tldraw](https://tldraw.dev)'s official
[**Agent starter kit**](https://github.com/tldraw/agent-template) (MIT licensed), extended with a
speech-driven "capture a region and describe it" workflow.

[![Agent Draw demo](https://img.youtube.com/vi/livloOnVpC8/maxresdefault.jpg)](https://youtu.be/livloOnVpC8)

## What it does

The tldraw Agent starter kit already gives you an agentic canvas: you type a prompt and an LLM
issues actions that create and arrange real tldraw shapes. This demo adds a different way in:

1. Pick the **Agent draw** tool in the toolbar (keyboard `a`).
2. Drag a rectangle to mark a region. Recording starts immediately; the region shows a dashed
   outline and a **Stop** button.
3. Speak your request ("a flowchart for user login", "what is a neuron", "today I'll cover what
   an LLM is, its pros and cons, and its uses").
4. Click **Stop** (or just drag another rectangle, which auto-stops the previous recording and
   queues it). Your speech is transcribed and the agent draws a complete result **inside** the
   rectangle.

Because the agent runs one request at a time, multiple captures are processed through a serialized
queue: a newer capture waits until the earlier one's drawing is finished. Each region's pill shows
its status: `Recording` → `Queued` → `Transcribing` → `Drawing`.

The agent assesses each request and picks the visual form that fits, a named drawing, a single
illustration, a diagram, a chart, or literal text, rather than dumping the transcript as a wall of
text.

## How it works

```
Agent draw tool (drag)  ──▶  capture session + mic recording
        │                          │
        ▼                          ▼  (Stop / next capture)
  dashed-outline overlay     FIFO queue, one at a time
                                   │
                                   ├─▶ POST /transcribe  ──▶  Mistral Voxtral  ──▶  text
                                   │
                                   └─▶ agent.prompt("CAPTURED AREA REQUEST…", area bounds)
                                              │
                                              ▼
                                   agent draws shapes inside the region
```

Key pieces (everything new lives alongside the unchanged starter-kit code):

| Path | Role |
|------|------|
| `client/tools/AreaCaptureTool.tsx` | The drag-to-capture tool (a tldraw `StateNode`). |
| `client/capture/captureSession.ts` | Capture state, the recorder, and the serialized transcribe-then-draw queue. |
| `client/capture/requestDrawInArea.ts` | Sends the captured-area request through the full `agent.prompt` loop so the drawing finishes in one turn. |
| `client/speech/AreaRecorder.ts` | Minimal one-clip mic recorder. |
| `client/components/AreaCaptureOverlay.tsx` | Dashed rectangle + status pill per capture. |
| `server/server.ts` | Node backend serving the static client plus the `/transcribe` (Mistral Voxtral) and `/stream` (agent SSE) routes. |
| `worker/prompt/sections/rules-section.ts` | The "Drawing inside a captured area" prompt rules. |

## Environment setup

> This branch (`no-cloudflare`) runs the backend as a plain Node server instead of a Cloudflare
> Worker, so it can be self-hosted on any VPS. See [Deployment](#deployment).

The backend needs two things: an LLM provider for the agent and a speech-to-text provider for
transcription. The public tldraw license key lives in `.env` (inlined into the client bundle at
build time).

```bash
cp .env.example .env                  # public VITE_TLDRAW_LICENSE_KEY
cp .env.server.example .env.server    # optional server-side fallback keys
```

### Bring your own key

Provider keys are bring-your-own. The UI has an "API keys" panel (top-right) where a visitor
pastes their own keys; they are stored only in that browser's `localStorage` and sent as
`x-<provider>-api-key` request headers. The server uses them for that one request and never stores
or logs them — so a public deployment has no shared key for visitors to run up costs against.

- `anthropic` — the default agent model is `claude-sonnet-4-5`
  ([Anthropic](https://console.anthropic.com/)).
- `mistral` — speech-to-text ([Mistral](https://console.mistral.ai/)).
- `openai`, `google`, `openrouter` — only if you switch the model picker to that provider.

Setting any of these in `.env.server` makes it a server-side fallback used when a request carries
no header. For a shared-cost-free public demo, leave `.env.server` blank.

## Local development

The client (Vite) and the Node backend run as two processes. The Vite dev server proxies nothing,
so point the client at the backend by running both and opening the backend's URL, or simply build
once and run the server:

```bash
npm install
npm run build                              # client → dist/
node --env-file=.env.server node_modules/.bin/tsx server/server.ts
```

Open `http://localhost:3003/`, pick **Agent draw**, and drag a rectangle. For pure front-end
iteration, `npm run dev` serves the client alone (the `/stream` and `/transcribe` calls need the
Node server running on the same origin).

## Model selection

The model is chosen in the chat panel's dropdown and defaults to `claude-sonnet-4-5` (Anthropic),
set by `DEFAULT_MODEL_NAME` in `shared/models.ts`. Each provider in the dropdown needs its
corresponding key in `.env.server`; selecting a model whose key is unset will error.

Note: your selection is persisted to `localStorage` per agent, so once you pick a model in a
browser, that saved choice is restored on reload and overrides the code default. Clear the app's
`localStorage` if you change the default and want to see it.

## Deployment

This branch ships a self-hosted Node backend (`server/server.ts`) — no Cloudflare account, Worker,
or Durable Object required. The server serves the built client from `dist/` and handles the
`/stream` and `/transcribe` routes. Put any reverse proxy in front for TLS.

```bash
# On the server:
npm ci
VITE_TLDRAW_LICENSE_KEY=<your-key> npm run build   # client → dist/ (key inlined here)
npm start                                          # tsx server/server.ts, reads .env.server
```

The build inlines `VITE_TLDRAW_LICENSE_KEY`, so it must be present at build time (export it or put
it in `.env`). The runtime provider secrets are read from `.env.server` at start. Example systemd
unit + Caddy reverse proxy:

```ini
# /etc/systemd/system/tldraw-agent.service
[Service]
WorkingDirectory=/root/tldraw-agent-draw-demo
EnvironmentFile=/root/tldraw-agent-draw-demo/.env.server
ExecStart=/root/.nvm/versions/node/v20.20.2/bin/node node_modules/.bin/tsx server/server.ts
Restart=on-failure
```

```caddy
tldraw-agent.example.com {
    reverse_proxy localhost:3003
}
```

Caddy proxies SSE fine out of the box. (If you ever see buffered streaming, add `flush_interval -1`
to the `reverse_proxy` block.)

**tldraw license for production.** The tldraw SDK is free in development but requires a license key
for any public deployment (see Credits and license below). Get one from
[tldraw.dev/pricing](https://tldraw.dev/pricing), a free 100-day trial, a free hobby license (shows
a "made with tldraw" watermark), or a commercial license. The app reads it from
`VITE_TLDRAW_LICENSE_KEY` (see `.env.example`) and passes it to the `Tldraw` component's
`licenseKey` prop in `client/App.tsx`. The key is inlined into the client bundle at build time
(expected for tldraw keys), so keep it in the gitignored `.env`, not in source.

## Credits and license

Built on tldraw's [Agent starter kit](https://github.com/tldraw/agent-template), © tldraw Inc.,
[MIT licensed](https://github.com/tldraw/agent-template/blob/main/LICENSE.md). The area-capture
"Agent draw" additions are © Ritza. This repository's source is MIT licensed, see
[LICENSE.md](./LICENSE.md).

The `tldraw` **SDK dependency** itself is **not** MIT, it is distributed under the proprietary
[tldraw license](https://github.com/tldraw/tldraw/blob/main/LICENSE.md). You can develop with it for
free, but a public production deployment needs a tldraw license key (free 100-day trial, free hobby
license with a "made with tldraw" watermark, or a commercial license). See
[tldraw.dev/pricing](https://tldraw.dev/pricing). The MIT license on this repo covers its own source
code, not the tldraw SDK.
