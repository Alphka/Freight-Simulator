export interface CreateElementOptions {
	[attribute: string]: unknown
	children?: Node[]
}

/** Creates an element, setting each option as a property when it exists on the element, otherwise as an attribute */
function createElement<T extends keyof HTMLElementTagNameMap>(tagName: T, { children, ...attributes }: CreateElementOptions = {}){
	const element = document.createElement(tagName)

	for(const [name, value] of Object.entries(attributes)){
		if(typeof value === "boolean" || name in element) Reflect.set(element, name, value)
		else element.setAttribute(name, String(value))
	}

	if(children) element.append(...children)

	return element
}

export default createElement
