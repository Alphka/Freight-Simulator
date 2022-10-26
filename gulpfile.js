const { task, src, dest, series, watch } = require("gulp")
const { join, dirname, relative, sep } = require("path")
const uglify = require("gulp-uglify")
const ts = require("gulp-typescript")
const merge = require("merge2")
const glob = require("glob")
const sass = require("gulp-sass")(require("sass"))

const cwd = join(__dirname, "src")
const build = join(__dirname, "build")

function pages(){
	return src("pages/**", { cwd }).pipe(dest(build))
}

function public(){
	return src("public/**", { cwd }).pipe(dest("public", { cwd: build }))
}

function scripts(){
	const configs = glob
		.sync("**/tsconfig.json", { cwd })
		.sort(path => path.lastIndexOf("/") * -1)

	/** @type {ReadWriteStream[]} */
	const streams = []

	for(const config of configs){
		const _configs = new Set(configs.filter(path => !relative(config, path).startsWith(`..${sep}..`)))
		const absolute = join(cwd, config)
		const directory = dirname(config)
		const output = join(build, directory)

		_configs.delete(config)

		const tsResult = src("**/*.ts", {
			cwd: dirname(absolute),
			ignore: Array.from(_configs).map(path => dirname(path) + "/**")
		}).pipe(ts.createProject(absolute, { declaration: true })())

		streams.push(merge([
			tsResult.js.pipe(uglify()).pipe(dest(output)),
			tsResult.dts.pipe(dest(output))
		]))
	}

	return merge(streams)
}

function styles(){
	return src("styles/*.scss", { cwd })
		.pipe(sass.sync({ outputStyle: "compressed" }).on("error", sass.logError))
		.pipe(dest("styles", { cwd: build }))
}

task("build", () => merge([
	pages(),
	public(),
	scripts(),
	styles()
]))

task("watch", series("build", function watching(){
	watch("pages/**", { cwd }, pages)
	watch("public/**", { cwd }, public)
	watch("scripts/**", { cwd }, scripts)
	watch("styles/**", { cwd }, styles)
}))
