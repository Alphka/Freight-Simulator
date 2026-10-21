/** Same as `querySelector`, but throws when the element does not exist */
function requireElement<T extends Element = HTMLElement>(selector: string, parent: ParentNode = document){
	const element = parent.querySelector<T>(selector)

	if(!element) throw new Error(`Element not found: ${selector}`)

	return element
}

export default requireElement
