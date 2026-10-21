import { Product } from "./index"

export type ExtendedProduct = Product & {
	element: HTMLTableRowElement
	quantity: number
	productSize: string
}

export type Products = ExtendedProduct[]
