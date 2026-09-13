/* ============================================================
   FLYMIND main — tabs, oscilloscope, trace log, toasts, boot.
   ============================================================ */

const Toast = {
  show(html, ms=2600){
    const box=document.getElementById('toast-container');
    const t=document.createElement('div');
    t.className='toast'; t.innerHTML=html;
    box.appendChild(t);
    setTimeout(()=>{t.style.transition='opacity .4s';t.style.opacity='0';setTimeout(()=>t.remove(),400);},ms);
  }
};

/* tabs */
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-'+btn.dataset.tab).classList.add('active');
    // resize canvases that were hidden (they report 0 size while display:none)
    window.dispatchEvent(new Event('resize'));
    LearnDraw.resize(); Song.resize();
  });
});

/* brain instance + trace */
window.BRAIN = new Brain();
BRAIN.onEvent = (ev)=>{
  const trace=document.getElementById('trace');
  const ln=document.createElement('div');
  ln.className='ln '+ev.cls;
  ln.innerHTML=`<b>${(ev.t/1000).toFixed(2)}s</b><span style="color:${CLS_COLOR[NBY[ev.id].cls]}">${ev.id}</span><span>${ev.msg}</span>`;
  trace.prepend(ln);
  while(trace.children.length>60) trace.lastChild.remove();
};

/* oscilloscope */
const Scope = {
  canvas:null,ctx:null,W:0,H:0,DPR:1,_last:0,
  init(){
    this.canvas=document.getElementById('scope');
    this.ctx=this.canvas.getContext('2d');
    const r=this.canvas.getBoundingClientRect();
    this.DPR=Math.min(2,window.devicePixelRatio||1);
    this.W=r.width;this.H=r.height;
    this.canvas.width=this.W*this.DPR;this.canvas.height=this.H*this.DPR;
    this.ctx.setTransform(this.DPR,0,0,this.DPR,0,0);
    this.loop();
  },
  loop(){
    // ~30fps is plenty for the scope — saves battery
    const now=performance.now();
    if (now-this._last<33){requestAnimationFrame(()=>this.loop());return;}
    this._last=now;
    const ctx=this.ctx;
    ctx.clearRect(0,0,this.W,this.H);
    const hist=BRAIN.history;
    // grid
    ctx.strokeStyle='#141d30';ctx.lineWidth=1;
    for(let y=0;y<this.H;y+=15){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(this.W,y);ctx.stroke();}
    // trace: neural activity LFP-style
    ctx.strokeStyle='#00e5ff';ctx.lineWidth=1.5;ctx.beginPath();
    hist.forEach((v,i)=>{
      const x=(i/400)*this.W, y=this.H-8-Math.min(1,v*12)*(this.H-16);
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    });
    ctx.stroke();
    // glow line
    ctx.globalAlpha=.25;ctx.strokeStyle='#00e5ff88';ctx.lineWidth=5;ctx.stroke();ctx.globalAlpha=1;
    // feed the ambient drone the current activity level
    AUDIO.setDroneLevel(hist[hist.length-1]||0);
    requestAnimationFrame(()=>this.loop());
  }
};

/* audio toggle button */
document.getElementById('btn-audio').addEventListener('click',function(){
  const on=AUDIO.toggle();
  this.classList.toggle('on',on);
  this.innerHTML=`<svg><use href="#ic-${on?'sound':'mute'}"/></svg>`;
  Toast.show(on?'🔊 Sound on — drone + neuron spikes + wing song':' muted');
});

/* odour buttons → stimulate */
document.querySelectorAll('.stim').forEach(b=>{
  b.addEventListener('click',()=>{
    LearnState.currentOdour=b.dataset.odour;
    document.querySelectorAll('.stim').forEach(x=>x.style.borderColor='');
    b.style.borderColor='var(--acc)';
    AUDIO.ui('pop');
    Arena.stimulate('odour');
  });
});

/* UI sounds on tabs */
document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click',()=>AUDIO.ui('click'));
});

/* learn tab wiring */
document.getElementById('learn-odour-a').addEventListener('change',e=>{LearnState.odourA=e.target.value;MB.evaluate();MB.updateStats();LearnDraw.draw();});
document.getElementById('learn-odour-b').addEventListener('change',e=>{LearnState.odourB=e.target.value;MB.evaluate();MB.updateStats();LearnDraw.draw();});
document.getElementById('learn-reward').addEventListener('change',e=>{LearnState.rewarded=e.target.value;MB.evaluate();MB.updateStats();LearnDraw.draw();});
document.getElementById('btn-train').addEventListener('click',()=>{
  const od=LearnState.rewarded==='A'?LearnState.odourA:LearnState.odourB;
  LearnDraw.animateTrain(od,+1,()=>{
    MB.train(od,+1);
    Toast.show(`Trial ${MB.trials}: <b>${STIMS[od].label} + sugar</b> — PAM rewrote KC→MBON`);
    // also fire in the live brain
    BRAIN.fire('Gr5a',1); setTimeout(()=>BRAIN.fire('PAM',1),600);
  });
});
document.getElementById('btn-train-10').addEventListener('click',()=>{
  const od=LearnState.rewarded==='A'?LearnState.odourA:LearnState.odourB;
  let n=0;
  const iv=setInterval(()=>{
    MB.train(od,+1); n++;
    LearnDraw.draw();
    if(n>=10){clearInterval(iv);Toast.show('10 trials done — see the memory bars split');BRAIN.fire('Gr5a',1);}
  },120);
});
document.getElementById('btn-test').addEventListener('click',()=>{
  MB.evaluate();MB.updateStats();
  LearnDraw.animateTest();
  const goA=MB.tiltA>MB.tiltB;
  Toast.show(`Free choice: fly walks to <b>${goA?'odour A':'odour B'}</b>`);
});
document.getElementById('btn-reset-learn').addEventListener('click',()=>{
  MB.reset();Toast.show('Mushroom body memory wiped — newborn fly');
});

/* boot */
window.addEventListener('DOMContentLoaded',()=>{
  MB.init();
  Arena.init();
  Explore.init();
  LearnDraw.init();
  Song.init();
  Scope.init();
  // default odour button highlight
  document.querySelector('.stim[data-odour="vinegar"]').style.borderColor='var(--acc)';
  // welcome
  setTimeout(()=>Toast.show('Welcome! Click the dashed circles to stimulate the fly\'s senses 🧠',4000),600);
});
