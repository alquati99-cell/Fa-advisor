import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ReferenceLine
} from 'recharts';
import { api } from '../utils/api';
import { formatEuro, TIPI_SINISTRO, TIPI_OBIETTIVO } from '../utils/format';
import { POLIZZE } from '../utils/polizze';

// ── helpers ──────────────────────────────────────────────────────────────────

const LIME = '#c6f135';
const RED  = '#ff4545';
const CY   = new Date().getFullYear();

function buildProiezione(risparmi, reddito, gap, annoEvento) {
  let con   = risparmi;
  let senza = risparmi;
  const save = reddito * 0.15;
  return Array.from({ length: 31 }, (_, i) => {
    const anno = CY + i;
    if (anno === annoEvento) senza -= gap;
    const pt = { anno, con: Math.round(con), senza: Math.round(senza) };
    con   = (con   + save) * 1.03;
    senza = Math.max(-999999, (senza + save) * 1.03);
    return pt;
  });
}

function buildRadar(attive) {
  const hasType = (...t) => attive.some(p => t.includes(p.tipo));
  return [
    { axis: 'VITA',      val: hasType('vita','multi')        ? 80 : 10 },
    { axis: 'INVALIDIT.', val: hasType('invalidita','multi') ? 75 : 10 },
    { axis: 'SALUTE',    val: hasType('malattia_grave')      ? 70 : 10 },
    { axis: 'LTC',       val: hasType('ltc')                 ? 80 : 10 },
    { axis: 'CASA',      val: 10 },
    { axis: 'RC',        val: 10 },
  ];
}

const SCENARI = [
  { key: 'morte',              label: 'Premorienza capofamiglia', icon: '×' },
  { key: 'invalidita_totale',  label: 'Invalidità permanente',    icon: '◉' },
  { key: 'malattia_grave',     label: 'Malattia grave',           icon: '+' },
  { key: 'invalidita_parziale',label: 'Infortunio grave',         icon: '△' },
  { key: 'non_autosufficienza',label: 'Non autosufficienza',      icon: '§' },
];

// ── subcomponents ─────────────────────────────────────────────────────────────

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange?.(!on); }}
      style={{ background: on ? LIME : '#2a2a2a' }}
      className="relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200"
        style={{ left: on ? '18px' : '2px' }}
      />
    </button>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="card-sm">
      <div className="label mb-1">{label}</div>
      <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

// ── TAB: Simulazione ─────────────────────────────────────────────────────────

function TabSimulazione({ cliente, risultato, calcolo, polizzeAttive, setPolizzeAttive }) {
  const annoEvento = CY + 6;
  const proiezione = buildProiezione(
    cliente.risparmi || 0,
    cliente.reddito_annuo || 0,
    risultato.gap_assicurativo,
    annoEvento
  );
  const radarData = buildRadar(polizzeAttive);
  const premioAnnuo = polizzeAttive.reduce((s, p) => s + (p.premio_mensile_base || 0) * 12, 0);

  const conFine  = proiezione[proiezione.length - 1]?.con  ?? 0;
  const senzaFine= proiezione[proiezione.length - 1]?.senza?? 0;
  const delta    = conFine - senzaFine;

  return (
    <div className="flex gap-4 h-full">
      {/* ── Left sidebar ── */}
      <div className="w-56 flex-shrink-0 space-y-3">
        {/* Client card */}
        <div className="card-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: LIME, color: '#0a0a0a' }}>
              {(cliente.nome?.[0] || '')}{(cliente.cognome?.[0] || '')}
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text)' }}>
                {cliente.nome} {cliente.cognome}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
                {cliente.eta} anni · {cliente.professione || 'Cliente'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <StatBox label="Reddito"  value={`€ ${Math.round((cliente.reddito_annuo||0)/1000)}k`} />
            <StatBox label="Capitale" value={`€ ${Math.round((cliente.risparmi||0)/1000)}k`} />
            <StatBox label="Debiti"   value={`€ ${Math.round((cliente.debiti_totali||0)/1000)}k`} />
            <StatBox label="Familiari" value={`${cliente.familiari_a_carico || 0}`} />
          </div>
        </div>

        {/* Obiettivi */}
        {cliente.obiettivi?.length > 0 && (
          <div className="card-sm">
            <div className="label mb-2">Obiettivi</div>
            <div className="space-y-2">
              {cliente.obiettivi.map(o => (
                <div key={o.id} className="text-[12px]">
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text)' }}>{TIPI_OBIETTIVO[o.tipo] || o.tipo}</span>
                    <span style={{ color: 'var(--text3)' }}>{o.anno_target}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span style={{ color: 'var(--text3)' }}>€ {Math.round(o.importo_target/1000)}k target</span>
                    <span className="badge-red">0%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Chart */}
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="label mb-1">Proiezione Patrimonio · 30 anni</div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-2xl font-bold" style={{ color: conFine >= 0 ? LIME : RED }}>
                    € {conFine >= 0 ? '+' : ''}{Math.round(conFine/1000)}k
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: LIME }} />
                    <span className="text-[11px]" style={{ color: 'var(--text3)' }}>con piano assicurativo</span>
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold" style={{ color: senzaFine >= 0 ? 'var(--text2)' : RED }}>
                    € {senzaFine >= 0 ? '+' : ''}{Math.round(senzaFine/1000)}k
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full inline-block border" style={{ borderColor: RED }} />
                    <span className="text-[11px]" style={{ color: 'var(--text3)' }}>senza protezione</span>
                  </div>
                </div>
                {delta !== 0 && (
                  <div className="ml-2 px-3 py-1 rounded-lg text-sm font-bold" style={{ background: 'var(--lime-dim)', color: LIME }}>
                    Δ +€ {Math.round(delta/1000)}k
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black" style={{ color: risultato.indice_protezione >= 70 ? LIME : risultato.indice_protezione >= 40 ? '#f59e0b' : RED }}>
                {risultato.indice_protezione}%
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>PROTEZIONE</div>
            </div>
          </div>

          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={proiezione} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                <defs>
                  <linearGradient id="gCon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={LIME} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={LIME} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gSenza" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={RED} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={RED} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="anno" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${Math.round(v/1000)}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => [formatEuro(v), n === 'con' ? 'Con piano' : 'Senza protezione']}
                />
                <ReferenceLine x={annoEvento} stroke={RED} strokeDasharray="4 2" strokeWidth={1} />
                <Area type="monotone" dataKey="con"   stroke={LIME} fill="url(#gCon)"   strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="senza" stroke={RED}  fill="url(#gSenza)" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="label">TIMELINE — TRASCINA L'EVENTO</div>
            <div className="flex-1 relative">
              <div className="h-0.5 w-full rounded" style={{ background: 'var(--bg3)' }} />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: '30%' }}>
                <div className="text-[10px] font-bold mb-1" style={{ color: RED }}>× {annoEvento}</div>
                <div className="w-4 h-4 rounded-full border-2 cursor-grab" style={{ borderColor: RED, background: 'var(--bg)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Polizze nel piano */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="label mb-0.5">Polizze nel piano</div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Composizione del piano · {polizzeAttive.length} polizze
              </div>
            </div>
            <div className="text-right">
              <div className="label mb-0.5">Premio annuo</div>
              <div className="text-xl font-black" style={{ color: LIME }}>€ {premioAnnuo.toLocaleString('it-IT')}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {POLIZZE.slice(0, 6).map(p => {
              const on = polizzeAttive.some(a => a.id === p.id);
              return (
                <div key={p.id} className="card-sm flex items-start gap-3" style={{ background: on ? 'rgba(198,241,53,0.05)' : 'var(--bg2)', borderColor: on ? 'rgba(198,241,53,0.2)' : 'var(--border)' }}>
                  <Toggle on={on} onChange={v => setPolizzeAttive(prev => v ? [...prev, p] : prev.filter(a => a.id !== p.id))} />
                  <div className="min-w-0">
                    <div className="text-[11px]" style={{ color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.tipo}</div>
                    <div className="text-xs font-semibold leading-tight mt-0.5" style={{ color: 'var(--text)' }}>{p.nome}</div>
                    <div className="text-[11px] mt-1" style={{ color: on ? LIME : 'var(--text3)' }}>€ {(p.premio_mensile_base * 12).toLocaleString('it-IT')}/anno</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-64 flex-shrink-0 space-y-3">
        {/* Scenario attivo */}
        <div className="card-sm">
          <div className="label mb-2">Scenario Attivo</div>
          <div className="mb-2 p-2 rounded-lg" style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,69,69,0.2)' }}>
            <div className="flex items-center gap-2">
              <span style={{ color: RED }}>×</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {SCENARI.find(s => s.key === risultato.tipo_sinistro)?.label || risultato.tipo_sinistro}
              </span>
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
              Gap: {formatEuro(risultato.gap_assicurativo)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="label mb-0">Anno evento</div>
              <span className="badge-red">{annoEvento}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            {SCENARI.filter(s => s.key !== risultato.tipo_sinistro).map(s => (
              <Link key={s.key} to={`/calcolatore?tipo=${s.key}&cliente=${risultato.cliente?.id}`}
                className="flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors hover:bg-white/5">
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--text3)' }}>{s.icon}</span>
                  <span style={{ color: 'var(--text2)' }}>{s.label}</span>
                </div>
                <span style={{ color: 'var(--text3)' }}>{CY + 7 + SCENARI.indexOf(s)}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Radar rischio */}
        <div className="card-sm">
          <div className="label mb-2">Mappa Rischio</div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border2)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text3)', fontSize: 9 }} />
                <Radar dataKey="val" stroke={LIME} fill={LIME} fillOpacity={0.2} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>
            Il radar mostra le aree di esposizione. <span style={{ color: LIME }}>Aree piene = coperte.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── TAB: Polizze ─────────────────────────────────────────────────────────────

const CATEGORIE = ['Tutte', 'vita', 'invalidita', 'malattia_grave', 'ltc', 'multi'];
const CAT_LABEL = { vita: 'Vita', invalidita: 'Salute', malattia_grave: 'Malattia', ltc: 'LTC', multi: 'Multi' };

function TabPolizze({ polizzeAttive, setPolizzeAttive, tipoSinistro }) {
  const [cat, setCat] = useState('Tutte');
  const filtered = cat === 'Tutte' ? POLIZZE : POLIZZE.filter(p => p.tipo === cat);
  const premioTotale = polizzeAttive.reduce((s, p) => s + p.premio_mensile_base * 12, 0);
  const isConsigliata = p => p.sinistri.includes(tipoSinistro);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label mb-0.5">Catalogo Polizze</div>
          <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            {POLIZZE.length} prodotti, <span style={{ color: LIME }}>{polizzeAttive.length} attivi</span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
            Le polizze evidenziate sono consigliate in base al profilo del cliente.
          </div>
        </div>
        <div className="text-right">
          <div className="label mb-0.5">Premio annuo totale</div>
          <div className="text-2xl font-black" style={{ color: LIME }}>€ {premioTotale.toLocaleString('it-IT')}</div>
          <div className="text-xs" style={{ color: 'var(--text3)' }}>≈ €{Math.round(premioTotale/12)}/mese</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {CATEGORIE.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={{
              background: cat === c ? LIME : 'var(--bg3)',
              color: cat === c ? '#0a0a0a' : 'var(--text2)',
              border: '1px solid ' + (cat === c ? LIME : 'var(--border)')
            }}>
            {c === 'Tutte' ? 'Tutte' : CAT_LABEL[c] || c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filtered.map(p => {
          const on = polizzeAttive.some(a => a.id === p.id);
          const consigliata = isConsigliata(p);
          return (
            <div key={p.id} className="card-sm relative" style={{ borderColor: on ? 'rgba(198,241,53,0.3)' : consigliata ? 'rgba(198,241,53,0.12)' : 'var(--border)', background: on ? 'rgba(198,241,53,0.05)' : 'var(--bg2)' }}>
              {consigliata && <div className="absolute top-2 right-2 badge-lime">+ AI</div>}
              <div className="label mb-1">{CAT_LABEL[p.tipo] || p.tipo}</div>
              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{p.nome}</div>
              <div className="text-[11px] mb-3" style={{ color: 'var(--text3)' }}>{p.descrizione}</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="label mb-0">Premio</div>
                  <div className="text-sm font-bold" style={{ color: on ? LIME : 'var(--text)' }}>
                    € {(p.premio_mensile_base * 12).toLocaleString('it-IT')}/anno
                  </div>
                </div>
                <button
                  onClick={() => setPolizzeAttive(prev => on ? prev.filter(a => a.id !== p.id) : [...prev, p])}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{ background: on ? LIME : 'var(--bg3)', color: on ? '#0a0a0a' : 'var(--text2)', border: '1px solid ' + (on ? LIME : 'var(--border)') }}>
                  {on ? '✓ Attiva' : '+ Aggiungi'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── TAB: Confronto ────────────────────────────────────────────────────────────

function TabConfronto({ polizzeAttive, setPolizzeAttive, tipoSinistro, risultato }) {
  const consigliate = POLIZZE.filter(p => p.sinistri.includes(tipoSinistro)).slice(0, 5);
  const plans = [
    { nome: 'Essenziale', desc: 'Solo le polizze obbligatorie e le tutele base', polizze: [], color: 'var(--text3)' },
    { nome: 'Consigliato', desc: `Mix calibrato sul profilo del cliente`, polizze: consigliate, color: LIME, ai: true },
    { nome: 'Completo', desc: 'Copertura totale per chi vuole massima serenità', polizze: POLIZZE.filter(p => p.sinistri.includes(tipoSinistro) || p.tipo === 'multi'), color: 'var(--blue)' },
  ];
  const premioAttivo = polizzeAttive.reduce((s, p) => s + p.premio_mensile_base * 12, 0);

  return (
    <div>
      <div className="mb-6">
        <div className="label mb-1">Confronta Piani</div>
        <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Tre livelli di protezione, scegli quello giusto</div>
        <div className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
          Confronto su 30 anni · scenario {TIPI_SINISTRO[tipoSinistro]} · gap {formatEuro(risultato.gap_assicurativo)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {plans.map(plan => {
          const premio = plan.polizze.reduce((s, p) => s + p.premio_mensile_base * 12, 0);
          const isCurrent = polizzeAttive.length === plan.polizze.length &&
            plan.polizze.every(p => polizzeAttive.some(a => a.id === p.id));

          return (
            <div key={plan.nome} className="card relative"
              style={{ borderColor: isCurrent ? plan.color : 'var(--border)', background: isCurrent ? `rgba(0,0,0,0.3)` : 'var(--bg2)' }}>
              {plan.ai && <div className="absolute top-4 right-4 badge-lime">+ AI</div>}
              <div className="label mb-1">Piano</div>
              <div className="text-2xl font-black mb-1" style={{ color: plan.color }}>{plan.nome}</div>
              <div className="text-xs mb-5" style={{ color: 'var(--text3)' }}>{plan.desc}</div>
              <div className="label mb-1">Premio annuo</div>
              <div className="text-3xl font-black mb-1" style={{ color: plan.color }}>
                € {premio.toLocaleString('it-IT')}
              </div>
              <div className="text-xs mb-5" style={{ color: 'var(--text3)' }}>
                ≈ € {Math.round(premio / 12)}/mese
              </div>
              <div className="space-y-2 mb-6">
                {POLIZZE.filter(p => p.sinistri.includes(tipoSinistro) || p.tipo === 'multi').map(p => {
                  const included = plan.polizze.some(pp => pp.id === p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-2 text-xs" style={{ color: included ? 'var(--text)' : 'var(--text3)' }}>
                      <span style={{ color: included ? LIME : 'var(--border2)' }}>{included ? '✓' : '○'}</span>
                      {p.nome}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setPolizzeAttive(plan.polizze)}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: isCurrent ? plan.color : 'transparent',
                  color: isCurrent ? '#0a0a0a' : 'var(--text)',
                  border: '1px solid ' + (isCurrent ? plan.color : 'var(--border2)')
                }}>
                {isCurrent ? '✓ Piano attivo' : 'Scegli questo piano'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="card-sm flex items-center justify-between" style={{ borderColor: 'var(--border2)' }}>
        <div>
          <div className="label mb-0.5">Piano attualmente selezionato</div>
          <div className="text-sm" style={{ color: 'var(--text)' }}>
            {polizzeAttive.length} polizze · €{premioAttivo.toLocaleString('it-IT')}/anno ·
            Indice protezione <span style={{ color: LIME }}>{risultato.indice_protezione}/100</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <div className="label mb-0">Senza protezione</div>
            <div className="font-bold" style={{ color: RED }}>€ {Math.round(-risultato.gap_assicurativo/1000)*1000 < 0 ? '−' : ''}{formatEuro(Math.abs(risultato.gap_assicurativo))}</div>
          </div>
          <span style={{ color: 'var(--text3)' }}>→</span>
          <div className="text-right">
            <div className="label mb-0">Con piano</div>
            <div className="font-bold" style={{ color: LIME }}>
              {polizzeAttive.length > 0 ? formatEuro(0) : formatEuro(-risultato.gap_assicurativo)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TAB: Documenti ────────────────────────────────────────────────────────────

function TabDocumenti() {
  return (
    <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--text3)' }}>
      <div className="text-4xl mb-3">📄</div>
      <div className="text-sm">Funzione in arrivo — export PDF e report cliente</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS = ['Simulazione', 'Polizze', 'Confronto', 'Documenti'];

export default function Simulazione() {
  const { id } = useParams();
  const [tab, setTab] = useState('Simulazione');
  const [calcolo, setCalcolo] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [polizzeAttive, setPolizzeAttive] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const c = await api.getCalcolo(id);
      const r = c.risultati;
      setCalcolo(c);
      const cl = await api.getCliente(r.cliente.id);
      setCliente(cl);
      // Pre-select recommended policies
      const rec = POLIZZE.filter(p => p.sinistri.includes(r.tipo_sinistro)).slice(0, 3);
      setPolizzeAttive(rec);
    })().finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-sm" style={{ color: 'var(--text3)' }}>
      Caricamento analisi...
    </div>
  );
  if (!calcolo || !cliente) return (
    <div className="flex items-center justify-center h-screen text-sm" style={{ color: RED }}>
      Analisi non trovata
    </div>
  );

  const r = calcolo.risultati;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 border-b flex-shrink-0" style={{ background: 'var(--bg1)', borderColor: 'var(--border)', minHeight: 52 }}>
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center font-black text-xs" style={{ background: LIME, color: '#0a0a0a' }}>A</div>
            <span className="text-sm" style={{ color: 'var(--text3)' }}>
              <span style={{ color: 'var(--text)' }}>{cliente.nome} {cliente.cognome}</span> · simulatore
            </span>
          </Link>
          <div className="flex gap-1 border-b -mb-px" style={{ borderColor: 'transparent' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`tab px-4 ${tab === t ? 'tab-active' : ''}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text3)' }}>BOZZA · Salvata</span>
          <button className="btn-ghost-sm">Condividi</button>
          <button className="btn-lime">↓ Esporta PDF</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'Simulazione' && (
          <TabSimulazione
            cliente={cliente}
            risultato={r}
            calcolo={calcolo}
            polizzeAttive={polizzeAttive}
            setPolizzeAttive={setPolizzeAttive}
          />
        )}
        {tab === 'Polizze' && (
          <TabPolizze
            polizzeAttive={polizzeAttive}
            setPolizzeAttive={setPolizzeAttive}
            tipoSinistro={r.tipo_sinistro}
          />
        )}
        {tab === 'Confronto' && (
          <TabConfronto
            polizzeAttive={polizzeAttive}
            setPolizzeAttive={setPolizzeAttive}
            tipoSinistro={r.tipo_sinistro}
            risultato={r}
          />
        )}
        {tab === 'Documenti' && <TabDocumenti />}
      </div>
    </div>
  );
}
