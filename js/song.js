/* ============================================================
   FLYMIND song — courtship song lab.
   Visualize + synthesize the male's wing pulse-song.
   Right panel sliders feed AUDIO.buzzParams; this canvas
   draws the fly vibrating a wing, emitted pulses as expanding
   arcs, a scrolling waveform, and any "female" responders.
   ============================================================ */

const Song = {
  canvas:null, ctx:null, W:0, H:0, DPR:1,
  wave:[], pulses:[], females:[], singing:false, startedAt:0, lastIPI:0,

  init() {
    this.canvas=document.getElementById('song');
    this.ctx=this.canvas.getContext('2d');
    this.resize();window.addEventListener('resize',()=>this.resize());
    const bind=(id,key,fmt)=> {
      const el=document.getElementById(id), out=document.getElementById(id+'-v');
      el.addEventListener('input',()=>{
        AUDIO.buzzParams[key]=+el.value;
        out.textContent=fmt? fmt(el.value): el.value + (key==='rate'? '/s': key==='fem'?'':'%');
      });
    };
    bind('sg-rate','rate',v=>v+'/s');
    bind('sg-leg','leg');
    bind('sg-amp','amp');
    bind('sg-fem','fem');
    document.getElementById('btn-song-play').addEventListener('click',()=>{
      if(!AUDIO.on) { document.getElementById('btn-audio').click(); }
      this.start();
    });
    document.getElementById('btn-song-stop').addEventListener('click',()=>this.stop());
    this.loop=this.loop.bind(this);
    requestAnimationFrame(this.loop);
  },
  resize(){
    const r=this.canvas.getBoundingClientRect();
    this.DPR=Math.min(2,window.devicePixelRatio||1);
    this.W=r.width;this.H=r.height;
    this.canvas.width=this.W*this.DPR;this.canvas.height=this.H*this.DPR;
    this.ctx.setTransform(this.DPR,0,0,this.DPR,0,0);
  },
  start(){
    this.singing=true;this.startedAt=performance.now();
    if (AUDIO.on) AUDIO.startBuzz();
    this.females=[];
    const nf=AUDIO.buzzParams.fem;
    for(let i=0;i<nf;i++) this.females.push({x:this.W*.78+Math.random()*this.W*.15,y:this.H*(.3+Math.random()*.4), sway:Math.random()*7, receptive:false});
    Toast.show('P1 neurons active — <b>courtship song</b> begins');
  },
  stop(){ this.singing=false; AUDIO.stopBuzz(); document.getElementById('song-bpm').textContent='0'; },

  loop(ts){
    const ctx=this.ctx;
    ctx.clearRect(0,0,this.W,this.H);
    const singing=this.singing && AUDIO.buzzState.playing;

    /* ground */
    ctx.strokeStyle='#0d1a2e';ctx.lineWidth=1;
    for(let x=0;x<this.W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,this.H);ctx.stroke();}

    /* male fly (left, vibrating wing when singing) */
    const mx=this.W*.22,my=this.H*.5;
    drawMiniFly(ctx,mx,my,2.2, singing?ts:ts*.1);
    if(singing){
      ctx.fillStyle='rgba(255,209,102,.85)';ctx.font='11px ui-monospace,monospace';
      ctx.fillText('♂ P1→vpoDN→wing',mx-60,my+70);
    }

    /* pulses as expanding arcs */
    if (AUDIO.buzzState.playing){
      const cycles=AUDIO.buzzState.cycle;
      if (cycles!==this._lastCycle){
        this._lastCycle=cycles;
        this.pulses.push({x:mx,y:my,r:20,a:.9});
        // record IPI (matches the formula audio.js actually plays)
        this.lastIPI=((1000/AUDIO.buzzParams.rate)*(0.7+(AUDIO.buzzParams.leg/100)*0.9)).toFixed(0);
        document.getElementById('song-bpm').textContent=this.lastIPI;
        this.wave.push(1); // pulse marker
      } else { this.wave.push(Math.max(0,(this.wave[this.wave.length-1]||0)-.18)); }
    } else { this.wave.push(0); }
    if(this.wave.length>420)this.wave.shift();

    this.pulses=this.pulses.filter(p=>{
      p.r+=2.2;p.a-=.02;
      if(p.a<=0)return false;
      ctx.strokeStyle=`rgba(0,229,255,${p.a})`;ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,-.9,.9);ctx.stroke();
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,Math.PI-.9,Math.PI+.9);ctx.stroke();
      return true;
    });

    /* females */
    this.females.forEach((f,i)=>{
      const fx=f.x+Math.sin(ts/500+f.sway)*14;
      const heard=this.pulses.some(p=>Math.hypot(p.x-fx,p.y-f.y)<p.r+10);
      if(heard && !f.receptive && Math.random()<.01) f.receptive=true;
      // body
      ctx.fillStyle='#5a4a28';
      ctx.beginPath();ctx.ellipse(fx+18,f.y,20,9,0,0,7);ctx.fill();
      ctx.beginPath();ctx.ellipse(fx-6,f.y-3,11,9,0,0,7);ctx.fill();
      ctx.fillStyle='#a33';
      ctx.beginPath();ctx.arc(fx-16,f.y-6,5,0,7);ctx.fill();
      ctx.fillStyle= f.receptive?'#ffd166':'#7f8bad';
      ctx.font='11px ui-monospace,monospace';
      ctx.fillText(f.receptive? '♀ receptive ♪':'♀ ignoring',fx-8,f.y-24);
    });

    /* scrolling waveform strip at bottom */
    const wy=this.H-64, ws=this.W-80, x0=40;
    ctx.strokeStyle='#1c2740';ctx.strokeRect(x0,wy-40,ws,80);
    ctx.strokeStyle='#00e5ff';ctx.lineWidth=1.2;ctx.beginPath();
    this.wave.forEach((v,i)=>{
      const x=x0+(i/420)*ws, y=wy-v*34;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    });
    ctx.stroke();
    ctx.fillStyle='#7f8bad';ctx.font='10px ui-monospace,monospace';
    ctx.fillText('pulse song waveform (200 Hz clicks, ~35 ms IPI)',x0,wy+52);

    requestAnimationFrame(this.loop);
  },
};
