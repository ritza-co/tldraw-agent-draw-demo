# tldraw Agent Draw demo

Draw a rectangle on an infinite canvas, **speak** what you want, and an AI agent draws it
inside that region. Drag several rectangles in a row and they queue up, each drawn in turn.

This is built on [tldraw](https://tldraw.dev)'s official
[**Agent starter kit**](https://github.com/tldraw/agent-template) (MIT licensed), extended with a
speech-driven "capture a region and describe it" workflow.

![Agent draw demo](docs/demo.gif)
<!-- Replace docs/demo.gif with a real screen recording before publishing. -->

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
| `worker/routes/transcribe.ts` | Worker route that forwards audio to Mistral Voxtral. |
| `worker/prompt/sections/rules-section.ts` | The "Drawing inside a captured area" prompt rules. |

## Environment setup

This app has two backends behind the Cloudflare Worker: an LLM provider for the agent and a
speech-to-text provider for transcription.

Copy the example env file and fill in keys:

```bash
cp .dev.vars.example .dev.vars
```

Required out of the box:

- `MISTRAL_API_KEY` — speech-to-text ([Mistral](https://console.mistral.ai/)).
- `OPENROUTER_API_KEY` — the default agent model is an OpenRouter-hosted Gemini model
  ([OpenRouter](https://openrouter.ai/keys)).

Optional (only if you switch the model picker to a native provider):
`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `OPENAI_API_KEY`.

## Local development

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173/`), pick **Agent draw**, and drag a
rectangle.

## Model selection

The model is chosen in the chat panel's dropdown and defaults to `google/gemini-2.5-flash` (via
OpenRouter), set by `DEFAULT_MODEL_NAME` in `shared/models.ts`. This model reliably finishes a
complete in-bounds drawing in a single prompt.

Note: your selection is persisted to `localStorage` per agent, so once you pick a model in a
browser, that saved choice is restored on reload and overrides the code default. Clear the app's
`localStorage` if you change the default and want to see it.

## Deployment

The app is a Cloudflare Worker (serving the built client and the `/stream` + `/transcribe` routes).

```bash
npm run build
npx wrangler deploy
```

Set the production secrets with `npx wrangler secret put MISTRAL_API_KEY` (and `OPENROUTER_API_KEY`,
etc.) rather than committing `.dev.vars`.

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
