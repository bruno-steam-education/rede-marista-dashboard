import { useState, useMemo, useEffect } from 'react';
import {
  Home, TrendingUp, Zap, Building2, Users, HandHelping,
  FileText, Download, Info, Calendar, SlidersHorizontal,
  Bell, Clock, MapPin, CheckCircle, AlertCircle, School,
  Menu, X, ChevronRight, ArrowUpRight, Filter
} from 'lucide-react';

/* DATA IMPORT */
import { schools, actionDistribution, monthly, TOTAL, fetchSheetData, loadLocalCache } from './dataStore';
import { motion } from 'framer-motion';
const fmtPct = (v) => Math.round((v / TOTAL) * 100);
const fmtH = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function DonutChart({ data, size = 150 }) {
  const total = data.reduce((s, a) => s + a.count, 0) || 1;
  let cum = 0;
  const r = 42, cx = 50, cy = 50;
  const slices = data.filter(a => a.count > 0).map(a => {
    const start = cum / total;
    cum += a.count;
    const end = cum / total;
    return { ...a, start, end };
  });

  function arc(s, e) {
    const sa = s * Math.PI * 2 - Math.PI / 2;
    const ea = e * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
    const lg = (e - s) > 0.5 ? 1 : 0;
    return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${lg} 1 ${x2},${y2} Z`;
  }

  return (
    <div className="donut-section">
      <svg viewBox="0 0 100 100" width={size} height={size} className="donut-svg">
        {slices.map(s => <path key={s.label} d={arc(s.start, s.end)} fill={s.color} />)}
        <circle cx={cx} cy={cy} r={24} fill="white" />
      </svg>
      <div className="donut-legend">
        {data.map(a => (
          <div key={a.label} className="legend-item">
            <span className="legend-dot" style={{ background: a.color }} />
            <span className="legend-label">{a.label}</span>
            <span className="legend-pct">{fmtPct(a.count)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }) {
  const maxVal = data.length ? Math.max(...data.map(m => Math.max(m.remote, m.presencial))) + 5 : 10;
  const rounded = Math.ceil(maxVal / 10) * 10;
  const w = 460, h = 210, p = { t: 20, r: 20, b: 30, l: 38 };
  const cw = w - p.l - p.r, ch = h - p.t - p.b;
  const x = (i) => p.l + (i / (data.length - 1)) * cw;
  const y = (v) => p.t + ch - (v / rounded) * ch;
  const line = (key) => data.map((m, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(m[key])}`).join(' ');
  const gridLines = Array.from({ length: rounded / 10 + 1 }, (_, i) => i * 10);

  return (
    <div className="line-chart-wrap">
      <div className="chart-legend-row">
        <span className="chart-legend-item"><i style={{ background: '#007EC3' }} /> Remoto</span>
        <span className="chart-legend-item"><i style={{ background: '#82BC00' }} /> Presencial</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="line-chart-svg">
        {gridLines.map(v => (
          <g key={v}>
            <line x1={p.l} y1={y(v)} x2={w - p.r} y2={y(v)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={p.l - 8} y={y(v) + 4} textAnchor="end" fill="#9ca3af" fontSize="11">{v}</text>
          </g>
        ))}
        <path d={line('remote')} fill="none" stroke="#007EC3" strokeWidth="2.5" strokeLinejoin="round" />
        <path d={line('presencial')} fill="none" stroke="#82BC00" strokeWidth="2.5" strokeLinejoin="round" />
        {data.map((m, i) => (
          <g key={m.month}>
            {m.remote > 0 && <>
              <circle cx={x(i)} cy={y(m.remote)} r="5" fill="#007EC3" stroke="white" strokeWidth="2" />
              <text x={x(i)} y={y(m.remote) - 10} textAnchor="middle" fill="#007EC3" fontSize="11" fontWeight="700">{m.remote}</text>
            </>}
            <circle cx={x(i)} cy={y(m.presencial)} r="5" fill="#82BC00" stroke="white" strokeWidth="2" />
            <text x={x(i)} y={y(m.presencial) + (m.presencial > m.remote ? -10 : 18)} textAnchor="middle" fill="#82BC00" fontSize="11" fontWeight="700">{m.presencial}</text>
            <text x={x(i)} y={h - 6} textAnchor="middle" fill="#6b7280" fontSize="12">{m.month}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function HorizontalBars({ data, max }) {
  return (
    <div className="h-bars">
      {data.map(u => (
        <div key={u.name} className="h-bar-row">
          <span className="h-bar-label">{u.name}</span>
          <div className="h-bar-track">
            <div className="h-bar-fill" style={{ width: `${(u.visits / max) * 100}%`, background: u.color || '#007EC3' }} />
          </div>
          <span className="h-bar-value">{u.visits}</span>
        </div>
      ))}
      <div className="h-bar-axis">
        {Array.from({ length: Math.ceil(max / 10) + 1 }, (_, i) => <span key={i}>{i * 10}</span>)}
      </div>
    </div>
  );
}

function SouthBrazilMap({ schoolsByState }) {
  const stateColors = {
    RS: schoolsByState.RS > 30 ? '#EA5B0C' : schoolsByState.RS > 10 ? '#FFD500' : '#82BC00',
    PR: schoolsByState.PR > 30 ? '#EA5B0C' : schoolsByState.PR > 10 ? '#FFD500' : '#82BC00',
    SP: schoolsByState.SP > 30 ? '#EA5B0C' : schoolsByState.SP > 10 ? '#FFD500' : '#82BC00',
    MG: schoolsByState.MG > 30 ? '#EA5B0C' : schoolsByState.MG > 10 ? '#FFD500' : '#82BC00',
  };

  return (
    <div className="mini-map">
      <div className="map-container">
        {/* Map Image */}
        <img 
          src="./mapa-sul.png" 
          alt="Mapa do Sul do Brasil" 
          className="map-image"
        />
        
        {/* State Indicators overlaid absolutely */}
        {/* Rio Grande do Sul (RS) */}
        <div className="map-dot-wrapper" style={{ bottom: '25px', left: '65px' }}>
          <span className="map-pulsing-dot" style={{ color: stateColors.RS, background: stateColors.RS }} />
          <span className="map-state-label">RS</span>
          <span className="map-state-count">{schoolsByState.RS} atend.</span>
        </div>

        {/* Paraná (PR) */}
        <div className="map-dot-wrapper" style={{ top: '125px', right: '35px' }}>
          <span className="map-pulsing-dot" style={{ color: stateColors.PR, background: stateColors.PR }} />
          <span className="map-state-label">PR</span>
          <span className="map-state-count">{schoolsByState.PR} atend.</span>
        </div>

        {/* São Paulo (SP) */}
        <div className="map-dot-wrapper" style={{ top: '50px', right: '15px' }}>
          <span className="map-pulsing-dot" style={{ color: stateColors.SP, background: stateColors.SP }} />
          <span className="map-state-label">SP</span>
          <span className="map-state-count">{schoolsByState.SP} atend.</span>
        </div>

        {/* Minas Gerais (MG) */}
        <div className="map-dot-wrapper" style={{ top: '15px', left: '35px' }}>
          <span className="map-pulsing-dot" style={{ color: stateColors.MG, background: stateColors.MG }} />
          <span className="map-state-label">MG</span>
          <span className="map-state-count">{schoolsByState.MG} atend.</span>
        </div>
      </div>
      <div className="map-legend">
        <div><span className="map-dot" style={{ background: '#d1d5db' }} /> 0</div>
        <div><span className="map-dot" style={{ background: '#82BC00' }} /> 1-10</div>
        <div><span className="map-dot" style={{ background: '#FFD500' }} /> 11-30</div>
        <div><span className="map-dot" style={{ background: '#EA5B0C' }} /> 31-60</div>
      </div>
    </div>
  );
}

function SchoolDetailCard({ school, onNavigate }) {
  if (!school) return <div className="school-detail-card"><p>Nenhuma escola selecionada ou dados indisponíveis.</p></div>;
  return (
    <div className="school-detail-card">
      <div className="sd-header">
        <div className="sd-icon"><School size={28} strokeWidth={1.5} /></div>
        <div className="sd-info">
          <h3>{school.name}</h3>
          <div className="sd-stats">
            <span><Calendar size={14} /> <b>{school.visits}</b> Atendimentos</span>
            <span><Clock size={14} /> <b>{fmtH(school.hours)}h</b> Horas</span>
            <span><MapPin size={14} /> <b>{school.state}</b> Estado</span>
          </div>
        </div>
      </div>
      <p className="sd-segments"><b>Segmentos:</b> {school.segments.join(' | ')}</p>
      <p className="sd-responsible">
        <b>Responsável:</b>{' '}
        <span 
          className="link-text" 
          onClick={() => onNavigate('participants')} 
          style={{ cursor: 'pointer' }}
        >
          {school.responsible}
        </span>
      </p>
      <div className="sd-actions-title">PRINCIPAIS AÇÕES</div>
      <div className="sd-actions-tags">
        {school.actions.filter(a => a.count > 0).slice(0, 4).map(a => (
          <span key={a.label} className="sd-tag">{a.label} ({a.count})</span>
        ))}
        {school.actions.filter(a => a.count > 0).length > 4 && (
          <span className="sd-tag sd-tag-more">+{school.actions.filter(a => a.count > 0).length - 4}</span>
        )}
      </div>
    </div>
  );
}

function ModalityCircle({ pct, count, label, color }) {
  const circ = 97.4;
  return (
    <div className="modality-item">
      <div className="mod-circle">
        <svg viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} transform="rotate(-90 18 18)" />
        </svg>
        <span>{pct}%</span>
      </div>
      <div className="mod-label">{label}<br /><b>{count}</b></div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE VIEWS
   ═══════════════════════════════════════════════════════════════ */

function OverviewPage({ totals, selectedSchool, setSelectedSchool, schoolsByState, onNavigate }) {
  const topUnits = schools.slice(0, 5).map((s, i) => ({
    name: s.name, visits: s.visits,
    color: ['#007EC3', '#82BC00', '#007EC3', '#EA5B0C', '#EA5B0C'][i]
  }));
  const othersVisits = TOTAL - topUnits.reduce((s, u) => s + u.visits, 0);
  const barData = [...topUnits, { name: 'Outros', visits: othersVisits, color: '#6B7280' }];

  return (
    <>
      <section className="kpi-row">
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon"><Users size={24} /></div>
          <div className="kpi-value">{totals.visits}</div>
          <div className="kpi-label">ATENDIMENTOS REALIZADOS</div>
        </div>
        <div className="kpi-card kpi-yellow">
          <div className="kpi-icon"><Clock size={24} /></div>
          <div className="kpi-value">{fmtH(totals.hours)}h</div>
          <div className="kpi-label">HORAS DE ATENDIMENTO</div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-icon"><Building2 size={24} /></div>
          <div className="kpi-value">{totals.units}</div>
          <div className="kpi-label">UNIDADES ATENDIDAS</div>
        </div>
        <div className="kpi-card kpi-orange">
          <div className="kpi-icon"><Users size={24} /></div>
          <div className="kpi-value">{totals.participants}</div>
          <div className="kpi-label">PARTICIPANTES IMPACTADOS</div>
        </div>
        <div className="kpi-card kpi-modality">
          <div className="kpi-modality-title">REMOTO VS PRESENCIAL</div>
          <div className="modality-row">
            <ModalityCircle pct={totals.visits ? Math.round((totals.remote/totals.visits)*100) : 0} count={totals.remote} label="Remotos" color="#007EC3" />
            <ModalityCircle pct={totals.visits ? Math.round((totals.presencial/totals.visits)*100) : 0} count={totals.presencial} label="Presenciais" color="#EA5B0C" />
          </div>
        </div>
      </section>

      <section className="grid-row-3">
        <div className="card">
          <h2 className="card-title">DISTRIBUIÇÃO POR TIPO DE AÇÃO</h2>
          <DonutChart data={actionDistribution} />
        </div>
        <div className="card">
          <h2 className="card-title">EVOLUÇÃO MENSAL DE ATENDIMENTOS</h2>
          <LineChart data={monthly} />
        </div>
        <div className="card">
          <div className="card-title-row">
            <h2 className="card-title">DESTAQUE DA UNIDADE</h2>
            <button className="ver-todas" onClick={() => onNavigate('units')}>Ver todas</button>
          </div>
          <SchoolDetailCard school={selectedSchool} onNavigate={onNavigate} />
          <div className="highlights-section">
            <div className="highlight-box highlight-green">
              <div className="highlight-icon"><CheckCircle size={20} /></div>
              <div><strong>DESTAQUES</strong><p>{selectedSchool?.highlight}</p></div>
            </div>
            <div className="highlight-box highlight-red">
              <div className="highlight-icon"><AlertCircle size={20} /></div>
              <div><strong>PONTOS DE ATENÇÃO</strong><p>{selectedSchool?.attention}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid-row-bottom">
        <div className="card card-top3">
          <h2 className="card-title">TOP 3 AÇÕES</h2>
          <div className="top3-list">
            {actionDistribution.slice(0, 3).map((a, i) => (
              <div className="top3-item" key={a.label}>
                <span className={`top3-rank r${i + 1}`}>{i + 1}</span>
                <div><strong>{a.label}</strong><span className="top3-pct">{fmtPct(a.count)}% dos atendimentos</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="card-title">ATENDIMENTOS POR UNIDADE (TOP 6)</h2>
          <HorizontalBars data={barData} max={60} />
        </div>
        <div className="card">
          <h2 className="card-title">MAPA DE UNIDADES</h2>
          <SouthBrazilMap schoolsByState={schoolsByState} />
        </div>
      </section>
    </>
  );
}

function EvolutionPage() {
  const cumulative = monthly.reduce((acc, m, i) => {
    const prev = i > 0 ? acc[i - 1] : { remote: 0, presencial: 0 };
    acc.push({ month: m.month, remote: prev.remote + m.remote, presencial: prev.presencial + m.presencial });
    return acc;
  }, []);

  return (
    <>
      <h2 className="page-section-title">Evolução Mensal</h2>
      <div className="grid-row-2">
        <div className="card">
          <h2 className="card-title">ATENDIMENTOS POR MÊS</h2>
          <LineChart data={monthly} />
        </div>
        <div className="card">
          <h2 className="card-title">ACUMULADO</h2>
          <LineChart data={cumulative} />
        </div>
      </div>
      <div className="card mt-16">
        <h2 className="card-title">DETALHAMENTO MENSAL</h2>
        <table className="data-table">
          <thead>
            <tr><th>Mês</th><th>Remoto</th><th>Presencial</th><th>Total</th><th>% Remoto</th></tr>
          </thead>
          <tbody>
            {monthly.map(m => {
              const t = m.remote + m.presencial;
              return (
                <tr key={m.month}>
                  <td><b>{m.month}</b></td><td>{m.remote}</td><td>{m.presencial}</td>
                  <td><b>{t}</b></td><td>{t > 0 ? Math.round(m.remote / t * 100) : 0}%</td>
                </tr>
              );
            })}
            <tr className="table-total">
              <td><b>Total</b></td><td><b>102</b></td><td><b>62</b></td><td><b>164</b></td><td><b>62%</b></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function ActionsPage() {
  return (
    <>
      <h2 className="page-section-title">Distribuição por Tipo de Ação</h2>
      <div className="grid-row-2">
        <div className="card">
          <h2 className="card-title">GRÁFICO DE DISTRIBUIÇÃO</h2>
          <DonutChart data={actionDistribution} size={200} />
        </div>
        <div className="card">
          <h2 className="card-title">RANKING DE AÇÕES</h2>
          <div className="action-ranking">
            {actionDistribution.map((a, i) => (
              <div key={a.label} className="action-rank-row">
                <span className="action-rank-num">{i + 1}</span>
                <span className="action-rank-label">{a.label}</span>
                <div className="action-rank-bar-wrap">
                  <div className="action-rank-bar" style={{ width: `${(a.count / 44) * 100}%`, background: a.color }} />
                </div>
                <span className="action-rank-count">{a.count}</span>
                <span className="action-rank-pct">{fmtPct(a.count)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function UnitsPage({ onSelect, schoolsList, onOpenModal }) {
  return (
    <>
      <h2 className="page-section-title">Todas as Unidades</h2>
      <div className="units-grid">
        {schoolsList.map(s => (
          <button key={s.id} className="unit-card" onClick={() => onOpenModal(s)}>
            <div className="unit-card-header">
              <div className="unit-card-icon"><School size={20} /></div>
              <span className="unit-card-state">{s.state}</span>
            </div>
            <h3>{s.name}</h3>
            <div className="unit-card-stats">
              <span><b>{s.visits}</b> atend.</span>
              <span><b>{fmtH(s.hours)}h</b></span>
              <span><b>{s.participants}</b> partic.</span>
            </div>
            <div className="unit-card-bar">
              <div style={{ width: `${(s.visits / 53) * 100}%`, background: s.visits > 15 ? '#007EC3' : s.visits > 5 ? '#82BC00' : '#EA5B0C' }} />
            </div>
            <p className="unit-card-highlight">{s.highlight}</p>
            <span className="unit-card-resp">{s.responsible}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function ParticipantsPage() {
  const byResp = {};
  schools.forEach(s => {
    if (!byResp[s.responsible]) byResp[s.responsible] = { schools: [], visits: 0, hours: 0 };
    byResp[s.responsible].schools.push(s.name);
    byResp[s.responsible].visits += s.visits;
    byResp[s.responsible].hours += s.hours;
  });

  return (
    <>
      <h2 className="page-section-title">Participantes e Responsáveis</h2>
      <div className="kpi-row kpi-row-small">
        <div className="kpi-card kpi-blue"><div className="kpi-icon"><Users size={20} /></div><div className="kpi-value">69</div><div className="kpi-label">PARTICIPANTES</div></div>
        <div className="kpi-card kpi-green"><div className="kpi-icon"><Users size={20} /></div><div className="kpi-value">{Object.keys(byResp).length}</div><div className="kpi-label">RESPONSÁVEIS</div></div>
        <div className="kpi-card kpi-orange"><div className="kpi-icon"><Building2 size={20} /></div><div className="kpi-value">12</div><div className="kpi-label">ESCOLAS</div></div>
        <div className="kpi-card kpi-yellow"><div className="kpi-icon"><MapPin size={20} /></div><div className="kpi-value">4</div><div className="kpi-label">ESTADOS</div></div>
      </div>
      <div className="card mt-16">
        <h2 className="card-title">RESPONSÁVEIS POR ESCOLA</h2>
        <table className="data-table">
          <thead><tr><th>Responsável</th><th>Escolas</th><th>Atendimentos</th><th>Horas</th></tr></thead>
          <tbody>
            {Object.entries(byResp).sort((a, b) => b[1].visits - a[1].visits).map(([name, d]) => (
              <tr key={name}>
                <td><b>{name}</b></td>
                <td>{d.schools.join(', ')}</td>
                <td>{d.visits}</td>
                <td>{fmtH(d.hours)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AttendancePage({ schoolsList }) {
  const dynamicTotals = useMemo(() => {
    let visits = 0, hours = 0, remote = 0, presencial = 0, participants = 0;
    const states = new Set();
    schoolsList.forEach(s => {
      visits += s.visits;
      hours += s.hours;
      remote += s.remote;
      presencial += s.presencial;
      participants += s.participants;
      states.add(s.state);
    });
    return { visits, hours, remote, presencial, participants, statesCount: states.size };
  }, [schoolsList]);

  return (
    <>
      <h2 className="page-section-title">Atendimentos por Escola</h2>
      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>Escola</th><th>Estado</th><th>Atend.</th><th>Horas</th><th>Remoto</th><th>Presenc.</th><th>Partic.</th><th>Responsável</th></tr>
          </thead>
          <tbody>
            {schoolsList.map(s => (
              <tr key={s.id}>
                <td><b>{s.name}</b></td><td>{s.state}</td><td>{s.visits}</td>
                <td>{fmtH(s.hours)}h</td><td>{s.remote}</td><td>{s.presencial}</td>
                <td>{s.participants}</td><td>{s.responsible}</td>
              </tr>
            ))}
            <tr className="table-total">
              <td><b>Total</b></td><td>{dynamicTotals.statesCount} est.</td><td><b>{dynamicTotals.visits}</b></td><td><b>{fmtH(dynamicTotals.hours)}h</b></td>
              <td><b>{dynamicTotals.remote}</b></td><td><b>{dynamicTotals.presencial}</b></td><td><b>{dynamicTotals.participants}</b></td><td>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function ReportsPage({ onNavigate }) {
  const cards = [
    { title: 'Visão Geral', desc: 'KPIs, gráficos e indicadores consolidados', page: 'overview', icon: Home },
    { title: 'Evolução Mensal', desc: 'Tendência de atendimentos mês a mês', page: 'evolution', icon: TrendingUp },
    { title: 'Ações', desc: 'Distribuição por tipo de ação pedagógica', page: 'actions', icon: Zap },
    { title: 'Unidades', desc: 'Detalhes de cada escola da rede', page: 'units', icon: Building2 },
  ];

  return (
    <>
      <h2 className="page-section-title">Relatórios</h2>
      <div className="reports-grid">
        {cards.map(c => (
          <button key={c.page} className="report-card" onClick={() => onNavigate(c.page)}>
            <c.icon size={28} />
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <span className="report-arrow"><ChevronRight size={16} /></span>
          </button>
        ))}
      </div>
    </>
  );
}

function ExportPage() {
  const handleExport = (type) => {
    const headers = ['Escola', 'Estado', 'Atendimentos', 'Horas', 'Remoto', 'Presencial', 'Participantes', 'Responsável'];
    const rows = schools.map(s => [s.name, s.state, s.visits, fmtH(s.hours), s.remote, s.presencial, s.participants, s.responsible]);
    if (type === 'csv') {
      const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'rede-esi-dados.csv'; a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      <h2 className="page-section-title">Exportar Dados</h2>
      <div className="export-grid">
        <button className="export-card" onClick={() => handleExport('csv')}>
          <Download size={32} />
          <h3>Exportar CSV</h3>
          <p>Planilha com dados de todas as escolas</p>
        </button>
        <button className="export-card" onClick={() => window.print()}>
          <FileText size={32} />
          <h3>Imprimir / PDF</h3>
          <p>Gerar versão para impressão do dashboard</p>
        </button>
      </div>
    </>
  );
}
function SchoolModal({ school, onClose, onNavigateToOverview }) {
  if (!school) return null;

  // Find max action count for the horizontal bar chart
  const maxActionCount = Math.max(...school.actions.map(a => a.count), 1);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="modal-header">
          <div className="modal-icon">
            <School size={32} />
          </div>
          <div>
            <h2>{school.name}</h2>
            <p className="modal-subtitle">{school.fullName}</p>
          </div>
        </div>

        <div className="modal-grid">
          <div className="modal-info-col">
            <div className="modal-meta-row">
              <span className="modal-meta-item">
                <MapPin size={16} /> <b>Estado:</b> {school.state}
              </span>
              <span className="modal-meta-item">
                <Users size={16} /> <b>Participantes:</b> {school.participants}
              </span>
            </div>
            
            <div className="modal-stats-box">
              <div className="modal-stat">
                <span className="modal-stat-val">{school.visits}</span>
                <span className="modal-stat-lbl">ATENDIMENTOS</span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-val">{fmtH(school.hours)}h</span>
                <span className="modal-stat-lbl">HORAS TOTAIS</span>
              </div>
            </div>

            <p className="modal-text"><b>Responsável:</b> {school.responsible}</p>
            <p className="modal-text"><b>Segmentos:</b> {school.segments.join(', ')}</p>

            <div className="modal-highlights">
              <div className="m-h-box m-h-green">
                <b>Destaque:</b>
                <p>{school.highlight}</p>
              </div>
              <div className="m-h-box m-h-red">
                <b>Atenção:</b>
                <p>{school.attention}</p>
              </div>
            </div>
          </div>

          <div className="modal-chart-col">
            <h3>DISTRIBUIÇÃO DE AÇÕES</h3>
            <div className="modal-mini-chart">
              {school.actions.filter(a => a.count > 0).map(a => (
                <div key={a.label} className="modal-chart-row">
                  <span className="modal-chart-label" title={a.label}>{a.label}</span>
                  <div className="modal-chart-bar-wrap">
                    <div 
                      className="modal-chart-bar" 
                      style={{ 
                        width: `${(a.count / maxActionCount) * 100}%`,
                        background: '#007EC3'
                      }} 
                    />
                  </div>
                  <span className="modal-chart-value">{a.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Fechar</button>
          <button className="btn-primary" onClick={() => { onNavigateToOverview(school); onClose(); }}>
            Ver Detalhes Completos <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function UpdateProgressModal({ isOpen, step, progress, message }) {
  if (!isOpen) return null;
  return (
    <div className="update-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="update-modal-content" style={{
          background: 'white', padding: '30px', borderRadius: '12px',
          width: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: 20 }}>
          <img src="./logo 30 anos colorido zoom.png" alt="ZOOM" width="80" />
        </motion.div>
        <h3 style={{ color: '#007EC3', marginBottom: 15, fontSize: '1.2rem' }}>{message}</h3>
        
        <div style={{ background: '#e5e7eb', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '10px' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            style={{ background: '#82BC00', height: '100%' }}
          />
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 'bold' }}>{Math.round(progress)}%</p>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */

export default function App() {
  const [dataKey, setDataKey] = useState(0);
  const [updateState, setUpdateState] = useState({ isOpen: false, step: 0, progress: 0, message: '' });
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('Janeiro a Junho / 2026');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [selectedSchoolModal, setSelectedSchoolModal] = useState(null);

  const triggerUpdate = async () => {
    if (updateState.isOpen) return;
    
    setUpdateState({ isOpen: true, step: 1, progress: 10, message: 'Verificando se há atualizações...' });
    
    // Simulate initial progress
    let prog = 10;
    const interval = setInterval(() => {
      prog += 5;
      if (prog <= 40) setUpdateState(s => ({ ...s, progress: prog }));
    }, 200);

    try {
      const res = await fetchSheetData();
      clearInterval(interval);
      
      setUpdateState(s => ({ ...s, step: 2, progress: 50, message: 'Comparando dados...' }));
      
      await new Promise(r => setTimeout(r, 800));

      if (res.hasChanges) {
        setUpdateState({ isOpen: true, step: 3, progress: 70, message: 'Novas alterações encontradas!' });
      } else {
        setUpdateState({ isOpen: true, step: 3, progress: 70, message: 'Nenhuma alteração. Base já atualizada.' });
      }
      
      await new Promise(r => setTimeout(r, 1000));
      
      setUpdateState(s => ({ ...s, step: 4, progress: 90, message: 'Aplicando no Dashboard...' }));
      
      await new Promise(r => setTimeout(r, 800));
      
      setDataKey(prev => prev + 1);
      if (!selectedSchool && schools.length > 0) setSelectedSchool(schools[0]);
      
      setUpdateState(s => ({ ...s, progress: 100, message: 'Concluído!' }));
      await new Promise(r => setTimeout(r, 500));

    } catch (e) {
      clearInterval(interval);
      console.error(e);
      setUpdateState(s => ({ ...s, message: 'Erro ao buscar dados.' }));
      await new Promise(r => setTimeout(r, 2000));
    }
    
    setUpdateState({ isOpen: false, step: 0, progress: 0, message: '' });
  };

  useEffect(() => {
    // Tenta carregar do cache instantaneamente
    const hasCache = loadLocalCache();
    if (hasCache) {
      setDataKey(prev => prev + 1);
      setSelectedSchool(schools[0] || null);
    } else {
      // Se não tiver cache, força o update visual na primeira vez
      triggerUpdate();
    }
    
    window.refreshDashboardData = triggerUpdate;
    window.triggerUpdate = triggerUpdate;
  }, []);

  const toggleDateFilter = () => {
    const options = ['Janeiro a Junho / 2026', 'Todo o Período / 2026', 'Últimos 30 Dias'];
    const idx = options.indexOf(dateFilter);
    const nextIdx = (idx + 1) % options.length;
    setDateFilter(options[nextIdx]);
  };

  const toggleStateFilter = () => {
    const states = ['ALL', 'RS', 'SP', 'PR', 'MG'];
    const idx = states.indexOf(stateFilter);
    const nextIdx = (idx + 1) % states.length;
    setStateFilter(states[nextIdx]);
  };

  const filteredSchools = useMemo(() => {
    if (stateFilter === 'ALL') return schools;
    return schools.filter(s => s.state === stateFilter);
  }, [stateFilter, dataKey]);

  const totals = useMemo(() => {
    let visits = 0, hours = 0, remote = 0, presencial = 0, participants = 0;
    schools.forEach(s => {
      visits += s.visits;
      hours += s.hours;
      remote += s.remote;
      presencial += s.presencial;
      participants += s.participants;
    });
    return { visits, hours, units: schools.length, participants, remote, presencial };
  }, [dataKey]);

  const schoolsByState = useMemo(() => {
    const map = { RS: 0, PR: 0, SP: 0, MG: 0 };
    schools.forEach(s => { map[s.state] = (map[s.state] || 0) + s.visits; });
    return map;
  }, [dataKey]);

  const navigate = (p) => { setPage(p); setSidebarOpen(false); window.scrollTo(0, 0); };

  const selectSchoolAndNavigate = (s) => { setSelectedSchool(s); navigate('overview'); };

  const pageTitle = sidebarItems.find(i => i.page === page)?.label || 'Visão Geral';

  return (
    <div className="layout">
      <UpdateProgressModal {...updateState} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" onClick={() => navigate('overview')} style={{ cursor: 'pointer' }}>
          <img src="./logo 30 anos colorido zoom.png" alt="ZOOM Education for Life" className="sidebar-logo-img" />
        </div>
        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <button key={item.page} className={`sidebar-item ${page === item.page ? 'active' : ''}`} onClick={() => navigate(item.page)}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="sidebar-item sidebar-bottom-item" onClick={() => alert('Dashboard Rede ESI — Dados do Sistema de Atendimento ZOOM Education for Life.\n\nFonte: Planilha de atendimentos Jan-Jun 2026.\nÚltima atualização: 23/06/2026 11:30.')}>
          <Info size={20} />
          <span>Sobre os dados</span>
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="topbar-right">
            <button className="topbar-btn date-btn" onClick={toggleDateFilter} title="Clique para alterar o período de dados"><Calendar size={16} /><span>{dateFilter}</span></button>
            <button className="topbar-btn filter-btn" onClick={toggleStateFilter} title="Clique para filtrar por estado"><SlidersHorizontal size={16} /><span>Filtros: {stateFilter === 'ALL' ? 'Todos' : stateFilter}</span></button>
            <button className="topbar-icon-btn notif-btn" onClick={() => alert('Você tem 2 novas notificações de atendimentos pendentes.')}><Bell size={18} /><span className="notif-badge">2</span></button>
            <div className="avatar" onClick={() => navigate('participants')} style={{ cursor: 'pointer' }} title="Perfil de Usuário (Cláudio Amorim)">CA</div>
          </div>
        </header>

        <section className="page-title-section">
          <div className="title-deco">
            <i className="deco-circle deco-green" />
            <i className="deco-circle deco-orange" />
            <i className="deco-circle deco-blue" />
          </div>
          <h1 className="page-title">REDE ESI</h1>
          <p className="page-subtitle">Resultados de Atendimento 2026{page !== 'overview' ? ` — ${pageTitle}` : ''}</p>
        </section>

        {page === 'overview' && <OverviewPage totals={totals} selectedSchool={selectedSchool} setSelectedSchool={setSelectedSchool} schoolsByState={schoolsByState} onNavigate={navigate} />}
        {page === 'evolution' && <EvolutionPage />}
        {page === 'actions' && <ActionsPage />}
        {page === 'units' && (
          <UnitsPage 
            onSelect={selectSchoolAndNavigate} 
            schoolsList={filteredSchools} 
            onOpenModal={setSelectedSchoolModal}
          />
        )}
        {page === 'participants' && <ParticipantsPage />}
        {page === 'attendance' && <AttendancePage schoolsList={filteredSchools} />}
        {page === 'reports' && <ReportsPage onNavigate={navigate} />}
        {page === 'export' && <ExportPage />}

        <footer className="dashboard-footer">
          <span><Calendar size={14} /> Dados atualizados em 23/06/2026 11:30</span>
          <span className="footer-source">
            Fonte: Sistema de Atendimento ZOOM
            <img src="./logo 30 anos colorido zoom.png" alt="ZOOM" className="footer-logo-img" />
          </span>
        </footer>
      </main>

      {selectedSchoolModal && (
        <SchoolModal 
          school={selectedSchoolModal} 
          onClose={() => setSelectedSchoolModal(null)} 
          onNavigateToOverview={selectSchoolAndNavigate}
        />
      )}
    </div>
  );
}
