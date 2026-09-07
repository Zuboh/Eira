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

_[da scrivere — prossima sessione]_

### 3. Risorse e strumenti impiegati

_[da scrivere]_

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
