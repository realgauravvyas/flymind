// FLYMIND pixel-audit playthrough: the browser plays the game AND
// verifies what's actually drawn by sampling canvas pixels.
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const WS = require('ws');

const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server = http.createServer((req,res)=>{
  const p = path.join(ROOT, req.url==='/'?'index.html':req.url.split('?')[0]);
  fs.readFile(p,(e,d)=>{ e?(res.writeHead(404),res.end()):(res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'text/plain'}),res.end(d)); });
});

const getJSON = url=>new Promise((res,rej)=>{ http.get(url,r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>res(JSON.parse(b)));}).on('error',rej); });

async function main(){
  await new Promise(r=>server.listen(8124,r));
  const targets = await getJSON('http://localhost:9222/json');
  const ws = new WS(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  let id=0; const pending=new Map(); const handlers=[];
  const send=(method,params={})=>new Promise((res,rej)=>{const i=++id;pending.set(i,{res,rej});ws.send(JSON.stringify({id:i,method,params}));});
  ws.on('message',m=>{const msg=JSON.parse(m);
    if(msg.id&&pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p.rej(new Error(msg.error.message)):p.res(msg.result);}
    else if(msg.method){handlers.forEach(h=>h(msg));}});
  await new Promise(r=>ws.on('open',r));
  const logs=[]; let pass=0, fail=0;
  const ok=(cond,name)=>{ cond?pass++:fail++; console.log(`  ${cond?'✅':'❌'} ${name}`); };

  send('Runtime.enable'); send('Page.enable');
  handlers.push(msg=>{
    if(msg.method==='Runtime.exceptionThrown'){const d=msg.params.exceptionDetails;logs.push(`[EXCEPTION] ${d.text} ${d.exception?.description||''}`);}
    if(msg.method==='Runtime.consoleAPICalled'&&msg.params.type==='error'){logs.push('[error] '+(msg.params.args||[]).map(a=>a.value||a.description||'').join(' '));}
  });

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const evalJS=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const click=async(x,y)=>{for(const t of['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type:t,x,y,button:'left',clickCount:1});};
  const shot=async n=>{const{data}=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(ROOT,'..','temp','shots',n+'.png'),Buffer.from(data,'base64'));console.log('  📸',n);};

  // big proper desktop viewport
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://localhost:8124/'});
  await sleep(3500);

  ok(await evalJS(`typeof BRAIN!=='undefined'&&typeof Arena!=='undefined'&&NEURONS.length>0`),'app booted, globals alive');
  ok(await evalJS(`(()=>{const c=document.getElementById('arena');return c.width>500&&c.height>400;})()`),'arena canvas sized (not hidden-tab zero)');

  // ---- pixel helper: count non-background pixels in a canvas region ----
  const pixelAudit = async (canvasId, region)=>{
    return await evalJS(`(()=>{
      const c=document.getElementById('${canvasId}');
      const x=c.getContext('2d');
      const r=${JSON.stringify(region)};
      const d=x.getImageData(r.x,r.y,r.w,r.h).data;
      let lit=0, colorful=0;
      for(let i=0;i<d.length;i+=4){
        const R=d[i],G=d[i+1],B=d[i+2];
        if(R>25||G>25||B>25) lit++;
        if((Math.abs(R-G)>40||Math.abs(G-B)>40)) colorful++;
      }
      return {lit,colorful,total:d.length/4};
    })()`);
  };

  console.log('\n=== ARENA: visual gameplay audit ===');
  // baseline: fly drawn at all? sample center strip where body should be
  const before = await pixelAudit('arena',{x:500,y:350,w:440,h:200});
  ok(before.lit>2000,`fly body drawn (${before.lit} lit px of ${before.total})`);

  // fire vinegar → approach + neurons must light up (colorful pixels near head/brain area)
  const btn=await evalJS(`(()=>{const b=document.querySelector('.stim[data-odour=\\'vinegar\\']');const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await click(btn.x,btn.y);
  await sleep(600); // mid-cascade — neurons must be visibly firing NOW
  const during=await pixelAudit('arena',{x:300,y:150,w:300,h:250});
  ok(during.colorful>300,`neural activity visible mid-cascade (${during.colorful} colored px)`);
  const firedNow=await evalJS(`NEURONS.filter(n=>n.firing>0.05||n.flash>0.05).map(n=>n.id).join(',')`);
  ok(firedNow.includes('Or42b')&&firedNow.includes('V_PN'),`real neurons fired mid-cascade: ${firedNow}`);
  await sleep(2800); // let approach animation finish completely
  const traceN=await evalJS(`document.getElementById('trace').children.length`);
  ok(traceN>5,`circuit trace logging (${traceN} entries)`);

  // behaviour: fly moved toward odour (left) during approach
  const flyX=await evalJS(`Arena.fly.x`);
  ok(flyX<720,`fly approached odour (x=${Math.round(flyX)} < 720 home)`);

  // geosmin → avoid (moves right/away) — fresh, no competing animation
  const g=await evalJS(`(()=>{const b=document.querySelector('.stim[data-odour=\\'geosmin\\']');const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await click(g.x,g.y);
  await sleep(500);
  const stateG=await evalJS(`Arena.state`);
  const avoidX=await evalJS(`Arena.fly.x`);
  ok(stateG==='avoid'&&avoidX>flyX+3,`geosmin → AVOID state, fly fled (x: ${Math.round(flyX)} → ${Math.round(avoidX)})`);
  await sleep(2200);
  await shot('arena-vinegar-then-geosmin');

  // scare → jump (fly goes up)
  const preY=await evalJS(`Arena.fly.y`);
  const scare=await evalJS(`(()=>{const r=document.getElementById('arena').getBoundingClientRect();const f=Arena.fly;return{x:r.left+f.x-30,y:r.top+f.y+62};})()`);
  await click(scare.x,scare.y);
  await sleep(300);
  const midY=await evalJS(`Arena.fly.y`);
  ok(midY<preY-4,`giant-fibre jump! fly leapt (y: ${Math.round(preY)} → ${Math.round(midY)})`);
  await sleep(2000);

  console.log('\n=== EXPLORE: graph audit ===');
  const t2=await evalJS(`(()=>{const b=document.querySelector('[data-tab=\\'explore\\']');const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await click(t2.x,t2.y); await sleep(1800);
  const gOk=await pixelAudit('graph',{x:400,y:200,w:600,h:500});
  ok(gOk.lit>400,`graph drawn (${gOk.lit} lit px)`);
  const spread=await evalJS(`(()=>{const xs=Explore.nodes.map(n=>n.x);return Math.max(...xs)-Math.min(...xs);})()`);
  ok(spread>300,`force layout spread out (${Math.round(spread)}px range)`);
  // search + pathway trace
  await evalJS(`document.getElementById('search').value='MBON';document.getElementById('search').dispatchEvent(new Event('input'))`);
  await sleep(600);
  const sr=await evalJS(`document.getElementById('search-results').children.length`);
  ok(sr>=2,`search finds MBONs (${sr} hits)`);
  await evalJS(`Explore.tracePath(Explore.nodes.find(n=>n.id==='Or42b'),Explore.nodes.find(n=>n.id==='TTMn'))`);
  await sleep(500);
  const pathLen=await evalJS(`Explore.pathAnim.path?Explore.pathAnim.path.length:0`);
  ok(pathLen>=3,`pathway traced through ${pathLen} neurons`);
  await shot('explore-pathway');

  console.log('\n=== LEARN: audit ===');
  const t3=await evalJS(`(()=>{const b=document.querySelector('[data-tab=\\'learn\\']');const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await click(t3.x,t3.y); await sleep(1400);
  const lBefore=await pixelAudit('learn',{x:50,y:50,w:600,h:280});
  ok(lBefore.lit>1000,`MB diagram drawn (${lBefore.lit} lit px)`);
  const stats1=await evalJS(`({t:MB.trials,perf:document.getElementById('ls-perf').textContent,tilt:document.getElementById('ls-mbon').textContent})`);
  console.log('  before:',stats1);
  await evalJS(`(()=>{for(let i=0;i<10;i++)MB.train(LearnState.odourA,+1);MB.evaluate();MB.updateStats();LearnDraw.draw();})()`);
  await sleep(600);
  const stats2=await evalJS(`({t:MB.trials,perf:document.getElementById('ls-perf').textContent,tilt:document.getElementById('ls-mbon').textContent})`);
  console.log('  after 10 trials:',stats2);
  ok(stats2.t==10,`trial counter works (${stats2.t})`);
  const tiltNum=parseFloat(stats2.tilt);
  ok(!isNaN(tiltNum)&&Math.abs(tiltNum)<=1.01&&tiltNum>0.05,`MBON tilt normalized & learned (${stats2.tilt})`);
  await shot('learn-after-training');

  console.log('\n=== SONG: audit ===');
  const t4=await evalJS(`(()=>{const b=document.querySelector('[data-tab=\\'song\\']');const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await click(t4.x,t4.y); await sleep(1200);
  await evalJS(`document.getElementById('btn-audio').click()`); await sleep(300);
  await evalJS(`document.getElementById('btn-song-play').click()`); await sleep(2200);
  ok(await evalJS(`Song.singing&&AUDIO.buzzState.playing`),'song playing + audio buzzing');
  const ipi=await evalJS(`document.getElementById('song-bpm').textContent`);
  const expected=await evalJS(`Math.round((1000/AUDIO.buzzParams.rate)*(0.7+(AUDIO.buzzParams.leg/100)*0.9))`);
  ok(ipi==expected,`IPI readout matches audio formula (${ipi} ms)`);
  const sOk=await pixelAudit('song',{x:100,y:100,w:700,h:400});
  ok(sOk.lit>500,`song scene drawn (${sOk.lit} lit px)`);
  // receptive female check (probabilistic — just check they exist)
  const fem=await evalJS(`Song.females.length`);
  ok(fem>=1,`${fem} female(s) present to hear the song`);
  await shot('song-playing');
  await evalJS(`document.getElementById('btn-song-stop').click()`);
  ok(await evalJS(`!AUDIO.buzzState.playing`),'stop actually stops audio');

  console.log('\n=== console errors ===');
  console.log(logs.length?logs.join('\n'):'(none)');
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  server.close();
  process.exit(fail||logs.length?1:0);
}
main().catch(e=>{console.error('DRIVER FAILED:',e.message);process.exit(1);});
