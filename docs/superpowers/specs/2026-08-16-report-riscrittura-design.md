# Riscrittura completa del report Eira — design

## Contesto

Il report (`docs/REPORT.md` / `docs/REPORT-BOZZA.md`) è una bozza
completa (~5760 parole, entrambe le parti del template Pegaso), già
passata da `humanizer`, con solo 2 sezioni marcate esplicitamente
"[DA SCRIVERE IN PRIMA PERSONA]" (Obiettivi, Valutazione risultati).

Decisione (2026-08-16, in sessione col vault): non limitarsi alle 2
sezioni marcate — rileggere e riscrivere l'intero documento a mano,
sezione per sezione, per stare più larghi rispetto al minimo richiesto
dalla regola antiplagio già fissata (v. `wiki/Projects/
Tesi-Consegne-Infermieristiche.md` § Antiplagio nel vault, e memoria
`feedback_academic_integrity_ai_text` in `~/.claude/projects/
-Users-zubo-Obsidian-zubo-vault/memory/`).

Codice fermo dal 4 agosto 2026 (128 commit, invariato) — nessun rischio
che il contenuto tecnico diventi stale durante la riscrittura.

## Scope

Riscrittura di tutte le 8 sezioni prosa, struttura ufficiale template
Pegaso (etichette esatte):

**Parte Prima – Descrizione del processo**
1. Utilizzo delle conoscenze e abilità derivate dal percorso di studio
2. Fasi di lavoro e relativi tempi di implementazione
3. Risorse e strumenti impiegati

**Parte Seconda – Predisposizione dell'elaborato**
1. Obiettivi del progetto
2. Contestualizzazione
3. Descrizione dei principali aspetti progettuali (da spezzare in
   sotto-blocchi: architettura, case study IDOR, 4 snippet commentati,
   documentazione API — troppo densa per un fact-sheet unico)
4. Campi di applicazione
5. Valutazione dei risultati

Fuori scope: campi di copertina (già compilati), bibliografia (solo
formattazione, non prosa da riscrivere).

## Metodo — fact-sheet poi scrittura libera

Per ogni sezione (o sotto-blocco di §3 Parte Seconda), estraggo dalla
bozza esistente e dal codice/vault solo i fatti verificabili, come
bullet nudi senza prosa — niente frasi già formate, niente struttura di
frase da poter trascinare nella riscrittura. Lorenzo scrive la sezione
guardando solo il fact-sheet, non la bozza AI.

Alternative scartate:
- **Editing riga per riga** della bozza esistente — più veloce ma
  rischio concreto di mantenere ritmo/struttura di frase AI, in
  tensione diretta con l'obiettivo dichiarato di rileggere tutto.
- **Leggi e ricorda** (leggere la bozza una volta, poi riscrivere a
  memoria) — massima distanza dalla bozza originale, ma più lento e
  pesante su 8 blocchi; fact-sheet ritenuto sufficiente come compromesso.

## Cadenza e tracking

Una sezione (o sotto-blocco) per sessione: fact-sheet → scrittura →
check veloce di correttezza fattuale (non di stile) prima di passare
alla successiva.

Output salvato in un file nuovo, `docs/REPORT-RISCRITTO.md`,
sezione per sezione via commit incrementali — `REPORT.md` e
`REPORT-BOZZA.md` restano intatti come riferimento finché la
riscrittura non è completa. Ogni sezione completata = commit dedicato
(coerente con la pratica già in uso nel progetto di commit
incrementali e datati come evidenza di autorialità).

## Timeline

Target personale 20 agosto spostato: si usa parte del margine fino
alla scadenza ufficiale piattaforma (21 settembre 2026) — la
riscrittura completa a mano pesa più della sola personalizzazione
delle 2 sezioni originariamente marcate, non ha senso comprimerla per
una data auto-imposta.

## Dopo la riscrittura completa

- Passata leggera di `humanizer` opzionale (probabilmente superflua se
  il testo è genuinamente scritto a mano, da valutare a quel punto).
- Trasferimento nel template Word ufficiale (mappatura già fatta in
  `REPORT.md`, sezione "Mappatura sul template Word ufficiale").
- Riuso della checklist pre-consegna già presente in fondo a
  `REPORT-BOZZA.md` (figure, bibliografia formattata, conteggio
  parole, nomenclatura file upload).
