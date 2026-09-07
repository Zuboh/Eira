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

L'obiettivo principale del progetto è stato rendere la consegna di turno più semplice, strutturata e guidata. In un contesto ospedaliero, soprattutto al termine di un turno impegnativo o durante il lavoro notturno, non volevo che la completezza della consegna dipendesse soltanto dalla memoria o dalla disciplina del singolo infermiere.

Per questo motivo ho progettato il sistema in modo che fosse l'applicazione stessa a guidare quali informazioni comunicare. Il flusso si basa principalmente sul metodo SBAR, affiancato dal diario CEDEMA e dalle valutazioni Norton e Conley, così da fornire una struttura precisa per l'inserimento e la consultazione delle informazioni rilevanti.

Fin dall'inizio ho individuato un nucleo di funzionalità che consideravo indispensabile: la gestione dei ruoli, la visualizzazione dei turni tramite dashboard e soprattutto la gestione delle consegne SBAR. In caso di problemi di tempo, tutte le funzionalità aggiuntive avrebbero potuto essere ridotte o eliminate prima di intervenire su questo nucleo centrale.

L'applicazione è stata pensata per infermieri e caposala di un reparto ospedaliero, con utilizzo principalmente da desktop o tablet di reparto. L'obiettivo pratico è permettere di consultare e gestire rapidamente turni, consegne, pazienti, richieste di cambio turno e banca ore, evitando per quanto possibile passaggi ambigui o informazioni difficili da trovare. Un criterio importante nella progettazione dell'interfaccia è stato quindi rendere le informazioni facilmente individuabili anche in una situazione di stanchezza o stress operativo, come può accadere alla fine di un turno notturno.

Accanto all'obiettivo funzionale ho scelto anche un obiettivo didattico personale: sviluppare il frontend con Vue, framework che non avevo mai utilizzato prima. Avendo già esperienza professionale con React, potevo usarlo come punto di riferimento per comprendere le differenze tra i due approcci e ampliare le mie competenze frontend.

Questo secondo obiettivo non doveva però mettere a rischio il completamento dell'applicazione. Avevo quindi previsto che, nel caso in cui la curva di apprendimento fosse risultata troppo lenta, avrei proseguito con quanto appreso fino a quel momento senza cambiare nuovamente framework a metà sviluppo. Nella pratica non è stato necessario fare questa scelta, perché l'apprendimento di Vue non ha creato un conflitto reale con l'obiettivo principale del progetto.

Ho inoltre mantenuto volutamente uno scope limitato a un singolo reparto, utilizzando solamente i dati clinici strettamente necessari alle funzionalità previste e lasciando fuori dallo scope una gestione estesa dei dati sanitari riconducibili all'art. 9 del GDPR, oltre a qualsiasi integrazione con dispositivi medici reali. La scelta è stata fatta per concentrare il lavoro sulla qualità del flusso di consegna, invece di ampliare il progetto a più reparti, integrazioni e categorie di dati che avrebbero aumentato molto la complessità senza migliorare direttamente il nucleo dell'applicazione.

Infine, ho cercato di definire il successo della consegna guidata in modo verificabile e non soltanto sulla base della percezione dell'interfaccia. Nei form relativi a SBAR, CEDEMA e alle scale Norton e Conley, i dati clinici considerati essenziali vengono definiti come obbligatori negli schemi di validazione. In questo modo è possibile verificare direttamente a livello applicativo quali informazioni non possono essere omesse, invece di basarsi solamente su un giudizio soggettivo su quanto l'interfaccia possa sembrare guidata.

### 2. Contestualizzazione

Il progetto è ambientato in una U.O. di Medicina Generale e Geriatria fittizia, costruita prendendo come riferimento l'organizzazione di strutture ospedaliere reali del settore, in particolare la Fondazione Poliambulanza di Brescia. Non esiste però alcuna collaborazione o partnership con la struttura: nel progetto non sono stati utilizzati dati, loghi, marchi o altri elementi riconducibili direttamente all'ospedale.

Il punto centrale del dominio applicativo è la consegna infermieristica, cioè il passaggio delle informazioni rilevanti tra operatori durante il cambio turno. In un reparto ospedaliero questo passaggio deve permettere a chi entra in servizio di comprendere rapidamente la situazione dei pazienti e le attività che richiedono attenzione.

Per strutturare questo processo ho utilizzato principalmente il metodo SBAR, acronimo di Situation, Background, Assessment, Recommendation. Il metodo non nasce originariamente in ambito sanitario, ma in contesti militari e aeronautici, nei quali una comunicazione poco chiara tra operatori può produrre conseguenze immediate. Successivamente è stato adottato anche in sanità come modello standardizzato per il trasferimento delle informazioni ed è stato raccomandato anche dall'Organizzazione Mondiale della Sanità.

La rilevanza della comunicazione nel contesto sanitario emerge anche dai dati raccolti dalla Joint Commission negli Stati Uniti: nell'analisi dei sentinel event tra il 1995 e il 2005, circa due terzi degli eventi risultavano associati a problemi di comunicazione tra il personale, molti dei quali verificatisi durante il passaggio delle consegne. Questo è uno dei motivi per cui nel progetto ho preferito una struttura guidata come SBAR rispetto a una consegna lasciata completamente alla memoria o alle abitudini del singolo operatore.

Accanto alla consegna SBAR ho inserito altri strumenti utilizzati nella valutazione infermieristica, tra cui le scale Norton e Conley.

La scala Norton, sviluppata da Doreen Norton nel 1962, è stata la prima scala validata per la valutazione del rischio di lesioni da pressione. Prende in considerazione cinque dimensioni: condizioni generali, stato mentale, attività, mobilità e incontinenza. Ogni voce viene valutata con un punteggio compreso tra 1 e 4, ottenendo quindi un totale compreso tra 5 e 20. Convenzionalmente, il valore 14 viene utilizzato come soglia di riferimento per individuare una condizione di rischio.

L'implementazione presente in Eira riproduce questa struttura anche a livello di validazione. I cinque valori vengono controllati server-side e devono essere compresi tra 1 e 4; un valore esterno a questo intervallo viene quindi rifiutato prima ancora di raggiungere la logica applicativa. Il punteggio complessivo viene calcolato sul server come somma delle cinque voci.

La scala Conley viene invece utilizzata per la valutazione del rischio di caduta, un aspetto particolarmente rilevante in un reparto con una componente geriatrica importante. È uno degli strumenti diffusi in ambito ospedaliero per questo tipo di valutazione, ma presenta anche limiti documentati. Uno studio multicentrico condotto su pazienti geriatrici acuti ha rilevato una consistenza interna debole, con un alfa di Cronbach pari a 0,465, insieme a una capacità predittiva limitata rispetto alle cadute effettivamente osservate.

Ho tenuto conto di questi limiti anche nell'implementazione. Il punteggio Conley viene calcolato sul server sommando le sei sotto-voci, ma per i singoli campi viene imposto soltanto un limite minimo pari a zero. Non ho introdotto un limite massimo uniforme perché gli item della scala reale non hanno tutti lo stesso peso e imporre arbitrariamente lo stesso intervallo a ogni voce avrebbe prodotto una rappresentazione clinicamente scorretta.

Per entrambe le scale non ho inoltre trasformato automaticamente il punteggio numerico in una categoria clinica come "rischio basso", "medio" o "alto". Questa parte rimane fuori dallo scope corrente del progetto. In particolare per la scala Conley, automatizzare una classificazione clinica sulla base di uno strumento la cui capacità predittiva è discussa avrebbe potuto dare una falsa sensazione di precisione. Ho quindi preferito limitare il sistema alla raccolta strutturata dei valori e al calcolo deterministico del punteggio.

Un ulteriore elemento della consegna è il diario CEDEMA, articolato in sei campi: coscienza, emotività, dolore, emodinamica, mobilizzazione e allert. In questo caso la struttura non deriva da una mia interpretazione del formato, ma riproduce quella osservata in uno screenshot di una nota infermieristica reale che mi è stato mostrato durante un colloquio informale con un'infermiera. L'ho utilizzato come esempio concreto per mantenere il progetto vicino a modalità operative realmente utilizzate.

Lo stesso confronto informale ha fornito spunti anche per alcune funzionalità aggiuntive, in particolare cambio turno, banca ore e gestione della priorità delle consegne, rappresentata nell'applicazione come un campo specifico della consegna SBAR. Non ho trattato queste informazioni come requisiti formali né come indicazioni provenienti da una struttura sanitaria specifica, ma semplicemente come riferimenti utili per rendere più realistici alcuni flussi del prodotto.

Dal punto di vista operativo, Eira è pensata per essere utilizzata su un tablet o desktop condiviso di reparto, e non principalmente su dispositivi personali associati al singolo operatore. L'utilizzo può avvenire anche durante un turno notturno o in condizioni di pressione operativa. Per questo motivo l'interfaccia è stata progettata privilegiando la possibilità di individuare rapidamente le informazioni importanti, piuttosto che un'esperienza basata sull'esplorazione di molte schermate o livelli di navigazione.

Il sistema distingue due ruoli principali.

L'infermiere può consultare e compilare le consegne SBAR relative ai turni a cui è assegnato, visualizzare i pazienti collegati al proprio turno e inviare una richiesta di cambio turno a un collega.

Il caposala, o coordinatore, ha invece una visione più ampia dell'organizzazione del reparto. Può assegnare gli infermieri ai turni tramite una dashboard a calendario, mentre alcune validazioni impediscono assegnazioni incompatibili, come il doppio turno, e permettono di individuare eventuali slot ancora scoperti. Può inoltre consultare tutte le consegne del reparto, senza però inserirne direttamente di cliniche, e gestisce la fase finale delle richieste di cambio turno.

Il cambio turno utilizza infatti una doppia conferma: prima il collega coinvolto deve accettare la proposta, successivamente il caposala può approvarla o rifiutarla. In questo modo una modifica alla pianificazione non può essere completata unilateralmente da uno dei due infermieri.

### 3. Descrizione dei principali aspetti progettuali

Durante lo sviluppo il modello dati si è ampliato rispetto alla prima versione progettata. Il diagramma entità-relazione iniziale comprendeva 11 entità, mentre quello finale ne comprende 18. Tra le entità aggiunte nel corso del progetto rientrano quelle dedicate a cambio turno, banca ore, ferie, parametri vitali e valutazioni Norton e Conley.

Per Norton e Conley ho scelto di utilizzare entità separate, invece di memorizzare solamente l'ultimo valore disponibile. In questo modo è possibile mantenere uno storico delle valutazioni e non perdere quelle precedenti quando ne viene registrata una nuova. Il diagramma completo è stato mantenuto anche nella documentazione tecnica del progetto.

A livello applicativo, l'architettura segue un flusso abbastanza lineare. Il frontend è sviluppato con Vue 3 e PrimeVue e comunica con il backend attraverso openapi-fetch. Il backend, realizzato con FastAPI, gestisce autenticazione JWT, autorizzazione, logica di dominio e accesso al database SQLite, la cui evoluzione viene gestita tramite Alembic.

Un elemento importante dell'architettura è che lo schema OpenAPI prodotto da FastAPI viene utilizzato anche per generare i tipi TypeScript del frontend. Lo stesso schema costituisce quindi sia la base della documentazione Swagger sia la fonte di verità per il contratto tra client e server. In questo modo una modifica alle API non richiede di mantenere manualmente due definizioni separate.

Per l'autorizzazione ho scelto di concentrare i controlli nel backend. Ogni endpoint verifica il ruolo dell'utente, l'appartenenza al reparto e, quando necessario, anche l'identità specifica dell'utente coinvolto nell'operazione. Ad esempio, in una richiesta di cambio turno soltanto il collega direttamente interpellato può rispondere alla prima fase della richiesta.

I controlli presenti nel frontend servono quindi soprattutto a guidare l'esperienza utente e a non mostrare azioni che non dovrebbero essere disponibili, ma non vengono considerati una misura di sicurezza sufficiente. La decisione finale sull'accesso a una risorsa viene sempre presa dal server.

Anche il flusso di autenticazione è stato adattato al contesto d'uso. Eira è pensata per un dispositivo condiviso di reparto, quindi al login l'utente seleziona il proprio nome da una lista e inserisce soltanto la password, invece di utilizzare il classico flusso email e password.

La scelta è stata principalmente legata all'usabilità: su un tablet condiviso in corsia non volevo costringere l'operatore a digitare ogni volta un indirizzo email completo all'inizio del turno. Non si tratta quindi di una scelta nata con un obiettivo di sicurezza specifico.

Un effetto secondario positivo è che, in caso di credenziali errate, il sistema utilizza un messaggio generico e non distingue chiaramente tra utente inesistente e password sbagliata, limitando così l'enumerazione degli utenti. Rimane però un problema simmetrico sull'endpoint pubblico di registrazione, che attualmente consente la registrazione libera e che considero un limite ancora aperto del progetto.

Prima di implementare alcune misure di hardening ho raccolto le alternative in un documento di analisi, in particolare per quanto riguarda rate limiting e durata delle password temporanee. Nel sistema finale il login e il reset della password sono limitati a 5 richieste al minuto, mentre la registrazione è limitata a 3 richieste al minuto. Le password temporanee hanno invece una validità di 48 ore.

Un altro elemento modellato esplicitamente è il flusso del cambio turno, che segue una macchina a stati a doppia conferma.

Quando un infermiere invia una richiesta, questa entra nello stato in_attesa_collega. Il collega può rifiutarla, portandola nello stato terminale rifiutata_collega, oppure accettarla, facendo avanzare la richiesta a in_attesa_caposala.

A quel punto interviene il caposala, che può rifiutare la richiesta portandola a rifiutata_caposala, oppure approvarla. Solo in quest'ultimo caso lo stato diventa approvata e lo scambio dei turni viene effettivamente applicato alle assegnazioni.

L'approvazione finale riutilizza inoltre la stessa validazione già impiegata per l'assegnazione manuale dei turni, evitando quindi che il cambio possa produrre un doppio turno incompatibile.

Per la comunicazione tra frontend e backend ho inizialmente valutato diverse alternative. La soluzione scelta è stata openapi-fetch, utilizzata insieme a openapi-typescript per generare i tipi direttamente dallo schema OpenAPI.

La decisione è stata documentata in un ADR dedicato. Tra le alternative considerate c'erano Axios, che non offriva direttamente una pipeline schema-tipi; ky, più leggero e moderno ma privo di un'integrazione nativa equivalente con openapi-typescript; e useFetch di VueUse, che avrebbe comunque richiesto un ulteriore livello di wrapping per utilizzare in modo coerente i tipi generati.

Nel progetto Axios era stato introdotto inizialmente, ma dopo la stabilizzazione del contratto API è stato sostituito da openapi-fetch. Oltre alla maggiore integrazione con OpenAPI, la libreria ha anche un peso inferiore: circa 6 KB contro circa 32 KB di Axios.

Sul frontend ho eseguito anche un refactoring architetturale incrementale articolato in 17 fasi. Le viste principali sono state progressivamente alleggerite e trasformate in composition root, spostando logica e componenti nelle rispettive feature.

La struttura risultante è organizzata in moduli dedicati, tra cui banca ore, cambi turno, dashboard, scheda paziente, farmaci, ferie, pazienti, SBAR, sessione, staff e turni. Ogni feature può contenere i propri tipi, composable e componenti presentazionali.

Ho scelto questo approccio anche come occasione per fare esperienza diretta con un pattern architetturale che volevo approfondire, oltre che per rendere il codice più leggibile e più semplice da modificare successivamente. Il refactoring è stato svolto progressivamente e verificato fase per fase, senza riscrivere l'intero frontend in un'unica passata.

Infine, per l'autenticazione JWT ho scelto di non introdurre refresh token. Il token di accesso ha una durata di 8 ore, pensata per coprire la durata tipica di un turno ospedaliero, normalmente compresa tra 6 e 8 ore.

Il compromesso ha però un limite concreto: se un turno si prolunga oltre la durata prevista, ad esempio per un'emergenza o per una consegna particolarmente lunga, l'infermiere può essere costretto a effettuare nuovamente il login durante un momento operativo delicato.

Ho comunque accettato questo limite per evitare di introdurre nel progetto la complessità aggiuntiva della rotazione, revoca e gestione server-side dei refresh token. È quindi una scelta consapevole di scope, non un caso non considerato durante la progettazione.

Un problema di sicurezza emerso durante lo sviluppo ha riguardato il controllo degli accessi ai dati tra reparti diversi.

L'invariante che avevo definito per il backend era semplice: nessun utente deve poter leggere o modificare dati appartenenti a un reparto diverso dal proprio, indipendentemente dal ruolo. Per gli endpoint che recuperano una risorsa tramite identificativo, il pattern previsto consisteva nel caricare l'entità dal database e verificare poi esplicitamente che il suo reparto_id coincidesse con quello dell'utente autenticato. In caso contrario, la richiesta doveva essere rifiutata con errore 403.

Il 9 luglio 2026, dopo aver completato la prima fase di persistenza su database reale, ho eseguito un audit mirato su tutti i router cercando le occorrenze di reparto_id e infermiere_id. L'obiettivo era controllare che ogni accesso a una risorsa fosse effettivamente limitato al reparto corretto.

Durante questa verifica ho individuato un problema nell'endpoint GET /banca-ore/{infermiere_id}.

Per il ruolo infermiere esisteva già un controllo che impediva di richiedere il saldo ore di un altro utente. Per il ruolo caposala, invece, mancava il controllo equivalente sul reparto del destinatario. Di conseguenza, un caposala avrebbe potuto passare manualmente l'identificativo di un infermiere appartenente a un altro reparto e ottenere il relativo saldo della banca ore.

Il problema rientra nella categoria Broken Access Control e, più nello specifico, nel pattern IDOR: l'applicazione accettava un identificativo fornito dal client senza verificare completamente che l'utente autenticato fosse autorizzato ad accedere alla risorsa corrispondente.

Non era inoltre la prima volta che incontravo questa classe di rischio nel progetto. Era la quarta occorrenza analizzata durante lo sviluppo: nei router relativi a pazienti, utenti e consegne SBAR lo scoping sul reparto era già stato introdotto correttamente, mentre in banca_ore.py il controllo era stato omesso.

La correzione è consistita nel caricare l'utente destinatario quando la richiesta proviene da un caposala e verificare esplicitamente che il suo reparto_id coincida con quello dell'utente autenticato prima di restituire i dati.

Dopo la correzione ho aggiunto anche un test di regressione dedicato, in modo che una futura modifica non potesse reintrodurre lo stesso comportamento. Al momento del fix, nel luglio 2026, la suite backend comprendeva 33 test, tutti passanti.

L'aspetto più utile di questo episodio è stato però il cambiamento nel metodo di revisione. Il bug era riuscito a superare quattro iterazioni di router perché ogni file veniva scritto e testato principalmente in isolamento.

Da quel momento ho adottato una pratica più sistematica: dopo il completamento di un router che introduce un endpoint GET /{id}, eseguo una ricerca esplicita su reparto_id e sugli identificativi sensibili all'interno dell'intera cartella routers/, invece di limitarmi a rileggere soltanto il file appena modificato. In questo modo il controllo dello scoping viene trattato come un'invariante trasversale dell'applicazione e non come un dettaglio locale del singolo endpoint.

La traccia richiede di descrivere il processo di sviluppo anche attraverso alcuni degli snippet più significativi. Ho scelto quattro esempi appartenenti ad aree diverse del progetto: dominio clinico, sicurezza, hardening del deploy e logica di business.

**Calcolo del punteggio Norton**

```python
punteggio = (
    payload.condizioni_generali
    + payload.stato_mentale
    + payload.attivita
    + payload.mobilita
    + payload.incontinenza
)
```

Questo frammento appartiene alla creazione di una valutazione Norton.

Il calcolo in sé è semplice, perché il punteggio totale corrisponde alla somma delle cinque voci della scala. La scelta importante riguarda però dove viene eseguito il calcolo.

Il punteggio viene calcolato direttamente dal backend e il payload inviato dal frontend non contiene un campo punteggio_totale. Il client invia quindi solamente i valori delle singole voci, mentre il server ricava autonomamente il risultato complessivo.

In questo modo il frontend non può inviare un punteggio totale arbitrario o incoerente rispetto ai dati inseriti. Non è quindi necessario aggiungere una validazione che confronti un totale fornito dal client con quello effettivamente calcolato, perché quel valore non viene mai accettato come input.

**Controllo IDOR sulla banca ore**

```python
if current_user.ruolo == RuoloUtente.caposala:
    infermiere = db.get(Utente, infermiere_id)
    if infermiere is None or infermiere.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Infermiere di un altro reparto",
        )
```

Questo controllo è stato aggiunto all'endpoint della banca ore dopo l'audit di sicurezza descritto in precedenza.

Nella prima versione del router esisteva già un controllo per impedire a un infermiere di leggere il saldo di un altro utente, ma non era stato implementato lo stesso livello di verifica per il ruolo caposala.

Il blocco recupera quindi l'infermiere richiesto e controlla esplicitamente che appartenga allo stesso reparto del caposala autenticato. Se l'utente non esiste oppure appartiene a un reparto diverso, la richiesta viene rifiutata con un errore 403.

Il problema non era stato individuato perché un test esistente aveva fallito, ma attraverso un audit dedicato sugli identificativi e sullo scoping dei reparti. Questo episodio mi ha mostrato che, per gli endpoint basati su un identificativo, il controllo delle autorizzazioni deve essere verificato separatamente per ogni ruolo che può accedere all'endpoint.

**Controllo fail-fast della chiave JWT**

```python
def _check_jwt_secret(config: Settings = settings) -> None:
    if config.jwt_secret_key != "dev-secret-change-in-production":
        return
    if config.environment.casefold() == "production":
        raise RuntimeError(
            "JWT_SECRET_KEY non impostata in ambiente production: rifiuto "
            "l'avvio. Impostare JWT_SECRET_KEY prima di qualunque deploy."
        )
    logger.warning("JWT_SECRET_KEY non impostata: uso il default di sviluppo.")
```

Questo snippet riguarda l'hardening della configurazione di deploy.

Durante lo sviluppo locale e nella CI può essere utilizzato il secret predefinito senza conseguenze rilevanti, quindi in questi ambienti viene prodotto solamente un warning. In produzione, invece, il comportamento cambia completamente.

Se l'applicazione rileva che il secret JWT è ancora quello di default, solleva un'eccezione e rifiuta di avviarsi.

Ho preferito questo approccio perché una semplice nota nella documentazione avrebbe lasciato comunque aperta la possibilità di dimenticare la configurazione durante il deploy. Il controllo fail-fast trasforma invece questa indicazione in un vincolo applicativo: una configurazione considerata non accettabile in produzione impedisce fisicamente l'avvio del server.

**Controllo del doppio turno durante uno scambio**

```python
ids_scambio = (assegnazione.id, assegnazione_collega.id)
conflitto_richiedente = (
    db.query(AssegnazioneTurno)
    .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
    .filter(
        AssegnazioneTurno.infermiere_id == richiesta.richiedente_id,
        AssegnazioneTurno.stato == StatoAssegnazione.attiva,
        Turno.data == turno_collega.data,
        AssegnazioneTurno.id.notin_(ids_scambio),
    )
    .first()
)
```

Questo frammento viene eseguito durante la fase finale di approvazione di una richiesta di cambio turno.

Prima di effettuare realmente lo scambio, il sistema verifica che il richiedente non abbia già un'altra assegnazione attiva nella stessa giornata. Le due assegnazioni coinvolte nello scambio vengono escluse dalla ricerca tramite notin_, perché sono proprio quelle che stanno per essere modificate.

La stessa regola di controllo viene utilizzata anche durante l'assegnazione manuale dei turni dalla dashboard del caposala. Ho quindi riutilizzato la stessa logica anche nel cambio turno, evitando che due percorsi diversi dell'applicazione potessero applicare regole differenti.

Questo permette di mantenere un unico criterio per una regola di dominio importante: un'operazione di cambio turno non deve poter creare una situazione che il sistema impedirebbe durante la normale pianificazione dei turni.

La documentazione delle API viene generata automaticamente da FastAPI ed è disponibile all'endpoint /docs. La pagina utilizza lo schema OpenAPI prodotto direttamente dal backend, quindi rimane allineata agli endpoint effettivamente presenti nell'applicazione senza dover mantenere una documentazione separata.

Nello stato attuale del progetto lo schema comprende 45 percorsi e 59 operazioni. I router sono organizzati attraverso tag di dominio, tra cui banca ore, cambi turno, pazienti, turni, utenti, ferie, carrello farmaci, reparti, consegne SBAR, dashboard e autenticazione. Questo rende la documentazione più leggibile e permette di individuare rapidamente gli endpoint relativi a una specifica area funzionale.

Ho documentato esplicitamente anche le principali risposte d'errore utilizzate dal backend, in particolare i codici 400, 401, 403, 404 e 409. Per evitare di ridefinire ogni volta gli stessi schemi, queste risposte sono centralizzate in una funzione condivisa e poi riutilizzate dagli endpoint che ne hanno bisogno.

Ho cercato inoltre di mantenere coerenti i codici HTTP con il significato delle operazioni REST. Gli endpoint di creazione restituiscono 201 Created, mentre le cancellazioni che non devono restituire contenuto utilizzano 204 No Content.

La documentazione Swagger costituisce quindi non solo un supporto per consultare le API, ma anche una rappresentazione aggiornata del contratto tra frontend e backend. Lo stesso schema OpenAPI viene infatti utilizzato per generare i tipi TypeScript consumati dal client.

Uno screenshot della documentazione completa è stato incluso tra le immagini del progetto e può essere inserito direttamente nella sezione del report dedicata alle API.

Per documentare anche il funzionamento dell'interfaccia ho realizzato 17 screenshot relativi ai principali flussi applicativi.

Le immagini coprono entrambi i ruoli previsti dal sistema, infermiere e caposala, e comprendono il login, le rispettive dashboard, la gestione dei pazienti, la scheda del paziente con diario e valutazioni, il diario clinico, il cambio turno, la banca ore, il personale, le ferie, il carrello farmaci, la creazione di una nuova consegna SBAR, il profilo utente e la documentazione delle API.

Ho scelto di non considerare questi screenshot soltanto come materiale da appendice. Nella versione finale del report verranno selezionati e inseriti direttamente nelle sottosezioni pertinenti, in modo che la descrizione di un flusso o di una funzionalità possa essere accompagnata immediatamente dalla relativa schermata.

In questo modo la documentazione non descrive soltanto l'architettura e il comportamento del backend, ma mostra anche come le funzionalità vengono effettivamente presentate e utilizzate dai due ruoli all'interno dell'applicazione.

### 4. Campi di applicazione

Il progetto è stato sviluppato e dimostrato su un solo reparto, Medicina Generale e Geriatria, ma il modello dati è stato costruito prevedendo esplicitamente l'entità Reparto come elemento separato e generico. Questo rende possibile, almeno dal punto di vista strutturale, estendere in futuro l'applicazione a più reparti senza dover ripensare completamente il modello.

Considererei però questa possibilità come una ipotesi progettuale, non come una caratteristica già validata sul campo. Non ho esperienza diretta come infermiere o caposala e non ho osservato in modo completo il funzionamento reale di una struttura ospedaliera multi-reparto. Posso quindi dire che l'architettura è compatibile con un'estensione verso reparti di degenza ordinaria organizzati su tre turni, ma non che il prodotto sia già pronto per essere adottato senza adattamenti in contesti ospedalieri differenti.

Il vantaggio principale dell'applicazione rimane la consegna guidata. L'infermiere non deve affidarsi soltanto alla memoria o alle proprie abitudini per decidere quali informazioni riportare, perché il sistema propone una struttura basata su SBAR, diario CEDEMA e valutazioni Norton e Conley. L'obiettivo è ridurre il rischio di dimenticare informazioni importanti durante il passaggio di consegne, soprattutto nei momenti di maggiore stanchezza o pressione operativa.

Un beneficio ulteriore è la tracciabilità. Consegne e valutazioni vengono registrate nel sistema, associate all'utente che le ha create e mantenute nello storico. Questo permette di ricostruire nel tempo l'evoluzione delle informazioni, anche se la tracciabilità non rappresentava il punto di partenza principale del progetto.

Rimangono diversi limiti che impediscono di considerare Eira una soluzione pronta per un utilizzo sanitario reale.

L'anagrafica del paziente è volutamente ridotta e il sistema non vuole sostituire una cartella clinica completa. Questa scelta di scope ha permesso di evitare una gestione estesa di dati sanitari riconducibili all'art. 9 del GDPR e di concentrarsi sulle funzionalità centrali del progetto.

Anche i parametri vitali presenti nell'applicazione hanno oggi un valore dimostrativo: vengono generati come dati mock e non provengono da dispositivi medici certificati. Un utilizzo reale richiederebbe quindi un'integrazione con sistemi di monitoraggio effettivi e con i relativi requisiti tecnici e normativi.

Un altro limite riguarda la gestione della sessione. Il token JWT dura otto ore e non sono presenti refresh token. Questa scelta è coerente con il caso d'uso di un dispositivo condiviso di reparto e con sessioni che normalmente coincidono con la durata del turno, ma sarebbe meno adatta a contesti con sessioni più lunghe o utilizzo continuativo su dispositivi personali.

Tra le possibili evoluzioni, la priorità più alta sarebbe l'introduzione di un audit log degli accessi ai dati clinici. Attualmente il sistema conserva chi ha creato determinate informazioni, ma un'applicazione realmente utilizzata in ambito sanitario dovrebbe poter registrare anche chi ha visualizzato o modificato una consegna o una valutazione. Questo tipo di tracciamento sarebbe particolarmente importante dal punto di vista della compliance e della gestione degli accessi ai dati.

Una seconda evoluzione naturale sarebbe il supporto multi-reparto. Il modello dati è già predisposto in questa direzione, ma servirebbe una validazione concreta dei flussi organizzativi dei diversi reparti prima di considerare questa estensione realmente pronta.

Un'ulteriore evoluzione sarebbe l'integrazione con dispositivi di monitoraggio reali per acquisire automaticamente i parametri vitali, sostituendo i dati mock utilizzati nel progetto.

Infine, il sistema potrebbe essere esteso con notifiche push reali. Attualmente le informazioni che richiedono attenzione vengono segnalate attraverso badge all'interno dell'applicazione, ma non esiste un sistema di notifiche esterne. L'introduzione di notifiche push potrebbe rendere più immediata la gestione di richieste come cambi turno o altre attività che richiedono una risposta.

### 5. Valutazione dei risultati

_[da scrivere]_
