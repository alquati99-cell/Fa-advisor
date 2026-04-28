import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { formatEuro, TIPI_SINISTRO, TIPI_MALATTIA } from '../utils/format';
import PageHeader from '../components/PageHeader';

export default function Calcolatore() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselCliente = searchParams.get('cliente');

  const [clienti, setClienti] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(preselCliente || '');
  const [clienteInfo, setClienteInfo] = useState(null);
  const [tipoSinistro, setTipoSinistro] = useState('morte');
  const [extra, setExtra] = useState({ percentuale_invalidita: 50, mesi_convalescenza: 12, tipo_malattia: 'generico', durata_non_autosufficienza: 7 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getClienti().then(setClienti);
  }, []);

  useEffect(() => {
    if (!selectedCliente) { setClienteInfo(null); return; }
    api.getCliente(selectedCliente).then(setClienteInfo);
  }, [selectedCliente]);

  async function handleCalcola(e) {
    e.preventDefault();
    if (!selectedCliente) { setError('Seleziona un cliente'); return; }
    setError('');
    setLoading(true);
    try {
      const payload = {
        cliente_id: Number(selectedCliente),
        tipo_sinistro: tipoSinistro,
        ...(['invalidita_parziale'].includes(tipoSinistro) ? { percentuale_invalidita: Number(extra.percentuale_invalidita) } : {}),
        ...(['malattia_grave'].includes(tipoSinistro) ? { mesi_convalescenza: Number(extra.mesi_convalescenza), tipo_malattia: extra.tipo_malattia } : {}),
        ...(['non_autosufficienza'].includes(tipoSinistro) ? { durata_non_autosufficienza: Number(extra.durata_non_autosufficienza) } : {})
      };
      const result = await api.calcola(payload);
      navigate(`/simulazione/${result.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const ICONE = {
    morte: '💀', invalidita_totale: '🦽', invalidita_parziale: '🩹',
    malattia_grave: '🏥', non_autosufficienza: '🛌'
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Calcolatore Impatto Sinistro"
        subtitle="Analizza l'impatto finanziario di un evento avverso sul cliente"
      />

      <form onSubmit={handleCalcola} className="space-y-6">

        {/* Selezione cliente */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">1. Seleziona Cliente</h2>
          {clienti.length === 0 ? (
            <p className="text-sm text-gray-400">Nessun cliente disponibile. <a className="text-blue-600 dark:text-blue-400 underline" href="/clienti/nuovo">Aggiungi un cliente</a>.</p>
          ) : (
            <select
              className="select"
              value={selectedCliente}
              onChange={e => setSelectedCliente(e.target.value)}
            >
              <option value="">-- Scegli cliente --</option>
              {clienti.map(c => (
                <option key={c.id} value={c.id}>
                  {c.cognome} {c.nome} – {c.eta} anni – {formatEuro(c.reddito_annuo)}/anno
                </option>
              ))}
            </select>
          )}

          {/* Preview cliente */}
          {clienteInfo && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Reddito Annuo', value: formatEuro(clienteInfo.reddito_annuo) },
                { label: 'Risparmi + Copertura', value: formatEuro((clienteInfo.risparmi || 0) + (clienteInfo.assicurazione_esistente || 0)) },
                { label: 'Obiettivi', value: `${clienteInfo.obiettivi?.length || 0} definiti` }
              ].map(({ label, value }) => (
                <div key={label} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">{label}</div>
                  <div className="font-bold text-blue-800 dark:text-blue-200 text-sm">{value}</div>
                </div>
              ))}
            </div>
          )}

          {clienteInfo && clienteInfo.obiettivi?.length === 0 && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-xs text-yellow-700 dark:text-yellow-300">
              ⚠️ Questo cliente non ha obiettivi definiti. Il calcolo sarà meno preciso.
              <a className="underline ml-1" href={`/clienti/${selectedCliente}`}>Aggiungi obiettivi</a>.
            </div>
          )}
        </div>

        {/* Tipo sinistro */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">2. Tipo di Sinistro</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(TIPI_SINISTRO).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTipoSinistro(key)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  tipoSinistro === key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-2">{ICONE[key]}</div>
                <div className={`font-medium text-sm ${tipoSinistro === key ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Parametri aggiuntivi */}
        {tipoSinistro === 'invalidita_parziale' && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">3. Parametri Invalidità</h2>
            <div>
              <label className="label">Percentuale di Invalidità: {extra.percentuale_invalidita}%</label>
              <input
                type="range" min="10" max="99" step="5"
                value={extra.percentuale_invalidita}
                onChange={e => setExtra(p => ({ ...p, percentuale_invalidita: e.target.value }))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Lieve (10%)</span><span>Grave (99%)</span>
              </div>
            </div>
          </div>
        )}

        {tipoSinistro === 'malattia_grave' && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">3. Parametri Malattia</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo di Malattia</label>
                <select className="select" value={extra.tipo_malattia} onChange={e => setExtra(p => ({ ...p, tipo_malattia: e.target.value }))}>
                  {Object.entries(TIPI_MALATTIA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Mesi di Convalescenza</label>
                <input type="number" className="input" min="1" max="36" value={extra.mesi_convalescenza}
                  onChange={e => setExtra(p => ({ ...p, mesi_convalescenza: e.target.value }))} />
              </div>
            </div>
          </div>
        )}

        {tipoSinistro === 'non_autosufficienza' && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">3. Parametri Non Autosufficienza</h2>
            <div>
              <label className="label">Durata Stimata (anni): {extra.durata_non_autosufficienza}</label>
              <input
                type="range" min="1" max="20" step="1"
                value={extra.durata_non_autosufficienza}
                onChange={e => setExtra(p => ({ ...p, durata_non_autosufficienza: e.target.value }))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Breve (1 anno)</span><span>Lunga (20 anni)</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Costo assistenza: €3.000/mese · media nazionale</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading || !selectedCliente}>
          {loading ? 'Calcolo in corso...' : '⚡ Calcola Impatto Sinistro'}
        </button>
      </form>
    </div>
  );
}
