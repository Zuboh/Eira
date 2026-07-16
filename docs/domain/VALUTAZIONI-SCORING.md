# Valutazioni cliniche: Norton e Conley — scoring as-implemented

**Scope:** questo documento descrive esattamente cosa fa il codice in
`app/models/valutazione.py`, `app/schemas/valutazione.py` e
`app/routers/valutazioni.py` — non la scala clinica ufficiale. Eira è
un progetto di tesi, non un dispositivo medico certificato: dove
l'implementazione si discosta dalla scala reale (Norton, Conley), la
differenza è segnalata esplicitamente sotto **Nota clinica**.

## 1. Scala di Norton (rischio lesioni da pressione/decubito)

### Campi (`ValutazioneNorton`, tabella `valutazione_norton`)

| Campo | Tipo | Significato clinico atteso |
|---|---|---|
| `condizioni_generali` | `int` | condizioni fisiche generali |
| `stato_mentale` | `int` | stato mentale/coscienza |
| `attivita` | `int` | deambulazione/attività |
| `mobilita` | `int` | mobilità |
| `incontinenza` | `int` | incontinenza |
| `punteggio_totale` | `int` | somma calcolata server-side |

Più `data_valutazione` (data), `paziente_id`/`autore_id` (FK), `id`.

I 5 sotto-punteggi corrispondono ai nomi delle 5 sotto-scale Norton
classiche, ma **nello schema Pydantic (`ValutazioneNortonCreate`) sono
semplici `int` senza `ge`/`le`** — nessun vincolo di range (la scala
reale usa 1–4 per item). Il client può inviare qualunque intero,
incluso negativo; non c'è validazione server-side sui valori dei
singoli item.

### Calcolo `punteggio_totale`

In `create_norton` (`app/routers/valutazioni.py:35-41`):

```python
punteggio = (
    payload.condizioni_generali
    + payload.stato_mentale
    + payload.attivita
    + payload.mobilita
    + payload.incontinenza
)
```

Somma semplice, non pesata, dei 5 campi. Calcolato lato server prima
dell'insert — il client non può inviare/falsificare `punteggio_totale`
direttamente (non è nemmeno un campo di `ValutazioneNortonCreate`).

### Soglie di rischio

**Non implementate.** Non esiste nessuna logica che mappi
`punteggio_totale` a una fascia (es. "basso/medio/alto rischio"), né
un campo enum per il livello di rischio, né una soglia hardcoded (la
scala Norton reale userebbe tipicamente <14 rischio, <12 rischio
alto). Il valore torna al client come intero grezzo; qualunque
interpretazione clinica della soglia è delegata al frontend (non
ancora costruito — vedi `TASK.md`, "Vista valutazioni Norton/Conley"
è ancora `[ ]`) o all'utente umano.

## 2. Scala di Conley (rischio caduta)

### Campi (`ValutazioneConley`, tabella `valutazione_conley`)

| Campo | Tipo | Significato clinico atteso |
|---|---|---|
| `storia_cadute` | `int` | storia di cadute pregresse |
| `deficit_visivo` | `int` | deficit visivo riferito |
| `alterazione_eliminazione` | `int` | alterazioni eliminazione (urgenza/frequenza) |
| `agitazione` | `int` | agitazione/irrequietezza |
| `deficit_vista_osservato` | `int` | deficit visivo osservato dall'infermiere |
| `andatura_alterata` | `int` | andatura/equilibrio alterati |
| `punteggio_totale` | `int` | somma calcolata server-side |

Stessa struttura di Norton: `data_valutazione`, `paziente_id`/
`autore_id`, `id`.

### Calcolo `punteggio_totale`

In `create_conley` (`app/routers/valutazioni.py:73-80`):

```python
punteggio = (
    payload.storia_cadute
    + payload.deficit_visivo
    + payload.alterazione_eliminazione
    + payload.agitazione
    + payload.deficit_vista_osservato
    + payload.andatura_alterata
)
```

Anche qui: somma semplice non pesata dei 6 campi, calcolata
server-side, non passata dal client.

**Nota clinica:** la scala di Conley reale non pesa tutti gli item
allo stesso modo (alcuni item valgono 2 punti, altri 1, con range
totale tipico 0–10). Il codice tratta tutti e 6 i campi come pesi
identici a 1 — è compito del client inviare già il valore "pesato"
per item se si vuole rispecchiare la scala reale; il server si limita
a sommare quello che riceve.

### Soglie di rischio

**Non implementate** — stessa situazione di Norton: nessuna fascia di
rischio, nessuna soglia, nessun enum. Solo il totale grezzo.

## 3. Endpoint aggregato — dashboard multidimensionale

`GET /pazienti/{paziente_id}/valutazioni` (`app/routers/valutazioni.py:106-113`).

Non fa altro che richiamare in sequenza `list_norton` e `list_conley`
per lo stesso `paziente_id` e comporre il risultato in
`ValutazioniAggregateRead`:

```python
ValutazioniAggregateRead(
    norton=list_norton(paziente_id, current_user, db),
    conley=list_conley(paziente_id, current_user, db),
)
```

Risposta:

```json
{
  "norton": [ /* tutte le ValutazioneNortonRead del paziente, desc per data_valutazione */ ],
  "conley": [ /* tutte le ValutazioneConleyRead del paziente, desc per data_valutazione */ ]
}
```

Punti da notare:

- **"Multidimensionale" = due liste separate**, non un merge/join per
  data né un punteggio combinato. Norton e Conley restano
  indipendenti; l'endpoint è solo un aggregatore di comodo per
  evitare due chiamate dal frontend.
- Ogni lista è ordinata `data_valutazione` decrescente (più recente
  prima), stesso ordinamento dei due endpoint `GET` singoli.
- Nessuna paginazione, nessun filtro per intervallo di date: restituisce
  **tutta** la storia di valutazioni del paziente.
- Scoping reparto: applicato indirettamente, perché
  `get_valutazioni_aggregate` richiama `list_norton`/`list_conley`, e
  ciascuno di questi esegue `_get_paziente_same_reparto` — quindi un
  paziente di un altro reparto produce comunque `403 Forbidden` (verificato
  due volte, una per chiamata interna, stesso esito).

## Riepilogo scoping/autorizzazione (comune a tutti gli endpoint)

`_get_paziente_same_reparto` (`app/routers/valutazioni.py:18-26`) è
l'unico controllo di autorizzazione sui dati: verifica che il paziente
esista (404 altrimenti) e che `paziente.reparto_id == current_user.reparto_id`
(403 altrimenti). I `POST` (`/norton`, `/conley`) richiedono inoltre
`RuoloUtente.infermiere` via `require_roles`; i `GET` (incluso
l'aggregato) non hanno restrizione di ruolo oltre l'autenticazione.

## Verifica via test (`backend/tests/test_valutazioni.py`)

- `test_create_norton_computes_punteggio_totale`: payload con
  `3,3,2,2,3` → `punteggio_totale == 13` (somma diretta, conferma
  nessuna ponderazione).
- `test_create_conley_computes_punteggio_totale`: payload con
  `1,0,1,0,0,1` → `punteggio_totale == 3` (somma diretta).
- `test_create_norton_other_reparto_forbidden` /
  `test_create_conley_other_reparto_forbidden`: paziente di reparto
  diverso → `403`.
- `test_list_norton_same_reparto_succeeds` /
  `test_list_norton_other_reparto_forbidden`: stesso pattern di
  scoping sui `GET`.
- `test_valutazioni_aggregate_returns_both`: dopo un `POST` Norton e
  uno Conley, l'aggregato ritorna `len(norton) == 1` e
  `len(conley) == 1` — nessun altro comportamento testato (niente
  soglie di rischio, niente merge per data).

Nessun test copre range invalidi dei singoli item (es. valori
negativi o fuori scala 1–4/0–2), coerente col fatto che lo schema
Pydantic non li vincola.
