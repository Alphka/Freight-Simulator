import type { FactoryOpts, InputMask } from "imask"
import type { City, Elements, ProductElement } from "../typings/index"
import IMask from "imask"
import requireElement from "./helpers/requireElement"
import Data from "./data"

const requiredFieldMessage = "Este campo é obrigatório"
const autofillSelector = ":autofill"

/** Validity states that make the field invalid, except `customError` (which is set by this script) */
const validityErrors = [
	"badInput",
	"patternMismatch",
	"rangeOverflow",
	"rangeUnderflow",
	"stepMismatch",
	"tooLong",
	"tooShort",
	"typeMismatch",
	"valueMissing"
] as const satisfies (keyof ValidityState)[]

/** Error with a message that can be shown to the user */
class CepError extends Error {}

function isValidIgnoringCustomError(validity: ValidityState){
	return validityErrors.every(key => !validity[key])
}

function setValidity(element: HTMLElement, valid: boolean){
	element.classList.toggle("is-valid", valid)
	element.classList.toggle("is-invalid", !valid)
}

function clearValidity(element: HTMLElement){
	element.classList.remove("is-valid", "is-invalid")
}

function clearErrorAttributes(element: HTMLElement){
	element.removeAttribute("aria-invalid")
}

function getCepMaskOptions({ imaskConfig }: City){
	if(!imaskConfig) return { mask: "00000-000", lazy: true } as FactoryOpts

	const blocks = imaskConfig.blocks && Object.fromEntries(Object.entries(imaskConfig.blocks).map(([name, block]) => {
		if(block.mask) return [name, block]
		if(block.enum) return [name, { ...block, mask: IMask.MaskedEnum }]
		if(block.from !== undefined || block.to !== undefined) return [name, { ...block, mask: IMask.MaskedRange }]
		return [name, block]
	}))

	return { lazy: false, ...imaskConfig, blocks } as FactoryOpts
}

class Index {
	private elements: Elements
	private data = Data

	#showEmailError = false
	#showCepError = false
	#productId = 0
	#productClone: HTMLDivElement
	#cepMask!: InputMask<FactoryOpts>
	#cepRequest?: AbortController

	constructor(){
		this.elements = this.getElements()

		const { clientName, email, city: cityElement, products: [productElement] } = this.elements
		const { cities, products } = this.data

		for(const { id, name } of cities) this.addOption(cityElement, { id, name })
		for(const { id, name } of products) this.addOption(productElement.element, { id, name })

		this.#productClone = productElement.container.cloneNode(true) as HTMLDivElement
		this.changeProductIds(productElement)
		this.addEventListeners()

		this.displayError(clientName, "Insira um nome válido")
		this.displayError(email, "Insira um email válido")

		productElement.sizesDatalist.id = `sizes-${this.#productId}`
		productElement.sizeElement.setAttribute("list", `sizes-${this.#productId}`)

		this.setSizePattern(productElement)
		this.changeSizeDatalist(productElement)
		this.changeCepPattern(this.selectedCity.cep)

		this.#productId++
	}
	private getElements(): Elements {
		const form = requireElement<HTMLFormElement>("form")
		const product = requireElement<HTMLSelectElement>("select#product", form)
		const productsContainer = product.closest("fieldset")!
		const productContainer = requireElement<HTMLDivElement>(".product", productsContainer)

		return {
			form,
			clientName: requireElement<HTMLInputElement>("input#name", form),
			email: requireElement<HTMLInputElement>("input#email", form),
			city: requireElement<HTMLSelectElement>("select#city", form),
			cep: requireElement<HTMLInputElement>("input#cep", form),
			district: requireElement<HTMLInputElement>("input#district", form),
			street: requireElement<HTMLInputElement>("input#street", form),
			houseNumber: requireElement<HTMLInputElement>("input#houseNumber", form),
			complement: requireElement<HTMLInputElement>("input#complement", form),
			productsContainer,
			products: [
				{
					container: productContainer,
					element: product,
					sizeElement: requireElement<HTMLInputElement>("input#productSize", productContainer),
					quantityElement: requireElement<HTMLInputElement>("input#quantity", productContainer),
					sizesDatalist: requireElement<HTMLDataListElement>("datalist", productContainer)
				}
			],
			addProduct: requireElement<HTMLButtonElement>("button#addProduct", form)
		}
	}
	private get selectedCity(){
		const { elements: { city }, data: { cities } } = this
		return cities.find(({ id }) => id === Number(city.value)) ?? cities[0]
	}
	private addEventListeners(){
		const [firstProduct] = this.elements.products

		this.nameListeners()
		this.emailListeners()
		this.streetListeners()
		this.cepListeners()
		this.productListeners(firstProduct)

		this.elements.addProduct.addEventListener("click", () => this.addProduct())
	}
	private nameListeners(){
		const { clientName } = this.elements

		clientName.addEventListener("change", () => {
			const { validity } = clientName
			const value = clientName.value.trim()

			// If not empty
			if(validity.valid){
				// A full name has at least two words
				if(value.includes(" ")) setValidity(clientName, true)
				else clientName.dispatchEvent(new Event("invalid"))
			}else setValidity(clientName, false)
		})
	}
	private emailListeners(){
		const { email } = this.elements

		email.addEventListener("input", () => {
			if(!this.#showEmailError && email.value.includes("@")) this.#showEmailError = true
			if(this.#showEmailError) setValidity(email, email.validity.valid)
		})

		email.addEventListener("change", () => {
			this.#showEmailError = true
			setValidity(email, email.validity.valid)
		})
	}
	private streetListeners(){
		const { street, houseNumber, complement } = this.elements
		const houseNumberMask = IMask(houseNumber, { mask: "000000" })

		street.addEventListener("change", () => {
			const { value } = street

			if(!street.matches(autofillSelector) || !value.includes(",")) return

			const [streetName, data] = value.split(",")
			const number = data.match(/(?<number>\d+)[ -]?(?<complement>\w)?/i)?.groups

			if(!number?.number) return

			street.value = streetName.trim()
			houseNumberMask.value = number.number.trim()

			if(number.complement) complement.value = number.complement
		})
	}
	private cepListeners(){
		const { cep, city } = this.elements

		this.removeInputCustomValidation(cep)
		this.createCepMask()

		cep.addEventListener("change", () => void this.validateCep())

		cep.addEventListener("invalid", () => {
			if(!cep.value.trim()) this.displayError(cep, requiredFieldMessage, true)
			this.#showCepError = true
		})

		city.addEventListener("change", () => {
			this.#cepRequest?.abort()
			this.#cepMask.destroy()

			cep.value = ""
			cep.setCustomValidity("")
			clearValidity(cep)

			this.createCepMask()
			this.changeCepPattern(this.selectedCity.cep)
		})
	}
	private createCepMask(){
		const { cep } = this.elements

		this.#cepMask = IMask(cep, getCepMaskOptions(this.selectedCity))

		// * Analyse input after IMask changes the input's value
		this.#cepMask.on("accept", () => {
			const value = cep.value.trim()

			if(!value) return clearValidity(cep)

			if(this.#showCepError) setValidity(cep, isValidIgnoringCustomError(cep.validity))
			else if(value.includes("-")) this.#showCepError = true
			else clearValidity(cep)
		})
	}
	private async validateCep(){
		const { cep, street, city } = this.elements
		const value = cep.value.trim()

		this.#cepRequest?.abort()

		if(!value) return clearValidity(cep)
		if(!cep.validity.valid) return this.displayError(cep, "Insira um CEP válido", true)

		const { cep: cityCep, name } = this.selectedCity

		// Cities with a list of CEPs are already validated by the input pattern
		if(typeof cityCep !== "string") return

		const controller = this.#cepRequest = new AbortController

		try{
			const address = await this.fetchCep(value, name, controller.signal)

			// * Do not overwrite what the browser autofilled
			if(!street.matches(autofillSelector) && !city.matches(autofillSelector)){
				this.elements.district.value = address.district
				this.elements.street.value = address.street
			}

			setValidity(cep, true)
		}catch(error){
			if(controller.signal.aborted) return

			if(error instanceof CepError) return this.displayError(cep, error.message, true)

			console.error(error)
			this.displayError(cep, "Houve um erro na pesquisa do CEP", true)
		}
	}
	private async fetchCep(cep: string, cityName: string, signal: AbortSignal){
		const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
			headers: { Accept: "application/json" },
			referrerPolicy: "no-referrer",
			credentials: "omit",
			mode: "cors",
			cache: "force-cache",
			signal
		})

		if(!response.ok) throw new Error(`ViaCEP responded with status ${response.status}`)

		const { erro, localidade, logradouro, bairro, uf } = await response.json()

		if(erro) throw new CepError("CEP não encontrado")
		if(uf !== "MG") throw new CepError("O CEP inserido pertence a outro estado")
		if(cityName !== localidade) throw new CepError("O CEP não pertence à cidade selecionada")

		return { street: logradouro as string, district: bairro as string }
	}
	private removeInputCustomValidation(input: HTMLInputElement){
		input.addEventListener("input", () => {
			const { validity } = input
			let { valid } = validity

			// Has errors
			if(!valid){
				// Has only a customError
				if(isValidIgnoringCustomError(validity)) valid = true
				// Remove default error message
				else input.setCustomValidity(" ")
			}

			if(valid) clearErrorAttributes(input)

			setValidity(input, valid)
		})

		input.addEventListener("change", () => {
			const { validity } = input

			if(validity.customError){
				input.setCustomValidity("")
				setValidity(input, validity.valid)
			}
		})
	}
	private changeSizeDatalist({ element, sizesDatalist }: ProductElement){
		const { letters, numbers } = this.data.productsSizes
		const { sizeType } = this.getSelectedProduct(element)!
		const { dataset } = sizesDatalist

		if(dataset.type === sizeType) return

		sizesDatalist.replaceChildren()

		for(const size of Object.keys(sizeType === "letter" ? letters : numbers)) this.addOption(sizesDatalist, size)

		dataset.type = sizeType
	}
	private productListeners(product: ProductElement){
		const { element, sizeElement } = product
		const { letters, numbers } = this.data.productsSizes

		this.removeInputCustomValidation(sizeElement)

		const validateSize = () => {
			sizeElement.value = sizeElement.value.trim()

			const { value } = sizeElement

			if(!value) return this.displayError(sizeElement, requiredFieldMessage, true)

			if(!Object.keys(letters).includes(value.toUpperCase()) && !Object.keys(numbers).includes(value)){
				this.displayError(sizeElement, "Insira um tamanho válido", true)
				return setValidity(sizeElement, false)
			}

			const { sizeType } = this.getSelectedProduct(element)!
			const valid = sizeType === "number" ? /^\d+$/.test(value) : /^[a-z]+$/i.test(value)

			setValidity(sizeElement, valid)

			if(!valid) this.displayError(sizeElement, "Tamanho inválido para o produto", true)
		}

		element.addEventListener("change", () => {
			this.setSizePattern(product)
			this.changeSizeDatalist(product)

			if(sizeElement.value.trim()) validateSize()
			else clearValidity(sizeElement)
		})

		sizeElement.addEventListener("change", validateSize)
	}
	private addProduct(){
		const { products } = this.elements

		const container = this.#productClone.cloneNode(true) as HTMLDivElement

		const product: ProductElement = {
			container,
			element: requireElement<HTMLSelectElement>("#product", container),
			sizeElement: requireElement<HTMLInputElement>("#productSize", container),
			quantityElement: requireElement<HTMLInputElement>("#quantity", container),
			sizesDatalist: requireElement<HTMLDataListElement>("datalist", container)
		}

		product.sizesDatalist.id = `sizes-${this.#productId}`
		product.sizeElement.setAttribute("list", `sizes-${this.#productId}`)

		this.changeProductIds(product, container)
		this.changeSizeDatalist(product)
		this.productListeners(product)

		products.at(-1)!.container.after(container)
		products.push(product)

		this.#productId++
	}
	private changeCepPattern(ceps: City["cep"]){
		const { cep } = this.elements

		if(Array.isArray(ceps)){
			if(ceps.length === 1){
				const [uniqueCep] = ceps

				cep.pattern = uniqueCep
				this.#cepMask.value = uniqueCep
				cep.dispatchEvent(new Event("change"))
			}else cep.pattern = ceps.join("|")
		}else cep.pattern = ceps.replace(/x/gi, "\\d")
	}
	private displayError(element: HTMLInputElement, message: string = requiredFieldMessage, once = false){
		const events = ["input", "change"] as const

		const clearError = () => {
			element.setCustomValidity("")
			clearErrorAttributes(element)
			clearValidity(element)

			for(const event of events) element.removeEventListener(event, clearError)
		}

		const setError = () => {
			const errorMessage = element.value.trim() ? message : requiredFieldMessage

			element.setAttribute("aria-invalid", "true")
			element.setCustomValidity(errorMessage)
			setValidity(element, false)
		}

		if(once) return setError()

		element.setCustomValidity("")
		element.addEventListener("invalid", () => {
			setError()

			for(const event of events) element.addEventListener(event, clearError)
		})
	}
	private addOption(element: HTMLSelectElement | HTMLDataListElement, data: { id: number, name: string } | string | number){
		const option = document.createElement("option")

		if(typeof data === "object"){
			option.textContent = data.name
			option.value = data.id.toString()
		}else option.value = data.toString()

		element.append(option)

		return option
	}
	private setSizePattern({ element, sizeElement }: ProductElement){
		const { letters, numbers } = this.data.productsSizes
		const { sizeType } = this.getSelectedProduct(element)!

		sizeElement.pattern = Object.keys(sizeType === "letter" ? letters : numbers).join("|")
		sizeElement.setCustomValidity("")
	}
	private getSelectedProduct(product: HTMLSelectElement){
		return this.data.products.find(({ id }) => id === Number(product.value))
	}
	private changeProductIds({ element }: ProductElement, parentContainer?: HTMLDivElement){
		const { productsContainer } = this.elements

		parentContainer ??= Array.from(productsContainer.querySelectorAll<HTMLDivElement>(".product")).find(container => container.contains(element))!

		for(const label of parentContainer.querySelectorAll("label")){
			const id = label.htmlFor
			const newId = `${id}-${this.#productId}`

			parentContainer.querySelector<HTMLElement>(`#${id}`)!.id = newId
			label.htmlFor = newId
		}
	}
}

new Index
