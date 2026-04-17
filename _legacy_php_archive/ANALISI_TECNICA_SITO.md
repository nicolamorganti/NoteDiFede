# Analisi tecnica completa del progetto "Note di Fede"

## 1. Obiettivo di questo documento

Questo file descrive in modo tecnico e dettagliato lo stato attuale del progetto, la tecnologia effettivamente presente nel repository, le funzionalita' previste dalla documentazione, i gap tra visione e implementazione, i rischi tecnici, le potenzialita' evolutive e le possibili direzioni architetturali.

L'obiettivo e' produrre un handoff chiaro per un'altra AI o per un consulente tecnico, cosi' da poter:

- capire cosa esiste davvero oggi;
- distinguere tra codice implementato e funzionalita' solo progettate;
- individuare i problemi strutturali;
- scegliere la tecnologia piu' adatta per completare o rifondare il progetto.

## 2. Sintesi esecutiva

Il repository non contiene oggi un sito completo funzionante, ma un prototipo molto iniziale.

Lo stato reale del progetto e' il seguente:

- esiste una specifica funzionale abbastanza completa in `specs/project-spec.md`;
- esiste un modulo PHP monolitico con funzioni per creazione tabelle e CRUD database in `php/db_function.php`;
- esiste una configurazione database PDO separata in `config/config-db.php`;
- esiste un front-end minimale con un solo file CSS e un solo file JS;
- mancano entrypoint applicativi reali come `index.php`, pagine utente, dashboard amministrativa, API REST, routing, autenticazione, upload file, generazione PDF, player audio, gestione sessioni e controllo permessi;
- le cartelle `api/` e `includes/` sono presenti ma vuote.

In pratica, il repository rappresenta soprattutto:

- una bozza di modello dati;
- una bozza di funzioni DB;
- una specifica di prodotto molto piu' avanzata del codice disponibile.

Conclusione ad alto livello:

- il progetto ha una buona idea di dominio;
- ha un valore funzionale chiaro;
- ma non ha ancora una base software coerente, moderna e pronta per produzione.

## 3. Inventario reale del repository

Struttura rilevata:

- `assets/css/main.css`
- `assets/js/main.js`
- `config/config-db.php`
- `php/db_function.php`
- `specs/project-spec.md`
- `specs/project-spec.pdf`
- `img/home.png`
- `api/` vuota
- `includes/` vuota

Osservazioni:

- non esiste un repository Git inizializzato in questa cartella;
- non esistono `composer.json`, `package.json`, `.htaccess`, `web.config`, `Dockerfile`, file di test o pipeline CI/CD;
- non esiste alcun framework PHP dichiarato;
- non esiste alcuna struttura MVC o simile;
- non esistono migration, seed, fixture o script di deploy;
- non esistono pagine server-rendered effettive.

## 4. Dominio applicativo e valore del progetto

Il progetto e' chiaramente pensato per la gestione della musica liturgica e dell'organizzazione delle messe.

Il dominio copre:

- catalogo canti;
- metadati dei canti;
- associazione dei canti ai momenti liturgici;
- composizione di una messa tramite sequenza di canti;
- archiviazione di PDF, testi, accordi e file audio;
- distinzione tra utenti normali e maestri;
- possibile consultazione, ascolto, download e stampa.

Questo e' un dominio molto concreto e con un valore reale, perche':

- ha una struttura dati ben definibile;
- ha casi d'uso frequenti e ripetibili;
- si presta a una digitalizzazione forte;
- puo' diventare sia archivio storico sia strumento operativo per coro, direttore e animazione liturgica.

## 5. Tecnologia effettivamente presente

### 5.1 Backend

Tecnologia presente:

- PHP procedurale / funzionale senza framework;
- MySQL tramite `mysqli` in `php/db_function.php`;
- MySQL tramite `PDO` in `config/config-db.php`.

Questo significa che nel progetto convivono due approcci diversi di accesso al database:

- `mysqli` per le funzioni CRUD storiche;
- `PDO` per una configurazione piu' moderna ma non integrata col resto.

Questa doppia strategia e' indice di evoluzione incompleta o refactoring iniziato ma non terminato.

### 5.2 Frontend

Tecnologia presente:

- HTML implicito ma non presente nel repository;
- CSS custom puro in `assets/css/main.css`;
- JavaScript vanilla minimale in `assets/js/main.js`.

Il file JS contiene solo una funzione `toggleMenu()`.

Il file CSS implementa:

- layout base;
- header fisso;
- menu di navigazione;
- comportamento hamburger minimale per mobile.

Non risultano presenti:

- componenti UI strutturati;
- librerie frontend;
- bundler;
- sistema di template;
- reactive rendering;
- accessibilita' avanzata;
- design system.

### 5.3 Asset e documentazione

Sono presenti:

- uno screenshot o immagine `img/home.png`;
- una specifica Markdown;
- una versione PDF della specifica.

## 6. Stato architetturale attuale

Lo stato architetturale reale e' embrionale.

### Cio' che c'e'

- alcune funzioni di creazione database e tabelle;
- alcune funzioni CRUD;
- alcune funzioni di filtro/elenco;
- una connessione DB separata via PDO;
- asset statici base.

### Cio' che non c'e'

- router HTTP;
- controller;
- viste;
- API pubbliche o private;
- middleware;
- autenticazione e sessione;
- autorizzazione;
- gestione upload/download;
- storage file strutturato;
- generazione PDF;
- streaming audio;
- logging applicativo;
- test automatici;
- gestione errori coerente;
- configurazione ambienti dev/stage/prod.

Il progetto quindi non e' ancora un'applicazione web completa, ma una base prototipale di logica dati.

## 7. Analisi tecnica del backend esistente

### 7.1 File `php/db_function.php`

Questo file e' il cuore del codice esistente.

Contiene:

- connessione MySQL con `mysqli`;
- creazione database;
- verifica esistenza tabelle;
- creazione tabelle principali;
- funzioni di inserimento, aggiornamento, cancellazione;
- alcune funzioni di elenco e filtro.

Caratteristiche tecniche:

- approccio monolitico: un solo file di oltre 370 righe;
- forte accoppiamento tra schema, query e logica applicativa;
- output HTML diretto tramite `echo`;
- error handling grezzo;
- query SQL costruite manualmente.

### 7.2 File `config/config-db.php`

Questo file introduce un secondo modo di lavorare col database:

- connessione PDO;
- charset `utf8mb4`;
- eccezioni abilitate;
- prepared statements emulate disabilitati.

Questa parte e' piu' solida della precedente dal punto di vista architetturale, ma oggi e' isolata e non utilizzata da `db_function.php`.

## 8. Modello dati reale implementato

Dal codice in `php/db_function.php`, il modello dati implementato e' questo.

### Tabella `canti`

Campi reali implementati:

- `id`
- `titolo`
- `autore`
- `spartito` `LONGBLOB`
- `accordi` `LONGBLOB`
- `testo` `LONGBLOB`
- `soprani` `LONGBLOB`
- `contralti` `LONGBLOB`
- `tenori` `LONGBLOB`
- `bassi` `LONGBLOB`
- `organo` `LONGBLOB`
- `audiocompleto` `LONGBLOB`
- `timestamp_creazione`
- `timestamp_ultimamodifica`

Significato tecnico:

- i file non sono progettati come risorse esterne referenziate da path;
- sono salvati direttamente nel database come blob;
- la tabella mescola metadati e contenuti binari.

### Tabella `momentimessa`

Campi:

- `id`
- `descrizione`
- `timestamp_creazione`
- `timestamp_ultimamodifica`

### Tabella `testatamesse`

Campi:

- `id`
- `data`
- `descrizione`
- `anno_liturgico` enum `A/B/C`
- `timestamp_creazione`
- `timestamp_ultimamodifica`

### Tabella `RigheMessa`

Campi:

- `id`
- `id_testatamesse`
- `id_momentimessa`
- `id_canti`
- `timestamp_creazione`
- `timestamp_ultimamodifica`

Relazioni:

- FK verso `testatamesse(id)`
- FK verso `momentimessa(id)`
- FK verso `canti(id)`

## 9. Modello dati previsto dalla specifica

La specifica in `specs/project-spec.md` descrive un sistema piu' maturo, con queste entita' principali:

- `CANTI`
- `CANTI_MOMENTI`
- `MOMENTI_MESSA`
- `MESSE`
- `MESSA_CANTI`
- `UTENTI`
- `FILES`
- `REGISTRO_ATTIVITA'`

Rispetto al codice attuale, questa specifica prevede:

- maggiore normalizzazione;
- audit trail;
- utenti con ruoli;
- file come entita' separata;
- supporto a piu' tipologie di contenuti;
- metadata completi di creazione/modifica;
- tracciabilita' operazioni.

## 10. Differenze tra schema reale e schema previsto

Questa e' una delle sezioni piu' importanti per qualunque AI che debba proseguire il lavoro.

### 10.1 Differenze concettuali

Schema reale:

- semplice;
- centrato su poche tabelle;
- orientato al prototipo;
- salva i file dentro il DB;
- non ha utenti;
- non ha log;
- non ha separazione file/metadati.

Schema previsto:

- piu' enterprise;
- normalizzato;
- adatto a ruoli e audit;
- file esternalizzati e referenziati;
- pensato per crescita futura.

### 10.2 Incoerenze concrete

Sono presenti incongruenze tecniche importanti:

- `connectToDatabase()` usa il database `notedifede`;
- `config/config-db.php` usa il database `note_di_fede`;
- quindi il progetto oggi definisce due nomi database diversi.

Altre incongruenze:

- `getElencoCanti()` filtra per `descrizione`, ma nella tabella `canti` il campo `descrizione` non esiste;
- la specifica parla di una tabella `FILES`, mentre il codice salva i file in `LONGBLOB` dentro `canti`;
- la specifica definisce `MESSE` e `MESSA_CANTI`, mentre il codice usa `testatamesse` e `RigheMessa`;
- la specifica prevede `UTENTI`, ma nel codice non esiste alcuna tabella utenti;
- la specifica prevede logging modifiche, ma nel codice non esiste un registro attivita'.

Queste discrepanze fanno capire che:

- la specifica e' stata ampliata dopo il primo prototipo;
- il codice non e' stato riallineato;
- oggi non esiste una fonte unica di verita' architetturale.

## 11. Problemi tecnici del codice esistente

### 11.1 Sicurezza

Il problema piu' serio e' che molte query sono costruite tramite interpolazione diretta di stringhe.

Esempi di rischio:

- `INSERT INTO ... VALUES ('$data', '$descrizione', ...)`
- `UPDATE ... SET ... WHERE id=$id`
- `DELETE FROM ... WHERE id=$id`

Conseguenze:

- vulnerabilita' SQL injection;
- sanitizzazione incompleta o assente;
- impossibilita' di considerare il codice pronto per produzione.

Inoltre:

- non ci sono hash password perche' non c'e' ancora il modulo utenti;
- non ci sono sessioni;
- non ci sono controlli di ruolo;
- non c'e' protezione CSRF;
- non c'e' validazione server-side strutturata;
- non c'e' controllo sugli accessi ai file.

### 11.2 Scalabilita' e storage

L'uso di `LONGBLOB` per PDF e audio direttamente nella tabella `canti` e' molto problematico.

Criticita':

- database molto pesante;
- backup lenti;
- query meno efficienti;
- maggiore uso RAM e I/O;
- difficolta' nel caching;
- streaming audio inefficiente;
- gestione file e versionamento piu' complessi.

Per file multimediali e PDF, in un sistema reale e' quasi sempre preferibile:

- filesystem strutturato locale;
- oppure object storage;
- con metadati in tabella separata.

### 11.3 Manutenibilita'

Il codice e' poco manutenibile perche':

- tutto e' concentrato in un unico file;
- non esiste separazione per dominio o modulo;
- le funzioni producono anche output HTML;
- non ci sono interfacce ne' astrazioni;
- non esistono classi, service, repository o controller;
- non c'e' documentazione inline tecnica;
- non ci sono test.

### 11.4 Coerenza architetturale

Convivenza `mysqli` + `PDO`:

- e' una duplicazione inutile;
- rende il codice incoerente;
- complica il refactoring;
- suggerisce che il progetto non ha ancora scelto un'architettura definitiva.

### 11.5 Naming e standardizzazione

Nel progetto convivono:

- nomi tabelle in italiano;
- maiuscole e minuscole miste;
- convenzioni diverse (`RigheMessa`, `momentimessa`, `testatamesse`);
- naming funzionale non uniforme.

Questo non blocca lo sviluppo, ma aumenta il debito tecnico e il rischio di errori.

## 12. Analisi del frontend esistente

### 12.1 CSS

Il CSS e' basilare e serve a costruire una pagina molto semplice.

Caratteristiche:

- font Arial;
- header fisso;
- layout centrato con `max-width: 800px`;
- footer semplice;
- menu desktop/mobile elementare;
- breakpoint unico a `768px`.

Limiti:

- design molto base;
- nessun sistema di componenti;
- nessuna accessibilita' esplicita;
- nessuna gestione raffinata del responsive;
- nessuna gerarchia visiva moderna;
- nessuna ottimizzazione specifica per lettura PDF o audio.

### 12.2 JavaScript

Il JS attuale e' ridotto a:

- toggle di una classe CSS per mostrare o nascondere il menu.

Questo implica che:

- non esiste logica applicativa client-side;
- non esiste interazione con backend;
- non esiste fetch API;
- non esiste validazione client strutturata;
- non esiste gestione stato.

## 13. Funzionalita' previste ma non implementate

Dalla specifica emergono molte funzionalita' ancora non presenti nel codice:

- autenticazione utenti;
- ruoli normale/maestro;
- CRUD completo canti;
- CRUD completo messe;
- upload file PDF e MP3;
- download controllato dei file;
- visualizzazione PDF online;
- lettore audio online;
- ricerca avanzata;
- API RESTful;
- generazione PDF aggregato della messa;
- tracciamento modifiche;
- logging attivita';
- validazione input robusta;
- protezione accessi;
- caching;
- rate limiting;
- reportistica;
- interfaccia amministrativa.

## 14. Potenzialita' del progetto

Nonostante lo stato iniziale, il progetto ha ottime potenzialita'.

### 14.1 Potenziale funzionale

Il dominio si presta bene a costruire:

- un archivio centralizzato dei canti;
- una libreria digitale multiformato;
- un planner delle messe;
- uno strumento collaborativo per cori e direttori;
- una base dati storica delle liturgie celebrate;
- un pannello di preparazione per prove e celebrazioni.

### 14.2 Potenziale organizzativo

Il sistema potrebbe diventare:

- strumento interno per una singola parrocchia;
- piattaforma multi-gruppo o multi-comunita';
- archivio condiviso con ruoli diversi;
- base per gestione repertorio, trasposizioni, prove, allegati.

### 14.3 Potenziale tecnico

Il dominio e' adatto a funzionalita' evolute come:

- tagging dei canti;
- ricerca full-text su titolo, testo, autore e codice;
- filtri per tempo liturgico, occasione, autore, tonalita';
- storico utilizzo di un canto nelle messe;
- suggerimento canti per momento liturgico;
- export PDF automatici;
- playlist e code di prova;
- autorizzazioni granulari;
- backup e versioning dei file.

## 15. Vincoli e dubbi tecnici da risolvere

Prima di scegliere la tecnologia finale, ci sono alcune decisioni architetturali chiave.

### 15.1 Progetto semplice o prodotto strutturato?

Domanda centrale:

- serve un sito semplice per uso interno locale;
- oppure una piattaforma robusta, estendibile e multiutente?

Questa scelta cambia completamente la tecnologia consigliata.

### 15.2 Gestione file

Decisione fondamentale:

- file nel database;
- oppure file nel filesystem/object storage con metadati nel DB?

La seconda opzione e' quasi certamente preferibile.

### 15.3 Tipo di interfaccia

Possibili modelli:

- sito server-rendered tradizionale;
- SPA con API;
- approccio ibrido.

### 15.4 Complessita' dell'audio e PDF

Se il player audio e la consultazione PDF sono funzioni centrali, serve una piattaforma che gestisca bene:

- streaming;
- anteprime;
- permessi;
- download;
- organizzazione file.

## 16. Tecnologie consigliabili: scenari

Questa sezione non sceglie una soluzione unica, ma mappa le opzioni piu' adatte.

### Scenario A: completare il progetto con PHP classico moderno

Tecnologia consigliata:

- PHP 8.2+;
- Laravel o Symfony;
- MySQL/MariaDB;
- Blade/Twig;
- storage file su filesystem o S3-compatible;
- autenticazione integrata;
- code per generazione PDF se necessarie.

Quando e' la scelta migliore:

- vuoi restare in ecosistema PHP;
- vuoi sviluppo relativamente rapido;
- vuoi una base robusta ma non troppo complessa;
- vuoi pannello admin e CRUD in tempi ragionevoli.

Vantaggi:

- grande maturita';
- ottimo supporto CRUD;
- buon ecosistema auth, validation, storage, mail, queue;
- facile passaggio dal prototipo attuale.

Svantaggi:

- se vuoi UX molto dinamica lato client, potresti poi aggiungere complessita';
- richiede comunque una rifondazione del codice esistente, non un semplice aggiustamento.

Verdetto:

- e' probabilmente la scelta piu' equilibrata per questo dominio.

### Scenario B: backend API + frontend moderno

Tecnologia consigliata:

- backend Laravel / NestJS / FastAPI;
- frontend React / Next.js / Vue;
- DB MySQL/PostgreSQL;
- storage file esterno.

Quando ha senso:

- vuoi un'interfaccia molto ricca;
- prevedi uso intenso da mobile/browser;
- vuoi una UX app-like;
- pensi a crescita futura o multiutenza importante.

Vantaggi:

- UI piu' moderna;
- forte separazione frontend/backend;
- estendibilita' maggiore.

Svantaggi:

- complessita' piu' alta;
- costi di sviluppo e manutenzione piu' elevati;
- overkill se il progetto rimane piccolo.

Verdetto:

- adatto solo se il progetto vuole diventare una piattaforma piu' ambiziosa.

### Scenario C: soluzione low-complexity server-rendered

Tecnologia consigliata:

- Laravel con Blade;
- oppure Symfony con Twig;
- interattivita' leggera con Alpine.js / HTMX.

Quando ha senso:

- vuoi evitare la complessita' di una SPA;
- vuoi un sito amministrabile e veloce da costruire;
- le funzioni centrali sono CRUD, ricerca, download, player e PDF.

Verdetto:

- molto forte per questo caso d'uso.

### Scenario D: rifinitura del PHP attuale senza framework

Tecnicamente possibile, ma sconsigliato.

Motivi:

- il debito tecnico iniziale e' gia' alto;
- manca una struttura chiara;
- dovresti reinventare validazione, auth, routing, sicurezza, upload, permessi, error handling;
- il rischio e' ottenere un'app fragile e difficile da mantenere.

Verdetto:

- soluzione da evitare, salvo progetto personale estremamente limitato.

## 17. Scelta database consigliata

### Opzione consigliata: MySQL o MariaDB

Perche':

- il dominio e' relazionale;
- le entita' sono ben modellabili;
- i filtri sono tradizionali;
- il team e il prototipo gia' usano MySQL.

### Possibile alternativa: PostgreSQL

Da valutare se vuoi:

- piu' rigore relazionale;
- JSON e ricerche avanzate;
- maggiore solidita' a lungo termine.

Per questo caso, comunque, MySQL/MariaDB va benissimo.

## 18. Scelta storage file consigliata

Scelta consigliata:

- file fuori dal database;
- metadati in tabella `files`;
- riferimenti a path o URI;
- naming consistente e hash dei file;
- controllo MIME e dimensione;
- eventuale storage S3-compatible in futuro.

Perche' e' meglio dei BLOB:

- piu' prestazioni;
- backup piu' semplici;
- download/streaming piu' efficienti;
- caching migliore;
- minore carico DB.

## 19. Roadmap tecnica consigliata

### Fase 1: allineamento concettuale

- scegliere una sola architettura;
- definire una fonte unica di verita' per il modello dati;
- risolvere naming e struttura entita';
- decidere se migrare o rifare il DB.

### Fase 2: rifondazione backend

- creare nuovo progetto framework-based;
- definire migration;
- implementare autenticazione;
- implementare ruoli;
- implementare CRUD canti e messe;
- introdurre validazione e autorizzazione.

### Fase 3: storage e media

- introdurre tabella `files`;
- spostare PDF/audio fuori dal DB;
- creare upload, preview, download e streaming sicuri.

### Fase 4: esperienza utente

- ricerca;
- player audio;
- visualizzazione PDF;
- dashboard amministrativa;
- ottimizzazione mobile.

### Fase 5: funzionalita' avanzate

- logging modifiche;
- esportazione PDF completa messa;
- reportistica;
- suggerimenti intelligenti;
- storico utilizzo canti.

## 20. Valutazione complessiva del codice attuale

### Punti positivi

- il dominio e' chiaro;
- la specifica funzionale esiste;
- il modello iniziale intercetta le entita' giuste;
- c'e' gia' una prima formalizzazione del database;
- il progetto ha una direzione concreta.

### Punti deboli

- codice molto parziale;
- nessuna applicazione completa realmente navigabile;
- forte gap tra specifica e implementazione;
- problemi di sicurezza;
- schema dati incoerente;
- storage BLOB non ideale;
- assenza totale di auth e ruoli;
- nessuna testabilita';
- nessun deployment strutturato.

### Giudizio tecnico

Il progetto non va considerato come "da rifinire", ma piuttosto come "da ristrutturare in modo serio partendo dalla conoscenza di dominio gia' raccolta".

La parte piu' preziosa non e' il codice attuale.

La parte piu' preziosa e':

- l'idea di prodotto;
- la specifica funzionale;
- il dominio gia' pensato;
- la bozza del modello dati.

## 21. Indicazioni pratiche per un'altra AI

Se questo documento viene dato in input a un'altra AI, le domande a cui dovrebbe rispondere sono:

1. Conviene migrare il prototipo PHP attuale o riscrivere l'app da zero mantenendo solo dominio e specifiche?
2. Qual e' la stack piu' adatta tra Laravel server-rendered, Laravel API + frontend separato, Symfony, Next.js + backend dedicato o altra soluzione?
3. Quale schema dati finale conviene adottare tra prototipo attuale e specifica evoluta?
4. Come progettare una gestione file robusta per PDF e MP3 evitando i `LONGBLOB`?
5. Come implementare ruoli, permessi, audit log e download sicuro?
6. Come progettare la generazione del PDF aggregato della messa?
7. Come ottimizzare UX e ricerca per un archivio di canti liturgici?

## 22. Raccomandazione finale

La scelta tecnologica piu' sensata, salvo requisiti nascosti molto particolari, sembra questa:

- rifare la base applicativa con un framework moderno;
- usare PHP Laravel come prima opzione;
- usare MySQL/MariaDB;
- separare file e database;
- implementare un backend solido server-rendered o ibrido;
- costruire sopra la specifica esistente, non sopra il codice procedurale attuale.

Se il progetto deve restare pratico, economico e gestibile da una sola persona o da un piccolo team, la soluzione piu' equilibrata e':

- Laravel + Blade + MySQL + storage filesystem/S3-compatible.

Se invece il progetto deve evolvere in una piattaforma piu' ampia e molto interattiva, allora puo' valere la pena considerare:

- backend Laravel o NestJS;
- frontend Next.js o Vue.

In ogni caso, il codice presente oggi non e' una base sufficientemente solida per una semplice evoluzione incrementale senza rifattorizzazione importante.

## 23. Riferimenti ai file analizzati

File principali esaminati:

- [php/db_function.php](D:/Lavoro/WebSites/NoteDiFede/php/db_function.php)
- [config/config-db.php](D:/Lavoro/WebSites/NoteDiFede/config/config-db.php)
- [assets/css/main.css](D:/Lavoro/WebSites/NoteDiFede/assets/css/main.css)
- [assets/js/main.js](D:/Lavoro/WebSites/NoteDiFede/assets/js/main.js)
- [specs/project-spec.md](D:/Lavoro/WebSites/NoteDiFede/specs/project-spec.md)

## 24. Conclusione breve

Il progetto ha ottimo potenziale di prodotto ma oggi e' ancora in una fase pre-applicativa.

La base esistente va letta come:

- prototipo iniziale;
- analisi del dominio;
- raccolta requisiti.

Non come piattaforma gia' pronta da completare con poche aggiunte.

La mossa tecnica giusta, nella maggior parte degli scenari, e' una ricostruzione guidata e ordinata su stack moderno, riusando la conoscenza maturata ma non il disegno tecnico attuale cosi' com'e'.
