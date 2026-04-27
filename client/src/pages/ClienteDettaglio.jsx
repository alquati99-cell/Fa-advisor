import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { formatEuro, TIPI_OBIETTIVO } from '../utils/format';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

const PRIORITA_CLASS = { alta: 'badge-alta', media: 'badge-media', bassa: 'badge-bassa' };
const ANNO_MAX = new Date().getFullYear() + 40;

const EMPTY_OBJ = { tipo: 'pensione', descrizione: '', importo_target: '', anno_target: '', priorita: 'media' };

export default function ClienteDettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [objForm, setObjForm] = useState(EMPTY_OBJ);
  const [editObjId, setEditObjId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const c = await api.getCliente(id);
    setCliente(c);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  function openNew() {
    setObjForm(EMPTY_OBJ);
    setEditObjId(null);
    setShowModal(true);
  }

  function openEdit(obj) {
    setObjForm({
      tipo: obj.tipo, descrizione: obj.descrizione || '',
      importo_target: obj.importo_target, anno_target: obj.anno_target,
      priorita: obj.priorita
    });
    setEditObjId(obj.id);
    setShowModal(true);
  }

  async function handleSaveObj(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...objForm,
        cliente_id: Number(id),
        importo_target: Number(objForm.importo_target),
        anno_target: Number(objForm.anno_target)
      };
      if (editObjId) {
        await api.updateObiettivo(editObjId, payload);
      } else {
        await api.createObiettivo(payload);
      }
      await load();
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteObj(objId) {
    if (!confirm('Eliminare questo obiettivo?')) return;
    await api.deleteObiettivo(objId);
    await load();
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Caricamento...</div>;
  if (!cliente) return <div className="p-8 text-center text-red-500">Cliente non trovato</div>;

  const anniPensione = Math.max(0, cliente.eta_pensione - cliente.eta);

  return (
    <div className="p-8">
      <PageHeader
        title={`${cliente.cognome} ${cliente.nome}`}
        subtitle={`${cliente.sesso === 'M' ? '♂' : '♀'} ${cliente.eta} anni${cliente.professione ? ` · ${cliente.professione}` : ''}`}
        action={
          <div className="flex gap-2">
            <Link to={`/clienti/${id}/modifica`} className="btn-secondary">Modifica</Link>
            <Link to={`/calcolatore?cliente=${id}`} className="btn-primary">⚡ Calcola Sinistro</Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profilo */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Profilo Finanziario</h3>
            <div className="space-y-3">
              {[
                { label: 'Reddito Annuo', value: formatEuro(cliente.reddito_annuo) },
                { label: 'Risparmi', value: formatEuro(cliente.risparmi) },
                { label: 'Copertura Esistente', value: formatEuro(cliente.assicurazione_esistente) },
                { label: 'Debiti', value: formatEuro(cliente.debiti_totali) },
                { label: 'Familiari a Carico', value: cliente.familiari_a_carico },
                { label: 'Età Pensione', value: `${cliente.eta_pensione} anni (${anniPensione} mancanti)` }
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
            {cliente.note && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">{cliente.note}</p>
              </div>
            )}
          </div>

          {/* Storico calcoli breve */}
          {cliente.calcoli?.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Ultimi Calcoli</h3>
                <Link to="/storico" className="text-xs text-blue-600 dark:text-blue-400">Vedi tutti</Link>
              </div>
              <div className="space-y-2">
                {cliente.calcoli.slice(0, 4).map(c => {
                  const r = JSON.parse(c.risultati);
                  return (
                    <Link
                      key={c.id}
                      to={`/risultati/${c.id}`}
                      className="block text-xs text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span className="font-medium">{r.tipo_sinistro?.replace(/_/g, ' ')}</span>
                      <span className="text-gray-400 dark:text-gray-500 ml-2">Gap: {formatEuro(r.gap_assicurativo)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Obiettivi */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Obiettivi Finanziari
                <span className="ml-2 text-xs text-gray-400 font-normal">({cliente.obiettivi?.length || 0})</span>
              </h3>
              <button onClick={openNew} className="btn-primary text-xs py-1.5 px-3">
                + Aggiungi Obiettivo
              </button>
            </div>

            {!cliente.obiettivi?.length ? (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-sm text-gray-400 dark:text-gray-500">Nessun obiettivo definito</p>
                <button onClick={openNew} className="btn-primary mt-3 text-sm">
                  Aggiungi il primo obiettivo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cliente.obiettivi.map(obj => {
                  const anniMancanti = Math.max(0, obj.anno_target - new Date().getFullYear());
                  return (
                    <div key={obj.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            {TIPI_OBIETTIVO[obj.tipo] || obj.tipo}
                          </span>
                          <span className={PRIORITA_CLASS[obj.priorita]}>{obj.priorita}</span>
                        </div>
                        {obj.descrizione && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{obj.descrizione}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Entro il {obj.anno_target} ({anniMancanti} anni)
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-gray-900 dark:text-white text-sm">{formatEuro(obj.importo_target)}</div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(obj)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-1">Mod.</button>
                        <button onClick={() => handleDeleteObj(obj.id)} className="text-xs text-red-600 dark:text-red-400 hover:underline px-1">Elim.</button>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Totale obiettivi</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatEuro(cliente.obiettivi.reduce((s, o) => s + o.importo_target, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal obiettivo */}
      {showModal && (
        <Modal title={editObjId ? 'Modifica Obiettivo' : 'Nuovo Obiettivo'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSaveObj} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo *</label>
                <select className="select" value={objForm.tipo} onChange={e => setObjForm(p => ({ ...p, tipo: e.target.value }))}>
                  {Object.entries(TIPI_OBIETTIVO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Priorità</label>
                <select className="select" value={objForm.priorita} onChange={e => setObjForm(p => ({ ...p, priorita: e.target.value }))}>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="bassa">Bassa</option>
                </select>
              </div>
              <div>
                <label className="label">Importo Target (€) *</label>
                <input type="number" className="input" required min="1" value={objForm.importo_target} onChange={e => setObjForm(p => ({ ...p, importo_target: e.target.value }))} placeholder="300000" />
              </div>
              <div>
                <label className="label">Anno Target *</label>
                <input type="number" className="input" required min={new Date().getFullYear() + 1} max={ANNO_MAX} value={objForm.anno_target} onChange={e => setObjForm(p => ({ ...p, anno_target: e.target.value }))} placeholder={new Date().getFullYear() + 20} />
              </div>
            </div>
            <div>
              <label className="label">Descrizione</label>
              <input className="input" value={objForm.descrizione} onChange={e => setObjForm(p => ({ ...p, descrizione: e.target.value }))} placeholder="es. Pensione complementare per mantenere tenore di vita..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvataggio...' : editObjId ? 'Salva Modifiche' : 'Aggiungi Obiettivo'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annulla</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
