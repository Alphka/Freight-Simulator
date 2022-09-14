import { Product } from "./index"

export type ExtendedProduct = Product & {
	element: HTMLTableRowElement
	productSize: string
	quantity: number
}

export type Products = ExtendedProduct[]
