const fs = require('fs');
let content = fs.readFileSync('src/dataStore.js', 'utf8');

content = content.replace(/export const fetchSheetData = \(\) => \{[\s\S]*?error: \(err\) => reject\(err\)\r?\n    \}\);\r?\n  \}\);\r?\n\};\r?\n/, `export const loadLocalCache = () => {
  try {
    const cached = localStorage.getItem('redeEsiData');
    if (cached) {
      const parsed = JSON.parse(cached);
      schools = parsed.schools;
      actionDistribution = parsed.actionDistribution;
      monthly = parsed.monthly;
      TOTAL = parsed.TOTAL;
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
};

export const fetchSheetData = () => {
  return new Promise((resolve, reject) => {
    Papa.parse('https://docs.google.com/spreadsheets/d/1_upLb6WdHxg39MNvCyAeJ-H6ZLfvBqYpW_8qvpX1wDQ/gviz/tq?tqx=out:csv', {
      download: true,
      header: true,
      complete: (results) => {
        try {
          const oldTotal = TOTAL;
          processData(results.data);
          localStorage.setItem('redeEsiData', JSON.stringify({ schools, actionDistribution, monthly, TOTAL }));
          resolve({ hasChanges: oldTotal !== TOTAL || oldTotal === 0, newTotal: TOTAL });
        } catch (e) {
          reject(e);
        }
      },
      error: (err) => reject(err)
    });
  });
};\n`);

fs.writeFileSync('src/dataStore.js', content);
console.log('dataStore.js updated');
