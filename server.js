// PLM 대시보드 서버
// 외부 npm 패키지 없이 Node.js 표준 라이브러리만 사용합니다.
// 실행: node server.js
// 같은 Wi-Fi(LAN)에 있는 모바일 기기에서 http://<이 PC의 IP>:<PORT> 로 접속하면 동일한 데이터를 볼 수 있습니다.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'data', 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---------- 데이터 저장소 (단순 JSON 파일) ----------

function defaultData() {
  return {
    tasks: [],
    projects: [],
    risks: [],
    notes: [],
    roadmap: [],
  };
}

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    const d = defaultData();
    saveData(d);
    return d;
  }
}

function saveData(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

let db = loadData();

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- 정적 파일 서빙 ----------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = filePath.split('?')[0];
  const fullPath = path.join(PUBLIC_DIR, filePath);

  // 디렉토리 탈출 방지
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

// ---------- API 헬퍼 ----------

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = '';
    req.on('data', (c) => (chunks += c));
    req.on('end', () => {
      if (!chunks) return resolve({});
      try {
        resolve(JSON.parse(chunks));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const COLLECTIONS = ['tasks', 'projects', 'risks', 'notes', 'roadmap'];

async function handleApi(req, res, urlParts) {
  // urlParts: ['api', collection, id?]
  const collection = urlParts[1];
  const id = urlParts[2];

  if (!COLLECTIONS.includes(collection)) {
    return sendJson(res, 404, { error: 'unknown collection' });
  }

  if (req.method === 'GET' && !id) {
    return sendJson(res, 200, db[collection]);
  }

  if (req.method === 'POST' && !id) {
    const body = await readBody(req);
    const item = { id: genId(), createdAt: new Date().toISOString(), ...body };
    db[collection].push(item);
    saveData(db);
    return sendJson(res, 201, item);
  }

  if (req.method === 'PUT' && id) {
    const body = await readBody(req);
    const idx = db[collection].findIndex((x) => x.id === id);
    if (idx === -1) return sendJson(res, 404, { error: 'not found' });
    db[collection][idx] = { ...db[collection][idx], ...body, id, updatedAt: new Date().toISOString() };
    saveData(db);
    return sendJson(res, 200, db[collection][idx]);
  }

  if (req.method === 'DELETE' && id) {
    const idx = db[collection].findIndex((x) => x.id === id);
    if (idx === -1) return sendJson(res, 404, { error: 'not found' });
    const [removed] = db[collection].splice(idx, 1);
    saveData(db);
    return sendJson(res, 200, removed);
  }

  return sendJson(res, 405, { error: 'method not allowed' });
}

// ---------- 서버 ----------

const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split('?')[0].split('/').filter(Boolean);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (urlParts[0] === 'api') {
    try {
      return await handleApi(req, res, urlParts);
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  return serveStatic(req, res);
});

function getLanIps() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PLM 대시보드 서버 실행 중`);
  console.log(`  로컬:   http://localhost:${PORT}`);
  getLanIps().forEach((ip) => {
    console.log(`  모바일: http://${ip}:${PORT}  (같은 Wi-Fi 필요)`);
  });
});
