# Automaton Stack Module: secrets-bws

Status: **STACK MODULE -- opt-in, project-scoped.** Inert until explicitly activated.

Kontext-Text-Modul fuer das Bitwarden-Secrets-Manager-Autonomy-Level-System.
Informiert Agenten ueber das dreistufige Autonomy-Klassifikationsschema fuer BWS-Keys.
Kein Executable.

---

## Was das Modul ist

Ein `gotchas.md`-Kontext-Text, der das Autonomy-Level-System fuer BWS-Keys
(autonom / eingeschraenkt / Owner-Gate) als Prompt-Kontext bereitstellt.

| Datei | Zweck |
|---|---|
| `README.md` | Modul-Beschreibung, Trigger-Kriterium, Aktivierungs-Hinweis |
| `gotchas.md` | Doktrin-Kontext-Text: ROUTE-07 |

### Abgedeckte Learnings

| ID | Titel |
|---|---|
| ROUTE-07 | Autonomy-Level-System pro BWS-Key (autonom / eingeschraenkt / Owner-Gate) |

---

## Warum dieses Modul existiert (ADR-Hintergrund)

- **ADR-005** (agnostischer Kern + Stack-Module): BWS-Kontext ist nur fuer Repos
  relevant, die Bitwarden Secrets Manager nutzen.
- **ADR-015** (Kontext-Text vs Executable): reiner Kontext-Text.
- **OD-3** (Learnings-Selektion 2026-06-04): ROUTE-07 als "projekt-lokal /
  zuschaltbares Stack-Modul" klassifiziert.
- **ADR-020** (Sync-Set-Scope): `inventory/`-Files sind bewusst aus dem Automaton-
  Sync-Set ausgeschlossen (maschinen-/account-spezifisch). Dieses Modul enthaelt
  ausschliesslich das allgemeine Schema -- keine konkreten Key-Namen oder Werte.

---

## Trigger-Kriterium (WANN ein Ziel-Repo dieses Modul zuschaltet)

Dieses Modul ist relevant wenn das Ziel-Repo MINDESTENS EINES der folgenden aufweist:

- `bws`-CLI oder `Get-Secret`-Funktion im Stack
- BWS-Keys als Secret-Source (statt .env-Datei direkt)
- Mehrere Agenten/Skripte die auf BWS zugreifen und unterschiedliche Rechte benoetigen

Nicht aktivieren bei: Repos ohne BWS-Anbindung, reinen Frontend-Repos ohne
Secret-Management.

---

## Aktivierung (MVP)

**MVP -- Owner-@import in Projekt-CLAUDE.md:**

```markdown
# Kontext
@automaton/stack-modules/secrets-bws/gotchas.md
```

**Hinweis:** Das Modul beschreibt nur das Schema. Die konkreten Key-Namen und
Autonomy-Levels fuer dieses Projekt stehen in `~/.claude/inventory/secrets-autonomy.md`
(per Owner gepflegt, nicht versioniert in Automaton).

**Final-Mechanik: deferred (ADR-015-C).**

---

## Bezug zu anderen Komponenten

- **ADR-005**: Stack-Modul-Instanz.
- **ADR-015**: Kontext-Text-Trennachse.
- **ADR-020**: Erklaert warum keine konkreten Keys hier stehen.
- **OD-3**: Quell-Entscheidung.
- **C5 / Bootstrap**: deployt dieses Modul als opt-in.
