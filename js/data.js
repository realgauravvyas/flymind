/* ============================================================
   FLYMIND data — a distilled fruit-fly connectome.
   Neuron names, cell classes, regions and wiring logic follow
   the published Drosophila connectomes (FlyWire / male-CNS
   Janelia 2026, and classic circuit literature). Numbers are
   scaled down from ~166k neurons / 125M synapses to keep the
   browser happy — see README for what's real vs simplified.
   ============================================================ */

const REGION = {
  ANTENNA:{name:'Antenna',x:.09,y:.31,color:'#00e5ff'},
  JO:{name:"Johnston's organ",x:.10,y:.44,color:'#00e5ff'},
  AL:{name:'Antennal lobe',x:.22,y:.33,color:'#4dc9ff'},
  WED:{name:'Wedge',x:.19,y:.47,color:'#4dc9ff'},
  SEZ:{name:'Suboesophageal zone',x:.30,y:.62,color:'#4dc9ff'},
  LH:{name:'Lateral horn',x:.35,y:.30,color:'#7c6cff'},
  MB:{name:'Mushroom body',x:.35,y:.50,color:'#ffd166'},
  CALYX:{name:'MB calyx',x:.30,y:.52,color:'#ffd166'},
  OL:{name:'Optic lobe',x:.20,y:.20,color:'#7c6cff'},
  LP:{name:'Lobula plate',x:.28,y:.22,color:'#7c6cff'},
  CX:{name:'Central complex',x:.42,y:.34,color:'#7c6cff'},
  P1_AREA:{name:'Courtship hub',x:.46,y:.40,color:'#ff6bcb'},
  VNC:{name:'Ventral nerve cord',x:.55,y:.62,color:'#3ddc97'},
  WING:{name:'Wing/flight motor',x:.66,y:.52,color:'#3ddc97'},
  LEG:{name:'Leg motor',x:.68,y:.70,color:'#3ddc97'},
};

// class: sensory | relay | learn | motor | mod
// role: short human blurb
const N = [
  // ---- olfactory receptor neurons (sensory) — real odour→receptor pairs
  {id:'Or42b', r:'ANTENNA', cls:'sensory', odour:'vinegar',    label:'ORN vinegar',        role:'Acetic-acid (vinegar) receptor neuron. Food approach.'},
  {id:'Or56a', r:'ANTENNA', cls:'sensory', odour:'geosmin',   label:'ORN geosmin',        role:'Geosmin = microbial contamination. Hardwired AVOID.'},
  {id:'Gr21a', r:'ANTENNA', cls:'sensory', odour:'co2',       label:'ORN CO2',            role:'CO2 receptor — stress/crowding signal. Avoidance.'},
  {id:'Or43b', r:'ANTENNA', cls:'sensory', odour:'phenyl',   label:'ORN phenylethanol',  role:'Fruit-ester odour. Approach + innate valence.'},
  {id:'Orco',  r:'ANTENNA', cls:'sensory', odour:null,       label:'ORN co-receptor',    role:'Common co-receptor; gain knob for the whole antenna.'},
  // ---- antennal lobe
  {id:'V_PN',  r:'AL', cls:'relay', label:'V projection neuron', role:'Reads out V glomerulus; broadcasts odour identity.'},
  {id:'DA1_PN',r:'AL', cls:'relay', label:'DA1 projection neuron',role:'CVA/odour crosstalk channel into LH + MB.'},
  {id:'LHN',   r:'LH', cls:'relay', label:'Lateral horn neuron',  role:'Innate valence: approach or avoid, no learning.'},
  {id:'iLHN',  r:'LH', cls:'relay', label:'LH inhibitory',        role:'Sharpens valence by suppressing rival channels.'},
  // ---- mushroom body (learning)
  {id:'PN_to_MB', r:'CALYX', cls:'relay', label:'PN→MB feed',     role:'Projection neurons deliver odour to Kenyon cells.'},
  {id:'KC',    r:'MB', cls:'learn', label:'Kenyon cell (~2000)',   role:'Sparse random barcode: each odour lights a tiny KC subset.'},
  {id:'MBON_a',r:'MB', cls:'learn', label:'MBON approach',        role:'MB output neuron driving APPROACH. Weakened by reward.'},
  {id:'MBON_b',r:'MB', cls:'learn', label:'MBON avoid',           role:'MB output driving AVOIDANCE. Weakened by sugar-DANs.'},
  {id:'APL',   r:'MB', cls:'mod',   label:'APL (feedback inh.)',  role:'One giant inhibitory neuron enforcing sparseness.'},
  {id:'PAM',   r:'MB', cls:'mod',   label:'PAM DAN (reward)',     role:'Reward dopamine: sugar activates PAM → depresses KC→MBON_a.'},
  {id:'PPL1',  r:'MB', cls:'mod',   label:'PPL1 DAN (punish)',    role:'Punishment dopamine: shock/bitter depresses KC→MBON_b.'},
  // ---- vision
  {id:'R1_6',  r:'OL', cls:'sensory', label:'Photoreceptor R1–6',  role:'Outer cartridge; luminance + motion raw feed.'},
  {id:'L1',    r:'OL', cls:'relay',   label:'Lamina L1',           role:'Bright-pathway to medulla.'},
  {id:'L2',    r:'OL', cls:'relay',   label:'Lamina L2',           role:'Dark-pathway (OFF motion).'},
  {id:'Tm1',   r:'OL', cls:'relay',   label:'Medulla Tm1',         role:' OFF-channel to lobula.'},
  {id:'Tm3',   r:'OL', cls:'relay',   label:'Medulla Tm3',         role:'ON-channel to lobula.'},
  {id:'T4',    r:'OL', cls:'relay',   label:'T4 (ON motion)',      role:'Detects bright-edge motion.'},
  {id:'T5',    r:'OL', cls:'relay',   label:'T5 (OFF motion)',     role:'Detects dark-edge motion.'},
  {id:'HS',    r:'LP', cls:'relay',   label:'HS tangential cell',  role:'Horizontal wide-field, optomotor turning.'},
  {id:'VS',    r:'LP', cls:'relay',   label:'VS tangential cell',  role:'Vertical wide-field, pitch stabilization.'},
  {id:'DN',    r:'VNC', cls:'motor',  label:'Descending neuron',   role:'Carries visually guided turns to the VNC.'},
  // ---- hearing / courtship
  {id:'JO',    r:'JO', cls:'sensory', label:'Johnston\'s organ',   role:'Antennal ear: hears wing-song, gravity, wind.'},
  {id:'APN1',  r:'WED',cls:'relay',   label:'APN1',                role:'Audio projection → wedge; male song input.'},
  {id:'P1',    r:'P1_AREA', cls:'mod',  label:'P1 (fru⁺)',         role:'Command-like courtship hub; mutual excitation with pCd.'},
  {id:'pCd',   r:'P1_AREA', cls:'mod',  label:'pCd (dsx⁺)',        role:'Sex-specific gate on courtship persistence.'},
  {id:'vpoDN', r:'VNC', cls:'motor',   label:'vpoDN',               role:'Descending courtship/song motor neuron.'},
  // ---- escape
  {id:'MDN',   r:'VNC', cls:'relay',  label:'MDN (escape)',         role:'Giant descending neuron; takes off NOW.'},
  {id:'GFN',   r:'VNC', cls:'motor',  label:'Giant fibre (GF)',     role:'Jump escape: synapse directly onto leg motor.'},
  {id:'TTMn',  r:'LEG', cls:'motor',  label:'TTM motor',            role:'Tergotrochanteral muscle — jump!'},
  // ---- taste (bitter vs sweet)
  {id:'Gr66a', r:'SEZ', cls:'sensory', label:'Bitter taste neuron', role:'Gr66a bitter receptor; feeding suppression.'},
  {id:'Gr5a',  r:'SEZ', cls:'sensory', label:'Sugar taste neuron',  role:'Gr5a sugar receptor; feeding + PAM reward.'},
  {id:'FdgN',  r:'SEZ', cls:'relay',  label:'Feeding interneuron', role:'SEZ hub weighing bitter vs sweet.'},
  // ---- touch/balance
  {id:'ch5',   r:'VNC', cls:'sensory', label:'Chordotonal ch',      role:'Stretch receptor: leg/wing position + balance.'},
  {id:'WSN',   r:'VNC', cls:'motor',  label:'Wing steering MN',    role:'Steers wing; also generates pulse-song vibration.'},
  // ---- reward (sugar → PAM)
  {id:'SugarDN',r:'SEZ', cls:'mod',   label:'Sugar reward path',   role:'Sweet taste → PAM reward dopamine in MB.'},
];

// synapses: [from, to, weight(0-1), type 'e'(excite) / 'i'(inhibit)]
const S = [
  // olfactory stream
  ['Or42b','V_PN',.9,'e'], ['Or43b','V_PN',.8,'e'], ['Orco','V_PN',.3,'e'],
  ['Or56a','DA1_PN',.9,'e'], ['Gr21a','DA1_PN',.85,'e'],
  ['V_PN','LHN',.7,'e'], ['V_PN','iLHN',.6,'e'], ['iLHN','LHN',.9,'i'],
  ['V_PN','PN_to_MB',.8,'e'], ['DA1_PN','PN_to_MB',.7,'e'],
  ['PN_to_MB','KC',.9,'e'], ['APL','KC',.8,'i'], ['KC','APL',.4,'e'], // KC↔APL feedback loop enforces sparseness
  ['KC','MBON_a',.6,'e'], ['KC','MBON_b',.6,'e'],
  ['PAM','MBON_b',.9,'i'], ['PPL1','MBON_a',.9,'i'], // reward dopamine weakens avoidance; punishment weakens approach
  ['MBON_a','LHN',.5,'e'], ['MBON_b','LHN',.5,'i'],
  // vision stream
  ['R1_6','L1',.9,'e'], ['R1_6','L2',.9,'e'],
  ['L1','Tm3',.8,'e'], ['L2','Tm1',.8,'e'],
  ['Tm3','T4',.9,'e'], ['Tm1','T5',.9,'e'],
  ['T4','HS',.7,'e'], ['T5','VS',.7,'e'],
  ['HS','DN',.7,'e'], ['VS','DN',.5,'e'], ['DN','WSN',.6,'e'],
  // hearing/courtship
  ['JO','APN1',.9,'e'], ['APN1','P1',.75,'e'],
  ['P1','pCd',.8,'e'], ['pCd','P1',.8,'e'],          // famous mutual excitation
  ['P1','vpoDN',.8,'e'], ['vpoDN','WSN',.8,'e'],       // courtship → wing song
  // escape
  ['ch5','MDN',.7,'e'], ['VS','MDN',.4,'e'], ['MDN','GFN',.9,'e'], ['GFN','TTMn',.95,'e'],
  // taste
  ['Gr66a','FdgN',.9,'i'], ['Gr5a','FdgN',.7,'e'], ['FdgN','SugarDN',.8,'e'],
  ['SugarDN','PAM',.9,'e'],                            // sugar → reward dopamine
  // cross-modal bridges (multimodal integration)
  ['LHN','MDN',.6,'e'],    // odour valence modulates escape threshold (real LH→DN wiring)
  ['LHN','P1',.5,'e'],     // food odour gates courtship drive
  ['FdgN','LHN',.4,'e'],   // taste & smell converge for feeding decisions
];

// hotspot behaviours: sensory stim → cascade of events (node id, delay ms, effect)
const STIMS = {
  vinegar:   {label:'Vinegar puff', first:'Or42b',  emotion:'FOOD!',    behaviour:'approach'},
  phenyl:    {label:'Phenylethanol', first:'Or42b',  emotion:'FOOD!',    behaviour:'approach'},
  geosmin:   {label:'Geosmin',      first:'Or56a',  emotion:'DANGER',   behaviour:'avoid'},
  co2:       {label:'CO₂ burst',     first:'Gr21a',  emotion:'STRESS',  behaviour:'avoid'},
};

// arena fly drawing config
const FLY = {
  // normalized coords on canvas
  body:{x:.5,y:.55},
  scale:.9,
};

const NEURONS = N.map(n=>({...n, firing:0, flash:0, pos:null}));
const SYNAPSES = S.map(([from,to,w,t])=>({from,to,w,t}));

// index maps
const NBY = Object.fromEntries(NEURONS.map(n=>[n.id,n]));
const OUT = {}; NEURONS.forEach(n=>OUT[n.id]=[]);
SYNAPSES.forEach(s=>{ if(OUT[s.from]) OUT[s.from].push(s); });
const IN = {}; NEURONS.forEach(n=>IN[n.id]=[]);
SYNAPSES.forEach(s=>{ if(IN[s.to]) IN[s.to].push(s); });

const CLS_COLOR = {sensory:'#00e5ff', relay:'#7c6cff', learn:'#ffd166', motor:'#3ddc97', mod:'#ff6bcb'};
const CLS_NAME  = {sensory:'sensory', relay:'relay', learn:'learning', motor:'motor', mod:'modulatory'};
