import { atom, BoxModel } from 'tldraw'
import { AreaRecorder } from '../speech/AreaRecorder'
import { transcribe } from '../speech/transcribe'
import { requestDrawInArea } from './requestDrawInArea'
import { reportPossibleQuotaError } from '../ui/quotaError'
import { getApiKey } from '../ui/apiKeys'
import { getAgentModelDefinition } from '../../shared/models'
import type { TldrawAgent } from '../agent/TldrawAgent'

export type CaptureStatus = 'recording' | 'queued' | 'transcribing' | 'drawing' | 'error'

export interface CaptureSessionState {
	id: string
	bounds: BoxModel
	status: CaptureStatus
	error?: string
}

// All live capture sessions, newest last. Multiple may exist at once: one may be
// recording while earlier ones are queued / transcribing / drawing. The overlay
// renders one dashed rectangle + status pill per entry. A session is removed once
// its drawing finishes (or the user dismisses an error).
const sessions = atom<CaptureSessionState[]>('captureSessions', [])

/** Reactive accessor for use inside tldraw `useValue`. */
export const captureSessions$ = sessions

export function getCaptureSessions(): CaptureSessionState[] {
	return sessions.get()
}

// The agent, injected by the React layer (SpeechToCanvasHook) once available, so
// the module-level processing worker can drive draws without a React context.
let agentRef: TldrawAgent | null = null
export function setCaptureAgent(agent: TldrawAgent): void {
	agentRef = agent
}

// The single in-progress recorder and the session id it belongs to. Only one
// session records at a time: starting a new capture stops the current one.
let recorder: AreaRecorder | null = null
let recordingId: string | null = null

// Finalized audio awaiting the processing worker, keyed by session id, plus the
// FIFO queue of ids ready to transcribe+draw and a single-consumer guard so only
// one session is transcribed+drawn at a time.
const pendingBlobs = new Map<string, Blob>()
const queue: string[] = []
let processing = false

let idCounter = 0
function nextId(): string {
	return `cap_${++idCounter}`
}

function getSession(id: string): CaptureSessionState | undefined {
	return sessions.get().find((s) => s.id === id)
}

function patchSession(id: string, patch: Partial<CaptureSessionState>): void {
	sessions.set(sessions.get().map((s) => (s.id === id ? { ...s, ...patch } : s)))
}

function removeSession(id: string): void {
	sessions.set(sessions.get().filter((s) => s.id !== id))
}

/**
 * Begin a new capture session with the given bounds and start recording. If a
 * prior session is still recording, its audio is ended first (as if Stop were
 * pressed) and it is queued for processing. Returns the new session id.
 */
export function startCaptureSession(bounds: BoxModel): string {
	// Drawing a new capture ends the audio input of the one still recording.
	if (recordingId) finalizeRecording(recordingId)

	const id = nextId()
	sessions.set([...sessions.get(), { id, bounds, status: 'recording' }])

	const rec = new AreaRecorder()
	recorder = rec
	recordingId = id
	rec.start().catch((err) => {
		console.error('[capture] mic start failed:', err)
		if (recordingId === id) {
			recorder = null
			recordingId = null
		}
		patchSession(id, { status: 'error', error: 'Microphone access failed.' })
	})
	return id
}

/**
 * End a session's recording (the Stop button, or auto-stop when a new capture
 * begins) and queue it for transcription + drawing. No-op if the session is not
 * currently recording. The new recording (if any) is unaffected: this only stops
 * the recorder bound to `id`.
 */
export function finalizeRecording(id: string): void {
	const session = getSession(id)
	if (!session || session.status !== 'recording') return

	const rec = recordingId === id ? recorder : null
	if (recordingId === id) {
		recorder = null
		recordingId = null
	}
	patchSession(id, { status: 'queued' })

	// Stop the recorder asynchronously, stash the clip, then enqueue. finalize is
	// called in session order and only the recording session is ever finalized, so
	// the queue stays FIFO.
	void (async () => {
		let blob: Blob | null = null
		try {
			blob = rec ? await rec.stop() : null
		} catch (err) {
			console.error('[capture] stop failed:', err)
		}
		if (blob && blob.size >= 1000) pendingBlobs.set(id, blob)
		queue.push(id)
		void processQueue()
	})()
}

/** Remove a session (e.g. dismissing an error). Drops any pending audio for it. */
export function dismissSession(id: string): void {
	pendingBlobs.delete(id)
	removeSession(id)
}

/**
 * Single-consumer worker: drain the queue one session at a time, transcribing
 * then drawing each. Serializing here is what makes a newer capture wait until
 * the agent finishes the previous one (the agent runs one request at a time).
 */
async function processQueue(): Promise<void> {
	if (processing) return
	processing = true
	try {
		while (queue.length > 0) {
			const id = queue.shift() as string
			const session = getSession(id)
			const blob = pendingBlobs.get(id)
			pendingBlobs.delete(id)
			if (!session) continue // dismissed before its turn

			if (!blob || blob.size < 1000) {
				patchSession(id, { status: 'error', error: 'No audio was recorded. Try again.' })
				continue
			}
			if (!agentRef) {
				patchSession(id, { status: 'error', error: 'Agent not ready. Try again.' })
				continue
			}

			patchSession(id, { status: 'transcribing' })
			let text = ''
			try {
				text = await transcribe(blob)
			} catch (err) {
				console.error('[capture] transcription failed:', err)
				reportPossibleQuotaError(err, 'Mistral')
				patchSession(id, { status: 'error', error: err instanceof Error ? err.message : String(err) })
				continue
			}
			if (!text) {
				patchSession(id, { status: 'error', error: 'Did not catch any speech. Try again.' })
				continue
			}
			const modelDef = getAgentModelDefinition(agentRef.modelName.getModelName())
			if (!getApiKey(modelDef.provider)) {
				patchSession(id, {
					status: 'error',
					error: `No ${modelDef.provider} API key set. Open "API keys" to add one.`,
				})
				continue
			}

			patchSession(id, { status: 'drawing' })
			let drawnShapes = 0
			try {
				drawnShapes = await requestDrawInArea(agentRef, text, session.bounds)
			} catch (err) {
				console.error('[capture] agent request failed:', err)
				reportPossibleQuotaError(err, 'OpenRouter')
				patchSession(id, { status: 'error', error: err instanceof Error ? err.message : String(err) })
				continue
			}

			// Done: clear the overlay for this session.
			removeSession(id)
		}
	} finally {
		processing = false
	}
}
