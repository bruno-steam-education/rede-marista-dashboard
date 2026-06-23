const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Update imports
content = content.replace(/import \{ schools, actionDistribution, monthly, TOTAL, fetchSheetData \} from '\.\/dataStore';/, `import { schools, actionDistribution, monthly, TOTAL, fetchSheetData, loadLocalCache } from './dataStore';`);
content = content.replace(/import \{ useEffect \} from 'react';/, `import { useEffect, useState, useMemo } from 'react';`);

// Add UpdateProgressModal component
const updateProgressModalCode = `
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
            animate={{ width: \`\${progress}%\` }}
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
   ═══════════════════════════════════════════════════════════════ */`;

content = content.replace(/\/\* ═══════════════════════════════════════════════════════════════\r?\n   MAIN APP\r?\n   ═══════════════════════════════════════════════════════════════ \*\//, updateProgressModalCode);

// Replace App component
content = content.replace(/export default function App\(\) \{[\s\S]*?const toggleDateFilter = \(\) => \{/m, `export default function App() {
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

  const toggleDateFilter = () => {`);

// Insert UpdateProgressModal into layout
content = content.replace(/<div className="layout">/, `<div className="layout">\n      <UpdateProgressModal {...updateState} />`);

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx updated!');
