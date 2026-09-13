/* ============================================================
   FLYMIND learn — playable mushroom body.
   Model: odour → KC activation pattern (sparse barcode) →
   MBON_a (approach) & MBON_b (avoid) via plastic weights.
   DANs (PAM reward / PPL1 punish) apply reward-modulated
   depression at active KC→MBON synapses — the rule the real
   fly MB uses (Olsen & Wilson; Owald & Waddell reviews).
   ============================================================ */

const LearnState = {
  odourA:'vinegar', odourB:'geosmin', rewarded:'A',
  trials:0, history:[], currentOdour:'vinegar',
};

const MB = {
  NKC: 42,                    // Kenyon cells shown (real fly: ~2000)
  kcPatterns:{},              // odour → bool[42]
  wA:[], wB:[],               // KC→MBON weights
  tiltA:0, tiltB:0,           // running MBON outputs
  perf:0.5,

  init(){
    ['vinegar','phenyl','geosmin','co2'].forEach((od,oi)=>{
      const pat=new Array(this.NKC).fill(false);
      // ~25% sparse code per odour, deterministic-ish for stability
      let seed=oi*137+7;
      for(let i=0;i<this.NKC;i++){
        seed=(seed*1103515245+12345)&0x7fffffff;
        if(seed%100<25) pat[i]=true;
      }
      this.kcPatterns[od]=pat;
    });
    this.reset();
  },
  reset(){
    this.wA=new Array(this.NKC).fill(1);
    this.wB=new Array(this.NKC).fill(1);
    this.trials=0; this.tiltA=0; this.tiltB=0; this.perf=.5;
    LearnState.trials=0; LearnState.history=[];
    this.updateStats();
    LearnDraw.draw();
  },

  kcActive(od){ return this.kcPatterns[od].map(v=>v?1:0); },

  /* present odour → MBON outputs (before learning) */
  present(od){
    const kc=this.kcActive(od);
    let a=0,b=0;
    for(let i=0;i<this.NKC;i++){ a+=kc[i]*this.wA[i]; b+=kc[i]*this.wB[i]; }
    return {a,b};
  },

  /* one training trial: odour + sugar or shock */
  train(od, reward){ // reward: +1 sugar, -1 shock
    const kc=this.kcActive(od);
    // dopamine-gated depression of ACTIVE synapses, as in the real MB:
    // sugar (PAM) weakens KC→MBON_b (avoidance)  → net approach to the odour
    // shock (PPL1) weakens KC→MBON_a (approach)  → net avoidance
    for(let i=0;i<this.NKC;i++){
      if(!kc[i]) continue;
      if(reward>0){ this.wB[i]*= (1-0.28); }
      else        { this.wA[i]*= (1-0.28); }
    }
    LearnState.trials++; this.trials++;
    // performance index on test (choice A vs B)
    this.evaluate();
    this.updateStats();
    LearnDraw.draw();
  },
  evaluate(){
    const pa=this.present(LearnState.odourA), pb=this.present(LearnState.odourB);
    // fly approaches odour with higher (a - b)
    const scoreA=pa.a-pa.b, scoreB=pb.a-pb.b;
    const rewardedIsA = LearnState.rewarded==='A';
    // correct if the rewarded odour scores higher preference
    const correct = rewardedIsA ? (scoreA>scoreB) : (scoreB>scoreA);
    const mag=Math.abs(scoreA-scoreB)/Math.max(1e-6,Math.abs(scoreA)+Math.abs(scoreB));
    this.perf=correct? .5+mag*.5 : .5-mag*.5;
    this.tiltA=scoreA; this.tiltB=scoreB;
  },
  tiltFor(od){
    const p=this.present(od);
    const t=(p.a-p.b)/Math.max(1e-6,Math.abs(p.a)+Math.abs(p.b));
    return Math.max(-1,Math.min(1,t)); // >0 approach, <0 avoid
  },
  updateStats(){
    document.getElementById('ls-trials').textContent=this.trials;
    document.getElementById('ls-perf').textContent=(Math.max(0,Math.min(1,this.perf))*100).toFixed(0)+'%';
    // normalized preference for odour A on the last evaluation, in [-1, +1]
    const norm=(this.tiltA-this.tiltB)/Math.max(1e-6,Math.abs(this.tiltA)+Math.abs(this.tiltB));
    document.getElementById('ls-mbon').textContent=(norm>=0?'+':'')+norm.toFixed(2);
  },
};

/* ---------------- drawing ---------------- */
const LearnDraw = {
  canvas:null,ctx:null,W:0,H:0,DPR:1,
  flyX:null, choiceAnim:null,

  init(){
    this.canvas=document.getElementById('learn');
    this.ctx=this.canvas.getContext('2d');
    this.resize();window.addEventListener('resize',()=>this.resize());
    this.draw();
  },
  resize(){
    const r=this.canvas.getBoundingClientRect();
    this.DPR=Math.min(2,window.devicePixelRatio||1);
    this.W=r.width;this.H=r.height;
    this.canvas.width=this.W*this.DPR;this.canvas.height=this.H*this.DPR;
    this.ctx.setTransform(this.DPR,0,0,this.DPR,0,0);
    this.draw();
  },

  /* animate a training trial: odour puff into MB, DAN flash, weight shift */
  animateTrain(od, reward, done){
    const stages=[
      {t:0,   msg:'odour puff → KC barcode'},
      {t:600, msg: reward>0?'sugar! PAM dopamine floods MB':'shock! PPL1 dopamine floods MB'},
      {t:1400,msg:'synapses rewritten…'},
    ];
    stages.forEach(s=>setTimeout(()=>Toast.show(s.msg),s.t));
    setTimeout(()=>{ done&&done(); this.draw(); },2100);
  },

  /* free-choice test animation: fly walks to one of two odour ports */
  animateTest(){
    const pa=MB.present(LearnState.odourA), pb=MB.present(LearnState.odourB);
    const goA=(pa.a-pa.b)>(pb.a-pb.b);
    this.choiceAnim={t0:performance.now(), goA, dur:2400};
    const step=()=>{ this.draw(); if(this.choiceAnim&&performance.now()-this.choiceAnim.t0<this.choiceAnim.dur){requestAnimationFrame(step);} else{this.choiceAnim=null;this.draw();} };
    requestAnimationFrame(step);
  },

  draw(){
    const ctx=this.ctx; if(!ctx)return;
    ctx.clearRect(0,0,this.W,this.H);
    const W=this.W,H=this.H;

    /* --- odour ports (test arena) --- */
    const portY=H-46, portAx=W*.3, portBx=W*.7;
    [['A',LearnState.odourA,portAx],['B',LearnState.odourB,portBx]].forEach(([k,od,x])=>{
      const isRewarded = (k==='A')===(LearnState.rewarded==='A');
      ctx.fillStyle='#0d1322';ctx.strokeStyle='#1c2740';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.roundRect(x-52,portY-18,104,36,8);ctx.fill();ctx.stroke();
      ctx.fillStyle='#7f8bad';ctx.font='10px ui-monospace,monospace';ctx.textAlign='center';
      ctx.fillText(`${k} · ${STIMS[od].label}`,x,portY+4);
      if(isRewarded){ ctx.fillStyle='#3ddc97';ctx.fillText('sugar',x,portY-24); }
      else { ctx.fillStyle='#ff5470';ctx.fillText('shock',x,portY-24); }
      ctx.textAlign='left';
    });

    /* --- choice animation: little fly walks to a port --- */
    if(this.choiceAnim){
      const {t0,goA,dur}=this.choiceAnim;
      const t=Math.min(1,(performance.now()-t0)/dur);
      const ease=t*t*(3-2*t);
      const tx=goA?portAx:portBx;
      const fx=W*.5+(tx-W*.5)*ease, fy=portY-40*Math.sin(Math.PI*t);
      drawMiniFly(ctx,fx,fy,1, t*10);
      ctx.fillStyle='#ffd166';ctx.font='11px ui-monospace,monospace';
      ctx.fillText(goA?'→ chooses A (approach)':'→ chooses B (approach)',W*.5-60,30);
    }

    /* --- mushroom body diagram --- */
    const mbx=W*.5, mby=H*.42;
    // calyx (input)
    ctx.strokeStyle='#ffd16655';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(mbx-120,mby,34,0,7);ctx.stroke();
    ctx.fillStyle='#7f8bad';ctx.font='10px ui-monospace,monospace';
    ctx.fillText('calyx (PN→KC)',mbx-165,mby-44);
    // Kenyon cells
    const n=MB.NKC, span=Math.min(160,H*.52);
    for(let i=0;i<n;i++){
      const ky=mby-span/2+ (i/(n-1))*span;
      const active=MB.kcPatterns[LearnState.odourA][i]||MB.kcPatterns[LearnState.odourB][i];
      ctx.strokeStyle=active?'#ffd166':'#3a2f14';ctx.lineWidth=active?1.4:1;
      ctx.beginPath();ctx.moveTo(mbx-90,ky);
      ctx.quadraticCurveTo(mbx-40,ky,mbx-6,ky);ctx.stroke();
      // to MBONs
      ctx.strokeStyle=`rgba(61,220,151,${MB.wA[i]*.5})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(mbx-6,ky);ctx.quadraticCurveTo(mbx+30,mky(i,H,span,mby),mbx+70,mby-40);ctx.stroke();
      ctx.strokeStyle=`rgba(255,84,112,${MB.wB[i]*.5})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(mbx-6,ky);ctx.quadraticCurveTo(mbx+30,mky(i,H,span,mby),mbx+70,mby+40);ctx.stroke();
    }
    ctx.fillStyle='#ffd166';ctx.font='10px ui-monospace,monospace';
    ctx.fillText('Kenyon (sparse code)',mbx-70,mby-span/2-10);
    // MBONs
    ctx.fillStyle='#3ddc97';ctx.beginPath();ctx.arc(mbx+70,mby-40,8,0,7);ctx.fill();
    ctx.fillText('MBON-a approach',mbx+84,mby-36);
    ctx.fillStyle='#ff5470';ctx.beginPath();ctx.arc(mbx+70,mby+40,8,0,7);ctx.fill();
    ctx.fillText('MBON-b avoid',mbx+84,mby+44);
    // DANs
    ctx.fillStyle='#ff6bcb';
    ctx.beginPath();ctx.arc(mbx+70,mby-70,7,0,7);ctx.fill();
    ctx.fillText('PAM (sugar→reward)',mbx+84,mby-66);
    ctx.beginPath();ctx.arc(mbx+70,mby+70,7,0,7);ctx.fill();
    ctx.fillText('PPL1 (shock→punish)',mbx+84,mby+74);

    /* --- weight bars (the memory) --- */
    const bx=W-150, by=20, bw=120, bh=H-120;
    ctx.fillStyle='#7f8bad';ctx.font='10px ui-monospace,monospace';
    ctx.fillText('KC→MBON memory',bx,by-6);
    for(let i=0;i<n;i++){
      const yy=by+(i/(n-1))*(bh-20);
      const va=MB.wA[i]/2.2*bw, vb=MB.wB[i]/2.2*bw;
      ctx.fillStyle='#3ddc97';ctx.fillRect(bx,yy,va,2.5);
      ctx.fillStyle='#ff5470';ctx.fillRect(bx,yy+3,vb,2.5);
    }
    ctx.fillStyle='#3ddc97';ctx.fillText('→a',bx+bw+8,by+10);
    ctx.fillStyle='#ff5470';ctx.fillText('→b',bx+bw+8,by+22);
  },
};

function mky(i,H,span,mby){ return mby-span/2+(i/(MB.NKC-1))*span; }

function drawMiniFly(ctx,x,y,s,t){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  const wob=Math.sin((t||0)*.35)*.5;
  ctx.fillStyle='rgba(180,220,255,.2)';
  ctx.save();ctx.rotate(-.4+wob*.3);
  ctx.beginPath();ctx.ellipse(-30,-14,34,10,-.3,0,7);ctx.fill();ctx.restore();
  ctx.fillStyle='#4a3418';
  ctx.beginPath();ctx.ellipse(30,4,26,12,0,0,7);ctx.fill();
  ctx.beginPath();ctx.ellipse(-6,-2,16,13,0,0,7);ctx.fill();
  ctx.fillStyle='#8c1f10';
  ctx.beginPath();ctx.arc(-30,-12,7,0,7);ctx.fill();
  ctx.restore();
}
