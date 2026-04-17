<?php

// ---------- Creazione DB --------------- // 

function connectToDatabase()
{
    $servername = "localhost";
    $username = "root";
    $password = ""; // Inserisci la tua password MySQL, se presente 
    $dbname = "notedifede"; //Connessione al server MySQL 
    $conn = new mysqli($servername, $username, $password); // Verifica della connessione
    if ($conn->connect_error) {
        die("Connessione fallita: " . $conn->connect_error);
    }

    // Creazione del database "notedifede" se non esiste
    $sql = "CREATE DATABASE IF NOT EXISTS $dbname";
    if ($conn->query($sql) === TRUE) {
        echo "Database '$dbname' creato con successo.<br>";
    } else {
        echo "Errore nella creazione del database: " . $conn->error . "<br>";
    }

    // Selezione del database "notedifede"
    $conn->select_db($dbname);

    return $conn;
}

function tableExists($conn, $tableName)
{
    $result = $conn->query("SHOW TABLES LIKE '$tableName'");
    return $result->num_rows > 0;
}

function createCantiTable($conn)
{
    $tableName = 'canti';

    // Verifica se la tabella esiste già
    if (tableExists($conn, $tableName)) {
        echo "La tabella '$tableName' già esiste.<br>";
        return;
    }

    // Query SQL per la creazione della tabella
    $sql = "CREATE TABLE $tableName (
id INT AUTO_INCREMENT PRIMARY KEY,
titolo VARCHAR(100),
autore VARCHAR(50),
spartito LONGBLOB,
accordi LONGBLOB,
testo LONGBLOB,
soprani LONGBLOB,
contralti LONGBLOB,
tenori LONGBLOB,
bassi LONGBLOB,
organo LONGBLOB,
audiocompleto LONGBLOB,
timestamp_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
timestamp_ultimamodifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

    // Esecuzione della query
    if ($conn->query($sql) === TRUE) {
        echo "Tabella '$tableName' creata con successo.<br>";
    } else {
        echo "Errore nella creazione della tabella: " . $conn->error . "<br>";
    }
}

function createMomentiMessaTable($conn)
{
    $tableName = 'momentimessa';

    // Verifica se la tabella esiste già
    if (tableExists($conn, $tableName)) {
        echo "La tabella '$tableName' già esiste.<br>";
        return;
    }

    // Query SQL per la creazione della tabella
    $sql = "CREATE TABLE $tableName (
id INT AUTO_INCREMENT PRIMARY KEY,
descrizione VARCHAR(50),
timestamp_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
timestamp_ultimamodifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

    // Esecuzione della query
    if ($conn->query($sql) === TRUE) {
        echo "Tabella '$tableName' creata con successo.<br>";
    } else {
        echo "Errore nella creazione della tabella: " . $conn->error . "<br>";
    }
}

function createTestataMesseTable($conn)
{
    $tableName = 'testatamesse';

    // Verifica se la tabella esiste già
    if (tableExists($conn, $tableName)) {
        echo "La tabella '$tableName' già esiste.<br>";
        return;
    }

    // Query SQL per la creazione della tabella
    $sql = "CREATE TABLE $tableName (
id INT AUTO_INCREMENT PRIMARY KEY,
data DATETIME,
descrizione VARCHAR(50),
anno_liturgico ENUM('A', 'B', 'C'),
timestamp_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
timestamp_ultimamodifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

    // Esecuzione della query
    if ($conn->query($sql) === TRUE) {
        echo "Tabella '$tableName' creata con successo.<br>";
    } else {
        echo "Errore nella creazione della tabella: " . $conn->error . "<br>";
    }
}

function createRigheMessaTable($conn)
{
    $tableName = 'RigheMessa';

    // Verifica se la tabella esiste già
    if (tableExists($conn, $tableName)) {
        echo "La tabella '$tableName' già esiste.<br>";
        return;
    }

    // Query SQL per la creazione della tabella
    $sql = "CREATE TABLE $tableName (
id INT AUTO_INCREMENT PRIMARY KEY,
id_testatamesse INT,
id_momentimessa INT,
id_canti INT,
timestamp_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
timestamp_ultimamodifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (id_testatamesse) REFERENCES testatamesse(id),
FOREIGN KEY (id_momentimessa) REFERENCES momentimessa(id),
FOREIGN KEY (id_canti) REFERENCES canti(id)
)";

    // Esecuzione della query
    if ($conn->query($sql) === TRUE) {
        echo "Tabella '$tableName' creata con successo.<br>";
    } else {
        echo "Errore nella creazione della tabella: " . $conn->error . "<br>";
    }
}


// ---------- Aggiornamento e Modifica DB --------------- //



// Funzione per l'inserimento di una nuova testata messa nella tabella 'testatamesse'
function insertTestataMessa($conn, $data, $descrizione, $annoLiturgico)
{
    // Verifica se la combinazione data, descrizione e anno liturgico già esiste
    $checkExistenceSQL = "SELECT * FROM testatamesse WHERE data='$data' AND descrizione='$descrizione' AND anno_liturgico='$annoLiturgico'";
    $result = $conn->query($checkExistenceSQL);

    if ($result && $result->num_rows > 0) {
        // La combinazione data, descrizione e anno liturgico già esiste
        echo "La combinazione data='$data', descrizione='$descrizione' e anno liturgico='$annoLiturgico' già esiste nella tabella 'testatamesse'.<br>";
    } else {
        // La combinazione data, descrizione e anno liturgico non esiste, procedi con l'inserimento
        $insertSQL = "INSERT INTO testatamesse (data, descrizione, anno_liturgico) VALUES ('$data', '$descrizione', '$annoLiturgico')";

        if ($conn->query($insertSQL) === TRUE) {
            echo "Inserimento nella tabella 'testatamesse' avvenuto con successo.<br>";
        } else {
            echo "Errore nell'inserimento: " . $conn->error . "<br>";
        }
    }
}

// Funzione per l'aggiornamento di una testata messa nella tabella 'testatamesse'
function updateTestataMessa($conn, $id, $data, $descrizione, $annoLiturgico)
{
    // Verifica se la combinazione data, descrizione e anno liturgico già esiste (escludendo l'attuale riga da controllare)
    $checkExistenceSQL = "SELECT * FROM testatamesse WHERE data='$data' AND descrizione='$descrizione' AND anno_liturgico='$annoLiturgico' AND id != '$id'";
    $result = $conn->query($checkExistenceSQL);

    if ($result && $result->num_rows > 0) {
        // La combinazione data, descrizione e anno liturgico già esiste
        echo "La combinazione data='$data', descrizione='$descrizione' e anno liturgico='$annoLiturgico' già esiste nella tabella 'testatamesse'.<br>";
    } else {
        // La combinazione data, descrizione e anno liturgico non esiste, procedi con l'aggiornamento
        $updateSQL = "UPDATE testatamesse SET data='$data', descrizione='$descrizione', anno_liturgico='$annoLiturgico' WHERE id=$id";

        if ($conn->query($updateSQL) === TRUE) {
            echo "Aggiornamento nella tabella 'testatamesse' avvenuto con successo.<br>";
        } else {
            echo "Errore nell'aggiornamento: " . $conn->error . "<br>";
        }
    }
}


// Funzione per la cancellazione di una riga dalla tabella 'testatamesse'
function deleteTestataMessa($conn, $id)
{
    $sql = "DELETE FROM testatamesse WHERE id=$id";

    if ($conn->query($sql) === TRUE) {
        echo "Cancellazione dalla tabella 'testatamesse' avvenuta con successo.<br>";
    } else {
        echo "Errore nella cancellazione: " . $conn->error . "<br>";
    }
}


// Funzione per l'inserimento di un nuovo momento nella tabella 'momentimessa'
function insertMomentoMessa($conn, $descrizione)
{
    // Verifica se la descrizione già esiste
    $checkExistenceSQL = "SELECT * FROM momentimessa WHERE descrizione='$descrizione'";
    $result = $conn->query($checkExistenceSQL);

    if ($result && $result->num_rows > 0) {
        // La descrizione già esiste
        echo "La descrizione '$descrizione' già esiste nella tabella 'momentimessa'.<br>";
    } else {
        // La descrizione non esiste, procedi con l'inserimento
        $insertSQL = "INSERT INTO momentimessa (descrizione) VALUES ('$descrizione')";

        if ($conn->query($insertSQL) === TRUE) {
            echo "Inserimento nella tabella 'momentimessa' avvenuto con successo.<br>";
        } else {
            echo "Errore nell'inserimento: " . $conn->error . "<br>";
        }
    }
}

// Funzione per l'aggiornamento di un momento nella tabella 'momentimessa'
function updateMomentoMessa($conn, $id, $descrizione)
{
    // Verifica se la descrizione già esiste (escludendo l'attuale riga da controllare)
    $checkExistenceSQL = "SELECT * FROM momentimessa WHERE descrizione='$descrizione' AND id != '$id'";
    $result = $conn->query($checkExistenceSQL);

    if ($result && $result->num_rows > 0) {
        // La descrizione già esiste
        echo "La descrizione '$descrizione' già esiste nella tabella 'momentimessa'.<br>";
    } else {
        // La descrizione non esiste, procedi con l'aggiornamento
        $updateSQL = "UPDATE momentimessa SET descrizione='$descrizione' WHERE id=$id";

        if ($conn->query($updateSQL) === TRUE) {
            echo "Aggiornamento nella tabella 'momentimessa' avvenuto con successo.<br>";
        } else {
            echo "Errore nell'aggiornamento: " . $conn->error . "<br>";
        }
    }
}


// Funzione per la cancellazione di una riga dalla tabella 'momentimessa'
function deleteMomentoMessa($conn, $id)
{
    $sql = "DELETE FROM momentimessa WHERE id=$id";

    if ($conn->query($sql) === TRUE) {
        echo "Cancellazione dalla tabella 'momentimessa' avvenuta con successo.<br>";
    } else {
        echo "Errore nella cancellazione: " . $conn->error . "<br>";
    }
}


// Funzione per l'inserimento di un nuovo canto nella tabella 'canti'
function insertCanto($conn, $titolo, $autore, $spartito, $accordi, $testo, $soprani, $contralti, $tenori, $bassi, $organo, $audiocompleto)
{
    // Verifica se la combinazione titolo e autore già esiste
    $checkExistenceSQL = "SELECT * FROM canti WHERE titolo='$titolo' AND autore='$autore'";
    $result = $conn->query($checkExistenceSQL);

    if ($result && $result->num_rows > 0) {
        // La combinazione titolo e autore già esiste
        echo "La combinazione titolo='$titolo' e autore='$autore' già esiste nella tabella 'canti'.<br>";
    } else {
        // La combinazione titolo e autore non esiste, procedi con l'inserimento
        $insertSQL = "INSERT INTO canti (titolo, autore, spartito, accordi, testo, soprani, contralti, tenori, bassi, organo, audiocompleto) VALUES ('$titolo', '$autore', '$spartito', '$accordi', '$testo', '$soprani', '$contralti', '$tenori', '$bassi', '$organo', '$audiocompleto')";

        if ($conn->query($insertSQL) === TRUE) {
            echo "Inserimento nella tabella 'canti' avvenuto con successo.<br>";
        } else {
            echo "Errore nell'inserimento: " . $conn->error . "<br>";
        }
    }
}


// Funzione per l'aggiornamento di un canto nella tabella 'canti'
function updateCanto($conn, $id, $titolo, $autore, $spartito, $accordi, $testo, $soprani, $contralti, $tenori, $bassi, $organo, $audiocompleto)
{
    // Verifica se la combinazione titolo e autore già esiste (escludendo l'attuale riga da controllare)
    $checkExistenceSQL = "SELECT * FROM canti WHERE titolo='$titolo' AND autore='$autore' AND id != '$id'";
    $result = $conn->query($checkExistenceSQL);

    if ($result && $result->num_rows > 0) {
        // La combinazione titolo e autore già esiste
        echo "La combinazione titolo='$titolo' e autore='$autore' già esiste nella tabella 'canti'.<br>";
    } else {
        // La combinazione titolo e autore non esiste, procedi con l'aggiornamento
        $updateSQL = "UPDATE canti SET titolo='$titolo', autore='$autore', spartito='$spartito', accordi='$accordi', testo='$testo', soprani='$soprani', contralti='$contralti', tenori='$tenori', bassi='$bassi', organo='$organo', audiocompleto='$audiocompleto' WHERE id=$id";

        if ($conn->query($updateSQL) === TRUE) {
            echo "Aggiornamento nella tabella 'canti' avvenuto con successo.<br>";
        } else {
            echo "Errore nell'aggiornamento: " . $conn->error . "<br>";
        }
    }
}

// Funzione per la cancellazione di una riga dalla tabella 'canti'
function deleteCanto($conn, $id)
{
    $sql = "DELETE FROM canti WHERE id=$id";

    if ($conn->query($sql) === TRUE) {
        echo "Cancellazione dalla tabella 'canti' avvenuta con successo.<br>";
    } else {
        echo "Errore nella cancellazione: " . $conn->error . "<br>";
    }
}


// Funzione per l'inserimento di una nuova riga nella tabella 'RigheMessa'
function insertRigaMessa($conn, $id_testatamesse, $id_momentimessa, $id_canti)
{
    // Verifica se la relazione già esiste
    $checkExistenceSQL = "SELECT * FROM RigheMessa WHERE id_testatamesse='$id_testatamesse' AND id_momentimessa='$id_momentimessa'";
    $result = $conn->query($checkExistenceSQL);

    if ($result && $result->num_rows > 0) {
        // La relazione già esiste, puoi decidere come gestire questa situazione
        echo "La relazione per testatamesse=$id_testatamesse e momentimessa=$id_momentimessa già esiste.<br>";
    } else {
        // La relazione non esiste, procedi con l'inserimento
        $insertSQL = "INSERT INTO RigheMessa (id_testatamesse, id_momentimessa, id_canti) VALUES ('$id_testatamesse', '$id_momentimessa', '$id_canti')";

        if ($conn->query($insertSQL) === TRUE) {
            echo "Inserimento nella tabella 'RigheMessa' avvenuto con successo.<br>";
        } else {
            echo "Errore nell'inserimento: " . $conn->error . "<br>";
        }
    }
}

// Funzione per l'aggiornamento di una riga nella tabella 'RigheMessa'
function updateRigaMessa($conn, $id, $id_testatamesse, $id_momentimessa, $id_canti)
{
    // Verifica se il canto è già utilizzato in un altro momentimessa per la stessa testatamesse
    $checkExistenceSQL = "SELECT * FROM RigheMessa WHERE id_testatamesse='$id_testatamesse' AND id_canti='$id_canti' AND id != '$id'";
    $result = $conn->query($checkExistenceSQL);

    if ($result && $result->num_rows > 0) {
        // Il canto è già utilizzato in un altro momentimessa per la stessa testatamesse
        echo "Il canto è già utilizzato in un altro momentimessa per la stessa testatamesse.<br>";
    } else {
        // Il canto non è utilizzato in un altro momentimessa per la stessa testatamesse, procedi con l'aggiornamento
        $updateSQL = "UPDATE RigheMessa SET id_testatamesse='$id_testatamesse', id_momentimessa='$id_momentimessa', id_canti='$id_canti' WHERE id=$id";

        if ($conn->query($updateSQL) === TRUE) {
            echo "Aggiornamento nella tabella 'RigheMessa' avvenuto con successo.<br>";
        } else {
            echo "Errore nell'aggiornamento: " . $conn->error . "<br>";
        }
    }
}

// Funzione per la cancellazione di una riga dalla tabella 'RigheMessa'
function deleteRigaMessa($conn, $id)
{
    $sql = "DELETE FROM RigheMessa WHERE id=$id";

    if ($conn->query($sql) === TRUE) {
        echo "Cancellazione dalla tabella 'RigheMessa' avvenuta con successo.<br>";
    } else {
        echo "Errore nella cancellazione: " . $conn->error . "<br>";
    }
}


// ---------- Elenchi e Filtri DB --------------- // 

function getElencoCanti($conn, $filtroDescrizione = null)
{
    $sql = "SELECT * FROM canti";

    // Aggiungi il filtro sulla descrizione, se specificato
    if ($filtroDescrizione !== null) {
        $filtroDescrizione = $conn->real_escape_string($filtroDescrizione);
        $sql .= " WHERE descrizione LIKE '%$filtroDescrizione%'";
    }

    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        // Restituisci l'array associativo con i risultati
        return $result->fetch_all(MYSQLI_ASSOC);
    } else {
        // Nessun risultato trovato
        return array();
    }
}

function getElencoTestateMesse($conn, $filtroData = null, $filtroDescrizione = null, $filtroAnnoLiturgico = null)
{
    $sql = "SELECT * FROM testatamesse";

    // Aggiungi i filtri se specificati
    $clausolaWhereAggiuntiva = array();

    if ($filtroData !== null) {
        $filtroData = $conn->real_escape_string($filtroData);
        $clausolaWhereAggiuntiva[] = "data = '$filtroData'";
    }

    if ($filtroDescrizione !== null) {
        $filtroDescrizione = $conn->real_escape_string($filtroDescrizione);
        $clausolaWhereAggiuntiva[] = "descrizione LIKE '%$filtroDescrizione%'";
    }

    if ($filtroAnnoLiturgico !== null) {
        $filtroAnnoLiturgico = $conn->real_escape_string($filtroAnnoLiturgico);
        $clausolaWhereAggiuntiva[] = "anno_liturgico = '$filtroAnnoLiturgico'";
    }

    if (!empty($clausolaWhereAggiuntiva)) {
        $sql .= " WHERE " . implode(" AND ", $clausolaWhereAggiuntiva);
    }

    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        // Restituisci l'array associativo con i risultati
        return $result->fetch_all(MYSQLI_ASSOC);
    } else {
        // Nessun risultato trovato
        return array();
    }
}
