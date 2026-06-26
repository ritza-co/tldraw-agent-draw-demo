import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { zodLocalePlugin } from './scripts/vite-zod-locale-plugin.js'

// https://vitejs.dev/config/
// This build produces the static client bundle only (output: dist/). The backend
// is a plain Node server (see server/server.ts) instead of a Cloudflare Worker,
// so the @cloudflare/vite-plugin is intentionally absent on this branch.
export default defineConfig(() => {
	return {
		plugins: [
			zodLocalePlugin(fileURLToPath(new URL('./scripts/zod-locales-shim.js', import.meta.url))),
			react(),
		],
	}
})
