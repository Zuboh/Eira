# Redesign Eira — piano e registro

## Obiettivo

Interfaccia sobria con superfici neutre, brand bosco/salvia, sezioni leggibili,
tabelle leggere e controlli accessibili. Vue, PrimeVue, Pinia, Router, API e
policy di ruolo/reparto restano invariati. Branch `feat/eira-redesign`; nessun
push, deploy o merge. Nessuna nuova libreria UI o funzionalità clinica.

## Audit iniziale

- Palette duplicata in CSS e preset; focus PrimeVue azzerato.
- Ombre diffuse, card annidate, icone incorniciate, titoli pesanti e header maiuscoli.
- Pulsanti di 31 px su tablet; scroll clinico non focusabile a 320 px.
- Overflow del diario a 390 px; errori affiancati a stati vuoti fuorvianti.
- FormField senza associazione aiuto/errore; autore assente nella timeline.
- Cartella mobile: parametri e storico precedono e allontanano il diario.

Audit eseguito sui due ruoli con seed completo in DB temporaneo isolato.
Screenshot iniziali: `/private/tmp/eira-redesign-audit` (artefatti locali).
Baseline: 27 file / 232 test frontend passati; typecheck, lint, format e build OK.
Axe campionario: errore scroll focusabile nella cartella a 320 px; nessun errore
nei campioni pazienti 1440 light, diario 768 light, dashboard 1024 dark.
La suite E2E completa non era stata eseguita durante la pianificazione.

## Decisioni

- CSS è la fonte dei token; preset Aura è l'adattatore, senza palette duplicata.
- Primitivi `--eira-color/space/radius/font-*`, semantici
  `--eira-bg/text/border/action/focus/status-*`; token componente solo necessari.
- Geist locale, root 16 px, corpo 14–16, metadati 12–13, titoli 28–32.
- Spazi base 4 px; raggi 4/6/8/10; bordi 1 px; ombre soltanto overlay.
- Tema automatico; successo/avviso/errore/info/turni indipendenti dal brand.
- Sidebar 232 px, rail 72 px da 768 a 1023, drawer sotto 768.
- Riuso PageHeader, EiraCard, EiraTable, FormField, StatusBadge e feedback.
- Cartella: proprietà paziente e tab diario, parametri, valutazioni.
- Strutture, parser, bozze e copy-forward delle consegne preservati.

## Incrementi e componenti coinvolti

1. [x] Token, preset, font, AppShell e AppNavPanel.
2. [x] Primitive condivise, chiamanti, error/empty/loading e accessibilità.
3. [x] Piloti: ConsegneSbarView, PatientsTable, SchedaPazienteView e componenti clinici.
4. [x] Dashboard, calendari/assegnazioni, cambi turno, ferie, personale, banca ore,
       farmaci, profilo e login (inclusa password temporanea).
5. [x] Pulizia, documentazione del sistema reale e verifica finale.

## Completamento e verifica

Ogni incremento deve compilare; i piloti vanno verificati prima dell'estensione.
Matrice finale: due ruoli, light/dark, 1440/1024/768/390/320 px; contenuti lunghi,
tabelle piene, loading/empty/error/invalid/disabled/saving, menu/dialog aperti,
tastiera, focus, target 44 px, contrasto AA e nessun overflow di pagina.
Test mirati per comportamenti modificati; suite frontend/E2E, lint, format,
typecheck, build e openapi:check. Screenshot e risultati effettivi nel registro;
nessuna dichiarazione di verifica per scenari non eseguiti.

## Registro implementazione

### Risultato

- Token CSS a tre livelli e preset PrimeVue Aura allineati; palette light/dark,
  Geist locale, focus visibile, controlli da 44 px e transizioni ridotte.
  Rimossi Manrope, vecchi token, ombre decorative e trasformazioni hover.
- AppShell/AppNavPanel con sidebar neutra, gruppi per ruolo, rail e drawer;
  PageHeader, EiraTable, FormField, feedback e dialog condividono le stesse regole.
- Piloti completati prima dell'estensione: elenco pazienti con link espliciti,
  diario con autore e sezioni SBAR/ISBAR/SOAPIE, cartella con identità/letto,
  proprietà e tab distinti. Parser, bozze, copy-forward e salvataggi preservati.
- Sistema esteso alle due dashboard, turni/assegnazioni, cambi turno, ferie,
  personale, banca ore, farmaci, profilo e tutti i passaggi di login.
  Dashboard organizzate per attività, liste, tabelle e calendario.
- Errori distinti dagli stati vuoti, retry contestuali, errori nei dialog,
  salvataggio senza spostamenti e dati del form conservati in caso di errore.

### Correzioni emerse dalla verifica

Problemi preesistenti corretti: overflow del diario, regioni tabellari non
focusabili, controlli troppo piccoli, focus iniziale del dialog consegne,
associazione label/aiuto/errore e gestione della password temporanea.
Quest'ultima cercava un errore Axios, mentre il client restituisce `ApiError`:
il flusso ora interpreta il contratto esistente, coperto dai test del composable.
Nessuna modifica backend, alle API o alle autorizzazioni.

La migrazione ha richiesto correzioni verificate prima della chiusura:
etichette univoche delle tabelle, attributi ARIA sul vero input PrimeVue,
contrasto del giorno selezionato, gerarchia del titolo dell'anteprima e locator
E2E aggiornati alle label persistenti. Il controllo Axe attende la fine delle
animazioni finite, evitando misure sui colori intermedi della dissolvenza. Il preset e i Pass Through correggono
anche attributi ARIA non validi emessi da Select, DatePicker e Password installati.

### Evidenze

Matrice visiva acquisita il 15 ottobre 2026; suite E2E completa e controlli
statici/build conclusivi passati il 17 ottobre 2026.

| Verifica                           | Esito                                                             |
| ---------------------------------- | ----------------------------------------------------------------- |
| Frontend Vitest                    | 29 file, 239 test passati                                         |
| Typecheck, ESLint, Prettier, build | Passati                                                           |
| OpenAPI check                      | JSON e tipi TypeScript sincronizzati                              |
| E2E                                | 11/11 passati il 17 ottobre 2026                                  |
| Viste                              | 180 combinazioni: due ruoli, due temi, 1440/1024/768/390/320 px   |
| Dialog                             | 48 combinazioni: otto dialog, due temi, 1440/390/320 px           |
| Menu e overlay                     | 28 combinazioni: date picker, select, conferma, mese, drawer      |
| Login                              | 30 combinazioni: cinque passaggi/stati, due temi, 1440/390/320 px |
| Contrasto                          | 14 coppie per tema: soglie AA rispettate per gli usi documentati  |

Le matrici non rilevano overflow di pagina o violazioni Axe. Viste e dialog
includono misura dei target da 44 px; dialog includono focus iniziale e ritorno.
Menu/date picker verificati anche per contenimento nel viewport. Gli scenari E2E
aggiunti coprono nomi lunghi, scroll tabellare, errore rispetto a vuoto, retry,
required/invalid, salvataggio fallito e conservazione del form, loading stabile,
password visibile da tastiera e conferma delle modifiche non salvate.

I risultati per singolo caso sono in [verification.json](verification.json).
Il report delle viste consolida la matrice iniziale con il ricontrollo della
cartella dopo le correzioni. Le verifiche dei dialog e del login sono successive.
I rapporti non equivalgono a un collaudo clinico o a una certificazione WCAG.

La suite E2E usa Chrome installato: la cache Chromium locale non corrisponde
alla versione richiesta da Playwright. Una configurazione temporanea (non
consegnata) imposta `channel: 'chrome'` e timeout di avvio a 120 secondi;
la configurazione del progetto resta invariata. Avvio e seed sono stati eseguiti
su database temporanei isolati. Alcuni tentativi sono stati interrotti da limiti
del servizio di esecuzione, poi ripetuti; non sono conteggiati come verifiche riuscite.

### Screenshot esaminati

- [Elenco pazienti desktop](screenshots/pazienti-desktop.png)
- [Diario desktop](screenshots/diario-desktop.png)
- [Cartella desktop](screenshots/cartella-desktop.png)
- [Cartella mobile dark](screenshots/cartella-mobile-dark.png)
- [Dashboard infermiere](screenshots/dashboard-infermiere.png)
- [Dashboard caposala dark](screenshots/dashboard-caposala-dark.png)
- [Consegna mobile dark](screenshots/consegna-dialog-mobile-dark.png)
- [Date picker mobile](screenshots/datepicker-mobile.png)
- [Password temporanea mobile dark](screenshots/login-temporanea-mobile-dark.png)

### Limiti e attività residue

Implementazione delle viste richieste completata. Non verificati Safari/Firefox,
dispositivi fisici e lettori di schermo; resta consigliato il collaudo con utenti
infermieristici. Gli stati limite sono coperti nei componenti e in scenari mirati,
non in ogni combinazione possibile di ogni form. Suite backend non rieseguita:
nessun file backend modificato. Nessun push, merge o pubblicazione.

Regole definitive in [DESIGN.md](../DESIGN.md); colori misurati in
[CONTRAST.md](CONTRAST.md).
