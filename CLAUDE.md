# CLAUDE.md — ai-news-weekly

Wöchentlicher, kuratierter KI-News-Digest. Eine Claude-Routine füllt
`_template.html` → `index.html` (aktuelle Ausgabe), archiviert die Vorwoche nach
`archiv/YYYY-kwNN.html`, pusht auf einen `claude/**`-Branch.

## Pipeline

```
Claude-Routine (claude/**-Branch)
   → automerge-claude.yml: merge → main, regeneriert data.json, push
   → newsletter.yml: mailt index.html via Resend (ainews@keramikcenter.com)
   → Coolify: deployt main static → https://ainews.keramikcenter.com
```

- **Generierung** (Montag): `index.html` aus `_template.html`. Belegpflicht: jede
  Meldung braucht ≥1 datierte Quelle, sonst keine Aufnahme.
- **Versand/Deploy** laufen automatisch über die zwei Workflows + Coolify. Ein
  `GITHUB_TOKEN`-Push triggert keine `on:push`-Workflows (Loop-Schutz) — darum
  triggert `automerge-claude.yml` den Newsletter explizit via `gh workflow run`.

## data.json (Maschinen-Contract — NICHT brechen)

Konsumenten (z. B. das horde-summit-Dashboard, `/news`) lesen **`data.json`**,
nicht das HTML. `data.json` wird in `automerge-claude.yml` deterministisch aus
`index.html` abgeleitet (`scripts/html-to-data.mjs`, zero-dependency Parser).

Wenn die Generierungs-Routine `data.json` künftig **nativ** mit-schreibt, MUSS es
exakt diesem Schema folgen (der CI-Parser wird dann zum Validator):

```jsonc
{
  "schemaVersion": 1,
  "kw": 22, "year": 2026,
  "period": "25. – 31. Mai 2026",   // Masthead <b>…</b>
  "generated": "2026-06-01T07:00:00", // ISO (lokal), aus Footer "Generiert: …"
  "prevHref": "archiv/2026-kw21.html",
  "categoryCount": 6, "itemCount": 22,
  "labs": [
    {
      "id": "anthropic",            // <section class="lab" id="…">
      "name": "Anthropic",          // .lab-name
      "color": "#b5512f",           // style --c:#…
      "count": 4,
      "items": [
        {
          "num": 1,                 // .inum (null bei featured)
          "featured": false,        // class "item featured"
          "tag": "Modell-Release",  // .tag
          "headline": "…",          // <h3>
          "lede": "…",              // .lede
          "detail": "… | null",     // .detail (optional)
          "sources": [              // .sources a.src
            { "name": "CNBC", "url": "https://…", "date": "28.05.2026" }
          ]
        }
      ]
    }
  ]
}
```

**Template-Struktur stabil halten:** Der Parser matcht die Klassen oben
(`section.lab`, `article.item[.featured]`, `.tag/.lede/.detail/.sources/.src/.src-date`,
`.lab-name`, `.mast-meta <b>`, Footer "Generiert:"). Strukturänderungen am Template
müssen `scripts/html-to-data.mjs` nachziehen — sonst failt der CI-Schritt (gewollt:
sichtbarer Bruch statt stilles leeres data.json).

## Konventionen

- Conventional Commits. Kein Force-Push, kein `--no-verify`.
- Secrets (Resend) nur via GitHub Actions Secrets, nie im Repo.

## Aktive Stack-Module
@.automaton/stack-modules/secrets-bws/gotchas.md
