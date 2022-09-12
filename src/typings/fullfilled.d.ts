import { Product } from "./index"

export type Products = (Product & {
	element: HTMLTableRowElement,
	price: number
})[]
