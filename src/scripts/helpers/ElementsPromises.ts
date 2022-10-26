import type { ElementsTagNames } from "../../typings/index"

type MissingObject = {
	[name in ElementsTagNames]: Promise<void>
} & {
	missing: Map<ElementsTagNames, () => void>
	AddMissing(name: ElementsTagNames): void
}

const ElementsPromises = (() => {
	const object: MissingObject = {
		body: Promise.resolve(),
		head: Promise.resolve(),
		bodyLoaded: Promise.resolve(),
		missing: new Map<ElementsTagNames, () => void>(),
		AddMissing(name: ElementsTagNames){
			let resolve: (value?: any) => void

			this[name] = new Promise(res => resolve = res)

			this.missing.set(name, () => {
				this.missing.delete(name)
				resolve()
			})
		}
	}

	if(!document.head) object.AddMissing("head")
	if(!document.body) object.AddMissing("body")

	if(document.readyState === "loading"){
		object.AddMissing("bodyLoaded")

		function Callback(){
			if(document.readyState === "loading") return

			if(object.missing.has("bodyLoaded")) object.missing.get("bodyLoaded")!()

			document.removeEventListener("DOMContentLoaded", Callback)
			document.removeEventListener("readystatechange", Callback)
		}

		document.addEventListener("DOMContentLoaded", Callback)
		document.addEventListener("readystatechange", Callback)
	}

	new MutationObserver((mutations, observer) => {
		for(const mutation of mutations){
			const elements = new Set(mutation.addedNodes).add(mutation.target)

			for(const element of elements){
				const tagName = (element as Element).tagName?.toLowerCase()

				switch(tagName){
					case "head":
					case "body":
						if(object.missing.has(tagName)) object.missing.get(tagName)!()
					break
				}
			}

			if(!object.missing.size){
				observer.disconnect()
				break
			}
		}
	}).observe(document, {
		childList: true,
		subtree: true
	})

	return object
})()

export default ElementsPromises
