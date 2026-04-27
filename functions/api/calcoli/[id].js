import { json, error } from '../../_shared/response.js';

export async function onRequestGet({ env, params }) {
  try {
    const calcolo = await env.DB.prepare('SELECT * FROM calcoli WHERE id = ?').bind(params.id).first();
    if (!calcolo) return error('Calcolo non trovato', 404);
    return json({ ...calcolo, risultati: JSON.parse(calcolo.risultati) });
  } catch (err) {
    return error(err.message);
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const result = await env.DB.prepare('DELETE FROM calcoli WHERE id = ?').bind(params.id).run();
    if (result.meta.changes === 0) return error('Calcolo non trovato', 404);
    return json({ success: true });
  } catch (err) {
    return error(err.message);
  }
}
