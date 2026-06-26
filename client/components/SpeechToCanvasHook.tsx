import { useEffect } from 'react'
import { useAgent } from '../agent/TldrawAgentAppProvider'
import { transcribe } from '../speech/transcribe'
import { requestDrawInArea } from '../capture/requestDrawInArea'
import { setCaptureAgent } from '../capture/captureSession'

declare global {
	interface Window {
		speechToCanvas?: {
			getShapeCount: () => number
			runAreaCaptureDemo: (bounds: { x: number; y: number; w: number; h: number }) => Promise<{ transcript: string; error?: string }>
			runAreaDraw: (text: string, bounds: { x: number; y: number; w: number; h: number }) => Promise<{ drawn: number; error?: string }>
			getAllShapesBounds: () => { x: number; y: number; w: number; h: number } | null
		}
	}
}

/**
 * Headless component that registers the window.speechToCanvas automation hook
 * used by the area-capture end-to-end test. It renders nothing. The hook drives
 * the same captured-area pipeline as the real UI (transcribe sample audio, then
 * draw inside the given bounds) so the test can run it without the mic.
 */
export function SpeechToCanvasHook() {
	const agent = useAgent()

	// Hand the agent to the capture worker so it can drive draws outside React.
	useEffect(() => {
		setCaptureAgent(agent)
	}, [agent])

	useEffect(() => {
		/**
		 * Area capture demo: transcribe sample audio and request drawing within bounds.
		 * Clears the canvas first to ensure a clean state, then runs the agent to draw
		 * the transcribed content within the specified area bounds.
		 */
		const runAreaCaptureDemo = async (bounds: { x: number; y: number; w: number; h: number }) => {
			try {
				// Clear the canvas first to ensure clean state
				const allShapes = agent.editor.getCurrentPageShapes()
				if (allShapes.length > 0) {
					agent.editor.deleteShapes(allShapes)
				}

				// Fetch sample audio from the dev server
				const res = await fetch('/audio/chunk00.mp3')
				const blob = await res.blob()

				// Transcribe the audio
				let transcript = ''
				try {
					transcript = await transcribe(blob)
				} catch (err) {
					return {
						transcript: '',
						error: `Transcription failed: ${err instanceof Error ? err.message : String(err)}`,
					}
				}

				// Check for empty transcript
				if (!transcript) {
					return {
						transcript: '',
						error: 'empty transcript',
					}
				}

				// Make the agent draw within the specified bounds
				try {
					await requestDrawInArea(agent, transcript, bounds)
				} catch (err) {
					return {
						transcript,
						error: `Agent request failed: ${err instanceof Error ? err.message : String(err)}`,
					}
				}

				return { transcript }
			} catch (err) {
				return {
					transcript: '',
					error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
				}
			}
		}

		/**
		 * Get the bounding box of all shapes on the current page.
		 */
		const getAllShapesBounds = () => {
			const shapes = agent.editor.getCurrentPageShapes()
			if (shapes.length === 0) {
				return null
			}

			// Compute union of all shape bounds
			let minX = Infinity
			let minY = Infinity
			let maxX = -Infinity
			let maxY = -Infinity

			for (const shape of shapes) {
				const shapeBounds = agent.editor.getShapePageBounds(shape)
				if (shapeBounds) {
					minX = Math.min(minX, shapeBounds.x)
					minY = Math.min(minY, shapeBounds.y)
					maxX = Math.max(maxX, shapeBounds.x + shapeBounds.w)
					maxY = Math.max(maxY, shapeBounds.y + shapeBounds.h)
				}
			}

			if (minX === Infinity || minY === Infinity) {
				return null
			}

			return {
				x: minX,
				y: minY,
				w: maxX - minX,
				h: maxY - minY,
			}
		}

		// Text-driven variant of the area capture (skips the mic + transcription),
		// so the exact draw-inside-bounds path can be exercised from automation.
		const runAreaDraw = async (text: string, bounds: { x: number; y: number; w: number; h: number }) => {
			try {
				const drawn = await requestDrawInArea(agent, text, bounds)
				return { drawn }
			} catch (err) {
				return { drawn: 0, error: err instanceof Error ? err.message : String(err) }
			}
		}

		window.speechToCanvas = {
			getShapeCount: () => agent.editor.getCurrentPageShapes().length,
			runAreaCaptureDemo,
			runAreaDraw,
			getAllShapesBounds,
		}

		return () => {
			delete window.speechToCanvas
		}
	}, [agent])

	return null
}
