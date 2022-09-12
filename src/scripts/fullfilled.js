import ElementsPromises from "./helpers/ElementsPromises.js"
import CreateElement from "./helpers/CreateElement.js"
import Redundancy from "./redundancy.js"
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

	constructor(){
		ElementsPromises.bodyLoaded.then(this.Init.bind(this))
	}
	async Init(){
		this.SetParams()
		this.SetElements()
		this.SetValues()
	}
	SetParams(){
		const url = new URL(location.href)
		this.params = url.searchParams
	}
	SetElements(){
		this.addressTable = document.querySelector("table#address")
		this.productsTable = document.querySelector("table#products")
		this.product = document.querySelector(".product")
		this.productsBody = /** @type {HTMLTableSectionElement} */ (this.product.parentElement)
		this.productClone = /** @type {HTMLTableRowElement} */ (this.product.cloneNode(true))

		const [productsPrice, freightPrice, totalPrice] = this.product.nextElementSibling.querySelectorAll(":scope > td p")

		this.productsPrice = productsPrice
		this.freightPrice = freightPrice
		this.totalPrice = totalPrice
	}
	SetValues(){
		/** @type {NodeListOf<HTMLTableCellElement>} */
		const cells = this.addressTable.querySelectorAll("[id]")

		cells.forEach(element => {
			const { id } = element

			switch(id){
				case "city":
					element.innerText = this.GetCity().name
				break
				default: {
					/** @type {false | string} */
					const value = this.params.has(id) && this.params.get(id)
					if(value) element.innerText = value
				}
				break
			}
		})

		const productParams = this.params.getAll("product")
		const sizeParams = this.params.getAll("productSize")
		const quantityParams = this.params.getAll("quantity")

		for(let i = 0; i < productParams.length; i++){
			const productId = productParams[i]
			const productSize = sizeParams[i]
			const quantity = quantityParams[i]
			const product = this.GetProduct(productId)
			const price = product.price * Number(quantity)
			const isFirst = i === 0

			const element = isFirst ? this.product : /** @type {HTMLTableRowElement} */ (this.productClone.cloneNode(true))
			const [productElement, sizeElement, quantityElement, priceElement] = element.querySelectorAll("td")

			productElement.innerText = product.name
			sizeElement.innerText = productSize
			quantityElement.innerText = quantity
			priceElement.innerText = Currency(price)

			const customProduct = {
				...product,
				element,
				price
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

		const productsPrice = this.products.reduce((a, b) => b.price + a, 0)
		const freightPrice = Number(this.params.get("freight"))

		/**
		 * @param {Element} element
		 * @param {string} label
		 * @param {number} price
		 */
		const addPrice = (element, label, price) => {
			element.appendChild(CreateElement("strong", { innerText: label }))
			element.appendChild(new Text(` ${Currency(price)}`))
		}

		addPrice(this.productsPrice, "Preço dos produtos:", productsPrice)
		addPrice(this.freightPrice, "Frete:", freightPrice)
		addPrice(this.totalPrice, "Preço total:", productsPrice + freightPrice)
	}
	GetCity(){
		return Data.cities.find(({ id }) => id === Number(this.params.get("city")))
	}
	/** @param {string | number} productId */
	GetProduct(productId){
		return Data.products.find(({ id }) => id === Number(productId))
	}
}

new Redundancy({
	styles: [
		['[href$="bootstrap.min.css"]', "/public/styles/bootstrap.min.css"]
	]
})
