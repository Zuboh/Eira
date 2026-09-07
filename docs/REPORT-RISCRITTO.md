# Report — Sistema Consegne Infermieristiche (Eira)

> Riscrittura a mano, sezione per sezione, del report Pegaso —
> metodo fact-sheet (design in `docs/superpowers/specs/
> 2026-08-16-report-riscrittura-design.md`). `REPORT.md`/
> `REPORT-BOZZA.md` restano come riferimento fino a riscrittura
> completa, non toccati.

## PARTE PRIMA – DESCRIZIONE DEL PROCESSO

### 1. Utilizzo delle conoscenze e abilità derivate dal percorso di studio

Essendo già programmatore e sviluppatore web, alcune delle conoscenze affrontate durante il percorso universitario facevano già parte del mio lavoro quotidiano. I vari corsi mi hanno però permesso di consolidarle, approfondirle e applicarle in modo più strutturato all'interno del progetto.

Il corso di Basi di Dati mi ha permesso di riprendere e approfondire i database relazionali, i diagrammi entità-relazione, le cardinalità tra le entità — ad esempio relazioni uno-a-uno, uno-a-molti e molti-a-molti — e il linguaggio SQL, comprese le principali operazioni di interrogazione e manipolazione dei dati come SELECT, WHERE, JOIN, BETWEEN e altre.

Nel progetto ho utilizzato SQLite, scelto perché è un database file-based che non richiede la gestione di un server separato. Questa soluzione è risultata adeguata allo scope dell'applicazione, pensata per l'utilizzo all'interno di un singolo reparto e senza un carico elevato di scritture concorrenti.

Fondamenti di Programmazione 1 mi ha invece permesso di riprendere alcuni concetti fondamentali della programmazione, soprattutto attraverso l'utilizzo del linguaggio C e quindi con una prospettiva più vicina al funzionamento a basso livello dei programmi.

I corsi che hanno trovato un'applicazione più diretta nel progetto sono stati Programmazione 2 e Tecnologie Web, essendo il progetto costituito da una web application completa.

Programmazione 2 mi ha fornito basi più solide nell'utilizzo di Python, linguaggio con cui in precedenza avevo avuto soltanto esperienze occasionali. Questa maggiore familiarità ha contribuito alla scelta di FastAPI per la realizzazione del backend. Uno dei motivi della scelta è stato anche il fatto che la traccia richiedeva la documentazione delle API: FastAPI genera automaticamente una documentazione interattiva tramite OpenAPI/Swagger, aggiornata sulla base degli endpoint definiti nel codice.

Il backend è stato sviluppato in Python utilizzando anche un approccio orientato agli oggetti, ad esempio attraverso i modelli Pydantic e la separazione della logica applicativa in un service layer. Questo si collega ai concetti affrontati in Ingegneria del Software, in particolare alla programmazione orientata agli oggetti e ai suoi principi fondamentali: incapsulamento, ereditarietà, polimorfismo e astrazione.

Tecnologie Web è invece il corso nel quale partivo con maggiore esperienza, occupandomi professionalmente di sviluppo frontend con HTML, CSS, JavaScript e React. Proprio per questo motivo ho deciso di utilizzare Vue nel progetto, così da sperimentare un framework diverso rispetto a quello che utilizzo abitualmente e ampliare le mie competenze. La scelta ha avuto quindi anche un valore formativo e professionale, perché mi ha permesso di realizzare un progetto utilizzabile in futuro anche come dimostrazione delle competenze acquisite.

Un altro corso particolarmente utile è stato Ingegneria del Software, soprattutto per quanto riguarda UML e la modellazione del comportamento del sistema.

L'UML, Unified Modeling Language, è una notazione grafica standard utilizzata per rappresentare e progettare un sistema software in modo rigoroso, permettendo di descriverne sia la struttura sia il comportamento prima o durante la scrittura del codice. I diagrammi UML possono essere divisi principalmente in diagrammi strutturali, come il diagramma delle classi, e diagrammi comportamentali, come i diagrammi dei casi d'uso, di sequenza o le macchine a stati.

Nel mio progetto ho utilizzato in particolare il concetto di macchina a stati per rappresentare il flusso di approvazione del cambio turno. Una richiesta non passa semplicemente da "non approvata" ad "approvata", ma attraversa diversi stati definiti: inizialmente è in_attesa_collega, successivamente passa a in_attesa_caposala e infine può diventare approvata. In ciascuno dei passaggi è inoltre possibile arrivare a uno stato di rifiuto. Questo permette di modellare il processo come una sequenza controllata di transizioni, evitando che una richiesta possa trovarsi in uno stato non coerente con il flusso previsto.

Non individuerei quindi un singolo corso come il più utile in assoluto: corsi differenti mi hanno fornito conoscenze applicabili a parti differenti del progetto. La parte teorica è stata utile soprattutto per acquisire un metodo di progettazione più strutturato rispetto allo sviluppo puramente operativo.

Un esempio è il diagramma entità-relazione, che è stato progettato prima dell'implementazione del database e successivamente aggiornato durante lo sviluppo. Il modello iniziale comprendeva 11 entità, mentre quello finale ne comprende 18. Questo mostra come il diagramma non sia stato utilizzato soltanto come documentazione finale, ma come vero strumento di progettazione, modificato parallelamente all'evoluzione dei requisiti dell'applicazione.

Anche per quanto riguarda l'autenticazione, la teoria mi ha aiutato a prendere decisioni più consapevoli. Il sistema utilizza token JWT con una durata di 8 ore, scelta effettuata prendendo come riferimento la durata tipica di un turno infermieristico. Per la memorizzazione delle password ho utilizzato invece bcrypt, approfondendone il funzionamento e scegliendo direttamente una libreria compatibile, dopo aver verificato che Passlib presentava problemi di compatibilità con le versioni più recenti di bcrypt.

Una delle competenze principali acquisite durante il progetto è stato l'utilizzo di Vue, framework che non avevo utilizzato in modo significativo prima di questo lavoro.

Pur avendo già esperienza con React, il passaggio a Vue ha richiesto di adattarmi a un modello mentale differente.

Una prima differenza riguarda il modo in cui viene descritta l'interfaccia. React utilizza prevalentemente JSX, quindi markup e logica JavaScript vengono scritti insieme all'interno del componente. Vue utilizza invece principalmente dei template, che vengono successivamente compilati dal framework. Questo porta a una separazione più evidente tra struttura dell'interfaccia, logica e stile.

Un'altra differenza importante riguarda il ciclo di vita dei componenti. In React molte operazioni vengono gestite tramite useEffect, che può essere utilizzato per finalità differenti e può diventare più difficile da seguire quando nello stesso componente sono presenti molti effetti e dipendenze. In Vue vengono invece utilizzati strumenti più specifici, come onMounted, onUnmounted e watch, che rendono più esplicito il momento o la condizione nella quale una determinata logica deve essere eseguita.

Anche il sistema di reattività è differente. Vue utilizza un sistema basato principalmente su Proxy che permette al framework di tracciare in modo fine quali dati vengono utilizzati dalle varie parti dell'interfaccia. Quando un valore cambia, Vue può quindi aggiornare in maniera mirata le parti interessate.

In React, invece, quando cambia uno stato viene normalmente rieseguita la funzione del componente. React genera quindi una nuova rappresentazione dell'interfaccia e utilizza il processo di reconciliation per determinare quali parti del DOM devono effettivamente essere aggiornate.

Imparare Vue mi ha quindi richiesto non semplicemente di apprendere una nuova sintassi, ma di abituarmi a un differente modo di strutturare componenti, stato, lifecycle e reattività. Proprio questo confronto con React è stato uno degli aspetti più formativi del progetto.

### 2. Fasi di lavoro e relativi tempi di implementazione per la predisposizione dell'elaborato

Il piano iniziale prevedeva circa 7 settimane di lavoro, con un target personale fissato al 20 agosto 2026 e un ulteriore margine di sicurezza fino alla scadenza ufficiale della piattaforma del 21 settembre 2026.

Lo sviluppo effettivo dell'applicazione si è però concentrato in un periodo molto più breve, dal 4 luglio al 4 agosto 2026, durante il quale sono stati prodotti 128 commit.

La prima fase, avviata il 4 luglio, è stata dedicata alla progettazione iniziale: definizione del diagramma entità-relazione con 11 entità, creazione dello scaffold del progetto FastAPI e Vue e impostazione del primo contratto API attraverso router inizialmente definiti come stub.

Tra il 4 e il 18 luglio si è sviluppata gran parte del backend: modelli dati, autenticazione tramite JWT, operazioni CRUD relative a consegne, turni, pazienti e valutazioni e alcune funzionalità aggiuntive, tra cui cambio turno, banca ore e gestione delle ferie. Durante questa fase sono stati inoltre eseguiti i primi interventi di sicurezza, compresa la correzione di un problema di autorizzazione IDOR tra reparti.

Contrariamente a quanto previsto dal piano iniziale, lo sviluppo frontend non è iniziato dopo il completamento del backend, ma è proceduto in parallelo. Nello stesso periodo sono quindi state realizzate le schermate di login, selezione utente e reparto, le dashboard per infermiere e caposala e le principali sezioni applicative dedicate a pazienti, consegne SBAR, cambio turno e banca ore.

Il 18 luglio è stata introdotta anche una pipeline di qualità del codice, comprendente Ruff per Python, ESLint e Prettier per il frontend e una pipeline GitHub Actions eseguita automaticamente a ogni push. Nello stesso periodo sono stati introdotti i primi test automatici.

Dal 19 luglio al 3 agosto il lavoro si è concentrato maggiormente su integrazione, refactoring e hardening. Il frontend è stato sottoposto a un processo di refactoring architetturale articolato in 17 fasi. Sono stati inoltre introdotti test end-to-end con Playwright, controlli automatici di accessibilità tramite axe-core e ulteriori interventi di hardening sull'autenticazione JWT e sulla configurazione di deploy. L'audit di accessibilità ha permesso di individuare e correggere sei problemi reali nell'interfaccia.

Il 4 agosto è stata completata anche la documentazione visiva dell'applicazione, realizzando 17 screenshot relativi ai principali flussi funzionali e a entrambi i ruoli previsti dal sistema.

La fase successiva è stata dedicata alla scrittura e revisione del report. Questa attività ha subito un rallentamento rispetto alla pianificazione iniziale a causa della necessità di preparare contemporaneamente due esami universitari, ed è stata ripresa in modo continuativo il 7 settembre 2026.

Nel complesso, quindi, lo sviluppo tecnico è stato completato con largo anticipo rispetto al target personale del 20 agosto. Il principale scostamento temporale ha riguardato la fase finale di redazione e revisione del report, non lo sviluppo dell'applicazione.

Lo scostamento più significativo dal piano iniziale ha riguardato l'organizzazione delle fasi di backend e frontend.

Nel piano queste erano previste in sequenza: prima backend nelle settimane 2 e 3, successivamente frontend nelle settimane 4 e 5. Durante lo sviluppo ho invece scelto di portarle avanti in parallelo.

Questa scelta si è rivelata positiva perché ha permesso di individuare molto prima eventuali problemi di integrazione e incongruenze nel contratto tra frontend e backend. Proprio durante questa fase ho deciso di sostituire l'utilizzo diretto di Axios con openapi-fetch, sfruttando la specifica OpenAPI generata dal backend per rendere più coerente e tipizzata la comunicazione tra client e API.

Un secondo scostamento ha riguardato la documentazione. Sebbene l'applicazione fosse sostanzialmente completata il 4 agosto, la prima bozza prodotta in quella data è stata successivamente scartata come versione definitiva. Il 16 agosto è stata quindi avviata una riscrittura manuale, interrotta per circa tre settimane a causa della sovrapposizione con la preparazione di due esami. Il buffer previsto fino alla scadenza ufficiale si è quindi rivelato utile per assorbire questo rallentamento senza incidere sul completamento tecnico del progetto.

Durante lo sviluppo ho incontrato alcune difficoltà tecniche, soprattutto legate alla sicurezza, ai test e all'utilizzo di tecnologie che conoscevo meno.

Una prima difficoltà ha riguardato i controlli di accesso ai dati. In un endpoint della banca ore mancava un controllo che verificasse correttamente che il caposala potesse accedere solo ai dati del proprio reparto. Il problema è stato individuato durante una revisione sistematica degli endpoint ed è stato corretto aggiungendo il controllo mancante. Da quel momento ho iniziato a verificare in modo più sistematico questo tipo di controllo ogni volta che aggiungevo nuovi endpoint.

Un secondo problema è stato causato da una incompatibilità tra bcrypt e Passlib, due librerie utilizzate per la gestione delle password. Il problema non produceva inizialmente un errore molto chiaro ed è stato individuato grazie ai test automatici. Ho risolto utilizzando una versione compatibile della libreria e aggiungendo un test per evitare che lo stesso problema potesse ripresentarsi in futuro.

Un'altra difficoltà ha riguardato i test del backend. In una prima configurazione, alcuni test utilizzavano accidentalmente il database reale dell'applicazione invece di un ambiente separato. Ho quindi modificato la configurazione dei test in modo da isolare completamente il database utilizzato durante l'esecuzione della suite automatica.

Durante i controlli di accessibilità con axe-core sono comparsi anche alcuni errori legati direttamente ai componenti della libreria PrimeVue e non al codice scritto da me. In questi casi ho verificato singolarmente le segnalazioni e ho escluso solamente quelle che non potevano essere corrette a livello applicativo, documentando le eccezioni nei test.

Infine, una delle difficoltà principali è stata l'utilizzo di Vue, che non avevo mai usato prima in un progetto completo. All'inizio questo ha rallentato leggermente lo sviluppo perché ho dovuto imparare il funzionamento del framework e alcune differenze rispetto a React. Ho comunque scelto di continuare con Vue, perché imparare una nuova tecnologia era uno degli obiettivi formativi del progetto.

### 3. Risorse e strumenti impiegati

Per la realizzazione del progetto sono stati utilizzati strumenti differenti per backend, frontend, progettazione, testing e controllo della qualità del codice. Le tecnologie non sono state scelte solamente in base alla familiarità precedente, ma anche in funzione dei requisiti richiesti dalla traccia e degli obiettivi formativi del progetto.

Il backend è stato sviluppato con Python e FastAPI, utilizzando SQLite come database, SQLAlchemy per l'accesso ai dati e Alembic per la gestione delle migrazioni dello schema.

La scelta di FastAPI è stata legata anche a un requisito della traccia, che richiedeva la documentazione delle API tramite uno strumento come Swagger. FastAPI genera automaticamente una specifica OpenAPI a partire dagli endpoint definiti nell'applicazione e mette a disposizione una documentazione interattiva delle API senza doverla mantenere separatamente dal codice.

Per la definizione e validazione dei dati sono stati utilizzati i modelli Pydantic, che permettono di dichiarare in modo esplicito i tipi e la struttura dei dati scambiati attraverso le API. Questa organizzazione si integra con la separazione della logica applicativa in un service layer e con l'approccio a oggetti utilizzato nel backend.

Per la gestione dell'evoluzione del database è stato scelto Alembic. Rispetto alla semplice creazione automatica delle tabelle tramite create_all, le migrazioni permettono di registrare e applicare in modo controllato le modifiche allo schema nel corso dello sviluppo.

Prima di scegliere definitivamente FastAPI avevo valutato anche un backend basato su Kotlin e Ktor. Kotlin avrebbe offerto una tipizzazione forte e Ktor un buon supporto alla programmazione asincrona tramite coroutine. La soluzione è stata però scartata principalmente per una questione di tempo e rischio progettuale: non avevo esperienza produttiva con l'ecosistema JVM e avrei dovuto imparare contemporaneamente strumenti come Gradle, la gestione delle dipendenze e il sistema di testing di Ktor. Python era invece un linguaggio che conoscevo già parzialmente, rendendo FastAPI una scelta più sostenibile per i tempi del progetto.

Il frontend è stato sviluppato con Vue 3, Vite e TypeScript, utilizzando Pinia per la gestione dello stato e PrimeVue come libreria di componenti.

La scelta di Vue non è stata fatta per ridurre i tempi di sviluppo. Lavorando già professionalmente con React, ho deciso volontariamente di utilizzare un framework che non conoscevo per ampliare le mie competenze e confrontarmi con un modello di sviluppo frontend differente.

PrimeVue è stato utilizzato soprattutto per componenti di interfaccia ricorrenti, come tabelle, finestre di dialogo e form. In questo modo è stato possibile concentrarsi maggiormente sulla logica e sui flussi dell'applicazione senza dover implementare da zero componenti UI standard.

Un aspetto importante dell'integrazione tra frontend e backend è stato il contratto API tipizzato. Nelle prime fasi era stato utilizzato un normale client basato su Axios. Dopo che il contratto delle API si è stabilizzato, questo approccio è stato sostituito con openapi-fetch e openapi-typescript.

I tipi TypeScript utilizzati dal frontend vengono generati direttamente dalla specifica OpenAPI prodotta dal backend. In questo modo le modifiche alla struttura delle richieste e delle risposte possono essere rilevate anche durante lo sviluppo del frontend, riducendo la possibilità che client e server utilizzino definizioni differenti dello stesso dato.

Per la realizzazione dei diagrammi entità-relazione e UML è stato utilizzato draw.io.

La scelta è stata anche pratica: il template Word fornito dall'università non permette di mantenere diagrammi renderizzati dinamicamente all'interno del documento. I diagrammi sono stati quindi realizzati separatamente ed esportati come immagini PNG statiche da inserire nel report.

Durante lo sviluppo sono stati introdotti diversi strumenti automatici per controllare la qualità del codice.

Sul backend è stato utilizzato Ruff per il linting del codice Python. Sul frontend sono stati utilizzati ESLint per il controllo statico del codice TypeScript e Prettier per mantenere una formattazione uniforme.

Il backend dispone inoltre di una suite automatica basata su pytest, utilizzata per verificare il comportamento delle API e della logica applicativa.

Per il frontend sono presenti 232 test Vitest distribuiti su 27 file, dedicati alla verifica di componenti e logica applicativa.

A questi si aggiungono 10 scenari end-to-end realizzati con Playwright, utilizzati per verificare i principali flussi dell'applicazione dal punto di vista dell'utente. Nei test end-to-end è stato integrato anche axe-core, utilizzato per eseguire controlli automatici di accessibilità sulle schermate.

L'esecuzione di questi controlli è stata integrata in GitHub Actions. La pipeline CI viene eseguita automaticamente a ogni push e pull request, permettendo di individuare errori di linting o test falliti durante l'evoluzione del progetto anziché soltanto al termine dello sviluppo.

Il codice sorgente del progetto è pubblicato in un repository pubblico GitHub, Zuboh/Eira.

Lo sviluppo è stato registrato attraverso commit incrementali e datati durante tutto il periodo di realizzazione. Considerando la fase di sviluppo tecnico compresa tra il 4 luglio e il 4 agosto 2026, sono stati effettuati 128 commit; i commit successivi riguardano invece attività svolte dopo il completamento tecnico del progetto, tra cui la documentazione.

La scelta di mantenere il repository pubblico e uno storico incrementale non è stata fatta solamente per il versionamento del codice. Lo storico permette anche di rendere verificabile l'evoluzione del progetto nel tempo e di fornire, qualora fosse necessario un controllo successivo, un'ulteriore evidenza del processo di sviluppo e dell'autorialità del lavoro.

---

## PARTE SECONDA – PREDISPOSIZIONE DELL'ELABORATO

### 1. Obiettivi del progetto

_[da scrivere]_

### 2. Contestualizzazione

_[da scrivere]_

### 3. Descrizione dei principali aspetti progettuali

_[da scrivere — sotto-blocchi: architettura, case study IDOR, 4 snippet, documentazione API]_

### 4. Campi di applicazione

_[da scrivere]_

### 5. Valutazione dei risultati

_[da scrivere]_
