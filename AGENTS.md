# AGENTS.md — ai-news-weekly

Weekly, curated AI news digest. A Claude routine fills `_template.html` ->
`index.html` (current issue), archives the previous week to
`archiv/YYYY-kwNN.html`, and pushes to a `claude/**` branch.

Repo type: static content repo (HTML digest + a small Node build script + two
GitHub Actions workflows). No app server, no test framework, no build step
beyond the data-export script below.

## Pipeline

```
Claude routine (claude/**-branch)
   -> automerge-claude.yml: merge -> main, regenerates data.json, push
   -> newsletter.yml: mails index.html via Resend (ainews@keramikcenter.com)
   -> Coolify: deploys main as static site -> https://ainews.keramikcenter.com
```

- **Generation** (Monday): `index.html` is built from `_template.html`. Every
  news item needs at least one dated source, or it does not go in.
- **Send/deploy** run automatically via the two workflows plus Coolify. A
  `GITHUB_TOKEN` push does not trigger `on:push` workflows (loop guard), which
  is why `automerge-claude.yml` explicitly triggers the newsletter via
  `gh workflow run`.

## data.json (machine contract — do not break)

Consumers (e.g. the horde-summit dashboard, `/news`) read **`data.json`**, not
the HTML. `data.json` is derived deterministically from `index.html` inside
`automerge-claude.yml` (`scripts/html-to-data.mjs`, a zero-dependency parser).

If the generation routine is ever changed to write `data.json` natively, it
MUST follow exactly this schema (the CI parser then becomes the validator):

```jsonc
{
  "schemaVersion": 1,
  "kw": 22, "year": 2026,
  "period": "25. - 31. Mai 2026",   // Masthead <b>...</b>
  "generated": "2026-06-01T07:00:00", // ISO (local), from footer "Generiert: ..."
  "prevHref": "archiv/2026-kw21.html",
  "categoryCount": 6, "itemCount": 22,
  "labs": [
    {
      "id": "anthropic",            // <section class="lab" id="...">
      "name": "Anthropic",          // .lab-name
      "color": "#b5512f",           // style --c:#...
      "count": 4,
      "items": [
        {
          "num": 1,                 // .inum (null for featured)
          "featured": false,        // class "item featured"
          "tag": "Modell-Release",  // .tag
          "headline": "...",        // <h3>
          "lede": "...",            // .lede
          "detail": "... | null",   // .detail (optional)
          "sources": [              // .sources a.src
            { "name": "CNBC", "url": "https://...", "date": "28.05.2026" }
          ]
        }
      ]
    }
  ]
}
```

**Keep the template structure stable.** The parser matches the classes above
(`section.lab`, `article.item[.featured]`,
`.tag/.lede/.detail/.sources/.src/.src-date`, `.lab-name`, `.mast-meta <b>`,
footer "Generiert:"). Any template structure change must be followed by an
update to `scripts/html-to-data.mjs`, or the CI step fails (intentional: a
visible break beats a silently empty `data.json`).

## Conventions

- Conventional Commits. No force-push, no `--no-verify`.
- Secrets (Resend) only via GitHub Actions secrets, never in the repo.
