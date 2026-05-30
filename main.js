const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');
const menu = document.getElementById('menu');

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

const weaponGlyphPoints = {club:{handleCell:'F1',tipCell:'F12'},sling:{handleCell:null,tipCell:null},axe:{handleCell:'I11',tipCell:'C2'},sword:{handleCell:'C4',tipCell:'I22'},bow:{handleCell:'G4',tipCell:'A11'},ballista:{handleCell:'G4',tipCell:'A10'},cannon:{handleCell:'F-1',tipCell:'F10'}};
const glyphRows = 'ABCDEFGHIJK'.split('');
const glyphCols = Array.from({length:12},(_,i)=>String(i+1));

const zones = [
  { id: 'orchard', name: 'Club Orchard', palette: ['#245e3a','#2e7548','#3f8d59'], enemy: '🐛', unlock: 'club', ring: ring(0,1), arc:[0,12], deco:'orchard' },
  { id: 'axe', name: 'Axe Grove', palette: ['#2f612f','#3b7c3a','#5b8f4f'], enemy: '🦂', unlock: 'axe', ring: ring(1,2), arc:[9,3], deco:'axe_grove' },
  { id: 'creek', name: 'Sling Creekside', palette: ['#2a5f79','#3e89a8','#78b8d4'], enemy: '🐸', unlock: 'sling', ring: ring(1,2), arc:[3,12], slowWater:true, deco:'creek' },
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

const state = { mode:'menu',glyphWeapon:'club',t:0,last:0,keys:new Set(),mouse:{x:0,y:0,down:false,held:0},camera:{x:MAP_CENTER.x,y:MAP_CENTER.y},player:null,projectiles:[],enemies:[],terrain:[],waves:{},mount:'foot',debug:[],diamonds:0,ammo:{arrows:0,jars:0},meta:{},pendingReward:null,offerNpc:null,currentZone:null,run:1 };
const BUILD_VERSION = 'v0.1.7 build 2026-05-30 00:00 UTC';
const wrap12=h=>(h%12+12)%12; const inArc=(h,[s,e])=>{h=wrap12(h);s=wrap12(s);e=wrap12(e);return s<=e?(h>=s&&h<e):(h>=s||h<e)}; const toClockHour=t=>wrap12((t*6/Math.PI)+3);
const weaponDef=()=>weapons.find(w=>w.id===state.player.weapon);
const MINOR_ZONES = new Set(['tundra','marsh','desert','mine']);
const UPGRADE_STATS = ['speed','range','damage','knockback'];
const ZONE_NPCS = {orchard:'👨‍🌾',creek:'🧒',axe:'🧔',pasture:'🐎',smith:'🛡️',fletcher:'🏹',sawmill:'🪚',marches:'♜',volcano:'🧙‍♂️',frost:'🧪',swamp:'🧙‍♀️',foundry:'🙏'};
function metaFor(id){ if(!state.meta[id]) state.meta[id]={speed:0,range:0,damage:0,knockback:0}; return state.meta[id]; }
function effectiveWeapon(base){ const m=metaFor(base.id); return {...base, knock:base.knock+m.knockback*0.6, reach:base.reach+m.range*16, damageMult:1+m.damage*0.13, speedMult:1+m.speed*0.08, tiers:m}; }
function rewardWeaponForZone(zone){ return zone.unlock || state.player.weapon; }
function unlockCost(zone){return zone.id==='orchard'?0:8;} function upgradeCost(wave){return 5+wave*3;}
function buildReward(zone){ const wave=state.waves[zone.id]?.wave||1, weapon=rewardWeaponForZone(zone); let options; if(wave===1&&zone.unlock&&!state.player.unlocked.has(zone.unlock)){ const cost=unlockCost(zone); options=[{unlock:zone.unlock,cost,label:`unlock ${zone.unlock} (${cost}♦)`},{diamonds:4+wave*2,label:`take ${4+wave*2}♦`}]; } else { const stats=UPGRADE_STATS.map(stat=>({weapon,stat,cost:upgradeCost(wave),label:`${weapon} +${stat} (${upgradeCost(wave)}♦)`})); options=[stats[wave%4],stats[(wave+1)%4],{diamonds:6+wave*2,label:`take ${6+wave*2}♦`}]; } state.pendingReward={zone:zone.id,wave,options,purchased:false}; state.offerNpc={x:state.player.x+42,y:state.player.y-34,glyph:ZONE_NPCS[zone.id]||'🙂',zone:zone.id}; dbg(`[REWARD] ${zone.name} wave ${wave} cleared; NPC selling reward`); }
function chooseReward(i){ const reward=state.pendingReward, here=getZone(state.player.x,state.player.y); if(!reward||reward.purchased||here?.id!==reward.zone) return; const option=reward.options[i]; if(!option) return; if(option.diamonds){state.diamonds+=option.diamonds;dbg(`[PAYOUT] +${option.diamonds}♦`);reward.purchased=true;return;} const cost=option.cost||0; if(state.diamonds<cost){dbg(`[SHOP] need ${cost}♦ for ${option.label}; have ${state.diamonds}♦`);return;} state.diamonds-=cost; if(option.unlock){ state.player.unlocked.add(option.unlock); if(weapons.some(w=>w.id===option.unlock))state.player.weapon=option.unlock; dbg(`[UNLOCK] ${option.unlock} bought for ${cost}♦`); } else { const m=metaFor(option.weapon); m[option.stat]++; dbg(`[UPGRADE] ${option.weapon}.${option.stat} -> ${m[option.stat]} cost=${cost}♦`); } reward.purchased=true; }
function buyItem(kind){ const prices={arrows:1,jars:3}, qty={arrows:6,jars:2}; const here=getZone(state.player.x,state.player.y); const z=(state.pendingReward&&here?.id===state.pendingReward.zone)?state.pendingReward.zone:state.currentZone; if(kind==='arrows'&&z!=='fletcher'){dbg('[SHOP] arrows are sold in Fletcher Village');return;} if(kind==='jars'&&z!=='creek'){dbg('[SHOP] clay jars are sold at Sling Creekside');return;} const cost=prices[kind]; if(state.diamonds<cost){dbg(`[SHOP] need ${cost}♦ for ${kind}`);return;} state.diamonds-=cost; state.ammo[kind]+=qty[kind]; dbg(`[SHOP] bought ${qty[kind]} ${kind} for ${cost}♦`); }
function startNextWave(){ const reward=state.pendingReward; if(!reward||!reward.purchased) return; const w=state.waves[reward.zone]; if(w){w.wave++;w.spawned=false;w.cleared=false; dbg(`[NEXT] ${reward.zone} wave ${w.wave} ready`);} state.pendingReward=null; state.offerNpc=null; }
window.chooseReward=chooseReward;
function resurrect(){ dbg(`[DOWNFALL] run ${state.run} ended; upgrades persist, waves reset`); state.run++; state.player.x=MAP_CENTER.x; state.player.y=MAP_CENTER.y; state.player.vx=0; state.player.vy=0; state.player.hp=20; state.player.weapon='club'; state.player.unlocked=new Set(['club']); state.mount='foot'; state.enemies=[]; state.projectiles=[]; state.ammo={arrows:0,jars:0}; state.pendingReward=null; state.offerNpc=null; state.currentZone=null; for(const z of zones) state.waves[z.id]={wave:1,spawned:false,cleared:false}; }
function randomPointInZone(zone){ for(let tries=0;tries<80;tries++){ const span=((zone.arc[1]-zone.arc[0]+12)%12)||12,h=(zone.arc[0]+Math.random()*span)%12,rr=zone.ring.min+(zone.ring.max-zone.ring.min)*(0.08+Math.random()*0.84),th=(h-3)*Math.PI/6,x=MAP_CENTER.x+Math.cos(th)*rr,y=MAP_CENTER.y+Math.sin(th)*rr; if(!collidesObstacle(x,y))return{x,y}; } return {x:state.player.x+80,y:state.player.y}; }
function spawnWave(zone){ const wave=state.waves[zone.id]?.wave||1; state.waves[zone.id].spawned=true; const count=3+Math.min(7,Math.floor(wave*0.7)); const hp=7*(1+wave*0.22); for(let i=0;i<count;i++){const pt=randomPointInZone(zone);state.enemies.push({x:pt.x,y:pt.y,hp,glyph:zone.enemy||'😠',zone:zone.id,vx:0,vy:0,bounty:2+wave,hop:Math.random()*0.8});} dbg(`[WAVE] ${zone.name} wave ${wave} enemies=${count} hp=${hp.toFixed(1)}`); }
function completeWave(zone){ const waveState=state.waves[zone.id]; if(!waveState||waveState.cleared) return; waveState.cleared=true; if(MINOR_ZONES.has(zone.id)){ const bonus=5+(waveState.wave||1); state.diamonds+=bonus; dbg(`[MINOR] ${zone.name} wave ${waveState.wave} +${bonus}♦`); waveState.wave++; waveState.spawned=false; waveState.cleared=false; return; } buildReward(zone); }
function resolveEnemySpacing(){ const p=state.player; const pr=state.mount==='horse'&&p.unlocked.has('horse')?28:18, er=16; for(let i=0;i<state.enemies.length;i++){ const e=state.enemies[i]; for(let j=i+1;j<state.enemies.length;j++){ const o=state.enemies[j], dx=o.x-e.x, dy=o.y-e.y, d=Math.hypot(dx,dy)||1, min=er*2; if(d<min){ const push=(min-d)*0.5, nx=dx/d, ny=dy/d; e.x-=nx*push; e.y-=ny*push; o.x+=nx*push; o.y+=ny*push; } } const dx=p.x-e.x, dy=p.y-e.y, d=Math.hypot(dx,dy)||1, min=pr+er; if(d<min){ const nx=dx/d, ny=dy/d, push=min-d; e.x-=nx*push*0.65; e.y-=ny*push*0.65; p.x+=nx*push*0.35; p.y+=ny*push*0.35; p.vx+=nx*18; p.vy+=ny*18; p.hp=Math.max(0,p.hp-0.015); } } }
function getZone(x,y){const dx=x-MAP_CENTER.x,dy=y-MAP_CENTER.y,r=Math.hypot(dx,dy),h=toClockHour(Math.atan2(dy,dx)); return zones.find(z=>r>=z.ring.min&&r<z.ring.max&&inArc(h,z.arc))||null;}
function projectWorld(wx,wy){ const dx=wx-state.camera.x, dy=wy-state.camera.y; const pxPerWorld=0.55; return {x:innerWidth*0.5 + dx*pxPerWorld, y:innerHeight*0.5 + dy*pxPerWorld, scale:1}; }

function spawnZoneDecor(z){
  const cfg={orchard:{n:48,g:['🌳','🌳','🌲'],uniform:true},axe_grove:{n:70,g:['🌲','🌲','🌲','🌲','🌲','🌳']},sawmill:{n:260,g:['🌲','🌳','🌴','🌲']},smith:{n:90,g:['🧱']},fletcher:{n:25,g:['🧱','🌲']},foundry:{n:35,g:['🧱','🪨']},mine:{n:80,g:['🪨']},frost:{n:70,g:['🪨']},marches:{n:45,g:['♜']},desert:{n:55,g:['🌵']},creek:{n:18,g:['🌲']},swamp:{n:18,g:['🌲']},pasture:{n:8,g:['🌿']},marsh:{n:14,g:['🌿']},volcano:{n:16,g:['🪨']},snow:{n:10,g:['🪨']}}[z.deco]||{n:8,g:['🌿']};
  for(let i=0;i<cfg.n;i++){let h,rr; if(cfg.uniform){ const start=z.arc[0],end=z.arc[1]; const span=((end-start+12)%12)||12; const t=(i*0.61803398875+Math.random()*0.18)%1; h=(start + t*span)%12; rr=z.ring.min+(z.ring.max-z.ring.min)*(0.18+0.64*Math.sqrt((i+Math.random())/cfg.n)); } else { h=Math.random()*12; if(!inArc(h,z.arc))continue; rr=z.ring.min+(z.ring.max-z.ring.min)*(0.08+0.84*Math.random()); } const th=(h-3)*Math.PI/6; const glyph=cfg.g[(Math.random()*cfg.g.length)|0]; const type=(glyph==='🧱'||glyph==='🪨')?'wall':'tree'; state.terrain.push({x:MAP_CENTER.x+Math.cos(th)*rr,y:MAP_CENTER.y+Math.sin(th)*rr,hp:3,glyph,type,solid:true,stump:false,color:glyph==='♜'?'#000':null});}
}

function resetWorld(){const s={x:MAP_CENTER.x,y:MAP_CENTER.y};state.player={x:s.x,y:s.y,vx:0,vy:0,hp:20,weapon:'club',unlocked:new Set(['club']),swing:0,lastX:s.x,lastY:s.y}; state.mount='foot'; state.ammo={arrows:0,jars:0}; state.projectiles=[];state.enemies=[];state.terrain=[];state.waves={};state.pendingReward=null;state.offerNpc=null;state.currentZone=null; for(const z of zones){state.waves[z.id]={wave:1,spawned:false,cleared:false};spawnZoneDecor(z);} }

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
  for(const pr of state.projectiles){const nx=pr.x+pr.vx*dt,ny=pr.y+pr.vy*dt; if(collidesObstacle(nx,ny,{blockStumps:false})&&!pr.overStump){if(pr.shards)spawnShards(pr);pr.life=0;continue;} pr.x=nx;pr.y=ny;pr.life-=dt;}
  state.projectiles=state.projectiles.filter(pr=>pr.life>0);
  for(const e of state.enemies){e.vx=(e.vx||0)*0.88; e.vy=(e.vy||0)*0.88; const ax=p.x-e.x,ay=p.y-e.y,d=Math.hypot(ax,ay)||1,ep=projectWorld(e.x,e.y),off=ep.x<-40||ep.x>innerWidth+40||ep.y<-40||ep.y>innerHeight+40,chaseMul=off?3.2:1; if(e.zone==='creek'){e.hop=(e.hop||0)-dt; if(e.hop<=0){let tx=ax/d,ty=ay/d; const frogs=state.enemies.filter(o=>o!==e&&o.zone==='creek'); let nearest=null,nd=Infinity; for(const o of frogs){const od=Math.hypot(o.x-e.x,o.y-e.y); if(od<nd){nd=od;nearest=o;}} if(nearest&&Math.random()<0.45){tx=(e.x-nearest.x)/(nd||1);ty=(e.y-nearest.y)/(nd||1);} e.vx+=tx*135*chaseMul; e.vy+=ty*135*chaseMul; e.hop=0.45+Math.random()*0.75;}} else { e.vx += ax/d*12*dt*chaseMul; e.vy += ay/d*12*dt*chaseMul; e.x += ax/d*12*dt*chaseMul; e.y += ay/d*12*dt*chaseMul;} e.x += e.vx*dt; e.y += e.vy*dt;} resolveEnemySpacing(); hitChecks(); if(p.hp<=0)resurrect();
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

function hitChecks(){for(const pr of state.projectiles){for(const e of state.enemies){if(Math.hypot(e.x-pr.x,e.y-pr.y)<22){const spMul=1+Math.min(3,pr.speed/320); const dmg=(pr.pierce*0.6+pr.knock*0.4)*spMul*(pr.damageMult||1); e.hp-=dmg; const kb=pr.knock*spMul*2.8; const aa=Math.atan2(pr.vy,pr.vx); e.vx=(e.vx||0)+Math.cos(aa)*kb; e.vy=(e.vy||0)+Math.sin(aa)*kb; dbg(`[HIT] ${pr.source||'proj'} -> enemy ${e.glyph} dmg=${dmg.toFixed(2)} kb=${kb.toFixed(1)} hp=${e.hp.toFixed(2)} ang=${pr.angle.toFixed(2)} spd=${pr.speed.toFixed(1)}`); if(pr.shards)spawnShards(pr); pr.life=0;}} for(const t of state.terrain){if(Math.hypot(t.x-pr.x,t.y-pr.y)<22){applyHit(t,{knock:pr.knock,pierce:pr.pierce},1); dbg(`[IMPACT] ${pr.source||'proj'} -> ${t.type}${t.stump?'(stump)':''} hp=${t.hp.toFixed(2)} k=${pr.knock.toFixed(2)} p=${pr.pierce.toFixed(2)}`); if(pr.shards)spawnShards(pr); pr.life=0;}}} state.enemies=state.enemies.filter(e=>{if(e.hp<=0){const bounty=e.bounty||2;state.diamonds+=bounty;dbg(`[BOUNTY] ${e.glyph} +${bounty}♦ total=${state.diamonds}`);return false;}return true;});}

function spawnShards(pr){ for(let i=0;i<6;i++){const a=pr.angle+(i-2.5)*0.45,sp=130+Math.random()*90; state.projectiles.push({x:pr.x,y:pr.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:0.45,glyph:'◆',size:10,knock:1.2,pierce:2.8,damageMult:0.45,angle:a,speed:sp,source:'jar shard'});} dbg('[SHATTER] clay jar released shards'); }

function fireCharge(){const w=effectiveWeapon(weaponDef()); const h=Math.min(1,state.mouse.held/1.5),p=state.player; let a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),sp=(240+h*460)*w.speedMult;
 let glyph='●',size=12,knock=w.knock,pierce=w.pierce,shards=false;
 if(w.id==='bow'){if(state.ammo.arrows<=0){dbg('[AMMO] buy arrows in Fletcher Village');return;} state.ammo.arrows--; glyph='➳';size=22; const wobble=Math.max(0,state.mouse.held-0.7); a+=Math.sin(state.t*20)*wobble*0.06;}
 if(w.id==='ballista'){glyph='➳';size=34;} if(w.id==='cannon'){glyph='●';size=28;knock=13;pierce=2.2;} if(w.id==='sling'){if(state.ammo.jars>0&&h>0.7){state.ammo.jars--;glyph='🏺';size=22;knock=5.5;pierce=1.2;shards=true;}else{glyph='●';size=12;knock=7.5;pierce=0.5;}}
 const pvx = Math.cos(a)*sp + p.vx; const pvy = Math.sin(a)*sp + p.vy; const pspd=Math.hypot(pvx,pvy);
 state.projectiles.push({x:p.x+Math.cos(a)*24,y:p.y+Math.sin(a)*24,vx:pvx,vy:pvy,life:2.2,glyph,size,knock,pierce,damageMult:w.damageMult,angle:a,speed:pspd,source:w.id,shards});
  dbg(`[FIRE] ${w.id} ang=${a.toFixed(2)} spd=${sp.toFixed(1)} knock=${knock.toFixed(2)} pierce=${pierce.toFixed(2)} arrows=${state.ammo.arrows} jars=${state.ammo.jars}`); }

function hex(x,y,r){ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i+Math.PI/6,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();}
function drawHexBackground(){const size=12,pack=1.34,h=Math.sqrt(3)*size*pack,v=1.5*size*pack,worldW=innerWidth*1.3,worldH=innerHeight*1.3; const r0=Math.floor((state.camera.y-worldH*0.5)/v)-2,r1=Math.ceil((state.camera.y+worldH*0.5)/v)+2,c0=Math.floor((state.camera.x-worldW*0.5)/h)-2,c1=Math.ceil((state.camera.x+worldW*0.5)/h)+2; for(let row=r0;row<=r1;row++){for(let col=c0;col<=c1;col++){const wx=col*h+(row%2?h/2:0),wy=row*v,p=projectWorld(wx,wy); if(p.x<-8||p.x>innerWidth+8||p.y<-8||p.y>innerHeight+8)continue; let z=getZone(wx,wy); if(!z) z=zones[0]; const q=col-((row-(row&1))>>1),idx=((q-row)%3+3)%3; ctx.fillStyle=z.palette[idx]; hex(p.x,p.y,size); ctx.fill();}}}
function drawRiver(){const seg=[]; for(let h=11;h<=12;h+=0.08){const th=(h-3)*Math.PI/6,r=3*5*CELL*WORLD_SCALE;seg.push(projectWorld(MAP_CENTER.x+Math.cos(th)*r,MAP_CENTER.y+Math.sin(th)*r));} for(let h=0;h<=4.2;h+=0.08){const th=(h-3)*Math.PI/6,r=3*5*CELL*WORLD_SCALE;seg.push(projectWorld(MAP_CENTER.x+Math.cos(th)*r,MAP_CENTER.y+Math.sin(th)*r));} ctx.strokeStyle='#6ad7ffcc';ctx.lineWidth=42;ctx.lineCap='round';ctx.beginPath(); seg.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke();}


function drawWeaponVisual(w, gridW=700, gridH=620, charge=1){
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(w.id==='club'){ctx.strokeStyle='#6f3f1f';ctx.lineWidth=Math.max(18,gridH*0.09);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-gridW*0.43,0);ctx.lineTo(gridW*0.43,0);ctx.stroke();return;}
  if(w.id==='bow'||w.id==='ballista'){const sx=0.56+0.44*charge; ctx.save();ctx.scale(sx,1);ctx.font=`${Math.round(gridH*(w.id==='ballista'?0.82:0.9))}px serif`;ctx.fillText('🏹',0,0);ctx.restore(); if(w.id==='ballista'){ctx.font=`${Math.round(gridH*0.38)}px serif`;ctx.fillText('⚙️',gridW*0.12,gridH*0.08);}return;}
  if(w.id==='cannon'){ctx.save();ctx.rotate(-Math.PI/2);ctx.scale(0.65,1.2);ctx.font=`${Math.round(gridH*0.92)}px serif`;ctx.fillText('🔔',0,0);ctx.restore();return;}
  ctx.font=`${Math.round(gridH*0.9)}px serif`;ctx.fillText(w.glyph,0,0);
}
function cellPoint(cell,gridW,gridH){ const m=String(cell||'F1').match(/^([A-K])(-?\d+)$/); if(!m)return{x:-gridW/2,y:0}; const row=glyphRows.indexOf(m[1]),col=Number(m[2]); return{x:((col-0.5)/12)*gridW-gridW/2,y:((row+0.5)/11)*gridH-gridH/2}; }
function drawHeldWeapon(w, aim){ const hold=Math.min(1,state.mouse.held/1.5), swingViz=(w.id==='club'||w.kind==='swing')?Math.sin((1-Math.max(0,state.player.swing))*Math.PI*2.4)*0.9*Math.max(0,state.player.swing):0, wob=(w.id==='bow'&&state.mouse.down)?Math.sin(state.t*20)*Math.max(0,state.mouse.held-0.7)*0.12:0; const gw=42,gh=33,pts=weaponGlyphPoints[w.id]||{},hp=cellPoint(pts.handleCell,gw,gh),tp=cellPoint(pts.tipCell,gw,gh),glyphAngle=Math.atan2(tp.y-hp.y,tp.x-hp.x); ctx.rotate(aim+swingViz+wob); ctx.translate(14,0); ctx.rotate(-glyphAngle); ctx.translate(-hp.x,-hp.y); drawWeaponVisual(w,gw,gh,(w.id==='bow'&&state.mouse.down)?hold:0.45); }


function renderGlyphTest(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  ctx.fillStyle='#111';ctx.fillRect(0,0,innerWidth,innerHeight);
  const cell=Math.max(34,Math.min(58,(Math.min(innerWidth-260,innerHeight-160))/12));
  const gridW=cell*12, gridH=cell*11, left=(innerWidth-gridW)/2, top=(innerHeight-gridH)/2+25;
  ctx.fillStyle='#d9e8df';ctx.font='16px monospace';ctx.fillText('Glyph Test: choose a weapon, then report handle and tip cells (example: handle C4, tip C9).',24,30);
  ctx.fillText(`Selected: ${state.glyphWeapon}`,24,54);
  ctx.strokeStyle='#3d5548';ctx.lineWidth=1;
  for(let c=0;c<=12;c++){ctx.beginPath();ctx.moveTo(left+c*cell,top);ctx.lineTo(left+c*cell,top+gridH);ctx.stroke();}
  for(let r=0;r<=11;r++){ctx.beginPath();ctx.moveTo(left,top+r*cell);ctx.lineTo(left+gridW,top+r*cell);ctx.stroke();}
  ctx.fillStyle='#9fd7b5';ctx.font='14px monospace';
  glyphCols.forEach((label,i)=>ctx.fillText(label,left+i*cell+cell/2-4,top-10));
  glyphRows.forEach((label,i)=>ctx.fillText(label,left-24,top+i*cell+cell/2+5));
  const selected=weapons.find(w=>w.id===state.glyphWeapon)||weapons[0];
  ctx.save();ctx.translate(left+gridW/2,top+gridH/2);drawWeaponVisual(selected,gridW,gridH);ctx.restore();
  const points=weaponGlyphPoints[selected.id];
  for(const [label,cell,color] of [['H',points.handleCell,'#76e08d'],['T',points.tipCell,'#ff7676']]){ if(cell){const pt=cellPoint(cell,gridW,gridH);ctx.fillStyle=color;ctx.beginPath();ctx.arc(left+gridW/2+pt.x,top+gridH/2+pt.y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.font='12px monospace';ctx.fillText(label,left+gridW/2+pt.x-4,top+gridH/2+pt.y+4);} }
  ctx.fillStyle='#f5d76e';ctx.font='14px monospace';ctx.fillText(`Handle: ${points.handleCell||'unassigned'}   Tip: ${points.tipCell||'unassigned'}`,24,78);
  ui.innerHTML=`Mode: Glyph Test<br>${weapons.map(w=>`<button type="button" data-glyph-weapon="${w.id}">${w.id}</button>`).join(' ')}<br><button type="button" data-mode="game">Play Game</button><button type="button" data-mode="menu">Menu</button>`;
}

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
 for(const pr of state.projectiles){const p=projectWorld(pr.x,pr.y),a=Math.atan2(pr.vy,pr.vx); ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle='#111'; if(pr.glyph==='➳'||pr.glyph==='🏺'||pr.glyph==='◆'){ctx.font=`${pr.size}px serif`;ctx.fillText(pr.glyph,0,0);} else {ctx.beginPath();ctx.arc(0,0,pr.size*0.25,0,Math.PI*2);ctx.fill();} ctx.restore();}
 const pp=projectWorld(state.player.x,state.player.y),aim=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),w=weaponDef(); ctx.textAlign='center';ctx.textBaseline='middle'; if(state.mount==='horse'&&state.player.unlocked.has('horse')){ctx.font='30px serif';ctx.fillText('🐎',pp.x,pp.y+8);} ctx.font='20px serif';ctx.fillStyle='#fff';ctx.fillText('🙂',pp.x,pp.y);
 ctx.save();ctx.translate(pp.x,pp.y); drawHeldWeapon(w,aim); ctx.restore();
 const z=getZone(state.player.x,state.player.y); const dx=state.player.x-MAP_CENTER.x,dy=state.player.y-MAP_CENTER.y,rad=(Math.hypot(dx,dy)/(5*CELL*WORLD_SCALE)).toFixed(2),clock=wrap12((Math.atan2(dy,dx)*6/Math.PI)+3).toFixed(2);
 const tiers=metaFor(w.id); const showReward=state.pendingReward&&z?.id===state.pendingReward.zone; const shopHtml=showReward?`<br>${state.pendingReward.options.map((o,i)=>`<button type="button" data-reward-index="${i}" ${state.pendingReward.purchased?'disabled':''}>${o.label}</button>`).join(' ')} ${state.pendingReward.zone==='creek'?'<button type="button" data-buy="jars">buy jars 3♦</button>':''}${state.pendingReward.zone==='fletcher'?'<button type="button" data-buy="arrows">buy arrows 1♦</button>':''}${state.pendingReward.purchased?'<button type="button" data-start-wave="1">Start next wave</button>':''}`:''; ui.innerHTML=`HP ${state.player.hp.toFixed(1)} · ♦ ${state.diamonds}<br>Zone: ${z?z.name:'Boundary'}<br>R: ${rad} · Clock12: ${clock}<br>Weapon: ${w.id} (${tiers.speed}/${tiers.range}/${tiers.damage}/${tiers.knockback})<br>Ammo: arrows ${state.ammo.arrows} · jars ${state.ammo.jars}<br>Mount: ${state.mount}<br>Unlocked: ${[...state.player.unlocked].join(', ')}${shopHtml}<br><button type="button" data-reset-world="1">Reset World</button>`;
  ctx.save(); ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(innerWidth-430,10,420,innerHeight-20); ctx.fillStyle='#9ef'; ctx.font='12px monospace'; ctx.fillText('DEBUG '+BUILD_VERSION, innerWidth-420,30);
  const lines=[`run=${state.run} diamonds=${state.diamonds} pending=${state.pendingReward?state.pendingReward.zone:'none'}`,`px=${state.player.x.toFixed(1)} py=${state.player.y.toFixed(1)} vx=${state.player.vx.toFixed(2)} vy=${state.player.vy.toFixed(2)}`,`mouse=(${state.mouse.x.toFixed(0)},${state.mouse.y.toFixed(0)}) hold=${state.mouse.held.toFixed(2)}`,...state.debug];
  lines.slice(-20).forEach((ln,i)=>ctx.fillText(ln,innerWidth-420,50+i*14)); ctx.restore(); }

function trig(){if(state.mouse.down)return; state.mouse.down=true; state.mouse.held=0; if(weaponDef().kind==='swing')state.player.swing=1;}
function rel(){if(!state.mouse.down)return; state.mouse.down=false; if(['bow','sling','cannon'].includes(weaponDef().id)||weaponDef().kind==='bow')fireCharge();}
function loop(ts){if(!state.last)state.last=ts;const dt=Math.min(0.033,(ts-state.last)/1000);state.last=ts;state.t+=dt;if(state.mode==='game'){const p=state.player;p.lastX=p.x;p.lastY=p.y;update(dt);render();}else if(state.mode==='glyph'){renderGlyphTest();}requestAnimationFrame(loop);}

function setMode(mode){state.mode=mode;menu.classList.toggle('hidden',mode!=='menu');ui.style.display=mode==='menu'?'none':'block';if(mode==='game'&&!state.player)resetWorld();if(mode==='glyph')menu.classList.add('hidden');}
menu.addEventListener('click',e=>{const mode=e.target.closest('[data-mode]')?.dataset.mode;if(mode)setMode(mode);});
function handleUiAction(e){const mode=e.target.closest('[data-mode]')?.dataset.mode; if(mode){e.preventDefault();e.stopPropagation();setMode(mode);return true;} const glyph=e.target.closest('[data-glyph-weapon]')?.dataset.glyphWeapon; if(glyph){e.preventDefault();e.stopPropagation();state.glyphWeapon=glyph;return true;} const reward=e.target.closest('[data-reward-index]'); if(reward){e.preventDefault();e.stopPropagation();chooseReward(Number(reward.dataset.rewardIndex));return true;} const buy=e.target.closest('[data-buy]'); if(buy){e.preventDefault();e.stopPropagation();buyItem(buy.dataset.buy);return true;} if(e.target.closest('[data-start-wave]')){e.preventDefault();e.stopPropagation();startNextWave();return true;} if(e.target.closest('[data-reset-world]')){e.preventDefault();e.stopPropagation();resetWorld();return true;} return false;}
ui.addEventListener('pointerdown',e=>{handleUiAction(e)||e.stopPropagation();});
ui.addEventListener('click',e=>{handleUiAction(e)||e.stopPropagation();});
ui.addEventListener('mousedown',e=>e.stopPropagation());
ui.addEventListener('mouseup',e=>e.stopPropagation());
addEventListener('resize',()=>{canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);});
addEventListener('keydown',e=>{const k=e.key.toLowerCase(); if(k==='escape'){setMode('menu');return;} if(state.mode!=='game')return; state.keys.add(k); if(state.pendingReward&&/[1-3]/.test(e.key)){chooseReward(Number(e.key)-1);return;} if(k===' ')trig(); if(k==='r')resetWorld(); if(k==='m')state.mount=(state.mount==='horse'?'foot':'horse'); if(/[1-7]/.test(e.key)){const w=weapons[Number(e.key)-1]; if(state.player.unlocked.has(w.id))state.player.weapon=w.id;}});
addEventListener('keyup',e=>{if(state.mode!=='game')return; state.keys.delete(e.key.toLowerCase()); if(e.key===' ')rel();});
canvas.addEventListener('mousemove',e=>{state.mouse.x=e.clientX;state.mouse.y=e.clientY;});
canvas.addEventListener('mousedown',()=>{if(state.mode==='game')trig();}); addEventListener('mouseup',()=>{if(state.mode==='game')rel();});
canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
ui.style.display='none'; resetWorld(); requestAnimationFrame(loop);
