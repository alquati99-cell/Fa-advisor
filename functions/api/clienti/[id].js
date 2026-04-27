import { json, error } from '../../_shared/response.js';

export async function onRequestGet({ env, params }) {
  try {
    const cliente = await env.DB.prepare('SELECT * FROM clienti WHERE id = ?').bind(params.id).first();
    if (!cliente) return error('Cliente non trovato', 404);

    const { results: obiettivi } = await env.DB.prepare('SELECT * FROM obiettivi WHERE cliente_id = ? ORDER BY priorita, anno_target').bind(params.id).all();
    const { results: calcoli } = await env.DB.prepare('SELECT * FROM calcoli WHERE cliente_id = ? ORDER BY created_at DESC').bind(params.id).all();

    return json({ ...cliente, obiettivi, calcoli });
  } catch (err) {
    return error(err.message);
  }
}

export async function onRequestPut({ request, env, params }) {
  try {
    const body = await request.json();
    const { nome, cognome, data_nascita, eta, sesso, professione, reddito_annuo, eta_pensione, debiti_totali, risparmi, assicurazione_esistente, familiari_a_carico, note } = body;

    await env.DB.prepare(`
      UPDATE clienti SET nome=?, cognome=?, data_nascita=?, eta=?, sesso=?, professione=?,
        reddito_annuo=?, eta_pensione=?, debiti_totali=?, risparmi=?,
        assicurazione_esistente=?, familiari_a_carico=?, note=?, updated_at=datetime('now')
      WHERE id=?
    `).bind(nome, cognome, data_nascita, eta, sesso, professione, reddito_annuo, eta_pensione, debiti_totali, risparmi, assicurazione_esistente, familiari_a_carico, note, params.id).run();

    const cliente = await env.DB.prepare('SELECT * FROM clienti WHERE id = ?').bind(params.id).first();
    if (!cliente) return error('Cliente non trovato', 404);
    return json(cliente);
  } catch (err) {
    return error(err.message);
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const result = await env.DB.prepare('DELETE FROM clienti WHERE id = ?').bind(params.id).run();
    if (result.meta.changes === 0) return error('Cliente non trovato', 404);
    return json({ success: true });
  } catch (err) {
    return error(err.message);
  }
}
