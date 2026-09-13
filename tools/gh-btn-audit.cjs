// verify GitHub logo button renders + links correctly
const http=require('http');
const fs=require('fs');
const path=require('path');
const ROOT=path.join(__dirname,'..');
const WS=require('ws');
const server=http.createServer((req,res)=>{
  const p=path.join(ROOT, req.url==='/'?'index.html':req.url.split('?')[0]);
  fs.readFile(p,(e,d)=>{e?(res.writeHead(404),res.end()):(res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(p)]||'text/plain'}),res.end(d));});
});
const getJSON=u=>new Promise((res,rej)=>{http.get(u,r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>res(JSON.parse(b)));}).on('error',rej);});
(async()=>{
  await new Promise(r=>server.listen(8129,r));
  const targets=await getJSON('http://localhost:9222/json');
  const ws=new WS(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  let id=0;const p=new Map();
  const send=(m,pa={})=>new Promise((res,rej)=>{const i=++id;p.set(i,{res,rej});ws.send(JSON.stringify({id:i,method:m,params:pa}));});
  ws.on('message',m=>{const msg=JSON.parse(m);if(msg.id&&p.has(msg.id)){const h=p.get(msg.id);p.delete(msg.id);msg.error?h.rej(new Error(msg.error.message)):h.res(msg.result);}});
  await new Promise(r=>ws.on('open',r));
  await send('Runtime.enable');await send('Page.enable');
  const ev=async e=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://localhost:8129/'});
  await new Promise(r=>setTimeout(r,3000));
  const check=await ev(`(()=>{
    const b=document.getElementById('gh-btn'); if(!b) return null;
    const r=b.getBoundingClientRect();
    const use=b.querySelector('use');
    return { visible:r.width>10&&r.height>10,
      size:Math.round(r.width)+'x'+Math.round(r.height),
      href:b.href, icon:use?use.getAttribute('href'):'none', title:b.title };
  })()`);
  console.log('GITHUB BUTTON:', JSON.stringify(check));
  const style=await ev(`(()=>{const b=document.getElementById('gh-btn');const s=getComputedStyle(b);return {display:s.display,color:s.color,border:s.borderColor};})()`);
  console.log('STYLE:', JSON.stringify(style));
  const footerStill=await ev(`!!document.querySelector('.inspired') && !!document.querySelector('.if-user')`);
  console.log('footer intact:', footerStill);
  const ok = check && check.visible && check.icon==='#ic-github' && check.href==='https://github.com/realgauravvyas/flymind';
  console.log(ok?'PASS':'FAIL'); process.exit(ok?0:1);
})().catch(e=>{console.error('FAIL:',e.message);process.exit(1);});
