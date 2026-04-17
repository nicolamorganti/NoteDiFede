# Note di Fede - Sistema di Gestione Musica Liturgica

## Panoramica del Progetto
Sistema completo per la gestione della musica liturgica, comprensivo di spartiti, registrazioni MP3 e organizzazione delle messe.

## Struttura Database

### CANTI
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| ID | INT | Chiave primaria |
| Codice | VARCHAR(50) | Codice del canto (es. "176/ex cd 150") |
| Titolo | VARCHAR(255) | Titolo principale del canto |
| Titolo_alternativo | VARCHAR(255) | Titolo alternativo/secondario del canto |
| Note | TEXT | Note aggiuntive |
| Data_creazione | TIMESTAMP | Data e ora di creazione |
| Data_modifica | TIMESTAMP | Data e ora ultima modifica |
| Creato_da | INT | ID utente creatore |
| Modificato_da | INT | ID ultimo utente che ha modificato |

### CANTI_MOMENTI
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| ID_canto | INT | Chiave esterna CANTI |
| ID_momento | INT | Chiave esterna MOMENTI_MESSA |
| Data_creazione | TIMESTAMP | Data e ora di creazione |
| Data_modifica | TIMESTAMP | Data e ora ultima modifica |
| Creato_da | INT | ID utente creatore |
| Modificato_da | INT | ID ultimo utente che ha modificato |

### MOMENTI_MESSA
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| ID | INT | Chiave primaria |
| Nome | VARCHAR(255) | Nome del momento (es. "Ingresso") |
| Ordine | INT | Ordine nella messa |
| Data_creazione | TIMESTAMP | Data e ora di creazione |
| Data_modifica | TIMESTAMP | Data e ora ultima modifica |
| Creato_da | INT | ID utente creatore |
| Modificato_da | INT | ID ultimo utente che ha modificato |

### MESSE
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| ID | INT | Chiave primaria |
| Titolo | VARCHAR(255) | Titolo della messa |
| Anno_liturgico | CHAR(1) | Anno liturgico (A/B/C) |
| Data | DATE | Data della messa |
| Note | TEXT | Note aggiuntive |
| Data_creazione | TIMESTAMP | Data e ora di creazione |
| Data_modifica | TIMESTAMP | Data e ora ultima modifica |
| Creato_da | INT | ID utente creatore |
| Modificato_da | INT | ID ultimo utente che ha modificato |

### MESSA_CANTI
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| ID_messa | INT | Chiave esterna MESSE |
| ID_canto | INT | Chiave esterna CANTI |
| ID_momento | INT | Chiave esterna MOMENTI_MESSA |
| Ordine | INT | Ordine del canto nella messa |
| Data_creazione | TIMESTAMP | Data e ora di creazione |
| Data_modifica | TIMESTAMP | Data e ora ultima modifica |
| Creato_da | INT | ID utente creatore |
| Modificato_da | INT | ID ultimo utente che ha modificato |

### UTENTI
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| ID | INT | Chiave primaria |
| Nome_utente | VARCHAR(50) | Username per login |
| Password | VARCHAR(255) | Password criptata |
| Ruolo | ENUM | 'normale'/'maestro' |
| Data_creazione | TIMESTAMP | Data creazione account |
| Data_modifica | TIMESTAMP | Data ultima modifica |
| Ultimo_accesso | TIMESTAMP | Data ultimo accesso |

### FILES
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| ID | INT | Chiave primaria |
| ID_canto | INT | Chiave esterna CANTI |
| Tipo | ENUM | Tipo file (spartito_pdf, testo_pdf, accordi_pdf, mp3_completo, mp3_soprano, mp3_contralto, mp3_tenore, mp3_basso) |
| Percorso | VARCHAR(255) | Percorso nel filesystem |
| Nome_file | VARCHAR(255) | Nome file originale |
| Dimensione | INT | Dimensione in bytes |
| Tipo_mime | VARCHAR(100) | Tipo MIME del file |
| Data_creazione | TIMESTAMP | Data di caricamento |
| Data_modifica | TIMESTAMP | Data ultima modifica |
| Caricato_da | INT | ID utente che ha caricato |
| Modificato_da | INT | ID ultimo utente che ha modificato |

### REGISTRO_ATTIVITÀ
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| ID | INT | Chiave primaria |
| Nome_tabella | VARCHAR(50) | Nome tabella modificata |
| ID_record | INT | ID record modificato |
| Azione | ENUM | Tipo azione (creazione/modifica/eliminazione) |
| ID_utente | INT | Utente che ha eseguito l'azione |
| Modifiche | JSON | Valori vecchi e nuovi |
| Data_creazione | TIMESTAMP | Data e ora azione |
| Indirizzo_IP | VARCHAR(45) | Indirizzo IP utente |

## Ruoli e Permessi

### Utente Normale
- Visualizzazione messe e canti
- Download materiali:
  - PDF individuali
  - PDF completo messa con indice
  - File MP3
- Ascolto MP3 online
- Visualizzazione PDF online

### Utente Maestro
- Tutti i permessi dell'Utente Normale
- Gestione canti:
  - Creazione nuovi canti
  - Modifica canti esistenti
  - Eliminazione canti
  - Caricamento file
- Gestione messe:
  - Creazione nuove messe
  - Modifica messe
  - Associazione canti ai momenti della messa
- Tracciamento modifiche

## Funzionalità Principali

### Generazione PDF
- Creazione automatica indice
- Struttura:
  1. Copertina con data e titolo messa
  2. Indice momenti e canti
  3. PDF dei canti in sequenza

### Lettore Audio
- Interfaccia responsive
- Controlli base (play/pausa/stop)
- Selezione traccia (completa/voci singole)
- Design compatibile mobile

### Interfaccia Utente

#### Sezione Pubblica
- Ricerca messe
- Ricerca canti
- Visualizzatore PDF
- Lettore audio
- Gestione download

#### Sezione Amministrazione
- Gestione canti
- Gestione messe
- Sistema caricamento file
- Sistema logging modifiche

## Requisiti Tecnici

### Backend
- API RESTful
- Sistema di autenticazione
- Sistema gestione file
- Servizio generazione PDF
- Sistema logging attività

### Frontend
- Design responsive
- Integrazione visualizzatore PDF
- Integrazione lettore audio
- Form user-friendly
- Validazione in tempo reale

### Sicurezza
- Crittografia password
- Controllo accessi basato su ruoli
- Controllo accesso ai file
- Autenticazione API
- Validazione input

### Prestazioni
- Cache dei file
- Indicizzazione database
- Caricamento lazy per file grandi
- Compressione per download
- Limitazione chiamate API

## Fasi di Sviluppo

1. **Fase 1: Sistema Base**
   - Configurazione database
   - Autenticazione base
   - Sistema gestione file

2. **Fase 2: Gestione Canti**
   - Operazioni CRUD canti
   - Sistema upload file
   - Integrazione visualizzatore PDF

3. **Fase 3: Gestione Messe**
   - Operazioni CRUD messe
   - Associazioni canti-messa
   - Sistema generazione PDF

4. **Fase 4: Funzionalità Audio**
   - Integrazione lettore audio
   - Supporto multi-voce
   - Ottimizzazione mobile

5. **Fase 5: Funzionalità Avanzate**
   - Ricerca avanzata
   - Operazioni batch
   - Sistema reportistica

## Manutenzione e Aggiornamenti
- Aggiornamenti sicurezza regolari
- Backup database
- Gestione spazio archiviazione
- Monitoraggio prestazioni
- Sistema feedback utenti