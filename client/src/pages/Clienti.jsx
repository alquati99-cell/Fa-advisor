import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { formatEuro } from '../utils/format';
import PageHeader from '../components/PageHeader';

export default function Clienti() {
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.getClienti().then(setClienti).finally(() => setLoading(false));
  }, []);

  const filtered = clienti.filter(c =>
    `${c.nome} ${c.cognome} ${c.professione || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id, nome) {
    if (!confirm(`Eliminare il cliente ${nome}? Tutti i dati correlati saranno rimossi.`)) return;
    await api.deleteCliente(id);
    setClienti(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Clienti"
        subtitle={`${clienti.length} cliente${clienti.length !== 1 ? 'i' : ''} nel portafoglio`}
        action={
          <Link to="/clienti/nuovo" className="btn-primary">
            + Nuovo Cliente
          </Link>
        }
      />

      {/* Search */}
      <div className="mb-6">
        <input
          className="input max-w-sm"
          placeholder="Cerca per nome, cognome, professione..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="card py-12 text-center text-gray-400">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-gray-500 dark:text-gray-400">
            {search ? 'Nessun cliente trovato per questa ricerca' : 'Nessun cliente ancora inserito'}
          </p>
          {!search && (
            <Link to="/clienti/nuovo" className="btn-primary mt-4 inline-block">
              Aggiungi il primo cliente
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(c => (
            <div
              key={c.id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/clienti/${c.id}`)}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {c.nome[0]}{c.cognome[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                      {c.cognome} {c.nome}
                    </h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {c.sesso === 'M' ? '♂' : '♀'} {c.eta} anni
                    </span>
                  </div>
                  {c.professione && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{c.professione}</p>
                  )}
                </div>

                {/* Metriche */}
                <div className="hidden md:flex items-center gap-8 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Reddito Annuo</div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{formatEuro(c.reddito_annuo)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Risparmi</div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{formatEuro(c.risparmi)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Obiettivi</div>
                    <div className="font-semibold text-blue-600 dark:text-blue-400 text-sm">{c.num_obiettivi}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Calcoli</div>
                    <div className="font-semibold text-purple-600 dark:text-purple-400 text-sm">{c.num_calcoli}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <Link
                    to={`/clienti/${c.id}/modifica`}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Modifica
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id, `${c.nome} ${c.cognome}`)}
                    className="btn-danger text-xs py-1.5 px-3"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
