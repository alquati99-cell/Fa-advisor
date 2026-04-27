import { json, error } from '../../_shared/response.js';

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT c.*,
        COUNT(DISTINCT o.id) as num_obiettivi,
        COUNT(DISTINCT ca.id) as num_calcoli
      FROM clienti c
      LEFT JOIN obiettivi o ON o.cliente_id = c.id
      LEFT JOIN calcoli ca ON ca.cliente_id = c.id
      GROUP BY c.id
      ORDER BY c.cognome, c.nome
    `).all();
    return json(results);
  } catch (err) {
    return error(err.message);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { nome, cognome, data_nascita, eta, sesso, professione, reddito_annuo, eta_pensione, debiti_totali, risparmi, assicurazione_esistente, familiari_a_carico, note } = body;

    if (!nome || !cognome || !data_nascita || eta === undefined || reddito_annuo === undefined) {
      return error('Campi obbligatori mancanti', 400);
    }

    const result = await env.DB.prepare(`
      INSERT INTO clienti (nome, cognome, data_nascita, eta, sesso, professione, reddito_annuo, eta_pensione, debiti_totali, risparmi, assicurazione_esistente, familiari_a_carico, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(nome, cognome, data_nascita, eta, sesso || 'M', professione || '', reddito_annuo, eta_pensione || 67, debiti_totali || 0, risparmi || 0, assicurazione_esistente || 0, familiari_a_carico || 0, note || '').run();

    const cliente = await env.DB.prepare('SELECT * FROM clienti WHERE id = ?').bind(result.meta.last_row_id).first();
    return json(cliente, 201);
  } catch (err) {
    return error(err.message);
  }
}
