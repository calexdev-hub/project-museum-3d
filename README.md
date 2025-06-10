# Artefato Complementar — SBIE 2025

Este repositório contém o artefato digital complementar ao artigo submetido ao Simpósio Brasileiro de Informática na Educação (SBIE 2025).

O projeto apresenta dois ambientes virtuais tridimensionais interativos, acessíveis via navegador: um museu virtual e uma praça pública com elementos artísticos. Ambos os cenários foram desenvolvidos com tecnologias web e a biblioteca Three.js, com o objetivo de promover experiências imersivas voltadas à educação.

> **Observação:** Este repositório foi anonimizado para fins de avaliação científica. Nenhuma informação de identificação pessoal está presente nos arquivos.

---

## Estrutura do Projeto

```
project-museum-3d/
├── index.html        # Museu Virtual (ambiente interno)
├── praca.html        # Praça 3D (ambiente externo)
├── css/              # Estilos utilizados nos cenários
├── js/               # Scripts responsáveis pela lógica e renderização
├── assets/           # Texturas, imagens e modelos 3D
└── README.md         # Este documento
```

---

## Instruções de Execução

Para garantir o funcionamento correto, recomenda-se executar o projeto em um servidor local. Abaixo estão duas formas recomendadas:

### Opção 1: Visual Studio Code com Live Server

1. Instale a extensão **Live Server** no Visual Studio Code.
2. Abra a pasta do projeto.
3. Clique com o botão direito em `index.html` ou `praca.html`.
4. Selecione **"Open with Live Server"**.
5. O ambiente será aberto no navegador automaticamente.

### Opção 2: Utilizando Node.js e http-server

1. Instale o `http-server` (caso não tenha):

   ```
   npm install -g http-server
   ```

2. Navegue até a raiz do projeto no terminal e execute:

   ```
   http-server .
   ```

3. No navegador, acesse:

   ```
   http://localhost:8080/index.html
   ```

   ou

   ```
   http://localhost:8080/praca.html
   ```

---

## Ambientes Disponíveis

- **Museu Virtual (`index.html`)**: ambiente interno com navegação livre e exibição de obras digitais.
- **Praça 3D (`praca.html`)**: ambiente externo com esculturas e vegetação modeladas para visualização interativa.

---

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript
- WebGL
- Biblioteca Three.js

---

## Considerações

- O projeto não depende de bibliotecas externas carregadas via CDN.
- Todo o conteúdo está incluído no repositório.
- Testado nos principais navegadores modernos: Chrome, Firefox e Edge.

---

## Licença

Este repositório é disponibilizado exclusivamente para fins de **avaliação científica** no contexto do SBIE 2025. A reprodução ou redistribuição não é permitida durante o processo de revisão.
