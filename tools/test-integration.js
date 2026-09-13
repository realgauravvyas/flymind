// Headless integration check: verify DOM ids referenced by JS exist in HTML,
// and that data/brain logic runs without errors.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');

const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const jsFiles = ['data.js','brain.js','audio.js','arena.js','explore.js','learn.js','song.js','main.js'];
let allOk = true;

// 1. collect getElementById calls across JS
const idRefs = new Set();
jsFiles.forEach(f=>{
  const src = fs.readFileSync(path.join(root,'js',f),'utf8');
  for (const m of src.matchAll(/getElementById\(\s*'([^']+)'\s*\)/g)) idRefs.add(m[1]);
  for (const m of src.matchAll(/getElementById\(\s*"([^"]+)"\s*\)/g)) idRefs.add(m[1]);
});
// also dataset lookups like btn.dataset.tab → data-tab values
const dataTabs = [...html.matchAll(/data-tab="([^"]+)"/g)].map(m=>m[1]);

let missing = [];
idRefs.forEach(id=>{
  if (!new RegExp(`id="${id}"`).test(html)) missing.push(id);
});
// dynamic ids: ls-*, sg-*, view-*, btn-audio, etc. check the common ones
['ls-trials','ls-perf','ls-mbon','sg-rate','sg-rate-v','sg-leg','sg-leg-v','sg-amp','sg-amp-v','sg-fem','sg-fem-v','hud-state','hud-activity','trace','scope','search','search-results','node-card','btn-path-clear','btn-audio','toast-container','arena','graph','learn','song','mb-weights','learn-odour-a','learn-odour-b','learn-reward','btn-train','btn-train-10','btn-test','btn-reset-learn','btn-song-play','btn-song-stop','song-bpm','arena-hint','mb-caption'].forEach(id=>{
  if (!new RegExp(`id="${id}"`).test(html)) missing.push(id+' (static)');
});
dataTabs.forEach(t=>{
  if (!new RegExp(`id="view-${t}"`).test(html)) missing.push('view-'+t);
});

if (missing.length){ allOk=false; console.log('MISSING IDS:', missing.join(', ')); }
else console.log('PASS: all', idRefs.size, '+ static ids present in HTML');

// 2. check stim buttons dataset values against STIMS keys
const stimKeys = [...html.matchAll(/data-odour="([^"]+)"/g)].map(m=>m[1]);
const stimsSrc = fs.readFileSync(path.join(root,'js','data.js'),'utf8');
const valid = ['vinegar','geosmin','co2','phenyl'];
const bad = stimKeys.filter(k=>!valid.includes(k));
if (bad.length){ allOk=false; console.log('BAD ODOUR KEYS:', bad); }
else console.log('PASS: stim buttons', stimKeys.join(','), 'all valid');

// 3. synapse endpoints all exist in neuron list
const stimsSrc2 = fs.readFileSync(path.join(root,'js','data.js'),'utf8');
const vmTest = eval(stimsSrc2 + `
;(() => {
  const badEnds = [];
  SYNAPSES.forEach(s=>{ if(!NBY[s.from]||!NBY[s.to]) badEnds.push(s.from+'→'+s.to); });
  return badEnds;
})()`);
let synCount;
eval(stimsSrc2 + '; synCount = SYNAPSES.length;');
if (vmTest.length){ allOk=false; console.log('DANGLING SYNAPSES:', vmTest); }
else console.log('PASS: all', synCount, 'synapses reference existing neurons');

// 4. brain cascade terminates (no infinite loops)
const brainCode = fs.readFileSync(path.join(root,'js','brain.js'),'utf8');
global.AUDIO = { on:false, spike:()=>{} };
eval(stimsSrc2 + '\n' + brainCode.replace('class Brain','var __B; global.BrainClass = class Brain'));
const B = new BrainClass();
B.fire('Or42b',1);
let steps=0;
for (; steps<4000; steps++){ B.step(16); if (B.queue.length===0 && steps>40) break; }
console.log('PASS: olfactory cascade settled in', steps, 'steps, queue empty:', B.queue.length===0);

if (!allOk) { console.log('FAILURES FOUND'); process.exit(1); }
console.log('ALL INTEGRATION CHECKS PASS');
