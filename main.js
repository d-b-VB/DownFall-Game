const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');

const CELL = 48; // visual pixels per character-cell
const WORLD_SCALE = 4; // 4x bigger in each direction
const MAP_CENTER = { x: 25 * CELL * WORLD_SCALE, y: 20 * CELL * WORLD_SCALE };
const ring = (a, b) => ({ min: a * 5 * CELL * WORLD_SCALE, max: b * 5 * CELL * WORLD_SCALE });

const weapons = [
  { id: 'club', glyph: 'club', kind: 'swing', base: 8, reach: 62, speedScale: 24 },
  { id: 'sling', glyph: '🪢', kind: 'sling', base: 4, reach: 260, speedScale: 12 },
  { id: 'axe', glyph: '🪓', kind: 'swing', base: 10, reach: 68, speedScale: 26 },
  { id: 'sword', glyph: '⚔️', kind: 'swing', base: 9, reach: 72, speedScale: 27 },
  { id: 'bow', glyph: '🏹', kind: 'bow', base: 5, reach: 400, speedScale: 20 },
  { id: 'ballista', glyph: '🛠️', kind: 'sling', base: 14, reach: 470, speedScale: 10 },
  { id: 'cannon', glyph: '💣', kind: 'sling', base: 18, reach: 540, speedScale: 8 },
];

const zones = [
  { id: 'orchard', name: 'Club Orchard', palette:['#1f6a3a','#2f8e4d','#4f5f3e'], waypoint: '🌳', enemy: '🐗', unlock: 'club', ring: ring(0, 1), arc: [0, 24] },
  { id: 'axe', name: 'Axe Grove', palette:['#3e6b2a','#6f8f33','#8cad4a'], waypoint: '🪓', enemy: '🦂', unlock: 'axe', ring: ring(1, 2), arc: [9, 15] },
  { id: 'creek', name: 'Sling Creekside', palette:['#2a5f79','#3e89a8','#78b8d4'], waypoint: '🌊', enemy: '🪨', unlock: 'sling', ring: ring(1, 2), arc: [15, 24], slowWater: true },
  { id: 'pasture', name: 'Pasture', palette:['#6d8f4b','#92b862','#c0d98a'], waypoint: '🐄', enemy: '🐺', unlock: 'sword', ring: ring(2, 3), arc: [3, 7] },
  { id: 'smith', name: 'Smith Town', palette:['#6d5743','#8f7057','#c19a72'], waypoint: '🏘️', enemy: '🛡️', unlock: 'bow', ring: ring(2, 3), arc: [7, 11] },
  { id: 'fletcher', name: 'Fletcher Village', palette:['#5a7a3f','#7da85b','#b8d685'], waypoint: '🎯', enemy: '🦅', unlock: 'ballista', ring: ring(2, 3), arc: [11, 15] },
  { id: 'tundra', name: 'Tundra', palette:['#8faecc','#c8d8e6','#f5fbff'], waypoint: '🧊', enemy: '❄️', unlock: null, ring: ring(3, 4), arc: [11.5, 12.5] },
  { id: 'sawmill', name: 'Sawmill Woods', palette:['#355c37','#4f7f4a','#7ba36f'], waypoint: '🪚', enemy: '🧌', unlock: 'cannon', ring: ring(3, 4), arc: [12.5, 14.5] },
  { id: 'marsh', name: 'Marsh', palette:['#456243','#5e7f59','#89a37d'], waypoint: '🦆', enemy: '🐍', unlock: null, ring: ring(3, 4), arc: [14.5, 15.5], slowWater: true },
  { id: 'marches', name: 'Marches', palette:['#5c6166','#7f868c','#a4adb4'], waypoint: '🏰', enemy: '🛡️', unlock: null, ring: ring(3, 4), arc: [15.5, 17.5] },
  { id: 'desert', name: 'Desert', palette:['#9e7338','#c89a4f','#e6c877'], waypoint: '🌵', enemy: '🦂', unlock: null, ring: ring(3, 4), arc: [17.5, 18.5] },
  { id: 'volcano', name: 'Volcano', palette:['#6e231f','#a73a2f','#df6a3f'], waypoint: '🌋', enemy: '🐜', unlock: null, ring: ring(3, 4), arc: [18.5, 20.5] },
  { id: 'mine', name: 'Mine', palette:['#4f4a52','#726b77','#9a92a1'], waypoint: '⛏️', enemy: '🪨', unlock: null, ring: ring(3, 4), arc: [20.5, 21.5] },
  { id: 'frost', name: 'Frosty Mountain', palette:['#7e9fbe','#a4bfd8','#d8ecfb'], waypoint: '🏔️', enemy: '❄️', unlock: null, ring: ring(3, 4), arc: [21.5, 23.5] },
  { id: 'swamp', name: 'Swamp', palette:['#2f5a2f','#4f7b46','#7ea85f'], waypoint: '🐸', enemy: '☠️', unlock: null, ring: ring(4, 5), arc: [14, 16], slowWater: true },
  { id: 'foundry', name: 'Foundry/Monastery', palette:['#5e4339','#7a5a4f','#a37d6b'], waypoint: '🏯', enemy: '👹', unlock: null, ring: ring(4, 5), arc: [20, 22] },
];

const state = { t: 0, last: 0, mouseDX: 0, mouseDY: 0, keys: new Set(), mouse: { x: 0, y: 0, down: false, held: 0 }, camera: { x: MAP_CENTER.x, y: MAP_CENTER.y }, player: null, projectiles: [], enemies: [], terrain: [], waves: {} };

const worldXY = (cx, cy) => ({ x: cx * CELL * WORLD_SCALE, y: cy * CELL * WORLD_SCALE });
const wrap24 = (h) => (h % 24 + 24) % 24;
function inArc(hour, [start, end]) { const h = wrap24(hour); const s = wrap24(start); const e = wrap24(end); return s <= e ? h >= s && h < e : h >= s || h < e; }
function toClockHour(theta) { return wrap24((6 - theta * 6 / Math.PI)); }

function getZone(x, y) {
  const dx = x - MAP_CENTER.x, dy = y - MAP_CENTER.y;
  const r = Math.hypot(dx, dy);
  const theta = Math.atan2(dy, dx);
  const hour = toClockHour(theta);
  return zones.find((z) => r >= z.ring.min && r < z.ring.max && inArc(hour, z.arc));
}


function fisheyeMap01(u) {
  if (u <= 0.9) return u;
  const t = Math.min(1, (u - 0.9) / 0.1);
  const k = 4;
  return 0.9 + 0.1 * ((1 - Math.exp(-k * t)) / (1 - Math.exp(-k)));
}

function projectWorld(wx, wy) {
  const dx = wx - state.camera.x, dy = wy - state.camera.y;
  const r = Math.hypot(dx, dy);
  const maxR = Math.min(innerWidth, innerHeight) * 0.5;
  const u = Math.min(1, r / maxR);
  const v = fisheyeMap01(u);
  const rr = v * maxR;
  const scale = r > 1e-6 ? rr / r : 1;
  return { x: innerWidth * 0.5 + dx * scale, y: innerHeight * 0.5 + dy * scale, scale, u };
}
function resetWorld() {
  const start = worldXY(25, 20);
  state.player = { x: start.x, y: start.y, vx: 0, vy: 0, hp: 20, weapon: 'club', unlocked: new Set(['club']), swing: 0, lastX: start.x, lastY: start.y };
  state.projectiles = []; state.enemies = []; state.terrain = []; state.waves = {};

  for (const z of zones) {
    state.waves[z.id] = { spawned: false, cleared: false };
    const midHour = wrap24((z.arc[0] + z.arc[1]) * 0.5);
    const midR = (z.ring.min + z.ring.max) * 0.5;
    const th = (6 - midHour) * Math.PI / 6;
    const baseX = MAP_CENTER.x + Math.cos(th) * midR;
    const baseY = MAP_CENTER.y + Math.sin(th) * midR;
    state.terrain.push({ x: baseX - 70, y: baseY - 40, hp: 3, type: 'tree', zone: z.id, glyph: '🌲' });
    state.terrain.push({ x: baseX + 45, y: baseY + 20, hp: 3, type: 'stone', zone: z.id, glyph: '🪨' });
  }
}

function resize() { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
addEventListener('resize', resize);
addEventListener('keydown', (e) => { state.keys.add(e.key.toLowerCase()); if (e.key === ' ') triggerAttack(true); if (e.key.toLowerCase() === 'r') resetWorld(); if (/[1-7]/.test(e.key)) { const w = weapons[Number(e.key) - 1]; if (state.player.unlocked.has(w.id)) state.player.weapon = w.id; } });
addEventListener('keyup', (e) => { state.keys.delete(e.key.toLowerCase()); if (e.key === ' ') releaseAttack(true); });
canvas.addEventListener('mousemove', (e) => { state.mouseDX = e.movementX || 0; state.mouseDY = e.movementY || 0; state.mouse.x = e.clientX; state.mouse.y = e.clientY; });
canvas.addEventListener('mousedown', () => triggerAttack(false));
addEventListener('mouseup', () => releaseAttack(false));

function weaponDef() { return weapons.find((w) => w.id === state.player.weapon); }
function triggerAttack(fromSpace) { if (fromSpace ? state.spaceDown : state.mouse.down) return; if (fromSpace) state.spaceDown = true; else state.mouse.down = true; state.mouse.held = 0; if (weaponDef().kind === 'swing') state.player.swing = 1; }
function releaseAttack(fromSpace) { if (fromSpace) state.spaceDown = false; else state.mouse.down = false; const w = weaponDef(); if (w.kind === 'bow' || w.kind === 'sling') fireCharge(w); }

function fireCharge(w) {
  const hold = Math.min(1, state.mouse.held / 1.5), p = state.player;
  const a = Math.atan2(state.mouse.y - innerHeight / 2, state.mouse.x - innerWidth / 2);
  const sp = 220 + hold * 420;
  state.projectiles.push({ x: p.x + Math.cos(a) * 24, y: p.y + Math.sin(a) * 24, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 2, dmg: Math.round(w.base + hold * w.speedScale), glyph: w.kind === 'bow' ? '➳' : '🪨' });
}

function update(dt) {
  const p = state.player; state.t += dt;
  let dx = (state.keys.has('d') || state.keys.has('arrowright') ? 1 : 0) - (state.keys.has('a') || state.keys.has('arrowleft') ? 1 : 0);
  let dy = (state.keys.has('s') || state.keys.has('arrowdown') ? 1 : 0) - (state.keys.has('w') || state.keys.has('arrowup') ? 1 : 0);
  const mag = Math.hypot(dx, dy) || 1; dx /= mag; dy /= mag;
  const zone = getZone(p.x, p.y);
  const slow = zone?.slowWater ? 0.65 : 1;
  p.vx = dx * 220 * slow; p.vy = dy * 220 * slow; p.x += p.vx * dt; p.y += p.vy * dt;
  state.camera.x += (p.x - state.camera.x) * 0.1; state.camera.y += (p.y - state.camera.y) * 0.1;
  if (state.mouse.down || state.spaceDown) state.mouse.held += dt;

  if (zone && !state.waves[zone.id].spawned) {
    state.waves[zone.id].spawned = true;
    for (let i = 0; i < 4; i++) state.enemies.push({ x: p.x + Math.cos(i) * 140, y: p.y + Math.sin(i * 2) * 120, hp: 8, glyph: zone.enemy, zone: zone.id });
  }

  if (p.swing > 0) { p.swing -= dt * 3; doSwingDamage(); }
  for (const pr of state.projectiles) { pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt; }
  state.projectiles = state.projectiles.filter((pr) => pr.life > 0);

  for (const e of state.enemies) {
    const ax = p.x - e.x, ay = p.y - e.y, d = Math.hypot(ax, ay) || 1;
    e.x += ax / d * 80 * dt; e.y += ay / d * 80 * dt;
    if (d < 20) p.hp = Math.max(0, p.hp - dt * 2);
  }

  hitChecks();
  if (zone && !state.enemies.some((e) => e.zone === zone.id && e.hp > 0) && !state.waves[zone.id].cleared) {
    state.waves[zone.id].cleared = true;
    if (zone.unlock) p.unlocked.add(zone.unlock);
  }
}

function doSwingDamage() {
  const p = state.player, w = weaponDef(); if (w.kind !== 'swing') return;
  const moveSpeed = Math.hypot(p.x - p.lastX, p.y - p.lastY) * 60;
  const mouseVel = Math.hypot(state.mouseDX, state.mouseDY);
  const power = w.base + (moveSpeed + mouseVel) * 0.08;
  const a = Math.atan2(state.mouse.y - innerHeight / 2, state.mouse.x - innerWidth / 2);
  const sx = p.x + Math.cos(a) * w.reach, sy = p.y + Math.sin(a) * w.reach;
  for (const e of state.enemies) if (Math.hypot(e.x - sx, e.y - sy) < 45) e.hp -= power * 0.08;
  for (const t of state.terrain) if (Math.hypot(t.x - sx, t.y - sy) < 45) t.hp -= power * 0.06;
}

function hitChecks() {
  for (const pr of state.projectiles) {
    for (const e of state.enemies) if (Math.hypot(e.x - pr.x, e.y - pr.y) < 22) { e.hp -= pr.dmg; pr.life = 0; }
    for (const t of state.terrain) if (Math.hypot(t.x - pr.x, t.y - pr.y) < 20) { t.hp -= pr.dmg * 0.8; pr.life = 0; }
  }
  state.enemies = state.enemies.filter((e) => e.hp > 0);
  state.terrain = state.terrain.filter((t) => t.hp > 0);
}

function drawHexBackground() {
  const size = 24;
  const hStep = Math.sqrt(3) * size;
  const vStep = 1.5 * size;
  const worldW = innerWidth * 1.3;
  const worldH = innerHeight * 1.3;
  const startX = state.camera.x - worldW * 0.5;
  const startY = state.camera.y - worldH * 0.5;
  const endX = state.camera.x + worldW * 0.5;
  const endY = state.camera.y + worldH * 0.5;

  const rowStart = Math.floor(startY / vStep) - 2;
  const rowEnd = Math.ceil(endY / vStep) + 2;
  const colStart = Math.floor(startX / hStep) - 2;
  const colEnd = Math.ceil(endX / hStep) + 2;

  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      const wx = col * hStep + (row % 2 ? hStep / 2 : 0);
      const wy = row * vStep;
      const p = projectWorld(wx, wy);
      if (p.x < -40 || p.x > innerWidth + 40 || p.y < -40 || p.y > innerHeight + 40) continue;
      const z = getZone(wx, wy);
      const palette = z?.palette || ['#3a5847', '#4d6a56', '#638169'];
      const idx = Math.abs((row + col * 2)) % 3;
      ctx.fillStyle = palette[idx];
      hex(p.x, p.y, Math.max(3, size * p.scale)); ctx.fill();
    }
  }
}

function hex(x, y, r) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); }
function shade(c, amt) { const n = parseInt(c.slice(1), 16); let r = (n >> 16) + amt * 255, g = ((n >> 8) & 255) + amt * 255, b = (n & 255) + amt * 255; r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b)); return `rgb(${r | 0},${g | 0},${b | 0})`; }

function drawRiver() {
  const segments = [];
  for (let h = 11; h <= 14.5; h += 0.18) {
    const th = (6 - h) * Math.PI / 6;
    const r = 3 * 5 * CELL * WORLD_SCALE + Math.sin(h * 3) * 12;
    segments.push(projectWorld(MAP_CENTER.x + Math.cos(th) * r, MAP_CENTER.y + Math.sin(th) * r));
  }
  ctx.strokeStyle = '#5ec6ffcc'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath();
  segments.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
}

function render() {
  ctx.clearRect(0, 0, innerWidth, innerHeight); drawHexBackground();
  drawRiver();

  for (const z of zones) {
    const midH = wrap24((z.arc[0] + z.arc[1]) * 0.5);
    const th = (6 - midH) * Math.PI / 6;
    const r = (z.ring.min + z.ring.max) * 0.5;
    const p = projectWorld(MAP_CENTER.x + Math.cos(th) * r, MAP_CENTER.y + Math.sin(th) * r);
    ctx.fillStyle = '#fff8'; ctx.font = `${Math.max(10,18*p.scale)}px sans-serif`; 
    ctx.fillText(`${z.waypoint} ${z.name}`, p.x - 40 * p.scale, p.y);
  }
  for (const t of state.terrain) { const p=projectWorld(t.x,t.y); ctx.font = `${Math.max(12,30*p.scale)}px serif`; ctx.fillText(t.glyph, p.x-12*p.scale, p.y+10*p.scale); }
  for (const e of state.enemies) { const p=projectWorld(e.x,e.y); ctx.font = `${Math.max(11,26*p.scale)}px serif`; ctx.fillText(e.glyph, p.x-10*p.scale, p.y+8*p.scale); }
  for (const pr of state.projectiles) { const p=projectWorld(pr.x,pr.y); ctx.font = `${Math.max(10,20*p.scale)}px serif`; ctx.fillText(pr.glyph, p.x-8*p.scale, p.y+8*p.scale); }

  const p = projectWorld(state.player.x,state.player.y), aim = Math.atan2(state.mouse.y - innerHeight / 2, state.mouse.x - innerWidth / 2);
  ctx.font = '34px serif'; ctx.fillText('🙂', p.x - 14, p.y + 12);
  ctx.save(); ctx.translate(p.x, p.y);
  const w = weaponDef();
  const swingT = Math.max(0, state.player.swing);
  const swingAngle = w.kind === 'swing' ? Math.sin((1 - swingT) * Math.PI * 2.2) * 0.8 * swingT : 0;
  ctx.rotate(aim + swingAngle);
  if (w.id === 'club') {
    ctx.strokeStyle = '#6f3f1f'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(56, 0); ctx.stroke();
  } else if (w.kind === 'bow' && (state.mouse.down || state.spaceDown)) {
    const t = Math.min(1, state.mouse.held / 1.7), wob = Math.sin(state.t * 60 * t) * 4 * t;
    ctx.font = `${24 + 16 * t + wob}px serif`; ctx.fillText('🏹', 22 + 18 * t, 8 + wob); ctx.font = `${18 + 14 * t}px serif`; ctx.fillText('➳', 42 + 24 * t, 8);
  } else if (w.kind === 'sling' && (state.mouse.down || state.spaceDown)) {
    const t = Math.min(1, state.mouse.held / 1.4), wob = Math.sin(state.t * 50 * t) * 10 * t;
    ctx.font = '28px serif'; ctx.fillText('🪢', 24, 8); ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(54 + 22 * t + wob, 0, 6 + 5 * t, 0, Math.PI * 2); ctx.fill();
  } else { ctx.font = '28px serif'; ctx.fillText(w.glyph, 26, 8); }
  ctx.restore();

  const z = getZone(state.player.x, state.player.y);
  ui.innerHTML = `HP ${state.player.hp.toFixed(1)}<br>Zone: ${z?.name || 'Wilderness'}<br>Weapon: ${weaponDef().id}<br>Unlocked: ${[...state.player.unlocked].join(', ')}<br><button onclick="resetWorld()">Reset World</button>`;
}

function loop(ts) { if (!state.last) state.last = ts; const dt = Math.min(0.033, (ts - state.last) / 1000); state.last = ts; const p = state.player; p.lastX = p.x; p.lastY = p.y; update(dt); render(); requestAnimationFrame(loop); }
resize(); resetWorld(); requestAnimationFrame(loop);
