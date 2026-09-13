const fs = require('fs'), path = require('path');
global.AUDIO = { on: false, spike: () => {} };
const root = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'js/brain.js'), 'utf8').replace('class Brain', 'global.BrainClass = class Brain') + '\n' +
`
const B=new BrainClass();
// geosmin
B.fire('Or56a',1);
const seen=[];
for(let i=0;i<80;i++){
  B.step(16);
  if(i%4===0) NEURONS.forEach(n=>{ if(n.flash>0.5 && !seen.includes(n.id)) seen.push(n.id); });
}
console.log('geosmin cascade (mid-flight):', seen.join(' -> '));

// vinegar
B.reset();
const seen2=[];
B.fire('Or42b',1);
for(let i=0;i<80;i++){
  B.step(16);
  if(i%4===0) NEURONS.forEach(n=>{ if(n.flash>0.5 && !seen2.includes(n.id)) seen2.push(n.id); });
}
console.log('vinegar cascade (mid-flight):', seen2.join(' -> '));

// how long until activity dies?
let steps=0;
for(;;){ B.step(16); steps++; if(B.queue.length===0 && steps>200) break; if(steps>5000) {console.log('RUNAWAY LOOP'); break;} }
console.log('cascade terminates after', steps, 'steps');
`;
eval(code);
