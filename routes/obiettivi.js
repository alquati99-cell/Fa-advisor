const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/cliente/:clienteId', (req, res) => {
  try {
    const obiettivi = db.prepare(
      'SELECT * FROM obiettivi WHERE cliente_id = ? ORDER BY priorita, anno_target'
    ).all(req.params.clienteId);
    res.json(obiettivi);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { cliente_id, tipo, descrizione, importo_target, anno_target, priorita } = req.body;

    if (!cliente_id || !tipo || importo_target === undefined || !anno_target) {
      return res.status(400).json({ error: 'Campi obbligatori: cliente_id, tipo, importo_target, anno_target' });
    }

    const result = db.prepare(`
      INSERT INTO obiettivi (cliente_id, tipo, descrizione, importo_target, anno_target, priorita)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(cliente_id, tipo, descrizione || '', importo_target, anno_target, priorita || 'media');

    const obiettivo = db.prepare('SELECT * FROM obiettivi WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(obiettivo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { tipo, descrizione, importo_target, anno_target, priorita } = req.body;

    db.prepare(`
      UPDATE obiettivi SET tipo = ?, descrizione = ?, importo_target = ?, anno_target = ?, priorita = ?
      WHERE id = ?
    `).run(tipo, descrizione || '', importo_target, anno_target, priorita || 'media', req.params.id);

    const obiettivo = db.prepare('SELECT * FROM obiettivi WHERE id = ?').get(req.params.id);
    if (!obiettivo) return res.status(404).json({ error: 'Obiettivo non trovato' });
    res.json(obiettivo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM obiettivi WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Obiettivo non trovato' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
