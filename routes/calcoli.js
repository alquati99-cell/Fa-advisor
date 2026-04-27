const express = require('express');
const router = express.Router();
const db = require('../database');
const { calcolaImpatto } = require('../engine/calculator');

router.post('/calcola', (req, res) => {
  try {
    const { cliente_id, tipo_sinistro, percentuale_invalidita, mesi_convalescenza, tipo_malattia, durata_non_autosufficienza } = req.body;

    if (!cliente_id || !tipo_sinistro) {
      return res.status(400).json({ error: 'Campi obbligatori: cliente_id, tipo_sinistro' });
    }

    const cliente = db.prepare('SELECT * FROM clienti WHERE id = ?').get(cliente_id);
    if (!cliente) return res.status(404).json({ error: 'Cliente non trovato' });

    const obiettivi = db.prepare('SELECT * FROM obiettivi WHERE cliente_id = ?').all(cliente_id);

    const sinistro = { tipo_sinistro, percentuale_invalidita, mesi_convalescenza, tipo_malattia, durata_non_autosufficienza };
    const risultati = calcolaImpatto(cliente, obiettivi, sinistro);

    const result = db.prepare(`
      INSERT INTO calcoli (cliente_id, tipo_sinistro, percentuale_invalidita, mesi_convalescenza, tipo_malattia, durata_non_autosufficienza, risultati)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      cliente_id, tipo_sinistro,
      percentuale_invalidita || null,
      mesi_convalescenza || null,
      tipo_malattia || null,
      durata_non_autosufficienza || null,
      JSON.stringify(risultati)
    );

    res.json({ id: result.lastInsertRowid, ...risultati });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cliente/:clienteId', (req, res) => {
  try {
    const calcoli = db.prepare(
      'SELECT * FROM calcoli WHERE cliente_id = ? ORDER BY created_at DESC'
    ).all(req.params.clienteId);

    const parsed = calcoli.map(c => ({ ...c, risultati: JSON.parse(c.risultati) }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const calcolo = db.prepare('SELECT * FROM calcoli WHERE id = ?').get(req.params.id);
    if (!calcolo) return res.status(404).json({ error: 'Calcolo non trovato' });
    res.json({ ...calcolo, risultati: JSON.parse(calcolo.risultati) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM calcoli WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Calcolo non trovato' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
