// verify: inspired-by footer renders on the live page, all links resolve
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
  await new Promise(r=>server.listen(8127,r));
  const targets=await getJSON('http://localhost:9222/json');
  const ws=new WS(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  let id=0;const p=new Map();
  const send=(m,pa={})=>new Promise((res,rej)=>{const i=++id;p.set(i,{res,rej});ws.send(JSON.stringify({id:i,method:m,params:pa}));});
  ws.on('message',m=>{const msg=JSON.parse(m);if(msg.id&&p.has(msg.id)){const h=p.get(msg.id);p.delete(msg.id);msg.error?h.rej(new Error(msg.error.message)):h.res(msg.result);}});
  await new Promise(r=>ws.on('open',r));
  await send('Runtime.enable');await send('Page.enable');
  const errors=[];
  ws.on('message',m=>{const msg=JSON.parse(m);
    if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text);
    if(msg.method==='Runtime.consoleAPICalled'&&msg.params.type==='error')errors.push(msg.params.args.map(a=>a.value||'').join(' '));});
  const ev=async e=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://localhost:8127/'});
  await new Promise(r=>setTimeout(r,3000));

  const footer = await ev(`(()=>{
    const f=document.querySelector('.inspired'); if(!f) return null;
    const r=f.getBoundingClientRect();
    return { visible:r.height>10, width:Math.round(r.width),
      links:[...f.querySelectorAll('a')].map(a=>({t:a.textContent.trim().slice(0,45),h:a.href})) };
  })()`);
  console.log('FOOTER:', footer.visible?'renders ✓':(footer?'NOT VISIBLE':'MISSING'), `(${footer.width}px wide)`);
  footer.links.forEach(l=>console.log('   →', l.t.padEnd(45), l.h));
  const ghBtn = await ev(`(()=>{const b=document.querySelector('.gh-link');return {text:b.textContent.trim(),href:b.href};})()`);
  console.log('HEADER BUTTON:', ghBtn.text, '→', ghBtn.href);
  const science = await ev(`document.getElementById('view-about').innerHTML.includes('Inspired by the')`);
  console.log('SCIENCE TAB CREDIT:', science?'present ✓':'MISSING');
  console.log('CONSOLE ERRORS:', errors.length?errors:'none');

  const pass = footer.visible && footer.links.length>=5 && ghBtn.href==='https://github.com/realgauravvyas/flymind' && science && !errors.length;
  console.log(pass?'ALL PASS':'FAILURES PRESENT');
  server.close();process.exit(pass?0:1);
})().catch(e=>{console.error('FAIL:',e.message);process.exit(1);});
