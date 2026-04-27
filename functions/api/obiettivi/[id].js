import { json, error } from '../../_shared/response.js';

export async function onRequestPut({ request, env, params }) {
  try {
    const { tipo, descrizione, importo_target, anno_target, priorita } = await request.json();
    await env.DB.prepare(`
      UPDATE obiettivi SET tipo=?, descrizione=?, importo_target=?, anno_target=?, priorita=? WHERE id=?
    `).bind(tipo, descrizione || '', importo_target, anno_target, priorita || 'media', params.id).run();

    const obiettivo = await env.DB.prepare('SELECT * FROM obiettivi WHERE id = ?').bind(params.id).first();
    if (!obiettivo) return error('Obiettivo non trovato', 404);
    return json(obiettivo);
  } catch (err) {
    return error(err.message);
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const result = await env.DB.prepare('DELETE FROM obiettivi WHERE id = ?').bind(params.id).run();
    if (result.meta.changes === 0) return error('Obiettivo non trovato', 404);
    return json({ success: true });
  } catch (err) {
    return error(err.message);
  }
}
