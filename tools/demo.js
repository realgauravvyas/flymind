// FLYMIND demo — static server for local play
// Usage: node tools/demo.js [port]   → default http://localhost:8123

const fs = require('fs');
const path = require('path');
const http = require('http');

const root = path.join(__dirname, '..');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const server = http.createServer((req,res)=>{
  const p = path.join(root, req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p,(e,d)=>{
    if(e){res.writeHead(404);res.end('nf');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'text/plain','Cache-Control':'no-cache'});
    res.end(d);
  });
});
const port = Number(process.argv[2]||8123);
server.listen(port, ()=>console.log(`FLYMIND → http://localhost:${port}  (Ctrl+C to stop)`));
