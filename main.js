const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');

const CELL = 48;
const WORLD_SCALE = 4;
const MAP_CENTER = { x: 25 * CELL * WORLD_SCALE, y: 20 * CELL * WORLD_SCALE };
const ring = (a, b) => ({ min: a * 5 * CELL * WORLD_SCALE, max: b * 5 * CELL * WORLD_SCALE });

const weapons = [
  { id: 'club', glyph: 'club', kind: 'swing', base: 8, reach: 62, speedScale: 24 },
  { id: 'sling', glyph: '🪢', kind: 'sling', base: 4, reach: 260, speedScale: 12 },
  { id: 'axe', glyph: '🪓', kind: 'swing', base: 10, reach: 68, speedScale: 26 },
  { id: 'sword', glyph: '🗡️', kind: 'swing', base: 9, reach: 72, speedScale: 27 },
  { id: 'bow', glyph: '🏹', kind: 'bow', base: 5, reach: 400, speedScale: 20 },
  { id: 'ballista', glyph: 'ballista', kind: 'sling', base: 14, reach: 470, speedScale: 10 },
  { id: 'cannon', glyph: 'cannon', kind: 'sling', base: 18, reach: 540, speedScale: 8 },
];

const zones = [
  { id: 'orchard', name: 'Club Orchard', palette: ['#1f6a3a', '#2f8e4d', '#4f5f3e'], waypoint: '🌳', enemy: '🐗', unlock: 'club', ring: ring(0, 1), arc: [0, 12] },
  { id: 'axe', name: 'Axe Grove', palette: ['#3e6b2a', '#6f8f33', '#8cad4a'], waypoint: '🪓', enemy: '🦂', unlock: 'axe', ring: ring(1, 2), arc: [9, 3] },
  { id: 'creek', name: 'Sling Creekside', palette: ['#2a5f79', '#3e89a8', '#78b8d4'], waypoint: '🌊', enemy: '🪨', unlock: 'sling', ring: ring(1, 2), arc: [3, 12], slowWater: true },
  { id: 'pasture', name: 'Pasture', palette: ['#6d8f4b', '#92b862', '#c0d98a'], waypoint: '🐄', enemy: '🐺', unlock: 'horse', ring: ring(2, 3), arc: [3, 7] },
  { id: 'smith', name: 'Smith Town', palette: ['#6d5743', '#8f7057', '#c19a72'], waypoint: '🏘️', enemy: '🛡️', unlock: 'sword', ring: ring(2, 3), arc: [7, 11] },
  { id: 'fletcher', name: 'Fletcher Village', palette: ['#5a7a3f', '#7da85b', '#b8d685'], waypoint: '🎯', enemy: '🦅', unlock: 'bow', ring: ring(2, 3), arc: [11, 3] },
  { id: 'tundra', name: 'Tundra', palette: ['#8faecc', '#c8d8e6', '#f5fbff'], waypoint: '🧊', enemy: '😠', unlock: null, ring: ring(3, 4), arc: [11.5, 0.5] },
  { id: 'sawmill', name: 'Sawmill Woods', palette: ['#355c37', '#4f7f4a', '#7ba36f'], waypoint: '🪚', enemy: '🧌', unlock: 'ballista', ring: ring(3, 4), arc: [0.5, 2.5] },
  { id: 'marsh', name: 'Marsh', palette: ['#456243', '#5e7f59', '#89a37d'], waypoint: '🦆', enemy: '🐍', unlock: null, ring: ring(3, 4), arc: [2.5, 3.5], slowWater: true },
  { id: 'marches', name: 'Marches', palette: ['#5c6166', '#7f868c', '#a4adb4'], waypoint: '🏰', enemy: '🛡️', unlock: null, ring: ring(3, 4), arc: [3.5, 5.5] },
  { id: 'desert', name: 'Desert', palette: ['#9e7338', '#c89a4f', '#e6c877'], waypoint: '🌵', enemy: '😠', unlock: null, ring: ring(3, 4), arc: [5.5, 6.5] },
  { id: 'volcano', name: 'Volcano', palette: ['#6e231f', '#a73a2f', '#df6a3f'], waypoint: '🌋', enemy: '🐜', unlock: null, ring: ring(3, 4), arc: [6.5, 8.5] },
  { id: 'mine', name: 'Mine', palette: ['#4f4a52', '#726b77', '#9a92a1'], waypoint: '⛏️', enemy: '😠', unlock: null, ring: ring(3, 4), arc: [8.5, 9.5] },
  { id: 'frost', name: 'Frosty Mountain', palette: ['#7e9fbe', '#a4bfd8', '#d8ecfb'], waypoint: '🏔️', enemy: '❄️', unlock: null, ring: ring(3, 4), arc: [9.5, 11.5] },
  { id: 'swamp', name: 'Swamp', palette: ['#2f5a2f', '#4f7b46', '#7ea85f'], waypoint: '🐸', enemy: '☠️', unlock: null, ring: ring(4, 5), arc: [2, 4], slowWater: true },
  { id: 'foundry', name: 'Foundry/Monastery', palette: ['#5e4339', '#7a5a4f', '#a37d6b'], waypoint: '🏯', enemy: '👹', unlock: 'cannon', ring: ring(4, 5), arc: [8, 10] },
  { id: 'outer_wilds', name: 'Outer Wilds', palette: ['#4f6f8f', '#6487ad', '#85abd0'], waypoint: '🧭', enemy: '😠', unlock: null, ring: ring(4, 5), arc: [10, 8] },
];

const state = { t: 0, last: 0, mouseDX: 0, mouseDY: 0, keys: new Set(), mouse: { x: 0, y: 0, down: false, held: 0 }, camera: { x: MAP_CENTER.x, y: MAP_CENTER.y }, player: null, projectiles: [], enemies: [], terrain: [], waves: {} };
const worldXY = (cx, cy) => ({ x: cx * CELL * WORLD_SCALE, y: cy * CELL * WORLD_SCALE });
const wrap12 = (h) => (h % 12 + 12) % 12;
const inArc = (hour, [start, end]) => { const h = wrap12(hour), s = wrap12(start), e = wrap12(end); return s <= e ? h >= s && h < e : h >= s || h < e; };
const toClockHour = (theta) => wrap12((theta * 6 / Math.PI) + 6); // rotated so volcano/frost on left

function getZone(x, y) {
  const dx = x - MAP_CENTER.x, dy = y - MAP_CENTER.y;
  const r = Math.hypot(dx, dy), hour = toClockHour(Math.atan2(dy, dx));
  const z = zones.find((zone) => r >= zone.ring.min && r < zone.ring.max && inArc(hour, zone.arc));
  return z || zones[0];
}

function edgeCompress01(u) { if (u <= 0.9) return u; const t = (u - 0.9) / 0.1; return 0.9 + 0.1 * ((Math.exp(2.7 * t) - 1) / (Math.exp(2.7) - 1)); }
function projectWorld(wx, wy) {
  const dx = wx - state.camera.x, dy = wy - state.camera.y;
  const nx = dx / (innerWidth * 0.62), ny = dy / (innerHeight * 0.62);
  const sx = Math.sign(nx) * edgeCompress01(Math.min(1, Math.abs(nx)));
  const sy = Math.sign(ny) * edgeCompress01(Math.min(1, Math.abs(ny)));
  return { x: innerWidth * 0.5 + sx * innerWidth * 0.5, y: innerHeight * 0.5 + sy * innerHeight * 0.5, scale: Math.max(0.28, 1 - 0.25 * Math.max(Math.abs(sx), Math.abs(sy))) };
}

function resetWorld(){ const s=worldXY(25,20); state.player={x:s.x,y:s.y,vx:0,vy:0,hp:20,weapon:'club',unlocked:new Set(['club']),swing:0,lastX:s.x,lastY:s.y}; state.projectiles=[]; state.enemies=[]; state.terrain=[]; state.waves={}; for(const z of zones){ state.waves[z.id]={spawned:false,cleared:false}; const mid=wrap12((z.arc[0]+z.arc[1])*0.5); const r=(z.ring.min+z.ring.max)*0.5; const th=(mid-6)*Math.PI/6; const bx=MAP_CENTER.x+Math.cos(th)*r, by=MAP_CENTER.y+Math.sin(th)*r; state.terrain.push({x:bx-70,y:by-40,hp:3,glyph:'🌲'}); state.terrain.push({x:bx+45,y:by+20,hp:3,glyph:'🪨'});} }
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);} addEventListener('resize',resize);
addEventListener('keydown',e=>{state.keys.add(e.key.toLowerCase()); if(e.key===' ') trig(true); if(e.key.toLowerCase()==='r') resetWorld(); if(/[1-7]/.test(e.key)){const w=weapons[Number(e.key)-1]; if(state.player.unlocked.has(w.id)) state.player.weapon=w.id;}});
addEventListener('keyup',e=>{state.keys.delete(e.key.toLowerCase()); if(e.key===' ') rel(true);}); canvas.addEventListener('mousemove',e=>{state.mouseDX=e.movementX||0;state.mouseDY=e.movementY||0;state.mouse.x=e.clientX;state.mouse.y=e.clientY;}); canvas.addEventListener('mousedown',()=>trig(false)); addEventListener('mouseup',()=>rel(false));
const weaponDef=()=>weapons.find(w=>w.id===state.player.weapon); const trig=sp=>{if(sp?state.spaceDown:state.mouse.down)return; if(sp)state.spaceDown=true; else state.mouse.down=true; state.mouse.held=0; if(weaponDef().kind==='swing') state.player.swing=1;}; const rel=sp=>{if(sp)state.spaceDown=false; else state.mouse.down=false; const w=weaponDef(); if(w.kind==='bow'||w.kind==='sling') fireCharge(w);};
function fireCharge(w){const h=Math.min(1,state.mouse.held/1.5),p=state.player,a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),sp=220+h*420; state.projectiles.push({x:p.x+Math.cos(a)*24,y:p.y+Math.sin(a)*24,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:2,dmg:Math.round(w.base+h*w.speedScale),glyph:w.kind==='bow'?'➳':'🪨'});} 
function update(dt){const p=state.player; state.t+=dt; let dx=(state.keys.has('d')||state.keys.has('arrowright')?1:0)-(state.keys.has('a')||state.keys.has('arrowleft')?1:0),dy=(state.keys.has('s')||state.keys.has('arrowdown')?1:0)-(state.keys.has('w')||state.keys.has('arrowup')?1:0); const m=Math.hypot(dx,dy)||1; dx/=m;dy/=m; const zone=getZone(p.x,p.y), slow=zone?.slowWater?0.65:1; const hasHorse=p.unlocked.has('horse'); const speedMul=hasHorse?1.45:1; const accel=hasHorse?3.6:7.5; const tvx=dx*220*slow*speedMul,tvy=dy*220*slow*speedMul; p.vx+=(tvx-p.vx)*Math.min(1,accel*dt); p.vy+=(tvy-p.vy)*Math.min(1,accel*dt); p.x+=p.vx*dt; p.y+=p.vy*dt; state.camera.x+=(p.x-state.camera.x)*0.1; state.camera.y+=(p.y-state.camera.y)*0.1; if(state.mouse.down||state.spaceDown) state.mouse.held+=dt; if(zone&&!state.waves[zone.id].spawned){state.waves[zone.id].spawned=true; for(let i=0;i<4;i++) state.enemies.push({x:p.x+Math.cos(i)*140,y:p.y+Math.sin(i*2)*120,hp:8,glyph:zone.enemy||'😠',zone:zone.id});} if(p.swing>0){p.swing-=dt*3; doSwingDamage();} for(const pr of state.projectiles){pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.life-=dt;} state.projectiles=state.projectiles.filter(pr=>pr.life>0); for(const e of state.enemies){const ax=p.x-e.x,ay=p.y-e.y,d=Math.hypot(ax,ay)||1; e.x+=ax/d*80*dt; e.y+=ay/d*80*dt; if(d<20) p.hp=Math.max(0,p.hp-dt*2);} hitChecks(); if(zone&&!state.enemies.some(e=>e.zone===zone.id&&e.hp>0)&&!state.waves[zone.id].cleared){state.waves[zone.id].cleared=true; if(zone.unlock) p.unlocked.add(zone.unlock);} }
function doSwingDamage(){const p=state.player,w=weaponDef(); if(w.kind!=='swing')return; const mv=Math.hypot(p.x-p.lastX,p.y-p.lastY)*60, mouse=Math.hypot(state.mouseDX,state.mouseDY), power=w.base+(mv+mouse)*0.08, a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2), sx=p.x+Math.cos(a)*w.reach, sy=p.y+Math.sin(a)*w.reach; for(const e of state.enemies) if(Math.hypot(e.x-sx,e.y-sy)<45)e.hp-=power*0.08; for(const t of state.terrain) if(Math.hypot(t.x-sx,t.y-sy)<45)t.hp-=power*0.06;}
function hitChecks(){for(const pr of state.projectiles){for(const e of state.enemies) if(Math.hypot(e.x-pr.x,e.y-pr.y)<22){e.hp-=pr.dmg;pr.life=0;} for(const t of state.terrain) if(Math.hypot(t.x-pr.x,t.y-pr.y)<20){t.hp-=pr.dmg*0.8;pr.life=0;}} state.enemies=state.enemies.filter(e=>e.hp>0); state.terrain=state.terrain.filter(t=>t.hp>0);}
function hex(x,y,r){ctx.beginPath(); for(let i=0;i<6;i++){const a=Math.PI/3*i+Math.PI/6,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r; i?ctx.lineTo(px,py):ctx.moveTo(px,py);} ctx.closePath();}
function drawHexBackground(){const size=24,h=Math.sqrt(3)*size,v=1.5*size,worldW=innerWidth*1.5,worldH=innerHeight*1.5; const r0=Math.floor((state.camera.y-worldH*0.5)/v)-2,r1=Math.ceil((state.camera.y+worldH*0.5)/v)+2,c0=Math.floor((state.camera.x-worldW*0.5)/h)-2,c1=Math.ceil((state.camera.x+worldW*0.5)/h)+2; for(let row=r0;row<=r1;row++){ for(let col=c0;col<=c1;col++){ const wx=col*h+(row%2?h/2:0), wy=row*v, p=projectWorld(wx,wy); if(p.x<-30||p.x>innerWidth+30||p.y<-30||p.y>innerHeight+30) continue; const z=getZone(wx,wy), pal=z.palette; const q = col - ((row - (row & 1)) >> 1); const idx=((q-row)%3+3)%3; ctx.fillStyle=pal[idx]; hex(p.x,p.y,Math.max(2,size*p.scale)); ctx.fill(); } } }
function drawRiver(){const seg=[]; for(let hh=11;hh<=14.5;hh+=0.2){const th=(hh-6)*Math.PI/6, rr=3*5*CELL*WORLD_SCALE+Math.sin(hh*3)*12; seg.push(projectWorld(MAP_CENTER.x+Math.cos(th)*rr,MAP_CENTER.y+Math.sin(th)*rr));} ctx.strokeStyle='#5ec6ffcc';ctx.lineWidth=16;ctx.lineCap='round';ctx.beginPath(); seg.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke();}
function render(){ctx.clearRect(0,0,innerWidth,innerHeight); drawHexBackground(); drawRiver(); for(const z of zones){const mid=wrap12((z.arc[0]+z.arc[1])*0.5), rr=(z.ring.min+z.ring.max)*0.5, th=(mid-6)*Math.PI/6, p=projectWorld(MAP_CENTER.x+Math.cos(th)*rr,MAP_CENTER.y+Math.sin(th)*rr); ctx.fillStyle='#fff8'; ctx.font=`${Math.max(10,16*p.scale)}px sans-serif`; ctx.fillText(`${z.waypoint} ${z.name}`,p.x-40*p.scale,p.y);} for(const z of zones){ if(z.id==='marches'){ for(let i=0;i<6;i++){ const hh=3.7+i*0.28, rr=3.45*5*CELL*WORLD_SCALE, th=(hh-6)*Math.PI/6; const rp=projectWorld(MAP_CENTER.x+Math.cos(th)*rr,MAP_CENTER.y+Math.sin(th)*rr); ctx.font=`${Math.max(16,38*rp.scale)}px serif`; ctx.fillText('♜',rp.x,rp.y);} } } for(const t of state.terrain){const p=projectWorld(t.x,t.y); ctx.font=`${Math.max(12,30*p.scale)}px serif`; ctx.fillText(t.glyph,p.x-12*p.scale,p.y+10*p.scale);} for(const e of state.enemies){const p=projectWorld(e.x,e.y); ctx.font=`${Math.max(11,26*p.scale)}px serif`; ctx.fillText(e.glyph,p.x-10*p.scale,p.y+8*p.scale);} for(const pr of state.projectiles){const p=projectWorld(pr.x,pr.y); ctx.font=`${Math.max(10,20*p.scale)}px serif`; ctx.fillText(pr.glyph,p.x-8*p.scale,p.y+8*p.scale);} const pp=projectWorld(state.player.x,state.player.y),aim=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2); ctx.font='34px serif';ctx.fillText('🙂',pp.x-14,pp.y+12); ctx.save();ctx.translate(pp.x,pp.y); const w=weaponDef(),swingT=Math.max(0,state.player.swing),swingAngle=w.kind==='swing'?Math.sin((1-swingT)*Math.PI*2.2)*0.8*swingT:0; ctx.rotate(aim+swingAngle); if(w.id==='club'){ctx.strokeStyle='#6f3f1f';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(56,0);ctx.stroke();} else if(w.id==='axe'){ctx.save();ctx.translate(16,0);ctx.rotate(Math.PI);ctx.font='28px serif';ctx.fillText('🪓',0,8);ctx.restore();} else if(w.kind==='bow'&&(state.mouse.down||state.spaceDown)){const t=Math.min(1,state.mouse.held/1.7),wob=Math.sin(state.t*60*t)*4*t;ctx.font=`${24+16*t+wob}px serif`;ctx.fillText('🏹',22+18*t,8+wob);ctx.font=`${18+14*t}px serif`;ctx.fillText('➳',42+24*t,8);} else if(w.kind==='sling'&&(state.mouse.down||state.spaceDown)){const t=Math.min(1,state.mouse.held/1.4),wob=Math.sin(state.t*50*t)*10*t;ctx.font='28px serif';ctx.fillText('🪢',24,8);ctx.fillStyle='#ddd';ctx.beginPath();ctx.arc(54+22*t+wob,0,6+5*t,0,Math.PI*2);ctx.fill();} else if(w.id==='ballista'){ctx.font='26px serif';ctx.fillText('🏹',24,8);ctx.font='20px serif';ctx.fillText('⚙️',34,10);} else if(w.id==='cannon'){ctx.save();ctx.translate(30,2);ctx.rotate(Math.PI/2);ctx.scale(1,0.72);ctx.font='30px serif';ctx.fillText('🔔',0,0);ctx.restore();} else {ctx.font='28px serif';ctx.fillText(w.glyph,26,8);} ctx.restore(); const z=getZone(state.player.x,state.player.y); const dx=state.player.x-MAP_CENTER.x,dy=state.player.y-MAP_CENTER.y; const radius=(Math.hypot(dx,dy)/(5*CELL*WORLD_SCALE)).toFixed(2); const clock=wrap12((Math.atan2(dy,dx)*6/Math.PI)+6).toFixed(2); ui.innerHTML=`HP ${state.player.hp.toFixed(1)}<br>Zone: ${z.name}<br>R: ${radius} · Clock12: ${clock}<br>Weapon: ${weaponDef().id}<br>Unlocked: ${[...state.player.unlocked].join(', ')}<br><button onclick="resetWorld()">Reset World</button>`; }
function loop(ts){if(!state.last)state.last=ts; const dt=Math.min(0.033,(ts-state.last)/1000); state.last=ts; const p=state.player; p.lastX=p.x;p.lastY=p.y; update(dt); render(); requestAnimationFrame(loop);} resize(); resetWorld(); requestAnimationFrame(loop);
