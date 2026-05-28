const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');

const CELL = 48;
const WORLD_SCALE = 4;
const MAP_CENTER = { x: 25 * CELL * WORLD_SCALE, y: 20 * CELL * WORLD_SCALE };
const RADIUS_UNIT = 5 * CELL * WORLD_SCALE;
const WORLD_MAX_R = 5 * RADIUS_UNIT;
const ring = (a, b) => ({ min: a * 5 * CELL * WORLD_SCALE, max: b * 5 * CELL * WORLD_SCALE });

const weapons = [
  { id: 'club', glyph: 'club', kind: 'swing', knock: 8, pierce: 0.4, reach: 62 },
  { id: 'sling', glyph: '🪢', kind: 'sling', knock: 7, pierce: 0.5, reach: 280 },
  { id: 'axe', glyph: '🪓', kind: 'swing', knock: 6, pierce: 6.5, reach: 68 },
  { id: 'sword', glyph: '🗡️', kind: 'swing', knock: 1.2, pierce: 9, reach: 72 },
  { id: 'bow', glyph: '🏹', kind: 'bow', knock: 1.5, pierce: 9.5, reach: 440 },
  { id: 'ballista', glyph: 'ballista', kind: 'bow', knock: 5.5, pierce: 11, reach: 520 },
  { id: 'cannon', glyph: 'cannon', kind: 'cannon', knock: 12, pierce: 2, reach: 560 },
];

const zones = [
  { id: 'orchard', name: 'Club Orchard', palette: ['#245e3a','#2e7548','#3f8d59'], enemy: '🐗', unlock: 'club', ring: ring(0,1), arc:[0,12], deco:'orchard' },
  { id: 'axe', name: 'Axe Grove', palette: ['#2f612f','#3b7c3a','#5b8f4f'], enemy: '🦂', unlock: 'axe', ring: ring(1,2), arc:[9,3], deco:'axe_grove' },
  { id: 'creek', name: 'Sling Creekside', palette: ['#2a5f79','#3e89a8','#78b8d4'], enemy: '🪨', unlock: 'sling', ring: ring(1,2), arc:[3,12], slowWater:true, deco:'creek' },
  { id: 'pasture', name: 'Pasture', palette: ['#6d8f4b','#92b862','#c0d98a'], enemy: '🐺', unlock: 'horse', ring: ring(2,3), arc:[3,7], deco:'pasture' },
  { id: 'smith', name: 'Smith Town', palette: ['#7a5a48','#9a7358','#ba8a6a'], enemy: '🛡️', unlock: 'sword', ring: ring(2,3), arc:[7,11], deco:'smith' },
  { id: 'fletcher', name: 'Fletcher Village', palette: ['#5a7a3f','#7da85b','#b8d685'], enemy: '🦅', unlock: 'bow', ring: ring(2,3), arc:[11,3], deco:'fletcher' },
  { id: 'tundra', name: 'Tundra', palette: ['#8faecc','#c8d8e6','#f5fbff'], enemy: '😠', unlock: null, ring: ring(3,4), arc:[11.5,0.5], deco:'snow' },
  { id: 'sawmill', name: 'Sawmill Woods', palette: ['#254d2a','#2f6232','#3e7840'], enemy: '🧌', unlock: 'ballista', ring: ring(3,4), arc:[0.5,2.5], deco:'sawmill' },
  { id: 'marsh', name: 'Marsh', palette: ['#456243','#5e7f59','#89a37d'], enemy: '🐍', unlock: null, ring: ring(3,4), arc:[2.5,3.5], slowWater:true, deco:'marsh' },
  { id: 'marches', name: 'Marches', palette: ['#6d3e2f','#8a4f37','#b06343'], enemy: '🛡️', unlock: null, ring: ring(3,4), arc:[3.5,5.5], deco:'marches' },
  { id: 'desert', name: 'Desert', palette: ['#9e7338','#c89a4f','#e6c877'], enemy: '😠', unlock: null, ring: ring(3,4), arc:[5.5,6.5], deco:'desert' },
  { id: 'volcano', name: 'Volcano', palette: ['#6e231f','#a73a2f','#df6a3f'], enemy: '🐜', unlock: null, ring: ring(3,4), arc:[6.5,8.5], deco:'volcano' },
  { id: 'mine', name: 'Mine', palette: ['#4f4a52','#726b77','#9a92a1'], enemy: '😠', unlock: null, ring: ring(3,4), arc:[8.5,9.5], deco:'mine' },
  { id: 'frost', name: 'Frosty Mountain', palette: ['#7e9fbe','#a4bfd8','#d8ecfb'], enemy: '❄️', unlock: null, ring: ring(3,4), arc:[9.5,11.5], deco:'frost' },
  { id: 'swamp', name: 'Swamp', palette: ['#2f5a2f','#4f7b46','#7ea85f'], enemy: '☠️', unlock: null, ring: ring(4,5), arc:[2,4], slowWater:true, deco:'swamp' },
  { id: 'foundry', name: 'Foundry/Monastery', palette: ['#5e4339','#7a5a4f','#a37d6b'], enemy: '👹', unlock: 'cannon', ring: ring(4,5), arc:[8,10], deco:'foundry' },
];

const state = { t:0,last:0,keys:new Set(),mouse:{x:0,y:0,down:false,held:0},camera:{x:MAP_CENTER.x,y:MAP_CENTER.y},player:null,projectiles:[],enemies:[],terrain:[],waves:{},mount:'foot',debug:[],diamonds:0,meta:{},pendingReward:null,offerNpc:null,currentZone:null,run:1 };
const BUILD_VERSION = 'v0.1.3 build 2026-05-28 20:50 UTC';
const wrap12=h=>(h%12+12)%12; const inArc=(h,[s,e])=>{h=wrap12(h);s=wrap12(s);e=wrap12(e);return s<=e?(h>=s&&h<e):(h>=s||h<e)}; const toClockHour=t=>wrap12((t*6/Math.PI)+3);
const weaponDef=()=>weapons.find(w=>w.id===state.player.weapon);
const MINOR_ZONES = new Set(['tundra','marsh','desert','mine']);
const UPGRADE_STATS = ['speed','range','damage','knockback'];
const ZONE_NPCS = {orchard:'👨‍🌾',creek:'🧒',axe:'🧔',pasture:'🐎',smith:'🛡️',fletcher:'🏹',sawmill:'🪚',marches:'♜',volcano:'🧙‍♂️',frost:'🧪',swamp:'🧙‍♀️',foundry:'🙏'};
function metaFor(id){ if(!state.meta[id]) state.meta[id]={speed:0,range:0,damage:0,knockback:0}; return state.meta[id]; }
function effectiveWeapon(base){ const m=metaFor(base.id); return {...base, knock:base.knock+m.knockback*0.6, reach:base.reach+m.range*16, damageMult:1+m.damage*0.13, speedMult:1+m.speed*0.08, tiers:m}; }
function rewardWeaponForZone(zone){ return zone.unlock || state.player.weapon; }
function buildReward(zone){ const weapon=rewardWeaponForZone(zone); const stats=UPGRADE_STATS.map(stat=>({weapon,stat,label:`${weapon} +${stat}`})); const wave=state.waves[zone.id]?.wave||1; state.pendingReward={zone:zone.id,wave,options:[stats[wave%4],stats[(wave+1)%4],{diamonds:8+wave*2,label:`take ${8+wave*2}♦`}]}; state.offerNpc={x:state.player.x+42,y:state.player.y-34,glyph:ZONE_NPCS[zone.id]||'🙂',zone:zone.id}; dbg(`[REWARD] ${zone.name} wave ${wave} cleared; choose upgrade`); }
function chooseReward(i){ const reward=state.pendingReward; if(!reward) return; const option=reward.options[i]; if(!option) return; if(option.diamonds){ state.diamonds+=option.diamonds; dbg(`[REWARD] +${option.diamonds}♦`); } else { const m=metaFor(option.weapon); m[option.stat]++; dbg(`[UPGRADE] ${option.weapon}.${option.stat} -> ${m[option.stat]}`); } const w=state.waves[reward.zone]; if(w){w.wave++;w.spawned=false;w.cleared=false; dbg(`[NEXT] ${reward.zone} wave ${w.wave} armed`);} state.pendingReward=null; state.offerNpc=null; }
window.chooseReward=chooseReward;
function resurrect(){ dbg(`[DOWNFALL] run ${state.run} ended; upgrades persist, waves reset`); state.run++; state.player.x=MAP_CENTER.x; state.player.y=MAP_CENTER.y; state.player.vx=0; state.player.vy=0; state.player.hp=20; state.player.weapon='club'; state.player.unlocked=new Set(['club']); state.mount='foot'; state.enemies=[]; state.projectiles=[]; state.pendingReward=null; state.offerNpc=null; state.currentZone=null; for(const z of zones) state.waves[z.id]={wave:1,spawned:false,cleared:false}; }
function spawnWave(zone){ const wave=state.waves[zone.id]?.wave||1; state.waves[zone.id].spawned=true; const count=3+Math.min(7,Math.floor(wave*0.7)); const hp=7*(1+wave*0.22); for(let i=0;i<count;i++)state.enemies.push({x:state.player.x+Math.cos(i*2.4)*150,y:state.player.y+Math.sin(i*1.9)*130,hp,glyph:zone.enemy||'😠',zone:zone.id,vx:0,vy:0,bounty:2+wave}); dbg(`[WAVE] ${zone.name} wave ${wave} enemies=${count} hp=${hp.toFixed(1)}`); }
function completeWave(zone){ const waveState=state.waves[zone.id]; if(!waveState||waveState.cleared) return; waveState.cleared=true; if(zone.unlock) state.player.unlocked.add(zone.unlock); if(MINOR_ZONES.has(zone.id)){ const bonus=5+(waveState.wave||1); state.diamonds+=bonus; dbg(`[MINOR] ${zone.name} wave ${waveState.wave} +${bonus}♦`); waveState.wave++; waveState.spawned=false; waveState.cleared=false; return; } buildReward(zone); }
function resolveEnemySpacing(){ const p=state.player; const pr=state.mount==='horse'&&p.unlocked.has('horse')?28:18, er=16; for(let i=0;i<state.enemies.length;i++){ const e=state.enemies[i]; for(let j=i+1;j<state.enemies.length;j++){ const o=state.enemies[j], dx=o.x-e.x, dy=o.y-e.y, d=Math.hypot(dx,dy)||1, min=er*2; if(d<min){ const push=(min-d)*0.5, nx=dx/d, ny=dy/d; e.x-=nx*push; e.y-=ny*push; o.x+=nx*push; o.y+=ny*push; } } const dx=p.x-e.x, dy=p.y-e.y, d=Math.hypot(dx,dy)||1, min=pr+er; if(d<min){ const nx=dx/d, ny=dy/d, push=min-d; e.x-=nx*push*0.65; e.y-=ny*push*0.65; p.x+=nx*push*0.35; p.y+=ny*push*0.35; p.vx+=nx*18; p.vy+=ny*18; p.hp=Math.max(0,p.hp-0.015); } } }
function getZone(x,y){const dx=x-MAP_CENTER.x,dy=y-MAP_CENTER.y,r=Math.hypot(dx,dy),h=toClockHour(Math.atan2(dy,dx)); return zones.find(z=>r>=z.ring.min&&r<z.ring.max&&inArc(h,z.arc))||null;}
function projectWorld(wx,wy){ const dx=wx-state.camera.x, dy=wy-state.camera.y; const pxPerWorld=0.55; return {x:innerWidth*0.5 + dx*pxPerWorld, y:innerHeight*0.5 + dy*pxPerWorld, scale:1}; }

function spawnZoneDecor(z){
  const cfg={orchard:{n:48,g:['🌳','🌳','🌲'],uniform:true},axe_grove:{n:70,g:['🌲','🌲','🌲','🌲','🌲','🌳']},sawmill:{n:260,g:['🌲','🌳','🌴','🌲']},smith:{n:90,g:['🧱']},fletcher:{n:25,g:['🧱','🌲']},foundry:{n:35,g:['🧱','🪨']},mine:{n:80,g:['🪨']},frost:{n:70,g:['🪨']},marches:{n:45,g:['♜']},desert:{n:55,g:['🌵']},creek:{n:18,g:['🌲']},swamp:{n:18,g:['🌲']},pasture:{n:8,g:['🌿']},marsh:{n:14,g:['🌿']},volcano:{n:16,g:['🪨']},snow:{n:10,g:['🪨']}}[z.deco]||{n:8,g:['🌿']};
  for(let i=0;i<cfg.n;i++){let h,rr; if(cfg.uniform){ const start=z.arc[0],end=z.arc[1]; const span=((end-start+12)%12)||12; const t=(i*0.61803398875+Math.random()*0.18)%1; h=(start + t*span)%12; rr=z.ring.min+(z.ring.max-z.ring.min)*(0.18+0.64*Math.sqrt((i+Math.random())/cfg.n)); } else { h=Math.random()*12; if(!inArc(h,z.arc))continue; rr=z.ring.min+(z.ring.max-z.ring.min)*(0.08+0.84*Math.random()); } const th=(h-3)*Math.PI/6; const glyph=cfg.g[(Math.random()*cfg.g.length)|0]; const type=(glyph==='🧱'||glyph==='🪨')?'wall':'tree'; state.terrain.push({x:MAP_CENTER.x+Math.cos(th)*rr,y:MAP_CENTER.y+Math.sin(th)*rr,hp:3,glyph,type,solid:true,stump:false,color:glyph==='♜'?'#000':null});}
}

function resetWorld(){const s={x:MAP_CENTER.x,y:MAP_CENTER.y};state.player={x:s.x,y:s.y,vx:0,vy:0,hp:20,weapon:'club',unlocked:new Set(['club']),swing:0,lastX:s.x,lastY:s.y}; state.mount='foot'; state.projectiles=[];state.enemies=[];state.terrain=[];state.waves={};state.pendingReward=null;state.offerNpc=null;state.currentZone=null; for(const z of zones){state.waves[z.id]={wave:1,spawned:false,cleared:false};spawnZoneDecor(z);} }

function riverPushAt(x,y){const dx=x-MAP_CENTER.x,dy=y-MAP_CENTER.y,r=Math.hypot(dx,dy),h=toClockHour(Math.atan2(dy,dx));const on=Math.abs(r-(3*5*CELL*WORLD_SCALE))<70&&(inArc(h,[11,2.5])||inArc(h,[2.5,4])); if(!on)return{x:0,y:0,slow:1}; const th=(4.2-3)*Math.PI/6; return{x:Math.cos(th)*65,y:Math.sin(th)*65,slow:0.64};}

function collidesObstacle(x,y,{blockStumps=true}={}){for(const t of state.terrain){if(!t.solid)continue; if(t.stump&&!blockStumps)continue; const dx=t.x-x,dy=t.y-y; if(dx*dx+dy*dy<1156)return t;} return null;}
function collidesTree(x,y){return collidesObstacle(x,y);}


function dbg(msg){ state.debug.push(msg); if(state.debug.length>28) state.debug.shift(); }

function update(dt){const p=state.player; let dx=(state.keys.has('d')?1:0)-(state.keys.has('a')?1:0),dy=(state.keys.has('s')?1:0)-(state.keys.has('w')?1:0); const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;
  const zone=getZone(p.x,p.y), flow=riverPushAt(p.x,p.y); if(zone?.id!==state.currentZone){state.currentZone=zone?.id||null; if(zone)dbg(`[ZONE] entered ${zone.name} wave=${state.waves[zone.id]?.wave||1} spawned=${!!state.waves[zone.id]?.spawned}`);} const horseEq=state.mount==='horse'&&p.unlocked.has('horse'); const horse=metaFor('horse'); const speed=horseEq?1.5+horse.speed*0.08:1,accel=horseEq?3.2+horse.range*0.15:7.5;
  const baseSpeed = (8 * RADIUS_UNIT) / 60; // 8 radii per minute
  const tvx=dx*baseSpeed*speed*flow.slow,tvy=dy*baseSpeed*speed*flow.slow; p.vx+=(tvx-p.vx)*Math.min(1,accel*dt); p.vy+=(tvy-p.vy)*Math.min(1,accel*dt);
  const nx=p.x+(p.vx+flow.x)*dt, ny=p.y+(p.vy+flow.y)*dt; const block=collidesObstacle(nx,ny); if(block){ if(block.stump){p.vx*=0.35;p.vy*=0.35;p.x=nx;p.y=ny;} } else {p.x=nx;p.y=ny;}
  const rr=Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y); if(rr>WORLD_MAX_R-20){const s=(WORLD_MAX_R-20)/rr;p.x=MAP_CENTER.x+(p.x-MAP_CENTER.x)*s;p.y=MAP_CENTER.y+(p.y-MAP_CENTER.y)*s;p.vx=0;p.vy=0;}
  state.camera.x+=(p.x-state.camera.x)*0.1; state.camera.y+=(p.y-state.camera.y)*0.1;
  if(state.mouse.down)state.mouse.held+=dt;
  if(zone&&!state.pendingReward&&!state.waves[zone.id].spawned&&!state.waves[zone.id].cleared&&!state.enemies.some(e=>e.zone===zone.id&&e.hp>0))spawnWave(zone);
  if(p.swing>0){p.swing-=dt*3;doSwingDamage();}
  for(const pr of state.projectiles){const nx=pr.x+pr.vx*dt,ny=pr.y+pr.vy*dt; if(collidesObstacle(nx,ny,{blockStumps:false})&&!pr.overStump){pr.life=0;continue;} pr.x=nx;pr.y=ny;pr.life-=dt;}
  state.projectiles=state.projectiles.filter(pr=>pr.life>0);
  for(const e of state.enemies){e.vx=(e.vx||0)*0.9; e.vy=(e.vy||0)*0.9; const ax=p.x-e.x,ay=p.y-e.y,d=Math.hypot(ax,ay)||1; e.vx += ax/d*18*dt; e.vy += ay/d*18*dt; e.x += e.vx*dt + ax/d*22*dt; e.y += e.vy*dt + ay/d*22*dt;} resolveEnemySpacing(); hitChecks(); if(p.hp<=0)resurrect();
  if(zone&&!state.pendingReward&&!state.enemies.some(e=>e.zone===zone.id&&e.hp>0))completeWave(zone); }

function applyHit(target, weapon, scale=1){
  const knock=weapon.knock*scale, pierce=weapon.pierce*scale;
  if(target.type==='tree' && !target.stump){target.hp -= (knock*pierce)*0.08;}
  else if(target.type==='wall' && !target.stump){target.hp -= knock*0.12;}
  if(target.hp<=0 && !target.stump){target.stump=true;target.solid=true; target.type='stump'; target.glyph=(target.type==='wall'?'◼':'◼');}
}

function doSwingDamage(){const p=state.player,w=effectiveWeapon(weaponDef());if(w.kind!=='swing')return; const a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2); const sx=p.x+Math.cos(a)*w.reach,sy=p.y+Math.sin(a)*w.reach;
 const swingSpeed = Math.hypot(state.player.vx,state.player.vy) + Math.hypot(state.mouse.x-innerWidth/2,state.mouse.y-innerHeight/2)*0.002;
 for(const e of state.enemies){if(Math.hypot(e.x-sx,e.y-sy)<45){const spMul=(1+Math.min(2,swingSpeed/220))*w.speedMult; const dmg=(w.pierce*0.5+w.knock*0.25)*spMul*w.damageMult; e.hp-=dmg; const kb=w.knock*spMul*2.4; e.vx=(e.vx||0)+Math.cos(a)*kb; e.vy=(e.vy||0)+Math.sin(a)*kb; dbg(`[SWING:${w.id}] -> enemy ${e.glyph} dmg=${dmg.toFixed(2)} kb=${kb.toFixed(1)} hp=${e.hp.toFixed(2)} ang=${a.toFixed(2)}`);}}
 for(const t of state.terrain){if(Math.hypot(t.x-sx,t.y-sy)<45)applyHit(t,w,1);} }

function hitChecks(){for(const pr of state.projectiles){for(const e of state.enemies){if(Math.hypot(e.x-pr.x,e.y-pr.y)<22){const spMul=1+Math.min(3,pr.speed/320); const dmg=(pr.pierce*0.6+pr.knock*0.4)*spMul*(pr.damageMult||1); e.hp-=dmg; const kb=pr.knock*spMul*2.8; const aa=Math.atan2(pr.vy,pr.vx); e.vx=(e.vx||0)+Math.cos(aa)*kb; e.vy=(e.vy||0)+Math.sin(aa)*kb; dbg(`[HIT] ${pr.source||'proj'} -> enemy ${e.glyph} dmg=${dmg.toFixed(2)} kb=${kb.toFixed(1)} hp=${e.hp.toFixed(2)} ang=${pr.angle.toFixed(2)} spd=${pr.speed.toFixed(1)}`); pr.life=0;}} for(const t of state.terrain){if(Math.hypot(t.x-pr.x,t.y-pr.y)<22){applyHit(t,{knock:pr.knock,pierce:pr.pierce},1); dbg(`[IMPACT] ${pr.source||'proj'} -> ${t.type}${t.stump?'(stump)':''} hp=${t.hp.toFixed(2)} k=${pr.knock.toFixed(2)} p=${pr.pierce.toFixed(2)}`); pr.life=0;}}} state.enemies=state.enemies.filter(e=>{if(e.hp<=0){const bounty=e.bounty||2;state.diamonds+=bounty;dbg(`[BOUNTY] ${e.glyph} +${bounty}♦ total=${state.diamonds}`);return false;}return true;});}

function fireCharge(){const w=effectiveWeapon(weaponDef()); const h=Math.min(1,state.mouse.held/1.5),p=state.player,a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),sp=(240+h*460)*w.speedMult;
 let glyph='●',size=12,knock=w.knock,pierce=w.pierce;
 if(w.id==='bow'){glyph='➳';size=22;} if(w.id==='ballista'){glyph='➳';size=34;} if(w.id==='cannon'){glyph='●';size=28;knock=13;pierce=2.2;} if(w.id==='sling'){glyph='●';size=12;knock=7.5;pierce=0.5;}
 const pvx = Math.cos(a)*sp + p.vx; const pvy = Math.sin(a)*sp + p.vy; const pspd=Math.hypot(pvx,pvy);
 state.projectiles.push({x:p.x+Math.cos(a)*24,y:p.y+Math.sin(a)*24,vx:pvx,vy:pvy,life:2.2,glyph,size,knock,pierce,damageMult:w.damageMult,angle:a,speed:pspd,source:w.id});
  dbg(`[FIRE] ${w.id} ang=${a.toFixed(2)} spd=${sp.toFixed(1)} knock=${knock.toFixed(2)} pierce=${pierce.toFixed(2)}`); }

function hex(x,y,r){ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i+Math.PI/6,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();}
function drawHexBackground(){const size=12,pack=1.34,h=Math.sqrt(3)*size*pack,v=1.5*size*pack,worldW=innerWidth*1.3,worldH=innerHeight*1.3; const r0=Math.floor((state.camera.y-worldH*0.5)/v)-2,r1=Math.ceil((state.camera.y+worldH*0.5)/v)+2,c0=Math.floor((state.camera.x-worldW*0.5)/h)-2,c1=Math.ceil((state.camera.x+worldW*0.5)/h)+2; for(let row=r0;row<=r1;row++){for(let col=c0;col<=c1;col++){const wx=col*h+(row%2?h/2:0),wy=row*v,p=projectWorld(wx,wy); if(p.x<-8||p.x>innerWidth+8||p.y<-8||p.y>innerHeight+8)continue; let z=getZone(wx,wy); if(!z) z=zones[0]; const q=col-((row-(row&1))>>1),idx=((q-row)%3+3)%3; ctx.fillStyle=z.palette[idx]; hex(p.x,p.y,size); ctx.fill();}}}
function drawRiver(){const seg=[]; for(let h=11;h<=12;h+=0.08){const th=(h-3)*Math.PI/6,r=3*5*CELL*WORLD_SCALE;seg.push(projectWorld(MAP_CENTER.x+Math.cos(th)*r,MAP_CENTER.y+Math.sin(th)*r));} for(let h=0;h<=4.2;h+=0.08){const th=(h-3)*Math.PI/6,r=3*5*CELL*WORLD_SCALE;seg.push(projectWorld(MAP_CENTER.x+Math.cos(th)*r,MAP_CENTER.y+Math.sin(th)*r));} ctx.strokeStyle='#6ad7ffcc';ctx.lineWidth=42;ctx.lineCap='round';ctx.beginPath(); seg.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke();}

function render(){ctx.clearRect(0,0,innerWidth,innerHeight); drawHexBackground(); drawRiver();
  const wps=[
    {id:'volcano',glyph:'🌋',h:7.5,r:3.8*RADIUS_UNIT,color:'#fff'},
    {id:'frost',glyph:'🏔️',h:10.5,r:3.8*RADIUS_UNIT,color:'#fff'},
    {id:'marches',glyph:'♜',h:4.5,r:3.55*RADIUS_UNIT,color:'#000'},
    {id:'sawmill',glyph:'🌳',h:1.5,r:3.55*RADIUS_UNIT,color:'#fff'}
  ];
  for(const wp of wps){ const th=(wp.h-3)*Math.PI/6; const wx=MAP_CENTER.x+Math.cos(th)*wp.r, wy=MAP_CENTER.y+Math.sin(th)*wp.r; const actual=projectWorld(wx,wy); const on=actual.x>=30&&actual.x<=innerWidth-30&&actual.y>=30&&actual.y<=innerHeight-30; const dx=actual.x-innerWidth/2,dy=actual.y-innerHeight/2,scale=on?1:Math.min((innerWidth/2-36)/Math.max(1,Math.abs(dx)),(innerHeight/2-36)/Math.max(1,Math.abs(dy)),1); const sx=on?actual.x:innerWidth/2+dx*scale, sy=on?actual.y:innerHeight/2+dy*scale; const dist=Math.hypot(wx-state.player.x,wy-state.player.y); const t=Math.max(0,1-dist/(2.8*RADIUS_UNIT)); const sz=(on?24:34)+56*t; ctx.fillStyle=wp.color; ctx.font=`${sz.toFixed(0)}px serif`; ctx.fillText(wp.glyph,sx,sy);}
 for(const t of state.terrain){const p=projectWorld(t.x,t.y); if(t.color)ctx.fillStyle=t.color; else ctx.fillStyle='#fff'; if(t.stump){ctx.fillStyle='#4a2b1a';ctx.fillRect(p.x-5,p.y-5,10,10);} else {ctx.font=`${t.glyph==='♜'?22:16}px serif`; ctx.fillText(t.glyph,p.x,p.y);} }
 if(state.offerNpc){const p=projectWorld(state.offerNpc.x,state.offerNpc.y);ctx.font='28px serif';ctx.fillStyle='#fff';ctx.fillText(state.offerNpc.glyph,p.x,p.y);ctx.font='12px sans-serif';ctx.fillText('upgrade?',p.x-12,p.y+14);}
 for(const e of state.enemies){const p=projectWorld(e.x,e.y);ctx.font='16px serif';ctx.fillStyle='#fff';ctx.fillText(e.glyph,p.x,p.y);}
 for(const pr of state.projectiles){const p=projectWorld(pr.x,pr.y),a=Math.atan2(pr.vy,pr.vx); ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle='#111'; if(pr.glyph==='➳'){ctx.font=`${pr.size}px serif`;ctx.fillText('➳',0,0);} else {ctx.beginPath();ctx.arc(0,0,pr.size*0.25,0,Math.PI*2);ctx.fill();} ctx.restore();}
 const pp=projectWorld(state.player.x,state.player.y),aim=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),w=weaponDef(); ctx.font='20px serif';ctx.fillStyle='#fff';ctx.fillText('🙂',pp.x,pp.y);
 ctx.save();ctx.translate(pp.x,pp.y); const swingViz=(w.id==='club'||w.kind==='swing')?Math.sin((1-Math.max(0,state.player.swing))*Math.PI*2.4)*0.9*Math.max(0,state.player.swing):0; ctx.rotate(aim+swingViz); if(w.id==='club'){ctx.strokeStyle='#6f3f1f';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(28,0);ctx.stroke();} else if(w.id==='axe'){ctx.save();ctx.translate(8,0);ctx.rotate(Math.PI);ctx.font='18px serif';ctx.fillText('🪓',0,4);ctx.restore();} else if(w.id==='ballista'){ctx.font='20px serif';ctx.fillText('🏹',8,4);ctx.font='16px serif';ctx.fillText('⚙️',14,6);} else if(w.id==='cannon'){ctx.save();ctx.translate(10,0);ctx.rotate(-Math.PI/2);ctx.scale(0.6,1.2);ctx.font='24px serif';ctx.fillText('🔔',0,0);ctx.restore();} else {ctx.font='18px serif';ctx.fillText(w.glyph,8,4);} ctx.restore();
 const z=getZone(state.player.x,state.player.y); const dx=state.player.x-MAP_CENTER.x,dy=state.player.y-MAP_CENTER.y,rad=(Math.hypot(dx,dy)/(5*CELL*WORLD_SCALE)).toFixed(2),clock=wrap12((Math.atan2(dy,dx)*6/Math.PI)+3).toFixed(2);
 const tiers=metaFor(w.id); const rewardHtml=state.pendingReward?`<br>Reward: ${state.pendingReward.options.map((o,i)=>`<button type="button" data-reward-index="${i}">${o.label}</button>`).join(' ')}`:''; ui.innerHTML=`HP ${state.player.hp.toFixed(1)} · ♦ ${state.diamonds}<br>Zone: ${z?z.name:'Boundary'}<br>R: ${rad} · Clock12: ${clock}<br>Weapon: ${w.id} (${tiers.speed}/${tiers.range}/${tiers.damage}/${tiers.knockback})<br>Mount: ${state.mount}<br>Unlocked: ${[...state.player.unlocked].join(', ')}${rewardHtml}<br><button type="button" data-reset-world="1">Reset World</button>`;
  ctx.save(); ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(innerWidth-430,10,420,innerHeight-20); ctx.fillStyle='#9ef'; ctx.font='12px monospace'; ctx.fillText('DEBUG '+BUILD_VERSION, innerWidth-420,30);
  const lines=[`run=${state.run} diamonds=${state.diamonds} pending=${state.pendingReward?state.pendingReward.zone:'none'}`,`px=${state.player.x.toFixed(1)} py=${state.player.y.toFixed(1)} vx=${state.player.vx.toFixed(2)} vy=${state.player.vy.toFixed(2)}`,`mouse=(${state.mouse.x.toFixed(0)},${state.mouse.y.toFixed(0)}) hold=${state.mouse.held.toFixed(2)}`,...state.debug];
  lines.slice(-20).forEach((ln,i)=>ctx.fillText(ln,innerWidth-420,50+i*14)); ctx.restore(); }

function trig(){if(state.mouse.down)return; state.mouse.down=true; state.mouse.held=0; if(weaponDef().kind==='swing')state.player.swing=1;}
function rel(){if(!state.mouse.down)return; state.mouse.down=false; if(['bow','sling','cannon'].includes(weaponDef().id)||weaponDef().kind==='bow')fireCharge();}
function loop(ts){if(!state.last)state.last=ts;const dt=Math.min(0.033,(ts-state.last)/1000);state.last=ts;const p=state.player;p.lastX=p.x;p.lastY=p.y;update(dt);render();requestAnimationFrame(loop);}

ui.addEventListener('click',e=>{const reward=e.target.closest('[data-reward-index]'); if(reward){e.preventDefault();e.stopPropagation();chooseReward(Number(reward.dataset.rewardIndex));return;} if(e.target.closest('[data-reset-world]')){e.preventDefault();e.stopPropagation();resetWorld();}});
ui.addEventListener('mousedown',e=>e.stopPropagation());
ui.addEventListener('mouseup',e=>e.stopPropagation());
addEventListener('resize',()=>{canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);});
addEventListener('keydown',e=>{const k=e.key.toLowerCase();state.keys.add(k); if(k===' ')trig(); if(k==='r')resetWorld(); if(k==='m')state.mount=(state.mount==='horse'?'foot':'horse'); if(/[1-7]/.test(e.key)){const w=weapons[Number(e.key)-1]; if(state.player.unlocked.has(w.id))state.player.weapon=w.id;}});
addEventListener('keyup',e=>{state.keys.delete(e.key.toLowerCase()); if(e.key===' ')rel();});
canvas.addEventListener('mousemove',e=>{state.mouse.x=e.clientX;state.mouse.y=e.clientY;});
canvas.addEventListener('mousedown',trig); addEventListener('mouseup',rel);
canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
resetWorld(); requestAnimationFrame(loop);
