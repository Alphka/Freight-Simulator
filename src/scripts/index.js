import Redundancy from "./redundancy.js"

new Redundancy({
	styles: [
		['[href$="bootstrap.min.css"]', "/public/styles/bootstrap.min.css"]
	],
	scripts: [
		['[src$="imask"]', "/public/scripts/imask.js", { async: true }]
	]
})

import ElementsPromises from "./helpers/ElementsPromises.js"
import WaitForElement from "./helpers/WaitForElement.js"
import CreateElement from "./helpers/CreateElement.js"
import Data from "./data.js"


async function InsertIMask(){
	// * Redirect before loading source-map
	const response = await fetch("https://unpkg.com/imask", {
		method: "head",
		redirect: "follow"
	})

	if(!response.ok) throw new Error("Error during IMask request")

	return CreateElement("script", {
		src: response.url,
		async: true,
		crossOrigin: "anonymous",
		referrerpolicy: "noreferrer"
	})
}

const WaitIMask = (() => {
	/** @type {(value?: any) => void} */
	let resolve,
	/** @type {(reason?: any) => void} */
	reject

	const promise = new Promise((res, rej) => {
		resolve = res
		reject = rej
	})

	InsertIMask().then(script => {
		script.onload = resolve
		script.onerror = () => {
			const date = Date.now()
			const interval = setInterval(() => {
				if("IMask" in window) return clearInterval(interval), resolve()
				if(Date.now() - date > 5e3) reject(new Error("Error loading imaskjs"))
			}, 5)
		}

		promise.finally(() => {
			script.onload = null
			script.onerror = null
		})

		document.head.appendChild(script)
	}).catch(error => reject(error))

	return () => promise
})()

new class Index {
	requiredFieldMessage = /** @type {const} */ ("Este campo é obrigatório")
	autofillSelector = /** @type {const} */ (":-webkit-autofill")

	/** @type {import("../typings/index").Elements} */ elements
	data = Data

	#showEmailError = false
	#showCepError = false
	#productId = 0

	/** @type {HTMLDivElement} */ #productClone

	constructor(){
		ElementsPromises.bodyLoaded.then(this.Init.bind(this))
	}
	async Init(){
		await this.SetElements()

		const { clientName, email, city: cityElement, products: [ productElement ] } = this.elements
		const { cities, products } = this.data

		for(const { id, name } of cities) this.AddOption(cityElement, { id, name })
		for(const { id, name } of products) this.AddOption(productElement.element, { id, name })

		this.CloneNode(productElement.container)
		this.AddEventListeners()

		this.DisplayError(clientName, "Insira um nome válido")
		this.DisplayError(email, "Insira um email válido")

		productElement.sizesDatalist.id = `sizes-${this.#productId}`
		productElement.sizeElement.setAttribute("list", `sizes-${this.#productId}`)

		this.SetSizePattern(productElement)
		this.ChangeSizeDatalist(productElement)
		this.SetSizePattern(productElement)
		this.ChangeCepPattern(this.selectedCity.cep)

		this.#productId++
	}
	async SetElements(){
		const form = await WaitForElement("form")
		const product = /** @type {HTMLSelectElement} */ (form.querySelector("select#product"))
		const productsContainer = Array.from(document.querySelectorAll("fieldset")).find(e => e.contains(product))
		const productContainer = /** @type {HTMLDivElement} */ (productsContainer.querySelector(".product"))

		this.elements = {
			form,
			clientName: form.querySelector("input#name"),
			email: form.querySelector("input#email"),
			city: form.querySelector("select#city"),
			cep: form.querySelector("input#cep"),
			district: form.querySelector("input#district"),
			street: form.querySelector("input#street"),
			houseNumber: form.querySelector("input#houseNumber"),
			complement: form.querySelector("input#complement"),
			productsContainer,
			products: [
				{
					container: productContainer,
					element: product,
					sizeElement: productContainer.querySelector("input#productSize"),
					quantityElement: productContainer.querySelector("input#quantity"),
					sizesDatalist: productContainer.querySelector("datalist")
				}
			],
			addProduct: form.querySelector("input#addProduct")
		}
	}
	/** @param {import("../typings/index").ProductElement["container"]} productContainer */
	CloneNode(productContainer){
		const { products } = this.elements

		this.#productClone = /** @type {HTMLDivElement} */ (productContainer.cloneNode(true))
		this.ChangeProductIds(products[0])
	}
	AddEventListeners(){
		const [firstProduct] = this.elements.products

		this.NameListeners()
		this.EmailListeners()
		this.StreetListeners()
		this.CepListeners()
		this.ProductListeners(firstProduct)
		this.AddProductListener()
		this.FormListeners()

		WaitIMask().then(() => {
			const { houseNumber } = this.elements
			const imask = IMask(houseNumber, { mask: "000000" })

			houseNumber.addEventListener("change:custom", () => imask.updateValue())
		})
	}
	/**
	 * @param {HTMLElement} element
	 * @param {boolean} valid
	 */
	ToggleSuccess(element, valid){
		if(valid){
			if(!element.classList.contains("has-success")) element.classList.add("has-success")
			if(element.classList.contains("has-error")) element.classList.remove("has-error")
		}else{
			if(!element.classList.contains("has-error")) element.classList.add("has-error")
			if(element.classList.contains("has-success")) element.classList.remove("has-success")
		}
	}
	/** @param {HTMLElement} element */
	RemoveSuccess(element){
		if(element.classList.contains("has-error")) element.classList.remove("has-error")
		if(element.classList.contains("has-success")) element.classList.remove("has-success")
	}
	NameListeners(){
		const { elements: { clientName } } = this

		clientName.addEventListener("change", () => {
			const { validity, parentElement } = clientName
			const value = clientName.value.trim()
			const valid = validity.valid && value && value.includes(" ")

			// If not empty
			if(validity.valid){
				if(valid) this.ToggleSuccess(parentElement, true)
				else clientName.dispatchEvent(new Event("invalid"))
			}else this.ToggleSuccess(parentElement, false)
		})
	}
	EmailListeners(){
		const { elements: { email } } = this

		email.addEventListener("input", () => {
			const { validity: { valid }, parentElement } = email
			if(!this.#showEmailError && email.value.includes("@")) this.#showEmailError = true
			if(this.#showEmailError) this.ToggleSuccess(parentElement, valid)
		})

		email.addEventListener("change", () => {
			const { validity: { valid }, parentElement } = email
			if(!this.#showEmailError) this.#showEmailError = true
			this.ToggleSuccess(parentElement, valid)
		})
	}
	get selectedCity(){
		if(this.elements){
			const { elements: { city }, data: { cities } } = this
			return cities.find(({ id }) => id === Number(city.value))
		}

		return this.data.cities[0]
	}
	StreetListeners(){
		const { autofillSelector, elements: { street, houseNumber, complement: complementElement } } = this

		street.addEventListener("change", function(event){
			const { value } = this

			if(this.matches(autofillSelector) && value.includes(",")){
				const [street, data] = value.split(",")
				const { groups } = data.match(/(?<number>\d+)[ -]?(?<complement>\w)?/i)

				if(groups){
					const { number, complement } = groups

					if(!number) return

					this.value = street.trim()
					houseNumber.value = number.trim()
					houseNumber.dispatchEvent(new CustomEvent("change:custom"))

					if(complement) complementElement.value = complement
				}
			}
		})
	}
	CepListeners(){
		const {
			autofillSelector,
			elements: { cep: cepElement, street, city }
		} = this

		this.RemoveInputCustomValidation(cepElement)

		cepElement.addEventListener("change", () => {
			const { validity, parentElement } = cepElement
			const value = cepElement.value = cepElement.value.trim()

			/** @param {string} [message] */
			const CallError = message => this.DisplayError(cepElement, message, parentElement, true)

			if(!value) return this.RemoveSuccess(parentElement)
			if(!validity.valid) return CallError("Insira um CEP válido")

			let changeInputs = true

			if(street.matches(autofillSelector) || city.matches(autofillSelector)){
				changeInputs = false
			}

			const { cep, name } = this.selectedCity

			if(typeof cep === "string") return fetch(`https://viacep.com.br/ws/${value}/json/`, {
				headers: { Accept: "application/json" },
				referrerPolicy: "no-referrer",
				credentials: "omit",
				mode: "cors",
				cache: "force-cache"
			}).then(async response => {
				if(![200, 304].includes(response.status)) throw false

				const {
					erro,
					localidade,
					logradouro,
					bairro,
					uf
				} = await response.json()

				if(erro) throw false
				if(uf !== "MG") throw "O CEP inserido pertence a outro estado"
				if(name !== localidade) throw "O CEP não pertence à cidade selecionada"

				if(changeInputs){
					this.elements.district.value = bairro
					this.elements.street.value = logradouro
				}

				this.ToggleSuccess(parentElement, true)
			}).catch(error => {
				const errorType = typeof error

				if(["string", "boolean"].includes(errorType)){
					CallError(errorType === "string" ? error : (error = "Houve um erro na pesquisa do CEP"))
					if(errorType === "string") return
				}

				console.error(error instanceof Error ? error : (typeof error === "string" ? new Error(error) : error))
			})
			else if(cep instanceof Array && !cep.some(cep => cep === value)) alert(`CEP might be wrong: ${value}`)
		})

		WaitIMask().then(() => {
			const config = { lazy: false }

			let imask = IMask(cepElement, {
				...config,
				...this.selectedCity.imaskConfig ?? {}
			})

			city.addEventListener("change", () => {
				imask.destroy()

				cepElement.value = ""
				cepElement.setCustomValidity("")

				this.ChangeCepPattern(this.selectedCity.cep)
				this.RemoveSuccess(cepElement.parentElement)

				const { imaskConfig } = this.selectedCity

				if(imaskConfig){
					const options = {
						...config,
						...imaskConfig
					}

					if(options.blocks) for(const [, block] of Object.entries(options.blocks)){
						if(!block.mask){
							if(block.enum) block.mask = IMask.MaskedEnum
							else if(block.from || block.to) block.mask = IMask.MaskedRange
						}
					}

					console.log(imask, options)

					imask = IMask(cepElement, options), console.log(imask, imask.mask)
				}else console.log(imask)
			})
		}).finally(() => {
			// * Analyse input after IMask change input's value
			cepElement.addEventListener("input", () => {
				const { validity, parentElement } = cepElement
				const value = cepElement.value.trim()

				if(value){
					if(!this.#showCepError){
						if(value.includes("-")) this.#showCepError = true
						else this.RemoveSuccess(parentElement)
					}else this.ToggleSuccess(parentElement, this.IsValid(validity))
				}else this.RemoveSuccess(parentElement)
			})

			cepElement.addEventListener("invalid", () => {
				const value = cepElement.value.trim()
				if(!value) this.DisplayError(cepElement, this.requiredFieldMessage, cepElement.parentElement, true)
				if(!this.#showCepError) this.#showCepError = true
			})
		})
	}
	/** @param {HTMLInputElement} input */
	RemoveInputCustomValidation(input){
		input.addEventListener("input", () => {
			const { validity, parentElement } = input
			let { valid } = validity

			// Has errors
			if(!valid){
				// Has only a customError
				if(this.IsValid(validity)) valid = true
				// Remove default error message
				else input.setCustomValidity(" ")
			}

			if(valid){
				input.removeAttribute("aria-invalid")
				input.removeAttribute("aria-errormessage")
			}

			this.ToggleSuccess(parentElement, valid)
		})

		input.addEventListener("change", () => {
			const { validity, parentElement } = input

			if(validity.customError){
				input.setCustomValidity("")
				this.ToggleSuccess(parentElement, validity.valid)
			}
		})
	}
	/** @param {import("../typings/index").ProductElement} product */
	ChangeSizeDatalist({ element, sizesDatalist }){
		const { letters, numbers } = this.data.productsSizes
		const { sizeType } = this.GetSelectedProduct(element)
		const { childElementCount, dataset } = sizesDatalist

		if(dataset.type && dataset.type === sizeType) return
		if(childElementCount) for(const child of [...sizesDatalist.children]) child.remove()

		/** @type {typeof letters | typeof numbers} */
		let object

		if(sizeType === "letter") object = letters
		if(sizeType === "number") object = numbers

		for(const key in object) this.AddOption(sizesDatalist, key)

		dataset.type = sizeType
	}
	/** @param {import("../typings/index").ProductElement} product */
	ProductListeners(product){
		const { element, sizeElement } = product
		const { letters, numbers } = this.data.productsSizes

		this.RemoveInputCustomValidation(sizeElement)

		element.addEventListener("change", () => {
			this.SetSizePattern(product)
			this.ChangeSizeDatalist(product)

			if(sizeElement.validity.valueMissing) this.RemoveSuccess(sizeElement.parentElement)
			else this.ToggleSuccess(sizeElement.parentElement, sizeElement.checkValidity())
		})

		const ValidateSize = () => {
			sizeElement.value = sizeElement.value.trim()

			const { value, parentElement } = sizeElement

			/** @param {string} [message] */
			const CallError = message => this.DisplayError(sizeElement, message, parentElement, true)

			if(!value) return CallError(this.requiredFieldMessage)

			const validation = {
				letter: /^[a-z]+$/i.test(value),
				number: /^\d+$/.test(value)
			}

			let valid =
				Object.keys(letters).includes(/** @type {import("../typings/index").LetterSizes} */ (value.toUpperCase())) ||
				Object.keys(numbers).includes(value)

			if(!valid){
				CallError("Insira um tamanho válido")
				return this.ToggleSuccess(parentElement, false)
			}

			const { sizeType } = this.GetSelectedProduct(element)

			if(sizeType === "number") valid = validation.number
			else if(sizeType === "letter") valid = validation.letter
			else valid = true

			this.ToggleSuccess(parentElement, valid)

			if(!valid) CallError("Tamanho inválido para o produto")
		}

		sizeElement.addEventListener("change", ValidateSize.bind(this))
		element.addEventListener("change", ValidateSize.bind(this))
	}
	AddProductListener(){
		const { addProduct } = this.elements
		addProduct.addEventListener("click", this.AddProduct.bind(this))
	}
	AddProduct(){
		const { products } = this.elements

		const container = /** @type {HTMLDivElement} */ (this.#productClone.cloneNode(true))
		const element = /** @type {HTMLSelectElement} */ (container.querySelector("#product"))
		const sizeElement = /** @type {HTMLInputElement} */ (container.querySelector("#productSize"))
		const quantityElement = /** @type {HTMLInputElement} */ (container.querySelector("#quantity"))
		const sizesDatalist = container.querySelector("datalist")

		/** @type {import("../typings/index").ProductElement} */
		const product = { element, sizeElement, quantityElement, sizesDatalist, container }

		sizesDatalist.id = `sizes-${this.#productId}`
		sizeElement.setAttribute("list", `sizes-${this.#productId}`)

		this.ChangeProductIds(product, container)
		this.ChangeSizeDatalist(product)
		this.ProductListeners(product)

		products.at(-1).container.after(container)
		products.push(product)

		this.#productId++
	}
	FormListeners(){
		const { form } = this.elements

		/**
		 * @param {string} name
		 * @param {any} value
		 */
		const hiddenInput = (name, value) => CreateElement("input", {
			type: "hidden",
			value,
			name
		})

		form.addEventListener("submit", () => {
			const prices = this.elements.products.map(productElement => {
				const selectedProduct = this.GetSelectedProduct(productElement.element)
				return this.CalculateProductPrice(selectedProduct, productElement)
			})

			const price = prices.length === 1 ? prices[0] : prices.reduce((a, b) => a + b, 0)
			const freight = this.CalculateFreight(price)

			form.appendChild(hiddenInput("price", price))
			form.appendChild(hiddenInput("freight", freight))

			return true
		})
	}
	/**
	 * @param {import("../typings/index").Product} product
	 * @param {import("../typings/index").ProductElement} productElementData
	*/
	CalculateProductPrice({ price, name }, { quantityElement }){
		const quantity = Number(quantityElement.value)

		console.log("Product:", {
			name,
			price,
			quantity
		})

		return price * quantity
	}
	/** @param {number} price */
	CalculateFreight(price){
		const { selectedCity: { toll, distance }, data: { freightPrice, freightMinimumPrice } } = this
		const distancePrice = freightPrice * distance / 1000
		const insurance = 0.3 * price

		let tollPrice = toll?.price ?? 0
		let servicePrice = freightMinimumPrice

		const GetCubicWeightTax = () => {
			const { capacity, pricePerTon, dimensions: { cubicSpace: truckCubicSpace } } = this.data.truck

			const products = this.elements.products.map(({ element, sizeElement, quantityElement }) => {
				const selectedProduct = this.GetSelectedProduct(element)
				const size = sizeElement.value.trim()
				const quantity = Number(quantityElement.value.trim())

				return {
					product: selectedProduct,
					size: selectedProduct.sizeType === "letter" ? size : Number(size),
					quantity
				}
			})

			let cubicSpace = 0

			products.forEach(({ size, quantity }) => {
				const { letters, numbers } = this.data.productsSizes

				/** @type {{ width: number, height: number }} */
				let dimensions

				if(typeof size === "string" && size in letters) dimensions = letters[/** @type {keyof typeof letters} */ (size)]
				else if(typeof size === "number" && size in numbers) dimensions = numbers[size]
				else{ // Custom sizes
					const { quantity: boxQuantity, dimensions: { cubicSpace } } = this.data.boxDefault
					if(quantity <= boxQuantity) return cubicSpace
					else return cubicSpace * Math.ceil(quantity / boxQuantity)
				}

				cubicSpace += dimensions.width * dimensions.height * quantity
			})

			// If it takes more than one truck
			if(cubicSpace > truckCubicSpace){
				const quantity = Math.ceil(cubicSpace / truckCubicSpace)
				servicePrice *= quantity
				tollPrice *= quantity
			}

			// (kg/cm³) * cm³ = kg
			const cubicWeight = capacity / truckCubicSpace * cubicSpace

			// ton * (BRL/ton) = BRL
			return cubicWeight / 1000 * pricePerTon
		}

		return servicePrice + tollPrice + insurance + distancePrice + GetCubicWeightTax()
	}
	/** @param {string | string[]} ceps */
	ChangeCepPattern(ceps){
		const { cep } = this.elements

		if(ceps instanceof Array){
			if(ceps.length === 1){
				const uniqueCep = ceps[0]

				cep.pattern = uniqueCep
				cep.value = uniqueCep
				cep.dispatchEvent(new Event("change"))
			}else cep.pattern = ceps.join("|")
		}else cep.pattern = ceps.replace(/x/gi, "\\d")
	}
	/** @param {ValidityState} validity */
	IsValid(validity){
		let valid = true

		for(const key in validity){
			if(key === "customError") continue
			if(!(valid = !validity[key])) break
		}

		return valid
	}
	/**
	 * @param {HTMLInputElement} element
	 * @param {string} [message]
	 * @param {HTMLElement} [parentElement]
	 * @param {boolean} [once]
	 */
	DisplayError(element, message, parentElement, once = false){
		const that = this

		message ??= this.requiredFieldMessage
		parentElement ??= element.parentElement

		const eventNames = [
			"input",
			"change"
		]

		/** @this {HTMLInputElement} */
		function Callback(){
			this.setCustomValidity("")
			this.removeAttribute("aria-invalid")
			this.removeAttribute("aria-errormessage")
			that.RemoveSuccess(parentElement)
			RemoveListeners()
		}

		const SetListeners = () => {
			for(const event of eventNames) element.addEventListener(event, Callback)
		}

		const RemoveListeners= () => {
			for(const event of eventNames) element.removeEventListener(event, Callback)
		}

		const SetError = () => {
			const _errorMessage = element.value.trim() ? message : this.requiredFieldMessage
			element.setAttribute("aria-invalid", "true")
			element.setAttribute("aria-errormessage", _errorMessage)
			element.setCustomValidity(_errorMessage)
			this.ToggleSuccess(parentElement, false)
		}

		if(once)
			SetError()
		else{
			element.setCustomValidity("")
			element.addEventListener("invalid", () => (SetError(), SetListeners()))
		}
	}
	/**
	 * @param {HTMLSelectElement | HTMLDataListElement} element
	 * @param {{ id: number, name: string } | string | number} data
	 */
	AddOption(element, data){
		const option = document.createElement("option")

		if(element instanceof HTMLSelectElement){
			if(typeof data === "number" || typeof data === "string"){
				option.value = data.toString()
			}else{
				option.innerText = data.name
				option.value = data.id.toString()
			}

			element.options.add(option)
		}else{
			option.value = data.toString()
			element.appendChild(option)
		}

		return option
	}
	/** @param {import("../typings/index").ProductElement} productElement */
	SetSizePattern({ element, sizeElement }){
		const { letters, numbers } = this.data.productsSizes
		const selectedProduct = this.GetSelectedProduct(element)
		const object = selectedProduct.sizeType === "letter" ? letters : numbers

		// sizeElement.pattern =  "^[a-zA-Z]+$" : "^\\d+$"

		sizeElement.pattern = Object.keys(object).join("|")
		sizeElement.setCustomValidity("")
	}
	/** @param {HTMLSelectElement} product */
	GetSelectedProduct(product){
		return this.data.products.find(({ id }) => id === Number(product.value))
	}
	/**
	 * @param {import("../typings/index").ProductElement} product
	 * @param {HTMLDivElement} [parentContainer]
	 */
	ChangeProductIds({ element }, parentContainer){
		const { productsContainer } = this.elements
		const productsContainers = Array.from(productsContainer.querySelectorAll(".product"))

		parentContainer ??= /** @type {HTMLDivElement} */ (productsContainers.find(container => container.contains(element)))

		for(const label of parentContainer.querySelectorAll("label")){
			const id = label.htmlFor
			const newId = `${id}-${this.#productId}`
			const element = parentContainer.querySelector(`#${id}`) // ? label.control doesn't work

			element.id = newId
			label.htmlFor = newId
		}
	}
}

// TODO: Improve Redudancy.js "error" event checking
