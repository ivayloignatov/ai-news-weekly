# AGENTS.md — [OWNER: 1-Satz-Mission dieses Repos]

> Repo-Typ: [OWNER: App-Repo | Infra/Config-Repo | Docs/Data-Repo]
>
> Cross-Tool-Standard (Claude Code, Cursor, Codex, Gemini lesen dieselbe Datei).
> Claude-spezifische Detail-Konventionen stehen in CLAUDE.md -- hier nur was tool-agnostisch gilt.
> Faustregel: 80% gemeinsame Regeln hier, Tool-Spezifika in die Tool-Datei (nie doppeln).

## Stack

[OWNER: Sprache, Framework, Test-Tooling, Build/Deploy -- kurz, kein Roman]

## Services & Secrets

Externe Services dieses Repos:

[OWNER: welche externen Services werden genutzt, z.B. Datenbank, Mail, Storage, Auth --
mit kurzer Notiz wozu jeder Service dient]

Secret-Handling-Muster: Maschinen-Secrets werden zur Laufzeit aus dem Secret-Store bezogen,
nie hardcoden. Beispiel-Muster (Owner ersetzt mit dem projektspezifischen Store):

    # Pseudocode -- ersetzen mit realem Lookup (BWS / .env / Vault / SSM / ...)
    API_KEY = secret_store.get("service-name-api-key")

[OWNER: konkretes Secret-Muster dieses Repos eintragen -- welcher Store, welche Key-Namenskonvention]

## Plugins (Claude Code)

Aktive Claude-Code-Plugins werden in `.claude/settings.json` unter `enabledPlugins` gelistet.
Ein installiertes Plugin ohne Eintrag dort ist inaktiv -- erst nach Eintrag greift es.

[OWNER: genutzte Plugins auflisten oder Sektion loeschen wenn keine aktiv]

## Conventions

[OWNER: Repo-spezifische Konventionen die alle Tools kennen sollen -- Commit-Format,
Branch-Naming, Migrations-Workflow, Code-Style-Abweichungen usw.]
