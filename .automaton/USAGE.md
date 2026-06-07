# Automaton in diesem Repo

> Dieses Repo wurde mit Automaton 0.1.0 gebootstrapped (2026-06-07). Voller Owner-Guide:
> `USAGE.md` im Automaton-Repo. Diese Datei ist die Kurz-Referenz fuer den Alltag hier.

## Das Wichtigste

Das **Auto-Routing gilt in diesem Repo automatisch** -- beschreib eine Aufgabe in normaler
Sprache, das Setup waehlt den passenden Agenten ohne `@`-mention. Kein Setup noetig.

## Commands

| Wann | Command |
|---|---|
| Mehrteiliges Feature aus Spec bauen | `/automaton-build` (Reife-Check -> Plan-Approval -> Dispatch mit Verify pro Task) |
| Stand / offene Tasks + Decisions | `/automaton-status` (read-only) |
| Aus Reibung lernen | `/automaton-retro` (oder automatisch nach ~3 Korrekturen) |
| Stack-Gotchas nachziehen | `/automaton-init --module=auto` (oder `--module=<name>`) |

## Wo was liegt

- `.planning/` -- Plan, Backlog, ADRs, Specs dieses Repos (Single-Source).
- `CLAUDE.md` -- Projekt-Konventionen; globale Doktrin wird aus `~/.claude` vererbt.
- `.automaton/stack-modules/` -- aktivierte Stack-Gotchas (falls `--module` genutzt).

Session-Lifecycle (Handoff-Schreiben, Pre-Compact-Persist) laeuft automatisch ueber Hooks.
