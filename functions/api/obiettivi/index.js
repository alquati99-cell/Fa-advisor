import { json, error } from '../../_shared/response.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { cliente_id, tipo, descrizione, importo_target, anno_target, priorita } = body;

    if (!cliente_id || !tipo || importo_target === undefined || !anno_target) {
      return error('Campi obbligatori: cliente_id, tipo, importo_target, anno_target', 400);
    }

    const result = await env.DB.prepare(`
      INSERT INTO obiettivi (cliente_id, tipo, descrizione, importo_target, anno_target, priorita)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(cliente_id, tipo, descrizione || '', importo_target, anno_target, priorita || 'media').run();

    const obiettivo = await env.DB.prepare('SELECT * FROM obiettivi WHERE id = ?').bind(result.meta.last_row_id).first();
    return json(obiettivo, 201);
  } catch (err) {
    return error(err.message);
  }
}
