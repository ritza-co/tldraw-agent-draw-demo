# Feedback tasks

Work is done in the `tldraw-agent-draw-demo/` repo. The `no-cloudflare` branch already
implemented several of these — ported and adapted as needed.

---

## 1. Hide the agent chat panel - DONE

Removed the `ChatPanel` and `ChatPanelFallback` from `App.tsx`. The `ErrorBoundary` wrapper
was removed with it. CSS layout changed from a two-column grid to a single full-screen div.

---

## 2. Agent Draw as the only visible toolbar item (preselected on load) - DONE

`CustomToolbar.tsx` now passes `maxItems={1}` to `DefaultToolbar`, which keeps Agent Draw as
the only visible item and collapses all others into the overflow/more menu automatically.
Agent Draw is placed first in the children list.

A `ToolPreselector` component rendered inside `<Tldraw>` calls
`editor.setCurrentTool('area-capture')` on mount to preselect it.

---

## 3. Bring-your-own API key panel - DONE

Added:
- `client/ui/apiKeys.ts` — localStorage helpers and header builder
- `client/components/ApiKeysPanel.tsx` — floating panel centered top of screen

The panel button and dropdown are positioned with `position: fixed` so they sit above the
tldraw canvas without layout conflicts. API key headers are sent on every `/stream` and
`/transcribe` request via `apiKeyHeaders()`.

Worker changes: `stream.ts` and `transcribe.ts` now read `x-<provider>-api-key` headers and
prefer them over env vars. `AgentDurableObject` creates a per-request `AgentService` with
the overridden keys.

---

## 4. Mistral support as an alternative provider - DONE

- Added `mistral-large-latest` and `mistral-small-latest` to `shared/models.ts`
- Added `MistralProvider` to `AgentService` (installed `@ai-sdk/mistral`)
- `getModel()` handles the `mistral` provider via `this.mistral(id)`
- Transcription already used Mistral; both drawing and voice now accept a user Mistral key

---

## 5. Fix color picker / API keys panel overlap - DONE

The API keys panel is positioned `fixed` at top-center of the viewport, outside the tldraw
canvas element. The tldraw color/style picker renders inside the canvas at the bottom-left,
so there is no overlap.
