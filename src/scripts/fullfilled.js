import Redundancy from "./redundancy.js"

new Redundancy({
	styles: [
		['[href$="bootstrap.min.css"]', "/public/styles/bootstrap.min.css"]
	]
})

import ElementsPromises from "./helpers/ElementsPromises.js"
import CreateElement from "./helpers/CreateElement.js"
import Data from "./data.js"

/** @param {number} price */
function Currency(price){
	return (price / 100).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL"
	}).replace(String.fromCharCode(160), "")
}

new class Fullfilled {
	/** @type {HTMLTableElement} */ addressTable
	/** @type {HTMLTableElement} */ productsTable
	/** @type {HTMLTableRowElement} */ product
	/** @type {import("../typings/fullfilled.js").Products} */ products = new Array
	productsPrice = 0

	constructor(){
		this.SetParams()
		this.selectedCity = this.GetCity()

		ElementsPromises.bodyLoaded.then(() => {
			this.SetElements()
			this.SetValues()
		})
	}
	SetParams(){
		const url = new URL(location.href)
		this.params = url.searchParams
	}
	SetElements(){
		this.addressTable = /** @type {HTMLTableElement} */ (document.querySelector("table#address"))
		this.productsTable = /** @type {HTMLTableElement} */ (document.querySelector("table#products"))
		this.pricesTable = /** @type {HTMLTableElement} */ (document.querySelector("table#prices"))
		this.product = document.querySelector(".product")
		this.productsBody = /** @type {HTMLTableSectionElement} */ (this.product.parentElement)
		this.productClone = /** @type {HTMLTableRowElement} */ (this.product.cloneNode(true))
	}
	SetValues(){
		/** @type {NodeListOf<HTMLTableCellElement>} */
		const cells = this.addressTable.querySelectorAll("[id]")

		cells.forEach(element => {
			const { id } = element

			switch(id){
				case "city":
					element.innerText = this.selectedCity.name
				break
				default: {
					/** @type {false | string} */
					const value = this.params.has(id) && this.params.get(id)
					if(value) element.innerText = value
				}
				break
			}
		})

		this.AddProducts()
		this.CalculateProductsPrice()
		this.CalculateFreight()

		this.AddPrice("Preço dos produtos:", this.productsPrice)
		this.AddFreight()
		this.AddPrice("Preço total:", this.productsPrice + this.freightPrice)
	}
	AddProducts(){
		const productParams = this.params.getAll("product")
		const sizeParams = this.params.getAll("productSize")
		const quantityParams = this.params.getAll("quantity")

		// If lengths are not equal
		if((productParams.length + sizeParams.length + quantityParams.length) / 3 % 1 !== 0){
			throw new Error("Invalid length sizes")
		}

		const { length } = productParams

		for(let i = 0; i < length; i++){
			const productId = productParams[i]
			const productSize = sizeParams[i]
			const quantity = Number(quantityParams[i])
			const product = this.GetProduct(productId)
			const price = product.price * quantity
			const isFirst = i === 0

			const element = isFirst ? this.product : /** @type {HTMLTableRowElement} */ (this.productClone.cloneNode(true))
			const [productElement, sizeElement, quantityElement, priceElement] = element.querySelectorAll("td")

			productElement.innerText = product.name
			sizeElement.innerText = productSize
			quantityElement.innerText = quantity.toString()
			priceElement.innerText = Currency(price)

			const customProduct = {
				...product,
				element,
				price,
				productSize,
				quantity
			}

			if(isFirst)
				this.products.push(customProduct)
			else{
				const { length } = this.products

				element.querySelector("th").innerText = (length + 1).toString()
				this.products[length - 1].element.after(element)
				this.products.push(customProduct)
			}
		}
	}
	/**
	 * @param {string} label
	 * @param {number} price
	 */
	AddPrice(label, price){
		const tbody = this.pricesTable.tBodies[0]
		const row = CreateElement("tr", {
			children: [
				CreateElement("th", {
					scope: "row",
					innerText: label
				}),
				CreateElement("td", {
					class: "text-right",
					colspan: 2,
					innerText: Currency(price)
				})
			]
		})

		tbody.appendChild(row)
	}
	AddFreight(){
		const tbody = this.pricesTable.tBodies[0]

		const freightData = /** @type {const} */ ([
			["Custo por distância", this.distancePrice],
			["Custo pelo seguro", this.insurancePrice],
			["Custo pelo pedágio", this.tollPrice],
			["Cubagem", this.cubagePrice],
			["Total", this.freightPrice],
		])

		let label
		const rows = [
			CreateElement("tr", {
				children: [
					label = CreateElement("th", {
						scope: "row",
						innerText: "Frete"
					})
				]
			})
		]

		let firstRowAdded = false

		for(const [label, price] of freightData){
			const head = CreateElement("th", {
				class: "text-right",
				scope: "row",
				innerText: label + ": "
			}), cell = CreateElement("td", {
				class: "text-right",
				innerText: Currency(price)
			})

			if(!firstRowAdded){
				const row = rows[0]
				row.appendChild(head)
				row.appendChild(cell)
				firstRowAdded = true
				continue
			}

			rows.push(CreateElement("tr", { children: [head, cell] }))
		}

		label.rowSpan = rows.length

		for(const row of rows) tbody.appendChild(row)
	}
	CalculateProductsPrice(){
		for(const { price, quantity } of this.products) this.productsPrice += price
	}
	CalculateFreight(){
		const { freightPrice, freightMinimumPrice } = Data
		const { toll, distance } = this.selectedCity
		const distancePrice = freightPrice * distance / 1000
		const insurance = 0.3 * this.productsPrice

		let tollPrice = toll?.price ?? 0
		let servicePrice = freightMinimumPrice

		const GetCubicWeightTax = () => {
			const { pricePerTon, dimensions: { cubicSpace: truckCubicSpace } } = Data.truck

			let cubicSpace = 0, cubicWeight = 0

			this.products.forEach(({ sizeType, quantity, productSize }) => {
				const { letters, numbers } = Data.productsSizes
				const size = sizeType === "letter" ? productSize : Number(productSize)

				/** @type {{ width: number, height: number }} */
				let dimensions

				if(typeof size === "string" && size in letters) dimensions = letters[/** @type {keyof typeof letters} */ (size)]
				else if(typeof size === "number" && size in numbers) dimensions = numbers[size]
				else throw new Error("Invalid size")

				const volume = dimensions.width * dimensions.height

				cubicSpace += volume
				cubicWeight += volume / Data.cubageFactor * quantity
			})

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

		const cubagePrice = this.cubagePrice = GetCubicWeightTax()

		this.tollPrice = tollPrice
		this.freightPrice = servicePrice + tollPrice + insurance + distancePrice + cubagePrice
	}
	GetCity(){
		return Data.cities.find(({ id }) => id === Number(this.params.get("city")))
	}
	/** @param {string | number} productId */
	GetProduct(productId){
		return Data.products.find(({ id }) => id === Number(productId))
	}
}
