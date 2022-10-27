# Freight Simulator

<div align="center">
	<a href="https://github.com/Alphka/Freight-Simulator">
		<img src="https://raw.githubusercontent.com/Alphka/Freight-Simulator/main/src/public/images/truck_logo_squared.png" alt="Logotipo da empresa Alphka" height="140">
	</a>
	<h5>
		Protótipo de site para calcular fretes requisitado pelo Senai
		<br>
		Criado para a empresa fictícia Alphka
	</h5>
</div>

<br>

<p align="center">
	<a href="https://github.com/Alphka/Freight-Simulator/releases">
		<img alt="GitHub release" src="https://img.shields.io/github/v/release/Alphka/Freight-Simulator?color=%235271FF&label=%C3%9Altima%20Vers%C3%A3o&style=for-the-badge&sort=semver">
	</a>
	<a href="LICENSE">
		<img alt="Licença" src="https://img.shields.io/github/license/Alphka/Freight-Simulator?color=%235271FF&style=for-the-badge&label=Licen%C3%A7a">
	</a>
</p>

## Como funciona
![Captura de tela](https://user-images.githubusercontent.com/71673694/198061750-a6fb2991-6598-4914-ab70-21c77cb31144.png)

Na página inicial, é requisitado ao usuário alguns dados pessoais para
identificação, os dados do produto desejado e o endereço de destino
da entrega.

![Captura de tela](https://user-images.githubusercontent.com/71673694/198064125-6b2844df-694c-4533-a336-0522d61764c7.png)

Após os dados serem enviados, o site calcula, usando as informações
dos produtos, a distância entre a origem e o destino da entega, entre
outras informações, o preço do frete da entrega.

## Cálculo do Frete
- Custo da distância: `Custo por Quilômetro × Distância`
- Custo do seguro: `30% × Preço dos produtos`
- Custo do pedágio (se houver): `Preço do pedágio × Quantidade de caminhões`
- Custo da cubagem: `Volume/Fator de cubagem × Preço por tonelada`

O resultado final é a soma de todas as equações anteriores, e o preço do serviço.

## Instalação
##### Instale as dependências do projeto
```npm install```

##### Compile o código para uma pasta local
```npm run build```

O arquivo `index.html` estará localizado na pasta `build`.

> **Note**
> O arquivo pode não funcionar corretamente pois alguns
> navegadores não permitem a execução de scripts com o atributo
> `type="module"`, nesse caso, será necessário o uso de um servidor.
> 
> Projeto para criação de servidores usando Node.js: [Alphka/Simple-HTTP-Server](https://github.com/Alphka/Simple-HTTP-Server)
