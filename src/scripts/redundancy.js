import CreateElement from "./helpers/CreateElement.js"

export default class Redundancy {
	/** @type {{ selector: string, callback: (element: Element) => any }[]} */
	#listeners = []
	#listenersEnded = false

	/** @type {Set<HTMLElement>} */
	#emitted = new Set

	/** @param {import("../typings/redundancy").Selectors} selectors */
	constructor(selectors){
		const { styles, scripts } = selectors

		this.selectors = selectors
		this.SetListener()

		if(styles) for(const [selector, path, options] of styles) this.InsertElement(selector, path, "style", options)
		if(scripts) for(const [selector, path, options] of scripts) this.InsertElement(selector, path, "script", options)

		this.#listenersEnded = true
	}
	/**
	 * @param {string} selector
	 * @param {string} path
	 * @param {"style" | "script"} type
	 * @param {import("../typings/redundancy").ReplaceElementOptions} [options]
	 */
	InsertElement(selector, path, type, options){
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

			console.log("Inserting element: %s (%s)", type, path)

			element.after(replace)
			element.remove()
		})
	}
	SetListener(){
		new MutationObserver((mutations, observer) => {
			for(const mutation of mutations){
				const elements = new Set(mutation.addedNodes).add(mutation.target)

				for(const element of elements){
					if(
						element instanceof HTMLScriptElement ||
						element instanceof HTMLLinkElement ||
						element instanceof HTMLStyleElement
					) this.#emit(element)
					else if(element instanceof HTMLHeadElement){
						const elements = [
							...document.querySelectorAll("script"),
							...document.querySelectorAll("style"),
							...document.querySelectorAll("link")
						]

						for(const element of elements) this.#emit(element)
					}
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
	/** @param {HTMLElement} element */
	#emit(element){
		if(this.#emitted.has(element)) return

		this.#emitted.add(element)

		/** @type {Set<number>} */
		const indexes = new Set

		this.#listeners.forEach(({ selector, callback }, index) => {
			if(element.matches(selector)){
				indexes.add(index)

				console.log("Setting event")

				element.addEventListener("error", () => {
					try{
						callback(element)
					}catch(error){
						console.error(error)
					}
				})
			}
		})

		for(const index of Array.from(indexes).reverse()) this.#listeners.splice(index, 1)
	}
}
