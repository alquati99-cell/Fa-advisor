import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { formatEuro, TIPI_SINISTRO } from '../utils/format';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getClienti().then(setClienti).finally(() => setLoading(false));
  }, []);

  const totaleClienti = clienti.length;
  const totaleObiettivi = clienti.reduce((s, c) => s + (c.num_obiettivi || 0), 0);
  const totaleCalcoli = clienti.reduce((s, c) => s + (c.num_calcoli || 0), 0);
  const redditoMedio = clienti.length
    ? Math.round(clienti.reduce((s, c) => s + c.reddito_annuo, 0) / clienti.length)
    : 0;

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        subtitle="Panoramica del portafoglio clienti"
        action={
          <Link to="/clienti/nuovo" className="btn-primary">
            + Nuovo Cliente
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Clienti Totali" value={totaleClienti} sub="nel portafoglio" color="blue" />
        <StatCard label="Obiettivi Definiti" value={totaleObiettivi} sub="su tutti i clienti" color="green" />
        <StatCard label="Calcoli Effettuati" value={totaleCalcoli} sub="analisi sinistri" color="yellow" />
        <StatCard label="Reddito Medio" value={formatEuro(redditoMedio)} sub="annuo per cliente" color="blue" />
      </div>

      {/* Lista clienti recenti */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Clienti Recenti</h2>
          <Link to="/clienti" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Vedi tutti →
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-400">Caricamento...</div>
        ) : clienti.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nessun cliente ancora inserito</p>
            <Link to="/clienti/nuovo" className="btn-primary mt-4 inline-block">
              Aggiungi il primo cliente
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Cliente</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Età</th>
                  <th className="text-right py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Reddito</th>
                  <th className="text-center py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Obiettivi</th>
                  <th className="text-center py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Calcoli</th>
                  <th className="py-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {clienti.slice(0, 10).map(c => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs font-bold">
                          {c.nome[0]}{c.cognome[0]}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{c.cognome} {c.nome}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{c.eta} anni</td>
                    <td className="py-3 px-2 text-right font-medium text-gray-900 dark:text-white">{formatEuro(c.reddito_annuo)}</td>
                    <td className="py-3 px-2 text-center">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium">{c.num_obiettivi}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-medium">{c.num_calcoli}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Link to={`/clienti/${c.id}`} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
                        Apri →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tipi di Sinistro Analizzabili</h3>
          <div className="space-y-2">
            {Object.entries(TIPI_SINISTRO).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Come Funziona</h3>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex gap-2"><span className="font-bold text-blue-600 dark:text-blue-400">1.</span>Inserisci il profilo del cliente con reddito e patrimonio</li>
            <li className="flex gap-2"><span className="font-bold text-blue-600 dark:text-blue-400">2.</span>Definisci gli obiettivi finanziari (pensione, casa, istruzione...)</li>
            <li className="flex gap-2"><span className="font-bold text-blue-600 dark:text-blue-400">3.</span>Seleziona il tipo di sinistro da analizzare</li>
            <li className="flex gap-2"><span className="font-bold text-blue-600 dark:text-blue-400">4.</span>Ottieni l'analisi dell'impatto e il gap assicurativo</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
