CREATE TABLE IF NOT EXISTS clienti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  data_nascita TEXT NOT NULL,
  eta INTEGER NOT NULL,
  sesso TEXT DEFAULT 'M',
  professione TEXT,
  reddito_annuo REAL NOT NULL DEFAULT 0,
  eta_pensione INTEGER NOT NULL DEFAULT 67,
  debiti_totali REAL NOT NULL DEFAULT 0,
  risparmi REAL NOT NULL DEFAULT 0,
  assicurazione_esistente REAL NOT NULL DEFAULT 0,
  familiari_a_carico INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS obiettivi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  descrizione TEXT,
  importo_target REAL NOT NULL,
  anno_target INTEGER NOT NULL,
  priorita TEXT NOT NULL DEFAULT 'media',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cliente_id) REFERENCES clienti(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calcoli (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  tipo_sinistro TEXT NOT NULL,
  percentuale_invalidita REAL,
  mesi_convalescenza INTEGER,
  tipo_malattia TEXT,
  durata_non_autosufficienza INTEGER,
  risultati TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cliente_id) REFERENCES clienti(id) ON DELETE CASCADE
);
