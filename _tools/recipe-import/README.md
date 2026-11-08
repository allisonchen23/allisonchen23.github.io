# Recipe import helper

A tiny Vercel function that fetches recipe pages for Recipe Studio
(`/recipe-studio/`). Recipe sites often block the free public services the
studio falls back to; a request from your own server is blocked far less often.

This folder starts with an underscore, so Jekyll leaves it out of the website.

## How it works

`GET /api/fetch?url=<recipe page>` returns that page's HTML. Recipe Studio then
reads the recipe out of it in the browser.

It only answers requests coming from:

- https://allisonchen.us, https://www.allisonchen.us
- https://allisonchen23.github.io
- http://localhost:4000 and http://127.0.0.1:4000 (local preview)

It only fetches public `http`/`https` pages by host name (no IP addresses,
`localhost` or internal names), gives up after 10 seconds, and refuses pages
over 5 MB. To allow another site, add it to `ALLOWED_ORIGINS` in `api/fetch.js`.

## Deploying

Deploy this folder as its own Vercel project (no build step, no framework),
for example named `recipe-import`. Then put its address into
`assets/js/recipe-studio.js`:

```js
var IMPORT_SERVICE = 'https://<your-project>.vercel.app/api/fetch?url={url}';
```

If the helper is ever down, Recipe Studio falls back to the public services
automatically, and "Paste recipe text" always works.
