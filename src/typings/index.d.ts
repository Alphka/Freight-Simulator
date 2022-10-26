declare global {
	var IMask: any

	interface Window {
		IMask: any
	}
}

type If<T extends boolean, A, B = null> = T extends true ? A : T extends false ? B : A | B

export type ElementsTagNames = "body" | "bodyLoaded" | "head"
export type LetterSizes = "PP" | "P" | "M" | "G" | "GG" | "XGG"
export type CepStructure = `${string}-${string}`

export interface City {
	id: number
	name: string
	cep: CepStructure | CepStructure[]
	distance: number
	toll?: {
		price: number
	}
	/** Mask to use in imaskjs */
	imaskConfig?: {
		mask: string
		blocks?: {
			[block: string]: {
				mask?: any
				from?: number
				to?: number
				enum?: any[]
			}
		}
	}
}

export interface Product {
	id: number
	name: string
	price: number
	sizeType: "letter" | "number"
}

type BasicDimensions = {
	/** Width in centimeters */
	width: number
	/** Height in centimeters */
	height: number
}

export type Dimensions<T extends boolean = false> = T extends true ? BasicDimensions & {
	/** Length in centimeters */
	length: number
	/** Cubic space (cm³) */
	readonly cubicSpace: number
} : BasicDimensions

export interface Data {
	/** Price in cents per kilometer */
	freightPrice: number
	freightMinimumPrice: number
	/** Data of the available cities */
	cities: City[]
	/** Data of the available products for sale */
	products: Product[]
	productsSizes: {
		letters: {
			[size in LetterSizes]: Dimensions<false>
		}
		numbers: {
			[size: number]: Dimensions
		}
		customSizePrice: number
	}
	/** Truck information */
	truck: {
		/** Truck capacity in kilograms */
		capacity: number
		/** Truck dimensions in centimeters */
		dimensions: Dimensions<true>
		/** Price in cents per ton */
		pricePerTon: number
	}
	/** Box default configuration for custom sizes */
	boxDefault: {
		/** Max quantity a box can fit */
		quantity: number
		/** Box dimensions in centimeters */
		dimensions: Dimensions<true>
	}
	cubageFactor: number
}

export interface Elements {
	form: HTMLFormElement
	clientName: HTMLInputElement
	email: HTMLInputElement
	city: HTMLSelectElement
	cep: HTMLInputElement
	district: HTMLInputElement
	street: HTMLInputElement
	houseNumber: HTMLInputElement
	complement: HTMLInputElement
	productsContainer: HTMLFieldSetElement
	products: ProductElement[]
	addProduct: HTMLInputElement
}

export interface ProductElement {
	container: HTMLDivElement
	element: HTMLSelectElement
	sizeElement: HTMLInputElement
	quantityElement: HTMLInputElement
	sizesDatalist: HTMLDataListElement
}
