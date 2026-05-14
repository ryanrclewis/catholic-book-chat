# Catholic Book Chat

A responsive Catholic Book Chat podcast website built with [vinext](https://github.com/cloudflare/vinext).

## Pages

- Home (`/`)
- Episodes index (`/episodes`)
- Episode slug pages with Podbean embeds + show notes (`/episodes/[slug]`)
- About (`/about`)
- Donate (`/donate`)

## Development

> vinext currently requires Node.js 22+

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run start
```

## Cloudflare Pages

Use:

- **Build command:** `npm run build`
- **Build output directory:** `dist/client`

The app includes a `_redirects` file in the generated output for route handling.
