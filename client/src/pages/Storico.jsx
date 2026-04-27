import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { formatEuro, formatData, TIPI_SINISTRO } from '../utils/format';
import PageHeader from '../components/PageHeader';

export default function Storico() {
  const [clienti, setClienti] = useState([]);
  const [calcoli, setCalcoli] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  useEffect(() => {
    api.getClienti().then(async (cs) => {
      setClienti(cs);
      const all = await Promise.all(cs.map(c => api.getCalcoli(c.id).catch(() => [])));
      setCalcoli(all.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setLoading(false);
    });
  }, []);

  async function handleDelete(id) {
    if (!confirm('Eliminare questo calcolo?')) return;
    await api.deleteCalcolo(id);
    setCalcoli(prev => prev.filter(c => c.id !== id));
  }

  const filtered = calcoli.filter(c => {
    const r = c.risultati;
    const clienteOk = !filtroCliente || String(c.cliente_id) === filtroCliente;
    const tipoOk = !filtroTipo || c.tipo_sinistro === filtroTipo;
    return clienteOk && tipoOk;
  });

  return (
    <div className="p-8">
      <PageHeader
        title="Storico Calcoli"
        subtitle={`${calcoli.length} analisi effettuate`}
      />

      {/* Filtri */}
      <div className="flex gap-3 mb-6">
        <select className="select max-w-xs" value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
          <option value="">Tutti i clienti</option>
          {clienti.map(c => <option key={c.id} value={c.id}>{c.cognome} {c.nome}</option>)}
        </select>
        <select className="select max-w-xs" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Tutti i tipi</option>
          {Object.entries(TIPI_SINISTRO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="card py-12 text-center text-gray-400">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-400">Nessun calcolo trovato</p>
          <Link to="/calcolatore" className="btn-primary mt-4 inline-block">Effettua un calcolo</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">Data</th>
                <th className="text-left py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">Cliente</th>
                <th className="text-left py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">Tipo Sinistro</th>
                <th className="text-right py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">Bisogno Totale</th>
                <th className="text-right py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">Gap</th>
                <th className="text-center py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">Protezione</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const r = c.risultati;
                const cliente = clienti.find(cl => cl.id === c.cliente_id);
                return (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                      {formatData(c.created_at)}
                    </td>
                    <td className="py-3 px-3">
                      {cliente ? (
                        <Link to={`/clienti/${cliente.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                          {cliente.cognome} {cliente.nome}
                        </Link>
                      ) : <span className="text-gray-400">–</span>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium">
                        {TIPI_SINISTRO[c.tipo_sinistro]}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatEuro(r.totale_bisogno)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={r.gap_assicurativo > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400 font-bold'}>
                        {r.gap_assicurativo > 0 ? formatEuro(r.gap_assicurativo) : '✓ Coperto'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-bold ${r.indice_protezione >= 80 ? 'text-green-600 dark:text-green-400' : r.indice_protezione >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                        {r.indice_protezione}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Link to={`/risultati/${c.id}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                          Vedi
                        </Link>
                        <button onClick={() => handleDelete(c.id)} className="text-xs text-red-600 dark:text-red-400 hover:underline">
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
