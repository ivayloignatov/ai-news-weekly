# AGENTS.md — ai-news-weekly

Personal AI briefing, published Tuesday and Friday (since 2026-11-25; weekly
before). Two Claude routines (same prompt, versioned in `ROUTINE-PROMPT.md`)
fill `_template.html` -> `index.html` (current issue), archive the previous
issue to `archiv/YYYY-MM-DD-ddd.html` (older weekly issues: `archiv/YYYY-kwNN.html`),
and push to a `claude/**` branch.

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

- **Generation** (Tuesday and Friday, ~06:30 Berlin): `index.html` is built from `_template.html`. Every
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
  "issueDate": "2026-12-01",        // Berlin date of "generated" (added 2026-11-25)
  "kw": 22, "year": 2026,
  "period": "25. - 31. Mai 2026",   // Masthead <b>...</b>
  "generated": "2026-06-01T07:00:00", // ISO (local), from footer "Generiert: ..."
  "prevHref": "archiv/2026-kw21.html",
  "summary":  [{ "text": "...", "href": "#act-01" }],   // .brief li (optional)
  "rollouts": [{ "text": "...", "href": "https://..." }], // .rollouts li (optional)
  "categoryCount": 6, "itemCount": 22,
  "labs": [
    {
      "id": "anthropic",            // <section class="lab" id="...">
      "name": "Anthropic",          // .lab-name
      "color": "#b5512f",           // style --c:#...
      "count": 4,
      "items": [
        {
          "id": "act-01",           // article id (null in older issues)
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
- The newsletter mail is rendered from `data.json` by `scripts/build-email.mjs`
  (inline styles; Gmail strips the site's CSS). `issue-watchdog.yml` fails on
  Tue/Fri 10:00 Berlin if `data.json` is not today's issue.
- Secrets (Resend) only via GitHub Actions secrets, never in the repo.
