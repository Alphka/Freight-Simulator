const { task, src, dest, series, parallel, watch } = require("gulp")
const { join, dirname } = require("path")
const { globSync } = require("glob")
const uglify = require("gulp-uglify")
const sass = require("gulp-sass")(require("sass"))
const ts = require("gulp-typescript")

const cwd = join(__dirname, "src")
const build = join(__dirname, "build")

/** @param {NodeJS.EventEmitter} stream */
function finished(stream){
	return new Promise((resolve, reject) => {
		stream.once("error", reject)
		stream.once("finish", resolve)
		stream.once("end", resolve)
	})
}

function pages(){
	return src("pages/**", { cwd }).pipe(dest(build))
}

function publicFiles(){
	return src("public/**", { cwd, encoding: false }).pipe(dest("public", { cwd: build }))
}

function scripts(){
	const configs = globSync("**/tsconfig.json", { cwd, posix: true })
	const directories = configs.map(dirname)

	return Promise.all(configs.map(config => {
		const directory = dirname(config)

		/** Files of a nested tsconfig.json are compiled by its own project */
		const nested = directories.filter(other => other !== directory && (directory === "." || other.startsWith(directory + "/")))

		const tsResult = src("**/*.ts", {
			cwd: join(cwd, directory),
			ignore: nested.map(other => (directory === "." ? other : other.slice(directory.length + 1)) + "/**")
		}).pipe(ts.createProject(join(cwd, config), { declaration: true })())

		const output = join(build, directory)

		/** @type {Error | undefined} */
		let compileError

		// gulp-typescript still emits the files, so the error is only reported once everything is written
		tsResult.once("error", error => compileError = error)

		return Promise.all([
			finished(tsResult.js.pipe(uglify()).pipe(dest(output))),
			finished(tsResult.dts.pipe(dest(output)))
		]).then(() => {
			if(compileError) throw new Error(`TypeScript compilation failed (${join("src", config)})`)
		})
	}))
}

function styles(){
	return src("styles/*.scss", { cwd })
		.pipe(sass.sync({ style: "compressed" }).on("error", sass.logError))
		.pipe(dest("styles", { cwd: build }))
}

task("build", parallel(pages, publicFiles, scripts, styles))

task("watch", series("build", function watching(){
	watch("pages/**", { cwd }, pages)
	watch("public/**", { cwd }, publicFiles)
	watch("scripts/**", { cwd }, scripts)
	watch("styles/**", { cwd }, styles)
}))
