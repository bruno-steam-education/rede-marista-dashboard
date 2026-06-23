import Papa from 'papaparse';

export let schools = [];
export let actionDistribution = [];
export let monthly = [];
export let TOTAL = 0;

const COLORS = ['#005B96', '#82BC00', '#007EC3', '#EA5B0C', '#EDAA00', '#00A676', '#4682B4', '#B8860B', '#9370DB', '#6B8E23', '#2F4F4F', '#DC143C'];

export const fetchSheetData = () => {
  return new Promise((resolve, reject) => {
    Papa.parse('https://docs.google.com/spreadsheets/d/1_upLb6WdHxg39MNvCyAeJ-H6ZLfvBqYpW_8qvpX1wDQ/gviz/tq?tqx=out:csv', {
      download: true,
      header: true,
      complete: (results) => {
        try {
          processData(results.data);
          resolve();
        } catch (e) {
          reject(e);
        }
      },
      error: (err) => reject(err)
    });
  });
};

const cleanAction = (acao) => {
  if (!acao) return 'Outros';
  let clean = acao.replace(/^[0-9.]+\s*/, '').trim();
  if (clean.toLowerCase().includes('plantão')) return 'Plantão de dúvidas';
  if (clean.toLowerCase().includes('planejamento de aula')) return 'Planejamento de aulas';
  if (clean.toLowerCase().includes('planejamento')) return 'Planejamento';
  if (clean.toLowerCase().includes('diagnóstico')) return 'Diagnóstico';
  if (clean.toLowerCase().includes('devolutiva')) return 'Devolutivas';
  if (clean.toLowerCase().includes('formação')) return 'Formação continuada';
  if (clean.toLowerCase().includes('estudo')) return 'Estudo de aulas';
  if (clean.toLowerCase().includes('evento')) return 'Eventos escolares';
  if (clean.toLowerCase().includes('apropriação')) return 'Apropriação';
  if (clean.toLowerCase().includes('acompanhamento')) return 'Acompanhamento';
  return clean;
}

const parseHours = (hStr) => {
  if (!hStr) return 0;
  const parts = hStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0] || '0') + (parseInt(parts[1] || '0') / 60);
  }
  return parseFloat(hStr) || 0;
};

const processData = (data) => {
  const sMap = {};
  const aMap = {};
  const mMap = { 
    'Jan': { remote:0, presencial:0 }, 'Fev': { remote:0, presencial:0 }, 'Mar': { remote:0, presencial:0 }, 
    'Abr': { remote:0, presencial:0 }, 'Mai': { remote:0, presencial:0 }, 'Jun': { remote:0, presencial:0 }, 
    'Jul': { remote:0, presencial:0 }, 'Ago': { remote:0, presencial:0 }, 'Set': { remote:0, presencial:0 }, 
    'Out': { remote:0, presencial:0 }, 'Nov': { remote:0, presencial:0 }, 'Dez': { remote:0, presencial:0 } 
  };
  
  let totalVisits = 0;

  data.forEach(row => {
    const escola = row['Escola'];
    if (!escola) return;
    
    totalVisits++;
    const state = row['Estado'] || 'SP';
    const resp = row['Responsável'] || '';
    const date = row['Data'];
    const acaoRaw = row['Ação'];
    const acao = cleanAction(acaoRaw);
    const hours = parseHours(row['Horas']);
    const mod = row['Modalidade'];
    const participantsStr = row['Participantes'] || '';
    const seg = row['Segmento'] || 'Geral';

    if (!sMap[escola]) {
      sMap[escola] = {
        id: escola.replace(/[^a-zA-Z]/g, '').toLowerCase() || Math.random().toString(),
        name: escola.replace('Rede Esi - ', '').replace('Colégio ', '').replace('Escola ', ''),
        fullName: escola,
        visits: 0, hours: 0, state: state, remote: 0, presencial: 0, participantsSet: new Set(),
        segmentsSet: new Set(),
        responsible: resp,
        actionsMap: {},
        highlight: 'Dados processados dinamicamente via Google Sheets.',
        attention: 'Sem alertas no momento.'
      };
    }
    
    const s = sMap[escola];
    s.visits++;
    s.hours += hours;
    
    const isRemote = mod?.toLowerCase()?.includes('remot');
    if (isRemote) s.remote++;
    else s.presencial++;
    
    participantsStr.split(',').forEach(p => { if (p.trim()) s.participantsSet.add(p.trim()) });
    if (seg.trim()) s.segmentsSet.add(seg.trim());
    s.actionsMap[acao] = (s.actionsMap[acao] || 0) + 1;

    aMap[acao] = (aMap[acao] || 0) + 1;

    if (date) {
      const parts = date.split('/');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const mStr = months[m-1];
        if (mStr && mMap[mStr]) {
          if (isRemote) mMap[mStr].remote++;
          else mMap[mStr].presencial++;
        }
      }
    }
  });

  schools = Object.values(sMap).map(s => ({
    ...s,
    participants: s.participantsSet.size,
    segments: Array.from(s.segmentsSet),
    actions: Object.entries(s.actionsMap).map(([k,v]) => ({ label: k, count: v })).sort((a,b) => b.count - a.count)
  })).sort((a,b) => b.visits - a.visits);

  actionDistribution = Object.entries(aMap).map(([k,v], i) => ({
    label: k, count: v, color: COLORS[i % COLORS.length]
  })).sort((a,b) => b.count - a.count);

  let activeMonths = Object.keys(mMap).filter(k => mMap[k].remote > 0 || mMap[k].presencial > 0);
  if (activeMonths.length === 0) activeMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  monthly = Object.keys(mMap)
    .filter((k, i) => i <= Object.keys(mMap).indexOf(activeMonths[activeMonths.length - 1] || 'Jun') || i < 6)
    .map(k => ({ month: k, ...mMap[k] }));

  TOTAL = totalVisits;
};
