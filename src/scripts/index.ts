import type { Elements, ProductElement } from "../typings/index"
import ElementsPromises from "./helpers/ElementsPromises.js"
import WaitForElement from "./helpers/WaitForElement.js"
import CreateElement from "./helpers/CreateElement.js"
import Data from "./data.js"

async function InsertIMask(){
	// * Redirect before loading source-map
	const response = await fetch("https://unpkg.com/imask", {
		mode: "cors",
		method: "head",
		redirect: "follow",
		referrerPolicy: "no-referrer",
		cache: "force-cache"
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
	let resolve: (value?: any) => void, reject: (reason?: any) => void

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
	private requiredFieldMessage = "Este campo é obrigatório" as const
	private autofillSelector = ":-webkit-autofill" as const

	private elements!: Elements
	private data = Data

	#showEmailError = false
	#showCepError = false
	#productId = 0
	#productClone!: HTMLDivElement

	constructor(){
		this.Init()
	}
	private async Init(){
		await ElementsPromises.bodyLoaded
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
		this.ChangeCepPattern(this.selectedCity!.cep)

		this.#productId++
	}
	private async SetElements(){
		const form = await WaitForElement("form")
		const product = form.querySelector("select#product") as HTMLSelectElement
		const productsContainer = Array.from(document.querySelectorAll("fieldset")).find(element => element.contains(product))!
		const productContainer = productsContainer.querySelector(".product") as HTMLDivElement

		this.elements = {
			form,
			clientName: form.querySelector("input#name") as HTMLInputElement,
			email: form.querySelector("input#email") as HTMLInputElement,
			city: form.querySelector("select#city") as HTMLSelectElement,
			cep: form.querySelector("input#cep") as HTMLInputElement,
			district: form.querySelector("input#district") as HTMLInputElement,
			street: form.querySelector("input#street") as HTMLInputElement,
			houseNumber: form.querySelector("input#houseNumber") as HTMLInputElement,
			complement: form.querySelector("input#complement") as HTMLInputElement,
			productsContainer,
			products: [
				{
					container: productContainer,
					element: product,
					sizeElement: productContainer.querySelector("input#productSize") as HTMLInputElement,
					quantityElement: productContainer.querySelector("input#quantity") as HTMLInputElement,
					sizesDatalist: productContainer.querySelector("datalist")!
				}
			],
			addProduct: form.querySelector("input#addProduct") as HTMLInputElement
		}
	}
	private CloneNode(productContainer: ProductElement["container"]){
		const { products } = this.elements

		this.#productClone = productContainer.cloneNode(true) as HTMLDivElement
		this.ChangeProductIds(products[0])
	}
	private AddEventListeners(){
		const [firstProduct] = this.elements.products

		this.NameListeners()
		this.EmailListeners()
		this.StreetListeners()
		this.CepListeners()
		this.ProductListeners(firstProduct)
		this.AddProductListener()

		WaitIMask().then(() => {
			const { houseNumber } = this.elements
			const imask = IMask(houseNumber, { mask: "000000" })

			houseNumber.addEventListener("change:custom", () => imask.updateValue())
		})
	}
	private ToggleSuccess(element: HTMLElement, valid: boolean){
		if(valid){
			if(!element.classList.contains("has-success")) element.classList.add("has-success")
			if(element.classList.contains("has-error")) element.classList.remove("has-error")
		}else{
			if(!element.classList.contains("has-error")) element.classList.add("has-error")
			if(element.classList.contains("has-success")) element.classList.remove("has-success")
		}
	}
	private RemoveSuccess(element: HTMLElement){
		if(element.classList.contains("has-error")) element.classList.remove("has-error")
		if(element.classList.contains("has-success")) element.classList.remove("has-success")
	}
	private NameListeners(){
		const { elements: { clientName } } = this

		clientName.addEventListener("change", () => {
			const { validity, parentElement } = clientName
			const value = clientName.value.trim()
			const valid = validity.valid && value && value.includes(" ")

			// If not empty
			if(validity.valid){
				if(valid) this.ToggleSuccess(parentElement!, true)
				else clientName.dispatchEvent(new Event("invalid"))
			}else this.ToggleSuccess(parentElement!, false)
		})
	}
	private EmailListeners(){
		const { elements: { email } } = this

		email.addEventListener("input", () => {
			const { validity: { valid }, parentElement } = email
			if(!this.#showEmailError && email.value.includes("@")) this.#showEmailError = true
			if(this.#showEmailError) this.ToggleSuccess(parentElement!, valid)
		})

		email.addEventListener("change", () => {
			const { validity: { valid }, parentElement } = email
			if(!this.#showEmailError) this.#showEmailError = true
			this.ToggleSuccess(parentElement!, valid)
		})
	}
	get selectedCity(){
		if(this.elements){
			const { elements: { city }, data: { cities } } = this
			return cities.find(({ id }) => id === Number(city.value))
		}

		return this.data.cities[0]
	}
	private StreetListeners(){
		const { autofillSelector, elements: { street, houseNumber, complement: complementElement } } = this

		street.addEventListener("change", function(event){
			const { value } = this

			if(this.matches(autofillSelector) && value.includes(",")){
				const [street, data] = value.split(",")
				const { groups } = data.match(/(?<number>\d+)[ -]?(?<complement>\w)?/i)!

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
	private CepListeners(){
		const {
			autofillSelector,
			elements: { cep: cepElement, street, city }
		} = this

		this.RemoveInputCustomValidation(cepElement)

		cepElement.addEventListener("change", () => {
			const { validity, parentElement } = cepElement
			const value = cepElement.value = cepElement.value.trim()

			/** @param {string} [message] */
			const CallError = (message: string) => this.DisplayError(cepElement, message, parentElement!, true)

			if(!value) return this.RemoveSuccess(parentElement!)
			if(!validity.valid) return CallError("Insira um CEP válido")

			let changeInputs = true

			if(street.matches(autofillSelector) || city.matches(autofillSelector)){
				changeInputs = false
			}

			const { cep, name } = this.selectedCity!

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

				this.ToggleSuccess(parentElement!, true)
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

			// @ts-ignore
			let imask = IMask(cepElement, {
				...config,
				...this.selectedCity!.imaskConfig ?? {}
			})

			city.addEventListener("change", () => {
				const { selectedCity } = this

				imask.destroy()

				cepElement.value = ""
				cepElement.setCustomValidity("")

				this.ChangeCepPattern(selectedCity!.cep)
				this.RemoveSuccess(cepElement.parentElement!)

				const { imaskConfig } = selectedCity!

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

					// @ts-ignore
					imask = IMask(cepElement, options)
				}
			})
		}).finally(() => {
			// * Analyse input after IMask change input's value
			cepElement.addEventListener("input", () => {
				const { validity, parentElement } = cepElement
				const value = cepElement.value.trim()

				if(value){
					if(!this.#showCepError){
						if(value.includes("-")) this.#showCepError = true
						else this.RemoveSuccess(parentElement!)
					}else this.ToggleSuccess(parentElement!, this.IsValid(validity))
				}else this.RemoveSuccess(parentElement!)
			})

			cepElement.addEventListener("invalid", () => {
				const value = cepElement.value.trim()
				if(!value) this.DisplayError(cepElement, this.requiredFieldMessage, cepElement.parentElement!, true)
				if(!this.#showCepError) this.#showCepError = true
			})
		})
	}
	/** @param {HTMLInputElement} input */
	private RemoveInputCustomValidation(input: HTMLInputElement){
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

			this.ToggleSuccess(parentElement!, valid)
		})

		input.addEventListener("change", () => {
			const { validity, parentElement } = input

			if(validity.customError){
				input.setCustomValidity("")
				this.ToggleSuccess(parentElement!, validity.valid)
			}
		})
	}
	/** @param {ProductElement} product */
	private ChangeSizeDatalist({ element, sizesDatalist }: ProductElement){
		const { letters, numbers } = this.data.productsSizes
		const { sizeType } = this.GetSelectedProduct(element)!
		const { childElementCount, dataset } = sizesDatalist

		if(dataset.type && dataset.type === sizeType) return
		if(childElementCount) for(const child of [...sizesDatalist.children]) child.remove()

		let object: typeof letters | typeof numbers

		if(sizeType === "letter") object = letters
		else object = numbers

		for(const key in object) this.AddOption(sizesDatalist, key)

		dataset.type = sizeType
	}
	/** @param {ProductElement} product */
	private ProductListeners(product: ProductElement){
		const { element, sizeElement } = product
		const { letters, numbers } = this.data.productsSizes

		this.RemoveInputCustomValidation(sizeElement)

		element.addEventListener("change", () => {
			this.SetSizePattern(product)
			this.ChangeSizeDatalist(product)

			if(sizeElement.validity.valueMissing) this.RemoveSuccess(sizeElement.parentElement!)
			else this.ToggleSuccess(sizeElement.parentElement!, sizeElement.checkValidity())
		})

		const ValidateSize = () => {
			sizeElement.value = sizeElement.value.trim()

			const { value, parentElement } = sizeElement

			/** @param {string} [message] */
			const CallError = (message: string) => this.DisplayError(sizeElement, message, parentElement!, true)

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
				return this.ToggleSuccess(parentElement!, false)
			}

			const { sizeType } = this.GetSelectedProduct(element)!

			if(sizeType === "number") valid = validation.number
			else if(sizeType === "letter") valid = validation.letter
			else valid = true

			this.ToggleSuccess(parentElement!, valid)

			if(!valid) CallError("Tamanho inválido para o produto")
		}

		sizeElement.addEventListener("change", ValidateSize.bind(this))
		element.addEventListener("change", ValidateSize.bind(this))
	}
	private AddProductListener(){
		const { addProduct } = this.elements
		addProduct.addEventListener("click", this.AddProduct.bind(this))
	}
	private AddProduct(){
		const { products } = this.elements

		const container = this.#productClone.cloneNode(true) as HTMLDivElement
		const element = container.querySelector("#product") as HTMLSelectElement
		const sizeElement = container.querySelector("#productSize") as HTMLInputElement
		const quantityElement = container.querySelector("#quantity") as HTMLInputElement
		const sizesDatalist = container.querySelector("datalist")!

		/** @type {ProductElement} */
		const product: ProductElement = { element, sizeElement, quantityElement, sizesDatalist, container }

		sizesDatalist.id = `sizes-${this.#productId}`
		sizeElement.setAttribute("list", `sizes-${this.#productId}`)

		this.ChangeProductIds(product, container)
		this.ChangeSizeDatalist(product)
		this.ProductListeners(product)

		products.at(-1)!.container.after(container)
		products.push(product)

		this.#productId++
	}
	/** @param {string | string[]} ceps */
	private ChangeCepPattern(ceps: string|string[]){
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
	private IsValid(validity: ValidityState){
		let valid = true

		for(const key in validity){
			if(key === "customError") continue
			if(!(valid = !validity[key])) break
		}

		return valid
	}
	private DisplayError(element: HTMLInputElement, message?: string, parentElement?: HTMLElement, once: boolean = false){
		const that = this

		message ??= this.requiredFieldMessage
		parentElement ??= element.parentElement!

		const eventNames = [
			"input",
			"change"
		] as const

		function Callback(this: typeof element){
			this.setCustomValidity("")
			this.removeAttribute("aria-invalid")
			this.removeAttribute("aria-errormessage")
			that.RemoveSuccess(parentElement!)
			RemoveListeners()
		}

		const SetListeners = () => {
			for(const event of eventNames) element.addEventListener(event, Callback)
		}

		const RemoveListeners= () => {
			for(const event of eventNames) element.removeEventListener(event, Callback)
		}

		const SetError = () => {
			const errorMessage = element.value.trim() ? message as string : this.requiredFieldMessage
			element.setAttribute("aria-invalid", "true")
			element.setAttribute("aria-errormessage", errorMessage)
			element.setCustomValidity(errorMessage)
			this.ToggleSuccess(parentElement!, false)
		}

		if(once){
			SetError()
		}else{
			element.setCustomValidity("")
			element.addEventListener("invalid", () => (SetError(), SetListeners()))
		}
	}
	/**
	 * @param {HTMLSelectElement | HTMLDataListElement} element
	 * @param {{ id: number, name: string } | string | number} data
	 */
	private AddOption(element: HTMLSelectElement|HTMLDataListElement, data: { id: number; name: string }|string|number){
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
	private SetSizePattern({ element, sizeElement }: ProductElement){
		const { letters, numbers } = this.data.productsSizes
		const selectedProduct = this.GetSelectedProduct(element)!
		const object = selectedProduct.sizeType === "letter" ? letters : numbers

		// sizeElement.pattern =  "^[a-zA-Z]+$" : "^\\d+$"

		sizeElement.pattern = Object.keys(object).join("|")
		sizeElement.setCustomValidity("")
	}
	/** @param {HTMLSelectElement} product */
	private GetSelectedProduct(product: HTMLSelectElement){
		return this.data.products.find(({ id }) => id === Number(product.value))
	}
	private ChangeProductIds({ element }: ProductElement, parentContainer?: HTMLDivElement){
		const { productsContainer } = this.elements
		const productsContainers = Array.from(productsContainer.querySelectorAll(".product"))

		parentContainer ??= productsContainers.find(container => container.contains(element)) as HTMLDivElement

		for(const label of parentContainer.querySelectorAll("label")){
			const id = label.htmlFor
			const newId = `${id}-${this.#productId}`
			const element = parentContainer.querySelector<HTMLInputElement>(`#${id}`)!

			element.id = newId
			label.htmlFor = newId
		}
	}
}
