// Cơ sở dữ liệu đơn giản: toàn bộ dữ liệu nằm trong bộ nhớ và được lưu xuống nơi bền vững.
//  - Mặc định (chạy trên máy bạn): lưu vào file JSON data/db.json. Không cần cài gì thêm.
//  - Khi đặt biến môi trường MONGODB_URI (ví dụ trên Render): lưu vào MongoDB để dữ liệu không mất
//    khi máy chủ khởi động lại. Chỉ khi đó mới cần thư viện "mongodb" (đã khai báo trong package.json).
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.NNEKO_DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const MONGO_URI = process.env.MONGODB_URI || '';
const EMPTY = () => ({ users: {}, sessions: {}, friendRequests: [] });

let state = EMPTY();
let saveTimer = null;
let mongoCol = null;          // collection MongoDB (nếu dùng)
let mongoClient = null;
let writing = Promise.resolve();

// ---------- file JSON ----------
function loadFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      state = Object.assign(EMPTY(), raw);
    } catch (e) {
      // File hỏng: giữ bản sao lưu rồi bắt đầu mới
      const bak = DB_FILE + '.broken-' + Date.now();
      fs.copyFileSync(DB_FILE, bak);
      console.warn('db.json bị lỗi, đã sao lưu sang', bak);
    }
  }
}

function saveFile() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, DB_FILE);
}

// ---------- MongoDB (tùy chọn) ----------
async function loadMongo() {
  let MongoClient;
  try { ({ MongoClient } = require('mongodb')); }
  catch (e) {
    throw new Error('Đã đặt MONGODB_URI nhưng chưa cài thư viện "mongodb". Hãy chạy "npm install" (trên Render: Build Command = npm install).');
  }
  mongoClient = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  await mongoClient.connect();
  mongoCol = mongoClient.db().collection('nihongo_neko');
  const doc = await mongoCol.findOne({ _id: 'state' });
  if (doc && doc.data) state = Object.assign(EMPTY(), doc.data);
  console.log('Đã kết nối MongoDB. Số tài khoản:', Object.keys(state.users).length);
}

function saveMongo() {
  const snapshot = JSON.parse(JSON.stringify(state));
  // ghi lần lượt, không chồng chéo
  writing = writing.then(() => mongoCol.replaceOne({ _id: 'state' }, { _id: 'state', data: snapshot, updatedAt: new Date() }, { upsert: true }))
    .catch(e => console.error('Không lưu được vào MongoDB:', e.message));
  return writing;
}

// ---------- giao diện chung ----------
// Gọi một lần trước khi mở máy chủ.
async function init() {
  if (MONGO_URI) await loadMongo(); else loadFile();
}

function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  return mongoCol ? saveMongo() : saveFile();
}

// Gom nhiều lần ghi gần nhau thành một lần
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { try { saveNow(); } catch (e) { console.error('Lỗi lưu dữ liệu:', e.message); } }, 150);
}

function db() { return state; }

async function flushAndExit() {
  try { if (saveTimer) await saveNow(); await writing; if (mongoClient) await mongoClient.close(); } catch (_) {}
  process.exit(0);
}

process.on('exit', () => { if (saveTimer && !mongoCol) { try { saveFile(); } catch (_) {} } });
process.on('SIGINT', flushAndExit);
process.on('SIGTERM', flushAndExit);

// Chạy trực tiếp (kiểm thử, công cụ khác) mà chưa gọi init(): dùng file JSON như trước.
if (!MONGO_URI) loadFile();

module.exports = { db, save, saveNow, init, DB_FILE };
