const ElementsPromises = (() => {
	const object = /** @type {{
		[name in import("../../typings/index").ElementsTagNames]: Promise<void>
	} & {
		missing: Map<import("../../typings/index").ElementsTagNames, () => void>
		AddMissing: (name: import("../../typings/index").ElementsTagNames) => void
	}} */ ({
		missing: new Map,
		AddMissing(name){
			/** @type {(value?: any) => void} */
			let resolve

			this[name] = new Promise(res => resolve = res)

			this.missing.set(name, () => {
				this.missing.delete(name)
				resolve()
			})
		}
	})

	if(document.head) object.head = Promise.resolve()
	else object.AddMissing("head")

	if(document.body) object.body = Promise.resolve()
	else object.AddMissing("body")

	if(document.readyState !== "loading") object.bodyLoaded = Promise.resolve()
	else object.AddMissing("bodyLoaded")

	;(function ReadyStateListener(){
		function Callback(){
			if(document.readyState === "loading") return

			if(object.missing.has("bodyLoaded")) object.missing.get("bodyLoaded")()

			document.removeEventListener("DOMContentLoaded", Callback)
			document.removeEventListener("readystatechange", Callback)
		}

		document.addEventListener("DOMContentLoaded", Callback)
		document.addEventListener("readystatechange", Callback)
	})()

	new MutationObserver((mutations, observer) => {
		for(const mutation of mutations){
			const elements = new Set(mutation.addedNodes).add(mutation.target)

			for(const element of elements){
				if(object.missing.has("head") && element instanceof HTMLHeadElement){
					object.missing.get("head")()
				}

				if(object.missing.has("body") && element instanceof HTMLBodyElement){
					object.missing.get("body")()
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
