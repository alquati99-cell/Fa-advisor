const TASSO_ATTUALIZZAZIONE = 0.03;
const COSTI_FUNERARI = 8500;
const COSTO_ASSISTENZA_MENSILE = 3000;
const COSTO_ADATTAMENTO_CASA_INVALIDITA = 20000;
const COSTO_ADATTAMENTO_CASA_NA = 35000;

const COSTI_MALATTIA_GRAVE = {
  cancro: 55000, infarto: 40000, ictus: 65000,
  insufficienza_renale: 50000, trapianto: 80000, generico: 48000
};

function pvRendita(importoAnnuo, anni, tasso = TASSO_ATTUALIZZAZIONE) {
  if (anni <= 0) return 0;
  if (tasso === 0) return importoAnnuo * anni;
  return importoAnnuo * (1 - Math.pow(1 + tasso, -anni)) / tasso;
}

function anniAlObiettivo(annoTarget) {
  return Math.max(0, annoTarget - new Date().getFullYear());
}

export function calcolaImpatto(cliente, obiettivi, sinistro) {
  const anniPensione = Math.max(0, cliente.eta_pensione - cliente.eta);
  const coperturaEsistente = (cliente.risparmi || 0) + (cliente.assicurazione_esistente || 0);

  let bisogni = {};
  let obiettiviImpattati = [];
  let totaleBisogno = 0;

  switch (sinistro.tipo_sinistro) {
    case 'morte': {
      const capitaleUmano = pvRendita(cliente.reddito_annuo, anniPensione);
      const costiImmediati = COSTI_FUNERARI + (cliente.debiti_totali || 0);
      obiettiviImpattati = obiettivi.map(obj => {
        const anni = anniAlObiettivo(obj.anno_target);
        const contributoAnnuo = anni > 0 ? obj.importo_target / anni : obj.importo_target;
        const valoreAttuale = pvRendita(contributoAnnuo, anni);
        const gap = Math.max(0, obj.importo_target - valoreAttuale);
        return { ...obj, anni_mancanti: anni, valore_attuale_contributi: Math.round(valoreAttuale), gap: Math.round(gap), impatto_percentuale: anni > 0 ? Math.round((gap / obj.importo_target) * 100) : 100 };
      });
      const totaleObiettivi = obiettiviImpattati.reduce((s, o) => s + o.gap, 0);
      bisogni = { capitale_umano: Math.round(capitaleUmano), costi_immediati: Math.round(costiImmediati), totale_obiettivi: Math.round(totaleObiettivi), dettaglio: { costi_funerari: COSTI_FUNERARI, debiti: cliente.debiti_totali || 0, anni_reddito_perso: anniPensione } };
      totaleBisogno = capitaleUmano + costiImmediati + totaleObiettivi;
      break;
    }
    case 'invalidita_totale': {
      const redditoPersoPV = pvRendita(cliente.reddito_annuo, anniPensione);
      const costoAssistenzaPV = pvRendita(COSTO_ASSISTENZA_MENSILE * 12, anniPensione);
      obiettiviImpattati = obiettivi.map(obj => ({ ...obj, anni_mancanti: anniAlObiettivo(obj.anno_target), valore_attuale_contributi: 0, gap: obj.importo_target, impatto_percentuale: 100 }));
      const totaleObiettivi = obiettivi.reduce((s, o) => s + o.importo_target, 0);
      bisogni = { reddito_perso: Math.round(redditoPersoPV), costi_assistenza: Math.round(costoAssistenzaPV), adattamento_abitazione: COSTO_ADATTAMENTO_CASA_INVALIDITA, totale_obiettivi: Math.round(totaleObiettivi), dettaglio: { costo_assistenza_mensile: COSTO_ASSISTENZA_MENSILE, anni_assistenza: anniPensione } };
      totaleBisogno = redditoPersoPV + costoAssistenzaPV + COSTO_ADATTAMENTO_CASA_INVALIDITA + totaleObiettivi;
      break;
    }
    case 'invalidita_parziale': {
      const pct = (sinistro.percentuale_invalidita || 50) / 100;
      const redditoPersoPV = pvRendita(cliente.reddito_annuo * pct, anniPensione);
      obiettiviImpattati = obiettivi.map(obj => ({ ...obj, anni_mancanti: anniAlObiettivo(obj.anno_target), valore_attuale_contributi: Math.round(obj.importo_target * (1 - pct)), gap: Math.round(obj.importo_target * pct), impatto_percentuale: sinistro.percentuale_invalidita }));
      bisogni = { reddito_perso: Math.round(redditoPersoPV), totale_obiettivi: Math.round(obiettiviImpattati.reduce((s, o) => s + o.gap, 0)), dettaglio: { percentuale_invalidita: sinistro.percentuale_invalidita, reddito_perso_annuo: Math.round(cliente.reddito_annuo * pct), anni_impatto: anniPensione } };
      totaleBisogno = redditoPersoPV + obiettiviImpattati.reduce((s, o) => s + o.gap, 0);
      break;
    }
    case 'malattia_grave': {
      const costiMedici = COSTI_MALATTIA_GRAVE[sinistro.tipo_malattia || 'generico'];
      const mesi = sinistro.mesi_convalescenza || 12;
      const redditoPerso = (cliente.reddito_annuo / 12) * mesi;
      const impattoProp = redditoPerso / Math.max(1, obiettivi.length);
      obiettiviImpattati = obiettivi.map(obj => ({ ...obj, anni_mancanti: anniAlObiettivo(obj.anno_target), valore_attuale_contributi: Math.round(obj.importo_target - impattoProp), gap: Math.round(impattoProp), impatto_percentuale: Math.min(100, Math.round((impattoProp / obj.importo_target) * 100)) }));
      bisogni = { costi_medici: costiMedici, reddito_perso_convalescenza: Math.round(redditoPerso), costi_riabilitazione: 12000, dettaglio: { tipo_malattia: sinistro.tipo_malattia || 'generico', mesi_convalescenza: mesi, costo_mensile_perso: Math.round(cliente.reddito_annuo / 12) } };
      totaleBisogno = costiMedici + redditoPerso + 12000;
      break;
    }
    case 'non_autosufficienza': {
      const durata = sinistro.durata_non_autosufficienza || 7;
      const costoAttualizzato = pvRendita(COSTO_ASSISTENZA_MENSILE * 12, durata);
      obiettiviImpattati = obiettivi.map(obj => ({ ...obj, anni_mancanti: anniAlObiettivo(obj.anno_target), valore_attuale_contributi: 0, gap: obj.importo_target, impatto_percentuale: 100 }));
      const totaleObiettivi = obiettivi.reduce((s, o) => s + o.importo_target, 0);
      bisogni = { costo_assistenza: Math.round(costoAttualizzato), adattamento_abitazione: COSTO_ADATTAMENTO_CASA_NA, totale_obiettivi: Math.round(totaleObiettivi), dettaglio: { costo_mensile: COSTO_ASSISTENZA_MENSILE, durata_anni: durata, costo_annuo: COSTO_ASSISTENZA_MENSILE * 12 } };
      totaleBisogno = costoAttualizzato + COSTO_ADATTAMENTO_CASA_NA + totaleObiettivi;
      break;
    }
    default:
      throw new Error(`Tipo sinistro non supportato: ${sinistro.tipo_sinistro}`);
  }

  totaleBisogno = Math.round(totaleBisogno);
  const gap = Math.max(0, totaleBisogno - coperturaEsistente);
  const indiceProtezione = Math.min(100, Math.round((coperturaEsistente / Math.max(1, totaleBisogno)) * 100));

  return {
    tipo_sinistro: sinistro.tipo_sinistro,
    cliente: { id: cliente.id, nome: `${cliente.nome} ${cliente.cognome}`, eta: cliente.eta },
    anni_al_pensione: anniPensione,
    bisogni,
    obiettivi_impattati: obiettiviImpattati,
    totale_bisogno: totaleBisogno,
    copertura_esistente: Math.round(coperturaEsistente),
    gap_assicurativo: Math.round(gap),
    indice_protezione: indiceProtezione,
    raccomandazione: gap > 0
      ? `Copertura insufficiente: gap di €${gap.toLocaleString('it-IT')}. Raccomandato un piano assicurativo integrativo.`
      : `Copertura adeguata. Monitorare periodicamente al variare del reddito e degli obiettivi.`
  };
}
