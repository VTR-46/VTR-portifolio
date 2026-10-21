# VTR · Portfólio de Victor Ricardo

Landing page estática em HTML, CSS e JavaScript. A abertura desenha o contorno da logo VTR e revela a marca original. No desktop, a apresentação acompanha a rolagem; em telas menores, a foto e o texto aparecem em sequência. As animações usam uma linha de quadros Hyperframes local em `js/hyperframes.js`, sem serviço externo.

## Prévia local

Com Node.js instalado, execute `npm run preview` e abra `http://127.0.0.1:4173/`. O servidor usa apenas módulos nativos do Node e lê os arquivos do projeto.

## Preencher o projeto

Edite o objeto `PROJECT` no início de `js/portfolio.js`:

```js
var PROJECT = {
  title: 'Nome do projeto',
  description: 'Descrição curta do projeto.',
  video: 'data/projetos/video.mp4',
  images: [
    { src: 'data/projetos/01.webp', alt: 'Descrição da imagem 01' },
    { src: 'data/projetos/02.webp', alt: 'Descrição da imagem 02' },
    { src: 'data/projetos/03.webp', alt: 'Descrição da imagem 03' },
    { src: 'data/projetos/04.webp', alt: 'Descrição da imagem 04' }
  ],
  repository: 'https://github.com/usuario/repositorio'
};
```

Coloque os arquivos nos caminhos informados. Campos vazios mantêm os espaços de mídia e o aviso de repositório pendente; mídias que falharem ao carregar também voltam a exibir o espaço correspondente. Descreva cada imagem no `alt`.
O status muda para “Publicado” quando o vídeo, as quatro imagens e o link do repositório estiverem preenchidos.

## Verificação

Execute `npm test`. O site mostra o conteúdo sem JavaScript ou com a preferência por movimento reduzido, e a introdução tem um botão para pular.
