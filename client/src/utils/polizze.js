export const POLIZZE = [
  {
    id: 1, tipo: 'vita', nome: 'Vita Pura Essenziale', compagnia: 'Generali',
    capitale_min: 100000, capitale_max: 2000000, premio_mensile_base: 45,
    sinistri: ['morte'],
    descrizione: 'Copertura vita con capitale a termine. Ideale per proteggere i familiari in caso di premorienza.',
    vantaggi: ['Capital sum-insured flessibile', 'Premio fisso per tutta la durata', 'Detraibile fiscalmente al 19%']
  },
  {
    id: 2, tipo: 'vita', nome: 'Vita Protetta Plus', compagnia: 'Allianz',
    capitale_min: 200000, capitale_max: 3000000, premio_mensile_base: 70,
    sinistri: ['morte'],
    descrizione: 'Polizza vita con opzione rendita mensile ai beneficiari. Include rimborso premi in caso di sopravvivenza.',
    vantaggi: ['Rendita o capitale a scelta', 'Rimborso premi se si sopravvive', 'Copertura globale 24/7']
  },
  {
    id: 3, tipo: 'invalidita', nome: 'Reddito Protetto', compagnia: 'Unipol',
    capitale_min: 50000, capitale_max: 1000000, premio_mensile_base: 90,
    sinistri: ['invalidita_totale', 'invalidita_parziale'],
    descrizione: 'Rendita mensile sostitutiva del reddito in caso di invalidità permanente da qualsiasi causa.',
    vantaggi: ['Copre invalidità totale e parziale', 'Rendita fino all\'età pensionistica', 'No carenza per infortuni']
  },
  {
    id: 4, tipo: 'invalidita', nome: 'Invalidità & Vita', compagnia: 'AXA',
    capitale_min: 100000, capitale_max: 1500000, premio_mensile_base: 120,
    sinistri: ['invalidita_totale', 'morte'],
    descrizione: 'Soluzione combinata che eroga il capitale sia in caso di invalidità totale (>66%) che di morte.',
    vantaggi: ['Doppia copertura in un\'unica polizza', 'Esonero premi in caso di invalidità', 'Capitale rivalutabile']
  },
  {
    id: 5, tipo: 'malattia_grave', nome: 'Gravi Malattie Premium', compagnia: 'Generali',
    capitale_min: 30000, capitale_max: 500000, premio_mensile_base: 75,
    sinistri: ['malattia_grave'],
    descrizione: 'Capitale immediato alla diagnosi di 40+ patologie gravi: cancro, infarto, ictus e altre malattie critiche.',
    vantaggi: ['Pagamento immediato alla diagnosi', 'Copre 40+ malattie', 'Utilizzo libero del capitale']
  },
  {
    id: 6, tipo: 'malattia_grave', nome: 'Dread Disease & Recovery', compagnia: 'Cattolica',
    capitale_min: 50000, capitale_max: 800000, premio_mensile_base: 95,
    sinistri: ['malattia_grave'],
    descrizione: 'Copertura malattie gravi con indennità giornaliera di ricovero e rimborso spese riabilitazione.',
    vantaggi: ['Indennità giornaliera ospedaliera', 'Rimborso riabilitazione', '2ª opinione medica inclusa']
  },
  {
    id: 7, tipo: 'ltc', nome: 'Non Autosufficienza Rendita', compagnia: 'Unipol',
    capitale_min: 0, capitale_max: 0, premio_mensile_base: 150,
    sinistri: ['non_autosufficienza'],
    descrizione: 'Rendita mensile da €1.500 in caso di perdita di autosufficienza. Attivazione entro 30 giorni dalla diagnosi.',
    vantaggi: ['Rendita mensile immediata', 'Nessun limite di durata', 'Assistenza domiciliare inclusa']
  },
  {
    id: 8, tipo: 'ltc', nome: 'LTC Completo', compagnia: 'Allianz',
    capitale_min: 0, capitale_max: 0, premio_mensile_base: 200,
    sinistri: ['non_autosufficienza'],
    descrizione: 'Rendita mensile da €2.500 + contributo una tantum per adattamento dell\'abitazione (fino a €25.000).',
    vantaggi: ['Rendita €2.500/mese', 'Contributo adattamento casa', 'Case manager dedicato']
  },
  {
    id: 9, tipo: 'multi', nome: 'Protezione Totale', compagnia: 'Generali',
    capitale_min: 100000, capitale_max: 1000000, premio_mensile_base: 210,
    sinistri: ['morte', 'invalidita_totale', 'malattia_grave'],
    descrizione: 'Soluzione all-in-one: copre morte, invalidità totale e malattie gravi con un\'unica polizza integrata.',
    vantaggi: ['Copertura completa in una polizza', 'Sconto multi-rischio 15%', 'Revisione annuale gratuita']
  }
];

export function getPolizzeConsigliate(tipoSinistro, gap) {
  return POLIZZE
    .filter(p => p.sinistri.includes(tipoSinistro))
    .map(p => {
      const capitaleConsigliato = Math.min(p.capitale_max || gap, Math.max(p.capitale_min, gap));
      const ratioCapitale = p.capitale_max > 0 ? (capitaleConsigliato / 100000) : 1;
      const premioMensile = Math.round(p.premio_mensile_base * Math.max(1, ratioCapitale * 0.4));
      return { ...p, capitale_consigliato: capitaleConsigliato, premio_mensile_stimato: premioMensile };
    })
    .sort((a, b) => a.premio_mensile_stimato - b.premio_mensile_stimato);
}

export const TIPO_COLORI = {
  vita: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  invalidita: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  malattia_grave: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  ltc: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  multi: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
};
