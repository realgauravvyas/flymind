/* ============================================================
   FLYMIND audio — WebAudio engine, v2.
   - ambient(): low lab drone that swells with brain activity
   - spike(): each firing neuron pings a blip (pitch by class)
   - ui(): clicks/pops for interactions
   - pulse song: layered ~200 Hz wing clicks (fundamental + 2nd
     harmonic + noise transient), ~35 ms IPI — parameters in Song Lab
   ============================================================ */

const AUDIO = {
  ctx:null, on:false, master:null,
  drone:null, droneGain:null, droneFilter:null,
  buzz:null, noiseBuf:null,
  lastSpike:0, spikeCount:0,

  ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext||window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = .5;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 6;
      this.master.connect(comp); comp.connect(this.ctx.destination);
      // shared noise buffer for wing transients
      const len = this.ctx.sampleRate * .05;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 2);
    }
    if (this.ctx.state==='suspended') this.ctx.resume();
  },

  toggle() {
    this.on = !this.on;
    if (this.on) { this.ensure(); this.startDrone(); }
    else { this.stopDrone(); this.stopBuzz(); }
    return this.on;
  },

  /* ---- ambient drone, amplitude follows brain activity ---- */
  startDrone() {
    if (!this.on || this.drone) return;
    const t = this.ctx.currentTime;
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = .0;
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type='lowpass'; this.droneFilter.frequency.value=260;
    // two detuned saws = living-machine hum
    [55, 55.7, 110.3].forEach(f=>{
      const o=this.ctx.createOscillator();
      o.type='sawtooth'; o.frequency.value=f;
      o.connect(this.droneFilter); o.start(t);
      this.drone = this.drone || []; this.drone.push(o);
    });
    this.droneFilter.connect(this.droneGain); this.droneGain.connect(this.master);
    this.droneGain.gain.linearRampToValueAtTime(.05, t+2);
  },
  stopDrone() {
    if (!this.drone) return;
    const t=this.ctx.currentTime;
    this.droneGain.gain.linearRampToValueAtTime(0, t+.3);
    const oscs=this.drone; this.drone=null;
    setTimeout(()=>oscs.forEach(o=>{try{o.stop()}catch(e){}}), 400);
  },
  setDroneLevel(act){ // called from main loop with 0..1 brain activity
    if (!this.on || !this.droneGain || !this.ctx) return;
    const target = .05 + Math.min(.16, act*1.4);
    this.droneGain.gain.setTargetAtTime(target, this.ctx.currentTime, .25);
    this.droneFilter.frequency.setTargetAtTime(260+act*900, this.ctx.currentTime, .3);
  },

  /* ---- one neuron firing → one short blip (throttled) ---- */
  spike(n) {
    if (!this.on || !this.ctx) return;
    // throttle: max ~25 blips/s — cascades would otherwise stutter audio
    const now = performance.now();
    if (now - this.lastSpike < 40) return;
    this.lastSpike = now;
    const t = this.ctx.currentTime;
    const base = {sensory:880, relay:660, learn:1320, motor:330, mod:440}[n.cls] || 600;
    const f = base * (0.85 + Math.random()*.3);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f*1.6, t+.05); // upward chirp = "activation"
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(.05*n.firing + .02, t+.004);
    g.gain.exponentialRampToValueAtTime(.0001, t+.12);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t+.13);
  },

  /* ---- UI feedback sounds ---- */
  ui(kind='click') {
    if (!this.on || !this.ctx) return;
    const t=this.ctx.currentTime;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    const f = {click:520, pop:740, whoosh:220}[kind] || 520;
    o.type='triangle';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f*1.35, t+.06);
    g.gain.setValueAtTime(.06, t);
    g.gain.exponentialRampToValueAtTime(.0001, t+.1);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t+.11);
  },

  /* ---- wing pulse song (courtship) ---- */
  buzzParams:{rate:20, leg:35, amp:60, fem:1},
  buzzState:{playing:false, nextPulse:0, cycle:0},

  startBuzz() {
    if (!this.on) return;
    this.ensure();
    this.buzzState.playing = true;
    this.buzzState.nextPulse = performance.now();
    this.buzzState.cycle = 0;
    if (!this.buzz) {
      this.buzz = requestAnimationFrame(()=>this.buzzLoop());
    }
  },
  stopBuzz() {
    this.buzzState.playing = false;
    if (this.buzz) { cancelAnimationFrame(this.buzz); this.buzz=null; }
  },
  buzzLoop() {
    if (!this.buzzState.playing) { this.buzz=null; return; }
    const now = performance.now();
    const p = this.buzzParams;
    if (now >= this.buzzState.nextPulse) {
      this.pulseOsc();
      this.buzzState.cycle++;
      // interpulse interval from pulse rate (1000/rate ms), stretched by IPI slider
      const ipi = (1000/p.rate) * (.7 + (p.leg/100)*.9);
      this.buzzState.nextPulse = now + ipi + (Math.random()*4-2);
      // occasional "females nearby" → faster, tighter song
      if (p.fem>0 && Math.random() < p.fem*.06) {
        this.buzzState.nextPulse = now + ipi*.5;
      }
    }
    this.buzz = requestAnimationFrame(()=>this.buzzLoop());
  },
  /* single wing-click: 200 Hz fundamental + harmonic + noise transient */
  pulseOsc() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const amp = (this.buzzParams.amp/100);
    // fundamental — triangle wing resonance
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type='triangle';
    o.frequency.setValueAtTime(190 + Math.random()*30, t);
    o.frequency.exponentialRampToValueAtTime(150, t+.02);
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(.20*amp, t+.001);
    g.gain.exponentialRampToValueAtTime(.001, t+.025);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t+.03);
    // 2nd harmonic — brightens the click
    const o2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    o2.type='sine';
    o2.frequency.setValueAtTime(380 + Math.random()*40, t);
    g2.gain.setValueAtTime(0,t);
    g2.gain.linearRampToValueAtTime(.07*amp, t+.001);
    g2.gain.exponentialRampToValueAtTime(.0005, t+.018);
    o2.connect(g2); g2.connect(this.master);
    o2.start(t); o2.stop(t+.02);
    // wing-beat noise transient — the "click" attack
    const ns = this.ctx.createBufferSource();
    ns.buffer = this.noiseBuf;
    const ng = this.ctx.createGain(); ng.gain.value = .10*amp;
    const nf = this.ctx.createBiquadFilter();
    nf.type='bandpass'; nf.frequency.value = 1600; nf.Q.value = 1.2;
    ns.connect(nf); nf.connect(ng); ng.connect(this.master);
    ns.start(t);
  },
};
