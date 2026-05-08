# .

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Production API Configuration

The frontend uses `VITE_API_BASE_URL` as the API entry. Local development reads
`.env.development` and points to `http://localhost:3001/api`.

When deploying the frontend to Vercel, do not point the production build to
`localhost`. Either:

- configure `VITE_API_BASE_URL` in Vercel to a deployed backend URL, for example
  `https://api.example.com/api`;
- or keep the default `/api` and configure Vercel/API hosting to serve backend
  routes under the same domain.

### Production Data Persistence

The local backend uses SQLite at `server/data/developer.db`. Do not use SQLite
as the Vercel API database: Serverless writable paths are temporary, so product
and capability records can disappear after the function instance is recycled.

For Vercel API deployments, configure a persistent PostgreSQL connection:

```sh
DATABASE_URL=postgres://user:password@host:5432/database
```

`POSTGRES_URL`, `POSTGRES_PRISMA_URL`, or `POSTGRES_URL_NON_POOLING` are also
accepted. Hosted PostgreSQL uses SSL by default in Vercel; set `DB_SSL=false`
only for a trusted local PostgreSQL instance.

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
