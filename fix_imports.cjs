const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(/import \{ useState, useMemo \} from 'react';/, "import { useState, useMemo, useEffect } from 'react';");
content = content.replace(/import \{ useEffect, useState, useMemo \} from 'react';\r?\n/, '');

fs.writeFileSync('src/App.jsx', content);
console.log('Fixed imports!');
