import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { formatEuro, TIPI_SINISTRO, TIPI_OBIETTIVO, getIndiceColore, getGapColore } from '../utils/format';
import PageHeader from '../components/PageHeader';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const PRIORITA_COLORS = { alta: '#ef4444', media: '#f59e0b', bassa: '#22c55e' };

function GaugeChart({ value }) {
  const color = value >= 80 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444';
  const data = [{ value, fill: color }, { value: 100 - value, fill: 'transparent' }];
  return (
    <div className="relative w-32 h-32 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" startAngle={180} endAngle={0} data={[{ value, fill: color }]}>
          <RadialBar dataKey="value" cornerRadius={4} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center mt-4">
        <span className="text-2xl font-bold" style={{ color }}>{value}%</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">copertura</span>
      </div>
    </div>
  );
}

export default function Risultati() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCalcolo(id).then(c => setData(c.risultati)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-400">Caricamento risultati...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Risultati non trovati</div>;

  const bisogniItems = Object.entries(data.bisogni || {}).filter(([k]) => k !== 'dettaglio' && typeof data.bisogni[k] === 'number');
  const barData = bisogniItems.map(([key, val]) => ({
    name: key.replace(/_/g, ' '),
    valore: val
  }));

  return (
    <div className="p-8">
      <PageHeader
        title="Analisi Impatto Sinistro"
        subtitle={`${TIPI_SINISTRO[data.tipo_sinistro]} · ${data.cliente?.nome}`}
        action={
          <div className="flex gap-2">
            <Link to={`/clienti/${data.cliente?.id}`} className="btn-secondary">← Torna al Cliente</Link>
            <Link to="/calcolatore" className="btn-primary">Nuovo Calcolo</Link>
          </div>
        }
      />

      {/* Riepilogo top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Totale Bisogno</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatEuro(data.totale_bisogno)}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Copertura Attuale</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatEuro(data.copertura_esistente)}</div>
        </div>
        <div className={`card text-center ${data.gap_assicurativo > 0 ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800'}`}>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Gap Assicurativo</div>
          <div className={`text-2xl font-bold ${getGapColore(data.gap_assicurativo)}`}>{formatEuro(data.gap_assicurativo)}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Indice Protezione</div>
          <div className={`text-2xl font-bold ${getIndiceColore(data.indice_protezione)}`}>{data.indice_protezione}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Gauge e raccomandazione */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">Indice di Protezione</h3>
            <GaugeChart value={data.indice_protezione} />
            <div className={`mt-4 p-3 rounded-lg text-xs ${data.gap_assicurativo > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'}`}>
              {data.raccomandazione}
            </div>
          </div>

          {/* Dettaglio calcolo */}
          {data.bisogni?.dettaglio && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Parametri di Calcolo</h3>
              <div className="space-y-2">
                {Object.entries(data.bisogni.dettaglio).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {typeof v === 'number' && v > 1000 ? formatEuro(v) : v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Breakdown bisogni */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Composizione del Bisogno</h3>
            {bisogniItems.length > 0 && (
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10, fill: 'currentColor' }} />
                    <Tooltip formatter={(v) => formatEuro(v)} />
                    <Bar dataKey="valore" radius={4}>
                      {barData.map((_, i) => <Cell key={i} fill={['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][i % 4]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-2">
              {bisogniItems.map(([k, v]) => {
                const pct = Math.round((v / data.totale_bisogno) * 100);
                return (
                  <div key={k}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatEuro(v)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confronto */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Bisogno vs Copertura</h3>
            <div className="space-y-3">
              {[
                { label: 'Bisogno Totale', val: data.totale_bisogno, color: 'bg-blue-500' },
                { label: 'Copertura Esistente', val: data.copertura_esistente, color: 'bg-green-500' },
                { label: 'Gap Residuo', val: data.gap_assicurativo, color: 'bg-red-500' }
              ].map(({ label, val, color }) => {
                const pct = Math.min(100, Math.round((val / data.totale_bisogno) * 100));
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300">{label}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{formatEuro(val)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Obiettivi impattati */}
        <div>
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Impatto sugli Obiettivi
              {data.obiettivi_impattati?.length > 0 && (
                <span className="ml-2 text-xs text-gray-400 font-normal">({data.obiettivi_impattati.length})</span>
              )}
            </h3>

            {!data.obiettivi_impattati?.length ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Nessun obiettivo associato al cliente.</p>
            ) : (
              <div className="space-y-3">
                {data.obiettivi_impattati.map((obj, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {TIPI_OBIETTIVO[obj.tipo] || obj.tipo}
                      </span>
                      <span className="text-xs font-bold" style={{ color: PRIORITA_COLORS[obj.priorita] || '#6b7280' }}>
                        {obj.impatto_percentuale}% impatto
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${obj.impatto_percentuale}%`,
                          backgroundColor: obj.impatto_percentuale > 75 ? '#ef4444' : obj.impatto_percentuale > 40 ? '#f59e0b' : '#22c55e'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Target: {formatEuro(obj.importo_target)}</span>
                      <span className="text-red-600 dark:text-red-400 font-medium">Gap: {formatEuro(obj.gap)}</span>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Entro {obj.anno_target} ({obj.anni_mancanti} anni)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
