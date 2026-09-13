const fs = require('fs'), path = require('path');
// DOM stub for headless test
global.document = { getElementById: () => ({ textContent:'', set innerHTML(v){}, style:{} }), querySelectorAll: () => [] };
global.window = { addEventListener: ()=>{} };
global.LearnDraw = { draw: ()=>{} };
const root = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'js/data.js'),'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'js/learn.js'),'utf8').split('/* ---------------- drawing ---------------- */')[0] + '\n' +
`
MB.init();
console.log('vinegar tilt before:', MB.tiltFor('vinegar').toFixed(3));
for(let i=0;i<3;i++) MB.train('vinegar', +1);
console.log('vinegar tilt after 3 sugar trials:', MB.tiltFor('vinegar').toFixed(3), '(should be > 0 = approach)');
console.log('geosmin tilt (untrained):', MB.tiltFor('geosmin').toFixed(3), '(~0)');
MB.evaluate();
console.log('performance:', MB.perf.toFixed(2));
if (MB.tiltFor('vinegar') > 0) console.log('PASS: reward learning flips approach');
else { console.log('FAIL'); process.exit(1); }
`;
eval(code);
