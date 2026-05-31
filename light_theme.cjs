const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Dark back to Light
code = code.replace(/bg-\[\#030712\]/g, 'bg-slate-50'); 
code = code.replace(/bg-\[\#0f172a\]\/90/g, 'bg-white'); 
code = code.replace(/bg-slate-800\/50/g, 'bg-slate-100');
code = code.replace(/bg-slate-800/g, 'bg-slate-200');

code = code.replace(/border-slate-800\/50/g, 'border-slate-200');
code = code.replace(/border-slate-700\/50/g, 'border-slate-300');

// Header
code = code.replace(/bg-\[\#030712\]\/80/g, 'bg-indigo-950/90');

code = code.replace(/text-slate-100/g, 'text-slate-900');
code = code.replace(/text-slate-200/g, 'text-slate-800');
code = code.replace(/text-slate-300/g, 'text-slate-700');
code = code.replace(/text-slate-400/g, 'text-slate-600');

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx modified to light theme");
