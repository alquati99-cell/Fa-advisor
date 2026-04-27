const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'fa_advisor.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS clienti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    data_nascita TEXT NOT NULL,
    eta INTEGER NOT NULL,
    sesso TEXT CHECK(sesso IN ('M','F')) DEFAULT 'M',
    professione TEXT,
    reddito_annuo REAL NOT NULL DEFAULT 0,
    eta_pensione INTEGER NOT NULL DEFAULT 67,
    debiti_totali REAL NOT NULL DEFAULT 0,
    risparmi REAL NOT NULL DEFAULT 0,
    assicurazione_esistente REAL NOT NULL DEFAULT 0,
    familiari_a_carico INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS obiettivi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('pensione','istruzione','casa','emergenza','impresa','altro')),
    descrizione TEXT,
    importo_target REAL NOT NULL,
    anno_target INTEGER NOT NULL,
    priorita TEXT NOT NULL DEFAULT 'media' CHECK(priorita IN ('alta','media','bassa')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clienti(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS calcoli (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    tipo_sinistro TEXT NOT NULL CHECK(tipo_sinistro IN ('morte','invalidita_totale','invalidita_parziale','malattia_grave','non_autosufficienza')),
    percentuale_invalidita REAL,
    mesi_convalescenza INTEGER,
    tipo_malattia TEXT,
    durata_non_autosufficienza INTEGER,
    risultati TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clienti(id) ON DELETE CASCADE
  );
`);

module.exports = db;
