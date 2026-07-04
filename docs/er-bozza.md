# Bozza ER testuale — Consegne Infermieristiche

Bozza pre-diagramma (draw.io, giorno 2). Fonte: sez.1 piano Sett.1 design.

## Entità

- **Reparto** — id, nome, descrizione
- **Utente** — id, email, password_hash, nome, cognome, ruolo (infermiere|caposala), reparto_id FK, attivo
- **ProfiloInfermiere** — utente_id PK/FK 1:1, ore_contrattuali_mensili
- **Paziente** — id, nome, cognome, eta, letto, data_ricovero, diagnosi_ingresso, reparto_id FK, dimesso
- **Turno** — id, data, tipo (mattina|pomeriggio|notte), reparto_id FK, ora_inizio, ora_fine — unique(data, tipo, reparto_id)
- **AssegnazioneTurno** — id, turno_id FK, infermiere_id FK, stato (attiva|cambiata) — unique(turno_id, infermiere_id)
- **ConsegnaSbar** — id, paziente_id FK, turno_id FK, autore_id FK, situation, background, assessment, recommendation, priorita (normale|urgente), creata_il — unique(paziente_id, turno_id)
- **VoceDiarioCedema** — id, paziente_id FK, autore_id FK, turno_id FK (opzionale), timestamp, coscienza, emotivita, dolore, emodinamica, mobilizzazione, allert
- **ValutazioneNorton** — id, paziente_id FK, autore_id FK, data_valutazione, condizioni_generali, stato_mentale, attivita, mobilita, incontinenza, punteggio_totale
- **ValutazioneConley** — id, paziente_id FK, autore_id FK, data_valutazione, storia_cadute, deficit_visivo, alterazione_eliminazione, agitazione, deficit_vista_osservato, andatura_alterata, punteggio_totale
- **RichiestaCambioTurno** — id, assegnazione_turno_id FK, richiedente_id FK, collega_id FK, stato (in_attesa_collega|rifiutata_collega|in_attesa_caposala|rifiutata_caposala|approvata), creata_il, risposta_collega_il, risposta_caposala_id FK, risposta_caposala_il, motivo_rifiuto

## Relazioni

- Reparto 1—N Utente, Paziente, Turno
- Utente 1—1 ProfiloInfermiere
- Turno 1—N AssegnazioneTurno
- Utente 1—N AssegnazioneTurno
- Paziente / Turno / Utente 1—N ConsegnaSbar
- Paziente / Utente / Turno(opz.) 1—N VoceDiarioCedema
- Paziente 1—N ValutazioneNorton, ValutazioneConley
- AssegnazioneTurno 1—N RichiestaCambioTurno
- Utente 1—N RichiestaCambioTurno (3 ruoli FK: richiedente / collega / approvatore caposala)

## Banca ore

Nessuna tabella dedicata — derivata via query: `Σ durata AssegnazioneTurno attive nel mese − ore_contrattuali_mensili`.

## Prossimo passo

Diagramma ER in draw.io (skill `draw-io-diagram-generator`), export PNG in `docs/diagrams/`.
