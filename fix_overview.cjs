const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Fix SchoolDetailCard
content = content.replace(/function SchoolDetailCard\(\{ school, onNavigate \}\) \{/, `function SchoolDetailCard({ school, onNavigate }) {
  if (!school) return <div className="school-detail-card"><p>Nenhuma escola selecionada ou dados indisponíveis.</p></div>;`);

// Fix OverviewPage optional chaining
content = content.replace(/<p>\{selectedSchool\.highlight\}<\/p>/g, '<p>{selectedSchool?.highlight}</p>');
content = content.replace(/<p>\{selectedSchool\.attention\}<\/p>/g, '<p>{selectedSchool?.attention}</p>');

// Fix hardcoded KPIs in OverviewPage
content = content.replace(/<div className="kpi-value">164<\/div>/, '<div className="kpi-value">{totals.visits}</div>');
content = content.replace(/<div className="kpi-value">186,5h<\/div>/, '<div className="kpi-value">{fmtH(totals.hours)}h</div>');
content = content.replace(/<div className="kpi-value">12<\/div>/, '<div className="kpi-value">{totals.units}</div>');
content = content.replace(/<div className="kpi-value">69<\/div>/, '<div className="kpi-value">{totals.participants}</div>');

// Fix modalities
content = content.replace(/<ModalityCircle pct=\{62\} count=\{102\} label="Remotos" color="#007EC3" \/>/, `<ModalityCircle pct={totals.visits ? Math.round((totals.remote/totals.visits)*100) : 0} count={totals.remote} label="Remotos" color="#007EC3" />`);
content = content.replace(/<ModalityCircle pct=\{38\} count=\{62\} label="Presenciais" color="#EA5B0C" \/>/, `<ModalityCircle pct={totals.visits ? Math.round((totals.presencial/totals.visits)*100) : 0} count={totals.presencial} label="Presenciais" color="#EA5B0C" />`);

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx fixed');
