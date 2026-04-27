import { json, error } from '../../../_shared/response.js';

export async function onRequestGet({ env, params }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM obiettivi WHERE cliente_id = ? ORDER BY priorita, anno_target'
    ).bind(params.clienteId).all();
    return json(results);
  } catch (err) {
    return error(err.message);
  }
}
