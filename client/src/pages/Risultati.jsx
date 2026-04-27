import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { formatEuro, TIPI_SINISTRO, TIPI_OBIETTIVO, getIndiceColore, getGapColore } from '../utils/format';
import { getPolizzeConsigliate, TIPO_COLORI } from '../utils/polizze';
import PageHeader from '../components/PageHeader';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

function GaugeChart({ value }) {
  const color = value >= 80 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-36 h-36 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" startAngle={180} endAngle={0} data={[{ value, fill: color }]}>
          <RadialBar dataKey="value" cornerRadius={4} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center mt-6">
        <span className="text-3xl font-bold" style={{ color }}>{value}%</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">copertura</span>
      </div>
    </div>
  );
}

function PolizzaCard({ polizza, selected, onToggle, gapResiduo }) {
  const copertura = polizza.capitale_consigliato || polizza.capitale_max || 0;
  const nuovoGap = Math.max(0, gapResiduo - copertura);
  return (
    <div
      onClick={onToggle}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
          : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${TIPO_COLORI[polizza.tipo] || ''}`}>{polizza.tipo.replace('_', ' ')}</span>
            {selected && <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">✓ Selezionata</span>}
          </div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{polizza.nome}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{polizza.compagnia}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-gray-900 dark:text-white">€{polizza.premio_mensile_stimato}/m</div>
          <div className="text-xs text-gray-400">stima mensile</div>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{polizza.descrizione}</p>

      {polizza.capitale_consigliato > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
          Capitale consigliato: <span className="font-medium">{formatEuro(polizza.capitale_consigliato)}</span>
        </div>
      )}

      {selected && (
        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
          <div className="text-xs text-blue-700 dark:text-blue-300">
            Gap residuo dopo questa polizza: <span className="font-bold">{formatEuro(nuovoGap)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1 mt-2">
        {polizza.vantaggi?.map((v, i) => (
          <span key={i} className="text-[11px] bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">✓ {v}</span>
        ))}
      </div>
    </div>
  );
}

export default function Risultati() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polizzeSelezionate, setPolizzeSelezionate] = useState([]);

  useEffect(() => {
    api.getCalcolo(id).then(c => setData(c.risultati)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-400">Caricamento risultati...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Risultati non trovati</div>;

  const polizzeConsigliate = getPolizzeConsigliate(data.tipo_sinistro, data.gap_assicurativo);
  const bisogniItems = Object.entries(data.bisogni || {}).filter(([k]) => k !== 'dettaglio' && typeof data.bisogni[k] === 'number');

  const coperturaPolizze = polizzeSelezionate.reduce((sum, pid) => {
    const p = polizzeConsigliate.find(p => p.id === pid);
    return sum + (p?.capitale_consigliato || 0);
  }, 0);
  const premioTotale = polizzeSelezionate.reduce((sum, pid) => {
    const p = polizzeConsigliate.find(p => p.id === pid);
    return sum + (p?.premio_mensile_stimato || 0);
  }, 0);
  const gapResiduo = Math.max(0, data.gap_assicurativo - coperturaPolizze);
  const nuovoIndice = Math.min(100, Math.round(((data.copertura_esistente + coperturaPolizze) / Math.max(1, data.totale_bisogno)) * 100));

  function togglePolizza(pid) {
    setPolizzeSelezionate(prev => prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid]);
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Analisi Impatto Sinistro"
        subtitle={`${TIPI_SINISTRO[data.tipo_sinistro]} · ${data.cliente?.nome}`}
        action={
          <div className="flex gap-2">
            <Link to={`/clienti/${data.cliente?.id}`} className="btn-secondary">← Cliente</Link>
            <Link to="/calcolatore" className="btn-primary">+ Nuovo calcolo</Link>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Bisogno Totale', value: formatEuro(data.totale_bisogno), color: 'text-gray-900 dark:text-white' },
          { label: 'Copertura Attuale', value: formatEuro(data.copertura_esistente), color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Gap Assicurativo', value: formatEuro(gapResiduo), color: gapResiduo > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Indice Protezione', value: `${nuovoIndice}%`, color: getIndiceColore(nuovoIndice) },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Colonna sinistra: gauge + breakdown */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center text-sm uppercase tracking-wide">Indice di Protezione</h3>
            <GaugeChart value={nuovoIndice} />
            <div className={`mt-4 p-3 rounded-lg text-xs ${gapResiduo > 0 ? 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30' : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30'}`}>
              {gapResiduo > 0
                ? `Gap residuo di ${formatEuro(gapResiduo)}. Seleziona le polizze consigliate per coprire il rischio.`
                : `Copertura adeguata con le polizze selezionate. Monitorare periodicamente.`}
            </div>
          </div>

          {/* Bisogni breakdown */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wide">Composizione del Bisogno</h3>
            <div className="space-y-3">
              {bisogniItems.map(([k, v]) => {
                const pct = Math.round((v / data.totale_bisogno) * 100);
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatEuro(v)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-[#2a2a2a] rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confronto visivo */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2a2a2a] space-y-2">
              {[
                { label: 'Bisogno', val: data.totale_bisogno, color: 'bg-gray-400 dark:bg-gray-600' },
                { label: 'Copertura esistente', val: data.copertura_esistente, color: 'bg-emerald-500' },
                { label: 'Polizze selezionate', val: coperturaPolizze, color: 'bg-blue-500' },
                { label: 'Gap residuo', val: gapResiduo, color: 'bg-red-400' },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatEuro(val)}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-[#2a2a2a] rounded-full h-1.5">
                    <div className={`${color} h-1.5 rounded-full`} style={{ width: `${Math.min(100, Math.round((val / data.totale_bisogno) * 100))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dettaglio parametri */}
          {data.bisogni?.dettaglio && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Parametri di Calcolo</h3>
              <div className="space-y-2">
                {Object.entries(data.bisogni.dettaglio).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{typeof v === 'number' && v > 1000 ? formatEuro(v) : v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonna centrale: polizze consigliate */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Polizze Consigliate</h3>
              {polizzeSelezionate.length > 0 && (
                <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {polizzeSelezionate.length} selezionate
                </span>
              )}
            </div>

            {polizzeConsigliate.length === 0 ? (
              <p className="text-sm text-gray-400">Nessuna polizza disponibile per questo tipo di sinistro.</p>
            ) : (
              <div className="space-y-3">
                {polizzeConsigliate.map(p => (
                  <PolizzaCard
                    key={p.id}
                    polizza={p}
                    selected={polizzeSelezionate.includes(p.id)}
                    onToggle={() => togglePolizza(p.id)}
                    gapResiduo={data.gap_assicurativo}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Riepilogo selezione */}
          {polizzeSelezionate.length > 0 && (
            <div className="card border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/5">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 text-sm">Riepilogo Piano di Copertura</h3>
              <div className="space-y-2 mb-3">
                {polizzeSelezionate.map(pid => {
                  const p = polizzeConsigliate.find(p => p.id === pid);
                  if (!p) return null;
                  return (
                    <div key={pid} className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{p.nome}</span>
                      <span className="font-medium text-gray-900 dark:text-white">€{p.premio_mensile_stimato}/m</span>
                    </div>
                  );
                })}
              </div>
              <div className="pt-3 border-t border-blue-200 dark:border-blue-800 flex justify-between">
                <span className="font-semibold text-blue-900 dark:text-blue-200 text-sm">Premio totale stimato</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">€{premioTotale}/mese</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-blue-600 dark:text-blue-400">Gap coperto dalle polizze</span>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{formatEuro(coperturaPolizze)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Colonna destra: obiettivi impattati */}
        <div>
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wide">
              Impatto sugli Obiettivi
              {data.obiettivi_impattati?.length > 0 && (
                <span className="ml-2 text-xs text-gray-400 font-normal normal-case">({data.obiettivi_impattati.length})</span>
              )}
            </h3>

            {!data.obiettivi_impattati?.length ? (
              <p className="text-sm text-gray-400">Nessun obiettivo associato.</p>
            ) : (
              <div className="space-y-3">
                {data.obiettivi_impattati.map((obj, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-[#222]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {TIPI_OBIETTIVO[obj.tipo] || obj.tipo}
                      </span>
                      <span className={`text-xs font-bold ${obj.impatto_percentuale > 75 ? 'text-red-500' : obj.impatto_percentuale > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        -{obj.impatto_percentuale}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-[#333] rounded-full h-1.5 mb-2">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${obj.impatto_percentuale}%`,
                          backgroundColor: obj.impatto_percentuale > 75 ? '#ef4444' : obj.impatto_percentuale > 40 ? '#f59e0b' : '#22c55e'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Target: {formatEuro(obj.importo_target)}</span>
                      <span className="text-red-500 dark:text-red-400 font-medium">Gap: {formatEuro(obj.gap)}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">Entro {obj.anno_target} · {obj.anni_mancanti} anni</div>
                  </div>
                ))}
              </div>
            )}

            {/* Link chat */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
              <Link to="/chat" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                <span>✦</span>
                <span>Approfondisci con l'Assistente AI</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
