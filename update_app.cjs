const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(/\/\* ═══════════════════════════════════════════════════════════════\r?\n   DATA — extracted from Rede_ESI_Resultados CSV \(164 rows\)\r?\n   ═══════════════════════════════════════════════════════════════ \*\//, '/* DATA IMPORT */');

content = content.replace(/const schools = \[[\s\S]*?const TOTAL = 164;/m, `import { schools, actionDistribution, monthly, TOTAL, fetchSheetData } from './dataStore';\nimport { motion } from 'framer-motion';\nimport { useEffect } from 'react';`);

content = content.replace(/export default function App\(\) \{/, `export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [dataKey, setDataKey] = useState(0);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await fetchSheetData();
    } catch (e) {
      console.error('Error fetching data:', e);
    }
    setSelectedSchool(schools[0] || null);
    setIsLoading(false);
    setDataKey(prev => prev + 1);
  };

  useEffect(() => {
    loadData();
    window.refreshDashboardData = () => loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <img src="./logo 30 anos colorido zoom.png" alt="ZOOM" width="150" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
          style={{ marginTop: 20, color: '#007EC3' }}
        >
          Sincronizando dados da Rede ESI...
        </motion.h2>
      </div>
    );
  }
`);

content = content.replace(/const \[selectedSchool, setSelectedSchool\] = useState\(schools\[0\]\);/, 'const [selectedSchool, setSelectedSchool] = useState(null);');

content = content.replace(/const totals = useMemo\(\(\) => \(\{\r?\n\s*visits: 164, hours: 186\.5, units: 12, participants: 69, remote: 102, presencial: 62,\r?\n\s*\}\), \[\]\);/, `const totals = useMemo(() => {
    let visits = 0, hours = 0, remote = 0, presencial = 0, participants = 0;
    schools.forEach(s => {
      visits += s.visits;
      hours += s.hours;
      remote += s.remote;
      presencial += s.presencial;
      participants += s.participants;
    });
    return { visits, hours, units: schools.length, participants, remote, presencial };
  }, [dataKey]);`);

content = content.replace(/const schoolsByState = useMemo\(\(\) => \{\r?\n\s*const map = \{ RS: 0, PR: 0, SP: 0, MG: 0 \};\r?\n\s*schools\.forEach\(s => \{ map\[s\.state\] = \(map\[s\.state\] \|\| 0\) \+ s\.visits; \}\);\r?\n\s*return map;\r?\n\s*\}, \[\]\);/, `const schoolsByState = useMemo(() => {
    const map = { RS: 0, PR: 0, SP: 0, MG: 0 };
    schools.forEach(s => { map[s.state] = (map[s.state] || 0) + s.visits; });
    return map;
  }, [dataKey]);`);

content = content.replace(/const filteredSchools = useMemo\(\(\) => \{\r?\n\s*if \(stateFilter === 'ALL'\) return schools;\r?\n\s*return schools\.filter\(s => s\.state === stateFilter\);\r?\n\s*\}, \[stateFilter\]\);/, `const filteredSchools = useMemo(() => {
    if (stateFilter === 'ALL') return schools;
    return schools.filter(s => s.state === stateFilter);
  }, [stateFilter, dataKey]);`);

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx updated!');
