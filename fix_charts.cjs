const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Fix DonutChart
content = content.replace(/const total = data\.reduce\(\(s, a\) => s \+ a\.count, 0\);/, 'const total = data.reduce((s, a) => s + a.count, 0) || 1;');

// Fix LineChart
content = content.replace(/const maxVal = Math\.max\(\.\.\.data\.map\(m => Math\.max\(m\.remote, m\.presencial\)\)\) \+ 5;/, 'const maxVal = data.length ? Math.max(...data.map(m => Math.max(m.remote, m.presencial))) + 5 : 10;');

fs.writeFileSync('src/App.jsx', content);
console.log('Charts fixed for empty states');
