# Glossario — Eira

Termini clinici/dominio usati nel codebase, con definizione ancorata al
modello dati effettivo (non definizioni da manuale). Riferimento
incrociato: [`docs/archive/er-bozza.md`](./archive/er-bozza.md) per la
bozza ER storica, [`docs/diagrams/er-consegne-infermieristiche.drawio`](./diagrams/er-consegne-infermieristiche.drawio)
per il diagramma.

---

### SBAR / ISBAR

Modello di consegna infermieristica strutturato in 4 campi testuali:
`situation`, `background`, `assessment`, `recommendation`. Nel codebase
è l'entità `ConsegnaSbar`
(`backend/app/models/consegna_sbar.py`), una consegna per coppia
paziente/turno (`UniqueConstraint("paziente_id", "turno_id")` — una
sola consegna SBAR per paziente per turno). Ha una `priorita`
(`PrioritaConsegna`, `backend/app/models/enums.py`) con due soli
valori: `normale` | `urgente`. Non esiste una variante "I" (Identify)
distinta a schema: la "I" di ISBAR non è modellata come campo proprio,
la consegna parte direttamente da `situation`.

### CEDEMA

Acronimo per le 6 aree di osservazione infermieristica registrate nel
diario paziente: **C**oscienza, **E**motività, **D**olore,
**E**modinamica, **M**obilizzazione, **A**llert. Corrisponde
all'entità `VoceDiarioCedema`
(`backend/app/models/diario_cedema.py`), con un campo `Text` per
ciascuna delle 6 aree. Collegata a `paziente_id` e `autore_id`
(obbligatori) e a `turno_id` (opzionale — una voce può non essere
legata a un turno specifico). Non ha priorità né stato: è un log
cronologico (`timestamp`), sempre in append, mai una consegna con
workflow di approvazione come SBAR o cambio turno.

### Scala di Norton

Scala di valutazione del rischio di lesioni da pressione (piaghe da
decubito). Entità `ValutazioneNorton`
(`backend/app/models/valutazione.py`), 5 sotto-punteggi interi:
`condizioni_generali`, `stato_mentale`, `attivita`, `mobilita`,
`incontinenza`. Il `punteggio_totale` è la somma semplice dei 5 campi,
calcolata lato server in `backend/app/routers/valutazioni.py`
(`create_norton`) — non persistita dal client, non derivata da pesi
diversi per campo. **Nessuna soglia di rischio è codificata**: il
modello/schema espone solo il punteggio grezzo, non una
classificazione (es. "rischio alto/basso") — è responsabilità di chi
consuma il dato interpretarlo secondo la scala Norton clinica
standard. Una valutazione per `paziente_id` + `data_valutazione`,
nessun vincolo di unicità a schema (si possono accumulare valutazioni
storiche nel tempo, viste ordinate per data decrescente).

### Scala di Conley

Scala di valutazione del rischio di caduta. Entità `ValutazioneConley`
(stesso file `valutazione.py`), 6 sotto-punteggi interi:
`storia_cadute`, `deficit_visivo`, `alterazione_eliminazione`,
`agitazione`, `deficit_vista_osservato`, `andatura_alterata`. Stesso
pattern di Norton: `punteggio_totale` è la somma dei 6 campi
calcolata server-side (`create_conley` in
`backend/app/routers/valutazioni.py`), nessuna soglia di rischio
codificata a schema. Le due valutazioni sono aggregate in lettura da
`ValutazioniAggregateRead` (`backend/app/schemas/valutazione.py`), che
espone liste `norton` + `conley` per lo stesso paziente.

### Banca ore

Saldo ore lavorate vs. ore contrattuali di un infermiere per un dato
mese. **Non è una tabella**: è calcolata a runtime in
`backend/app/routers/banca_ore.py` (`get_banca_ore`), coerentemente
con quanto dichiarato in `docs/archive/er-bozza.md` ("nessuna tabella
dedicata"). Formula: `ore_pianificate` (somma delle durate dei
`Turno` con `AssegnazioneTurno.stato == attiva` nel mese, calcolate da
`ora_inizio`/`ora_fine` con gestione turno-notte a cavallo di
mezzanotte) meno `ore_contrattuali` (da `ProfiloInfermiere.ore_contrattuali_mensili`,
1:1 con `Utente`). `saldo = ore_pianificate - ore_contrattuali`. Schema
di risposta: `BancaOreRead` (`backend/app/schemas/banca_ore.py`) —
`infermiere_id`, `mese` (stringa `YYYY-MM`), `ore_pianificate`,
`ore_contrattuali`, `saldo`.

### Cambio turno

Flusso di scambio turno tra due infermieri con doppia approvazione,
modellato da `RichiestaCambioTurno`
(`backend/app/models/cambio_turno.py`) e dall'enum `StatoCambioTurno`
(`backend/app/models/enums.py`). Stati, in ordine di percorso
normale:

1. `in_attesa_collega` — stato iniziale alla creazione della richiesta
   (`richiedente_id` chiede lo scambio di una propria `AssegnazioneTurno`
   attiva con `collega_id`, stesso reparto).
2. `in_attesa_caposala` — il collega ha accettato
   (`POST /cambi-turno/{id}/risposta-collega`, `accetta=true`);
   in attesa di approvazione della caposala del reparto del turno.
3. `approvata` — la caposala approva
   (`POST /cambi-turno/{id}/risposta-caposala`, `accetta=true`):
   l'`infermiere_id` sull'`AssegnazioneTurno` viene riassegnato al
   collega. Blocco a livello applicativo: se il collega ha già
   un'altra assegnazione attiva nella stessa data, la richiesta è
   rifiutata con 409.
4. `rifiutata_collega` — il collega rifiuta lo scambio (stato
   terminale, non passa mai da caposala).
5. `rifiutata_caposala` — la caposala rifiuta dopo che il collega ha
   accettato; opzionalmente valorizza `motivo_rifiuto`.

Tracciamento: `risposta_collega_il`, `risposta_caposala_id`,
`risposta_caposala_il` — chi/quando ha risposto in ciascuna fase.
Solo gli infermieri possono creare una richiesta o rispondere come
collega (`require_roles(RuoloUtente.infermiere)`); solo la caposala
può dare l'approvazione finale.

### Reparto

Unità di scoping principale del sistema (`backend/app/models/reparto.py`):
`id`, `nome`, `descrizione` opzionale. Ogni `Utente`, `Paziente` e
`Turno` appartiene a esattamente un reparto (`reparto_id` FK
obbligatoria). Quasi tutte le autorizzazioni nei router verificano
l'appartenenza allo stesso reparto (es. una caposala non può vedere la
banca ore di un infermiere di un altro reparto, un infermiere non può
proporre cambio turno con un collega di un altro reparto).

### Ruoli: infermiere / caposala

Enum `RuoloUtente` (`backend/app/models/enums.py`): due soli valori,
`infermiere` e `caposala` — nessun ruolo admin/superuser distinto nel
dominio applicativo. Il ruolo determina i permessi via dependency
`require_roles` nei router: `infermiere` crea consegne SBAR, voci
diario, valutazioni Norton/Conley, richieste di cambio turno e
risponde come collega; `caposala` approva/rifiuta i cambi turno,
gestisce turni/assegnazioni (implicito dai router `turni.py`,
`utenti.py`) e ha visibilità dashboard aggregata
(`GET /dashboard/caposala` — turni scoperti nel reparto e cambi turno
in attesa). Un `caposala` può comunque consultare la banca ore di un
infermiere del proprio reparto, ma non di un altro.

### Turno

Fascia oraria lavorativa in un reparto: `data`, `tipo` (`TipoTurno`:
`mattina` | `pomeriggio` | `notte`), `reparto_id`, `ora_inizio`,
`ora_fine` (`backend/app/models/turno.py`). Vincolo di unicità
`(data, tipo, reparto_id)`: non possono esistere due turni identici
(stesso tipo, stesso giorno, stesso reparto) — il turno è l'unità, non
la singola persona assegnata.

### Assegnazione (turno)

`AssegnazioneTurno` (stesso file `turno.py`) collega un `Turno` a un
`Utente` (infermiere): `turno_id`, `infermiere_id`, `stato`
(`StatoAssegnazione`: `attiva` | `cambiata`). Vincolo di unicità
`(turno_id, infermiere_id)`. Uno stato `cambiata` marca
un'assegnazione superata da uno scambio turno approvato (l'oggetto
`AssegnazioneTurno` non viene duplicato/cancellato quando il cambio
turno va a buon fine: il campo `infermiere_id` viene riassegnato
direttamente in place — vedi `risposta_caposala` in
`backend/app/routers/cambi_turno.py` — quindi in pratica lo stato
`cambiata` risulta definito nell'enum ma non ancora scritto da nessun
percorso applicativo osservato).

---

Per lo schema relazionale completo (entità, FK, cardinalità 1—N/1—1)
vedi [`docs/archive/er-bozza.md`](./archive/er-bozza.md); per il diagramma visuale
vedi la cartella [`docs/diagrams/`](./diagrams/).
