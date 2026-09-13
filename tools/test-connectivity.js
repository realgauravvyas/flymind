const fs = require('fs'), path = require('path');
global.AUDIO = { on: false, spike: () => {} };
const root = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8') + '\n' +
`
// BFS reachability: is the whole graph one connected world?
const ids=NEURONS.map(n=>n.id);
let unreachable=[];
for(const src of ids){
  const seen=new Set([src]); const q=[src];
  while(q.length){const c=q.shift(); for(const s of OUT[c]){if(!seen.has(s.to)){seen.add(s.to);q.push(s.to);}}
    for(const s of IN[c]){if(!seen.has(s.from)){seen.add(s.from);q.push(s.from);}}}
  for(const t of ids) if(!seen.has(t)) unreachable.push(src+'→'+t);
}
console.log('unreachable pairs:', unreachable.length, '/', ids.length*ids.length);
if(unreachable.length) console.log('sample:', unreachable.slice(0,10).join(', '));
`;
eval(code);
