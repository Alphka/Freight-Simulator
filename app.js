const { join, extname, resolve, sep, isAbsolute, relative, dirname } = require("path")
const { createServer } = require("http")
const { existsSync } = require("fs")
const { readFile, stat } = require("fs/promises")
const express = require("express")
const app = express()
const server = createServer(app)

const sepRegex = new RegExp("\\" +sep, "g")
const port = process.env.PORT || 3000
const src = join(__dirname, "src")
const pages = join(src, "pages")
const isDevelopment = process.env.NODE_ENV?.trim() === "development"

if(isDevelopment){
	console.log("Development mode")

	app.locals.pretty = true

	const livereload = require("livereload")
	const liveReloadServer = livereload.createServer()
	const connectLivereload = require("connect-livereload")

	liveReloadServer.watch([
		join(src, "pages"),
		join(src, "scripts"),
		join(src, "styles")
	])

	liveReloadServer.server.once("connection", () => {
		setTimeout(() => liveReloadServer.refresh("/"), 100)
	})

	app.use(connectLivereload())
}

/**
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @param {string} path
 */
const sendFile = async (request, response, path) => {
	let html = await readFile(path, "utf8")

	for(const match of html.matchAll(/(?<=(?:href|src|content)=")[-?./@+:\w]+(?=")/gi)){
		if(/^(?:https?:)\/\//i.test(match)) continue

		const srcAttribute = match[0]
		const srcPath = resolve(dirname(path), srcAttribute)
		const srcAbsolute = isAbsolute(srcPath) ? srcPath : resolve(process.cwd(), srcPath)
		const relativePath = relative(src, srcAbsolute)

		html = html.replace(srcAttribute, relativePath.replace(sepRegex, "/"))
	}

	const canonical = "<!-- canonical -->"
	const action = /(?<=action=")([-+/\w]+)\.html(?=")/gi

	if(html.includes(canonical)){
		try{
			const url = new URL(request.url, `${request.protocol}://${request.hostname}`)
			const meta = `<meta property="og:url" content="${url.origin + url.pathname}">`
			html = html.replace(canonical, meta)
		}catch(error){
			// console.error(error)
		}
	}

	if(action.test(html)) html = html.replace(action, "/$1")

	const buffer = Buffer.from(html)

	response.setHeader("Content-Type", "text/html; charset=utf-8")
	response.setHeader("Content-Length", buffer.byteLength)

	if(isDevelopment){
		response.setHeader("Cache-Control", "no-store")
		response.sendDate = false
	}else{
		response.setHeader("Cache-Control", "public; max-age=3600")
		response.setHeader("Last-Modified", (await stat(indexPath)).mtime.toUTCString())
	}

	response.send(buffer)
}

app.disable("x-powered-by")

const indexPath = join(pages, "index.html")

app.get(["/", "/index.html"], (request, response) => {
	sendFile(request, response, indexPath)
})

app.get("/:page", (request, response, next) => {
	const page = decodeURIComponent(request.params.page)
	const extensions = [".html", ".htm"]

	for(const extension of extensions){
		let path = join(pages, page)
		if(!extname(path)) path += extension
		if(existsSync(path)) return sendFile(request, response, path)
	}

	next()
})

app.get(["/pages", "/pages/:page"], (request, response) => {
	response.sendStatus(404)
})

app.use(express.static(src, {
	acceptRanges: false,
	redirect: false,
	lastModified: !isDevelopment,
	cacheControl: !isDevelopment,
	etag: !isDevelopment,
	dotfiles: "deny",
	extensions: [".js", ".css", ".ts"],
	setHeaders: response => response.setHeader("Cache-Control", isDevelopment ? "no-store" : "public; max-age=3600"),
}))

app.get("*", (request, response, next) => {
	next(404)
})

app.use((error, request, response, next) => {
	if(!response.headersSent){
		if(error){
			if(typeof error === "number") return response.sendStatus(error)
			console.error(error)
		}

		response.sendStatus(500)
	}
})

server.listen(port, () => {
	console.log("Listening on port %d", port)
	console.log("Local: http://localhost:%d", port)
})
