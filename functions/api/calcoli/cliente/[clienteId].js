import { json, error } from '../../../_shared/response.js';

export async function onRequestGet({ env, params }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM calcoli WHERE cliente_id = ? ORDER BY created_at DESC'
    ).bind(params.clienteId).all();

    const parsed = results.map(c => ({ ...c, risultati: JSON.parse(c.risultati) }));
    return json(parsed);
  } catch (err) {
    return error(err.message);
  }
}
