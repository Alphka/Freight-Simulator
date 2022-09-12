import CreateElement from "./helpers/CreateElement.js"

export default class Redundancy {
	/** @type {{ selector: string, callback: (element: Element) => any }[]} */
	#listeners = []
	#listenersId = 0
	#listenersEnded = false

	/** @param {import("../typings/redundancy").Selectors} selectors */
	constructor(selectors){
		const { styles, scripts } = selectors

		this.selectors = selectors
		this.SetListener()

		if(styles) for(const [selector, path, options] of styles) this.ReplaceElement(selector, path, "style", options)
		if(scripts) for(const [selector, path, options] of scripts) this.ReplaceElement(selector, path, "script", options)

		this.#listenersEnded = true
	}
	/**
	 * @param {string} selector
	 * @param {string} path
	 * @param {"style" | "script"} type
	 * @param {import("../typings/redundancy").ReplaceElementOptions} [options]
	 */
	ReplaceElement(selector, path, type, options){
		this.#on(selector, element => {
			const replace = type === "style" ? CreateElement("link", {
				href: path,
				rel: "stylesheet",
				type: "text/css"
			}) : CreateElement("script", {
				src: path,
				async: options?.async ?? true,
				crossOrigin: "anonymous",
				referrerPolicy: "noreferrer"
			})

			element.after(replace)
			element.remove()
		})
	}
	SetListener(){
		const allowedNodeNames = [
			"link",
			"style",
			"script"
		]

		new MutationObserver((mutations, observer) => {
			for(const mutation of mutations){
				const elements = new Set(mutation.addedNodes).add(mutation.target)

				for(const element of elements){
					//// @ts-ignore
					// if(allowedNodeNames.includes(element.nodeName.toLowerCase()))

					if(
						element instanceof HTMLScriptElement ||
						element instanceof HTMLLinkElement ||
						element instanceof HTMLStyleElement
					) this.#emit(element)
				}
			}

			if(this.#listenersEnded && !this.#listeners.length) observer.disconnect()
		}).observe(document, {
			childList: true,
			subtree: true
		})
	}
	/**
	 * @param {string} selector
	 * @param {(element: Element) => any} callback
	 */
	#on(selector, callback){
		const element = document.querySelector(selector)

		if(element) element.addEventListener("error", () => {
			try{
				callback(element)
			}catch(error){
				console.error(error)
			}
		})
		else this.#listeners.push({ selector, callback })
	}
	/** @param {Element} element */
	#emit(element){
		this.#listeners.forEach(({ selector, callback }, index) => {
			if(element.matches(selector)){
				this.#listeners.splice(index, 1)

				element.addEventListener("error", () => {
					try{
						callback(element)
					}catch(error){
						console.error(error)
					}
				})
			}
		})
	}
}
