# Flusso Cambio Turno

Router: `app/routers/cambi_turno.py`. Modello: `RichiestaCambioTurno`
(`app/models/cambio_turno.py`). Stati: `StatoCambioTurno`
(`app/models/enums.py`).

Doppia conferma: il **collega** interpellato deve accettare per primo,
poi la **caposala** approva o rifiuta. Solo dopo l'approvazione della
caposala lo scambio ha effetto reale sull'assegnazione turno.

## Diagramma di stato

```
                POST /cambi-turno/
                (richiedente = infermiere titolare turno)
                        │
                        ▼
              ┌─────────────────────┐
              │  in_attesa_collega   │
              └─────────────────────┘
                 │                │
   risposta-collega               risposta-collega
   accetta=true (collega)         accetta=false (collega)
                 │                │
                 ▼                ▼
     ┌──────────────────────┐   ┌───────────────────┐
     │  in_attesa_caposala   │   │ rifiutata_collega  │  (stato terminale)
     └──────────────────────┘   └───────────────────┘
        │                  │
  risposta-caposala   risposta-caposala
  accetta=true         accetta=false
  (caposala)           (caposala)
        │                  │
        ▼                  ▼
  ┌───────────┐     ┌──────────────────┐
  │ approvata  │     │ rifiutata_caposala │  (stato terminale)
  └───────────┘     └──────────────────┘
  (stato terminale)
```

`approvata`, `rifiutata_collega`, `rifiutata_caposala` sono terminali:
non esiste transizione che li lasci (confermato da
`test_collega_rifiuta_stops_flow`, che verifica che una risposta
caposala successiva a `rifiutata_collega` torni `409 Conflict`).

## Attori e transizioni

| Transizione | Endpoint | Chi | Precondizioni | Effetto |
|---|---|---|---|---|
| creazione → `in_attesa_collega` | `POST /cambi-turno/` | richiedente (`infermiere`, deve essere titolare dell'`AssegnazioneTurno`) | assegnazione `attiva`; `collega_id` ≠ richiedente; collega stesso reparto | crea `RichiestaCambioTurno` |
| `in_attesa_collega` → `in_attesa_caposala` / `rifiutata_collega` | `POST /{id}/risposta-collega` | solo `collega_id` della richiesta | stato corrente deve essere `in_attesa_collega` (altrimenti `409`) | imposta `risposta_collega_il`; stato in base a `accetta` |
| `in_attesa_caposala` → `approvata` / `rifiutata_caposala` | `POST /{id}/risposta-caposala` | `caposala` dello stesso reparto del turno | stato corrente deve essere `in_attesa_caposala` (altrimenti `409`) | vedi sotto |

Ruoli enforced via `require_roles` a livello router (`infermiere` per
create/risposta-collega, `caposala` per risposta-caposala); l'identità
puntuale (es. "solo il collega interpellato", "solo titolare
assegnazione") è verificata a mano nel body dell'handler con
`403 Forbidden` se non corrisponde.

## Approvazione caposala: check "niente-doppio-turno"

Su `risposta-caposala` con `accetta=true`, prima di eseguire lo swap si
riusa la stessa query di conflitto usata per l'assegnazione turni: si
cerca un'`AssegnazioneTurno` **attiva** del collega (`collega_id` della
richiesta), stesso `Turno.data` del turno oggetto dello scambio, con
`id` diverso dall'assegnazione in cambio. Se trovata → `409 Conflict`
("Collega già assegnato a un turno in questa data"), la richiesta
**resta** `in_attesa_caposala` (nessuna transizione di stato avviene).

Se il check passa:
- `assegnazione.infermiere_id = richiesta.collega_id` — lo swap è una
  mutazione in-place sulla riga `AssegnazioneTurno` esistente, non la
  creazione di una nuova assegnazione.
- `richiesta.stato = approvata`.

Su rifiuto (`accetta=false`): `richiesta.stato = rifiutata_caposala`,
`motivo_rifiuto` salvato da payload.

In entrambi i casi (`approvata` o `rifiutata_caposala`) si registrano
`risposta_caposala_id` (chi ha risposto) e `risposta_caposala_il`.

Confermato dai test in `tests/test_cambi_turno.py`:
- `test_full_flow_accepted_swaps_infermiere` — percorso completo,
  verifica `assegnazione.infermiere_id` cambiato a fine flusso.
- `test_collega_rifiuta_stops_flow` — rifiuto del collega blocca il
  flusso, risposta-caposala successiva su richiesta non più
  `in_attesa_caposala` → `409`.
- `test_caposala_rejects_doppio_turno_on_approval` — collega già
  assegnato altro turno stessa data → `409`, nessuno swap.
- `test_create_richiesta_only_own_assegnazione` — solo il titolare
  dell'assegnazione può aprire la richiesta (`403` altrimenti).

## Known issues (non ancora fixati)

Da `TASK.md` — sezione "Backend — findings code review (2026-07-11,
non ancora fixati)". Review via 2 agenti `feature-dev:code-reviewer`
paralleli, nessun fix applicato.

- 🔴 **Crash su assegnazione cancellata**: `DELETE
  /turni/{id}/assegnazioni` non controlla `RichiestaCambioTurno`
  pendenti che referenziano l'assegnazione cancellata → una successiva
  `risposta-caposala` su quella richiesta crasha con `AttributeError`
  non gestito, perché `assegnazione = db.get(AssegnazioneTurno,
  richiesta.assegnazione_turno_id)` torna `None` e il codice fa subito
  `turno = db.get(Turno, assegnazione.turno_id)` (`turni.py:115-130`,
  `cambio_turno.py:129-131`). Nessun FK `ondelete`, nessun `PRAGMA
  foreign_keys=ON` — la cancellazione non è né bloccata né propagata a
  livello DB.
- 🟡 **`StatoAssegnazione.cambiata` mai assegnato**: l'enum esiste
  (`app/models/enums.py`) ma il flusso di swap (`cambio_turno.py:157`)
  muta `infermiere_id` in place sull'assegnazione esistente senza mai
  impostare `stato = StatoAssegnazione.cambiata`. L'assegnazione
  scambiata resta marcata `attiva` con un nuovo titolare, senza traccia
  di stato che segnali lo storico cambio.
