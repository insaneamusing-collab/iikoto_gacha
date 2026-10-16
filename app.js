'use strict';
/* いいことカプセル
 * データはこの端末のブラウザ(localStorage)にだけ保存します。外部通信・解析・広告はありません。 */

const KEY = 'iikoto-capsule-v1';
const $ = (q, r = document) => r.querySelector(q);
const $$ = (q, r = document) => [...r.querySelectorAll(q)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
const uid = () => (globalThis.crypto?.randomUUID?.() || ('i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8))).replace(/[^a-zA-Z0-9_-]/g, '');
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ---------------- icons (line style, 24px grid) ---------------- */
const P = {
  home: '<path d="M4 11.2 12 4l8 7.2V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
  machine: '<circle cx="12" cy="8.2" r="5.2"/><path d="M5.5 14.5h13V19a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z"/><circle cx="12" cy="17.7" r="1.7"/>',
  ticket: '<path d="M3.5 9V7a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2a3 3 0 0 0 0 6v2a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-2a3 3 0 0 0 0-6z"/><path d="M14.5 6.5v11" stroke-dasharray="1.8 2.4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  spark: '<path d="M12 3.5l2.3 6.2 6.2 2.3-6.2 2.3L12 20.5l-2.3-6.2L3.5 12l6.2-2.3z"/>',
  sprout: '<path d="M12 20.5V12"/><path d="M12 12.5c0-3.8 2.8-6 7-6 0 3.8-2.8 6-7 6z"/><path d="M12 15c0-2.8-2-4.5-6-4.5 0 2.8 2 4.5 6 4.5z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  bath: '<circle cx="9" cy="14.5" r="4.6"/><circle cx="16.8" cy="8.6" r="3"/><circle cx="17" cy="17.2" r="1.9"/>',
  snack: '<rect x="4.5" y="5" width="15" height="14" rx="2.2"/><path d="M4.5 12h15M12 5v14"/>',
  video: '<rect x="3.5" y="5.5" width="17" height="11.5" rx="2.5"/><path d="M10.5 8.8v4.4l3.8-2.2z"/><path d="M8.5 20.5h7"/>',
  craft: '<path d="M4.5 19.5l1-4L16 5l3.5 3.5L9 19z"/><path d="M14 7l3.5 3.5"/>',
  ride: '<path d="M4.5 15.5v-3l1.8-4.5h11.4l1.8 4.5v3z"/><path d="M4.5 12.5h15"/><path d="M7 15.5v2.2M17 15.5v2.2"/>',
  gift: '<rect x="4" y="10" width="16" height="10" rx="1.6"/><path d="M3.5 10h17V7.6a.8.8 0 0 0-.8-.8H4.3a.8.8 0 0 0-.8.8zM12 6.8V20"/><path d="M12 6.8C11 4 7.6 3.6 7.6 5.6c0 1.4 2.6 1.2 4.4 1.2zm0 0C13 4 16.4 3.6 16.4 5.6c0 1.4-2.6 1.2-4.4 1.2z"/>',
  star: '<path d="M12 3.5l2.3 6.2 6.2 2.3-6.2 2.3L12 20.5l-2.3-6.2L3.5 12l6.2-2.3z"/><path d="M19 3.5v3M17.5 5h3"/>'
};
const ico = (n) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.gift}</svg>`;

/* ごほうびの種類 */
const KINDS = {
  bath: ['おふろ・あわ', '#2f8079'],
  snack: ['おやつ', '#a8672a'],
  video: ['どうが', '#5a6bb0'],
  craft: ['こうさく', '#b05a63'],
  ride: ['おでかけ', '#5b8a4e'],
  gift: ['プレゼント', '#b8871a'],
  star: ['きらきら', '#8a6fb0']
};
const LEG_EMOJI = { '🛁': 'bath', '🫧': 'bath', '🍫': 'snack', '🎬': 'video', '🎨': 'craft', '🚗': 'ride', '🎁': 'gift', '⭐': 'star', '🌟': 'star' };
const LEG_KEY = { choco: 'snack', pickup: 'ride' };
const kindOf = (o) => (KINDS[o?.icon] ? o.icon : LEG_KEY[o?.icon] || LEG_EMOJI[o?.emoji] || 'gift');
const tile = (kind, size = '') => `<span class="tile ${size}" style="--c:${(KINDS[kind] || KINDS.gift)[1]}">${ico(kind)}</span>`;

/* カプセルの色(ガチャ・開封で共通) */
const CAPS = ['#e9a93b', '#3f8f86', '#d9704f', '#e6d9bf', '#9bb59a', '#6f84b8', '#4a463e'];
const MACHINES = { ink: 'すみいろ', forest: 'もりいろ', sand: 'すないろ', indigo: 'あいいろ' };

/* ---------------- state ---------------- */
const defaults = () => ({
  version: 3, good: 0, retry: 0, credits: 0, pending: null, tickets: [], tasks: [], history: [],
  rewards: [
    { id: 'bath', name: 'バスボム 1かいけん', icon: 'bath', weight: 30, active: true },
    { id: 'snack', name: 'チョコレートけん', icon: 'snack', weight: 30, active: true },
    { id: 'video', name: 'どうが 15ふんけん', icon: 'video', weight: 20, active: true },
    { id: 'craft', name: 'おやこで こうさくけん', icon: 'craft', weight: 15, active: true },
    { id: 'ride', name: 'はやおむかえけん', icon: 'ride', weight: 5, active: true }
  ],
  settings: { goodGoal: 10, retryGoal: 10, retryRule: 'help', deduct: 3, mission: 'おもちゃを 5こ かたづけよう！', machine: 'ink', sound: false, pinHash: '', pinSalt: '' }
});

const sstr = (v, d, max) => String(v ?? d).slice(0, max);
const cleanId = (v) => String(v || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || uid();
const cleanAt = (v) => sstr(v, '', 40);

/* 旧アプリ(絵文字版・アイコン版)のバックアップも読み込めるように整える */
function migrate(raw) {
  const base = defaults();
  if (!raw || typeof raw !== 'object') return base;
  const S = raw.settings || {};
  const pend = raw.pending && typeof raw.pending === 'object' ? raw.pending : null;
  return {
    version: 3,
    good: Math.max(0, Math.floor(num(raw.good, 0))),
    retry: Math.max(0, Math.floor(num(raw.retry, 0))),
    credits: Math.max(0, Math.floor(num(raw.credits, 0))),
    pending: pend ? { id: cleanId(pend.id), name: sstr(pend.name, 'ごほうび', 45), icon: kindOf(pend), color: Number.isInteger(pend.color) ? Math.abs(pend.color) % CAPS.length : 0, at: cleanAt(pend.at) } : null,
    tickets: Array.isArray(raw.tickets) ? raw.tickets.slice(0, 500).map((t) => ({ id: cleanId(t?.id), name: sstr(t?.name, 'ごほうび', 45), icon: kindOf(t), at: cleanAt(t?.at), used: !!t?.used })) : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks.slice(0, 100).map((t) => ({ id: cleanId(t?.id), name: sstr(t?.name, '', 80), done: !!t?.done })) : [],
    history: Array.isArray(raw.history) ? raw.history.slice(0, 300).map((h) => ({ id: cleanId(h?.id), at: cleanAt(h?.at), message: sstr(h?.message, '', 100) })) : [],
    rewards: Array.isArray(raw.rewards) && raw.rewards.length ? raw.rewards.slice(0, 50).map((r) => ({ id: cleanId(r?.id), name: sstr(r?.name, 'ごほうび', 45) || 'ごほうび', icon: kindOf(r), weight: clamp(num(r?.weight, 10), 0, 1000), active: r?.active !== false })) : base.rewards,
    settings: {
      goodGoal: clamp(Math.round(num(S.goodGoal, 10)), 3, 30),
      retryGoal: clamp(Math.round(num(S.retryGoal, 10)), 3, 30),
      retryRule: ['help', 'talk', 'none', 'deduct'].includes(S.retryRule) ? S.retryRule : 'help',
      deduct: clamp(Math.round(num(S.deduct, 3)), 0, 30),
      mission: sstr(S.mission, base.settings.mission, 80) || base.settings.mission,
      machine: MACHINES[S.machine] ? S.machine : 'ink',
      sound: !!S.sound,
      pinHash: sstr(S.pinHash, '', 130),
      pinSalt: sstr(S.pinSalt, '', 40)
    }
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* 壊れていたら初期状態 */ }
  return defaults();
}
let state = load();
let page = 'home';
let parentUnlocked = false;
let busy = false;       // ガチャ演出中
let stampLock = false;  // スタンプ連打よけ
let ui = { override: null, fresh: -1 };

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast('ほぞんに しっぱいしました'); }
}
function log(message) {
  state.history.unshift({ id: uid(), at: new Date().toISOString(), message });
  state.history = state.history.slice(0, 300);
}
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 1900);
}
function sound(freq = 600, len = 0.14) {
  if (!state.settings.sound) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = sound.ctx || (sound.ctx = new AC());
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + len);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + len + 0.02);
  } catch (e) { /* 音が出なくても動く */ }
}
function fmtTime(at) {
  const d = new Date(at);
  if (!at || Number.isNaN(d.getTime())) return String(at || '');
  return d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ---------------- PIN (簡易ロック) ---------------- */
async function hashPin(pin, salt) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) { return `plain:${pin}`; }
}
async function setPin(pin) {
  const salt = uid();
  state.settings.pinSalt = salt;
  state.settings.pinHash = await hashPin(pin, salt);
  save();
}
async function checkPin(pin) {
  return state.settings.pinHash && (await hashPin(pin, state.settings.pinSalt)) === state.settings.pinHash;
}

/* ---------------- modal ---------------- */
function openModal(html) {
  $('#dialogContent').innerHTML = html;
  const d = $('#dialog');
  if (!d.open) d.showModal();
}
function closeModal() { const d = $('#dialog'); if (d.open) d.close(); }
$('#dialog').addEventListener('click', (e) => { if (e.target === $('#dialog')) closeModal(); });

/* ---------------- game rules ---------------- */
const activeRewards = () => state.rewards.filter((r) => r.active && r.weight > 0);
function randomReward() {
  const pool = activeRewards();
  const total = pool.reduce((s, r) => s + r.weight, 0);
  if (!pool.length || total <= 0) return null;
  let f;
  try { const a = new Uint32Array(1); crypto.getRandomValues(a); f = a[0] / 4294967296; } catch (e) { f = Math.random(); }
  let x = f * total;
  for (const r of pool) { x -= r.weight; if (x < 0) return r; }
  return pool[pool.length - 1];
}
function applyGoals() {
  const s = state.settings; const events = [];
  while (state.good >= s.goodGoal) {
    state.good -= s.goodGoal; state.credits += 1;
    log('ガチャけんを 1まい ゲット'); events.push({ t: 'credit' });
  }
  while (state.retry >= s.retryGoal) {
    state.retry -= s.retryGoal;
    if (s.retryRule === 'help') { state.tasks.unshift({ id: uid(), name: s.mission, done: false }); log('おてつだいミッションが でたよ'); events.push({ t: 'mission', name: s.mission }); }
    else if (s.retryRule === 'talk') { log('おうちのひとと ふりかえろう'); events.push({ t: 'talk' }); }
    else if (s.retryRule === 'deduct') { const n = Math.min(s.deduct, state.good); state.good -= n; log(`いいねが ${n}こ へったよ`); events.push({ t: 'deduct', n }); }
    else { log('つぎがんばるを リセットしたよ'); events.push({ t: 'reset' }); }
  }
  return events;
}

function addStamp(kind) {
  if (stampLock || busy) return;
  stampLock = true;
  setTimeout(() => { stampLock = false; }, 650);
  const g = state.settings.goodGoal;
  if (kind === 'good') { state.good += 1; log('いいね！を 1こ つけたよ'); sound(740, 0.12); }
  else { state.retry += 1; log('つぎがんばるを 1こ つけたよ'); sound(440, 0.12); }
  const before = state.good;
  const events = applyGoals();
  save();
  const gotCredit = events.some((e) => e.t === 'credit');
  if (kind === 'good' && gotCredit) {
    // カードがいっぱいになる瞬間を見せてから、ガチャけんのおしらせ
    ui.override = { good: g }; ui.fresh = g - 1;
    render();
    setTimeout(() => { ui.override = null; ui.fresh = -1; render(); showEvents(events); }, 1000);
    return;
  }
  ui.fresh = kind === 'good' ? before - 1 : -1;
  render();
  ui.fresh = -1;
  if (events.length) setTimeout(() => showEvents(events), 450);
  else toast(kind === 'good' ? 'いいね！' : 'つぎは きっと できるよ');
}
function showEvents(events) {
  const e = events.find((x) => x.t !== 'credit') || events[0];
  if (!e) return;
  if (e.t === 'credit') {
    openModal(`<div class="center"><div class="tile lg" style="--c:#b8871a;margin:4px auto 14px">${ico('ticket')}</div><h2>ガチャけんを ゲット！</h2><p>スタンプが いっぱいに なったよ。<br>ガチャを まわしにいこう！</p><button class="primary" data-go="gacha" data-close>${ico('machine')}ガチャへ いく</button></div>`);
    return;
  }
  const body = {
    mission: [`おてつだい ミッションが でたよ`, `${esc(e.name)}<br><span class="muted">おうちのひとと いっしょに やってみよう</span>`],
    talk: ['おうちのひとと はなそう', 'きょう あったことを ふりかえってみよう'],
    deduct: ['いっかい ふりかえり', `いいねが ${e.n}こ へったよ。<br>あしたも すこしずつ がんばろう`],
    reset: ['あたらしい スタート！', 'つぎも たのしく やっていこう']
  }[e.t];
  openModal(`<div class="center"><div class="tile lg" style="--c:#2f7f76;margin:4px auto 14px">${ico('sprout')}</div><h2>${body[0]}</h2><p>${body[1]}</p><button class="primary" data-close>わかった</button></div>`);
}

/* ---------------- pages ---------------- */
function stampMark(i) {
  const r = ((i * 37) % 15) - 7;
  return `<svg viewBox="0 0 48 48" style="--r:${r}deg" aria-hidden="true"><circle cx="24" cy="24" r="20.5" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="24" cy="24" r="15.5" fill="currentColor" opacity=".16"/><path d="M24 11.5l3.1 8.4 8.4 3.1-8.4 3.1L24 34.5l-3.1-8.4-8.4-3.1 8.4-3.1z" fill="currentColor"/></svg>`;
}

function renderHome() {
  const s = state.settings; const g = s.goodGoal; const r = s.retryGoal;
  const shown = ui.override ? ui.override.good : state.good;
  const left = Math.max(0, g - state.good);
  const slots = Array.from({ length: g }, (_, i) => `<div class="slot ${i < shown ? 'on' : ''} ${i === ui.fresh ? 'fresh' : ''}">${i < shown ? stampMark(i) : i + 1}</div>`).join('');
  const openTasks = state.tasks.filter((t) => !t.done);
  return `
    <section class="hero"><h1>きょうの スタンプ</h1><p>できたら ぺたん！と おしてね</p></section>

    <section class="card">
      <div class="card-head">
        <div>
          <span class="eyebrow">スタンプカード</span>
          <div class="big">${ui.override ? 'いっぱい！' : `あと ${left}<small>こ</small>`}</div>
          <div class="muted">${ui.override ? '' : 'ためると ガチャけんが もらえるよ'}</div>
        </div>
        <div class="credits ${state.credits > 0 ? 'has' : ''}" aria-label="ガチャけん ${state.credits}まい">${ico('ticket')}<span>${state.credits}</span></div>
      </div>
      <div class="slots">${slots}</div>
    </section>

    <div class="pair">
      <button class="stamp-btn good" data-act="good"><span class="face">${ico('spark')}</span>いいね！<small>＋1</small></button>
      <button class="stamp-btn retry" data-act="retry"><span class="face">${ico('sprout')}</span>つぎがんばる<small>＋1</small></button>
    </div>

    <section class="card">
      <div class="retry-card">
        <span class="tile" style="--c:#2f7f76">${ico('sprout')}</span>
        <div class="grow">
          <div style="display:flex;justify-content:space-between;font-weight:800"><span>つぎがんばる</span><span>${state.retry} / ${r}</span></div>
          <div class="segs" aria-hidden="true">${Array.from({ length: r }, (_, i) => `<i class="${i < state.retry ? 'on' : ''}"></i>`).join('')}</div>
        </div>
      </div>
      ${openTasks.length ? `<button class="mission-chip" data-act="mission">${ico('check')}ミッション ${openTasks.length}こ</button>` : ''}
    </section>

    <button class="cta" data-go="gacha">${ico('machine')}ガチャを みにいく${state.credits > 0 ? `<span class="count">${state.credits}まい</span>` : ''}</button>`;
}

/* ---- gacha machine ---- */
function machineSVG() {
  const p = state.pending;
  const tray = p ? `<g transform="translate(160 382)"><g class="drop">${capsuleMarkup(17, CAPS[p.color % CAPS.length])}</g></g>` : '';
  return `
  <svg class="machine" viewBox="0 0 320 440" aria-hidden="true">
    <defs>
      <clipPath id="domeClip"><circle cx="160" cy="116" r="95"/></clipPath>
      <radialGradient id="glass" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></radialGradient>
    </defs>
    <ellipse cx="160" cy="426" rx="104" ry="9" fill="rgba(0,0,0,.14)"/>
    <rect x="76" y="404" width="40" height="14" rx="6" class="m-dark"/><rect x="204" y="404" width="40" height="14" rx="6" class="m-dark"/>
    <rect x="48" y="214" width="224" height="196" rx="30" class="m-body"/>
    <circle cx="160" cy="116" r="100" fill="url(#glass)" stroke="rgba(120,114,100,.45)" stroke-width="3"/>
    <g clip-path="url(#domeClip)"><circle cx="160" cy="116" r="95" fill="rgba(255,255,255,.18)"/><g id="balls"></g></g>
    <path d="M96 76A76 76 0 0 1 134 40" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".75"/>
    <rect x="66" y="204" width="188" height="26" rx="13" class="m-trim"/>
    <rect x="70" y="240" width="180" height="122" rx="22" class="m-panel"/>
    <rect x="132" y="250" width="56" height="9" rx="4.5" class="m-dark"/>
    <g class="dial" id="dial" transform="rotate(0 160 306)">
      <circle cx="160" cy="306" r="47" class="m-trim"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="158.6" y="262" width="2.8" height="6" rx="1.4" fill="rgba(0,0,0,.28)" transform="rotate(${i * 30} 160 306)"/>`).join('')}
      <rect x="150" y="268" width="20" height="76" rx="10" class="m-handle"/>
      <circle cx="160" cy="306" r="11" class="m-trim"/>
      <circle cx="160" cy="276" r="4.5" fill="#e9a93b"/>
    </g>
    <rect x="108" y="364" width="104" height="38" rx="14" class="m-dark"/>
    ${tray}
    <rect x="100" y="394" width="120" height="10" rx="5" class="m-trim"/>
  </svg>`;
}

function capsuleMarkup(r, color) {
  return `<circle r="${r}" fill="${color}"/><path d="M${-r} 0A${r} ${r} 0 0 0 ${r} 0z" fill="#f3eee2"/><path d="M${-r} 0H${r}" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/><circle r="${r}" class="ball-ring" stroke-width="1.2"/><circle cx="${-r * 0.36}" cy="${-r * 0.42}" r="${r * 0.17}" fill="#fff" opacity=".6"/>`;
}

function renderGacha() {
  const has = state.credits > 0; const pool = activeRewards(); const waiting = !!state.pending;
  const hint = waiting ? 'でてきた カプセルを タップしてね' : has ? 'ダイヤルを ぐるっと まわしてね' : 'スタンプを ためて ガチャけんを もらおう';
  const label = waiting ? 'カプセルを あける' : !has ? 'ガチャけんが ないよ' : !pool.length ? 'ごほうびが ないよ' : 'ガチャを まわす';
  return `
    <section class="hero row-head">
      <div><h1>ガチャ</h1><p>ガチャけん ${state.credits}まい</p></div>
      <div class="credits ${has ? 'has' : ''}">${ico('ticket')}<span>${state.credits}</span></div>
    </section>
    <div class="stage ${has && !waiting ? '' : 'locked'}" data-m="${state.settings.machine}" id="stage">
      <div class="stage-bg"></div>
      ${machineSVG()}
      <button class="dial-hit" id="dialHit" aria-label="ダイヤルを まわす"></button>
      ${waiting ? '<button class="tray-hit" id="trayHit" aria-label="カプセルを あける"></button>' : ''}
    </div>
    <p class="gacha-hint" id="hint">${hint}</p>
    <div class="gacha-action">
      <button class="cta" id="spinBtn" data-act="${waiting ? 'reveal' : 'spin'}" ${(!waiting && (!has || !pool.length)) ? 'disabled' : ''}>${ico(waiting ? 'gift' : 'machine')}${label}</button>
    </div>`;
}

/* physics inside the dome */
const DOME = { cx: 160, cy: 116, R: 94 };
const M = { raf: 0, balls: [], angle: 0, shake: 0, last: 0 };

function buildBalls() {
  const layer = $('#balls'); if (!layer) return;
  M.balls = [];
  const n = 17;
  for (let i = 0; i < n; i++) {
    const r = 16 + ((i * 5) % 4);
    const b = { r, x: DOME.cx + (Math.random() - 0.5) * 120, y: DOME.cy + Math.random() * 70, vx: 0, vy: 0, a: Math.random() * 360, w: 0, c: CAPS[i % CAPS.length] };
    b.el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    b.el.innerHTML = capsuleMarkup(r, b.c);
    layer.appendChild(b.el);
    M.balls.push(b);
  }
  for (let i = 0; i < 140; i++) stepBalls(1 / 60);
  drawBalls();
}
function stepBalls(dt) {
  const G = 1100; const { cx, cy, R } = DOME; const B = M.balls;
  for (const b of B) {
    if (M.shake > 0.02) { b.vx += (Math.random() - 0.5) * 110 * M.shake; b.vy -= Math.random() * 70 * M.shake; }
    b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    b.vx *= 0.995; b.vy *= 0.995; b.a += b.w * dt; b.w *= 0.985;
    if (b.y > 203 - b.r) { b.y = 203 - b.r; if (b.vy > 0) b.vy *= -0.3; b.vx *= 0.97; }
    const dx = b.x - cx; const dy = b.y - cy; const d = Math.hypot(dx, dy); const lim = R - b.r;
    if (d > lim) {
      const nx = dx / d; const ny = dy / d;
      b.x = cx + nx * lim; b.y = cy + ny * lim;
      const vn = b.vx * nx + b.vy * ny;
      if (vn > 0) { b.vx -= 1.35 * vn * nx; b.vy -= 1.35 * vn * ny; }
      const vt = -b.vx * ny + b.vy * nx;
      b.w += vt / b.r * 57.3 * 0.15; b.vx *= 0.99;
    }
  }
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i < B.length; i++) {
      for (let j = i + 1; j < B.length; j++) {
        const a = B[i]; const b = B[j];
        const dx = b.x - a.x; const dy = b.y - a.y; const d = Math.hypot(dx, dy) || 0.01; const min = a.r + b.r;
        if (d < min) {
          const nx = dx / d; const ny = dy / d; const o = (min - d) / 2;
          a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
          const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (vn < 0) { const im = -1.3 * vn / 2; a.vx -= im * nx; a.vy -= im * ny; b.vx += im * nx; b.vy += im * ny; }
        }
      }
    }
  }
  for (const b of B) {
    if (b.y > 203 - b.r) b.y = 203 - b.r;
    const dx = b.x - cx; const dy = b.y - cy; const d = Math.hypot(dx, dy); const lim = R - b.r;
    if (d > lim) { b.x = cx + dx / d * lim; b.y = cy + dy / d * lim; }
  }
}
function drawBalls() { for (const b of M.balls) b.el.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.a.toFixed(0)})`); }
function loop(t) {
  if (!document.body.contains($('#balls')) || document.hidden) { M.raf = 0; return; }
  const dt = Math.min(0.033, (t - M.last) / 1000 || 0.016); M.last = t;
  stepBalls(dt); drawBalls();
  M.shake *= 0.94;
  M.raf = requestAnimationFrame(loop);
}
function setDial(a) { M.angle = a; $('#dial')?.setAttribute('transform', `rotate(${a.toFixed(1)} 160 306)`); }

function initMachine() {
  cancelAnimationFrame(M.raf); M.raf = 0; M.angle = 0;
  if (!$('#balls')) return;
  buildBalls();
  if (!reduceMotion()) { M.last = performance.now(); M.raf = requestAnimationFrame(loop); }
  const hit = $('#dialHit');
  if (hit) bindDial(hit);
  const tray = $('#trayHit');
  if (tray) tray.addEventListener('click', revealGacha);
}

function bindDial(hit) {
  let drag = null;
  const ang = (e) => { const r = hit.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
  hit.addEventListener('pointerdown', (e) => {
    if (busy || state.pending) return;
    if (state.credits < 1) { toast('ガチャけんが ないよ'); return; }
    hit.setPointerCapture?.(e.pointerId);
    drag = { last: ang(e), acc: 0, t0: performance.now(), moved: 0 };
  });
  hit.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const a = ang(e); let d = a - drag.last;
    if (d > 180) d -= 360; if (d < -180) d += 360;
    drag.last = a; drag.moved += Math.abs(d);
    drag.acc = Math.max(0, drag.acc + d);
    setDial(drag.acc);
    M.shake = Math.min(1, Math.abs(d) / 14);
    if (drag.acc >= 270) { drag = null; startGacha(); }
  });
  const end = () => {
    if (!drag) return;
    const tap = drag.moved < 14 && performance.now() - drag.t0 < 500;
    drag = null;
    if (tap) { startGacha(); return; }
    const from = M.angle; const t0 = performance.now();
    (function back(t) { const k = clamp((t - t0) / 260, 0, 1); setDial(from * (1 - k)); if (k < 1) requestAnimationFrame(back); })(t0);
  };
  hit.addEventListener('pointerup', end);
  hit.addEventListener('pointercancel', end);
  hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGacha(); } });
}

function startGacha() {
  if (busy || state.pending) return;
  if (state.credits < 1) { toast('ガチャけんが ないよ'); return; }
  const r = randomReward();
  if (!r) { toast('おとなに ごほうびを いれてもらってね'); return; }
  busy = true;
  state.credits -= 1;
  state.pending = { id: uid(), name: r.name, icon: r.icon, color: Math.floor(Math.random() * CAPS.length), at: new Date().toISOString() };
  log('ガチャを まわした');
  save();
  sound(360, 0.35);
  $('#spinBtn')?.setAttribute('disabled', '');
  const from = M.angle; const to = from + (from < 300 ? 720 : 360);
  const dur = reduceMotion() ? 200 : 1300; const t0 = performance.now();
  (function spin(t) {
    const k = clamp((t - t0) / dur, 0, 1); const e = 1 - Math.pow(1 - k, 3);
    setDial(from + (to - from) * e);
    M.shake = reduceMotion() ? 0 : Math.max(M.shake, 1 - k * 0.8);
    if (k < 1) requestAnimationFrame(spin);
    else setTimeout(() => { busy = false; render(); toast('カプセルが ぽん！'); sound(520, 0.2); }, 150);
  })(t0);
}

function revealGacha() {
  if (!state.pending || busy) return;
  const reward = state.pending;
  state.tickets.unshift({ id: uid(), name: reward.name, icon: reward.icon, at: new Date().toISOString(), used: false });
  state.pending = null;
  log(`あたり：${reward.name}`);
  save(); sound(880, 0.3);
  render();
  const col = CAPS[reward.color % CAPS.length];
  const confetti = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2 + 0.3; const d = 70 + (i % 3) * 22; return `<i style="--k:${CAPS[i % CAPS.length]};--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px;--rot:${i * 47}deg"></i>`; }).join('');
  openModal(`
    <div class="center">
      <div class="reveal">
        ${tile(reward.icon, 'lg')}
        <div class="burst" aria-hidden="true">${confetti}</div>
        <svg class="cap" viewBox="0 0 200 190" aria-hidden="true">
          <g class="half-bot"><path d="M54 95a46 46 0 0 0 92 0z" fill="#f3eee2"/><path d="M54 95a46 46 0 0 0 92 0z" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="1.5"/></g>
          <g class="half-top"><path d="M54 95a46 46 0 0 1 92 0z" fill="${col}"/><circle cx="83" cy="75" r="7" fill="#fff" opacity=".55"/></g>
        </svg>
      </div>
      <h2>やったー！</h2>
      <p style="font-size:18px;font-weight:800">${esc(reward.name)}</p>
      <p class="muted">ごほうびボックスに いれたよ</p>
      <button class="primary" data-go="tickets" data-close>${ico('ticket')}ごほうびを みる</button>
    </div>`);
}

function renderTickets() {
  const active = state.tickets.filter((t) => !t.used); const used = state.tickets.filter((t) => t.used);
  const card = (t) => `<div class="ticket ${t.used ? 'used' : ''}">${tile(t.icon)}<div class="grow"><h3>${esc(t.name)}</h3><div class="sub">${t.used ? 'つかったよ' : fmtTime(t.at) + ' に ゲット'}</div></div><span class="perf"></span><div class="state">${t.used ? `<span class="ok-mark">${ico('check')}</span>` : `<span class="have">${ico('ticket')}</span>`}</div></div>`;
  return `
    <section class="hero"><h1>ごほうびボックス</h1><p>あたった ごほうびが ここに はいるよ</p></section>
    <h2 class="section-title">まだ つかっていない (${active.length})</h2>
    ${active.length ? active.map(card).join('') : `<div class="card empty"><span class="tile">${ico('gift')}</span>まだ ないよ<br>ガチャを まわしてみよう</div>`}
    ${used.length ? `<h2 class="section-title">つかった ごほうび (${used.length})</h2>${used.map(card).join('')}` : ''}
    <p class="muted center space-top">つかったら、おとなのせっていで「つかった」にしてね</p>`;
}

function renderHistory() {
  const tasks = state.tasks.filter((t) => !t.done);
  const rows = state.history.length ? state.history.slice(0, 60).map((h) => `<div class="log-row"><time>${esc(fmtTime(h.at))}</time><span>${esc(h.message)}</span></div>`).join('') : '<p class="muted">まだ きろくが ないよ</p>';
  return `
    <section class="hero"><h1>きろく</h1><p>がんばった あしあと</p></section>
    <div class="stats">
      <div class="stat"><b>${state.good}</b><span>いいね</span></div>
      <div class="stat"><b>${state.retry}</b><span>つぎがんばる</span></div>
      <div class="stat"><b>${state.credits}</b><span>ガチャけん</span></div>
      <div class="stat"><b>${state.tickets.filter((t) => !t.used).length}</b><span>ごほうび</span></div>
    </div>
    ${tasks.length ? `<section class="card"><h2>いまの ミッション</h2>${tasks.map((t) => `<div class="task-row"><span class="tile sm" style="--c:#2f7f76">${ico('sprout')}</span><div class="grow">${esc(t.name)}</div></div>`).join('')}</section>` : ''}
    <section class="card"><h2>りれき</h2><div class="space-top">${rows}</div></section>`;
}

function kindOptions(sel) { return Object.entries(KINDS).map(([k, v]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>${v[0]}</option>`).join(''); }

function renderSettings() {
  if (!parentUnlocked) return '';
  const s = state.settings;
  return `
    <section class="hero row-head"><div><h1>おとなの せってい</h1><p>ルールや ごほうびを かえられます</p></div><button class="btn" data-act="lock">とじる</button></section>

    <section class="card settings">
      <h2>ガチャの ごほうび</h2>
      <p class="sub">「重み」が大きいほど当たりやすくなります。</p>
      <div class="space-top">${state.rewards.map((r) => `<div class="reward-row">${tile(r.icon, 'sm')}<div class="grow"><strong>${esc(r.name)}</strong><div class="sub">重み ${r.weight} ・ ${r.active ? '有効' : 'お休み'}</div></div><button class="btn" data-edit="${esc(r.id)}">編集</button></div>`).join('')}</div>
      <h3 class="sub-head">ごほうびを追加</h3>
      <form id="rewardAdd">
        <div class="fields"><label>イラスト<select name="icon">${kindOptions('gift')}</select></label><label>重み<input name="weight" type="number" inputmode="numeric" min="0" max="1000" value="10" required></label></div>
        <label>名前<input name="name" maxlength="45" placeholder="えほんを 1さつ よむ" required></label>
        <button class="btn ok space-top" type="submit">＋ 追加する</button>
      </form>
    </section>

    <section class="card settings">
      <h2>スタンプの ルール</h2>
      <form id="rulesForm">
        <div class="fields"><label>いいね何個でガチャ券？<input type="number" inputmode="numeric" name="goodGoal" min="3" max="30" value="${s.goodGoal}" required></label><label>つぎがんばる何個？<input type="number" inputmode="numeric" name="retryGoal" min="3" max="30" value="${s.retryGoal}" required></label></div>
        <label>つぎがんばるが たまったら<select name="retryRule">
          <option value="help" ${s.retryRule === 'help' ? 'selected' : ''}>お手伝いミッション</option>
          <option value="talk" ${s.retryRule === 'talk' ? 'selected' : ''}>親子で振り返る</option>
          <option value="none" ${s.retryRule === 'none' ? 'selected' : ''}>リセットだけ</option>
          <option value="deduct" ${s.retryRule === 'deduct' ? 'selected' : ''}>いいねを減らす</option></select></label>
        <label>お手伝いの内容<input name="mission" value="${esc(s.mission)}" maxlength="80" required></label>
        <label>減らすいいねの数（「いいねを減らす」のときだけ）<input name="deduct" type="number" inputmode="numeric" min="0" max="30" value="${s.deduct}" required></label>
        <button class="btn ok space-top" type="submit">ルールを保存</button>
      </form>
    </section>

    <section class="card settings">
      <h2>みため・おと</h2>
      <form id="lookForm">
        <label>ガチャマシンの色<select name="machine">${Object.entries(MACHINES).map(([k, v]) => `<option value="${k}" ${s.machine === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="check"><input type="checkbox" name="sound" ${s.sound ? 'checked' : ''}>こうかおんを ならす</label>
        <button class="btn ok space-top" type="submit">保存</button>
      </form>
    </section>

    <section class="card">
      <h2>お手伝いミッション</h2>
      ${state.tasks.filter((t) => !t.done).map((t) => `<div class="task-row"><span class="tile sm" style="--c:#2f7f76">${ico('sprout')}</span><div class="grow">${esc(t.name)}</div><button class="btn ok" data-task="${esc(t.id)}">できた</button></div>`).join('') || '<p class="sub space-top">いまは ありません</p>'}
    </section>

    <section class="card">
      <h2>数の修正</h2><p class="sub">押し間違いを直せます（0未満にはなりません）</p>
      <div class="space-top">${[['good', 'いいね'], ['retry', 'つぎがんばる'], ['credits', 'ガチャ券']].map(([k, l]) => `<div class="counter"><span>${l}：<b>${state[k]}</b></span><span class="row-actions"><button class="btn danger" data-adj="${k}" data-d="-1">−1</button><button class="btn ok" data-adj="${k}" data-d="1">＋1</button></span></div>`).join('')}</div>
      <div class="divider"></div>
      <h3 class="sub-head" style="margin-top:0">ごほうびチケット</h3>
      ${state.tickets.map((t) => `<div class="reward-row">${tile(t.icon, 'sm')}<span class="grow ${t.used ? 'sub' : ''}">${esc(t.name)}</span><button class="btn ${t.used ? '' : 'ok'}" data-ticket="${esc(t.id)}">${t.used ? '戻す' : '使った'}</button></div>`).join('') || '<p class="sub">まだ ありません</p>'}
    </section>

    <section class="card settings">
      <h2>暗証番号</h2>
      <form id="pinForm"><label>新しい暗証番号（4〜12桁の数字）<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,12}" minlength="4" maxlength="12" required autocomplete="new-password"></label><button class="btn space-top" type="submit">変更する</button></form>
      <p class="note">子どもが設定画面を開かないための簡易ロックです。</p>
    </section>

    <section class="card">
      <h2>バックアップ</h2>
      <p class="sub space-top">記録はこの端末の中だけに保存されています。機種変更やアプリの再インストールに備えて、ときどき書き出してください。暗証番号は含まれません。</p>
      <div class="row-actions space-top" style="justify-content:flex-start"><button class="btn ok" data-act="export">書き出す</button><button class="btn" data-act="import">読み込む</button><input hidden id="importFile" type="file" accept=".json,application/json"></div>
      <p class="warn space-top">読み込むと今の記録は置き換わります。以前のアプリ（ガチャポン）のバックアップも読み込めます。</p>
    </section>`;
}

/* ---------------- render ---------------- */
const NAV = { home: ['ホーム', 'home'], gacha: ['ガチャ', 'machine'], tickets: ['ごほうび', 'ticket'], history: ['きろく', 'clock'] };
function renderNav() {
  $$('.tab').forEach((b) => {
    const [label, icon] = NAV[b.dataset.go];
    const n = b.dataset.go === 'gacha' ? state.credits : b.dataset.go === 'tickets' ? state.tickets.filter((t) => !t.used).length : 0;
    b.classList.toggle('active', b.dataset.go === page);
    b.innerHTML = `${ico(icon)}<span>${label}</span>${n > 0 ? `<span class="dot">${n}</span>` : ''}`;
    b.setAttribute('aria-current', b.dataset.go === page ? 'page' : 'false');
  });
  $('#parentButton').innerHTML = ico('sliders');
}
function render() {
  const views = { home: renderHome, gacha: renderGacha, tickets: renderTickets, history: renderHistory, settings: renderSettings };
  cancelAnimationFrame(M.raf); M.raf = 0;
  $('#main').innerHTML = (views[page] || renderHome)();
  renderNav();
  if (page === 'gacha') initMachine();
}
function goto(p) {
  if (busy) return;
  page = p; render(); window.scrollTo(0, 0);
}

/* ---------------- parent area ---------------- */
function openSettings() {
  if (parentUnlocked) { goto('settings'); return; }
  if (!state.settings.pinHash) {
    openModal(`<h2>はじめに 暗証番号を決めます</h2><p class="muted">おとなだけが設定を開けるようにするための番号です（数字4〜12桁）。</p>
      <form id="pinCreate"><input name="a" class="pin-input" type="password" inputmode="numeric" pattern="[0-9]{4,12}" minlength="4" maxlength="12" required autocomplete="new-password" aria-label="暗証番号">
      <input name="b" class="pin-input space-top" type="password" inputmode="numeric" pattern="[0-9]{4,12}" minlength="4" maxlength="12" required autocomplete="new-password" aria-label="もういちど入力">
      <div class="modal-actions"><button type="button" class="btn" data-close>やめる</button><button class="btn solid" type="submit">決める</button></div></form>`);
    setTimeout(() => $('#pinCreate [name=a]')?.focus(), 80);
    return;
  }
  openModal(`<h2>おとなの せってい</h2><p class="muted">暗証番号を入れてください。</p>
    <form id="pinAsk"><input name="pin" class="pin-input" type="password" inputmode="numeric" maxlength="12" required autocomplete="current-password" aria-label="暗証番号">
    <div class="modal-actions"><button type="button" class="btn" data-close>もどる</button><button class="btn solid" type="submit">ひらく</button></div></form>`);
  setTimeout(() => $('#pinAsk [name=pin]')?.focus(), 80);
}

function editReward(id) {
  const r = state.rewards.find((v) => v.id === id); if (!r) return;
  openModal(`<h2>ごほうびを編集</h2>
    <form id="rewardEdit" class="settings" data-id="${esc(r.id)}">
      <label>イラスト<select name="icon">${kindOptions(r.icon)}</select></label>
      <label>名前<input name="name" maxlength="45" value="${esc(r.name)}" required></label>
      <label>重み<input name="weight" type="number" inputmode="numeric" min="0" max="1000" value="${r.weight}" required></label>
      <label class="check"><input name="active" type="checkbox" ${r.active ? 'checked' : ''}>ガチャに入れる</label>
      <div class="modal-actions"><button class="btn danger" type="button" data-del="${esc(r.id)}">削除</button><button class="btn solid" type="submit">保存</button></div>
    </form>`);
}

function exportData() {
  const b = JSON.parse(JSON.stringify(state));
  delete b.settings.pinHash; delete b.settings.pinSalt;
  const url = URL.createObjectURL(new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = `iikoto-capsule-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
async function importData(file) {
  try {
    if (file.size > 1024 * 1024) throw new Error('large');
    const clean = migrate(JSON.parse(await file.text()));
    if (!confirm('今の記録を、バックアップの内容で置き換えますか？')) return;
    clean.settings.pinHash = state.settings.pinHash; clean.settings.pinSalt = state.settings.pinSalt;
    state = clean; save(); parentUnlocked = false; goto('home'); toast('よみこんだよ');
  } catch (e) { toast('よみこめないファイルです'); }
}

/* ---------------- events (delegated) ---------------- */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act],[data-go],[data-close],[data-edit],[data-del],[data-task],[data-adj],[data-ticket]');
  if (!t) return;
  if ('close' in t.dataset) closeModal();
  if (t.dataset.go) goto(t.dataset.go);
  const a = t.dataset.act;
  if (a === 'good' || a === 'retry') addStamp(a);
  else if (a === 'spin') startGacha();
  else if (a === 'reveal') revealGacha();
  else if (a === 'settings') openSettings();
  else if (a === 'lock') { parentUnlocked = false; goto('home'); }
  else if (a === 'export') exportData();
  else if (a === 'import') $('#importFile')?.click();
  else if (a === 'mission') {
    openModal(`<h2>ミッション</h2>${state.tasks.filter((x) => !x.done).map((x) => `<div class="task-row"><span class="tile sm" style="--c:#2f7f76">${ico('sprout')}</span><div class="grow">${esc(x.name)}</div></div>`).join('')}<p class="muted">おうちのひとと いっしょに やってみよう</p><button class="primary" data-close>とじる</button>`);
  }
  if (t.dataset.edit) editReward(t.dataset.edit);
  if (t.dataset.del) {
    const id = t.dataset.del;
    openModal(`<h2>削除しますか？</h2><p>すでに当たったチケットには影響しません。</p><div class="modal-actions"><button class="btn" data-close>やめる</button><button class="btn danger" data-confirm-del="${esc(id)}">削除する</button></div>`);
  }
  if (t.dataset.task) { const x = state.tasks.find((v) => v.id === t.dataset.task); if (x) { x.done = true; log('ミッション かんりょう'); save(); render(); toast('ミッション かんりょう'); } }
  if (t.dataset.adj) { const k = t.dataset.adj; state[k] = Math.max(0, state[k] + Number(t.dataset.d)); log(`数を修正（${k}）`); save(); render(); }
  if (t.dataset.ticket) { const x = state.tickets.find((v) => v.id === t.dataset.ticket); if (x) { x.used = !x.used; log(`${x.name}：${x.used ? 'つかった' : 'もどした'}`); save(); render(); } }
});
document.addEventListener('click', (e) => {
  const c = e.target.closest('[data-confirm-del]');
  if (c) { state.rewards = state.rewards.filter((r) => r.id !== c.dataset.confirmDel); save(); closeModal(); render(); toast('けしたよ'); }
});
$('#importFile')?.addEventListener('change', () => {});
document.addEventListener('change', (e) => {
  if (e.target.id === 'importFile') { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ''; }
});
$$('.tab').forEach((b) => b.setAttribute('type', 'button'));

document.addEventListener('submit', async (e) => {
  const f = e.target; e.preventDefault();
  const d = new FormData(f);
  if (f.id === 'pinCreate') {
    const a = String(d.get('a')); const b = String(d.get('b'));
    if (!/^[0-9]{4,12}$/.test(a)) { toast('数字を 4〜12けた いれてね'); return; }
    if (a !== b) { toast('ばんごうが ちがうよ'); return; }
    await setPin(a); parentUnlocked = true; closeModal(); goto('settings'); toast('きめました');
  } else if (f.id === 'pinAsk') {
    if (await checkPin(String(d.get('pin')))) { parentUnlocked = true; closeModal(); goto('settings'); } else toast('ばんごうが ちがうよ');
  } else if (f.id === 'pinForm') {
    const p = String(d.get('pin'));
    if (!/^[0-9]{4,12}$/.test(p)) { toast('数字を 4〜12けた'); return; }
    await setPin(p); f.reset(); toast('ばんごうを かえたよ');
  } else if (f.id === 'rewardAdd') {
    const name = String(d.get('name')).trim(); const weight = Number(d.get('weight'));
    if (!name || !Number.isInteger(weight) || weight < 0 || weight > 1000) return;
    const icon = KINDS[d.get('icon')] ? String(d.get('icon')) : 'gift';
    state.rewards.push({ id: uid(), name, icon, weight, active: true }); save(); render(); toast('ついかしたよ');
  } else if (f.id === 'rewardEdit') {
    const r = state.rewards.find((v) => v.id === f.dataset.id); if (!r) return;
    const name = String(d.get('name')).trim(); const weight = Number(d.get('weight'));
    if (!name || !Number.isFinite(weight)) return;
    r.name = name; r.weight = clamp(weight, 0, 1000); r.icon = KINDS[d.get('icon')] ? String(d.get('icon')) : 'gift'; r.active = !!d.get('active');
    save(); closeModal(); render(); toast('ほぞんしたよ');
  } else if (f.id === 'rulesForm') {
    const s = state.settings;
    s.goodGoal = clamp(Math.round(num(d.get('goodGoal'), 10)), 3, 30);
    s.retryGoal = clamp(Math.round(num(d.get('retryGoal'), 10)), 3, 30);
    s.retryRule = ['help', 'talk', 'none', 'deduct'].includes(d.get('retryRule')) ? String(d.get('retryRule')) : 'help';
    s.mission = String(d.get('mission')).slice(0, 80) || s.mission;
    s.deduct = clamp(Math.round(num(d.get('deduct'), 3)), 0, 30);
    applyGoals(); save(); render(); toast('ほぞんしたよ');
  } else if (f.id === 'lookForm') {
    state.settings.machine = MACHINES[d.get('machine')] ? String(d.get('machine')) : 'ink';
    state.settings.sound = !!d.get('sound');
    save(); render(); toast('ほぞんしたよ');
  }
});

document.addEventListener('visibilitychange', () => { if (!document.hidden && page === 'gacha' && !busy && !M.raf && $('#balls') && !reduceMotion()) { M.last = performance.now(); M.raf = requestAnimationFrame(loop); } });

render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
try { navigator.storage?.persist?.(); } catch (e) { /* なくても動く */ }
