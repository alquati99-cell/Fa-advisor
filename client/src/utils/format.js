export function formatEuro(value) {
  if (value === undefined || value === null) return '€ 0';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

export function formatData(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('it-IT');
}

export const TIPI_SINISTRO = {
  morte: 'Morte',
  invalidita_totale: 'Invalidità Totale',
  invalidita_parziale: 'Invalidità Parziale',
  malattia_grave: 'Malattia Grave',
  non_autosufficienza: 'Non Autosufficienza'
};

export const TIPI_OBIETTIVO = {
  pensione: 'Pensione Integrativa',
  istruzione: 'Istruzione Figli',
  casa: 'Acquisto Casa',
  emergenza: 'Fondo Emergenza',
  impresa: 'Avvio Impresa',
  altro: 'Altro'
};

export const TIPI_MALATTIA = {
  cancro: 'Cancro',
  infarto: 'Infarto',
  ictus: 'Ictus',
  insufficienza_renale: 'Insufficienza Renale',
  trapianto: 'Trapianto',
  generico: 'Generico'
};

export function getIndiceColore(indice) {
  if (indice >= 80) return 'text-green-600 dark:text-green-400';
  if (indice >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export function getGapColore(gap) {
  if (gap === 0) return 'text-green-600 dark:text-green-400';
  if (gap < 50000) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}
