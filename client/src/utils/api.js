const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Errore di rete');
  return data;
}

export const api = {
  // Clienti
  getClienti: () => request('/clienti'),
  getCliente: (id) => request(`/clienti/${id}`),
  createCliente: (body) => request('/clienti', { method: 'POST', body: JSON.stringify(body) }),
  updateCliente: (id, body) => request(`/clienti/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCliente: (id) => request(`/clienti/${id}`, { method: 'DELETE' }),

  // Obiettivi
  getObiettivi: (clienteId) => request(`/obiettivi/cliente/${clienteId}`),
  createObiettivo: (body) => request('/obiettivi', { method: 'POST', body: JSON.stringify(body) }),
  updateObiettivo: (id, body) => request(`/obiettivi/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteObiettivo: (id) => request(`/obiettivi/${id}`, { method: 'DELETE' }),

  // Calcoli
  calcola: (body) => request('/calcoli/calcola', { method: 'POST', body: JSON.stringify(body) }),
  getCalcoli: (clienteId) => request(`/calcoli/cliente/${clienteId}`),
  getCalcolo: (id) => request(`/calcoli/${id}`),
  deleteCalcolo: (id) => request(`/calcoli/${id}`, { method: 'DELETE' })
};
