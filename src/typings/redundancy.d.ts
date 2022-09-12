export interface ReplaceElementOptions {
	async?: boolean
	/** If true, it will set `referrerpolicy` to `noreferrer` */
	noreferrer?: boolean
	/** If true, it will set `crossorigin` to `anonymous` */
	crossorigin?: boolean
}

export type SelectorEntry = [string, string] | [string, string, ReplaceElementOptions]

export interface Selectors {
	styles?: SelectorEntry[]
	scripts?: SelectorEntry[]
}
