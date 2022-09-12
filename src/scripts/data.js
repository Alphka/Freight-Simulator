/** @type {import("../typings/index").Data} */
export default {
	freightPrice: 110,
	freightMinimumPrice: 23e2,
	cities: [
		{
			id: 0,
			name: "Montes Claros",
			cep: "394xx-xxx",
			imaskConfig: {
				mask: "{394}00-000"
			},
			distance: 7.3e3
		},
		{
			id: 1,
			name: "Mirabela",
			cep: [
				"39373-000",
				"39420-000"
			],
			imaskConfig: {
				mask: "{39}ABC-\\0\\0\\0",
				blocks: {
					A: {
						enum: ["3", "4"]
					},
					B: {
						enum: ["7", "2"]
					},
					C: {
						enum: ["3", "\\0"]
					}
				}
			},
			distance: 66.7e3
		},
		{
			id: 2,
			name: "Bocaiúva",
			cep: ["39390-000"],
			distance: 48.1e3,
			toll: {
				price: 7.2e2
			}
		},
		{
			id: 3,
			name: "São Francisco",
			cep: ["39300-000"],
			distance: 162.3e3
		}
	],
	products: [
		{
			id: 0,
			name: "Camisa",
			price: 55e2,
			sizeType: "letter"
		},
		{
			id: 1,
			name: "Calça",
			price: 60e2,
			sizeType: "number"
		},
		{
			id: 2,
			name: "Vestido",
			price: 70e2,
			sizeType: "letter"
		},
		{
			id: 3,
			name: "Jaqueta",
			price: 85e2,
			sizeType: "letter"
		}
	],
	productsSizes: {
		letters: {
			"PP": {
				width: 37,
				height: 57
			},
			"P": {
				width: 39,
				height: 59
			},
			"M": {
				width: 61,
				height: 42
			},
			"G": {
				width: 45,
				height: 63
			},
			"GG": {
				width: 46,
				height: 65
			},
			"XGG": {
				width: 114,
				height: 76
			}
		},
		numbers: {
			38: {
				width: 104,
				height: 108
			},
			40: {
				width: 108,
				height: 109
			},
			42: {
				width: 112,
				height: 110
			},
			44: {
				width: 116,
				height: 111
			},
			46: {
				width: 120,
				height: 112
			},
			48: {
				width: 124,
				height: 113
			}
		},
		customSizePrice: 200
	},
	truck: {
		capacity: 14e3,
		dimensions: {
			width: 2.5e2,
			height: 2.5e2,
			length: 7.5e2,
			get cubicSpace(){
				return this.length * this.width * this.height
			}
		},
		pricePerTon: 14e2 // 14 Real per ton
	},
	boxDefault: {
		quantity: 30,
		dimensions: {
			width: 31,
			height: 10.3,
			length: 22.8,
			get cubicSpace(){
				return this.length * this.width * this.height
			}
		}
	}
}
