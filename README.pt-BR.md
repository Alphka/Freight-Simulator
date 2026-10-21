# Freight Simulator

[English](README.md) | **Português (Brasil)**

<div align="center">
	<a href="https://github.com/Alphka/Freight-Simulator">
		<img src="src/public/images/truck_logo_squared.png" alt="Logotipo da empresa Alphka" height="140">
	</a>
	<h5>
		Protótipo de site para calcular fretes requisitado pelo Senai
		<br>
		Criado para a empresa fictícia Alphka
	</h5>
</div>

<br>

<p align="center">
	<a href="https://github.com/Alphka/Freight-Simulator/actions/workflows/npm-gulp.yml">
		<img alt="Build" src="https://img.shields.io/github/actions/workflow/status/Alphka/Freight-Simulator/npm-gulp.yml?branch=main&style=for-the-badge&label=Build">
	</a>
	<a href="LICENSE.md">
		<img alt="Licença: ISC" src="https://img.shields.io/badge/Licen%C3%A7a-ISC-5271FF?style=for-the-badge">
	</a>
</p>

## Descrição

Um site estático, escrito em TypeScript, que simula o preço do frete de um pedido para a empresa fictícia Alphka. Foi criado como protótipo requisitado pelo Senai (trabalho de curso). A interface é em português do Brasil.

## Como funciona

![Captura de tela do formulário do pedido](https://user-images.githubusercontent.com/71673694/198061750-a6fb2991-6598-4914-ab70-21c77cb31144.png)

Na página inicial, é requisitado ao usuário alguns dados pessoais para identificação, os dados dos produtos desejados e o endereço de destino da entrega.

![Captura de tela da página de resultado do frete](https://user-images.githubusercontent.com/71673694/198064125-6b2844df-694c-4533-a336-0522d61764c7.png)

Após os dados serem enviados, o site calcula o preço do frete usando as informações dos produtos, a distância entre a origem e o destino da entrega, entre outras informações. O formulário é enviado com o método `GET` para `fullfilled.html`, que lê os valores pela URL; não há backend.

## Funcionalidades

- Formulário de pedido com vários produtos (camisa, calça, vestido e jaqueta), cada um com tamanho e quantidade.
- Seleção da cidade de destino entre as cadastradas no projeto (Montes Claros, Mirabela, Bocaiúva e São Francisco).
- Validação do formulário, incluindo o CEP da cidade escolhida. Para Montes Claros, o CEP é consultado na API do [ViaCEP](https://viacep.com.br).
- Página de resultado com o endereço, os produtos, o detalhamento do frete e o preço total.

## Cálculo do frete

- Custo da distância: `Custo por Quilômetro × Distância`
- Custo do seguro: `30% × Preço dos produtos`
- Custo do pedágio (se houver): `Preço do pedágio × Quantidade de caminhões`
- Custo da cubagem: `Volume / Fator de cubagem × Preço por tonelada`

O preço final do frete é a soma de todos os custos anteriores com o preço mínimo do serviço. Quando o espaço cúbico do pedido excede o do caminhão, a quantidade de caminhões é aumentada e o preço do serviço e o pedágio são multiplicados por ela. O total exibido é o preço dos produtos somado ao frete.

## Tecnologias

- [TypeScript](https://www.typescriptlang.org/) (compilado como módulos ES para o navegador)
- [Sass](https://sass-lang.com/) para os estilos
- [Gulp](https://gulpjs.com/) para o build (`gulp-typescript`, `gulp-sass` e `gulp-uglify`)
- [Bootstrap 3.4.1](https://getbootstrap.com/docs/3.4/) (carregado pela CDN do jsDelivr)
- [IMask](https://imask.js.org/) para máscaras de campos (carregado pela CDN do unpkg)

## Requisitos

- [Node.js](https://nodejs.org/) e npm, nas versões Node.js `22.23.4`, `24.22.1` ou `26.x` (`26.3.0` e `26.12.1` foram testadas). O workflow de CI compila o projeto com `22.23.4`, `24.22.1` e `26.12.1`.
- Acesso à internet ao abrir o site, pois Bootstrap, IMask e ViaCEP são carregados de serviços externos.

## Instalação

Instale as dependências do projeto:

```sh
npm install
```

## Uso

Compile o site para a pasta local `build`:

```sh
npm run build
```

O arquivo `index.html` estará localizado na pasta `build`.

> [!NOTE]
> O arquivo pode não funcionar corretamente ao ser aberto diretamente, pois alguns navegadores não permitem a execução de scripts com o atributo `type="module"` a partir de arquivos locais. Nesse caso, será necessário o uso de um servidor.
>
> Projeto para criação de servidores usando Node.js: [Alphka/Simple-HTTP-Server](https://github.com/Alphka/Simple-HTTP-Server)

### Scripts

| Script | Descrição |
| --- | --- |
| `npm run build` | Compila páginas, arquivos públicos, scripts e estilos para `build` |
| `npm run watch` | Compila e recompila a cada alteração em `src` (não inicia um servidor) |
| `npm run typecheck` | Verifica os tipos do gulpfile e dos fontes TypeScript sem gerar arquivos |

## Estrutura do projeto

```text
src/
├── pages/      Páginas HTML (index.html e fullfilled.html)
├── public/     Imagens e web manifest
├── scripts/    Código TypeScript (inclui data.ts com cidades, produtos e preços)
├── styles/     Estilos em Sass
└── typings/    Declarações de tipos
gulpfile.js     Tarefas de build
```

## Testes

O projeto não possui testes automatizados.

## Licença

Este projeto está licenciado sob a [Licença ISC](LICENSE.md).
