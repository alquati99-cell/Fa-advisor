import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { formatEuro, TIPI_SINISTRO, TIPI_OBIETTIVO, TIPI_MALATTIA } from '../utils/format';
import { getPolizzeConsigliate } from '../utils/polizze';

// ─── Flow Steps ──────────────────────────────────────────────────────────────

const nomeBreve = d => d.nome_completo?.split(' ')[0] || 'il cliente';

const STEPS = [
  { id: 'nome',        bot: 'Come si chiama il cliente?',                                            type: 'text',    key: 'nome_completo',             placeholder: 'es. Mario Rossi' },
  { id: 'nascita',     bot: d => `Data di nascita di ${nomeBreve(d)}?`,                             type: 'date',    key: 'data_nascita' },
  { id: 'sesso',       bot: d => `${nomeBreve(d)} è...`,                                            type: 'choices', key: 'sesso',                     opts: [{ l: 'Uomo', v: 'M' }, { l: 'Donna', v: 'F' }] },
  { id: 'professione', bot: 'Professione? (opzionale)',                                              type: 'text',    key: 'professione',               placeholder: 'es. Imprenditore', skip: true },
  { id: 'reddito',     bot: d => `Qual è il reddito annuo lordo di ${nomeBreve(d)}?`,               type: 'number',  key: 'reddito_annuo',             placeholder: '60000', suffix: '€ / anno' },
  { id: 'pensione',    bot: 'Età prevista di pensionamento?',                                        type: 'choices', key: 'eta_pensione',              opts: [{ l: '62', v: 62 }, { l: '65', v: 65 }, { l: '67', v: 67 }, { l: '70', v: 70 }] },
  { id: 'familiari',   bot: 'Familiari economicamente a carico?',                                    type: 'choices', key: 'familiari_a_carico',        opts: [{ l: 'Nessuno', v: 0 }, { l: '1', v: 1 }, { l: '2', v: 2 }, { l: '3+', v: 3 }] },
  { id: 'risparmi',    bot: 'Risparmi e patrimonio attuale?',                                        type: 'number',  key: 'risparmi',                  placeholder: '0', suffix: '€', skipLabel: 'Nessuno (0)' },
  { id: 'assic',       bot: 'Coperture assicurative già esistenti?',                                 type: 'number',  key: 'assicurazione_esistente',   placeholder: '0', suffix: '€', skipLabel: 'Nessuna (0)' },
  { id: 'debiti',      bot: 'Debiti totali (mutuo, prestiti)?',                                      type: 'number',  key: 'debiti_totali',             placeholder: '0', suffix: '€', skipLabel: 'Nessuno (0)' },

  { id: 'haobj',       bot: d => `Perfetto! Vuoi definire gli obiettivi finanziari di ${nomeBreve(d)}?`, type: 'choices', key: '_haobj',          opts: [{ l: 'Sì, aggiungo obiettivi', v: 'si' }, { l: 'No, procedi alla simulazione', v: 'no' }] },

  { id: 'obj1t',       bot: 'Tipo di obiettivo?',                                                   type: 'choices', key: '_obj1t',   skipIf: d => d._haobj !== 'si', opts: Object.entries(TIPI_OBIETTIVO).map(([v, l]) => ({ l, v })) },
  { id: 'obj1i',       bot: 'Importo target?',                                                      type: 'number',  key: '_obj1i',   skipIf: d => d._haobj !== 'si', placeholder: '200000', suffix: '€' },
  { id: 'obj1a',       bot: 'Entro quale anno?',                                                     type: 'number',  key: '_obj1a',   skipIf: d => d._haobj !== 'si', placeholder: String(new Date().getFullYear() + 20), suffix: '' },
  { id: 'haobj2',      bot: 'Vuoi aggiungere un secondo obiettivo?',                                type: 'choices', key: '_haobj2',  skipIf: d => d._haobj !== 'si', opts: [{ l: 'Sì', v: 'si' }, { l: 'No, procedi', v: 'no' }] },
  { id: 'obj2t',       bot: 'Tipo del secondo obiettivo?',                                          type: 'choices', key: '_obj2t',   skipIf: d => d._haobj2 !== 'si', opts: Object.entries(TIPI_OBIETTIVO).map(([v, l]) => ({ l, v })) },
  { id: 'obj2i',       bot: 'Importo target?',                                                      type: 'number',  key: '_obj2i',   skipIf: d => d._haobj2 !== 'si', placeholder: '100000', suffix: '€' },
  { id: 'obj2a',       bot: 'Entro quale anno?',                                                     type: 'number',  key: '_obj2a',   skipIf: d => d._haobj2 !== 'si', placeholder: String(new Date().getFullYear() + 25), suffix: '' },

  { id: 'sinistro',    bot: d => `Quale scenario simuliamo per ${nomeBreve(d)}?`,                   type: 'choices', key: 'tipo_sinistro', opts: Object.entries(TIPI_SINISTRO).map(([v, l]) => ({ l, v })) },
  { id: 'perc_inv',    bot: 'Percentuale di invalidità?',                                           type: 'choices', key: 'percentuale_invalidita', skipIf: d => d.tipo_sinistro !== 'invalidita_parziale', opts: [{ l: '25%', v: 25 }, { l: '50%', v: 50 }, { l: '75%', v: 75 }, { l: '99%', v: 99 }] },
  { id: 'tipo_mal',    bot: 'Tipo di malattia?',                                                    type: 'choices', key: 'tipo_malattia',          skipIf: d => d.tipo_sinistro !== 'malattia_grave', opts: Object.entries(TIPI_MALATTIA).map(([v, l]) => ({ l, v })) },
  { id: 'mesi_conv',   bot: 'Mesi di convalescenza previsti?',                                      type: 'choices', key: 'mesi_convalescenza',      skipIf: d => d.tipo_sinistro !== 'malattia_grave', opts: [{ l: '6 mesi', v: 6 }, { l: '12 mesi', v: 12 }, { l: '18 mesi', v: 18 }, { l: '24 mesi', v: 24 }] },
  { id: 'dur_na',      bot: 'Durata stimata della non autosufficienza?',                            type: 'choices', key: 'durata_non_autosufficienza', skipIf: d => d.tipo_sinistro !== 'non_autosufficienza', opts: [{ l: '3 anni', v: 3 }, { l: '5 anni', v: 5 }, { l: '7 anni', v: 7 }, { l: '10 anni', v: 10 }, { l: '15 anni', v: 15 }] },
];

function getNextIdx(fromIdx, newData) {
  let i = fromIdx + 1;
  while (i < STEPS.length && STEPS[i].skipIf?.(newData)) i++;
  return i;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BotMessage({ text }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5">FA</div>
      <div className="bubble-assistant">{text}</div>
    </div>
  );
}

function UserMessage({ text }) {
  return (
    <div className="flex justify-end">
      <div className="bubble-user">{text}</div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      </div>
      <div className="bubble-assistant flex items-center gap-1.5">
        {[0, 150, 300].map(d => (
          <span key={d} className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  );
}

function ResultCard({ r }) {
  const polizze = getPolizzeConsigliate(r.tipo_sinistro, r.gap_assicurativo).slice(0, 3);
  const color = r.indice_protezione >= 80 ? '#22c55e' : r.indice_protezione >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-4 space-y-4 max-w-md">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { l: 'Bisogno totale', v: formatEuro(r.totale_bisogno), c: 'text-gray-900 dark:text-white' },
          { l: 'Gap assicurativo', v: formatEuro(r.gap_assicurativo), c: r.gap_assicurativo > 0 ? 'text-red-500' : 'text-emerald-500' },
        ].map(({ l, v, c }) => (
          <div key={l} className="bg-gray-50 dark:bg-[#222] rounded-lg p-3">
            <div className="text-[11px] text-gray-400 mb-0.5">{l}</div>
            <div className={`font-bold text-sm ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      {/* Protezione */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Indice di protezione</span>
          <span className="font-bold" style={{ color }}>{r.indice_protezione}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-[#2a2a2a] rounded-full h-2">
          <div className="h-2 rounded-full transition-all" style={{ width: `${r.indice_protezione}%`, backgroundColor: color }} />
        </div>
      </div>

      {/* Messaggio */}
      <p className="text-xs text-gray-500 dark:text-gray-400 italic">{r.raccomandazione}</p>

      {/* Top polizze */}
      {r.gap_assicurativo > 0 && polizze.length > 0 && (
        <div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Polizze consigliate</div>
          <div className="space-y-1.5">
            {polizze.map(p => (
              <div key={p.id} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-[#222] rounded-lg px-3 py-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{p.nome}</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">€{p.premio_mensile_stimato}/m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InputArea({ step, onAnswer, disabled }) {
  const [val, setVal] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setVal('');
    if (step.type === 'text' || step.type === 'number' || step.type === 'date') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step.id]);

  function submit(value, label) {
    if (disabled) return;
    onAnswer(step.key, value, label || String(value));
  }

  function handleKey(e) {
    if (e.key === 'Enter' && (step.type === 'text' || step.type === 'number') && val.trim()) {
      submit(step.type === 'number' ? Number(val) : val.trim());
    }
  }

  if (step.type === 'choices') {
    return (
      <div className="flex-shrink-0 px-8 pb-6 pt-3 max-w-2xl mx-auto w-full">
        <div className="flex flex-wrap gap-2">
          {step.opts.map(({ l, v }) => (
            <button
              key={String(v)}
              onClick={() => submit(v, l)}
              disabled={disabled}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-sm text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-all duration-150 disabled:opacity-40"
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step.type === 'text' || step.type === 'number') {
    return (
      <div className="flex-shrink-0 px-8 pb-6 pt-3 border-t border-gray-100 dark:border-[#222] max-w-2xl mx-auto w-full">
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-4 py-2.5 focus-within:border-blue-500 transition-colors">
            <input
              ref={inputRef}
              type={step.type === 'number' ? 'number' : 'text'}
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={handleKey}
              placeholder={step.placeholder || ''}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
            />
            {step.suffix && <span className="text-xs text-gray-400 flex-shrink-0">{step.suffix}</span>}
          </div>
          {step.skipLabel && (
            <button onClick={() => submit(0, step.skipLabel)} className="btn-ghost text-xs whitespace-nowrap">
              {step.skipLabel}
            </button>
          )}
          {step.skip && (
            <button onClick={() => submit('', 'Saltato')} className="btn-ghost text-xs">Salta</button>
          )}
          <button
            onClick={() => val.trim() && submit(step.type === 'number' ? Number(val) : val.trim())}
            disabled={!val.trim()}
            className="btn-primary py-2.5 px-4 text-sm"
          >
            ↵
          </button>
        </div>
      </div>
    );
  }

  if (step.type === 'date') {
    return (
      <div className="flex-shrink-0 px-8 pb-6 pt-3 border-t border-gray-100 dark:border-[#222] max-w-2xl mx-auto w-full">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="date"
            value={val}
            onChange={e => setVal(e.target.value)}
            className="input flex-1"
            max={new Date().toISOString().split('T')[0]}
          />
          <button
            onClick={() => val && submit(val)}
            disabled={!val}
            className="btn-primary"
          >
            Avanti ↵
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState({});
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [risultato, setRisultato] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const addBot = useCallback(async (text, extra = {}) => {
    setTyping(true);
    await new Promise(r => setTimeout(r, 500));
    setTyping(false);
    setMessages(prev => [...prev, { type: 'bot', text, ...extra }]);
  }, []);

  // Show first question on mount
  useEffect(() => {
    const firstStep = STEPS[0];
    addBot(typeof firstStep.bot === 'function' ? firstStep.bot({}) : firstStep.bot);
  }, []);

  async function handleAnswer(key, value, displayText) {
    setMessages(prev => [...prev, { type: 'user', text: displayText }]);
    const newData = { ...data, [key]: value };
    setData(newData);

    const nextIdx = getNextIdx(stepIdx, newData);

    if (nextIdx >= STEPS.length) {
      await runCalcolo(newData);
      return;
    }

    setStepIdx(nextIdx);
    const next = STEPS[nextIdx];
    const text = typeof next.bot === 'function' ? next.bot(newData) : next.bot;
    await addBot(text);
  }

  async function runCalcolo(d) {
    await addBot(`Sto elaborando l'analisi per ${nomeBreve(d)}...`);
    setTyping(true);

    try {
      const parts = (d.nome_completo || 'Cliente').trim().split(' ');
      const nome = parts[0];
      const cognome = parts.slice(1).join(' ') || '-';
      const birth = d.data_nascita ? new Date(d.data_nascita) : null;
      const eta = birth ? new Date().getFullYear() - birth.getFullYear() : 40;

      const cliente = await api.createCliente({
        nome, cognome,
        data_nascita: d.data_nascita || `${new Date().getFullYear() - eta}-01-01`,
        eta,
        sesso: d.sesso || 'M',
        professione: d.professione || '',
        reddito_annuo: Number(d.reddito_annuo) || 0,
        eta_pensione: Number(d.eta_pensione) || 67,
        familiari_a_carico: Number(d.familiari_a_carico) || 0,
        risparmi: Number(d.risparmi) || 0,
        assicurazione_esistente: Number(d.assicurazione_esistente) || 0,
        debiti_totali: Number(d.debiti_totali) || 0,
      });

      if (d._haobj === 'si' && d._obj1t) {
        await api.createObiettivo({ cliente_id: cliente.id, tipo: d._obj1t, importo_target: Number(d._obj1i) || 100000, anno_target: Number(d._obj1a) || new Date().getFullYear() + 20, priorita: 'alta' });
      }
      if (d._haobj2 === 'si' && d._obj2t) {
        await api.createObiettivo({ cliente_id: cliente.id, tipo: d._obj2t, importo_target: Number(d._obj2i) || 100000, anno_target: Number(d._obj2a) || new Date().getFullYear() + 25, priorita: 'media' });
      }

      const res = await api.calcola({
        cliente_id: cliente.id,
        tipo_sinistro: d.tipo_sinistro,
        percentuale_invalidita: d.percentuale_invalidita || null,
        mesi_convalescenza: d.mesi_convalescenza || null,
        tipo_malattia: d.tipo_malattia || null,
        durata_non_autosufficienza: d.durata_non_autosufficienza || null,
      });

      setTyping(false);
      const r = { ...res, clienteId: cliente.id };
      setRisultato(r);
      setDone(true);
      setMessages(prev => [...prev, { type: 'bot', text: `Ecco l'analisi completa per ${d.nome_completo}:`, resultData: r }]);

    } catch (err) {
      setTyping(false);
      setMessages(prev => [...prev, { type: 'bot', text: `Errore durante il calcolo: ${err.message}` }]);
    }
  }

  function reset() {
    setMessages([]);
    setStepIdx(0);
    setData({});
    setTyping(false);
    setDone(false);
    setRisultato(null);
    const first = STEPS[0];
    addBot(typeof first.bot === 'function' ? first.bot({}) : first.bot);
  }

  const currentStep = !done && !typing ? STEPS[stepIdx] : null;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-6 pb-4 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analisi Guidata</h1>
          <p className="text-sm text-gray-400 mt-0.5">Inserisci i dati del cliente passo dopo passo</p>
        </div>
        {done && (
          <button onClick={reset} className="btn-ghost text-sm">↺ Nuova analisi</button>
        )}
      </div>

      {/* Progress */}
      {!done && (
        <div className="flex-shrink-0 px-8 py-2">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <div className="flex-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((stepIdx / STEPS.length) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{stepIdx}/{STEPS.length}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            msg.type === 'bot' ? (
              <div key={i} className="space-y-3">
                <BotMessage text={msg.text} />
                {msg.resultData && <div className="pl-10"><ResultCard r={msg.resultData} /></div>}
              </div>
            ) : (
              <UserMessage key={i} text={msg.text} />
            )
          ))}
          {typing && <TypingIndicator />}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="max-w-2xl mx-auto w-full">
        {currentStep && (
          <InputArea step={currentStep} onAnswer={handleAnswer} disabled={typing} />
        )}
        {done && risultato && (
          <div className="px-8 pb-6 pt-3 flex flex-wrap gap-2 justify-center">
            <Link to={`/risultati/${risultato.id}`} className="btn-primary">Analisi completa + Polizze →</Link>
            <Link to={`/clienti/${risultato.clienteId}`} className="btn-secondary">Profilo cliente</Link>
            <button onClick={reset} className="btn-ghost">↺ Nuova analisi</button>
          </div>
        )}
      </div>
    </div>
  );
}
