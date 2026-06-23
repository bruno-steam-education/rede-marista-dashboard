import { useState } from 'react';
import {
  Home, TrendingUp, Zap, Building2, Users, HandHelping,
  FileText, Download, Info, Calendar, SlidersHorizontal,
  Bell, Clock, MapPin, CheckCircle, AlertCircle, School,
  Menu, X
} from 'lucide-react';

const schools = [
  {
    name: 'São Carlos (SVP)', visits: 53, hours: 43.8, state: 'RS',
    segments: 'Fund. I (1º-2º) | Fund. I (3º-5º) | Fund. II (6º-9º)',
    responsible: 'Cláudio Amorim',
    actions: [
      { label: 'Plantão de dúvidas', count: 23 },
      { label: 'Estudo de aulas', count: 6 },
      { label: 'Planejamento', count: 6 },
      { label: 'Devolutivas', count: 5 },
    ],
    highlight: 'Maior volume de atendimentos da rede. Professores seguros e engajados. Assessorias passaram de semanais para quinzenais.',
    attention: 'Tempo de aula de 45 min é insuficiente. Dificuldades com organização das maletas. Internet instável.',
  },
  {
    name: 'São José', visits: 22, hours: 21, state: 'RS',
    segments: 'Fund. I (1º-2º) | Fund. I (3º-5º)',
    responsible: 'Ana Conceição Sales',
    actions: [
      { label: 'Formação continuada', count: 6 },
      { label: 'Plantão de dúvidas', count: 5 },
      { label: 'Acompanhamento', count: 4 },
      { label: 'Planejamento', count: 3 },
    ],
    highlight: 'Alto engajamento dos alunos. Professora com domínio e organização. Cronograma em dia.',
    attention: 'Dificuldade com registros escritos nos anos iniciais. Gestão do tempo entre montagem e registro.',
  },
  {
    name: 'São Carlos (Caxias)', visits: 17, hours: 21, state: 'RS',
    segments: 'Fund. I (1º-2º) | Fund. I (3º-5º) | Fund. II (6º-9º)',
    responsible: 'Cláudio Amorim',
    actions: [
      { label: 'Planejamento', count: 4 },
      { label: 'Apropriação', count: 3 },
      { label: 'Plantão de dúvidas', count: 3 },
      { label: 'Devolutivas', count: 3 },
    ],
    highlight: 'Boa adaptação à metodologia. Alunos engajados. Professores testam atividades antes das aulas.',
    attention: 'Firmware dos HUBs depende de rede aberta. Tempo de 50 min limitado para algumas atividades.',
  },
  {
    name: 'Santa Teresa', visits: 16, hours: 22.2, state: 'RS',
    segments: 'Fund. I (1º-2º) | Fund. I (3º-5º) | Fund. II (6º-9º)',
    responsible: 'Rafael Zanetoni',
    actions: [
      { label: 'Eventos escolares', count: 8 },
      { label: 'Apropriação', count: 2 },
      { label: 'Estudo de aulas', count: 2 },
      { label: 'Planejamento', count: 2 },
    ],
    highlight: 'Forte presença em eventos. Feira confirmada para julho. Boa receptividade de novos professores.',
    attention: 'Necessidade de planejamento prévio para participação da ZOOM nos eventos.',
  },
  {
    name: 'Scalabriano S.J.', visits: 13, hours: 17.5, state: 'PR',
    segments: 'Fund. I (1º-2º) | Fund. I (3º-5º)',
    responsible: 'Cláudio Amorim',
    actions: [
      { label: 'Plantão de dúvidas', count: 3 },
      { label: 'Planejamento', count: 3 },
      { label: 'Diagnóstico', count: 2 },
      { label: 'Apropriação', count: 2 },
    ],
    highlight: 'Retorno extremamente positivo. Equipe preparada. Formação pedagógica bem avaliada.',
    attention: 'Tempo reduzido das aulas. Deslocamento das turmas. Necessidade de mais kits.',
  },
  {
    name: 'São Carlos Borromeo', visits: 10, hours: 17, state: 'RS',
    segments: 'Fund. I (1º-2º) | Fund. I (3º-5º) | Fund. II (6º-9º) | ZMaker Lab',
    responsible: 'Amanda Iansen / Roque Junior',
    actions: [
      { label: 'Plantão de dúvidas', count: 4 },
      { label: 'Planejamento de aulas', count: 4 },
      { label: 'Apropriação', count: 1 },
    ],
    highlight: 'Receptividade superou expectativas. Alto engajamento. Laboratório Maker implantado.',
    attention: 'Material com questões discursivas para alunos em alfabetização. Registro extenso impacta aula.',
  },
  {
    name: 'N.S. de Lourdes', visits: 10, hours: 19, state: 'RS',
    segments: 'Fund. I (1º-2º) | Fund. I (3º-5º) | Fund. II (6º-9º)',
    responsible: 'Cláudio Amorim',
    actions: [
      { label: 'Diagnóstico', count: 2 },
      { label: 'Devolutivas', count: 2 },
      { label: 'Apropriação', count: 2 },
      { label: 'Formação', count: 1 },
    ],
    highlight: '1º ano de implantação com abordagem inovadora. Alto engajamento e protagonismo estudantil.',
    attention: 'Tempo de aulas limitado (50 min). Escola deseja torneio interno de robótica para 2027.',
  },
  {
    name: 'Santa Teresinha', visits: 10, hours: 5, state: 'RS',
    segments: 'Fund. II (6º-9º)',
    responsible: 'Cláudio Amorim',
    actions: [
      { label: 'Plantão de dúvidas', count: 3 },
      { label: 'Diagnóstico', count: 2 },
      { label: 'Formação', count: 1 },
      { label: 'Planejamento', count: 1 },
    ],
    highlight: 'Interesse em formações continuadas. Calendário alinhado com ações conjuntas.',
    attention: 'Professora com dificuldades na gestão de turma e organização. Necessita apoio reforçado.',
  },
  {
    name: 'N.S. Auxiliadora', visits: 4, hours: 4, state: 'RS',
    segments: 'Fund. II (6º-9º)',
    responsible: 'Cláudio Amorim',
    actions: [
      { label: 'Plantão de dúvidas', count: 2 },
      { label: 'Planejamento de aulas', count: 1 },
      { label: 'Planejamento', count: 1 },
    ],
    highlight: 'Plataforma considerada intuitiva. Oficinas Maker sugeridas. OBR como oportunidade.',
    attention: 'Apenas 45 min semanais. Divisão de conteúdo entre montagem e programação necessária.',
  },
  {
    name: 'Padre José Marchetti', visits: 3, hours: 7, state: 'SP',
    segments: 'Fund. I (1º-2º) | Fund. I (3º-5º)',
    responsible: 'Ana Conceição Sales',
    actions: [{ label: 'Planejamento', count: 3 }],
    highlight: 'Avanços pedagógicos percebidos. Feira planejada.',
    attention: 'Tempo reduzido. 5º ano não consegue concluir montagens no tempo disponível.',
  },
  {
    name: 'Scalabrini', visits: 3, hours: 6, state: 'RS',
    segments: 'Geral',
    responsible: 'Cláudio Amorim',
    actions: [
      { label: 'Diagnóstico', count: 2 },
      { label: 'Planejamento', count: 1 },
    ],
    highlight: 'Fase de consolidação em 2026. Educação tecnológica como diferencial competitivo.',
    attention: 'Início de implantação — requer acompanhamento próximo para fortalecimento em 2027.',
  },
  {
    name: 'N.S. de Belém', visits: 3, hours: 3, state: 'RS',
    segments: 'Fund. II (6º-9º)',
    responsible: 'Cláudio Amorim',
    actions: [
      { label: 'Planejamento', count: 1 },
      { label: 'Planejamento de aulas', count: 1 },
      { label: 'Devolutiva', count: 1 },
    ],
    highlight: 'Feira interna com famílias em julho. Estação de Marketing ZOOM. Uso expandido do Z-Maker.',
    attention: 'Gestão do tempo em aulas de 45 min. Login único e organização prévia dos kits.',
  },
];

const actionDistribution = [
  { label: 'Plantão de dúvidas', pct: 27, color: '#005B96' },
  { label: 'Planejamento', pct: 13, color: '#82BC00' },
  { label: 'Devolutivas e Relat.', pct: 12, color: '#EDAA00' },
  { label: 'Planej. de aulas', pct: 8, color: '#007EC3' },
  { label: 'Diagnóstico', pct: 7, color: '#EA5B0C' },
  { label: 'Apropriação', pct: 6, color: '#00A676' },
  { label: 'Formação continuada', pct: 5, color: '#6B8E23' },
  { label: 'Estudo de aulas', pct: 5, color: '#4682B4' },
  { label: 'Eventos escolares', pct: 4, color: '#B8860B' },
  { label: 'Acompanhamento', pct: 3, color: '#9370DB' },
  { label: 'Planej. ações pedag.', pct: 0, color: '#CD853F' },
];

const monthly = [
  { month: 'Jan', remote: 18, presencial: 7 },
  { month: 'Fev', remote: 24, presencial: 9 },
  { month: 'Mar', remote: 35, presencial: 12 },
  { month: 'Abr', remote: 28, presencial: 16 },
  { month: 'Mai', remote: 31, presencial: 18 },
];

const topUnits = [
  { name: 'São Carlos (SVP)', visits: 53, color: '#007EC3' },
  { name: 'São José', visits: 22, color: '#82BC00' },
  { name: 'São Carlos (Caxias)', visits: 17, color: '#007EC3' },
  { name: 'Santa Teresa', visits: 16, color: '#EA5B0C' },
  { name: 'Scalabriano S.J.', visits: 13, color: '#EA5B0C' },
];

const sidebarItems = [
  { icon: Home, label: 'Visão Geral', active: true },
  { icon: TrendingUp, label: 'Evolução' },
  { icon: Zap, label: 'Ações' },
  { icon: Building2, label: 'Unidades' },
  { icon: Users, label: 'Participantes' },
  { icon: HandHelping, label: 'Atendimentos' },
  { icon: FileText, label: 'Relatórios' },
  { icon: Download, label: 'Exportar' },
];

function DonutChart() {
  const total = actionDistribution.reduce((s, a) => s + a.pct, 0);
  let cumulative = 0;
  const slices = actionDistribution.filter(a => a.pct > 0).map(a => {
    const start = cumulative;
    cumulative += a.pct;
    return { ...a, start, end: cumulative };
  });
  const r = 80, cx = 100, cy = 100;

  function arcPath(startPct, endPct) {
    const s = (startPct / total) * 360 - 90;
    const e = (endPct / total) * 360 - 90;
    const sr = (s * Math.PI) / 180;
    const er = (e * Math.PI) / 180;
    const x1 = cx + r * Math.cos(sr), y1 = cy + r * Math.sin(sr);
    const x2 = cx + r * Math.cos(er), y2 = cy + r * Math.sin(er);
    const large = (endPct - startPct) / total > 0.5 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  }

  return (
    <div className="donut-section">
      <svg viewBox="0 0 200 200" className="donut-svg">
        {slices.map(s => (
          <path key={s.label} d={arcPath(s.start, s.end)} fill={s.color} />
        ))}
        <circle cx={cx} cy={cy} r={48} fill="white" />
      </svg>
      <div className="donut-legend">
        {actionDistribution.map(a => (
          <div key={a.label} className="legend-item">
            <span className="legend-dot" style={{ background: a.color }} />
            <span className="legend-label">{a.label}</span>
            <span className="legend-pct">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart() {
  const maxVal = 60;
  const w = 440, h = 200, pad = { top: 20, right: 20, bottom: 30, left: 35 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  function x(i) { return pad.left + (i / (monthly.length - 1)) * chartW; }
  function y(v) { return pad.top + chartH - (v / maxVal) * chartH; }

  const remotePath = monthly.map((m, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(m.remote)}`).join(' ');
  const presPath = monthly.map((m, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(m.presencial)}`).join(' ');

  const gridLines = [0, 10, 20, 30, 40, 50, 60];

  return (
    <div className="line-chart-wrap">
      <div className="chart-legend-row">
        <span className="chart-legend-item"><i style={{ background: '#007EC3' }} /> Remoto</span>
        <span className="chart-legend-item"><i style={{ background: '#82BC00' }} /> Presencial</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="line-chart-svg">
        {gridLines.map(v => (
          <g key={v}>
            <line x1={pad.left} y1={y(v)} x2={w - pad.right} y2={y(v)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={pad.left - 8} y={y(v) + 4} textAnchor="end" fill="#9ca3af" fontSize="11">{v}</text>
          </g>
        ))}
        <path d={remotePath} fill="none" stroke="#007EC3" strokeWidth="2.5" strokeLinejoin="round" />
        <path d={presPath} fill="none" stroke="#82BC00" strokeWidth="2.5" strokeLinejoin="round" />
        {monthly.map((m, i) => (
          <g key={m.month}>
            <circle cx={x(i)} cy={y(m.remote)} r="5" fill="#007EC3" stroke="white" strokeWidth="2" />
            <text x={x(i)} y={y(m.remote) - 12} textAnchor="middle" fill="#007EC3" fontSize="12" fontWeight="700">{m.remote}</text>
            <circle cx={x(i)} cy={y(m.presencial)} r="5" fill="#82BC00" stroke="white" strokeWidth="2" />
            <text x={x(i)} y={y(m.presencial) + 20} textAnchor="middle" fill="#82BC00" fontSize="12" fontWeight="700">{m.presencial}</text>
            <text x={x(i)} y={h - 6} textAnchor="middle" fill="#6b7280" fontSize="12">{m.month}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function HorizontalBars() {
  const max = 60;
  const othersVisits = 164 - topUnits.reduce((s, u) => s + u.visits, 0);
  const allUnits = [...topUnits, { name: 'Outros', visits: othersVisits, color: '#6B7280' }];

  return (
    <div className="h-bars">
      {allUnits.map(u => (
        <div key={u.name} className="h-bar-row">
          <span className="h-bar-label">{u.name}</span>
          <div className="h-bar-track">
            <div className="h-bar-fill" style={{ width: `${(u.visits / max) * 100}%`, background: u.color }} />
          </div>
          <span className="h-bar-value">{u.visits}</span>
        </div>
      ))}
      <div className="h-bar-axis">
        {[0, 10, 20, 30, 40, 50, 60].map(v => <span key={v}>{v}</span>)}
      </div>
    </div>
  );
}

function MiniMap() {
  return (
    <div className="mini-map">
      <svg viewBox="0 0 200 280" className="map-svg">
        <path d="M80 30 C90 20, 140 15, 155 25 C170 35, 175 55, 170 75 C165 95, 140 100, 130 95 C120 90, 100 85, 85 80 C70 75, 60 55, 80 30Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
        <circle cx="130" cy="50" r="8" fill="#FFD500" />
        <text x="140" y="45" fill="#374151" fontSize="13" fontWeight="700">SP</text>

        <path d="M55 95 C65 85, 110 80, 135 90 C160 100, 170 120, 165 140 C160 160, 130 165, 110 160 C90 155, 50 140, 45 120 C40 100, 55 95, 55 95Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
        <circle cx="100" cy="125" r="8" fill="#82BC00" />
        <text x="110" y="120" fill="#374151" fontSize="13" fontWeight="700">PR</text>

        <path d="M30 165 C40 155, 100 150, 130 160 C160 170, 175 200, 165 230 C155 260, 110 275, 80 270 C50 265, 20 240, 15 210 C10 180, 30 165, 30 165Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
        <circle cx="90" cy="210" r="10" fill="#EA5B0C" />
        <text x="102" y="205" fill="#374151" fontSize="13" fontWeight="700">RS</text>
      </svg>
      <div className="map-legend">
        <div><span className="map-dot" style={{ background: '#d1d5db' }} /> 0</div>
        <div><span className="map-dot" style={{ background: '#82BC00' }} /> 1 - 10</div>
        <div><span className="map-dot" style={{ background: '#FFD500' }} /> 11 - 30</div>
        <div><span className="map-dot" style={{ background: '#EA5B0C' }} /> 31 - 60</div>
      </div>
    </div>
  );
}

function SchoolDetail({ school }) {
  return (
    <div className="school-detail-card">
      <div className="sd-header">
        <div className="sd-icon"><School size={32} strokeWidth={1.5} /></div>
        <div className="sd-info">
          <h3>{school.name}</h3>
          <div className="sd-stats">
            <span><Calendar size={14} /> <b>{school.visits}</b> Atendimentos</span>
            <span><Clock size={14} /> <b>{school.hours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h</b> Horas</span>
            <span><MapPin size={14} /> <b>{school.state}</b> Estado</span>
          </div>
        </div>
      </div>
      <p className="sd-segments"><b>Segmentos:</b> {school.segments}</p>
      <p className="sd-responsible"><b>Responsável:</b> <a href="#">{school.responsible}</a></p>
      <div className="sd-actions-title">PRINCIPAIS AÇÕES</div>
      <div className="sd-actions-tags">
        {school.actions.slice(0, 4).map(a => (
          <span key={a.label} className="sd-tag">{a.label} ({a.count})</span>
        ))}
        {school.actions.length > 4 && <span className="sd-tag sd-tag-more">+{school.actions.length - 4}</span>}
      </div>
    </div>
  );
}

export default function App() {
  const [selectedSchool, setSelectedSchool] = useState(schools[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="zoom-logo">
            <span className="zl-z">Z</span><span className="zl-o1">O</span><span className="zl-o2">O</span><span className="zl-m">M</span>
          </div>
          <small className="zoom-tagline">education for life</small>
        </div>
        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <a key={item.label} href="#" className={`sidebar-item ${item.active ? 'active' : ''}`}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <a href="#" className="sidebar-item sidebar-bottom-item">
          <Info size={20} />
          <span>Sobre os dados</span>
        </a>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="topbar-right">
            <button className="topbar-btn date-btn">
              <Calendar size={16} />
              <span>Janeiro a Maio / 2026</span>
            </button>
            <button className="topbar-btn filter-btn">
              <SlidersHorizontal size={16} />
              <span>Filtros</span>
            </button>
            <button className="topbar-icon-btn notif-btn">
              <Bell size={18} />
              <span className="notif-badge">2</span>
            </button>
            <div className="avatar">CA</div>
          </div>
        </header>

        <section className="page-title-section">
          <div className="title-deco">
            <i className="deco-circle deco-green" />
            <i className="deco-circle deco-orange" />
            <i className="deco-circle deco-blue" />
          </div>
          <h1 className="page-title">REDE ESI</h1>
          <p className="page-subtitle">Resultados de Atendimento 2026</p>
        </section>

        <section className="kpi-row">
          <div className="kpi-card kpi-blue">
            <div className="kpi-icon"><Users size={24} /></div>
            <div className="kpi-value">164</div>
            <div className="kpi-label">ATENDIMENTOS REALIZADOS</div>
          </div>
          <div className="kpi-card kpi-yellow">
            <div className="kpi-icon"><Clock size={24} /></div>
            <div className="kpi-value">186,5h</div>
            <div className="kpi-label">HORAS DE ATENDIMENTO</div>
          </div>
          <div className="kpi-card kpi-green">
            <div className="kpi-icon"><Building2 size={24} /></div>
            <div className="kpi-value">12</div>
            <div className="kpi-label">UNIDADES ATENDIDAS</div>
          </div>
          <div className="kpi-card kpi-orange">
            <div className="kpi-icon"><Users size={24} /></div>
            <div className="kpi-value">69</div>
            <div className="kpi-label">PARTICIPANTES IMPACTADOS</div>
          </div>
          <div className="kpi-card kpi-modality">
            <div className="kpi-modality-title">REMOTO VS PRESENCIAL</div>
            <div className="modality-row">
              <div className="modality-item mod-remote">
                <div className="mod-circle">
                  <svg viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#007EC3" strokeWidth="3"
                      strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.62)} transform="rotate(-90 18 18)" />
                  </svg>
                  <span>62%</span>
                </div>
                <div className="mod-label">Remotos<br /><b>102</b></div>
              </div>
              <div className="modality-item mod-presencial">
                <div className="mod-circle">
                  <svg viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EA5B0C" strokeWidth="3"
                      strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.38)} transform="rotate(-90 18 18)" />
                  </svg>
                  <span>38%</span>
                </div>
                <div className="mod-label">Presenciais<br /><b>62</b></div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid-row-3">
          <div className="card">
            <h2 className="card-title">DISTRIBUIÇÃO POR TIPO DE AÇÃO</h2>
            <DonutChart />
          </div>
          <div className="card">
            <h2 className="card-title">EVOLUÇÃO MENSAL DE ATENDIMENTOS</h2>
            <LineChart />
          </div>
          <div className="card">
            <div className="card-title-row">
              <h2 className="card-title">DESTAQUE DA UNIDADE</h2>
              <a href="#" className="ver-todas">Ver todas</a>
            </div>
            <SchoolDetail school={selectedSchool} />
            <div className="highlights-section">
              <div className="highlight-box highlight-green">
                <div className="highlight-icon"><CheckCircle size={20} /></div>
                <div>
                  <strong>DESTAQUES</strong>
                  <p>{selectedSchool.highlight}</p>
                </div>
              </div>
              <div className="highlight-box highlight-red">
                <div className="highlight-icon"><AlertCircle size={20} /></div>
                <div>
                  <strong>PONTOS DE ATENÇÃO</strong>
                  <p>{selectedSchool.attention}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid-row-bottom">
          <div className="card card-top3">
            <h2 className="card-title">TOP 3 AÇÕES</h2>
            <div className="top3-list">
              <div className="top3-item">
                <span className="top3-rank r1">1</span>
                <div>
                  <strong>Plantão de dúvidas</strong>
                  <span className="top3-pct">27% dos atendimentos</span>
                </div>
              </div>
              <div className="top3-item">
                <span className="top3-rank r2">2</span>
                <div>
                  <strong>Planejamento</strong>
                  <span className="top3-pct">13% dos atendimentos</span>
                </div>
              </div>
              <div className="top3-item">
                <span className="top3-rank r3">3</span>
                <div>
                  <strong>Devolutivas e Relatórios</strong>
                  <span className="top3-pct">12% dos atendimentos</span>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <h2 className="card-title">ATENDIMENTOS POR UNIDADE (TOP 6)</h2>
            <HorizontalBars />
          </div>
          <div className="card">
            <h2 className="card-title">MAPA DE UNIDADES</h2>
            <MiniMap />
          </div>
        </section>

        <footer className="dashboard-footer">
          <span><Calendar size={14} /> Dados atualizados em 23/06/2026 11:30</span>
          <span className="footer-source">
            Fonte: Sistema de Atendimento ZOOM
            <span className="footer-zoom">
              <b className="fz-z">Z</b><b className="fz-o1">O</b><b className="fz-o2">O</b><b className="fz-m">M</b>
            </span>
          </span>
        </footer>
      </main>
    </div>
  );
}
