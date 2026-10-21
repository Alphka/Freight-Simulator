# Freight Simulator

**English** | [Português (Brasil)](README.pt-BR.md)

<div align="center">
	<a href="https://github.com/Alphka/Freight-Simulator">
		<img src="src/public/images/truck_logo_squared.png" alt="Alphka company logo" height="140">
	</a>
	<h5>
		Website prototype that calculates freight prices, requested by SENAI
		<br>
		Created for the fictitious company Alphka
	</h5>
</div>

<br>

<p align="center">
	<a href="https://github.com/Alphka/Freight-Simulator/actions/workflows/npm-gulp.yml">
		<img alt="Build" src="https://img.shields.io/github/actions/workflow/status/Alphka/Freight-Simulator/npm-gulp.yml?branch=main&style=for-the-badge&label=Build">
	</a>
	<a href="LICENSE.md">
		<img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-5271FF?style=for-the-badge">
	</a>
</p>

## Description

A static website, written in TypeScript, that simulates the freight price of an order for the fictitious company Alphka. It was built as a prototype requested by SENAI (a course assignment). The interface is in Brazilian Portuguese.

## How it works

![Screenshot of the order form](https://user-images.githubusercontent.com/71673694/198061750-a6fb2991-6598-4914-ab70-21c77cb31144.png)

On the home page, the user provides some personal data for identification, the data of the desired products and the destination address of the delivery.

![Screenshot of the freight result page](https://user-images.githubusercontent.com/71673694/198064125-6b2844df-694c-4533-a336-0522d61764c7.png)

After the form is submitted, the site calculates the freight price using the product information, the distance between the origin and the delivery destination, among other data. The form is sent with the `GET` method to `fullfilled.html`, which reads the values from the URL; there is no backend.

## Features

- Order form with several products (shirt, pants, dress and jacket), each with its size and quantity.
- Selection of the destination city among the ones registered in the project (Montes Claros, Mirabela, Bocaiúva and São Francisco).
- Form validation, including the postal code (CEP) of the chosen city. For Montes Claros, the CEP is looked up in the [ViaCEP](https://viacep.com.br) API.
- Result page with the address, the products, the freight breakdown and the total price.

## Freight calculation

- Distance cost: `Cost per kilometer × Distance`
- Insurance cost: `30% × Products price`
- Toll cost (if any): `Toll price × Number of trucks`
- Cubage cost: `Volume / Cubage factor × Price per ton`

The final freight price is the sum of all the previous costs and the minimum service price. When the cubic space of the order exceeds the truck's, the number of trucks is increased and the service price and the toll are multiplied by it. The total shown is the products price plus the freight.

## Tech stack

- [TypeScript](https://www.typescriptlang.org/) (compiled as ES modules for the browser)
- [Sass](https://sass-lang.com/) for the styles
- [Gulp](https://gulpjs.com/) for the build (`gulp-typescript`, `gulp-sass` and `gulp-uglify`)
- [Bootstrap 3.4.1](https://getbootstrap.com/docs/3.4/) (loaded from the jsDelivr CDN)
- [IMask](https://imask.js.org/) for input masks (loaded from the unpkg CDN)

## Requirements

- [Node.js](https://nodejs.org/) and npm, on Node.js `22.23.4`, `24.22.1` or `26.x` (`26.3.0` and `26.12.1` were tested). The CI workflow builds the project on `22.23.4`, `24.22.1` and `26.12.1`.
- Internet access when opening the site, since Bootstrap, IMask and ViaCEP are loaded from external services.

## Installation

Install the project dependencies:

```sh
npm install
```

## Usage

Build the site into the local `build` folder:

```sh
npm run build
```

The `index.html` file will be located in the `build` folder.

> [!NOTE]
> The file may not work properly when opened directly, because some browsers do not allow running scripts with the `type="module"` attribute from local files. In that case, a server is needed.
>
> A project to create servers with Node.js: [Alphka/Simple-HTTP-Server](https://github.com/Alphka/Simple-HTTP-Server)

### Scripts

| Script | Description |
| --- | --- |
| `npm run build` | Builds the pages, public files, scripts and styles into `build` |
| `npm run watch` | Builds, then rebuilds on changes in `src` (it does not start a server) |

## Project structure

```text
src/
├── pages/      HTML pages (index.html and fullfilled.html)
├── public/     Images and web manifest
├── scripts/    TypeScript source (including data.ts with cities, products and prices)
├── styles/     Sass stylesheets
└── typings/    Type declarations
gulpfile.js     Build tasks
```

## Tests

The project has no automated tests.

## License

This project is licensed under the [ISC License](LICENSE.md).
