/**
 * A minimal single-clip audio recorder for the area-capture demo. No agent or
 * transcription coupling: start() opens the mic and begins recording, stop()
 * ends it and resolves with the recorded Blob. One clip per instance.
 */
export class AreaRecorder {
	private stream: MediaStream | null = null
	private recorder: MediaRecorder | null = null
	private chunks: BlobPart[] = []
	private mimeType: string | undefined

	/** Open the mic and start recording. Rejects if mic permission is denied. */
	async start(): Promise<void> {
		if (this.recorder) return
		this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })

		if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
			this.mimeType = 'audio/webm;codecs=opus'
		} else if (MediaRecorder.isTypeSupported('audio/webm')) {
			this.mimeType = 'audio/webm'
		}

		const recorder = new MediaRecorder(this.stream, { mimeType: this.mimeType })
		this.chunks = []
		recorder.ondataavailable = (event) => {
			if (event.data.size > 0) this.chunks.push(event.data)
		}
		recorder.start()
		this.recorder = recorder
	}

	/** Stop recording, release the mic, and resolve with the recorded clip. */
	async stop(): Promise<Blob> {
		const recorder = this.recorder
		this.recorder = null
		if (!recorder) return new Blob([], { type: this.mimeType || 'audio/webm' })

		await new Promise<void>((resolve) => {
			recorder.onstop = () => resolve()
			recorder.stop()
		})

		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop())
			this.stream = null
		}

		const blob = new Blob(this.chunks, { type: this.mimeType || 'audio/webm' })
		return blob
	}

	/** Abort recording and release the mic without producing a usable clip. */
	cancel(): void {
		if (this.recorder) {
			try {
				this.recorder.stop()
			} catch {
				// ignore
			}
			this.recorder = null
		}
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop())
			this.stream = null
		}
		this.chunks = []
	}
}
