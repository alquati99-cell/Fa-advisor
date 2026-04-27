import Anthropic from '@anthropic-ai/sdk';
import { json, error } from '../../_shared/response.js';

const SYSTEM_PROMPT = `Sei un consulente finanziario assicurativo esperto del mercato italiano.
Aiuti i financial advisor a spiegare ai clienti l'importanza della protezione assicurativa.
Rispondi sempre in italiano, in modo chiaro e professionale ma accessibile.
Puoi fare calcoli e dare stime orientative su premi e capitali assicurativi.
Non fornire mai consulenza medica. Per prodotti specifici, invita sempre a verificare con la compagnia.
Tieni le risposte concise (max 3-4 paragrafi) a meno che non ti venga chiesto di approfondire.`;

export async function onRequestPost({ request, env }) {
  try {
    const { messages, clienteContext } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return error('messages array richiesto', 400);
    }

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return error('ANTHROPIC_API_KEY non configurata', 500);
    }

    const client = new Anthropic({ apiKey });

    const systemWithContext = clienteContext
      ? `${SYSTEM_PROMPT}\n\nContesto cliente attuale:\n${JSON.stringify(clienteContext, null, 2)}`
      : SYSTEM_PROMPT;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemWithContext,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    });

    return json({ content: response.content[0].text });
  } catch (err) {
    return error(err.message);
  }
}
