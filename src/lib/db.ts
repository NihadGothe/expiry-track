const Datastore = require('nedb-promises');
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DATA = path.join(process.cwd(), 'data');
fs.mkdirSync(DATA, { recursive: true });

const db = {
  services: Datastore.create({ filename: path.join(DATA, 'services.db'), autoload: true }),
  users:    Datastore.create({ filename: path.join(DATA, 'users.db'),    autoload: true }),
  alerts:   Datastore.create({ filename: path.join(DATA, 'alerts.db'),   autoload: true }),
  settings: Datastore.create({ filename: path.join(DATA, 'settings.db'), autoload: true }),
};

let seeded = false;
async function seed() {
  if (seeded) return; seeded = true;
  if (await db.users.count({}) > 0) return;
  await db.users.insert([
    { name: 'Admin',   email: 'admin@company.com',   password: bcrypt.hashSync('admin123', 10), role: 'admin',  created_at: new Date().toISOString() },
    { name: 'Manager', email: 'manager@company.com', password: bcrypt.hashSync('admin123', 10), role: 'viewer', created_at: new Date().toISOString() },
  ]);
  await db.settings.insert({ key: 'telegram', bot_token: '', chat_ids: [] });
  const add = (d: number) => { const x = new Date(); x.setDate(x.getDate()+d); return x.toISOString().split('T')[0]; };
  await db.services.insert([
    { name:'company.com',       type:'Domain',       vendor:'GoDaddy',   expiry_date:add(8),   cost:15,  currency:'USD', notify_30:true,notify_15:true,notify_7:true,notify_1:true, created_at:new Date().toISOString() },
    { name:'SSL — company.com', type:'SSL',          vendor:'Cloudflare',expiry_date:add(3),   cost:0,   currency:'USD', notify_30:true,notify_15:true,notify_7:true,notify_1:true, created_at:new Date().toISOString() },
    { name:'AWS EC2 Server',    type:'VPS',          vendor:'Amazon AWS',expiry_date:add(60),  cost:120, currency:'USD', notify_30:true,notify_15:true,notify_7:true,notify_1:true, created_at:new Date().toISOString() },
    { name:'Microsoft 365',     type:'License',      vendor:'Microsoft', expiry_date:add(-4),  cost:300, currency:'USD', notify_30:true,notify_15:true,notify_7:true,notify_1:true, created_at:new Date().toISOString() },
    { name:'Google Workspace',  type:'Subscription', vendor:'Google',    expiry_date:add(120), cost:72,  currency:'USD', notify_30:true,notify_15:true,notify_7:true,notify_1:true, created_at:new Date().toISOString() },
  ]);
}

export function daysLeft(expiry: string) {
  if (!expiry) return 0;
  const e = new Date(expiry);
  if (isNaN(e.getTime())) return 0;  // ADD THIS LINE
  e.setHours(0,0,0,0);
  const n = new Date(); n.setHours(0,0,0,0);
  return Math.round((e.getTime()-n.getTime())/86400000);
}
export function computeStatus(expiry: string) {
  if (!expiry) return 'active';
  const d = daysLeft(expiry);
  if (d < 0) return 'expired'; if (d <= 30) return 'expiring'; return 'active';
}
function enrich(s: any) {
  return { ...s, id: s._id, days_left: daysLeft(s.expiry_date), status: computeStatus(s.expiry_date) };
}

// ─── Services ────────────────────────────────────────────────────────────────
export async function getAllServices(page = 1, limit = 20, search = '', filter = 'all') {
  await seed();
  const all = (await db.services.find({}).sort({ expiry_date: 1 })).map(enrich);
  let filtered = all;
  if (search) {
    const q = search.toLowerCase();
    filtered = all.filter((s:any) =>
      (s.name||'').toLowerCase().includes(q) ||
      (s.vendor||'').toLowerCase().includes(q) ||
      (s.type||'').toLowerCase().includes(q) ||
      (s.registered_email||'').toLowerCase().includes(q)
    );
  }
  if (filter !== 'all') filtered = filtered.filter((s:any) => s.status === filter);
  const total = filtered.length;
  const data = filtered.slice((page-1)*limit, page*limit);
  return { data, total, page, limit, totalPages: Math.ceil(total/limit) || 1 };
}

export async function getService(id: string) {
  await seed();
  const s = await db.services.findOne({ _id: id });
  return s ? enrich(s) : null;
}

export async function createService(data: any) {
  await seed();
  const doc = await db.services.insert({ ...data, status: computeStatus(data.expiry_date), created_at: new Date().toISOString() });
  return doc._id;
}

export async function updateService(id: string, data: any) {
  await seed();
  await db.services.update({ _id: id }, { $set: { ...data, status: computeStatus(data.expiry_date), updated_at: new Date().toISOString() } });
}

export async function deleteService(id: string) {
  await seed();
  // Remove related alerts
  await db.alerts.remove({ service_id: id }, { multi: true });
  // Delete the service - try both _id formats
  const numRemoved = await db.services.remove({ _id: id }, {});
  return numRemoved;
}

export async function getStats() {
  await seed();
  const all = await db.services.find({});
  return {
    total:    all.length,
    active:   all.filter((s:any) => computeStatus(s.expiry_date)==='active').length,
    expiring: all.filter((s:any) => computeStatus(s.expiry_date)==='expiring').length,
    expired:  all.filter((s:any) => computeStatus(s.expiry_date)==='expired').length,
  };
}

export async function bulkInsertServices(rows: any[]) {
  await seed();
  const docs = rows.map(r => ({ ...r, status: computeStatus(r.expiry_date), created_at: new Date().toISOString() }));
  return db.services.insert(docs);
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function getAllUsers() { await seed(); return db.users.find({}).sort({ created_at: 1 }); }
export async function getUserByEmail(email: string) { await seed(); return db.users.findOne({ email }) as Promise<any>; }
export async function getUserById(id: string) { await seed(); return db.users.findOne({ _id: id }) as Promise<any>; }
export async function createUser(data: any) { await seed(); return db.users.insert({ ...data, created_at: new Date().toISOString() }); }
export async function updateUser(id: string, data: any) { await seed(); await db.users.update({ _id: id }, { $set: data }); }
export async function deleteUser(id: string) { await seed(); await db.users.remove({ _id: id }, {}); }

// ─── Settings ────────────────────────────────────────────────────────────────
export async function getTelegramSettings() { await seed(); return db.settings.findOne({ key: 'telegram' }) as Promise<any>; }
export async function saveTelegramSettings(bot_token: string, chat_ids: string[]) {
  await seed();
  const e = await db.settings.findOne({ key: 'telegram' });
  if (e) await db.settings.update({ key: 'telegram' }, { $set: { bot_token, chat_ids } });
  else await db.settings.insert({ key: 'telegram', bot_token, chat_ids });
}

export async function getNotificationSettings() {
  await seed();
  const email    = await db.settings.findOne({ key: 'email' })    as any;
  const whatsapp = await db.settings.findOne({ key: 'whatsapp' }) as any;
  return { email: email || {}, whatsapp: whatsapp || {} };
}
export async function saveEmailSettings(data: any) {
  await seed();
  const e = await db.settings.findOne({ key: 'email' });
  if (e) await db.settings.update({ key: 'email' }, { $set: { key: 'email', ...data } });
  else await db.settings.insert({ key: 'email', ...data });
}
export async function saveWhatsAppSettings(data: any) {
  await seed();
  const e = await db.settings.findOne({ key: 'whatsapp' });
  if (e) await db.settings.update({ key: 'whatsapp' }, { $set: { key: 'whatsapp', ...data } });
  else await db.settings.insert({ key: 'whatsapp', ...data });
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
export async function getServicesForReminders() {
  await seed();
  return (await db.services.find({})).map(enrich).filter((s:any) => s.days_left >= 0);
}
export async function wasAlertSent(serviceId: string, daysBefore: number) {
  return !!(await db.alerts.findOne({ service_id: serviceId, days_before: daysBefore }));
}
export async function markAlertSent(serviceId: string, daysBefore: number, meta: any) {
  await db.alerts.insert({ service_id: serviceId, days_before: daysBefore, ...meta, sent_at: new Date().toISOString() });
}
export async function getAlertHistory() { return db.alerts.find({}).sort({ sent_at: -1 }); }
