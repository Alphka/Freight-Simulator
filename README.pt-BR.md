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
	<a href="https://github.com/Alphka/Freight-Simulator/actions/workflows/ci.yml">
		<img alt="Build" src="https://img.shields.io/github/actions/workflow/status/Alphka/Freight-Simulator/ci.yml?branch=main&style=for-the-badge&label=Build">
	</a>
	<a href="LICENSE.md">
		<img alt="Licença: ISC" src="https://img.shields.io/badge/Licen%C3%A7a-ISC-5271FF?style=for-the-badge">
	</a>
</p>

## Descrição

Um site estático, escrito em TypeScript, que simula o preço do frete de um pedido para a empresa fictícia Alphka. Foi criado como protótipo requisitado pelo Senai (trabalho de curso). A interface é em português do Brasil.

## Como funciona

![Captura de tela do formulário do pedido](docs/screenshot-form.png)

Na página inicial, é requisitado ao usuário alguns dados pessoais para identificação, os dados dos produtos desejados e o endereço de destino da entrega.

![Captura de tela da página de resultado do frete](docs/screenshot-result.png)

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
- [Vite](https://vite.dev/) para o servidor de desenvolvimento e o build (multi-página, com source maps)
- [Sass](https://sass-lang.com/) para os estilos
- [Bootstrap 5](https://getbootstrap.com/) (apenas as partes em Sass usadas pelo site, empacotadas pelo Vite)
- [IMask](https://imask.js.org/) para máscaras de campos (instalado pelo npm e empacotado)
- [pnpm](https://pnpm.io/) como gerenciador de pacotes

## Requisitos

- [Node.js](https://nodejs.org/) `22.23.4`, `24.22.1` ou `26.x` (`26.3.0` e `26.12.1` foram testadas). O workflow de CI compila o projeto com a versão mais recente do Node.js 22, 24 e 26.
- [pnpm](https://pnpm.io/) `11` ou `12`. A versão exata está fixada no campo `packageManager` do `package.json`, então ela é selecionada automaticamente.
- Acesso à internet ao usar a consulta de CEP, pois ela chama a API do ViaCEP. Bootstrap e IMask são empacotados junto com o site.

## Instalação

Instale as dependências do projeto:

```sh
pnpm install
```

## Uso

Inicie o servidor de desenvolvimento (com recarregamento automático):

```sh
pnpm dev
```

Compile o site para a pasta local `dist` e visualize o resultado:

```sh
pnpm build
pnpm preview
```

> [!NOTE]
> Os arquivos compilados usam scripts com `type="module"`, que os navegadores não executam a partir de arquivos locais (`file://`). Use `pnpm dev` ou `pnpm preview`, ou qualquer servidor estático.

### Scripts

| Script | Descrição |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento do Vite |
| `pnpm build` | Compila páginas, scripts e estilos para `dist`, com source maps |
| `pnpm preview` | Serve a pasta `dist` localmente |
| `pnpm typecheck` | Verifica os tipos da configuração do Vite e dos fontes TypeScript sem gerar arquivos |

## Navegadores suportados

Os navegadores suportados estão listados no campo `browserslist` do `package.json` (Chrome e Edge 111+, Firefox 114+, Safari e iOS 16.4+). Eles correspondem ao `build.target` padrão do Vite e também são usados para adicionar prefixos e minificar o CSS.

## Deploy

O site é estático e é publicado na [Vercel](https://vercel.com/). O arquivo [`vercel.json`](vercel.json) define o framework Vite e a pasta de saída `dist`, então as configurações do projeto no painel não precisam ser alteradas. A Vercel instala as dependências com pnpm por causa do `pnpm-lock.yaml`.

O arquivo também define cabeçalhos de cache de longa duração para os arquivos com hash em `/assets` e cabeçalhos de segurança, incluindo uma Content Security Policy que só permite o próprio site e a API do ViaCEP. Se o site passar a usar outro serviço externo, adicione a origem dele na diretiva correspondente (por exemplo `connect-src`) em `vercel.json`.

## Estrutura do projeto

```text
src/
├── public/          Arquivos copiados sem alteração para a raiz do build (imagens e web manifest)
├── scripts/         Código TypeScript (inclui data.ts com cidades, produtos e preços)
├── styles/          Estilos em Sass (main.scss importa as partes do Bootstrap em uso)
├── typings/         Declarações de tipos
├── index.html       Página do formulário do pedido
└── fullfilled.html  Página de resultado
docs/                Capturas de tela usadas neste README
vite.config.ts       Configuração do Vite
tsconfig.json       Configuração do TypeScript (um único projeto para o código e o config do Vite)
vercel.json          Configuração da Vercel
```

## Testes

O projeto não possui testes automatizados.

## Licença

Este projeto está licenciado sob a [Licença ISC](LICENSE.md).
