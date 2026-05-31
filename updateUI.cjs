const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/bg-black\/20/g, 'bg-slate-200/50');
code = code.replace(/bg-black\/25/g, 'bg-slate-100');
code = code.replace(/bg-black\/60/g, 'bg-slate-800/80'); // for overlays over images/canvas it might need to stay darkish or be white
code = code.replace(/hover:bg-white/g, 'hover:bg-slate-200'); // except maybe this replaces incorrectly if it's already complete
code = code.replace(/border-white\/15/g, 'border-slate-300');
code = code.replace(/text-slate-950/g, 'text-white');
// Double check for stray white text on light bg, or text-slate-200 which should have been replaced
code = code.replace(/text-slate-200/g, 'text-slate-800');
code = code.replace(/bg-white\/\d+/g, 'bg-slate-100');
fs.writeFileSync('src/App.tsx', code);
