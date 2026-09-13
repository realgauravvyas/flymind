/* ============================================================
   FLYMIND brain — tiny event-driven neural engine.
   Sensory trigger → wavefront propagation through synapses
   with delays ∝ 1/weight, inhibitory veto, and activity trace.
   ============================================================ */

class Brain {
  constructor() {
    this.reset();
    this.listeners = [];
  }
  reset() {
    NEURONS.forEach(n => { n.firing = 0; n.flash = 0; });
    this.queue = [];          // [time, neuronId, strength]
    this.time = 0;
    this.history = [];        // ring buffer of activity levels
    this.events = [];         // trace log entries
    this.onEvent = null;
  }
  fire(id, strength=1) {
    this.queue.push({t:this.time, id, s:strength});
  }
  step(dt=16) {
    this.time += dt;
    // decay
    NEURONS.forEach(n => {
      n.flash = Math.max(0, n.flash - dt/300);
      n.firing = n.firing * Math.pow(.5, dt/220); // half-life ~220ms
    });
    // process due events
    const delayScale = 60; // ms per unit weight^-1
    while (this.queue.length && this.queue[0].t <= this.time) {
      // find the earliest (queue not sorted when pushed at same time; sort lazily)
      this.queue.sort((a,b)=>a.t-b.t);
      const ev = this.queue.shift();
      const n = NBY[ev.id];
      if (!n) continue;
      if (ev.s < 0.06) continue; // signal died out — stops endless ping-pong (e.g. P1↔pCd)
      // inhibitory input
      const inh = IN[ev.id].some(sy => sy.t==='i' && NBY[sy.from].firing > .35);
      if (inh) {
        this.log(ev.id, 'vetoed (inh.)', 'i');
        continue;
      }
      n.firing = Math.min(1, n.firing + ev.s * (n.cls==='sensory' ? 1 : .8));
      n.flash = 1;
      this.log(ev.id, 'fires', 'e');
      if (typeof AUDIO !== 'undefined' && AUDIO.on) AUDIO.spike(n);
      // propagate (strength decays by weight each hop — cascades die out naturally)
      OUT[ev.id].forEach(sy => {
        const strength = ev.s * sy.w;
        this.queue.push({t:this.time + delayScale*(1.1-sy.w), id:sy.to, s:strength});
      });
    }
    // global activity
    const act = NEURONS.reduce((a,n)=>a+n.firing,0)/NEURONS.length;
    this.history.push(act);
    if (this.history.length > 400) this.history.shift();
    return act;
  }
  log(id, msg, cls='s') {
    if (this.onEvent) this.onEvent({id, msg, cls, t:this.time, label:NBY[id].label});
  }
  activityHz() {
    return (this.history.slice(-30).reduce((a,b)=>a+b,0)/Math.max(1,Math.min(30,this.history.length))*60).toFixed(0);
  }
}
