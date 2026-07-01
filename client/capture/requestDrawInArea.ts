import { BoxModel } from 'tldraw'
import type { TldrawAgent } from '../agent/TldrawAgent'

/**
 * Marker phrase (kept in sync with the "Drawing inside a captured area" prompt
 * section in worker/prompt/sections/rules-section.ts) that tells the model this
 * is a captured-area request and how to treat the spoken text.
 */
function buildAreaMessage(text: string): string {
	return (
		`CAPTURED AREA REQUEST. The user selected a rectangular region on the canvas and spoke the request below. ` +
		`Fill that region with an appropriate drawing (an area context item gives the exact bounds).\n\n` +
		`Choose the visual form that best fits the request and immediately emit create/pen actions — do not ask for clarification, do not stop to think without drawing:\n` +
		`- A specific named shape (e.g. "draw a red circle", "a star"): draw exactly that.\n` +
		`- A single object or illustration: draw it well, not a multi-box diagram.\n` +
		`- A definition or explanation: draw a labelled diagram with keyword labels, not the spoken sentence as a block of text.\n` +
		`- A diagram or process: labelled nodes with arrows.\n` +
		`- A chart: for quantitative or comparative content.\n` +
		`If the request is ambiguous, make your best interpretation and draw it anyway. Never stall — always emit at least one shape.\n\n` +
		`Build the COMPLETE result inside the selected region.\n\n` +
		`Spoken request: "${text}"`
	)
}

/** Switch the agent to `mode` only if it isn't already there. `setMode` throws
 * if asked to re-enter the current mode (AgentModeManager.setMode). */
function ensureMode(agent: TldrawAgent, mode: 'working' | 'idling'): void {
	if (agent.mode.getCurrentModeType() !== mode) {
		agent.mode.setMode(mode)
	}
}

/**
 * Ask the agent to draw `text` inside `bounds`, driving it to a complete result.
 *
 * Uses the full agentic `agent.prompt` loop, NOT the single-turn `agent.request`.
 * `prompt` keeps taking turns on its own until the model has nothing more to add
 * (see TldrawAgent.prompt), so the model finishes the whole drawing in one call.
 * This was confirmed empirically with google/gemini-2.5-flash: a single prompt
 * produces a complete, in-bounds result, so the previous hand-rolled
 * continue-loop + linter passes (which compensated for a weaker model on the
 * single-turn path) are no longer needed.
 *
 * `agent.prompt` drives its own mode (working while running, back to idling when
 * done), so we only nudge the mode when it isn't already where we want it. Always
 * calling setMode would throw "Agent is already in mode: ..." (it rejects
 * re-entering the current mode).
 */
/**
 * Ask the agent to draw `text` inside `bounds`. Returns the net number of shapes
 * added to the page.
 */
export async function requestDrawInArea(
	agent: TldrawAgent,
	text: string,
	bounds: BoxModel
): Promise<number> {
	const area = { type: 'area' as const, bounds, source: 'user' as const }
	ensureMode(agent, 'working')
	const before = agent.editor.getCurrentPageShapeIds().size
	try {
		await agent.prompt({ message: buildAreaMessage(text), contextItems: [area] })
		return agent.editor.getCurrentPageShapeIds().size - before
	} catch (err) {
		throw err
	} finally {
		ensureMode(agent, 'idling')
	}
}
