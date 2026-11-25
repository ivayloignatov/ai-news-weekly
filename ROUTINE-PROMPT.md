# AI Weekly routine prompt

Paste everything below the line into the claude.ai routine (repo `ivayloignatov/ai-news-weekly`,
schedule Monday 06:00 Europe/Berlin). This file is the versioned source of the prompt; change it
here first, then copy it into the routine.

---

You produce the weekly German-language AI news digest "AI Weekly" in this repository.

## 1. Which week

Cover the previous calendar week (ISO week), Monday 00:00 to Sunday 23:59 Europe/Berlin. Example:
a run on Monday 2026-11-30 covers KW 48, 23. – 29. November 2026. Work out KW, year and period
before anything else and use them everywhere.

## 2. Research

Search the web for news published inside that week, in these six sections (fixed order, ids and
colours):

| id | name | colour |
|---|---|---|
| anthropic | Anthropic | #b5512f |
| openai | OpenAI | #0f9d63 |
| google | Google &amp; Gemini | #2f6ddb |
| xai | xAI &amp; Grok | #5b5751 |
| europe | AI in Europa | #8a4fd0 |
| general | Sonstige KI-News | #b7841f |

Rules:
- Every item needs at least one source with a publication date inside the week. No dated source,
  no item. Prefer primary sources (company blog, release notes, filings, official statements),
  then reputable press. Never invent URLs, numbers or quotes; take figures from the source.
- 2 to 5 items per section, 18 to 26 in total. Leave a section with 1 item rather than padding it.
  Skip rumours, opinion pieces and minor tweets.
- One item per story. Merge reports about the same event into one item with several sources.
- Check the last two archived issues (`archiv/`) and do not repeat a story unless there is real
  news on it this week.
- Mark exactly one item in the whole issue as "Top der Woche" (the most important story). It is
  the first item in its section.

## 3. Writing

German, neutral and factual, real umlauts (ä ö ü ß), en dash with spaces ( – ), German number
format (93,5 Mrd. Dollar). Per item:
- `tag`: one or two words (Modell-Release, Produkt, Forschung, Regulierung, Finanzierung, IPO,
  Partnerschaft, Sicherheit, Personal, Recht, ...).
- `h3` headline: concrete, at most about 90 characters.
- `lede`: one sentence with the core fact.
- `detail`: one to three sentences of context (what it means, numbers, dates). Optional.
- Sources: name of the outlet plus date `DD.MM.YYYY`.

## 4. Files

1. Move the current `index.html` to `archiv/YYYY-kwNN.html` (the week it covers, two-digit
   week). Do not overwrite an existing archive file.
2. Build the new `index.html` from `_template.html`. Replace every placeholder. Change nothing
   else in the template (CSS, script, structure).
   - `{{KW}}`, `{{JAHR}}`, `{{ZEITRAUM}}` (e.g. `23. – 29. November 2026`)
   - `{{COUNT_SUMMARY}}`: `6 Kategorien · 21 Meldungen` (sections that have items, total items)
   - `{{MELDUNGEN_LABEL}}`: `21 Meldungen`
   - `{{NAV}}`: one chip per non-empty section:
     `<a class="chip" data-chip="ID" href="#ID" style="--oc:COLOUR"><span class="od"></span>NAME<span class="oc">COUNT</span></a>`
   - `{{INHALT}}`: one section per non-empty section:
     `<section class="lab" id="ID" style="--c:COLOUR;--ctint:COLOUR1a"><div class="lab-head"><span class="lab-dot"></span><span class="lab-name">NAME</span><span class="lab-count">N Meldungen</span></div>ITEMS</section>`
     - Featured item:
       `<article class="item featured"><div class="eyebrow">◆ Top der Woche</div><div class="irow"><span class="tag">TAG</span></div><h3>…</h3><p class="lede">…</p><p class="detail">…</p><div class="sources">SOURCES</div></article>`
     - Normal item (numbered 01, 02, … per section, the featured item gets no number):
       `<article class="item"><div class="inum">01</div><div><div class="irow"><span class="tag">TAG</span></div><h3>…</h3><p class="lede">…</p><p class="detail">…</p><div class="sources">SOURCES</div></div></article>`
     - Source: `<a class="src" href="URL" target="_blank" rel="noopener">NAME<span class="src-date">DD.MM.YYYY</span></a>`
   - `{{PREV_LINK}}`: `<a class="prev-link" href="archiv/YYYY-kwNN.html">← Vorherige Ausgabe · KW NN</a>`,
     pointing at the newest file that actually exists in `archiv/` (weeks can be missing).
   - `{{GENERIERT}}`: run time Europe/Berlin, `DD.MM.YYYY, HH:MM`.
3. Escape `&`, `<`, `>` in all text. No placeholder `{{...}}` may remain.

The class names above are a machine contract: `scripts/html-to-data.mjs` turns `index.html` into
`data.json`, which Horde Summit reads. Do not rename or add classes.

## 5. Check and publish

Before committing, if Node is available, run `node scripts/html-to-data.mjs` and confirm it
succeeds and that `data.json` shows the right `kw`, `year` and `itemCount`. Then discard the local
`data.json` change (CI regenerates it). Check that every item has at least one source dated inside
the week.

Commit `index.html` and the new archive file with the message `chore: AI Weekly KW NN/YYYY` and
push to a new `claude/` branch. Do not push to `main`, do not open a pull request. CI merges,
regenerates `data.json`, mails the newsletter and deploys.

If research finds fewer than 8 solid items, still publish, but say so in your final reply.
