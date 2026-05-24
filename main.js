const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');

const weapons = [
  { id:'club', glyph:'🪵', kind:'swing', base:8, reach:58, speedScale:22 },
  { id:'sling', glyph:'🪢', kind:'sling', base:4, reach:240, speedScale:12 },
  { id:'axe', glyph:'🪓', kind:'swing', base:10, reach:62, speedScale:24 },
  { id:'sword', glyph:'⚔️', kind:'swing', base:9, reach:68, speedScale:26 },
  { id:'bow', glyph:'🏹', kind:'bow', base:5, reach:380, speedScale:18 },
  { id:'ballista', glyph:'🏰', kind:'sling', base:14, reach:450, speedScale:10 },
  { id:'cannon', glyph:'💣', kind:'sling', base:18, reach:520, speedScale:8 },
];

const zones = [
  {id:'orchard',name:'Club Orchard',x:-900,y:-450,w:900,h:700,bg:'#567d48',waypoint:'🌳',unlock:'club',enemy:'🐗'},
  {id:'creek',name:'Sling Creekside',x:0,y:-450,w:900,h:700,bg:'#3f7182',waypoint:'🌊',unlock:'sling',enemy:'🪨'},
  {id:'axe',name:'Axe Grove',x:900,y:-450,w:900,h:700,bg:'#4b724f',waypoint:'🪓',unlock:'axe',enemy:'🦂'},
  {id:'pasture',name:'Pasture',x:-900,y:250,w:900,h:700,bg:'#88a86b',waypoint:'🐄',unlock:'sword',enemy:'🐺'},
  {id:'smith',name:'Smith Town',x:0,y:250,w:900,h:700,bg:'#7f6a4f',waypoint:'🏘️',unlock:'bow',enemy:'🛡️'},
  {id:'fletcher',name:'Fletcher Village',x:900,y:250,w:900,h:700,bg:'#70845a',waypoint:'🎯',unlock:'ballista',enemy:'🦅'},
  {id:'sawmill',name:'Sawmill Woods',x:1800,y:250,w:900,h:700,bg:'#50674a',waypoint:'🪚',unlock:'cannon',enemy:'🧌'},
  {id:'marches',name:'Marches',x:1800,y:-450,w:900,h:700,bg:'#747a7f',waypoint:'🏰',unlock:null,enemy:'🛡️'},
  {id:'volcano',name:'Volcano',x:2700,y:-450,w:900,h:700,bg:'#8a3b2f',waypoint:'🌋',unlock:null,enemy:'🐜'},
  {id:'frost',name:'Frosty Mountain',x:2700,y:250,w:900,h:700,bg:'#a4bfd8',waypoint:'🏔️',unlock:null,enemy:'❄️'},
  {id:'swamp',name:'Swamp',x:900,y:950,w:900,h:700,bg:'#4f6b3f',waypoint:'🐸',unlock:null,enemy:'☠️'},
  {id:'foundry',name:'Foundry/Monastery',x:1800,y:950,w:1800,h:700,bg:'#7a5a4f',waypoint:'🏯',unlock:null,enemy:'👹'},
];

const state = {
  t:0,last:0,
  mouseDX:0, mouseDY:0,
  keys:new Set(),mouse:{x:0,y:0,down:false,held:0},
  camera:{x:0,y:0},
  player:null, currentZone:null, projectiles:[], enemies:[], terrain:[], waves:{}
};

function resetWorld(){
  state.player={x:-600,y:-100,vx:0,vy:0,hp:20,weapon:'club',unlocked:new Set(['club']),swing:0,lastX:-600,lastY:-100};
  state.projectiles=[]; state.enemies=[]; state.terrain=[]; state.waves={};
  for(const z of zones){
    state.waves[z.id]={spawned:false,cleared:false};
    for(let i=0;i<4;i++) state.terrain.push({x:z.x+120+i*150,y:z.y+150+((i%2)*120),hp:3,type:'tree',zone:z.id,glyph:'🌲'});
    for(let i=0;i<3;i++) state.terrain.push({x:z.x+260+i*180,y:z.y+420,hp:3,type:'stone',zone:z.id,glyph:'🪨'});
  }
}

function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);} addEventListener('resize',resize);
addEventListener('keydown',e=>{state.keys.add(e.key.toLowerCase()); if(e.key===' ') triggerAttack(true); if(e.key.toLowerCase()==='r') resetWorld(); if(/[1-7]/.test(e.key)){const w=weapons[Number(e.key)-1]; if(state.player.unlocked.has(w.id)) state.player.weapon=w.id;}});
addEventListener('keyup',e=>{state.keys.delete(e.key.toLowerCase()); if(e.key===' ') releaseAttack(true);});
canvas.addEventListener('mousemove',e=>{state.mouseDX=e.movementX||0;state.mouseDY=e.movementY||0;state.mouse.x=e.clientX;state.mouse.y=e.clientY;});
canvas.addEventListener('mousedown',()=>triggerAttack(false));
addEventListener('mouseup',()=>releaseAttack(false));

function weaponDef(){return weapons.find(w=>w.id===state.player.weapon);} 
function triggerAttack(fromSpace){ if(fromSpace?state.spaceDown:state.mouse.down) return; if(fromSpace){state.spaceDown=true;} else state.mouse.down=true; state.mouse.held=0; const w=weaponDef(); if(w.kind==='swing') state.player.swing=1; }
function releaseAttack(fromSpace){ if(fromSpace) state.spaceDown=false; else state.mouse.down=false; const w=weaponDef(); if(w.kind==='bow' || w.kind==='sling') fireCharge(w); }

function fireCharge(w){
  const hold=Math.min(1,state.mouse.held/1.5);
  const p=state.player;
  const a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2);
  const sp=220+hold*420;
  state.projectiles.push({x:p.x+Math.cos(a)*24,y:p.y+Math.sin(a)*24,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:8,life:2,dmg:Math.round(w.base+hold*w.speedScale),glyph:w.kind==='bow'?'➳':'🪨'});
}

function update(dt){
  const p=state.player; state.t+=dt;
  let dx=(state.keys.has('d')||state.keys.has('arrowright')?1:0)-(state.keys.has('a')||state.keys.has('arrowleft')?1:0);
  let dy=(state.keys.has('s')||state.keys.has('arrowdown')?1:0)-(state.keys.has('w')||state.keys.has('arrowup')?1:0);
  const mag=Math.hypot(dx,dy)||1; dx/=mag;dy/=mag;
  const zone=getZone(p.x,p.y);
  const slow=zone?.id==='creek'||zone?.id==='swamp'?0.7:1;
  p.vx=dx*220*slow; p.vy=dy*220*slow; p.x+=p.vx*dt; p.y+=p.vy*dt;
  state.camera.x += (p.x-state.camera.x)*0.1; state.camera.y += (p.y-state.camera.y)*0.1;
  if(state.mouse.down||state.spaceDown) state.mouse.held+=dt;

  if(zone && !state.waves[zone.id].spawned){
    state.waves[zone.id].spawned=true;
    for(let i=0;i<4;i++) state.enemies.push({x:zone.x+200+i*130,y:zone.y+300+(i%2)*80,hp:8,glyph:zone.enemy,zone:zone.id});
  }

  // swings
  if(p.swing>0){ p.swing-=dt*3; doSwingDamage(); }

  // projectiles
  for(const pr of state.projectiles){pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.life-=dt;}
  state.projectiles=state.projectiles.filter(pr=>pr.life>0);

  // enemy simple chase
  for(const e of state.enemies){
    const ax=p.x-e.x, ay=p.y-e.y, d=Math.hypot(ax,ay)||1;
    e.x += ax/d*80*dt; e.y += ay/d*80*dt;
    if(d<20) p.hp=Math.max(0,p.hp-dt*2);
  }

  hitChecks();

  if(zone){
    const alive=state.enemies.some(e=>e.zone===zone.id && e.hp>0);
    if(!alive && !state.waves[zone.id].cleared){
      state.waves[zone.id].cleared=true;
      const unlock=zone.unlock; if(unlock) p.unlocked.add(unlock);
    }
  }
}
function doSwingDamage(){
  const p=state.player, w=weaponDef(); if(w.kind!=='swing') return;
  const px=(p.x-p.lastX), py=(p.y-p.lastY);
  const moveSpeed=Math.hypot(px,py)*60;
  const mouseVel=Math.hypot(state.mouseDX,state.mouseDY);
  const power=w.base + (moveSpeed+mouseVel)*0.08;
  const a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2);
  const sx=p.x+Math.cos(a)*w.reach, sy=p.y+Math.sin(a)*w.reach;
  for(const e of state.enemies){ if(Math.hypot(e.x-sx,e.y-sy)<45) e.hp-=power*0.08; }
  for(const t of state.terrain){ if(Math.hypot(t.x-sx,t.y-sy)<45) t.hp-=power*0.06; }
}

function hitChecks(){
  for(const pr of state.projectiles){
    for(const e of state.enemies){ if(Math.hypot(e.x-pr.x,e.y-pr.y)<22){ e.hp-=pr.dmg; pr.life=0; } }
    for(const t of state.terrain){ if(Math.hypot(t.x-pr.x,t.y-pr.y)<20){ t.hp-=pr.dmg*0.8; pr.life=0; } }
  }
  state.enemies=state.enemies.filter(e=>e.hp>0);
  state.terrain=state.terrain.filter(t=>t.hp>0);
}
function getZone(x,y){ return zones.find(z=>x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h); }

function drawHexBackground(){
  const size=32;
  for(let y=-size; y<innerHeight+size; y+=size*1.5){
    for(let x=-size; x<innerWidth+size; x+=size*Math.sqrt(3)){
      const off=((Math.floor(y/(size*1.5))%2)?size*Math.sqrt(3)/2:0);
      const sx=x+off, sy=y;
      const wx=sx+state.camera.x-innerWidth/2, wy=sy+state.camera.y-innerHeight/2;
      const z=getZone(wx,wy); const base=z?z.bg:'#465';
      ctx.fillStyle=shade(base, ((sx+sy)%60)/200-0.15);
      hex(sx,sy,size*0.56); ctx.fill();
    }
  }
}
function hex(x,y,r){ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();}
function shade(c,amt){ const n=parseInt(c.slice(1),16); let r=(n>>16)+amt*255,g=((n>>8)&255)+amt*255,b=(n&255)+amt*255; r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b)); return `rgb(${r|0},${g|0},${b|0})`; }

function render(){
  ctx.clearRect(0,0,innerWidth,innerHeight); drawHexBackground();
  ctx.save(); ctx.translate(innerWidth/2-state.camera.x,innerHeight/2-state.camera.y);
  for(const z of zones){
    ctx.strokeStyle='#fff3'; ctx.strokeRect(z.x,z.y,z.w,z.h);
    ctx.fillStyle='#fff8'; ctx.font='20px sans-serif'; ctx.fillText(`${z.waypoint} ${z.name}`,z.x+12,z.y+28);
  }
  for(const t of state.terrain){ctx.font='30px serif';ctx.fillText(t.glyph,t.x-12,t.y+10);}  
  for(const e of state.enemies){ctx.font='26px serif';ctx.fillText(e.glyph,e.x-10,e.y+8);}  
  for(const pr of state.projectiles){ctx.font='20px serif';ctx.fillText(pr.glyph,pr.x-8,pr.y+8);}  
  const p=state.player;
  ctx.font='34px serif'; ctx.fillText('🙂',p.x-14,p.y+12);
  const a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2);
  ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(a);
  const w=weaponDef();
  if(w.kind==='bow' && (state.mouse.down||state.spaceDown)){
    const t=Math.min(1,state.mouse.held/1.7), wob=Math.sin(state.t*60*t)*4*t;
    ctx.font=`${24+16*t+wob}px serif`; ctx.fillText('🏹',22+18*t,8+wob);
    ctx.font=`${18+14*t}px serif`; ctx.fillText('➳',42+24*t,8);
  } else if(w.kind==='sling' && (state.mouse.down||state.spaceDown)){
    const t=Math.min(1,state.mouse.held/1.4), wob=Math.sin(state.t*50*t)*10*t;
    ctx.font='28px serif'; ctx.fillText('🪢',24,8);
    ctx.fillStyle='#ddd'; ctx.beginPath(); ctx.arc(54+22*t+wob,0,6+5*t,0,Math.PI*2); ctx.fill();
  } else {
    ctx.font='28px serif'; ctx.fillText(w.glyph,26,8);
  }
  ctx.restore();
  ctx.restore();

  const z=getZone(state.player.x,state.player.y);
  ui.innerHTML=`HP ${state.player.hp.toFixed(1)}<br>Zone: ${z?.name||'Wilderness'}<br>Weapon: ${weaponDef().id}<br>Unlocked: ${[...state.player.unlocked].join(', ')}<br><button onclick="resetWorld()">Reset World</button>`;
}

function loop(ts){ if(!state.last) state.last=ts; const dt=Math.min(0.033,(ts-state.last)/1000); state.last=ts; const p=state.player; p.lastX=p.x;p.lastY=p.y; update(dt); render(); requestAnimationFrame(loop); }
resize(); resetWorld(); requestAnimationFrame(loop);
