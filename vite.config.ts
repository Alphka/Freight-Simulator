import { defineConfig } from "vite"
import { fileURLToPath } from "node:url"
import browserslist from "browserslist"
import { browserslistToTargets } from "lightningcss"

const root = fileURLToPath(new URL("src", import.meta.url))
const outDir = fileURLToPath(new URL("dist", import.meta.url))

export default defineConfig({
	root,
	build: {
		outDir,
		emptyOutDir: true,
		sourcemap: true,
		rolldownOptions: {
			input: {
				index: fileURLToPath(new URL("src/index.html", import.meta.url)),
				fullfilled: fileURLToPath(new URL("src/fullfilled.html", import.meta.url))
			}
		}
	},
	css: {
		devSourcemap: true,
		lightningcss: {
			targets: browserslistToTargets(browserslist())
		},
		preprocessorOptions: {
			scss: {
				// * Bootstrap 5 still uses @import and global functions internally
				quietDeps: true,
				silenceDeprecations: ["import", "global-builtin", "color-functions", "if-function"]
			}
		}
	}
})
