import type { ReplaceElementOptions, Selectors } from "../typings/redundancy"
import CreateElement from "./helpers/CreateElement.js"

export default class Redundancy {
	#listeners: { selector: string, callback: (element: Element) => any }[] = []
	#listenersEnded = false
	#emitted = new Set<HTMLElement>

	constructor(private selectors: Selectors){
		const { styles, scripts } = selectors

		this.selectors = selectors
		this.SetListener()

		if(styles) for(const [selector, path, options] of styles) this.InsertElement(selector, path, "style", options)
		if(scripts) for(const [selector, path, options] of scripts) this.InsertElement(selector, path, "script", options)

		this.#listenersEnded = true
	}
	InsertElement(selector: string, path: string, type: "style" | "script", options?: ReplaceElementOptions){
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
				const elements = new Set(mutation.addedNodes).add(mutation.target) as Set<HTMLElement>

				for(const element of elements){
					const tagName = element.tagName?.toLowerCase()

					switch(tagName){
						case "script":
						case "style":
						case "link":
							this.#emit(element)
						break
						case "head": {
							const elements = [
								...document.querySelectorAll("script"),
								...document.querySelectorAll("style"),
								...document.querySelectorAll("link")
							]

							for(const element of elements) this.#emit(element)
						}
						break
					}
				}
			}

			if(this.#listenersEnded && !this.#listeners.length) observer.disconnect()
		}).observe(document, {
			childList: true,
			subtree: true
		})
	}
	#on(selector: string, callback: (element: Element) => any){
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
	#emit(element: HTMLElement){
		if(this.#emitted.has(element)) return

		this.#emitted.add(element)

		const indexes: Set<number> = new Set

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
