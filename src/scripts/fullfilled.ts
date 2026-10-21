import type { Products } from "../typings/fullfilled"
import type { City } from "../typings/index"
import requireElement from "./helpers/requireElement"
import createElement from "./helpers/createElement"
import Data from "./data"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL"
})

/** @param price Price in cents */
function formatCurrency(price: number){
	// Remove the non-breaking space between the symbol and the value
	return currencyFormatter.format(price / 100).replace(" ", "")
}

class Fullfilled {
	addressTable = requireElement<HTMLTableElement>("table#address")
	productsTable = requireElement<HTMLTableElement>("table#products")
	pricesTable = requireElement<HTMLTableElement>("table#prices")
	product = requireElement<HTMLTableRowElement>(".product")
	productClone = this.product.cloneNode(true) as HTMLTableRowElement
	products: Products = []
	params = new URLSearchParams(location.search)
	selectedCity: City
	productsPrice = 0
	freightPrice!: number
	tollPrice!: number
	cubagePrice!: number
	insurancePrice!: number
	distancePrice!: number

	constructor(){
		const cityId = this.params.get("city")
		const city = this.getCity()

		if(!city) throw new Error(`Invalid city id: ${cityId}`)

		this.selectedCity = city
		this.setValues()
	}
	setValues(){
		const cells = this.addressTable.querySelectorAll<HTMLTableCellElement>("[id]")

		for(const element of cells){
			const { id } = element

			if(id === "city") element.textContent = this.selectedCity.name
			else{
				const value = this.params.get(id)
				if(value) element.textContent = value
			}
		}

		this.addProducts()
		this.calculateProductsPrice()
		this.calculateFreight()

		this.addPrice("Preço dos produtos:", this.productsPrice)
		this.addFreight()
		this.addPrice("Preço total:", this.productsPrice + this.freightPrice)
	}
	addProducts(){
		const productParams = this.params.getAll("product")
		const sizeParams = this.params.getAll("productSize")
		const quantityParams = this.params.getAll("quantity")

		if(productParams.length !== sizeParams.length || productParams.length !== quantityParams.length){
			throw new Error("Invalid length sizes")
		}

		for(const [i, productId] of productParams.entries()){
			const productSize = sizeParams[i]
			const quantity = Number(quantityParams[i])
			const product = this.getProduct(productId)

			if(!product) throw new Error(`Invalid product id: ${productId}`)

			const price = product.price * quantity
			const isFirst = i === 0

			const element = isFirst ? this.product : this.productClone.cloneNode(true) as HTMLTableRowElement
			const [productElement, sizeElement, quantityElement, priceElement] = element.querySelectorAll("td")

			productElement.textContent = product.name
			sizeElement.textContent = productSize
			quantityElement.textContent = quantity.toString()
			priceElement.textContent = formatCurrency(price)

			if(!isFirst){
				element.cells.item(0)!.textContent = (this.products.length + 1).toString()
				this.products.at(-1)!.element.after(element)
			}

			this.products.push({
				...product,
				element,
				price,
				productSize,
				quantity
			})
		}
	}
	addPrice(label: string, price: number){
		this.pricesTable.tBodies[0].append(createElement("tr", {
			children: [
				createElement("th", {
					scope: "row",
					textContent: label
				}),
				createElement("td", {
					class: "text-end",
					colspan: 2,
					textContent: formatCurrency(price)
				})
			]
		}))
	}
	addFreight(){
		const freightData = [
			["Custo por distância", this.distancePrice],
			["Custo pelo seguro", this.insurancePrice],
			["Custo pelo pedágio", this.tollPrice],
			["Cubagem", this.cubagePrice],
			["Total", this.freightPrice]
		] as const

		const rows = freightData.map(([label, price]) => createElement("tr", {
			children: [
				createElement("th", {
					class: "text-end",
					scope: "row",
					textContent: `${label}: `
				}),
				createElement("td", {
					class: "text-end",
					textContent: formatCurrency(price)
				})
			]
		}))

		// The first row also holds the "Frete" header, which spans every row
		rows[0].prepend(createElement("th", {
			scope: "row",
			rowSpan: rows.length,
			textContent: "Frete"
		}))

		this.pricesTable.tBodies[0].append(...rows)
	}
	calculateProductsPrice(){
		this.productsPrice = this.products.reduce((total, { price }) => total + price, 0)
	}
	calculateFreight(){
		const { freightPrice, freightMinimumPrice } = Data
		const { toll, distance } = this.selectedCity
		const distancePrice = freightPrice * distance / 1000
		const insurance = 0.3 * this.productsPrice

		let tollPrice = toll?.price ?? 0
		let servicePrice = freightMinimumPrice

		const getCubicWeightTax = () => {
			const { pricePerTon, dimensions: { cubicSpace: truckCubicSpace } } = Data.truck

			let cubicSpace = 0, cubicWeight = 0

			for(const { sizeType, quantity, productSize } of this.products){
				const { letters, numbers } = Data.productsSizes
				const size = sizeType === "letter" ? productSize : Number(productSize)

				let dimensions: { width: number, height: number }

				if(typeof size === "string" && size in letters) dimensions = letters[size as keyof typeof letters]
				else if(typeof size === "number" && size in numbers) dimensions = numbers[size]
				else throw new Error("Invalid size")

				const volume = dimensions.width * dimensions.height

				cubicSpace += volume
				cubicWeight += volume / Data.cubageFactor * quantity
			}

			// If it takes more than one truck
			if(cubicSpace > truckCubicSpace){
				const quantity = Math.ceil(cubicSpace / truckCubicSpace)
				servicePrice *= quantity
				tollPrice *= quantity
			}

			// (kg/m³) * (BRL/kg) = BRL
			return cubicWeight * pricePerTon / 1000
		}

		this.distancePrice = distancePrice
		this.insurancePrice = insurance

		const cubagePrice = this.cubagePrice = getCubicWeightTax()

		this.tollPrice = tollPrice
		this.freightPrice = servicePrice + tollPrice + insurance + distancePrice + cubagePrice
	}
	getCity(){
		return Data.cities.find(({ id }) => id === Number(this.params.get("city")))
	}
	getProduct(productId: string | number){
		return Data.products.find(({ id }) => id === Number(productId))
	}
}

new Fullfilled
