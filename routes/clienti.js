const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  try {
    const clienti = db.prepare(`
      SELECT c.*,
        COUNT(DISTINCT o.id) as num_obiettivi,
        COUNT(DISTINCT ca.id) as num_calcoli
      FROM clienti c
      LEFT JOIN obiettivi o ON o.cliente_id = c.id
      LEFT JOIN calcoli ca ON ca.cliente_id = c.id
      GROUP BY c.id
      ORDER BY c.cognome, c.nome
    `).all();
    res.json(clienti);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const cliente = db.prepare('SELECT * FROM clienti WHERE id = ?').get(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente non trovato' });

    const obiettivi = db.prepare('SELECT * FROM obiettivi WHERE cliente_id = ? ORDER BY priorita, anno_target').all(req.params.id);
    const calcoli = db.prepare('SELECT * FROM calcoli WHERE cliente_id = ? ORDER BY created_at DESC').all(req.params.id);

    res.json({ ...cliente, obiettivi, calcoli });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      nome, cognome, data_nascita, eta, sesso, professione,
      reddito_annuo, eta_pensione, debiti_totali, risparmi,
      assicurazione_esistente, familiari_a_carico, note
    } = req.body;

    if (!nome || !cognome || !data_nascita || eta === undefined || reddito_annuo === undefined) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti: nome, cognome, data_nascita, eta, reddito_annuo' });
    }

    const result = db.prepare(`
      INSERT INTO clienti (nome, cognome, data_nascita, eta, sesso, professione,
        reddito_annuo, eta_pensione, debiti_totali, risparmi,
        assicurazione_esistente, familiari_a_carico, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      nome, cognome, data_nascita, eta, sesso || 'M', professione || '',
      reddito_annuo, eta_pensione || 67, debiti_totali || 0, risparmi || 0,
      assicurazione_esistente || 0, familiari_a_carico || 0, note || ''
    );

    const cliente = db.prepare('SELECT * FROM clienti WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const {
      nome, cognome, data_nascita, eta, sesso, professione,
      reddito_annuo, eta_pensione, debiti_totali, risparmi,
      assicurazione_esistente, familiari_a_carico, note
    } = req.body;

    db.prepare(`
      UPDATE clienti SET
        nome = ?, cognome = ?, data_nascita = ?, eta = ?, sesso = ?, professione = ?,
        reddito_annuo = ?, eta_pensione = ?, debiti_totali = ?, risparmi = ?,
        assicurazione_esistente = ?, familiari_a_carico = ?, note = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      nome, cognome, data_nascita, eta, sesso, professione,
      reddito_annuo, eta_pensione, debiti_totali, risparmi,
      assicurazione_esistente, familiari_a_carico, note,
      req.params.id
    );

    const cliente = db.prepare('SELECT * FROM clienti WHERE id = ?').get(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente non trovato' });
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM clienti WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Cliente non trovato' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
