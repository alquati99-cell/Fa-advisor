import { json, error } from '../../_shared/response.js';
import { calcolaImpatto } from '../../_shared/calculator.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { cliente_id, tipo_sinistro, percentuale_invalidita, mesi_convalescenza, tipo_malattia, durata_non_autosufficienza } = body;

    if (!cliente_id || !tipo_sinistro) {
      return error('Campi obbligatori: cliente_id, tipo_sinistro', 400);
    }

    const cliente = await env.DB.prepare('SELECT * FROM clienti WHERE id = ?').bind(cliente_id).first();
    if (!cliente) return error('Cliente non trovato', 404);

    const { results: obiettivi } = await env.DB.prepare('SELECT * FROM obiettivi WHERE cliente_id = ?').bind(cliente_id).all();

    const sinistro = { tipo_sinistro, percentuale_invalidita, mesi_convalescenza, tipo_malattia, durata_non_autosufficienza };
    const risultati = calcolaImpatto(cliente, obiettivi, sinistro);

    const result = await env.DB.prepare(`
      INSERT INTO calcoli (cliente_id, tipo_sinistro, percentuale_invalidita, mesi_convalescenza, tipo_malattia, durata_non_autosufficienza, risultati)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      cliente_id, tipo_sinistro,
      percentuale_invalidita || null, mesi_convalescenza || null,
      tipo_malattia || null, durata_non_autosufficienza || null,
      JSON.stringify(risultati)
    ).run();

    return json({ id: result.meta.last_row_id, ...risultati }, 201);
  } catch (err) {
    return error(err.message);
  }
}
