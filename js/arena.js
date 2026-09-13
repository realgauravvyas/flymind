/* ============================================================
   FLYMIND arena — the interactive fly.
   Draw the fly (head, eyes, antennae, body, wings, legs),
   draw live neurons firing on top of brain regions, handle
   hotspots for senses, drive behaviour states + animations.
   ============================================================ */

const Arena = {
  canvas:null, ctx:null, W:0, H:0, DPR:1,
  fly:{x:0, y:0, vx:0, vy:0, face:1, scale:1},
  state:'resting', stateT:0, target:null,
  ripples:[], sparks:[], particles:[],
  hintShown:false,

  init() {
    this.canvas = document.getElementById('arena');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', ()=>this.resize());
    this.canvas.addEventListener('pointerdown', e=>this.click(e));
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  },

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.DPR = Math.min(2, window.devicePixelRatio||1);
    if (r.width===0 || r.height===0) return;  // hidden tab — skip until visible
    this.W = r.width; this.H = r.height;
    this.canvas.width = this.W*this.DPR;
    this.canvas.height = this.H*this.DPR;
    this.ctx.setTransform(this.DPR,0,0,this.DPR,0,0);
    this.gridCache=null; // rebuild grid at new size
    this.fly.x = this.W*.5; this.fly.y = this.H*.55;
  },

  /* convert region coords (0-1) to canvas coords over the fly's head */
  regionXY(rid) {
    const R = REGION[rid];
    const hx = this.fly.x - 95*this.fly.scale;   // head anchor (world coords, no face flip)
    const hy = this.fly.y - 60*this.fly.scale;
    return { x: hx + R.x*220*this.fly.scale, y: hy + R.y*160*this.fly.scale, color:R.color };
  },

  /* ---------- input ---------- */
  click(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX-rect.left, my = e.clientY-rect.top;
    // hotspot check: sensory zones
    const spots = [
      {x:this.fly.x - 130*this.fly.scale, y:this.fly.y - 75*this.fly.scale, r:26, act:'odour'},   // antenna
      {x:this.fly.x - 95*this.fly.scale*this.fly.face, y:this.fly.y - 95*this.fly.scale, r:24, act:'eye'}, // eye
      {x:this.fly.x + 90*this.fly.scale, y:this.fly.y + 30*this.fly.scale, r:26, act:'touch'},   // abdomen
      {x:this.fly.x - 30*this.fly.scale, y:this.fly.y + 60*this.fly.scale, r:24, act:'wind'},    // below: wind/jump
    ];
    for (const s of spots) {
      if (Math.hypot(mx-s.x,my-s.y) < s.r) { this.stimulate(s.act); return; }
    }
    // click on body → poke!
    if (Math.abs(mx-this.fly.x)<70 && Math.abs(my-this.fly.y)<50) { this.stimulate('poke'); return; }
    // click anywhere → air puff toward fly (visual motion)
    if (mx < this.fly.x) this.stimulate('shadow-l');
    else this.stimulate('shadow-r');
  },

  /* ---------- stimulation entry ---------- */
  stimulate(kind, extra) {
    const B = window.BRAIN;
    this.hintShown = true;
    document.getElementById('arena-hint').style.opacity = 0;

    if (kind==='odour') {
      this.spawnParticles('scent', 20);
    }
    switch(kind) {
      case 'odour': {
        // pick odour from side-panel selection (set by the stim button click)
        const key = (typeof LearnState !== 'undefined' && LearnState.currentOdour) || 'vinegar';
        const stim = STIMS[key] || STIMS.vinegar;
        B.fire(stim.first, 1);
        if (key==='geosmin'||key==='co2') { this.setBehaviour('avoid'); }
        else {
          // learned valence can flip approach→avoid if trained that way
          const tilt = (typeof MB !== 'undefined' && MB.tiltFor) ? MB.tiltFor(key) : 0;
          this.setBehaviour(tilt < -0.15 ? 'avoid' : 'approach');
        }
        this.ripples.push({x:this.fly.x-120, y:this.fly.y-80, r:8, max:90, a:1});
        Toast.show(`<b>${stim.label}</b> — olfactory cascade`);
        break;
      }
      case 'eye': {
        B.fire('R1_6', 1);
        this.setBehaviour('optomotor');
        this.ripples.push({x:this.fly.x-95, y:this.fly.y-95, r:6, max:70, a:1});
        Toast.show('<b>Light flash</b> — visual cascade (R1–6 → T4/T5 → HS/VS)');
        break;
      }
      case 'touch': {
        B.fire('ch5', 1);
        this.setBehaviour('groom');
        Toast.show('<b>Touch</b> — chordotonal → grooming');
        break;
      }
      case 'wind': {
        B.fire('MDN', 1);
        this.setBehaviour('jump');
        Toast.show('<b>Threat!</b> — giant fibre escape reflex. Jump!');
        break;
      }
      case 'poke': {
        B.fire('ch5', .7);
        this.setBehaviour('jump');
        Toast.show('You poked the fly. Its <b>giant fibre</b> says RUN.');
        break;
      }
      case 'shadow-l': case 'shadow-r': {
        B.fire(kind==='shadow-l'?'T4':'T5', .8);
        this.setBehaviour('optomotor');
        Toast.show('<b>Motion detected</b> — lobula plate turning reflex');
        break;
      }
    }
  },

  setBehaviour(state) {
    // a harder-wired reflex overrides a still-running soft attraction
    const reflex = state==='jump'||state==='avoid';
    const soft = this.state==='approach'||this.state==='optomotor'||this.state==='groom';
    if (reflex && soft) { /* reflex interrupts immediately */ }
    this.state = state; this.stateT = performance.now();
    document.getElementById('hud-state').innerHTML = `STATE <b>${state.toUpperCase()}</b>`;
  },

  spawnParticles(kind, n) {
    for (let i=0;i<n;i++) {
      this.particles.push({
        x:this.fly.x-120+Math.random()*40, y:this.fly.y-90+Math.random()*30,
        vx:(Math.random()*1.2+.4), vy:(Math.random()-.5)*.6,
        life:1, kind
      });
    }
  },

  /* ---------- render loop ---------- */
  gridCache:null,
  makeGrid() { // draw the static background grid once into an offscreen canvas
    const c = document.createElement('canvas');
    c.width=this.W*this.DPR; c.height=this.H*this.DPR;
    const g = c.getContext('2d');
    g.scale(this.DPR,this.DPR);
    g.strokeStyle='#0d1a2e'; g.lineWidth=1;
    for (let x=0;x<this.W;x+=40){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,this.H); g.stroke(); }
    for (let y=0;y<this.H;y+=40){ g.beginPath(); g.moveTo(0,y); g.lineTo(this.W,y); g.stroke(); }
    this.gridCache=c;
  },
  loop(ts) {
    const B = window.BRAIN; if(!B) { requestAnimationFrame(this.loop); return; }
    const dt = 16;
    const act = B.step(dt);

    // behaviour animation
    this.animate();

    // draw
    const ctx = this.ctx;
    if (!this.gridCache) this.makeGrid();
    ctx.clearRect(0,0,this.W,this.H);
    ctx.drawImage(this.gridCache,0,0,this.W,this.H);

    // ripples
    this.ripples = this.ripples.filter(r=>{
      r.r += 1.6; r.a -= .012;
      if (r.a<=0) return false;
      ctx.strokeStyle = `rgba(0,229,255,${r.a})`; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,7); ctx.stroke();
      return true;
    });

    // particles (scent)
    this.particles = this.particles.filter(p=>{
      p.x+=p.vx; p.y+=p.vy; p.life-=.012;
      if (p.life<=0) return false;
      ctx.fillStyle=`rgba(0,229,255,${p.life*.5})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,2,0,7); ctx.fill();
      return true;
    });

    this.drawFly(ctx, ts);
    this.drawNeurons(ctx);
    this.drawHotspots(ctx, ts);

    // hud
    document.getElementById('hud-activity').innerHTML = `ACTIVITY <b>${B.activityHz()}</b> Hz`;

    requestAnimationFrame(this.loop);
  },

  animate() {
    const f=this.fly, now=performance.now(), t=(now-this.stateT)/1000;
    f.x += f.vx; f.y += f.vy;
    f.vx*=.9; f.vy*=.9;
    if (this.state==='approach' && t<2.2) { f.vx=-1.1; f.vy=Math.sin(now/90)*.25; }
    if (this.state==='avoid' && t<1.6)   { f.vx=2.6; f.vy=-Math.abs(Math.sin(now/70))*.5; } // hardwired: strong retreat
    if (this.state==='jump' && t<0.5)   { f.vy=-6; f.vx=2.4; }
    if (this.state==='optomotor' && t<1.8) { f.vx = this.fly.face*-.6; }
    // bounds: keep the fly visible
    const minX=this.W*.25, maxX=this.W*.75, minY=this.H*.2, maxY=this.H*.8;
    if (f.x<minX){f.x=minX; f.vx*=-.4;} if (f.x>maxX){f.x=maxX; f.vx*=-.4;}
    if (f.y<minY){f.y=minY; f.vy*=-.4;} if (f.y>maxY){f.y=maxY; f.vy*=-.4;}
    // settle back home
    if (now-this.stateT > 2600 && this.state!=='resting') {
      this.state='resting';
      document.getElementById('hud-state').innerHTML='STATE <b>RESTING</b>';
    }
    if (this.state==='resting') {
      f.x += (this.W*.5-f.x)*.004;
      f.y += (this.H*.55-f.y)*.004 + Math.sin(now/400)*.08;
    }
  },

  /* ---------- fly drawing ---------- */
  drawFly(ctx, ts) {
    const f=this.fly, s=f.scale;
    const wing = this.state==='courtship'||AUDIO.buzzState.playing
      ? Math.sin(ts/ (this.state==='courtship'?12:4) )*.9
      : Math.sin(ts/700)*.12;
    ctx.save();
    ctx.translate(f.x,f.y);
    ctx.scale(f.face,1);

    /* ═══ HOLO-FLY: neon wireframe specimen, scanned-in-a-lab look ═══ */
    const NEON='#00e5ff', NEON_DIM='rgba(0,229,255,.28)', NEON_MID='rgba(0,229,255,.5)';

    // scanning floor shadow → glowing outline halo on the ground
    ctx.strokeStyle='rgba(0,229,255,.14)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(10*s,62*s,86*s,12*s,0,0,7); ctx.stroke();

    // inner glow body fill (very translucent cyan)
    const grad = ctx.createLinearGradient(-70*s,-40*s,90*s,50*s);
    grad.addColorStop(0,'rgba(0,229,255,.05)'); grad.addColorStop(.5,'rgba(0,120,255,.09)'); grad.addColorStop(1,'rgba(0,229,255,.05)');
    ctx.fillStyle=grad;
    ctx.beginPath(); ctx.ellipse(55*s,8*s,58*s,26*s,0,0,7); ctx.fill();     // abdomen
    ctx.beginPath(); ctx.ellipse(-15*s,-4*s,34*s,28*s,0,0,7); ctx.fill();   // thorax
    ctx.beginPath(); ctx.ellipse(-62*s,-22*s,20*s,18*s,0,0,7); ctx.fill(); // head

    // wireframe outlines — bright neon
    ctx.strokeStyle=NEON_MID; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(55*s,8*s,58*s,26*s,0,0,7); ctx.stroke();  // abdomen
    ctx.beginPath(); ctx.ellipse(-15*s,-4*s,34*s,28*s,0,0,7); ctx.stroke();// thorax
    ctx.beginPath(); ctx.ellipse(-62*s,-22*s,20*s,18*s,0,0,7); ctx.stroke();// head
    // connection seams (where the real cuticle segments)
    ctx.strokeStyle=NEON_DIM; ctx.lineWidth=1.2;
    for (let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(24*s+i*15*s,-17*s); ctx.lineTo(24*s+i*15*s,22*s); ctx.stroke(); }

    // dorsal scanline sweeping over the specimen (scanner vibe)
    const scan = ((ts/2400)%1)*160-80;
    ctx.strokeStyle='rgba(0,229,255,.25)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-90*s,scan*s-44*s); ctx.lineTo(110*s,scan*s-44*s); ctx.stroke();

    // legs — neon jointed struts
    ctx.strokeStyle=NEON_MID; ctx.lineWidth=2.5*s; ctx.lineCap='round';
    const legSw = this.state==='groom'? Math.sin(ts/40)*.6 : 0;
    [[-30,26,-52,64],[-12,30,-8,74],[8,30,30,68]].forEach((L,i)=>{
      ctx.beginPath(); ctx.moveTo(L[0]*s,L[1]*s);
      ctx.quadraticCurveTo(L[0]*s-8, L[1]*s+24*s, L[2]*s, L[3]*s+(legSw&&i===0?Math.sin(ts/50)*10*s:0));
      ctx.stroke();
    });

    // wings — translucent light-blades with iridescent shimmer
    ctx.fillStyle='rgba(0,229,255,.07)';
    ctx.strokeStyle='rgba(0,229,255,.55)'; ctx.lineWidth=1.6;
    ctx.save(); ctx.translate(-8*s,-18*s); ctx.rotate(-.5+wing*.5);
    ctx.beginPath(); ctx.ellipse(-40*s,-22*s,48*s,16*s,-.4,0,7); ctx.fill(); ctx.stroke();
    // wing veins
    ctx.strokeStyle='rgba(0,229,255,.3)'; ctx.lineWidth=1;
    for(let v=0;v<4;v++){ ctx.beginPath(); ctx.moveTo(-10*s,-24*s); ctx.lineTo(-80*s+v*9*s,-20*s+v*6*s); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.translate(-8*s,-18*s); ctx.rotate(-.28+wing*.3);
    ctx.fillStyle='rgba(0,180,255,.06)';
    ctx.beginPath(); ctx.ellipse(-38*s,-14*s,44*s,14*s,-.35,0,7); ctx.fill(); ctx.stroke(); ctx.restore();
    // halteres — glowing balance knobs
    ctx.fillStyle=NEON;
    ctx.shadowColor=NEON; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.arc(6*s,20*s,4*s,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(-26*s,24*s,3.5*s,0,7); ctx.fill();
    ctx.shadowBlur=0;

    // head details: compound eyes as hex-grid magenta orbs (dimorphism signal)
    ctx.strokeStyle='rgba(255,107,203,.75)'; ctx.lineWidth=1.8;
    ctx.fillStyle='rgba(255,107,203,.18)';
    ctx.beginPath(); ctx.ellipse(-72*s,-28*s,13*s,15*s,-.35,0,7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-56*s,-32*s,11*s,13*s,.35,0,7); ctx.fill(); ctx.stroke();
    // facet sparkles inside eyes
    ctx.fillStyle='rgba(255,107,203,.8)';
    for(let e=0;e<5;e++){
      const a2=e*1.26+ts/900, ex=-70*s+Math.cos(a2)*8*s, ey=-29*s+Math.sin(a2)*9*s;
      ctx.fillRect(ex,ey,1.5,1.5);
    }
    // ocelli — 3 tiny bright sensors
    ctx.fillStyle='#ffd166'; ctx.shadowColor='#ffd166'; ctx.shadowBlur=6;
    [[-64,-40],[-58,-42],[-70,-41]].forEach(o=>{ ctx.beginPath(); ctx.arc(o[0]*s,o[1]*s,1.5*s,0,7); ctx.fill(); });
    ctx.shadowBlur=0;

    // antennae — sensor whips with a sniffing pulse
    const sniffPulse = (Math.sin(ts/300)+1)/2;
    ctx.strokeStyle=`rgba(0,229,255,${.4+sniffPulse*.4})`; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(-74*s,-34*s); ctx.quadraticCurveTo(-96*s,-58*s,-112*s,-52*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-66*s,-38*s); ctx.quadraticCurveTo(-84*s,-72*s,-104*s,-70*s); ctx.stroke();
    // antenna tips
    ctx.fillStyle=NEON;
    ctx.beginPath(); ctx.arc(-112*s,-52*s,2.5*s,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(-104*s,-70*s,2.5*s,0,7); ctx.fill();

    ctx.restore();

    // heart pulse when active
    const act = window.BRAIN.history.slice(-1)[0]||0;
    if (act>.02) {
      ctx.strokeStyle=`rgba(0,229,255,${Math.min(.5,act*3)})`;
      ctx.lineWidth=2;
      ctx.beginPath(); ctx.ellipse(f.x,f.y,120*s*(1+act),70*s*(1+act),0,0,7); ctx.stroke();
    }
  },

  /* ---------- neurons overlay ---------- */
  drawNeurons(ctx) {
    const B=window.BRAIN;
    // synapse lines (only when source firing)
    SYNAPSES.forEach(sy=>{
      const a=this.regionXY(NBY[sy.from].r), b=this.regionXY(NBY[sy.to].r);
      const src=NBY[sy.from];
      if (src.firing>.08) {
        const alpha = Math.min(.75, src.firing);
        ctx.strokeStyle = sy.t==='e' ? `rgba(0,229,255,${alpha})` : `rgba(255,84,112,${alpha})`;
        ctx.lineWidth = .8 + sy.w*1.4*Math.min(1,src.firing);
        ctx.beginPath(); ctx.moveTo(a.x,a.y);
        // curve through midpoint offset
        const mx=(a.x+b.x)/2, my=(a.y+b.y)/2 + (sy.leg||0)*10;
        ctx.quadraticCurveTo(mx,my,b.x,b.y);
        ctx.stroke();
        // travelling pulse dot
        const ph = (performance.now()/ (900 - sy.w*500) + (sy.from.length*7)%17 ) % 1;
        const px = qpoint(a.x,mx,b.x,ph), py = qpoint(a.y,my,b.y,ph);
        ctx.fillStyle = sy.t==='e' ? 'rgba(0,229,255,.9)':'rgba(255,84,112,.9)';
        ctx.beginPath(); ctx.arc(px,py, 2.2+src.firing*2, 0,7); ctx.fill();
      }
    });
    // nodes
    NEURONS.forEach(n=>{
      const p=this.regionXY(n.r);
      const act = Math.min(1, n.firing + n.flash*.6);
      if (act<.03 && n.cls!=='sensory') return;
      const r = 3 + act*4;
      ctx.fillStyle = CLS_COLOR[n.cls];
      ctx.shadowColor = CLS_COLOR[n.cls]; ctx.shadowBlur = act*14;
      ctx.globalAlpha = .35 + act*.65;
      ctx.beginPath(); ctx.arc(p.x,p.y,r,0,7); ctx.fill();
      ctx.globalAlpha=1; ctx.shadowBlur=0;
      if (act>.5) { // label when strongly active
        ctx.fillStyle='rgba(220,230,255,.8)'; ctx.font='10px ui-monospace,monospace';
        ctx.fillText(n.id, p.x+7, p.y-5);
      }
    });
  },

  /* ---------- hotspots ---------- */
  drawHotspots(ctx, ts) {
    const spots = [
      {x:this.fly.x-130*this.fly.scale, y:this.fly.y-75*this.fly.scale, label:'SMELL', icon:'👄'},
      {x:this.fly.x-95*this.fly.scale, y:this.fly.y-98*this.fly.scale, label:'SEE', icon:'👁'},
      {x:this.fly.x+90*this.fly.scale, y:this.fly.y+30*this.fly.scale, label:'TOUCH', icon:'✋'},
      {x:this.fly.x-30*this.fly.scale, y:this.fly.y+62*this.fly.scale, label:'SCARE', icon:'💨'},
    ];
    const pulse = (Math.sin(ts/300)+1)/2;
    spots.forEach(sp=>{
      ctx.beginPath(); ctx.arc(sp.x,sp.y, 15+pulse*5, 0, 7);
      ctx.strokeStyle=`rgba(0,229,255,${.25+pulse*.3})`; ctx.setLineDash([4,4]); ctx.lineWidth=1.5; ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='rgba(5,7,13,.8)'; ctx.beginPath(); ctx.arc(sp.x,sp.y,13,0,7); ctx.fill();
      ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(sp.icon, sp.x, sp.y+5);
      ctx.fillStyle='rgba(127,139,173,.9)'; ctx.font='8px ui-monospace,monospace';
      ctx.fillText(sp.label, sp.x, sp.y+30); ctx.textAlign='left';
    });
  },
};

function qpoint(a,b,c,t){ const u=1-t; return u*u*a + 2*u*t*b + t*t*c; }
