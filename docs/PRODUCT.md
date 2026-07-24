# Product

## Register

product

## Users

Infermieri e capo-sala reparto ospedaliero. Contesto d'uso: turno anche
notturno, stress operativo, spesso su desktop/tablet di reparto. Job to
be done: consultare/gestire turni, consegne, pazienti attivi, cambi
turno e banca ore in modo rapido e senza ambiguità — non un'esperienza
da esplorare, uno strumento da leggere a colpo d'occhio.

## Product Purpose

Eira è un'app di handover infermieristico (nursing handover) full-stack:
sostituisce consegne cartacee/informali con un sistema strutturato per
turni, SBAR, pazienti, cambi turno e banca ore. Successo = un infermiere
o capo-sala trova l'informazione che cerca (turno, consegna, priorità
SBAR) senza fraintendimenti, anche a fine turno notte sotto stress.

## Brand Personality

Affidabile, calmo, essenziale. Voce diretta, mai motivazionale o
consumer. Nessuna ambizione di "delight" decorativo: la fiducia viene
dalla prevedibilità e leggibilità, non dall'impatto visivo.

## Anti-references

Non deve somigliare a SaaS consumer generico: niente hero da landing
page, niente gradient/glow, niente emoji, niente copy motivazionale
vuoto ("Elevate", "Seamless"), niente animazioni decorative in loop.
Riferimento categoria da evitare: Notion/Linear-style marketing surface
applicata a un tool clinico — qui la prima vista dopo login è già
dashboard operativa.

## Design Principles

- Leggibilità e velocità di lettura sopra impatto estetico — ogni
  scelta va giudicata su "si legge in 2 secondi a fine turno notte?".
- Prevedibilità reparto per reparto: stessa vista, stesso pattern,
  bassa variance.
- Dati reali, non finti: numeri organici, nomi test realistici, stati
  chiari (mai solo colore, sempre colore + testo per daltonismo).
- Tabelle per liste dense, card solo per riepiloghi/stat tile.
- Motion quasi assente: un'unica eccezione (pulse su stato live/in
  attesa), nessun'altra animazione in loop.

## Accessibility & Inclusion

WCAG AA come baseline (contrasto testo/sfondo). Daltonismo: stati
sempre comunicati con colore + testo/icona, mai solo colore (vedi badge
di stato in DESIGN.md sez. 3). Touch target minimo 44px anche su
desktop per tablet reparto touchscreen.
