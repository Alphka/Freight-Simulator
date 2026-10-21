export type LetterSizes = "PP" | "P" | "M" | "G" | "GG" | "XGG"
export type CepStructure = `${string}-${string}`

export interface City {
	id: number
	cep: CepStructure | CepStructure[]
	name: string
	toll?: {
		price: number
	}
	distance: number
	/** Mask to use in imaskjs */
	imaskConfig?: {
		mask: string
		blocks?: {
			[block: string]: {
				to?: number
				mask?: any
				enum?: any[]
				from?: number
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
	/** Data of the available cities */
	cities: City[]
	/** Price in cents per kilometer */
	freightPrice: number
	freightMinimumPrice: number
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
	cep: HTMLInputElement
	city: HTMLSelectElement
	form: HTMLFormElement
	email: HTMLInputElement
	street: HTMLInputElement
	district: HTMLInputElement
	products: ProductElement[]
	addProduct: HTMLButtonElement
	clientName: HTMLInputElement
	complement: HTMLInputElement
	houseNumber: HTMLInputElement
	productsContainer: HTMLFieldSetElement
}

export interface ProductElement {
	element: HTMLSelectElement
	container: HTMLDivElement
	sizeElement: HTMLInputElement
	sizesDatalist: HTMLDataListElement
	quantityElement: HTMLInputElement
}
