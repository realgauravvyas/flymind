// FLYMIND demo-asset capture: staged, beautiful screenshots for the README.
// Uses the same CDP driver as the audit; waits for animations to peak.
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
const getJSON = u=>new Promise((res,rej)=>{ http.get(u,r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>res(JSON.parse(b)));}).on('error',rej); });

async function main(){
  const ASSETS = path.join(ROOT,'assets');
  fs.mkdirSync(ASSETS,{recursive:true});
  await new Promise(r=>server.listen(8125,r));
  const targets = await getJSON('http://localhost:9222/json');
  const ws = new WS(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  let id=0; const pending=new Map();
  const send=(m,pa={})=>new Promise((res,rej)=>{const i=++id;pending.set(i,{res,rej});ws.send(JSON.stringify({id:i,method:m,params:pa}));});
  ws.on('message',m=>{const msg=JSON.parse(m);
    if(msg.id&&pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p.rej(new Error(msg.error.message)):p.res(msg.result);}});
  await new Promise(r=>ws.on('open',r));
  await send('Runtime.enable'); await send('Page.enable');

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const evalJS=async e=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const shot=async n=>{const{data}=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(ASSETS,n+'.png'),Buffer.from(data,'base64'));console.log('📸',n);};
  const click=async(x,y)=>{for(const t of['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type:t,x,y,button:'left',clickCount:1});};

  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1.5,mobile:false});
  await send('Page.navigate',{url:'http://localhost:8125/'});
  await sleep(3200);

  // 1. Hero: arena mid-vinegar-cascade (neurons glowing everywhere)
  const btn=await evalJS(`(()=>{const b=document.querySelector('.stim[data-odour=\\'vinegar\\']');const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await click(btn.x,btn.y);
  await sleep(950); // peak cascade
  await shot('demo-arena');

  // 2. Explore: with a pathway traced
  const t2=await evalJS(`(()=>{const b=document.querySelector('[data-tab=\\'explore\\']');const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await click(t2.x,t2.y); await sleep(2000);
  await evalJS(`Explore.focusNode('P1')`);
  await sleep(700);
  await evalJS(`Explore.tracePath(Explore.nodes.find(n=>n.id==='P1'),Explore.nodes.find(n=>n.id==='TTMn'))`);
  await sleep(650); // pulse mid-path
  await shot('demo-explore');

  // 3. Learn: after training, memory bars visibly split
  const t3=await evalJS(`(()=>{const b=document.querySelector('[data-tab=\\'learn\\']');const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await click(t3.x,t3.y); await sleep(1400);
  await evalJS(`(()=>{for(let i=0;i<8;i++)MB.train(LearnState.odourA,+1);MB.evaluate();MB.updateStats();LearnDraw.draw();})()`);
  await sleep(800);
  await shot('demo-learn');

  // 4. Song: singing with pulses + females
  const t4=await evalJS(`(()=>{const b=document.querySelector('[data-tab=\\'song\\']');const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await click(t4.x,t4.y); await sleep(1200);
  await evalJS(`document.getElementById('btn-audio').click()`);
  await sleep(300);
  await evalJS(`document.getElementById('sg-fem').value=3;document.getElementById('sg-fem').dispatchEvent(new Event('input'))`);
  await evalJS(`document.getElementById('btn-song-play').click()`);
  await sleep(2400);
  await shot('demo-song');

  // 5. Science tab (context shot)
  const t5=await evalJS(`(()=>{const b=document.querySelector('[data-tab=\\'about\\']');const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await click(t5.x,t5.y); await sleep(900);
  await shot('demo-science');

  console.log('assets →', ASSETS);
  server.close(); process.exit(0);
}
main().catch(e=>{console.error('CAPTURE FAILED:',e.message);process.exit(1);});
