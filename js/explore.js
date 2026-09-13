/* ============================================================
   FLYMIND explore — connectome explorer.
   Force-directed layout of the neuron graph, pan/zoom,
   search, node inspector, BFS shortest pathway animation.
   ============================================================ */

const Explore = {
  canvas:null, ctx:null, W:0, H:0, DPR:1,
  nodes:[], links:[], sim:null, running:false,
  cam:{x:0,y:0,z:1},
  selected:null, pathFrom:null, pathAnim:[],
  hoverNode:null, dragging:false, dragNode:null,
  lastSearch:'',

  init() {
    this.canvas=document.getElementById('graph');
    this.ctx=this.canvas.getContext('2d');
    this.resize(); window.addEventListener('resize',()=>this.resize());
    this.build();
    this.canvas.addEventListener('pointerdown',e=>this.pdown(e));
    this.canvas.addEventListener('pointermove',e=>this.pmove(e));
    this.canvas.addEventListener('pointerup',e=>this.pup(e));
    this.canvas.addEventListener('wheel',e=>this.pzoom(e),{passive:false});
    const search=document.getElementById('search');
    search.addEventListener('input',()=>this.search());
    document.getElementById('btn-path-clear').addEventListener('click',()=>{this.pathFrom=null;this.pathAnim=[];document.getElementById('btn-path-clear').classList.add('hidden')});
    this.loop=this.loop.bind(this);
    requestAnimationFrame(this.loop);
  },

  resize() {
    const r=this.canvas.getBoundingClientRect();
    this.DPR=Math.min(2,window.devicePixelRatio||1);
    const w=Math.max(300, r.width), h=Math.max(300, r.height);
    if (this.W===w && this.H===h) return;   // skip no-op resizes
    this.W=w;this.H=h;
    this.canvas.width=this.W*this.DPR;this.canvas.height=this.H*this.DPR;
    this.ctx.setTransform(this.DPR,0,0,this.DPR,0,0);
  },

  /* build force-directed graph */
  build() {
    // nodes seeded at their region position + jitter
    this.nodes = NEURONS.map(n=>({
      id:n.id, cls:n.cls, r:n.r, label:n.label, role:n.role,
      x:this.W*.5 + (Math.random()-.5)*300, y:this.H*.5 + (Math.random()-.5)*300,
      vx:0, vy:0, deg:OUT[n.id].length + IN[n.id].length,
    }));
    this.links = SYNAPSES.map(s=>({s, a:this.nodes.find(n=>n.id===s.from), b:this.nodes.find(n=>n.id===s.to)}));
    // pre-run simulation to settle
    for (let i=0;i<220;i++) this.simStep();
  },

  simStep() {
    const N=this.nodes, L=this.links, k=1600, rest=95;
    // repulsion
    for (let i=0;i<N.length;i++) for (let j=i+1;j<N.length;j++) {
      const a=N[i],b=N[j];
      let dx=b.x-a.x, dy=b.y-a.y, d2=dx*dx+dy*dy+40, d=Math.sqrt(d2);
      const f=k/d2;
      dx/=d;dy/=d;
      a.vx-=f*dx; a.vy-=f*dy;
      b.vx+=f*dx; b.vy+=f*dy;
    }
    // springs
    L.forEach(l=>{
      let dx=l.b.x-l.a.x, dy=l.b.y-l.a.y, d=Math.hypot(dx,dy)||1;
      const f=(d-rest)*.012;
      dx/=d;dy/=d;
      l.a.vx+=f*dx;l.a.vy+=f*dy;
      l.b.vx-=f*dx;l.b.vy-=f*dy;
    });
    // centering
    N.forEach(n=>{
      n.vx+=(this.W*.5-n.x)*.002; n.vy+=(this.H*.5-n.y)*.002;
      n.vx*=.85;n.vy*=.85;
      if(!n.fixed){ n.x+=n.vx; n.y+=n.vy; }
    });
  },

  /* ---------- interactions ---------- */
  toWorld(mx,my){ return {x:(mx-this.W/2)/this.cam.z+this.cam.x, y:(my-this.H/2)/this.cam.z+this.cam.y}; },

  pdown(e){
    const r=this.canvas.getBoundingClientRect();
    const mx=e.clientX-r.left,my=e.clientY-r.top;
    const w=this.toWorld(mx,my);
    const hit=this.nodes.find(n=>Math.hypot(n.x-w.x,n.y-w.y)<14);
    if (hit){
      if (this.selected && this.selected!==hit && e.shiftKey===false && this.pathFrom) {
        // second pick for path
        this.tracePath(this.pathFrom, hit); this.pathFrom=null; return;
      }
      if (this.selected && this.selected!==hit && (e.ctrlKey||e.metaKey)) { this.tracePath(this.selected,hit); return; }
      this.selected=hit; this.pathFrom = this.selected; // ready for next click
      this.showCard(hit); this.searchSilence();
    } else {
      this.dragging=true; this.selected=null; this.pathFrom=null; this.pathAnim=[];
      document.getElementById('node-card').style.display='none';
      document.getElementById('btn-path-clear').classList.add('hidden');
    }
    this.dragNode=hit||null;
    this._drag={mx,my};
  },
  pmove(e){
    const r=this.canvas.getBoundingClientRect();
    const mx=e.clientX-r.left,my=e.clientY-r.top;
    if (this.dragNode){
      const w=this.toWorld(mx,my);
      this.dragNode.x=w.x;this.dragNode.y=w.y;this.dragNode.fixed=true;
    } else if (this.dragging){
      this.cam.x-=(mx-this._drag.mx)/this.cam.z; this.cam.y-=(my-this._drag.my)/this.cam.z;
      this._drag={mx,my};
    } else {
      const w=this.toWorld(mx,my);
      this.hoverNode=this.nodes.find(n=>Math.hypot(n.x-w.x,n.y-w.y)<14) || null;
      this.canvas.style.cursor=this.hoverNode?'pointer':'grab';
    }
  },
  pup(){ this.dragging=false; if(this.dragNode){this.dragNode.fixed=false;} this.dragNode=null; },
  pzoom(e){
    e.preventDefault();
    const r=this.canvas.getBoundingClientRect();
    const mx=e.clientX-r.left,my=e.clientY-r.top;
    const before=this.toWorld(mx,my);
    this.cam.z=Math.min(3.5,Math.max(.35,this.cam.z*(e.deltaY<0?1.1:.9)));
    const after=this.toWorld(mx,my);
    this.cam.x+=before.x-after.x; this.cam.y+=before.y-after.y;
  },

  /* search */
  search(){
    const q=document.getElementById('search').value.trim().toLowerCase();
    const box=document.getElementById('search-results');
    if(!q){box.innerHTML='';return;}
    const hits=NEURONS.filter(n=>(n.id+' '+n.label+' '+n.role+' '+(n.r||'')).toLowerCase().includes(q)).slice(0,12);
    box.innerHTML='';
    hits.forEach(h=>{
      const d=document.createElement('div');d.className='result';
      d.innerHTML=`<b style="color:var(--acc)">${h.id}</b> <small>${h.label} · ${REGION[h.r].name}</small>`;
      d.onclick=()=>{ this.focusNode(h.id); };
      box.appendChild(d);
    });
    if(!hits.length) box.innerHTML='<div class="result" style="opacity:.5">no match…</div>';
  },
  searchSilence(){ document.getElementById('search-results').innerHTML=''; },

  focusNode(id){
    const n=this.nodes.find(x=>x.id===id);
    if(!n)return;
    this.selected=n;this.pathFrom=n;this.showCard(n);
    this.cam.x=n.x;this.cam.y=n.y;this.cam.z=Math.max(this.cam.z,1.4);
  },

  showCard(n){
    const card=document.getElementById('node-card');
    const outs=OUT[n.id].map(s=>`→ <b style="color:${CLS_COLOR[NBY[s.to].cls]}">${s.to}</b> ${s.t==='e'?'✚':'－'}${Math.round(s.w*99)}`).join('<br>') || '—';
    const ins=IN[n.id].map(s=>`← <b style="color:${CLS_COLOR[NBY[s.from].cls]}">${s.from}</b> ${s.t==='e'?'✚':'－'}${Math.round(s.w*99)}`).join('<br>') || '—';
    card.innerHTML=`
      <h4>${n.id}</h4>
      <span class="tag" style="color:${CLS_COLOR[n.cls]};border-color:${CLS_COLOR[n.cls]}55">${CLS_NAME[n.cls]}</span>
      <span class="tag">${REGION[n.r].name}</span>
      <span class="tag">${n.deg} synapses</span>
      <p>${n.role||''}</p>
      <p class="connline" style="margin-top:8px">${outs}</p>
      <p class="connline" style="margin-top:8px">${ins}</p>
      <p class="muted" style="margin-top:10px;font-size:10px">click another neuron (or ctrl+click) to trace a pathway between them</p>`;
    card.style.display='block';
    document.getElementById('btn-path-clear').classList.remove('hidden');
  },

  /* BFS shortest path */
  tracePath(a,b){
    const prev={}, seen=new Set([a.id]), q=[a.id];
    while(q.length){
      const cur=q.shift();
      if(cur===b.id)break;
      for(const s of OUT[cur]){ if(!seen.has(s.to)){seen.add(s.to);prev[s.to]=cur;q.push(s.to);} }
      for(const s of IN[cur]){ if(!seen.has(s.from)){seen.add(s.from);prev[s.from]=cur;q.push(s.from);} } // allow tracing upstream too
    }
    if(!prev[b.id] && a.id!==b.id){ Toast.show('no path found'); return; }
    const path=[b.id]; let c=b.id;
    while(prev[c]){ c=prev[c]; path.unshift(c); }
    this.pathAnim={path, t0:performance.now(), dur: 400+path.length*350};
    Toast.show(`signal path: <b>${path.join(' → ')}</b>`);
  },

  /* ---------- draw ---------- */
  loop(){
    this.simStep();
    const ctx=this.ctx;
    ctx.clearRect(0,0,this.W,this.H);
    ctx.save();
    ctx.translate(this.W/2,this.H/2); ctx.scale(this.cam.z,this.cam.z); ctx.translate(-this.cam.x,-this.cam.y);

    // links
    this.links.forEach(l=>{
      const active = window.BRAIN && NBY[l.s.from].firing>.1;
      const onPath = this.pathAnim.path && this.pathAnim.path.includes(l.s.from) && this.pathAnim.path.includes(l.s.to)
        && Math.abs(this.pathAnim.path.indexOf(l.s.from)-this.pathAnim.path.indexOf(l.s.to))===1;
      ctx.strokeStyle = onPath ? '#ffd166'
        : active ? `rgba(0,229,255,${Math.min(.6,NBY[l.s.from].firing)})`
        : l.s.t==='e' ? '#1c2740' : '#331826';
      ctx.lineWidth = onPath?2.5 : active?1.5 : .8;
      ctx.beginPath();ctx.moveTo(l.a.x,l.a.y);ctx.lineTo(l.b.x,l.b.y);ctx.stroke();
      // arrow head
      const ang=Math.atan2(l.b.y-l.a.y,l.b.x-l.a.x);
      const ax=l.a.x+Math.cos(ang)*(14), ay=l.a.y+Math.sin(ang)*(14);
      ctx.save();ctx.translate(ax,ay);ctx.rotate(ang);
      ctx.fillStyle = onPath?'#ffd166':'#223352';
      ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(-3,-2.5);ctx.lineTo(-3,2.5);ctx.closePath();ctx.fill();
      ctx.restore();
    });

    // path pulse
    if (this.pathAnim.path){
      const {path,t0,dur}=this.pathAnim;
      const t=Math.min(1,(performance.now()-t0)/dur);
      const idx=t*(path.length-1);
      const i0=Math.floor(idx), fr=idx-i0;
      if(i0<path.length-1){
        const a=this.nodes.find(n=>n.id===path[i0]), b=this.nodes.find(n=>n.id===path[i0+1]);
        const px=a.x+(b.x-a.x)*fr, py=a.y+(b.y-a.y)*fr;
        ctx.fillStyle='#ffd166'; ctx.shadowColor='#ffd166'; ctx.shadowBlur=12;
        ctx.beginPath();ctx.arc(px,py,5,0,7);ctx.fill();ctx.shadowBlur=0;
      } else { this.pathAnim=[]; }
    }

    // nodes
    this.nodes.forEach(n=>{
      const firing = window.BRAIN ? NBY[n.id].firing : 0;
      const r = 4 + Math.min(5, n.deg*.45) + firing*4;
      const isSel=this.selected===n, isHov=this.hoverNode===n;
      ctx.fillStyle=CLS_COLOR[n.cls];
      ctx.globalAlpha=.28+firing*.72;
      if(isSel||isHov){ctx.shadowColor=CLS_COLOR[n.cls];ctx.shadowBlur=16;}
      ctx.beginPath();ctx.arc(n.x,n.y,r,0,7);ctx.fill();
      ctx.shadowBlur=0;ctx.globalAlpha=1;
      if(isSel){ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();}
      if(this.cam.z>1.15||isSel||isHov||firing>.4){
        ctx.fillStyle=isSel?'#fff':'rgba(220,230,255,.75)';
        ctx.font=`${isSel?'600 ':''}9.5px ui-monospace,monospace`;
        ctx.fillText(n.id,n.x+r+4,n.y+3);
      }
    });

    ctx.restore();
    requestAnimationFrame(this.loop);
  },
};
