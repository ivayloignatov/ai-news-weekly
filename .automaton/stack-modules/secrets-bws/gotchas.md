# secrets-bws Gotchas -- Doktrin-Kontext-Text

> Quelle: `.planning/learnings/Agenten-Routing.md` (ROUTE-07)
> Konsolidiert: 2026-06-05 | Typ: Kontext-Text (kein Executable)

---

## ROUTE-07 -- Autonomy-Level-System pro BWS-Key

**Hintergrund:**
Bitwarden Secrets Manager (BWS) enthaelt Keys unterschiedlicher Kritikalitaet und
unterschiedlicher Verwendung. Ein einheitliches Autonomy-Level-Schema sorgt dafuer,
dass Agenten wissen, wann sie autonom handeln duerfen und wann sie den Owner fragen
muessen -- ohne das fuer jeden Key neu entscheiden zu muessen.

**Das Drei-Stufen-Schema:**

| Level | Name | Bedeutung | Typische Keys |
|---|---|---|---|
| **L1** | autonom | Claude fuehrt durch ohne Owner-Frage | Lese-Tokens, Monitoring-APIs, DNS-Queries |
| **L2** | eingeschraenkt | Lesen/Diagnostik autonom; Mutation/Cutover = Owner-Gate | Deploy-Tokens, Env-Sync, DB-Queries |
| **L3** | Owner-Gate | Claude fragt VOR JEDER Aktion | Billing, OAuth-Grants, Produktions-Secrets mit breitem Scope |

**Wie das Schema angewandt wird:**

Pro BWS-Key wird das Autonomy-Level einmalig festgelegt und in
`~/.claude/inventory/secrets-autonomy.md` dokumentiert. Das Format:

```
| key-name (Schema)              | Zweck (Beispiel)        | Level | Notiz                    |
|---|---|---|---|
| infra-<service>-api            | Read+Write einer Infra  | L2    | scope-begrenzt           |
| infra-<service>-token          | Deploy + Restart        | L2    | keine DELETE-Capability  |
| infra-<service>-api            | Server-Diagnose         | L1    | Lesen + Soft-Reboot      |
| app-<project>-<service>-anon   | Anon-Lesezugriff        | L1    | public, kein Write       |
| infra-<service>-api            | Mail senden             | L2    | kein Domain-Delete       |
```

> Bewusst synthetische Key-Namen (Schema `infra-<service>-...` / `app-<project>-<service>-...`).
> Die konkreten Key-Namen des Owners sind account-spezifisch und stehen NICHT in diesem
> Modul (ADR-020: account-/maschinen-spezifische Inventare sind aus dem Sync-Set ausgeschlossen).

**Anwendungsregel fuer Agenten:**

Vor jeder BWS-gesteuerten Aktion pruefen:

1. Welchen Key braucht diese Aktion? (Lookup in secrets-autonomy.md)
2. Was ist das Level dieses Keys?
3. L1: autonom durchfuehren. L2: Lesen/Diagnose autonom, Mutation -> Owner-Gate.
   L3: immer Owner-Gate.

**Anti-Pattern:** "Ich nehme einfach den erstbesten Key der die richtige Capability
hat" -- ohne Level-Check. Keys mit L2/L3-Level NIEMALS fuer Mutations-Aktionen
ohne Owner-Bestaetigung nutzen.

**Konkrete Keys fuer dieses Projekt:**
Stehen in `~/.claude/inventory/secrets-autonomy.md` (nicht in diesem Modul --
das Inventar ist maschinen-/account-spezifisch und wird per `/infra-sync-docs`
gepflegt).

---

## ROUTE-07b -- BWS-Zugriffsweg: ruf den Loader-Wrapper, nie das Secret direkt (ADR-029)

**Kernregel (Credential-Indirection-Pattern, 2026-Standard):**
Das BWS-Access-Token ist auf einer Maschine i.d.R. NICHT als Klartext-Env-Var verfuegbar,
sondern **maschinen-gebunden verschluesselt** (z.B. Windows-DPAPI). Ein **Loader-Wrapper**
entschluesselt es zur Laufzeit, ruft `bws`, gibt nur den angefragten Wert zurueck und loescht
das Token danach wieder (der Wert bleibt aus dem Agent-Kontext). Deshalb:

> **Ruf IMMER das maschinen-eigene Loader-Skript per vollem Pfad -- niemals `bws` direkt und
> niemals die blosse `Get-Secret`-Shell-Funktion.**

**Warum nicht `bws` direkt:** ohne entschluesseltes Token -> `Error: Missing access token`.
**Warum nicht die `Get-Secret`-Funktion:** die ist im interaktiven Shell-Profil definiert und wird
in einer **nicht-interaktiven Agent-Shell NICHT geladen** -- der Aufruf scheitert dort still.
Deshalb das Skript per vollem Pfad aufrufen (`& "<loader-pfad>" -Name <key>`), nicht ueber die Funktion.

**Preflight-Reihenfolge (erste greifende Option gewinnt):**
1. **Loader-Skript per Pfad** (der kanonische Weg; entschluesselt das Token selbst). Den konkreten
   Loader-Pfad NICHT hier hardcoden -- er ist maschinen-/account-spezifisch und steht im
   Projekt-`## Secrets`-Block bzw. der Personal-Infra-Doku (Verweis, ADR-020/ADR-029).
2. **Nur falls kein Loader existiert:** `$BWS_ACCESS_TOKEN` direkt nutzen, FALLS er in der Shell
   nachweislich gesetzt ist (`test -n "$BWS_ACCESS_TOKEN"` / `if ($env:BWS_ACCESS_TOKEN)`).
3. **Weder noch -> Owner-Gate.** Nicht blind `bws` aufrufen, nicht zweimal dasselbe versuchen.

**Plattform-Gotcha -- Windows PowerShell 5.1:** `Microsoft.PowerShell.SecretManagement`
(`Get-Secret`/`Get-SecretVault` als Cmdlet) ist dort oft nicht installiert. Verlass dich NICHT auf
das Cmdlet; der Loader-Wrapper nutzt die `bws`-CLI mit dem zur Laufzeit entschluesselten Token.

**Anti-Pattern (Anker: Cross-Repo-Handoff `bws-token-shell-access` 2026-06-07, eine Fehldiagnose):**
`bws secret list` direkt aufrufen; die `Get-Secret`-Funktion in einer nicht-interaktiven Shell
erwarten; nach dem ersten `Missing access token` blind ein zweites Mal dasselbe versuchen statt
den Loader-Wrapper zu suchen. Der Token war nie das Problem -- der falsche Einstiegspunkt war es.
