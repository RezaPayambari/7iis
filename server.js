// 7is: serves the game and relays player positions/chat via WebSocket.
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 12;
const ROLES = ['viktor', 'reza', 'martin', 'baran'];
const html = fs.readFileSync(path.join(__dirname, 'index.html'));

const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.end('ok'); return; }
  if (req.url === '/' || req.url.startsWith('/?')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html); return;
  }
  res.writeHead(404); res.end('Not found');
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096 });
const peers = new Map();   // id -> presence
let nextId = 1, dirty = false;

const num = (v, a, b) => Math.max(a, Math.min(b, Number(v) || 0));
const col = v => (/^#[0-9a-f]{6}$/i.test(v) ? v : '#000000');
const pick = (v, list, d) => (list.includes(v) ? v : d);
// Only known fields, with limits, are accepted from clients.
function clean(d, cur) {
  const o = {};
  if ('role' in d) { if (d.role === null) o.role = null; else if (ROLES.includes(d.role)) o.role = d.role; }
  if ('x' in d) o.x = num(d.x, 0, 1300);
  if ('f' in d) o.f = Math.round(num(d.f, 1, 5));
  if ('fc' in d) o.fc = d.fc < 0 ? -1 : 1;
  for (const k of ['sit', 'hid', 'sm']) if (k in d) o[k] = d[k] ? (k === 'sm' ? 1 : true) : (k === 'sm' ? 0 : false);
  if ('it' in d) o.it = d.it ? col(d.it) : 0;
  if (d.look && typeof d.look === 'object') {
    const l = d.look;
    o.look = { hair: pick(l.hair, ['hair', 'cap', 'bald'], 'hair'), hc: col(l.hc), top: pick(l.top, ['shirt', 'jacket'], 'shirt'), tc: col(l.tc),
               bot: pick(l.bot, ['jeans', 'shorts'], 'jeans'), bc: col(l.bc), sh: pick(l.sh, ['shoes', 'slip'], 'shoes'), sc: col(l.sc) };
  }
  if ('say' in d) { o.say = String(d.say || '').slice(0, 90); o.sayT = Date.now(); }
  if (d.ring && typeof d.ring === 'object') o.ring = { n: String(d.ring.n || '').slice(0, 4), t: Date.now() };
  return o;
}

wss.on('connection', ws => {
  if (peers.size >= MAX_PLAYERS) { ws.close(); return; }
  ws.id = 'p' + (nextId++); ws.alive = true; ws.count = 0; ws.win = Date.now();
  peers.set(ws.id, {}); dirty = true;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', raw => {
    const now = Date.now();
    if (now - ws.win > 1000) { ws.win = now; ws.count = 0; }
    if (++ws.count > 40) return;                       // rate limit: 40 messages/second
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || m.t !== 'p' || !m.d || typeof m.d !== 'object') return;
    const cur = peers.get(ws.id) || {}, patch = clean(m.d, cur);
    for (const k in patch) { if (patch[k] === null) delete cur[k]; else cur[k] = patch[k]; }
    peers.set(ws.id, cur); dirty = true;
  });
  ws.on('close', () => { peers.delete(ws.id); dirty = true; });
});

setInterval(() => {                                    // broadcast ~10x per second when something changed
  if (!dirty) return; dirty = false;
  const snap = Object.fromEntries(peers);
  for (const c of wss.clients) if (c.readyState === 1) c.send(JSON.stringify({ t: 's', me: c.id, peers: snap }));
}, 100);
setInterval(() => {                                    // drop dead connections
  for (const c of wss.clients) { if (!c.alive) { c.terminate(); continue; } c.alive = false; c.ping(); }
}, 30000);

server.listen(PORT, () => console.log('7is running on port ' + PORT));
