import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import PageHeader from '../components/PageHeader';

const EMPTY = {
  nome: '', cognome: '', data_nascita: '', eta: '', sesso: 'M', professione: '',
  reddito_annuo: '', eta_pensione: 67, debiti_totali: 0, risparmi: 0,
  assicurazione_esistente: 0, familiari_a_carico: 0, note: ''
};

function calcolaEta(dataNascita) {
  if (!dataNascita) return '';
  const today = new Date();
  const birth = new Date(dataNascita);
  let eta = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) eta--;
  return eta;
}

export default function ClienteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api.getCliente(id).then(c => {
      setForm({
        nome: c.nome, cognome: c.cognome, data_nascita: c.data_nascita,
        eta: c.eta, sesso: c.sesso, professione: c.professione || '',
        reddito_annuo: c.reddito_annuo, eta_pensione: c.eta_pensione,
        debiti_totali: c.debiti_totali, risparmi: c.risparmi,
        assicurazione_esistente: c.assicurazione_esistente,
        familiari_a_carico: c.familiari_a_carico, note: c.note || ''
      });
    });
  }, [id, isEdit]);

  function set(k, v) {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      if (k === 'data_nascita') next.eta = calcolaEta(v);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        eta: Number(form.eta),
        reddito_annuo: Number(form.reddito_annuo),
        eta_pensione: Number(form.eta_pensione),
        debiti_totali: Number(form.debiti_totali),
        risparmi: Number(form.risparmi),
        assicurazione_esistente: Number(form.assicurazione_esistente),
        familiari_a_carico: Number(form.familiari_a_carico)
      };
      if (isEdit) {
        await api.updateCliente(id, payload);
        navigate(`/clienti/${id}`);
      } else {
        const c = await api.createCliente(payload);
        navigate(`/clienti/${c.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader title={isEdit ? 'Modifica Cliente' : 'Nuovo Cliente'} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dati anagrafici */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Dati Anagrafici</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome *</label>
              <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} required />
            </div>
            <div>
              <label className="label">Cognome *</label>
              <input className="input" value={form.cognome} onChange={e => set('cognome', e.target.value)} required />
            </div>
            <div>
              <label className="label">Data di Nascita *</label>
              <input type="date" className="input" value={form.data_nascita} onChange={e => set('data_nascita', e.target.value)} required />
            </div>
            <div>
              <label className="label">Età (calcolata)</label>
              <input className="input bg-gray-50 dark:bg-gray-700" value={form.eta || ''} readOnly />
            </div>
            <div>
              <label className="label">Sesso</label>
              <select className="select" value={form.sesso} onChange={e => set('sesso', e.target.value)}>
                <option value="M">Maschio</option>
                <option value="F">Femmina</option>
              </select>
            </div>
            <div>
              <label className="label">Professione</label>
              <input className="input" value={form.professione} onChange={e => set('professione', e.target.value)} placeholder="es. Dirigente, Medico..." />
            </div>
          </div>
        </div>

        {/* Dati finanziari */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Profilo Finanziario</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Reddito Annuo Lordo (€) *</label>
              <input type="number" className="input" value={form.reddito_annuo} onChange={e => set('reddito_annuo', e.target.value)} required min="0" placeholder="50000" />
            </div>
            <div>
              <label className="label">Età Prevista Pensione</label>
              <input type="number" className="input" value={form.eta_pensione} onChange={e => set('eta_pensione', e.target.value)} min="55" max="80" />
            </div>
            <div>
              <label className="label">Risparmi / Patrimonio (€)</label>
              <input type="number" className="input" value={form.risparmi} onChange={e => set('risparmi', e.target.value)} min="0" />
            </div>
            <div>
              <label className="label">Copertura Assicurativa Esistente (€)</label>
              <input type="number" className="input" value={form.assicurazione_esistente} onChange={e => set('assicurazione_esistente', e.target.value)} min="0" placeholder="capitali già assicurati" />
            </div>
            <div>
              <label className="label">Debiti Totali (€)</label>
              <input type="number" className="input" value={form.debiti_totali} onChange={e => set('debiti_totali', e.target.value)} min="0" placeholder="mutui, prestiti..." />
            </div>
            <div>
              <label className="label">Familiari a Carico</label>
              <input type="number" className="input" value={form.familiari_a_carico} onChange={e => set('familiari_a_carico', e.target.value)} min="0" max="20" />
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="card">
          <label className="label">Note</label>
          <textarea
            className="input h-24 resize-none"
            value={form.note}
            onChange={e => set('note', e.target.value)}
            placeholder="Annotazioni aggiuntive sul cliente..."
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvataggio...' : isEdit ? 'Salva Modifiche' : 'Crea Cliente'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
