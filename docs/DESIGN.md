# Eira — sistema visivo

Il prodotto usa superfici neutre, gerarchie tipografiche e divisori leggeri.
Il verde bosco identifica azioni e selezione; gli stati clinici e operativi hanno
colori ed etichette indipendenti. Nessun gradiente, ombra di sezione o card annidata.
Vue 3, TypeScript, PrimeVue 4, Pinia e Router restano lo stack dell'applicazione.

## Fonte dei token

`frontend/src/style.css` contiene i valori; `frontend/src/theme.ts` adatta questi
valori al preset Aura attraverso `definePreset` di `@primeuix/themes`.
`main.ts` registra il preset, il tema automatico e gli strati degli overlay.
Non introdurre una seconda palette in componenti o preset.

Convenzione CSS: `--eira-<categoria>-<ruolo>`, nomi kebab-case.

1. **Primitivi:** `color-*`, `space-*`, `radius-*`, `font-*`, `size-touch`, motion,
   ombre e strati. I valori letterali di colore vivono qui.
2. **Semantici:** `bg-*`, `text-*`, `border-*`, `action-*`, `focus-ring`, `status-*`.
   I componenti consumano questi ruoli, non un colore della palette.
3. **Componente/layout:** `sidebar-*`, `dialog-*`, `table-min-wide`, `page-*`,
   `shift-*`. Servono a geometrie o significati reali. Non creare un alias per
   ogni singolo selettore.

Non restano alias del vecchio sistema. Le variabili `--p-*` appartengono a
PrimeVue e vengono alimentate dal preset; `--fc-*` sono l'adattatore FullCalendar.
Le media query usano valori letterali documentati: le custom property CSS non
sono utilizzabili come condizioni delle media query.

## Colori e temi

I fallback di bootstrap in `index.html` riprendono i colori del canvas prima del caricamento del CSS.

Il tema segue `prefers-color-scheme`, sia in CSS sia in PrimeVue (`system`).
Il dark ha superfici stratificate e brand più chiaro, non colori invertiti.

| Ruolo                        | Light     | Dark      |
| ---------------------------- | --------- | --------- |
| `bg-canvas`                  | `#FFFFFF` | `#191B19` |
| `bg-surface`                 | `#FFFFFF` | `#20231F` |
| `bg-subtle`                  | `#F7F7F5` | `#252924` |
| `bg-hover`                   | `#F0F0EC` | `#353B33` |
| `text-primary`               | `#37352F` | `#E9ECE6` |
| `text-secondary`             | `#706D66` | `#B2B8AD` |
| `text-disabled`              | `#8A877F` | `#767E73` |
| `border-default`             | `#E7E7E2` | `#353B33` |
| `border-control`             | `#8A877F` | `#767E73` |
| `action-primary` / focus     | `#3F6B57` | `#A8C7B1` |
| `action-primary-hover`       | `#315443` | `#BCD5C3` |
| `action-on-primary`          | `#FFFFFF` | `#18271C` |
| `action-selected-background` | `#EAF1EC` | `#2D4033` |
| `action-selected-text`       | `#315443` | `#C8DDCF` |

`#91AB98` è il salvia decorativo, non un colore per testo o bordi di controllo.
`border-default` separa sezioni, non identifica da solo un input. Il bordo dei
controlli usa il ruolo più contrastato `border-control`.

| Stato        | Testo light / fondo   | Testo dark / fondo    |
| ------------ | --------------------- | --------------------- |
| Successo     | `#166534` / `#EDF7EF` | `#A7DCB5` / `#24382A` |
| Avviso       | `#8A4B08` / `#FFF5DF` | `#F0CD8C` / `#3C321F` |
| Errore       | `#B42318` / `#FFF0EE` | `#FFB4AB` / `#432826` |
| Informazione | `#215A8A` / `#EFF5FC` | `#A9CFF2` / `#263544` |
| Neutro       | `#706D66` / `#F0F0EC` | `#B2B8AD` / `#353B33` |

`StatusBadge` traduce priorità e stati in etichette comprensibili. La priorità
urgente non usa il verde brand. SBAR e SOAPIE sono etichette di formato neutre.
Mattina, pomeriggio, notte, riposo e ferie hanno etichette oltre al colore.
Non usare opacità sulle informazioni dei turni passati: ridurrebbe il contrasto.

## Tipografia, dimensioni e movimento

- Geist locale, fallback system sans. Geist Mono solo per la password temporanea.
- Root 16 px; corpo 14 px; contenuto clinico 15 px; metadati 13 px (12 dove denso).
- Titoli pagina 28–32 px; pesi 400/500, 600 per titoli e dati di rilievo.
- `.numeric` e `.mono` usano cifre tabulari; `.numeric` allinea a destra.
  `.mono` è mantenuta per i chiamanti esistenti e non forza il monospace.
- Spazi: 4, 8, 12, 16, 20, 24, 32, 40, 48 px (`space-1`…`space-12`).
- Raggi: 4 px compatti, 6 px ordinari, 8 px popover, 10 px dialog.
- Bordi 1 px. Sezioni e tabelle senza ombra; overlay con ombra 0 4 16 / 12%
  (28% dark).
- Input, pulsanti e target interattivi almeno 44 px; i controlli `small`
  riducono padding e testo, non il target. Nessuna area trasparente sovrapposta
  ai controlli vicini per simulare la dimensione touch.
- Transizioni 150 ms ease-out; riduzione del movimento rispettata. Nessuna
  traslazione o scala decorativa al passaggio del mouse.
- Strati: sticky 10, menu/overlay 1000, modal 1100, tooltip 1200.

## Shell e layout

- Desktop ≥1024 px: sidebar 232 px, fondo secondario, gruppi Panoramica,
  Assistenza e Organizzazione filtrati per ruolo. Le etichette e i permessi
  provengono dal router; la selezione della cartella mantiene attivo Pazienti.
- Tablet 768–1023 px: rail 72 px, icone con nome accessibile e tooltip.
- Mobile <768 px: topbar e Drawer. Escape, focus trap e ripristino del focus
  sono affidati a PrimeVue. Skip link verso il contenuto principale.
- Padding pagina 16–32 px; contenitori 75 rem ordinari, 90 rem dashboard.
- A 640 px gli header impilano le azioni; a 600 px il calendario infermiere
  passa alla lista mensile; la composizione clinica della dashboard si impila
  sotto 1200 px. I controlli restano utilizzabili fino a 320 px.
- Scroll orizzontale confinato alle regioni tabellari, mai alla pagina.

## Componenti e regole d'uso

### PageHeader e sezioni

`PageHeader` contiene titolo, sottotitolo/reparto opzionali e slot azioni.
Una sola azione primaria per contesto; azioni di riga appartengono alla riga.
`EiraCard` è una sezione con spazio e divisore, non una scatola decorativa.
La variante `flush` delega separazione e padding al contenuto, evitando bordi
annidati nelle tabelle e nei tab clinici.

### Pulsanti e form

Usare direttamente `Button` PrimeVue: primary per la conferma, secondary con
bordo per alternative, `text` per ghost, danger per azioni distruttive.
La classe `eira-saving-button` riserva lo spazio dello spinner per evitare
spostamenti durante il salvataggio. `loading` disabilita il pulsante.

`FormField` offre label persistente, required, help/error e lo slot `fieldAttrs`.
Gli attributi includono `aria-labelledby` verso la label persistente e devono raggiungere il controllo focusabile:

- InputText/Textarea: `v-bind="fieldAttrs"`;
- Select: `:pt="{ label: fieldAttrs }"`;
- DatePicker/InputNumber: `:pt="{ pcInputText: { root: fieldAttrs } }"`;
- Password: `:input-props="fieldAttrs"`.

`for-id` corrisponde a `id` o `input-id`. Gli errori hanno ID associato,
`role="alert"` e `aria-invalid`; required ha simbolo e attributo ARIA.
Le validazioni native/API restano attive. Gli errori di salvataggio devono
comparire nel dialog che contiene il form. Il testo inserito si conserva in
caso di errore. La consegna mantiene conferma di abbandono, bozze per tipo,
parser e copy-forward; il salvataggio è sempre esplicito.

### Tabelle e stati

`EiraTable` ha priorità loading → error → empty → dati. Offre retry opzionale,
skeleton e una regione nominata e focusabile. Dare a ogni tabella una `label`
specifica, soprattutto quando più tabelle convivono nella stessa vista.
Il contenitore scroll è posizionato per confinare anche le etichette nascoste.

Header 13 px, peso 500, nessun maiuscolo o tracking. Divisori sottili e hover
neutro; dati confrontabili tabulari. Azioni sempre visibili. I pazienti si aprono
tramite link espliciti: nessuna riga cliccabile con controlli annidati.

`InlineError` gestisce errori contestuali e retry; `EmptyState` spiega l'assenza
di dati. Un caricamento fallito non deve produrre uno stato “nessun dato”.
Gli skeleton seguono la struttura esistente, senza animazioni decorative.
Non sono stati aggiunti toast per errori persistenti.

### Dialog e overlay

DatePicker mantiene giorni da 44 px e pannello da 318 px anche a 320 px.
I checkbox/radio usano una label cliccabile alta almeno 44 px.
Le icone mostra/nascondi password sono pulsanti, utilizzabili da tastiera.
Gli adattamenti PT in `main.ts` correggono gli attributi ARIA del DatePicker e
del Password nella versione PrimeVue installata, senza modificare la libreria.

Larghezze dialog 24/28/32/44 rem, sempre limitate al viewport. Titolo 18 px,
contenuto scrollabile, footer con divisore e azioni che vanno a capo.
PrimeVue gestisce focus e tastiera; il dialog consegna intercetta Escape senza
saltare la conferma di abbandono e lascia chiudere prima un Select aperto.

## Viste

- Diario: data, paziente, autore, priorità testuale e situazione, paginazione,
  creazione/modifica con gli stessi permessi e strutture SBAR/SOAPIE.
- Pazienti: identità come link, letto, età tabulare, diagnosi e data completa.
- Cartella: identità, stato e letto in evidenza; proprietà e tre tab separati
  per diario, parametri e valutazioni. Timeline strutturata per sezioni,
  autore, data e priorità. Nessun nuovo schema ISBAR/API introdotto.
- Dashboard infermiere: prossimi turni e richieste, pazienti e diario,
  calendario, farmaci sotto soglia e banca ore.
- Dashboard caposala: priorità operative, cambi da gestire, turni scoperti,
  calendario delle assegnazioni. Nessun dato sintetico inventato.
- Cambi turno, ferie, personale, farmaci e banca ore riusano tabelle/form.
- Profilo come sezioni; login come elenco reparto/utente e form password,
  inclusa la sostituzione della password temporanea.

Gli autori sono risolti tramite la directory utenti già autorizzata per reparto.
Se non disponibile si mostra `Operatore #ID`; il diario resta consultabile.

## Verifica

Piano, risultati e limiti: [redesign/PLAN.md](redesign/PLAN.md).
Non confondere una scansione axe con una certificazione di accessibilità:
servono anche uso da tastiera, verifica visiva e valutazione assistiva umana.
