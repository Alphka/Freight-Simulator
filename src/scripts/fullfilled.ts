import type { Products } from "../typings/fullfilled"
import type { City } from "../typings/index"
import ElementsPromises from "./helpers/ElementsPromises.js"
import CreateElement from "./helpers/CreateElement.js"
import Data from "./data.js"

/** @param {number} price */
function Currency(price: number){
	return (price / 100).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL"
	}).replace(String.fromCharCode(160), "")
}

new class Fullfilled {
	addressTable!: HTMLTableElement
	productsTable!: HTMLTableElement
	product!: HTMLTableRowElement
	products: Products = new Array
	selectedCity: City
	params!: URLSearchParams
	pricesTable!: HTMLTableElement
	productsBody!: HTMLTableSectionElement
	productClone!: HTMLTableRowElement
	productsPrice: number = 0
	freightPrice!: number
	tollPrice!: number
	cubagePrice!: number
	insurancePrice!: number
	distancePrice!: number

	constructor(){
		this.SetParams()

		const city = this.GetCity()

		if(!city) throw new Error("Invalid city: " + city)

		this.selectedCity = city
		this.Init()
	}
	async Init(){
		await ElementsPromises.bodyLoaded

		this.SetElements()
		this.SetValues()
	}
	SetParams(){
		const url = new URL(location.href)
		this.params = url.searchParams
	}
	SetElements(){
		this.addressTable = document.querySelector("table#address") as HTMLTableElement
		this.productsTable = document.querySelector("table#products") as HTMLTableElement
		this.pricesTable = document.querySelector("table#prices") as HTMLTableElement
		this.product = document.querySelector(".product") as HTMLTableRowElement
		this.productsBody = this.product.parentElement as HTMLTableSectionElement
		this.productClone = this.product.cloneNode(true) as HTMLTableRowElement
	}
	SetValues(){
		const cells = this.addressTable.querySelectorAll<HTMLTableCellElement>("[id]")

		cells.forEach(element => {
			const { id } = element

			switch(id){
				case "city":
					element.innerText = this.selectedCity.name
				break
				default: {
					const value: false | string = this.params.has(id) && this.params.get(id)!
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

			if(!product) throw new Error("Invalid product id: " + productId)

			const price = product.price * quantity
			const isFirst = i === 0

			const element = isFirst ? this.product : this.productClone.cloneNode(true) as HTMLTableRowElement
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

			if(isFirst){
				this.products.push(customProduct)
			}else{
				const { length } = this.products

				element.cells.item(0)!.innerText = (length + 1).toString()
				this.products[length - 1].element.after(element)
				this.products.push(customProduct)
			}
		}
	}
	AddPrice(label: string, price: number){
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

		const freightData = [
			["Custo por distância", this.distancePrice],
			["Custo pelo seguro", this.insurancePrice],
			["Custo pelo pedágio", this.tollPrice],
			["Cubagem", this.cubagePrice],
			["Total", this.freightPrice],
		] as const

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

				let dimensions: { width: number; height: number }

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
	GetProduct(productId: string | number){
		return Data.products.find(({ id }) => id === Number(productId))
	}
}
