# Security: Eira

Modello di autorizzazione e scoping. Documento derivato da audit reale
sul codice (v. `TASK.md` per il log completo), non da design teorico —
riflette lo stato attuale, incluse le lacune note.

---

## 1. Autenticazione

**Schema:** OAuth2 Password Flow (`fastapi.security.OAuth2PasswordBearer`)
+ JWT.

- `POST /auth/token` (`routers/auth.py`) accetta
  `OAuth2PasswordRequestForm` (username = id utente, password in chiaro),
  verifica contro `Utente.password_hash` con `bcrypt.checkpw`
  (`core/security.py`), emette un JWT firmato HS256.
- **Claim del token:** solo `sub` (id utente, come stringa) ed `exp`.
  Nessun claim di ruolo/reparto nel payload — `RuoloUtente` e
  `reparto_id` non sono nel JWT, vengono letti dal DB a ogni richiesta.
- **Validazione:** `deps.get_current_user` decodifica il token
  (`jose.jwt.decode`, algoritmo `HS256`, secret da
  `settings.jwt_secret_key`), carica `Utente` da DB per id, verifica
  `utente.attivo`. Fallimento (token invalido, scaduto, utente
  inesistente o disattivato) → `401` con `WWW-Authenticate: Bearer`.
- **Scadenza:** `jwt_access_token_expire_minutes` = 480 (8h), nessun
  refresh token — a scadenza serve nuovo login.
- **Password hashing:** `bcrypt` diretto (non passlib — passlib 1.7.4
  è incompatibile con bcrypt ≥ 5.0, vedi bug fix in `TASK.md`).
- **Reset password assistito:** una caposala può generare una password
  temporanea per un infermiere attivo dello stesso reparto
  (`POST /utenti/{id}/password-temporanea`). Il login con password
  temporanea non emette JWT: ritorna `403 password_change_required`.
  L'utente deve completare `POST /auth/change-temporary-password`, che
  verifica ancora la temporanea, aggiorna l'hash e rimuove il flag
  monouso (`PasswordResetRequirement`). Reset caposala fuori scope.
- **Secret di default:** `settings.jwt_secret_key` ha fallback
  `"dev-secret-change-in-production"` in `core/config.py` — va
  sovrascritto da env var in ogni deploy reale.

## 2. Modello di autorizzazione

### 2.1 Ruoli

Due soli ruoli (`models/enums.py::RuoloUtente`): `infermiere` e
`caposala`. Nessuna gerarchia oltre queste due — un caposala non è un
"infermiere con più permessi", sono percorsi distinti per endpoint.

Il controllo di ruolo è centralizzato in `deps.require_roles(*roles)`:
dependency FastAPI che solleva `403` se `current_user.ruolo` non è tra
quelli ammessi. Usato via `dependencies=[Depends(require_roles(...))]`
sui router — quindi il check di ruolo avviene *prima* del corpo della
funzione, non come `if` interno.

Endpoint solo-caposala: create/update `pazienti`, create/update
`utenti`, create `turni`, assegna/rimuovi assegnazione turno, approva
richiesta cambio turno (`risposta-caposala`), `GET /turni/scoperti`,
`GET /dashboard/caposala`.

Endpoint solo-infermiere: create `consegne-sbar`, update `consegne-sbar`
(più check autore, v. sotto), create diario CEDEMA, create
Norton/Conley, create richiesta cambio turno, `risposta-collega`,
`GET /turni/mie-assegnazioni`.

### 2.2 Invariante di isolamento reparto

**Ogni entità clinica appartiene a un reparto** (diretto via
`reparto_id`, o indiretto via FK a un'entità che ce l'ha — es.
`ConsegnaSbar` non ha `reparto_id` proprio, eredita lo scoping dal
`Turno` collegato). L'invariante di sicurezza del sistema è:

> Nessun utente può leggere o scrivere dati di un reparto diverso dal
> proprio, indipendentemente dal ruolo.

Pattern applicato in ogni router (list/get/create/update):

- **List:** `.filter(Entità.reparto_id == current_user.reparto_id)` —
  o, per entità senza `reparto_id` diretto, `.join()` sulla tabella che
  ce l'ha (es. `consegne_sbar.py::list_consegne` fa join su `Turno`).
- **Get per id:** `db.get(Entità, id)` seguito da controllo esplicito
  `if entità.reparto_id != current_user.reparto_id: raise 403`. Questo
  è il punto critico — un `db.get()` senza il controllo successivo è
  esattamente la classe di bug IDOR trovata e corretta il 2026-07-09
  (v. §4).
- **Create:** `reparto_id` non è mai accettato dal payload client-side
  per le entità dirette (`pazienti.py`, `utenti.py`, `turni.py`
  escludono `reparto_id` dal payload con `exclude={"reparto_id"}` e lo
  impostano server-side da `current_user.reparto_id`) — previene che un
  client forgi un reparto arbitrario in creazione.
- **Cross-reparto su relazioni:** ovunque un payload referenzi
  un'altra entità per id (es. `consegne_sbar` referenzia `turno_id` e
  `paziente_id`, `diario_cedema` referenzia `turno_id` opzionale,
  `cambi_turno` referenzia `collega_id`), il router verifica che
  l'entità referenziata sia dello stesso reparto dell'utente corrente
  prima di procedere — altrimenti sarebbe possibile agganciare dati di
  reparto A a un'entità di reparto B.

### 2.3 Gate "assegnazione turno attiva" su pazienti

Pattern specifico di `routers/pazienti.py`, distinto dal semplice
scoping reparto: un infermiere vede i pazienti del proprio reparto
**solo se ha almeno un'assegnazione turno con stato `attiva`**
(`_infermiere_ha_turno_attivo`, `pazienti.py:12-21`). Motivazione: i
pazienti non hanno un `turno_id` proprio (non è un dato per-turno come
le consegne SBAR), quindi lo scoping non può essere "stesso turno" ma
solo "sei di turno, in generale, in questo reparto".

```python
def _infermiere_ha_turno_attivo(current_user, db) -> bool:
    return (
        db.query(AssegnazioneTurno)
        .filter(
            AssegnazioneTurno.infermiere_id == current_user.id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
        )
        .first()
        is not None
    )
```

`list_pazienti` ritorna `[]` (non 403) se il gate fallisce — un
infermiere senza assegnazione attiva vede lista vuota, non errore.

**Limite noto (non un bug, scelta esplicita da rivedere):** il gate
verifica *l'esistenza* di un'assegnazione `attiva`, non che sia
un'assegnazione **di oggi**. `StatoAssegnazione` ha solo due valori
(`attiva`/`cambiata`) e non è mai transizionato a scaduta col passare
della data — quindi una singola assegnazione passata o futura, purché
mai rimossa/cambiata, basta a sbloccare l'accesso ai pazienti del
reparto a tempo indeterminato. V. §3 per lo stato di questo finding.

## 3. Problemi noti aperti (findings 2026-07-11, non fixati)

Da code review via 2 agenti `feature-dev:code-reviewer` paralleli
(layer auth/routing + layer data/schema). **Solo review, nessun fix
applicato** — checkbox in `TASK.md` non spuntate, riportati qui come
OPEN, non come risolti.

- 🔴 **Crash su cancellazione assegnazione turno.**
  `DELETE /turni/{id}/assegnazioni` (`turni.py:115-130`) cancella
  l'`AssegnazioneTurno` senza controllare se esistono
  `RichiestaCambioTurno` pendenti che la referenziano. Una successiva
  chiamata a `risposta-caposala` (`cambi_turno.py:129-131`) fa
  `db.get(AssegnazioneTurno, richiesta.assegnazione_turno_id)` e poi
  `turno.reparto_id` su un oggetto potenzialmente `None` →
  `AttributeError` non gestito (500 non controllato). Nessun FK
  `ondelete` configurato, e SQLite non applica FK constraint di default
  (manca `PRAGMA foreign_keys=ON`), quindi l'integrità referenziale non
  è garantita nemmeno a livello DB.
- 🔴 **Test suite scrive sul DB di produzione.** L'import di `main.py`
  (righe 33-35) esegue `Base.metadata.create_all` sull'engine
  configurato in `core/database.py:7`, che punta al file `.db` reale su
  disco (`database_url` di default). `tests/conftest.py` non isola
  l'engine per i test — ogni run della test suite tocca lo stesso file
  usato in sviluppo/produzione, non solo un DB in-memory dedicato.
- 🟡 **`StatoAssegnazione.cambiata` mai assegnato.** Il flusso di swap
  turno approvato (`cambi_turno.py:157`) muta `infermiere_id`
  sull'`AssegnazioneTurno` esistente in place, ma non marca mai lo
  stato a `cambiata`. L'enum esiste nel modello ma è dead value — nessun
  path del codice lo assegna, quindi qualunque logica futura che filtri
  per distinguere assegnazioni "sostituite" da quelle correnti non ha
  dati su cui contare.
- 🟡 **Gate "turno attivo" su pazienti non time-scoped** (v. §2.3 per
  il dettaglio). Confermato come scelta esplicita dell'utente via
  `AskUserQuestion` durante lo sviluppo (gate su assegnazione attiva,
  non su turno-di-oggi) — ma il test aggiunto per la feature non
  distingue implementazione corretta da bug, perché usa solo turno di
  oggi come fixture. Se si decide di restringere a "turno attivo oggi",
  serve aggiungere filtro su `Turno.data` in
  `_infermiere_ha_turno_attivo` (richiede join con `Turno`, la funzione
  oggi filtra solo su `AssegnazioneTurno`).

Ordine di fix suggerito (da `TASK.md`): i due 🔴 prima (bug concreti,
comportamento non ambiguo), i due 🟡 dopo (richiedono decisione di
design su semantica "turno attivo"/"cambiata" prima di poter essere
chiusi correttamente).

## 4. Log fix di sicurezza (storico)

### 2026-07-09 — IDOR su `GET /banca-ore/{infermiere_id}`

**Audit:** grep mirato su `reparto_id`/`infermiere_id` in tutti i
router, post-completamento della fase di persistenza DB reale, per
verificare che ogni occorrenza avesse lo scoping reparto atteso.

**Bug trovato:** `banca_ore.py::get_banca_ore` verificava che un
infermiere potesse leggere solo la propria banca ore
(`current_user.id != infermiere_id` → 403), ma per il ruolo `caposala`
non c'era nessun controllo equivalente — qualunque caposala autenticato
poteva passare un `infermiere_id` arbitrario e leggere il saldo ore di
un infermiere di un reparto diverso dal proprio. Quarta occorrenza
individuata di questa classe di bug (IDOR da omissione del controllo
reparto su `db.get()` per id), le precedenti tre già coperte dallo
scoping esistente in `pazienti.py`/`utenti.py`/`consegne_sbar.py`.

**Fix:** aggiunto controllo esplicito — se il chiamante è `caposala`,
si carica l'`Utente` target e si verifica
`infermiere.reparto_id == current_user.reparto_id` prima di procedere
(`banca_ore.py:32-38`, vedi §2.2 per il pattern generale).

**Verifica:** test aggiunto in `tests/test_banca_ore.py` (33 test
totali nella suite, tutti passanti al momento del fix).

**Lezione operativa:** questo bug è passato per 4 iterazioni di router
prima di essere trovato, perché ogni router era stato scritto e
testato in isolamento senza un audit cross-router dedicato allo scoping
per id. Da qui la pratica adottata: dopo il completamento di un router
che espone un `GET /{qualcosa_id}`, grep esplicito su
`reparto_id`/`infermiere_id` in tutto `routers/` prima di considerare
la fase chiusa — non solo review del file appena scritto.
