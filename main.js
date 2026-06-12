const canvas = document.getElementById('game');
const ctx = NotoEmojiRenderer.install(canvas.getContext('2d'));
const ui = document.getElementById('ui');
const menu = document.getElementById('menu');
const loading = document.getElementById('loading');
const loadingBar = document.getElementById('loading-bar');
const loadingStatus = document.getElementById('loading-status');

const CELL = 48;
const WORLD_SCALE = 4;
const MAP_CENTER = { x: 25 * CELL * WORLD_SCALE, y: 20 * CELL * WORLD_SCALE };
const RADIUS_UNIT = 5 * CELL * WORLD_SCALE;
const WORLD_MAX_R = 6 * RADIUS_UNIT;
const ring = (a, b) => ({ min: a * 5 * CELL * WORLD_SCALE, max: b * 5 * CELL * WORLD_SCALE });

const weapons = [
  { id: 'club', glyph: 'club', kind: 'swing', damage: 2.25, knock: 8, pierce: 0.4, reach: 62, cooldown: 0.34 },
  { id: 'sling', glyph: '🪢', kind: 'sling', damage: 1.4, knock: 7, pierce: 0.5, reach: 280, cooldown: 0.45 },
  { id: 'axe', glyph: '🪓', kind: 'swing', damage: 5.2, knock: 6, pierce: 6.5, reach: 68, cooldown: 0.42 },
  { id: 'sword', glyph: '🗡️', kind: 'swing', damage: 8.2, knock: 1.2, pierce: 9, reach: 72, cooldown: 0.28 },
  { id: 'bow', glyph: '🏹', kind: 'bow', damage: 7.5, knock: 1.5, pierce: 9.5, reach: 440, cooldown: 0.62 },
  { id: 'ballista', glyph: 'ballista', kind: 'bow', damage: 13, knock: 5.5, pierce: 11, reach: 520, cooldown: 1.25 },
  { id: 'cannon', glyph: 'cannon', kind: 'cannon', damage: 42, knock: 12, pierce: 2, reach: 560, cooldown: 2 },
];

const weaponGlyphPoints = {club:{handleCell:'F1',tipCell:'F12'},sling:{handleCell:null,tipCell:null},axe:{handleCell:'I11',tipCell:'C2'},sword:{handleCell:'C4',tipCell:'I22'},bow:{handleCell:'G4',tipCell:'A11'},ballista:{handleCell:'G4',tipCell:'A10'},cannon:{handleCell:'F-1',tipCell:'F10'}};
const glyphRows = 'ABCDEFGHIJK'.split('');
const glyphCols = Array.from({length:12},(_,i)=>String(i+1));
const glyphTests = [...weapons.map(w=>w.id),'fire','poison','ice','arrow1','arrow2','arrow3','arrow4','arrow5'];

const zones = [
  { id: 'orchard', name: 'Club Orchard', palette: ['#245e3a','#2e7548','#3f8d59'], enemy: '🐛', unlock: 'club', ring: ring(0,1), arc:[0,12], deco:'orchard' },
  { id: 'axe', name: 'Axe Grove', palette: ['#2f612f','#3b7c3a','#5b8f4f'], enemy: '🕷️', unlock: 'axe', ring: ring(1,2), arc:[9,3], deco:'axe_grove' },
  { id: 'creek', name: 'Sling Creekside', palette: ['#4f9fc0','#8d9aa2','#333a42'], enemy: '🐸', unlock: 'sling', ring: ring(1,2), arc:[3,9], slowWater:true, deco:'creek' },
  { id: 'pasture', name: 'Pasture', palette: ['#6d8f4b','#92b862','#c0d98a'], enemy: '🐺', unlock: 'horse', ring: ring(2,3), arc:[3,7], deco:'pasture' },
  { id: 'smith', name: 'Smith Town', palette: ['#7a5a48','#9a7358','#ba8a6a'], enemy: '🛡️', unlock: 'sword', ring: ring(2,3), arc:[7,11], deco:'smith' },
  { id: 'fletcher', name: 'Fletcher Village', palette: ['#5a7a3f','#7da85b','#b8d685'], enemy: '🦅', unlock: 'bow', ring: ring(2,3), arc:[11,3], deco:'fletcher' },
  { id: 'bank', name: 'Riverbank Bank', palette: ['#71859b','#9aaabd','#c5d0dc'], enemy: '🦹', unlock: null, ring: ring(3,4), arc:[11,1], deco:'bank' },
  { id: 'tanner', name: 'Tanner Row', palette: ['#76563d','#9b7653','#c49b6d'], enemy: '😠', unlock: null, ring: ring(3,4), arc:[1,3], deco:'tanner' },
  { id: 'inn', name: 'The Second Wind', palette: ['#7d4935','#a36545','#d19762'], enemy: '🤢', unlock: null, ring: ring(3,4), arc:[3,5], deco:'inn' },
  { id: 'casino', name: 'Gaming Parlor', palette: ['#5d294f','#87366e','#bc568f'], enemy: '🤢', unlock: null, ring: ring(3,4), arc:[5,7], deco:'casino' },
  { id: 'farrier', name: 'Farrier Yard', palette: ['#655d55','#887b6c','#b0a08b'], enemy: '😠', unlock: null, ring: ring(3,4), arc:[7,9], deco:'farrier' },
  { id: 'armorer', name: 'Armorer Court', palette: ['#45515c','#657686','#91a1ae'], enemy: '♟', unlock: null, ring: ring(3,4), arc:[9,11], deco:'armorer' },
  { id: 'tundra', name: 'Tundra', palette: ['#8faecc','#c8d8e6','#f5fbff'], enemy: '😠', unlock: null, ring: ring(4,5), arc:[11.5,0.5], deco:'snow' },
  { id: 'sawmill', name: 'Sawmill Woods', palette: ['#254d2a','#2f6232','#3e7840'], enemy: '🧌', unlock: 'ballista', ring: ring(4,5), arc:[0.5,2.5], deco:'sawmill' },
  { id: 'marsh', name: 'Marsh', palette: ['#456243','#5e7f59','#89a37d'], enemy: '🐍', unlock: null, ring: ring(4,5), arc:[2.5,3.5], slowWater:true, deco:'marsh' },
  { id: 'marches', name: 'Marches', palette: ['#6d3e2f','#8a4f37','#b06343'], enemy: '🛡️', unlock: null, ring: ring(4,5), arc:[3.5,5.5], deco:'marches' },
  { id: 'desert', name: 'Desert', palette: ['#9e7338','#c89a4f','#e6c877'], enemy: '😠', unlock: null, ring: ring(4,5), arc:[5.5,6.5], deco:'desert' },
  { id: 'volcano', name: 'Volcano', palette: ['#6e231f','#a73a2f','#df6a3f'], enemy: '🐜', unlock: null, ring: ring(4,5), arc:[6.5,8.5], deco:'volcano', specialist:'wizard', element:'fire' },
  { id: 'mine', name: 'Mine', palette: ['#4f4a52','#726b77','#9a92a1'], enemy: '😠', unlock: null, ring: ring(4,5), arc:[8.5,9.5], deco:'mine' },
  { id: 'frost', name: 'Frosty Mountain', palette: ['#7e9fbe','#a4bfd8','#d8ecfb'], enemy: '❄️', unlock: null, ring: ring(4,5), arc:[9.5,11.5], deco:'frost', specialist:'alchemist', element:'ice' },
  { id: 'swamp', name: 'Swamp', palette: ['#2f5a2f','#4f7b46','#7ea85f'], enemy: '🧟', unlock: null, ring: ring(5,6), arc:[2,4], slowWater:true, deco:'swamp', specialist:'witch', element:'poison' },
  { id: 'foundry', name: 'Foundry/Monastery', palette: ['#5e4339','#7a5a4f','#a37d6b'], enemy: '👹', unlock: 'cannon', ring: ring(5,6), arc:[8,10], deco:'foundry' },
];

const state = { mode:'menu',glyphWeapon:'club',t:0,last:0,keys:new Set(),mouse:{x:0,y:0,down:false,held:0},camera:{x:MAP_CENTER.x,y:MAP_CENTER.y},player:null,projectiles:[],pickups:[],enemies:[],terrain:[],waves:{},mount:'foot',debug:[],diamonds:0,ammo:{arrows:0,bolts:0,jars:0,pellets:0,cannonballs:0},elements:{fire:0,ice:0,poison:0},activeElement:null,meta:{},pendingReward:null,offerNpc:null,currentZone:null,run:1,hazards:[],deployables:[],feedback:[],hudFlash:{hp:0,diamonds:0,lastHp:null,lastDiamonds:null},fungusRespawns:{},nextEnemyId:1,finance:{savings:0,debt:0,trust:0,trustAvailable:0,amounts:{savings:5,loan:10,trust:5}},casinoWagers:{coin:1,dice:1,card:1},shopPurchases:{} };
const BUILD_VERSION = 'v0.13.3 build 2026-06-12 15:02 UTC';
const wrap12=h=>(h%12+12)%12; const inArc=(h,[s,e])=>{h=wrap12(h);s=wrap12(s);e=wrap12(e);if(s===e)return true;return s<=e?(h>=s&&h<e):(h>=s||h<e)}; const toClockHour=t=>wrap12((t*6/Math.PI)+3);
const DEPLOYABLE_TOOLS={caltrop:{id:'caltrop',glyph:'✣',kind:'deployable',cooldown:.2},decoy:{id:'decoy',glyph:'🛡️',kind:'deployable',cooldown:.2}};
const weaponDef=()=>weapons.find(w=>w.id===state.player.weapon)||DEPLOYABLE_TOOLS[state.player.weapon];
const isChargeWeapon=w=>w&&(['sling','bow','ballista','cannon'].includes(w.id)||w.kind==='bow');
const chargeLevel=held=>1-Math.exp(-Math.max(0,held)/0.72);
const MERCHANT_ZONES = new Set(['bank','tanner','inn','casino','farrier','armorer']);
const MINOR_ZONES = new Set(['tundra','marsh','desert','mine']);
const MELEE_WEAPONS = new Set(['club','axe','sword']);
const MELEE_UPGRADE_SCHEDULE = ['damage','knockback','cooldown','damage','knockback','swingSpeed','damage','cooldown','knockback','reach'];
const RANGED_UPGRADE_SCHEDULE = ['damage','knockback','cooldown','damage','knockback','speed','damage','cooldown','knockback','range'];
const SLING_UPGRADE_SCHEDULE = ['damage','knockback','cooldown','shards','damage','knockback','shatterSpeed','damage','speed','knockback','range','cooldown'];
const ELEMENT_UPGRADE_STATS = {fire:['damage','duration'],ice:['slow','duration'],poison:['potency','dose']};
const ELEMENT_GLYPHS = {fire:'🔥',ice:'❄️',poison:'☠️'};
const SMITH_UNLOCKS = ['sword'];
const FOUNDRY_UNLOCKS = ['cannon','grapeshot'];
function upgradeStatsFor(id){
  if(id==='horse')return ['accel','speed','accel','accel','speed'];
  if(id==='sling')return SLING_UPGRADE_SCHEDULE;
  return MELEE_WEAPONS.has(id)?MELEE_UPGRADE_SCHEDULE:RANGED_UPGRADE_SCHEDULE;
}
const ZONE_NPCS = {bank:'🏦',tanner:'🧵',inn:'🍲',casino:'🎲',farrier:'🐴',armorer:'🛡️',orchard:'👨‍🌾',creek:'🧒',axe:'🧔',pasture:'🐎',smith:'🛡️',fletcher:'🏹',sawmill:'🪚',marches:'♜',volcano:'🧙‍♂️',frost:'🧙',swamp:'🧙‍♀️',foundry:'🙏'};
const NOTO_GAME_GLYPHS = [
  '🙂','🐎','🛡️','🪢','🪓','🗡️','🏹','🔥','❄️','☠️','🏺','🧥','🧪','✣',
  ...Object.values(ZONE_NPCS),...zones.map(zone=>zone.enemy),
  '🐛','🐿️','🪰','🐸','🐢','🦀','𓆦','🕷️','🦌','🐝','🐺','🐏','🐇',
  '🐦‍⬛','🦃','🦅','🐀','💃','🕺','🤢','🐻','🐂','🦝','🥷','🫏',
  '🦊','🦉','🐧','🐻‍❄️','🫎','🍄','🦟','🦂','🐍','🪲','🐜','🦎',
  '🐐','🐉','🦇','☃️','🧌','🐊','👻','🧟','🔔','🗿','👹',
  '🌲','🌳','🌴','🌵','🌿','🌉','🌀','🌋','🏔️','🏠','🏦','🧱','🪨','🪵',
  '🌰','🍆','🍑','🍎','🍖','🍲','🧀','🎲','🃏','🔨','⚙️','🧲'
];
const emojiPreload = NotoEmojiRenderer.preload([...new Set(NOTO_GAME_GLYPHS)]);

function metaFor(id){if(!state.meta[id])state.meta[id]={speed:0,range:0,reach:0,swingSpeed:0,cooldown:0,damage:0,knockback:0,accel:0,shards:0,shatterSpeed:0,poison:0,poisonResist:0,potency:0,dose:0,duration:0,slow:0,maxHp:0,bounty:0,jackpot:0,blockChance:0,blockAmount:0};return state.meta[id];}
function effectiveWeapon(base){
  const m=metaFor(base.id),melee=MELEE_WEAPONS.has(base.id);
  return {...base,knock:base.knock*(1+m.knockback*.1),reach:base.reach*(1+(melee?m.reach:m.range)*.1),damageMult:1+m.damage*.1,speedMult:1+(melee?0:m.speed)*.1,swingSpeedMult:1+(melee?m.swingSpeed:0)*.1,cooldownMult:Math.pow(.9,m.cooldown||0),tiers:m};
}
function rewardWeaponForZone(zone){return zone.id==='smith'?(SMITH_UNLOCKS.find(u=>!state.player.unlocked.has(u))||'sword'):zone.id==='foundry'?(FOUNDRY_UNLOCKS.find(u=>!state.player.unlocked.has(u))||'cannon'):(zone.element||zone.unlock||state.player.weapon);}
function unlockCost(zone){return zone.id==='orchard'?0:14;}
function upgradeCost(target,stat,base=15){return base+5*(metaFor(target)[stat]||0);}
const BASE_ENEMY_BOUNTY = 1;
function bountyRate(){return BASE_ENEMY_BOUNTY+(metaFor('bank').bounty||0);}
function enemyBounty(enemy){
  if(enemy.kind==='mushroom'&&enemy.propagated&&enemy.growT>0)return 0;
  const scaled=bountyRate()*(enemy.bountyMultiplier??1);
  return enemy.archetype==='fly'?Math.ceil(scaled):scaled;
}
function enemyCountForWave(zone,wave){const radTier=zone.ring.min/RADIUS_UNIT;return 6+Math.min(24,Math.floor(wave*1.25+radTier*2.1));}
function bankBountyUpgradeCost(){
  const bank=zones.find(zone=>zone.id==='bank'),firstWaveGross=enemyCountForWave(bank,1)*bountyRate();
  return Math.ceil(firstWaveGross*1.25);
}
function upgradeLabel(id,stat,cost){
  const names={swingSpeed:'swing speed',cooldown:'cooldown time',reach:'reach',shatterSpeed:'shatter speed'};
  if(stat==='shards')return `${id} +1 shard (${cost}♦)`;
  if(stat==='cooldown')return `${id} -10% cooldown (${cost}♦)`;
  return `${id} +10% ${names[stat]||stat} (${cost}♦)`;
}
function upgradeOption(target,stat,kind='weapon',base=15){const cost=upgradeCost(target,stat,base);return{[kind]:target,stat,cost,label:upgradeLabel(target,stat,cost)};}
function merchantOptions(zone,wave){
  const cash={diamonds:3+wave,label:`take ${3+wave}♦`};
  if(zone.id==='bank'){const cost=bankBountyUpgradeCost(),o={merchant:'bank',stat:'bounty',cost,label:`banker: bounty ${bountyRate()}♦ → ${bountyRate()+1}♦ (${cost}♦)`};return[o,cash];}
  if(zone.id==='tanner'){const accel=upgradeOption('foot','accel','merchant',12),speed=upgradeOption('foot','speed','merchant',18);accel.label=`tanner: +10% foot acceleration (${accel.cost}♦)`;speed.label=`tanner: +10% foot top speed (${speed.cost}♦)`;return[accel,speed,cash];}
  if(zone.id==='inn'){const o=upgradeOption('player','maxHp','merchant',20);o.label=`innkeeper: +1 max HP (${o.cost}♦)`;return[o,cash];}
  if(zone.id==='casino'){const o=upgradeOption('casino','jackpot','merchant',18);o.label=`casino: improve hidden jackpot odds (${o.cost}♦)`;return[o,cash];}
  if(zone.id==='farrier'){const accel=upgradeOption('horse','accel','weapon',12),speed=upgradeOption('horse','speed','weapon',18);accel.label=`farrier: +10% horse acceleration (${accel.cost}♦)`;speed.label=`farrier: +10% horse top speed (${speed.cost}♦)`;return[accel,speed,cash];}
  if(zone.id==='armorer'){
    if(!state.player.unlocked.has('shield'))return[{unlock:'shield',cost:unlockCost(zone),label:`armorer: unlock shield (${unlockCost(zone)}♦)`},cash];
    const chance=upgradeOption('shield','blockChance','merchant',16),amount=upgradeOption('shield','blockAmount','merchant',16);chance.label=`armorer: +5% shield block chance (${chance.cost}♦)`;amount.label=`armorer: +5% shield reduction (${amount.cost}♦)`;return[chance,amount,cash];
  }
  return null;
}
function distinctScheduledStats(pool,wave){
  const first=pool[wave%pool.length];let offset=1,second=pool[(wave+offset)%pool.length];
  while(second===first&&offset<pool.length){offset++;second=pool[(wave+offset)%pool.length];}
  return[first,second];
}
function buildReward(zone){
  const wave=state.waves[zone.id]?.wave||1,rewardId=rewardWeaponForZone(zone),cash={diamonds:3+wave,label:`take ${3+wave}♦`};let options;
  if(MERCHANT_ZONES.has(zone.id))options=merchantOptions(zone,wave);
  else if(zone.id==='marches')options=[{diamonds:3+wave,label:`soldier recruitment coming soon — take ${3+wave}♦`}];
  else if(zone.id==='smith'&&SMITH_UNLOCKS.some(u=>!state.player.unlocked.has(u))){const next=SMITH_UNLOCKS.find(u=>!state.player.unlocked.has(u)),cost=unlockCost(zone);options=[{unlock:next,cost,label:`unlock ${next} (${cost}♦)`},cash];}
  else if(zone.id==='foundry'&&FOUNDRY_UNLOCKS.some(u=>!state.player.unlocked.has(u))){const next=FOUNDRY_UNLOCKS.find(u=>!state.player.unlocked.has(u)),cost=unlockCost(zone);options=[{unlock:next,cost,label:`unlock ${next} (${cost}♦)`},cash];}
  else if(wave===1&&zone.unlock&&!state.player.unlocked.has(zone.unlock)){const cost=unlockCost(zone);options=[{unlock:zone.unlock,cost,label:`unlock ${zone.unlock} (${cost}♦)`},cash];}
  else if(zone.element&&!state.player.unlockedElements.has(zone.element)){const cost=unlockCost(zone);options=[{elementUnlock:zone.element,cost,label:`unlock ${zone.element} (${cost}♦)`},cash];}
  else if(zone.element){const pool=ELEMENT_UPGRADE_STATS[zone.element],[a,b]=distinctScheduledStats(pool,wave);options=[upgradeOption(zone.element,a,'element'),upgradeOption(zone.element,b,'element'),cash];}
  else{const pool=upgradeStatsFor(rewardId),[a,b]=distinctScheduledStats(pool,wave);options=[upgradeOption(rewardId,a),upgradeOption(rewardId,b),cash];}
  state.pendingReward={zone:zone.id,wave,options,purchased:false};state.offerNpc={x:state.player.x+42,y:state.player.y-34,glyph:ZONE_NPCS[zone.id]||'🙂',zone:zone.id,born:state.t};dbg(`[REWARD] ${zone.name} wave ${wave} cleared; NPC selling reward`);
}
function chooseReward(i){ const reward=state.pendingReward, here=getZone(state.player.x,state.player.y); if(!reward||reward.purchased||here?.id!==reward.zone) return; const option=reward.options[i]; if(!option) return; if(option.diamonds){state.diamonds+=option.diamonds;dbg(`[PAYOUT] +${option.diamonds}♦`);reward.purchased=true;return;} const cost=option.cost||0; if(state.diamonds<cost){dbg(`[SHOP] need ${cost}♦ for ${option.label}; have ${state.diamonds}♦`);return;} state.diamonds-=cost; if(option.unlock){ state.player.unlocked.add(option.unlock); if(weapons.some(w=>w.id===option.unlock)){state.player.weapon=option.unlock;state.player.lastWeapon=option.unlock;} dbg(`[UNLOCK] ${option.unlock} bought for ${cost}♦`); } else if(option.elementUnlock){ state.player.unlockedElements.add(option.elementUnlock); state.activeElement=option.elementUnlock; dbg(`[UNLOCK] ${option.elementUnlock} element bought for ${cost}♦`); } else if(option.element){ const m=metaFor(option.element); m[option.stat]++; dbg(`[UPGRADE] ${option.element}.${option.stat} -> ${m[option.stat]} cost=${cost}♦`); } else if(option.merchant){ const m=metaFor(option.merchant); m[option.stat]++; if(option.merchant==='player'&&option.stat==='maxHp'){state.player.maxHp++;state.player.hp=Math.min(state.player.maxHp,state.player.hp+1);} dbg(`[UPGRADE] ${option.merchant}.${option.stat} -> ${m[option.stat]} cost=${cost}♦`); } else if(option.heal){ state.player.hp=Math.min(state.player.maxHp,state.player.hp+option.heal); dbg(`[HEAL] +${option.heal} HP cost=${cost}♦`); } else { const m=metaFor(option.weapon); m[option.stat]++; dbg(`[UPGRADE] ${option.weapon}.${option.stat} -> ${m[option.stat]} cost=${cost}♦`); } reward.purchased=true; }
const CONSUMABLE_BASE={arrows:3,bolts:12,jars:5,pellets:4,cannonballs:8,fire:7,ice:7,poison:7,antitoxin:8,fruit:2,meat:4,cheese:6,stew:8,cloak:9,caltrops:7,decoy:9};
const ESCALATING_CONSUMABLES=new Set(['fruit','meat','cheese','stew','cloak','caltrops','decoy']);
function purchaseKey(kind){const zone=state.pendingReward?.zone||state.currentZone||'none',wave=state.waves[zone]?.wave||1;return `${state.run}:${zone}:${wave}:${kind}`;}
function consumablePrice(kind){const base=CONSUMABLE_BASE[kind],bought=state.shopPurchases[purchaseKey(kind)]||0;return base+(ESCALATING_CONSUMABLES.has(kind)?bought:0);}
function buyItem(kind){
  const qty={arrows:6,bolts:3,jars:2,pellets:8,cannonballs:2,fire:2,ice:2,poison:2},heals={fruit:1,meat:2,cheese:3,stew:4};
  const here=getZone(state.player.x,state.player.y),z=(state.pendingReward&&here?.id===state.pendingReward.zone)?state.pendingReward.zone:state.currentZone,home={arrows:'fletcher',bolts:'sawmill',jars:'creek',pellets:'smith',cannonballs:'foundry',fruit:'orchard',meat:'axe',cheese:'pasture',stew:'inn',cloak:'tanner',caltrops:'farrier',decoy:'armorer',fire:'volcano',ice:'frost',poison:'swamp',antitoxin:'swamp'}[kind];
  if(home&&z!==home){dbg(`[SHOP] ${kind} is sold in ${home}`);return;}
  if(kind==='cloak'&&(state.player.cloaks||0)>=1)return dbg('[SHOP] only one elemental cloak can be carried');
  if(kind==='arrows'&&!state.player.unlocked.has('bow'))return dbg('[SHOP] unlock bow before buying arrows');
  if(kind==='bolts'&&!state.player.unlocked.has('ballista'))return dbg('[SHOP] unlock ballista before buying bolts');
  if(kind==='jars'&&!state.player.unlocked.has('sling'))return dbg('[SHOP] unlock sling before buying jars');
  if(kind==='cannonballs'&&!state.player.unlocked.has('cannon'))return dbg('[SHOP] unlock cannon before buying cannonballs');
  if(['fire','ice','poison'].includes(kind)&&!state.player.unlockedElements.has(kind))return dbg(`[SHOP] unlock ${kind} before buying charges`);
  const cost=consumablePrice(kind);if(cost===undefined)return;if(state.diamonds<cost)return dbg(`[SHOP] need ${cost}♦ for ${kind}`);state.diamonds-=cost;const key=purchaseKey(kind);state.shopPurchases[key]=(state.shopPurchases[key]||0)+1;
  if(heals[kind]){const before=state.player.hp;state.player.hp=Math.min(state.player.maxHp,state.player.hp+heals[kind]);dbg(`[HEAL] ${kind} +${(state.player.hp-before).toFixed(1)} HP; next ${consumablePrice(kind)}♦`);return;}
  if(kind==='antitoxin'){state.player.status.poison=0;return dbg('[SHOP] anti-toxin cleared poison');}
  if(kind==='cloak'){state.player.cloaks=1;return dbg('[SHOP] elemental cloak equipped');}
  if(kind==='caltrops'){state.player.caltrops=(state.player.caltrops||0)+1;return dbg('[SHOP] caltrops +1');}
  if(kind==='decoy'){state.player.decoys=(state.player.decoys||0)+1;return dbg('[SHOP] armor-stand decoy +1');}
  if(['fire','ice','poison'].includes(kind)){state.elements[kind]+=qty[kind];state.activeElement=kind;return dbg(`[SHOP] bought ${qty[kind]} ${kind} charges`);}
  state.ammo[kind]+=qty[kind];dbg(`[SHOP] bought ${qty[kind]} ${kind} for ${cost}♦`);
}
function adjustFinance(account,delta){const f=state.finance,limits={savings:Math.max(1,state.diamonds),loan:50,trust:Math.max(1,state.diamonds)};f.amounts[account]=Math.max(1,Math.min(limits[account]||50,(f.amounts[account]||1)+delta));}
function financeAction(kind){
  if(getZone(state.player.x,state.player.y)?.id!=='bank'||state.pendingReward?.zone!=='bank')return;
  const f=state.finance;
  if(kind==='savingsDeposit'){const n=Math.min(f.amounts.savings,state.diamonds);state.diamonds-=n;f.savings+=n;dbg(`[BANK] savings +${n}♦`);}
  if(kind==='savingsWithdraw'){const n=Math.min(f.amounts.savings,f.savings);f.savings-=n;state.diamonds+=n;dbg(`[BANK] savings -${n}♦`);}
  if(kind==='loanBorrow'){const principal=f.amounts.loan,total=Math.ceil(principal*1.3);state.diamonds+=principal;f.debt+=total;dbg(`[BANK] borrowed ${principal}♦; repayment +${total}♦`);}
  if(kind==='loanRepay'){const n=Math.min(f.amounts.loan,state.diamonds,f.debt);state.diamonds-=n;f.debt-=n;dbg(`[BANK] debt -${n}♦`);}
  if(kind==='trustDeposit'){const n=Math.min(f.amounts.trust,state.diamonds);state.diamonds-=n;f.trust+=n;dbg(`[BANK] trust +${n}♦`);}
  if(kind==='trustWithdraw'){const n=Math.min(f.amounts.trust,f.trustAvailable,f.trust);f.trust-=n;f.trustAvailable-=n;state.diamonds+=n;dbg(`[BANK] trust withdrawal ${n}♦`);}
}
function adjustCasino(game,delta){state.casinoWagers[game]=Math.max(1,Math.min(50,(state.casinoWagers[game]||1)+delta));}
function casinoAction(game){
  if(getZone(state.player.x,state.player.y)?.id!=='casino'||state.pendingReward?.zone!=='casino')return;
  const wager=state.casinoWagers[game]||1;if(state.diamonds<wager)return dbg(`[CASINO] need ${wager}♦`);state.diamonds-=wager;
  const rules={coin:{chance:.4,mult:2},dice:{chance:1/6,mult:5},card:{chance:1/52,mult:40}}[game];
  if(Math.random()<rules.chance){const payout=wager*rules.mult;state.diamonds+=payout;dbg(`[CASINO] ${game} paid ${payout}♦`);}else dbg(`[CASINO] ${game} lost ${wager}♦`);
}
function financeAmountControl(account,value){return `<button data-finance-adjust="-1" data-account="${account}">−</button><strong>${value}♦</strong><button data-finance-adjust="1" data-account="${account}">+</button>`;}
function shopConsumables(zoneId){
  const items={orchard:[['fruit','🍎 fruit +1 HP']],axe:[['meat','🍖 meat +2 HP']],pasture:[['cheese','🧀 cheese +3 HP']],inn:[['stew','🍲 stew +4 HP']],creek:[['jars','🏺 2 jars']],fletcher:[['arrows','➵ 6 arrows']],sawmill:[['bolts','➳ 3 ballista bolts']],smith:[['pellets','● 8 pellets']],foundry:[['cannonballs','⚫ 2 cannonballs']],tanner:[['cloak','🧥 elemental cloak']],farrier:[['caltrops','✣ caltrops']],armorer:[['decoy','🛡️ armor decoy']],volcano:[['fire','🔥 2 fire charges']],frost:[['ice','❄️ 2 ice charges']],swamp:[['poison','☠️ 2 poison charges'],['antitoxin','🧪 anti-toxin']]}[zoneId]||[];
  let html=items.map(([kind,label])=>{const full=kind==='cloak'&&(state.player.cloaks||0)>=1;return `<button type="button" data-buy="${kind}" ${full?'disabled':''}>${full?'🧥 cloak already equipped':`${label} · ${consumablePrice(kind)}♦`}</button>`;}).join(' ');
  if(zoneId==='bank'){const f=state.finance;html=`<table class="money-table"><tr><th>Account</th><th>Balance</th><th>Amount</th><th>Deposit / Borrow</th><th>Withdraw / Repay</th></tr><tr><td>Savings</td><td>${f.savings}♦</td><td>${financeAmountControl('savings',f.amounts.savings)}</td><td><button data-finance="savingsDeposit">Deposit</button></td><td><button data-finance="savingsWithdraw">Withdraw</button></td></tr><tr><td>Loan</td><td>${f.debt}♦ owed</td><td>${financeAmountControl('loan',f.amounts.loan)}</td><td><button data-finance="loanBorrow">Borrow</button></td><td><button data-finance="loanRepay">Repay</button></td></tr><tr><td>Trust</td><td>${f.trust}♦ (${f.trustAvailable}♦ available)</td><td>${financeAmountControl('trust',f.amounts.trust)}</td><td><button data-finance="trustDeposit">Deposit</button></td><td><button data-finance="trustWithdraw">Withdraw</button></td></tr></table>`;}
  if(zoneId==='casino')html=`<table class="money-table"><tr><th>Game</th><th>Potential payout</th><th>Wager</th><th>Play</th></tr>${[['coin','2×'],['dice','5×'],['card','40×']].map(([game,pay])=>`<tr><td>${game}</td><td>${pay}</td><td><button data-casino-adjust="-1" data-game="${game}">−</button><strong>${state.casinoWagers[game]}♦</strong><button data-casino-adjust="1" data-game="${game}">+</button></td><td><button data-casino="${game}">Wager</button></td></tr>`).join('')}</table>`;
  return html||'<span>None available here.</span>';
}
function queueNextWaveFromReward(reason='NEXT',force=false){ const reward=state.pendingReward; if(!reward||(!reward.purchased&&!force)) return; const w=state.waves[reward.zone]; if(w){w.wave++;w.spawned=false;w.cleared=false; dbg(`[${reason}] ${reward.zone} wave ${w.wave} ready`);} state.pendingReward=null; state.offerNpc=null; }
function startNextWave(){ queueNextWaveFromReward('NEXT',false); }
window.chooseReward=chooseReward;
const maxHpOf=o=>o.maxHp||20;
function addStatus(o,type,power=1){if(o===state.player&&(o.cloaks||0)>0){o.cloaks--;dbg(`[CLOAK] blocked ${type}`);return;}o.status=o.status||{}; if(type==='poison')o.status.poison=(o.status.poison||0)+power*(1+(metaFor('poison').dose||0)*0.1); if(type==='fire')o.status.fire=(o.status.fire||0)+10*power*(1+(metaFor('fire').damage||0)*0.1)*(1+(metaFor('fire').duration||0)*0.1); if(type==='ice')o.status.ice=Math.max(o.status.ice||0,4*power*(1+(metaFor('ice').duration||0)*0.1));}
function tickStatus(o,dt,isPlayer=false){if(!o.status)return; const max=maxHpOf(o); if(o.status.poison){const res=isPlayer?Math.min(0.85,(metaFor('player').poisonResist||0)*0.1):0,pot=1+((metaFor('poison').potency||0)+(metaFor('poison').poison||0))*0.1,rate=0.01*Math.sqrt(o.status.poison)*pot*(1-res); o.hp=Math.max(0,o.hp-(max-o.hp)*rate*dt);} if(o.status.fire>0){const dps=Math.max(0,o.status.fire); o.hp=Math.max(0,o.hp-dps*dt); o.status.fire=Math.max(0,o.status.fire-dt);} if(o.status.ice>0){o.status.ice=Math.max(0,o.status.ice-dt);} }
function resurrect(){ dbg(`[DOWNFALL] run ${state.run} ended; upgrades persist, waves reset`); state.run++; state.player.x=MAP_CENTER.x; state.player.y=MAP_CENTER.y; state.player.vx=0; state.player.vy=0; state.player.maxHp=5+(metaFor('player').maxHp||0); state.player.hp=state.player.maxHp; state.player.status={}; state.player.weapon='club';state.player.lastWeapon='club'; state.player.unlocked=new Set(['club']); state.player.unlockedElements=new Set(); state.player.shield=false; state.player.enchants={}; state.player.caltrops=0; state.player.decoys=0; state.player.cloaks=0; state.mount='foot'; state.enemies=[]; state.projectiles=[]; state.pickups=[]; state.ammo={arrows:0,bolts:0,jars:0,pellets:0,cannonballs:0}; state.elements={fire:0,ice:0,poison:0}; state.activeElement=null; state.deployables=[];state.feedback=[];state.hudFlash={hp:0,diamonds:0,lastHp:state.player.hp,lastDiamonds:0};state.fungusRespawns={};state.nextEnemyId=1; state.player.attackCooldown=0;state.player.attackCooldownTotal=0; const trust=state.finance.trust,liquidPay=Math.min(state.finance.debt,state.diamonds+state.finance.savings),remainingDebt=Math.max(0,state.finance.debt-liquidPay),trustCover=Math.min(remainingDebt,Math.floor(trust*0.1));state.finance={savings:0,debt:0,trust:Math.max(0,trust-trustCover),trustAvailable:0,amounts:{savings:5,loan:10,trust:5}};state.diamonds=0; state.pendingReward=null; state.offerNpc=null; state.currentZone=null; for(const z of zones) state.waves[z.id]={wave:1,spawned:false,cleared:false}; }
function randomPointInZone(zone){ for(let tries=0;tries<80;tries++){ const span=((zone.arc[1]-zone.arc[0]+12)%12)||12,h=(zone.arc[0]+Math.random()*span)%12,rr=zone.ring.min+(zone.ring.max-zone.ring.min)*(0.08+Math.random()*0.84),th=(h-3)*Math.PI/6,x=MAP_CENTER.x+Math.cos(th)*rr,y=MAP_CENTER.y+Math.sin(th)*rr; if(!collidesObstacle(x,y))return{x,y}; } return {x:state.player.x+80,y:state.player.y}; }
function spawnPointOuterEdge(zone,i,count){const span=((zone.arc[1]-zone.arc[0]+12)%12)||12,h=(zone.arc[0]+span*((i+0.5)/count))%12,rr=zone.ring.max-45-Math.random()*80,th=(h-3)*Math.PI/6;return{x:MAP_CENTER.x+Math.cos(th)*rr,y:MAP_CENTER.y+Math.sin(th)*rr};}
function enemyVariant(zone,wave,i){
  let glyph=zone.enemy||'😠',hpMul=1,powMul=1,kind=zone.id==='axe'?'spider':zone.id,weapon=null,archetype='standard',knockResist=1,visualScale=1;
  const set=(g,k,h=1,p=1,a='standard',resist=1,size=1,w=null)=>{glyph=g;kind=k;hpMul=h;powMul=p;archetype=a;knockResist=resist;visualScale=size;weapon=w;};
  if(zone.id==='orchard'&&wave>1&&i%3===0)set('🐿️','squirrel',.65,.9);
  if(zone.id==='creek'&&wave>1&&i%4===0)set('🐢','turtle',3.2,2.1,'tank',.5);
  if(zone.id==='creek'&&wave>=2&&i%6===1)set('🦀','crab',1.15,1.15);
  if(zone.id==='axe'&&wave>1&&i%3===0)set('🦌','deer',1.1,1.65,'charger',.72);
  if(zone.id==='pasture'&&wave>1&&i%4===0)set('🐏','ram',1.3,1.8,'charger',.62);
  if(zone.id==='fletcher'){
    const opts=wave<2?['🐦‍⬛']:wave<4?['🐦‍⬛','🦃']:['🐦‍⬛','🦃','🦅'];glyph=opts[i%opts.length];
    if(glyph==='🦃')set(glyph,'turkey',2.9,2,'tank',.5);else if(glyph==='🦅')set(glyph,'eagle',1,1.8,'bird',.8);else set(glyph,'crow',.75,.8,'bird',.9);
  }
  if(zone.id==='smith'){
    const arms=wave===1?['🔨']:['🔨','🪓','🗡️','🏹'].slice(0,Math.min(4,wave+1)),arm=arms[(i+wave)%arms.length];set('♙','smithPawn',1,1,'standard',1,1,arm);
    if(wave>=2&&i%7===6)set('🪰','firefly',.3,.34,'fly',.82);
  }
  if(zone.id==='pasture'&&wave>1&&i%3===0&&kind!=='ram')set('🐇','rabbit',.45,.75);
  if(zone.id==='pasture'&&i%6===5)set('🪰','horseFly',.62,.58,'fly',.72,1.55);
  if(zone.id==='bank'){
    if(wave>=2&&i%5===0)set('🐻','bear',3.4,2.3,'tank',.5);
    else if(wave>=2&&i%5===1)set('🐂','bull',1.55,2,'charger',.55);
    else if(wave>=2&&i%5===2)set('🦝','raccoon',.7,.35,'thief',.9);
  }
  if(zone.id==='tanner'){
    if(wave>=2&&i%6===0)set('🐂','bull',1.5,1.9,'charger',.58);
    else if(i%5===1)set('🐿️','squirrel',.7,.85);
    else set('🪰','tanneryFly',.24,.2,'fly',.76,.72);
  }
  if(zone.id==='inn'){const pick=i%4;if(pick===0)set('🐀','innRat',.5,.45);else if(pick===3)set('🤢','innDrunk',1,1);else set(pick===1?'💃':'🕺','innReveler',.9,.8,'reveler',.95);}
  if(zone.id==='casino'){const pick=i%4;if(pick===0)set('🐀','casinoRat',.5,.45);else if(pick===3)set('🤢','casinoDrunk',1,1);else set(pick===1?'💃':'🕺','casinoReveler',.9,.8,'reveler',.95);}
  if(zone.id==='farrier'){
    set('♙','farrierPawn',1,1,'standard',1,1,'🔨');
    if(wave>=2&&i%6===0)set('♞','farrierKnight',1.4,1.8,'charger',.62);
    else if(wave>=2&&i%6===1)set('🥷','farrierNinja',.68,.42,'thief',.88);
    else if(i%6===2)set('🫏','donkey',1.25,1.15);
    else if(wave>=2&&i%6===3)set('🪰','firefly',.3,.34,'fly',.82);
  }
  if(zone.id==='armorer'){
    set('♙','armorerPawn',1.15,1.1,'standard',.82,1,'🔨');
    if(wave>=2&&i%5===0)set('♞','armorerKnight',1.65,2,'charger',.52);
    else if(wave>=2&&i%5===1)set('🥷','armorerNinja',.72,.45,'thief',.86);
    else if(wave>=2&&i%5===2)set('🪰','firefly',.32,.36,'fly',.8);
  }
  if(zone.id==='tundra'){
    const pick=i%6;if(pick===0)set('🦊','arcticFox',.72,.85);else if(pick===1)set('🦉','snowyOwl',.65,.8,'bird',.88);else if(pick===2)set('🐂','muskOx',2.7,2.1,'tank',.5);else if(pick===3)set('🐇','frostHare',.46,.65);else if(pick===4)set('🪰','iceFly',.34,.3,'fly',.78);else set('🐧','penguin',1.1,.85);
    if(wave>=3&&i%8===7)set('🐻‍❄️','polarBear',3.8,2.5,'tank',.5);
  }
  if(zone.id==='sawmill'){
    if(i%2===0)set('🐻','bear',3.6,2.35,'tank',.5);
    else set('🫎','moose',1.8,2.15,'charger',.48);
  }
  if(zone.id==='marsh'){if(i%3===0)set('🍄','mushroom',.75,.65,'mushroom',.85);else if(wave>=2&&i%5===2)set('🦟','mosquito',.32,.3,'fly',.76);}
  if(zone.id==='marches'){
    const pick=i%4;if(pick===0)set('♟','marchPawn',1,1);else if(pick===1)set('♞','marchKnight',1.45,1.8,'charger',.6);else if(pick===2)set('♜','marchRook',3,2.1,'tank',.45);else set('♝','marchBishop',.9,1.25,'standard',.9);
  }
  if(zone.id==='desert'){
    const pick=i%5;if(pick===0)set('🦂','scorpion',1.05,1.2);else if(pick===1)set('🐍','desertSnake',.8,1.05);else if(pick===2)set('🦅','vulture',.75,1,'bird',.88);else if(pick===3)set('🪲','scarab',.62,.75);else set('🐜','fireAnt',.4,1,'fireAnt',.92);
  }
  if(zone.id==='volcano'){
    const pick=i%5;if(pick===0)set('🐜','fireAnt',.42,1.05,'fireAnt',.92);else if(pick===1)set('🦎','salamander',1.1,1.25);else if(pick===2)set('🐐','volcanoGoat',1.3,1.9,'charger',.62);else if(pick===3)set('𓆦','fireDragonfly',.4,.55,'fly',.78);else set('🪰','firefly',.3,.34,'fly',.82);
    if(wave>=3&&wave%3===0&&i===0)set('🐉','volcanoDragon',5.2,3.4,'tank',.38,1.8);
  }
  if(zone.id==='mine'){
    const pick=i%3;if(pick===0)set('🐻','bear',3.5,2.3,'tank',.5);else if(pick===1)set('🐐','goat',1.25,1.8,'charger',.65);else set('🦇','bat',.65,.9,'bird',.92);
  }
  if(zone.id==='frost'){
    const pick=i%6;if(pick<=1)set('☃️','snowman',1.15,1.15);else if(pick===2)set('🦉','snowyOwl',.68,.82,'bird',.88);else if(pick===3)set('🐐','goat',1.3,1.9,'charger',.62);else if(pick===4)set('🧌','yeti',2.4,2,'tank',.5);else set('🐧','penguin',1.05,.85);
    if(wave>=3&&i%8===7)set('🐻‍❄️','polarBear',3.8,2.5,'tank',.5);
  }
  if(zone.id==='swamp'){
    const pick=i%7;if(pick===0)set('🍄','mushroom',.75,.65,'mushroom',.85);else if(pick===1)set('🦟','mosquito',.32,.3,'fly',.76);else if(pick===2)set('🐊','crocodile',3.1,2.2,'tank',.48);else if(pick===3)set('🕷️','swampSpider',.82,1.05);else if(pick===4)set('👻','ghost',.72,1.15,'fly',.9,1.2);else if(pick===5)set('🧟','zombie',1.8,1.4);else set('🐍','snake',.8,1.1);
  }
  if(zone.id==='foundry'){
    const pick=i%6;if(pick===0)set('🧟','skeletonMonk',1.35,1.35);else if(pick===1)set('🔔','bellSpirit',1.15,1.5);else if(pick===2)set('🗿','furnaceGolem',3.8,2.6,'tank',.4);else if(pick===3)set('👹','imp',.65,1.15);else if(pick===4)set('🛡️','hauntedArmor',2.5,1.9,'tank',.45);else set('🦇','bat',.7,1,'bird',.9);
  }
  if(zone.id==='orchard'&&wave>=2&&i%5===2)set('🪰','fly',.34,.28,'fly',.78);
  if(zone.id==='axe'&&wave>=2&&i%5===2)set('🐝','bee',.4,.38,'fly',.75);
  if(zone.id==='creek'&&wave>=2&&i%5===2)set('𓆦','dragonfly',.38,.32,'fly',.8);
  if(zone.id==='sawmill'&&wave>=3&&i%9===0)set('🍄','mushroom',.7,.6,'mushroom',.85);
  if(zone.id==='sawmill'&&wave>=4&&i%11===5)set('🪰','fly',.36,.3,'fly',.78);
  const treeZones=new Set(['orchard','axe','fletcher','sawmill','tanner']);
  if(wave>=3&&treeZones.has(zone.id)&&kind!=='squirrel'&&i%7===6)set('🐿️','squirrel',.72,.95);
  return{glyph,hpMul,powMul,kind,weapon,archetype,knockResist,visualScale};
}
function linkFireAntChains(enemies){
  const ants=enemies.filter(e=>e.kind==='fireAnt');
  for(let start=0;start<ants.length;start+=5){
    const chain=ants.slice(start,start+5),leader=chain[0];if(!leader)continue;
    const dx=leader.x-MAP_CENTER.x,dy=leader.y-MAP_CENTER.y,d=Math.hypot(dx,dy)||1,backX=dx/d,backY=dy/d;
    chain.forEach((ant,index)=>{ant.chainId=leader.id;ant.followId=index?chain[index-1].id:null;ant.trail=[];if(index){ant.x=leader.x+backX*23*index;ant.y=leader.y+backY*23*index;}});
  }
}
function spawnWave(zone){
  const wave=state.waves[zone.id]?.wave||1,radTier=zone.ring.min/RADIUS_UNIT,difficulty=Math.pow(1.65,radTier),enemyPower=1.25*Math.pow(2.15,radTier)*Math.pow(1.1,wave*3);
  state.waves[zone.id].spawned=true;state.waves[zone.id].fungusRecovered=false;const count=enemyCountForWave(zone,wave);let hp=5*difficulty*(1+wave*.08);if(zone.id==='orchard')hp*=.83;if(zone.id==='fletcher')hp*=.55;
  const spawned=[];
  for(let i=0;i<count;i++){const pt=spawnPointOuterEdge(zone,i,count),v=enemyVariant(zone,wave,i),enemy={id:state.nextEnemyId++,x:pt.x,y:pt.y,hp:hp*v.hpMul,maxHp:hp*v.hpMul,status:{},glyph:v.glyph,kind:v.kind,archetype:v.archetype,knockResist:v.knockResist,visualScale:v.visualScale,weapon:v.weapon,zone:zone.id,wave,minR:zone.ring.min,vx:0,vy:0,bountyMultiplier:v.archetype==='fly'?.5:1,hop:Math.random()*.8,power:enemyPower*v.powMul,shotT:1+Math.random()*2,behaviorT:Math.random()};state.enemies.push(enemy);spawned.push(enemy);}
  linkFireAntChains(spawned);
  dbg(`[WAVE] ${zone.name} wave ${wave} enemies=${count} hp=${hp.toFixed(1)} power=${enemyPower.toFixed(2)}`);
}
function completeWave(zone){ const waveState=state.waves[zone.id]; if(!waveState||waveState.cleared) return; waveState.cleared=true;if(zone.id==='bank'){if(state.finance.savings>0){const interest=Math.max(1,Math.floor(state.finance.savings*0.08));state.finance.savings+=interest;dbg(`[BANK] savings interest +${interest}♦`);}if(state.finance.trust>0){const interest=Math.max(1,Math.floor(state.finance.trust*0.08));state.finance.trust+=interest;state.finance.trustAvailable+=interest*2;dbg(`[BANK] trust interest +${interest}♦; withdrawal allowance +${interest*2}♦`);}} if(MINOR_ZONES.has(zone.id)){ const bonus=2+Math.floor((waveState.wave||1)/2); state.diamonds+=bonus; dbg(`[MINOR] ${zone.name} wave ${waveState.wave} +${bonus}♦`); waveState.wave++; waveState.spawned=false; waveState.cleared=false; return; } buildReward(zone); }
function resolveEnemySpacing(dt){
  const p=state.player,pr=state.mount==='horse'&&p.unlocked.has('horse')?28:18,er=16;
  for(let i=0;i<state.enemies.length;i++){
    const e=state.enemies[i];
    for(let j=i+1;j<state.enemies.length;j++){const o=state.enemies[j],dx=o.x-e.x,dy=o.y-e.y,d=Math.hypot(dx,dy)||1,min=er*2;if(d<min){const push=(min-d)*.5,nx=dx/d,ny=dy/d;e.x-=nx*push;e.y-=ny*push;o.x+=nx*push;o.y+=ny*push;}}
    const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,min=pr+er;
    if(d<min&&(e.stun||0)<=0&&(e.knockbackT||0)<=0){
      const nx=dx/d,ny=dy/d,push=min-d,speed=Math.hypot(e.vx||0,e.vy||0);e.x-=nx*push*.65;e.y-=ny*push*.65;p.x+=nx*push*.35;p.y+=ny*push*.35;
      let contactKnock=18,damageMul=1;
      if(e.archetype==='tank'){damageMul=2.2;contactKnock=42;}
      if(e.archetype==='fly'){damageMul=.25;contactKnock=5;}
      if(e.archetype==='charger'){damageMul=1.25+Math.min(2.4,speed/170);contactKnock=45+speed*.22;e.beh='recover';e.behaviorT=.7;}
      if(e.archetype==='thief'){
        damageMul=.18;contactKnock=6;
        if(!e.fleeing&&state.t>(e.stealCooldown||0)){const stolen=Math.min(state.diamonds,enemyBounty(e));state.diamonds-=stolen;if(stolen>0)spawnSuitFeedback(p.x,p.y+14,'♦',stolen,'#ff6677',{negative:true,direction:1,mergeKey:'diamondLoss'});e.stolen=(e.stolen||0)+stolen;e.fleeing=true;e.stealCooldown=state.t+2;dbg(`[THIEF] ${e.glyph} stole ${stolen}♦ and fled`);}
      }
      p.vx+=nx*contactKnock;p.vy+=ny*contactKnock;
      let hit=(.7+.55*Math.sqrt(e.power||1))*dt*damageMul;
      if(e.kind==='eagle')hit*=1+Math.min(1.5,speed/260);
      if(p.shield){const sh=metaFor('shield'),chance=Math.min(.75,.3+(sh.blockChance||0)*.05),block=Math.min(.8,.3+(sh.blockAmount||0)*.05);if(Math.random()<chance){hit*=1-block;p.vx+=nx*22;p.vy+=ny*22;e.vx-=nx*22;e.vy-=ny*22;dbg(`[SHIELD] blocked ${(block*100).toFixed(0)}% contact damage`);}}
      const hpBefore=p.hp;p.hp=Math.max(0,p.hp-hit);showPlayerDamage(hpBefore-p.hp);if((['fireAnt','firefly','salamander','fireDragonfly','volcanoDragon'].includes(e.kind))&&(e.contactEffectCooldown||0)<=0){addStatus(p,'fire',['firefly','fireDragonfly'].includes(e.kind) ? .08 : .22);e.contactEffectCooldown=.75;}if(['spider','swampSpider','snake','desertSnake','scorpion'].includes(e.kind)||e.zone==='swamp'||e.zone==='marsh')addStatus(p,'poison',.02*(e.power||1));if(e.kind==='iceFly')addStatus(p,'ice',.08);
    }
  }
}
function getZone(x,y){const dx=x-MAP_CENTER.x,dy=y-MAP_CENTER.y,r=Math.hypot(dx,dy),h=toClockHour(Math.atan2(dy,dx)); return zones.find(z=>r>=z.ring.min&&r<z.ring.max&&inArc(h,z.arc))||null;}
function projectWorld(wx,wy){ const dx=wx-state.camera.x, dy=wy-state.camera.y; const pxPerWorld=0.55; return {x:innerWidth*0.5 + dx*pxPerWorld, y:innerHeight*0.5 + dy*pxPerWorld, scale:1}; }

function spawnZoneDecor(z){
  const cfg={bank:{n:20,g:['🏦','🪨']},tanner:{n:24,g:['🧵','🪵']},inn:{n:18,g:['🏠','🍲']},casino:{n:18,g:['🎲','🃏','♣️','♦️']},farrier:{n:24,g:['🧲','🪨']},armorer:{n:28,g:['🛡️','🧱']},orchard:{n:48,g:['🌳','🌳','🌲'],uniform:true},axe_grove:{n:70,g:['🌲','🌲','🌲','🌲','🌲','🌳']},sawmill:{n:720,g:['🌲','🌳','🌴','🌲','🌲','🌳']},smith:{n:90,g:['🧱']},fletcher:{n:25,g:['🧱','🌲']},foundry:{n:35,g:['🧱','🪨']},mine:{n:80,g:['🪨']},frost:{n:70,g:['🪨']},marches:{n:45,g:['♜']},desert:{n:55,g:['🌵']},creek:{n:18,g:['🌲']},swamp:{n:18,g:['🌲']},pasture:{n:8,g:['🌿']},marsh:{n:14,g:['🌿']},volcano:{n:16,g:['🪨']},snow:{n:10,g:['🪨']}}[z.deco]||{n:8,g:['🌿']};
  for(let i=0;i<cfg.n;i++){let h,rr; if(cfg.uniform){ const start=z.arc[0],end=z.arc[1]; const span=((end-start+12)%12)||12; const t=(i*0.61803398875+Math.random()*0.18)%1; h=(start + t*span)%12; rr=z.ring.min+(z.ring.max-z.ring.min)*(0.18+0.64*Math.sqrt((i+Math.random())/cfg.n)); } else { h=Math.random()*12; if(!inArc(h,z.arc))continue; rr=z.ring.min+(z.ring.max-z.ring.min)*(0.08+0.84*Math.random()); } const th=(h-3)*Math.PI/6; const glyph=cfg.g[(Math.random()*cfg.g.length)|0]; const type=(glyph==='🧱'||glyph==='🪨')?'wall':'tree'; state.terrain.push({x:MAP_CENTER.x+Math.cos(th)*rr,y:MAP_CENTER.y+Math.sin(th)*rr,hp:3,glyph,type,solid:true,stump:false,color:glyph==='♜'?'#000':null});}
}


function addBarrierArc(zoneId,glyph,type,count,{rows=1,gaps=[],solid=true,hazard=null,hp=8,size=22}={}){
  const z=zones.find(q=>q.id===zoneId),span=((z.arc[1]-z.arc[0]+12)%12)||12;
  for(let row=0;row<rows;row++)for(let i=0;i<count;i++){
    const t=(i+0.5)/count;if(gaps.some(([a,b])=>t>=a&&t<=b))continue;
    const h=(z.arc[0]+span*t)%12,rr=z.ring.min+42+row*38+(Math.random()-0.5)*18,th=(h-3)*Math.PI/6;
    const item={x:MAP_CENTER.x+Math.cos(th)*rr,y:MAP_CENTER.y+Math.sin(th)*rr,hp,glyph,type,solid,stump:false,hazard,size};
    state.terrain.push(item);if(hazard)state.hazards.push(item);
  }
}
function spawnNaturalBarriers(){
  addBarrierArc('volcano','🔥','hazard',34,{rows:2,gaps:[[0.2,0.31],[0.68,0.78]],solid:false,hazard:'fire',hp:Infinity,size:30});
  addBarrierArc('frost','🪨','wall',30,{rows:2,gaps:[[0.32,0.43],[0.76,0.86]],hp:12,size:22});
  addBarrierArc('mine','🪨','wall',18,{rows:2,gaps:[[0.4,0.58]],hp:14,size:22});
  addBarrierArc('desert','🌵','wall',24,{rows:2,gaps:[[0.2,0.31],[0.7,0.82]],hazard:'cactus',hp:7,size:24});
  addBarrierArc('marches','🧱','wall',30,{rows:2,gaps:[[0.16,0.27],[0.48,0.58],[0.8,0.9]],hp:10,size:22});
}
function applyEnvironmentalHazards(o,dt){
  o.hazardCooldown=Math.max(0,(o.hazardCooldown||0)-dt);
  for(const h of state.hazards){if(h.stump)continue;const dx=o.x-h.x,dy=o.y-h.y,d=Math.hypot(dx,dy);if(d>44)continue;
    if(h.hazard==='fire'){if(o===state.player&&(o.cloaks||0)>0&&o.hazardCooldown<=0){o.cloaks--;o.hazardCooldown=0.8;dbg('[CLOAK] blocked flames');continue;}o.hp=Math.max(0,o.hp-2.4*dt);if(o.hazardCooldown<=0){addStatus(o,'fire',0.55);o.hazardCooldown=0.65;}}
    if(h.hazard==='cactus'){o.hp=Math.max(0,o.hp-1.2*dt);const k=34/(d||1);o.vx=(o.vx||0)+dx*k;o.vy=(o.vy||0)+dy*k;}
  }
}

function resetWorld(){const s={x:MAP_CENTER.x,y:MAP_CENTER.y};state.player={x:s.x,y:s.y,vx:0,vy:0,hp:5+(metaFor('player').maxHp||0),maxHp:5+(metaFor('player').maxHp||0),status:{},weapon:'club',lastWeapon:'club',unlocked:new Set(['club']),unlockedElements:new Set(),shield:false,enchants:{},swing:0,swingSerial:0,attackCooldown:0,attackCooldownTotal:0,cannonCooldown:0,lastX:s.x,lastY:s.y}; state.mount='foot'; state.ammo={arrows:0,bolts:0,jars:0,pellets:0,cannonballs:0}; state.slingMode='rock'; state.arrowMode='regular'; state.elements={fire:0,ice:0,poison:0}; state.activeElement=null; state.projectiles=[];state.pickups=[];state.enemies=[];state.terrain=[];state.hazards=[];state.deployables=[];state.feedback=[];state.hudFlash={hp:0,diamonds:0,lastHp:state.player.hp,lastDiamonds:state.diamonds};state.fungusRespawns={};state.nextEnemyId=1;state.waves={};state.pendingReward=null;state.offerNpc=null;state.currentZone=null;state.finance={savings:0,debt:0,trust:0,trustAvailable:0,amounts:{savings:5,loan:10,trust:5}};state.casinoWagers={coin:1,dice:1,card:1};state.shopPurchases={}; for(const z of zones){state.waves[z.id]={wave:1,spawned:false,cleared:false};spawnZoneDecor(z);} spawnNaturalBarriers(); }

// Waterways use 12-hour clock bearings. Cold river: Frosty Mountain -> outer edge of northern Merchant Road -> Tundra/Sawmill barrier -> Marsh -> Swamp. Warm creek: Volcano -> Creekside oxbow -> Pasture/Fletcher boundary -> Marsh -> Swamp.
const coldRiverPath=[{h:10.25,r:5.05},{h:10.9,r:4.35},{h:11.55,r:4.08},{h:0.25,r:4.02},{h:1.05,r:4.06},{h:1.85,r:4.12},{h:2.5,r:4.28},{h:3.0,r:4.82},{h:3.35,r:5.55}];
const warmCreekPath=[{h:7.35,r:4.9},{h:7.0,r:4.02},{h:7.45,r:2.35},{h:8.0,r:1.7},{h:7.6,r:1.24},{h:7.05,r:1.66},{h:6.55,r:1.22},{h:6.05,r:1.78},{h:5.55,r:1.23},{h:5.05,r:1.77},{h:4.55,r:1.24},{h:4.05,r:1.74},{h:3.55,r:1.28},{h:3.08,r:1.8},{h:3.0,r:2.04},{h:3.0,r:4.0},{h:3.18,r:4.65},{h:3.5,r:5.52}];
const coldWhirlpools=[{h:10.85,r:4.38},{h:11.65,r:4.08},{h:0.35,r:4.03},{h:1.15,r:4.08},{h:2.0,r:4.15},{h:2.7,r:4.43}];
const coldBridges=[{h:0.75,r:4.05},{h:1.65,r:4.1}];
function pathPoint(pt){const th=(pt.h-3)*Math.PI/6,r=pt.r*RADIUS_UNIT;return{x:MAP_CENTER.x+Math.cos(th)*r,y:MAP_CENTER.y+Math.sin(th)*r};}
function smoothPathPoints(path,steps=6){const pts=path.map(pathPoint),out=[pts[0]]; for(let i=1;i<pts.length-1;i++){const a=out[out.length-1],c=pts[i],b={x:(pts[i].x+pts[i+1].x)/2,y:(pts[i].y+pts[i+1].y)/2}; for(let t=1;t<=steps;t++){const u=t/steps,m=1-u;out.push({x:m*m*a.x+2*m*u*c.x+u*u*b.x,y:m*m*a.y+2*m*u*c.y+u*u*b.y});}} out.push(pts[pts.length-1]); return out;}
function coldSnowflakePositions(){const pts=smoothPathPoints(coldRiverPath,5),out=[];for(let i=0;i<14;i++){const q=(state.t*0.085+i/14)%1,idx=Math.min(pts.length-2,Math.floor(q*(pts.length-1))),a=pts[idx],b=pts[idx+1],u=q*(pts.length-1)-idx,vx=b.x-a.x,vy=b.y-a.y,len=Math.hypot(vx,vy)||1,off=Math.sin(state.t*3+i*1.7)*34;out.push({x:a.x+(b.x-a.x)*u-vy/len*off,y:a.y+(b.y-a.y)*u+vx/len*off});}return out;}
function applyColdSnowflakes(o,dt,flakes=coldSnowflakePositions()){o.snowCooldown=Math.max(0,(o.snowCooldown||0)-dt);for(const f of flakes){if(Math.hypot(o.x-f.x,o.y-f.y)<30&&o.snowCooldown<=0){if(o===state.player&&(o.cloaks||0)>0){o.cloaks--;o.snowCooldown=0.75;dbg('[CLOAK] blocked ice');break;}o.hp=Math.max(0,o.hp-0.7);addStatus(o,'ice',0.65);o.snowCooldown=0.75;break;}}}
function waterPushAt(x,y){let best={d:Infinity,x:0,y:0,slow:1,damage:0,type:null}; for(const br of coldBridges){const b=pathPoint(br); const bd=Math.hypot(x-b.x,y-b.y); if(bd<95)return {d:bd,x:0,y:0,slow:1,damage:0,type:'bridge'};} for(const [path,type,width,force,slow,damage] of [[coldRiverPath,'cold',150,300,0.32,0.85],[warmCreekPath,'warm',70,55,0.72,0]]){const pts=smoothPathPoints(path,4);for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],vx=b.x-a.x,vy=b.y-a.y,len2=vx*vx+vy*vy,t=Math.max(0,Math.min(1,((x-a.x)*vx+(y-a.y)*vy)/len2)),px=a.x+vx*t,py=a.y+vy*t,d=Math.hypot(x-px,y-py); if(d<width&&d<best.d){const len=Math.sqrt(len2)||1,f=(1-d/width);best={d,x:vx/len*force*f,y:vy/len*force*f,slow:1-(1-slow)*f,damage:damage*f,type};}}} for(const wp of coldWhirlpools){const c=pathPoint(wp),dx=c.x-x,dy=c.y-y,d=Math.hypot(dx,dy); if(d<130){const f=1-d/130,ang=Math.atan2(dy,dx)+Math.PI/2;best={d,x:(dx/(d||1))*110*f+Math.cos(ang)*230*f,y:(dy/(d||1))*110*f+Math.sin(ang)*230*f,slow:0.28,damage:5.5*f,type:'whirlpool'};}} return best.d===Infinity?{x:0,y:0,slow:1,damage:0,type:null}:best;}
function riverPushAt(x,y){return waterPushAt(x,y);}

function collidesObstacle(x,y,{blockStumps=true}={}){for(const t of state.terrain){if(!t.solid)continue; if(t.stump&&!blockStumps)continue; const dx=t.x-x,dy=t.y-y; if(dx*dx+dy*dy<1156)return t;} return null;}
function collidesTree(x,y){return collidesObstacle(x,y);}
function repelFromObstacle(actor,radius=18){
  const obstacle=collidesObstacle(actor.x,actor.y,{blockStumps:false});
  if(!obstacle)return false;
  let dx=actor.x-obstacle.x,dy=actor.y-obstacle.y,d=Math.hypot(dx,dy);
  if(d<0.001){const a=Math.random()*Math.PI*2;dx=Math.cos(a);dy=Math.sin(a);d=1;}
  const obstacleRadius=Math.max(18,Math.min(34,(obstacle.size||24)*0.7)),min=radius+obstacleRadius,nx=dx/d,ny=dy/d;
  actor.x=obstacle.x+nx*min;actor.y=obstacle.y+ny*min;
  const inward=(actor.vx||0)*nx+(actor.vy||0)*ny;
  if(inward<0){actor.vx-=nx*inward*1.15;actor.vy-=ny*inward*1.15;}
  actor.vx=(actor.vx||0)+nx*24;actor.vy=(actor.vy||0)+ny*24;
  return true;
}
function dropRecoverable(pr){
  if(!pr.recoverable||pr.hit||pr.dropped)return;
  pr.dropped=true;
  state.pickups.push({x:pr.x,y:pr.y,ammo:pr.recoverable,glyph:pr.recoverable==='arrows'?'➶':'●',color:pr.recoverable==='pellets'?'#111':'#ddd'});
}
function collectPickups(){
  const p=state.player;
  state.pickups=state.pickups.filter(item=>{
    if(Math.hypot(item.x-p.x,item.y-p.y)>28)return true;
    state.ammo[item.ammo]=(state.ammo[item.ammo]||0)+1;dbg(`[RECOVER] +1 ${item.ammo}`);return false;
  });
}


function dbg(msg){ state.debug.push(msg); if(state.debug.length>28) state.debug.shift(); }

function feedbackNumber(value){
  const rounded=Math.round(Math.abs(value)*10)/10;return Number.isInteger(rounded)?String(rounded):rounded.toFixed(1);
}
function spawnSuitFeedback(x,y,suit,value,color,{negative=false,mergeKey=null,direction=-1}={}){
  if(!Number.isFinite(value)||value<=0)return;
  if(mergeKey){const existing=state.feedback.find(f=>f.mergeKey===mergeKey&&state.t-f.born<0.24);if(existing){existing.value+=value;existing.life=.95;existing.born=state.t;return;}}
  state.feedback.push({x,y,suit,value,color,negative,mergeKey,direction,born:state.t,life:.95,maxLife:.95,drift:(Math.random()-.5)*12});
}
function showEnemyDamage(enemy,amount){if(enemy.hp>0)spawnSuitFeedback(enemy.x,enemy.y-12,'♣',amount,'#f4f4f4');}
function showPlayerDamage(amount){spawnSuitFeedback(state.player.x,state.player.y-18,'♥',amount,'#ff5964',{negative:true,mergeKey:'playerDamage'});}
function updateHudFlashes(){
  const h=state.hudFlash;if(h.lastHp===null){h.lastHp=state.player.hp;h.lastDiamonds=state.diamonds;return;}
  if(Math.abs(state.player.hp-h.lastHp)>0.0001)h.hp=state.t+.55;
  if(state.diamonds!==h.lastDiamonds)h.diamonds=state.t+.55;
  h.lastHp=state.player.hp;h.lastDiamonds=state.diamonds;
}
function drawSuitFeedback(){
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  for(const f of state.feedback){const age=f.maxLife-f.life,p=projectWorld(f.x+f.drift*age,f.y+(f.direction??-1)*age*54),alpha=Math.max(0,Math.min(1,f.life/.35)),text=`${f.suit} ${f.negative?'-':''}${feedbackNumber(f.value)}`;ctx.globalAlpha=alpha;ctx.font='bold 18px serif';ctx.lineWidth=4;ctx.strokeStyle='#111';ctx.strokeText(text,p.x,p.y);ctx.fillStyle=f.color;ctx.fillText(text,p.x,p.y);}
  ctx.restore();
}

function enemyMotionProfile(e){
  const tier=Math.max(0,Math.min(5,Math.round((e.minR||0)/RADIUS_UNIT)));
  const ringTop=[112,166,192,388,426,458][tier];
  const profiles={
    orchard:{top:112,cruise:0.9,fast:520,slow:12,brake:820,turn:690},
    creek:{top:178,cruise:0.82,fast:760,slow:25,brake:900,turn:760,hop:true},
    pasture:{top:192,cruise:0.88,fast:760,slow:18,brake:980,turn:820},
    pawn:{top:188,cruise:0.9,fast:690,slow:14,brake:920,turn:760},
    crow:{top:276,cruise:0.84,fast:620,slow:12,brake:90,turn:185,flying:true},
    turkey:{top:138,cruise:.88,fast:390,slow:8,brake:520,turn:360},
    eagle:{top:334,cruise:0.82,fast:560,slow:11,brake:105,turn:170,flying:true},
    squirrel:{top:210,cruise:0.86,fast:820,slow:22,brake:1080,turn:940},
    turtle:{top:112,cruise:.9,fast:320,slow:8,brake:650,turn:480},
    deer:{top:360,cruise:.94,fast:185,slow:22,brake:740,turn:95},
    ram:{top:390,cruise:.94,fast:170,slow:24,brake:780,turn:88},
    goat:{top:410,cruise:.94,fast:180,slow:25,brake:820,turn:92},
    bull:{top:430,cruise:.95,fast:165,slow:25,brake:860,turn:78},
    moose:{top:445,cruise:.95,fast:155,slow:24,brake:880,turn:72},
    bear:{top:125,cruise:.88,fast:330,slow:8,brake:680,turn:430},
    polarBear:{top:132,cruise:.88,fast:340,slow:8,brake:690,turn:440},
    bat:{top:320,cruise:.84,fast:650,slow:12,brake:95,turn:195,flying:true},
    raccoon:{top:235,cruise:.88,fast:760,slow:18,brake:920,turn:820},
    rabbit:{top:248,cruise:0.84,fast:920,slow:24,brake:1180,turn:980},
    innDrunk:{top:445,cruise:0.9,fast:1180,slow:36,brake:1320,turn:1040},
    casinoDrunk:{top:460,cruise:0.88,fast:1220,slow:38,brake:1360,turn:1080},
    fireAnt:{top:205,cruise:.9,fast:760,slow:20,brake:980,turn:840},
    mushroom:{top:82,cruise:.82,fast:310,slow:8,brake:620,turn:520},
    fly:{top:315,cruise:.72,fast:1450,slow:70,brake:1180,turn:1550,flying:true},
    bee:{top:328,cruise:.74,fast:1480,slow:72,brake:1220,turn:1580,flying:true},
    mosquito:{top:338,cruise:.7,fast:1540,slow:76,brake:1250,turn:1640,flying:true},
    firefly:{top:324,cruise:.72,fast:1460,slow:70,brake:1190,turn:1570,flying:true},
    dragonfly:{top:365,cruise:.76,fast:1610,slow:80,brake:1320,turn:1710,flying:true},
    tanneryFly:{top:322,cruise:.7,fast:1500,slow:72,brake:1210,turn:1620,flying:true},
    horseFly:{top:348,cruise:.74,fast:1520,slow:75,brake:1260,turn:1600,flying:true},
    innRat:{top:225,cruise:.86,fast:900,slow:24,brake:1100,turn:980},casinoRat:{top:235,cruise:.86,fast:930,slow:25,brake:1120,turn:1000},
    innReveler:{top:238,cruise:.88,fast:850,slow:25,brake:1040,turn:930},casinoReveler:{top:248,cruise:.88,fast:880,slow:26,brake:1060,turn:950},
    farrierKnight:{top:410,cruise:.94,fast:175,slow:24,brake:840,turn:88},armorerKnight:{top:405,cruise:.94,fast:170,slow:23,brake:850,turn:84},donkey:{top:180,cruise:.85,fast:620,slow:16,brake:900,turn:700},
    boar:{top:365,cruise:.94,fast:190,slow:22,brake:780,turn:96},axeWolf:{top:225,cruise:.9,fast:760,slow:20,brake:980,turn:820},crab:{top:150,cruise:.86,fast:520,slow:14,brake:820,turn:700},creekFish:{top:245,cruise:.82,fast:850,slow:22,brake:980,turn:860,hop:true},
    snowyOwl:{top:330,cruise:.82,fast:610,slow:12,brake:100,turn:185,flying:true},iceFly:{top:330,cruise:.7,fast:1510,slow:74,brake:1240,turn:1620,flying:true},ghost:{top:286,cruise:.76,fast:1000,slow:40,brake:780,turn:1100,flying:true},
    muskOx:{top:126,cruise:.88,fast:340,slow:8,brake:700,turn:430},frostHare:{top:255,cruise:.84,fast:930,slow:25,brake:1190,turn:990},penguin:{top:185,cruise:.86,fast:650,slow:18,brake:900,turn:760},
    scorpion:{top:190,cruise:.86,fast:700,slow:18,brake:940,turn:820},desertSnake:{top:218,cruise:.88,fast:760,slow:20,brake:980,turn:850},vulture:{top:325,cruise:.82,fast:590,slow:12,brake:100,turn:180,flying:true},scarab:{top:240,cruise:.84,fast:900,slow:24,brake:1080,turn:960},
    salamander:{top:220,cruise:.88,fast:760,slow:20,brake:980,turn:840},volcanoGoat:{top:420,cruise:.94,fast:180,slow:25,brake:830,turn:90},fireDragonfly:{top:375,cruise:.76,fast:1640,slow:82,brake:1340,turn:1740,flying:true},volcanoDragon:{top:155,cruise:.86,fast:400,slow:10,brake:720,turn:470,flying:true},
    snowman:{top:180,cruise:.86,fast:620,slow:16,brake:900,turn:720},yeti:{top:140,cruise:.88,fast:360,slow:9,brake:720,turn:460},crocodile:{top:118,cruise:.88,fast:330,slow:8,brake:680,turn:420},zombie:{top:150,cruise:.9,fast:420,slow:10,brake:760,turn:520},
    skeletonMonk:{top:210,cruise:.9,fast:680,slow:18,brake:920,turn:760},bellSpirit:{top:235,cruise:.82,fast:860,slow:28,brake:820,turn:940,flying:true},furnaceGolem:{top:105,cruise:.9,fast:300,slow:7,brake:650,turn:390},imp:{top:290,cruise:.84,fast:1100,slow:42,brake:980,turn:1200},hauntedArmor:{top:120,cruise:.88,fast:330,slow:8,brake:690,turn:430},
  };
  const chosen=profiles[e.kind]||profiles[e.zone];
  return chosen||{top:ringTop,cruise:0.88,fast:ringTop*3.4,slow:ringTop*0.04,brake:ringTop*4.6,turn:ringTop*3.8};
}
function steerEnemy(e,dirX,dirY,top,profile,dt,accelMul=1){
  const len=Math.hypot(dirX,dirY)||1;dirX/=len;dirY/=len;
  const vx=e.vx||0,vy=e.vy||0,speed=Math.hypot(vx,vy),cruise=top*profile.cruise;
  const alignment=speed>0?(vx*dirX+vy*dirY)/speed:1;
  const needsBrake=speed>top*1.02,needsTurn=alignment<0.72;
  // Ground enemies plant their feet and shed momentum quickly. Flying enemies retain momentum and visibly overshoot.
  const control=needsTurn?(profile.turn||profile.fast):(needsBrake?(profile.brake||profile.fast):(speed<cruise?profile.fast:profile.slow));
  const targetX=dirX*top,targetY=dirY*top,dvx=targetX-vx,dvy=targetY-vy,delta=Math.hypot(dvx,dvy)||1,step=Math.min(delta,control*accelMul*dt);
  e.vx=vx+dvx/delta*step;e.vy=vy+dvy/delta*step;
}
function confineEnemyRadius(e,playerR){
  const home=zones.find(z=>z.id===e.zone);if(!home)return;
  // Enemies may pursue a player who has actually crossed outward, but cannot drift into a later ring on their own.
  const homeEdge=home.ring.max-20,allowedMax=playerR>=home.ring.max+20?Math.min(WORLD_MAX_R-20,Math.max(homeEdge,playerR+55)):homeEdge;
  const dx=e.x-MAP_CENTER.x,dy=e.y-MAP_CENTER.y,r=Math.hypot(dx,dy)||1;if(r<=allowedMax)return;
  const nx=dx/r,ny=dy/r;e.x=MAP_CENTER.x+nx*allowedMax;e.y=MAP_CENTER.y+ny*allowedMax;
  const outward=(e.vx||0)*nx+(e.vy||0)*ny;if(outward>0){const retention=enemyMotionProfile(e).flying?0.3:0.05;e.vx-=nx*outward*(1-retention);e.vy-=ny*outward*(1-retention);}
}

function fireEnemyProjectile(e){
  const p=state.player,dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
  let glyph=null,size=13,damage=0.7,knock=1.2,speed=220,vx=ux*speed,vy=uy*speed,life=2.4,color='#6b4525',element=null;
  if(e.kind==='squirrel'){glyph='🌰';size=14;damage=.65;knock=1.5;speed=230;e.shotT=2.1+Math.random()*1.8;}
  else if(e.kind==='innRat'){glyph=Math.random()<.5?'🍑':'🍆';size=15;damage=.55;knock=.8;speed=225;e.shotT=1.8+Math.random()*1.5;}
  else if(e.kind==='casinoRat'){glyph=Math.random()<.5?'♦':'🎲';size=15;damage=.6;knock=.8;speed=240;e.shotT=1.7+Math.random()*1.4;}
  else if(e.kind==='donkey'){glyph='∩';size=21;damage=1.2;knock=2.8;speed=285;e.shotT=2.2+Math.random()*1.6;}
  else if(e.kind==='scarab'){glyph='●';size=9;damage=.75;knock=1.5;speed=245;color='#69401f';e.shotT=1.6+Math.random()*1.3;}
  else if(e.kind==='fireDragonfly'){glyph='🔥';size=15;damage=1.1;knock=.7;speed=300;element='fire';e.shotT=1.35+Math.random()*1.1;}
  else if(e.kind==='volcanoDragon'){glyph='🔥';size=24;damage=2.8;knock=3.2;speed=335;element='fire';e.shotT=.9+Math.random()*.8;}
  else if(e.kind==='snowman'){glyph='❄️';size=17;damage=1;knock=1.1;speed=255;element='ice';e.shotT=1.25+Math.random()*1.2;}
  else if(e.kind==='snowyOwl'){glyph='❄️';size=13;damage=.75;knock=.5;vx=(e.vx||0)*.72+ux*120;vy=(e.vy||0)*.72+uy*120;element='ice';e.shotT=1.8+Math.random()*1.8;}
  else if(e.kind==='marchBishop'){glyph='✦';size=15;damage=1.35;knock=.8;speed=290;e.shotT=1.6+Math.random()*1.2;}
  else if(['smithPawn','farrierPawn','armorerPawn'].includes(e.kind)&&e.weapon==='🏹'){glyph='➶';size=17;damage=1.15;knock=.7;speed=315;e.shotT=1.8+Math.random()*1.2;}
  else if(e.kind==='bellSpirit'){glyph='◯';size=20;damage=1.2;knock=3.4;speed=235;color='#e6d292';e.shotT=1.7+Math.random()*1.2;}
  else if(e.kind==='imp'){glyph='🔥';size=15;damage=1.25;knock=.8;speed=295;element='fire';e.shotT=1.3+Math.random()*1.1;}
  else if(['crow','turkey','eagle','bat','vulture'].includes(e.kind)){glyph='●';size=8;color=e.kind==='bat'?'#d7d0c8':'#fff';damage=e.kind==='eagle'?1.25:.65;knock=.6;vx=(e.vx||0)*.82+ux*105;vy=(e.vy||0)*.82+uy*105;e.shotT=1.8+Math.random()*2.4;}
  else {e.shotT=2+Math.random()*2;return;}
  if(!['snowyOwl','crow','turkey','eagle','bat','vulture'].includes(e.kind)){vx=ux*speed;vy=uy*speed;}
  state.projectiles.push({x:e.x+ux*18,y:e.y+uy*18,vx,vy,life,glyph,size,damage,knock,pierce:1,damageMult:1,angle:Math.atan2(vy,vx),speed:Math.hypot(vx,vy),source:`enemy ${e.kind}`,hostile:true,color,element});
}

function brakeEnemy(e,profile,dt,mult=2.4){
  const speed=Math.hypot(e.vx||0,e.vy||0);if(speed<=0){e.vx=0;e.vy=0;return;}
  const next=Math.max(0,speed-(profile.brake||profile.fast)*mult*dt),scale=next/speed;e.vx*=scale;e.vy*=scale;
}
function updateAntTrail(e){
  e.trail=e.trail||[];const last=e.trail[e.trail.length-1];if(!last||Math.hypot(e.x-last.x,e.y-last.y)>7){e.trail.push({x:e.x,y:e.y});if(e.trail.length>36)e.trail.shift();}
}
function antFollowDirection(e,fallbackX,fallbackY){
  if(!e.followId)return{x:fallbackX,y:fallbackY,leader:true};
  const leader=state.enemies.find(o=>o.id===e.followId&&o.hp>0);
  if(!leader){e.followId=null;return{x:fallbackX,y:fallbackY,leader:true};}
  const trail=leader.trail||[],target=trail[0]||leader,dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy)||1;
  if(trail.length&&d<10)trail.shift();
  return{x:dx/d,y:dy/d,leader:false};
}
function releaseMushroomSpores(e,count=4){
  if((e.sporeCooldown||0)>0)return;e.sporeCooldown=2.6;
  const p=state.player,base=Math.atan2(p.y-e.y,p.x-e.x);
  for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*.42+(Math.random()-.5)*.18,speed=72+Math.random()*24;state.projectiles.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:4.8,glyph:'●',size:8,damage:.08,knock:.15,pierce:0,damageMult:1,angle:a,speed,source:'mushroom spore',hostile:true,element:'poison',spore:true,sporeZone:e.zone,spiral:(Math.random()<.5?-1:1)*(.65+Math.random()*.35),color:'#a6d56c'});}
  dbg(`[SPORES] ${e.zone} mushroom released ${count}`);
}
function plantMushroom(x,y,zoneId,onTree=false){
  const zone=zones.find(z=>z.id===zoneId)||getZone(x,y);if(!zone||!['marsh','swamp','sawmill'].includes(zone.id))return;
  if(state.enemies.filter(e=>e.kind==='mushroom'&&e.zone===zone.id).length>=12)return;
  const wave=state.waves[zone.id]?.wave||1,radTier=zone.ring.min/RADIUS_UNIT,baseHp=5*Math.pow(1.65,radTier)*(1+wave*.08)*.55;
  state.enemies.push({id:state.nextEnemyId++,x,y:y-(onTree?8:0),hp:baseHp,maxHp:baseHp,status:{},glyph:'🍄',kind:'mushroom',archetype:'mushroom',knockResist:.85,zone:zone.id,wave,minR:zone.ring.min,vx:0,vy:0,bountyMultiplier:1,propagated:true,power:.45*Math.pow(2.15,radTier),growT:2.5,sporeCooldown:1.4});
}
function scheduleFungusRecovery(zoneId){
  const wave=state.waves[zoneId];if(!wave||wave.fungusRecovered||state.fungusRespawns[zoneId])return;
  wave.fungusRecovered=true;state.fungusRespawns[zoneId]=5.5;
}
function updateFungusRecovery(dt){
  for(const [zoneId,time] of Object.entries(state.fungusRespawns)){const next=time-dt;if(next>0){state.fungusRespawns[zoneId]=next;continue;}delete state.fungusRespawns[zoneId];const zone=zones.find(z=>z.id===zoneId);if(zone){const pt=randomPointInZone(zone);plantMushroom(pt.x,pt.y,zoneId);dbg(`[FUNGUS] a baby mushroom regrew in ${zone.name}`);}}
}
function flyOrbitDirection(e,target,dt){
  if(e.flyCx===undefined){e.flyCx=e.x;e.flyCy=e.y;e.flyPhase=((e.id||1)*2.399)%(Math.PI*2);e.flyPhase2=((e.id||1)*4.117)%(Math.PI*2);e.flyPhase3=((e.id||1)*1.733)%(Math.PI*2);e.flySpin=(e.id||1)%2?1:-1;}
  const toTargetX=target.x-e.flyCx,toTargetY=target.y-e.flyCy,targetDistance=Math.hypot(toTargetX,toTargetY)||1,anchorSpeed=48+(e.kind==='dragonfly'?16:0),anchorStep=Math.min(targetDistance,anchorSpeed*dt);
  e.flyCx+=toTargetX/targetDistance*anchorStep;e.flyCy+=toTargetY/targetDistance*anchorStep;
  const chaos=Math.sin(state.t*2.7+(e.id||0))*1.25;e.flyPhase+=e.flySpin*(4.6+chaos)*dt;e.flyPhase2-=e.flySpin*(10.8+Math.sin(state.t*4.3+(e.id||0))*2.1)*dt;e.flyPhase3+=e.flySpin*17.5*dt;
  const major=47+11*Math.sin(e.flyPhase2*.37),minor=18+5*Math.sin(e.flyPhase3*.41),micro=7;
  const desiredX=e.flyCx+Math.cos(e.flyPhase)*major+Math.cos(e.flyPhase2)*minor+Math.cos(e.flyPhase3)*micro,desiredY=e.flyCy+Math.sin(e.flyPhase)*major+Math.sin(e.flyPhase2)*minor+Math.sin(e.flyPhase3)*micro,dx=desiredX-e.x,dy=desiredY-e.y,d=Math.hypot(dx,dy)||1;
  return{x:dx/d,y:dy/d,distance:d,desiredX,desiredY};
}
function update(dt){const p=state.player;state.feedback=state.feedback.filter(f=>(f.life-=dt)>0); let dx=(state.keys.has('d')?1:0)-(state.keys.has('a')?1:0),dy=(state.keys.has('s')?1:0)-(state.keys.has('w')?1:0); const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;
  const zone=getZone(p.x,p.y), flow=riverPushAt(p.x,p.y), snowflakes=coldSnowflakePositions(); state.lastWater=flow.type?`${flow.type} d=${flow.d.toFixed(0)} push=${Math.hypot(flow.x,flow.y).toFixed(0)}`:'dry'; if(flow.damage)p.hp=Math.max(0,p.hp-flow.damage*dt); tickStatus(p,dt,true); applyEnvironmentalHazards(p,dt); applyColdSnowflakes(p,dt,snowflakes); if(state.pendingReward&&zone?.id!==state.pendingReward.zone){dbg(`[SHOP] left ${state.pendingReward.zone}; dialogue closed; next wave queued`);queueNextWaveFromReward('LEAVE',true);} if(zone?.id!==state.currentZone){state.currentZone=zone?.id||null; if(zone)dbg(`[ZONE] entered ${zone.name} wave=${state.waves[zone.id]?.wave||1} spawned=${!!state.waves[zone.id]?.spawned}`);} const horseEq=state.mount==='horse'&&p.unlocked.has('horse')&&!['cannon','ballista'].includes(p.weapon); const horse=metaFor('horse'); const foot=metaFor('foot'); const speed=horseEq?2.25*(1+horse.speed*0.1):1*(1+(foot.speed||0)*0.1),accel=horseEq?4.8*(1+horse.accel*0.1):7.5*(1+(foot.accel||0)*0.1);
  const baseSpeed = (12 * RADIUS_UNIT) / 60; // 12 radii per minute
  const outx=(p.x-MAP_CENTER.x)/(Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y)||1),outy=(p.y-MAP_CENTER.y)/(Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y)||1),radial=dx*outx+dy*outy,ringProgress=zone?Math.max(0,Math.min(1,(Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y)-zone.ring.min)/(zone.ring.max-zone.ring.min))):0,frontier=Math.max(0,(ringProgress-0.68)/0.32),liveEnemies=zone?state.enemies.filter(e=>e.zone===zone.id&&e.hp>0):[],blockers=liveEnemies.filter(e=>{const er=Math.hypot(e.x-MAP_CENTER.x,e.y-MAP_CENTER.y),pr=Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y);return er>pr;}).length,pressure=Math.min(1,blockers/Math.max(2,liveEnemies.length*0.55)),radialMove=radial>0?Math.max(0.7,0.95-0.25*frontier*pressure):radial<0?1.05:1,groundSlow=zone?.id==='marsh'?(horseEq?0.32:0.52):1; const tvx=dx*baseSpeed*speed*flow.slow*groundSlow*radialMove,tvy=dy*baseSpeed*speed*flow.slow*groundSlow*radialMove; p.vx+=(tvx-p.vx)*Math.min(1,accel*dt); p.vy+=(tvy-p.vy)*Math.min(1,accel*dt);
  const nx=p.x+(p.vx+flow.x)*dt, ny=p.y+(p.vy+flow.y)*dt; const block=collidesObstacle(nx,ny),nextZone=getZone(nx,ny); if(block||!nextZone){if(block?.stump){p.vx*=0.35;p.vy*=0.35;p.x=nx;p.y=ny;}else{p.vx*=0.2;p.vy*=0.2;}} else {p.x=nx;p.y=ny;}
  repelFromObstacle(p,horseEq?27:18); collectPickups();
  const rr=Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y); if(rr>WORLD_MAX_R-20){const s=(WORLD_MAX_R-20)/rr;p.x=MAP_CENTER.x+(p.x-MAP_CENTER.x)*s;p.y=MAP_CENTER.y+(p.y-MAP_CENTER.y)*s;p.vx=0;p.vy=0;}
  state.camera.x+=(p.x-state.camera.x)*0.1; state.camera.y+=(p.y-state.camera.y)*0.1;
  p.attackCooldown=Math.max(0,(p.attackCooldown||0)-dt); if(state.mouse.down&&p.attackCooldown<=0)state.mouse.held+=dt; p.cannonCooldown=Math.max(0,(p.cannonCooldown||0)-dt); if(['bow','ballista','cannon'].includes(p.weapon))p.shield=false; if(['ballista','cannon'].includes(p.weapon))state.mount='foot';
  if(zone&&!state.pendingReward&&!state.waves[zone.id].spawned&&!state.waves[zone.id].cleared&&!state.enemies.some(e=>e.zone===zone.id&&e.hp>0))spawnWave(zone);
  if(state.mouse.down&&state.mouse.queuedAttack&&p.attackCooldown<=0&&!isChargeWeapon(weaponDef()))beginMeleeSwing(); if(p.swing>0){p.swing-=dt*3*effectiveWeapon(weaponDef()).swingSpeedMult;doSwingDamage();} passiveMeleeContact(dt);
  for(const pr of state.projectiles){
    if(pr.spore){const tx=p.x-pr.x,ty=p.y-pr.y,d=Math.hypot(tx,ty)||1,speed=Math.hypot(pr.vx,pr.vy)||1,turn=pr.spiral*dt,ux=tx/d,uy=ty/d,sideX=-uy,sideY=ux;pr.vx+=(ux*.32+sideX*.68)*speed*turn;pr.vy+=(uy*.32+sideY*.68)*speed*turn;}
    pr.vx*=Math.max(0,1-dt*(pr.spore?.18:.45));pr.vy*=Math.max(0,1-dt*(pr.spore?.18:.45));pr.speed=Math.hypot(pr.vx,pr.vy);if(pr.spin)pr.rotation=(pr.rotation||0)+pr.spin*dt;
    const nx=pr.x+pr.vx*dt,ny=pr.y+pr.vy*dt,obstacle=collidesObstacle(nx,ny,{blockStumps:false});
    if(obstacle&&!pr.overStump){if(pr.spore){const treeZone=getZone(obstacle.x,obstacle.y),plantZone=treeZone?.id==='sawmill'?'sawmill':pr.sporeZone;plantMushroom(obstacle.x,obstacle.y,plantZone,true);pr.planted=true;}else{if(pr.shards)spawnShards(pr);dropRecoverable(pr);}pr.life=0;continue;}
    pr.x=nx;pr.y=ny;pr.life-=dt;
    if(pr.life<=0){if(pr.spore&&!pr.hit&&!pr.planted){plantMushroom(pr.x,pr.y,pr.sporeZone);pr.planted=true;}if(pr.shards){spawnShards(pr);pr.shards=false;}dropRecoverable(pr);}
  }
  state.projectiles=state.projectiles.filter(pr=>pr.life>0);updateFungusRecovery(dt);
  for(const e of state.enemies){
    tickStatus(e,dt,false);e.contactEffectCooldown=Math.max(0,(e.contactEffectCooldown||0)-dt);applyEnvironmentalHazards(e,dt);applyColdSnowflakes(e,dt,snowflakes);
    const oldX=e.x,oldY=e.y;let target=p,targetDistance=Math.hypot(p.x-e.x,p.y-e.y);for(const item of state.deployables){if(item.type!=='decoy'||item.used)continue;const dd=Math.hypot(item.x-e.x,item.y-e.y);if(dd<targetDistance){target=item;targetDistance=dd;}}let ax=target.x-e.x,ay=target.y-e.y,d=Math.hypot(ax,ay)||1;const profile=enemyMotionProfile(e),ep=projectWorld(e.x,e.y),off=ep.x<-40||ep.x>innerWidth+40||ep.y<-40||ep.y>innerHeight+40;
    let dirX=ax/d,dirY=ay/d,top=profile.top,accelMul=off?1.55:1; e.shotT=(e.shotT||0)-dt;if(e.shotT<=0)fireEnemyProjectile(e);
    const playerR=Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y);
    if(e.minR&&playerR<e.minR-20){
      e.wanderT=(e.wanderT||0)-dt;
      if(e.wanderT<=0||!e.wx){const wz=zones.find(z=>z.id===e.zone),pt=randomPointInZone(wz);e.wx=pt.x;e.wy=pt.y;e.wanderT=1.2+Math.random()*2.4;}
      const wx=e.wx-e.x,wy=e.wy-e.y,wd=Math.hypot(wx,wy)||1;dirX=wx/wd;dirY=wy/wd;top*=0.72;
    } else if(e.archetype==='fly'){
      const orbit=flyOrbitDirection(e,target,dt);dirX=orbit.x;dirY=orbit.y;top=profile.top*(orbit.distance<14 ? .62 : 1);accelMul*=1.18;
    } else if(e.archetype==='fireAnt'){
      const follow=antFollowDirection(e,dirX,dirY);dirX=follow.x;dirY=follow.y;top=follow.leader?profile.top:profile.top*1.08;
    } else if(e.archetype==='mushroom'){
      e.growT=Math.max(0,(e.growT||0)-dt);e.sporeCooldown=Math.max(0,(e.sporeCooldown||0)-dt);
      const playerMovingAway=(p.vx*(p.x-e.x)+p.vy*(p.y-e.y))>45*d,playerApproaching=(p.vx*(e.x-p.x)+p.vy*(e.y-p.y))>40*d;
      if(e.growT<=0&&((playerApproaching&&d<230)||(e.hitT&&e.hitT>(e.lastSporeHit||-1)))){releaseMushroomSpores(e);e.lastSporeHit=e.hitT||state.t;}
      if(playerMovingAway&&e.growT<=0){top=profile.top;}else{top=0;dirX=0;dirY=0;}
    } else if(e.archetype==='tank'){
      e.behaviorT=(e.behaviorT||0)-dt;e.dashCooldown=Math.max(0,(e.dashCooldown||0)-dt);
      if(e.beh==='dash'){dirX=e.dashX;dirY=e.dashY;top=390;if(e.behaviorT<=0){e.beh='stalk';e.dashCooldown=2.2;}}
      else if(d<122&&e.dashCooldown<=0){e.beh='dash';e.behaviorT=.34;e.dashX=ax/d;e.dashY=ay/d;dirX=e.dashX;dirY=e.dashY;top=390;}
      else top=profile.top;
    } else if(e.archetype==='charger'){
      e.behaviorT=(e.behaviorT||0)-dt;if(!e.beh)e.beh='aim';
      if(e.beh==='charge'){
        dirX=e.chargeX;dirY=e.chargeY;top=profile.top;
        const velocity=Math.hypot(e.vx||0,e.vy||0),headingX=velocity>1?e.vx/velocity:e.chargeX,headingY=velocity>1?e.vy/velocity:e.chargeY,playerOffForward=headingX*(ax/d)+headingY*(ay/d);
        if(velocity>90&&playerOffForward<0){e.beh='recover';e.behaviorT=.62;}
      }else if(e.beh==='recover'){
        top=0;e.hardBrake=true;if(e.behaviorT<=0&&Math.hypot(e.vx||0,e.vy||0)<28){e.beh='aim';e.behaviorT=.32;e.hardBrake=false;}
      }else{
        dirX=ax/d;dirY=ay/d;top=Math.min(105,profile.top*.28);
        if(e.behaviorT<=0){e.beh='charge';e.chargeX=ax/d;e.chargeY=ay/d;dirX=e.chargeX;dirY=e.chargeY;top=profile.top;}
      }
    } else if(e.archetype==='thief'){
      const home=zones.find(z=>z.id===e.zone),ex=e.x-MAP_CENTER.x,ey=e.y-MAP_CENTER.y,er=Math.hypot(ex,ey)||1,rx=ex/er,ry=ey/er;
      if(e.fleeing){
        if(e.fleeRadius===undefined)e.fleeRadius=(er-home.ring.min)<(home.ring.max-er)?home.ring.min+28:home.ring.max-28;
        const outward=e.fleeRadius>er?1:-1;dirX=rx*outward;dirY=ry*outward;top=315;
        if(Math.abs(er-e.fleeRadius)<34){e.fleeing=false;e.fleeRadius=undefined;e.stealCooldown=state.t+1.4;e.behaviorT=.7;}
      }else{
        const face=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),fx=Math.cos(face),fy=Math.sin(face),side=((fx*ay-fy*ax)>0?1:-1),lateralX=-dirY*side,lateralY=dirX*side;
        dirX=dirX*.62+lateralX*.78;dirY=dirY*.62+lateralY*.78;top=profile.top;
      }
    } else if(e.archetype==='reveler'){
      const beat=Math.floor(state.t*2.4)%4,side=(e.id||0)%2?1:-1,lateralX=-dirY*side,lateralY=dirX*side;
      if(beat===0){dirX=dirX*.72+lateralX*.7;dirY=dirY*.72+lateralY*.7;}else if(beat===1){dirX=lateralX;dirY=lateralY;}else if(beat===2){dirX=dirX*.8-lateralX*.55;dirY=dirY*.8-lateralY*.55;}else{dirX=-lateralX;dirY=-lateralY;}top=profile.top;
    } else if(e.kind==='innDrunk'||e.kind==='casinoDrunk'){
      const lateralX=-dirY,lateralY=dirX,sway=Math.sin(state.t*7+(e.x+e.y)*0.002)*0.52;dirX+=lateralX*sway;dirY+=lateralY*sway;top=profile.top;
    } else if(e.kind==='rabbit'){
      if(d<125){dirX=-dirX;dirY=-dirY;}top=profile.top;
    } else if(e.zone==='pasture'){
      const wolves=state.enemies.filter(o=>o.zone==='pasture'&&o.kind!=='rabbit'),movingAway=(p.vx*ax+p.vy*ay)>80*d;
      e.lunge=(e.lunge||0)-dt;e.spreadT=(e.spreadT||0)-dt;
      if((movingAway||d<125)&&e.lunge<=0&&state.t-(e.hitT||-99)>3){e.beh='strike';e.behT=0.42;e.lunge=5;}
      if(e.beh==='strike'){top=286;e.behT-=dt;if(e.behT<=0)e.beh='creep';}
      else {
        if(e.spreadT<=0||e.spreadSide===undefined){const myAng=Math.atan2(e.y-p.y,e.x-p.x);let near=null,nearDiff=Infinity;for(const o of wolves){if(o===e)continue;const oa=Math.atan2(o.y-p.y,o.x-p.x),diff=Math.atan2(Math.sin(oa-myAng),Math.cos(oa-myAng)),ad=Math.abs(diff);if(ad<nearDiff){nearDiff=ad;near=diff;}}e.spreadSide=near===null?(Math.random()<0.5?-1:1):(near>0?-1:1);e.spreadT=1+Math.random()*1.2;}
        const myAng=Math.atan2(e.y-p.y,e.x-p.x),tx=-Math.sin(myAng)*e.spreadSide,ty=Math.cos(myAng)*e.spreadSide,approach=movingAway?0.72:0.38;dirX=tx*0.62+(ax/d)*approach;dirY=ty*0.62+(ay/d)*approach;top=movingAway?224:204;
      }
    }
    if((e.stun||0)>0){e.stun-=dt;dirX=0;dirY=0;top=0;}
    if((e.avoidT||0)>0){e.avoidT-=dt;dirX=e.avoidX;dirY=e.avoidY;top*=0.88;}
    const er=Math.hypot(e.x-MAP_CENTER.x,e.y-MAP_CENTER.y)||1,radialDot=dirX*(e.x-MAP_CENTER.x)/er+dirY*(e.y-MAP_CENTER.y)/er;
    top*=radialDot>0?1.1:radialDot<0?0.9:1;
    if(getZone(e.x,e.y)?.id==='marsh')top*=0.7;
    const iceMul=e.status?.ice>0?Math.max(0.15,1-0.35*(1+(metaFor('ice').slow||0)*0.1)):1;top*=iceMul;
    if((e.knockbackT||0)>0){
      e.knockbackT=Math.max(0,e.knockbackT-dt);const drag=Math.pow(0.975,dt*60);e.vx=(e.vx||0)*drag;e.vy=(e.vy||0)*drag;
    } else if(profile.hop){
      e.hop=(e.hop||0)-dt;e.vx=(e.vx||0)*Math.pow(0.987,dt*60);e.vy=(e.vy||0)*Math.pow(0.987,dt*60);
      if(e.hop<=0){const frogs=state.enemies.filter(o=>o!==e&&o.zone==='creek');let nearest=null,nd=Infinity;for(const o of frogs){const od=Math.hypot(o.x-e.x,o.y-e.y);if(od<nd){nd=od;nearest=o;}}if(nearest&&Math.random()<0.4){dirX=(e.x-nearest.x)/(nd||1);dirY=(e.y-nearest.y)/(nd||1);}const dl=Math.hypot(dirX,dirY)||1;e.vx=dirX/dl*top;e.vy=dirY/dl*top;e.hop=0.34+Math.random()*0.42;}
    } else if(e.hardBrake){brakeEnemy(e,profile,dt,2.8);} else steerEnemy(e,dirX,dirY,top,profile,dt,accelMul);
    const ef=waterPushAt(e.x,e.y),nx=e.x+(e.vx+ef.x)*dt,ny=e.y+(e.vy+ef.y)*dt,obstacle=collidesObstacle(nx,ny,{blockStumps:false});
    if(obstacle){const side=e.avoidSide||(e.avoidSide=Math.random()<0.5?-1:1),heading=Math.atan2(e.vy||dirY,e.vx||dirX)+side*Math.PI/2;e.avoidX=Math.cos(heading);e.avoidY=Math.sin(heading);e.avoidT=0.65+Math.random()*0.45;e.vx=e.avoidX*profile.top*0.45;e.vy=e.avoidY*profile.top*0.45;}else{e.x=nx;e.y=ny;}
    const moved=Math.hypot(e.x-oldX,e.y-oldY);e.stuckTime=moved<0.35?(e.stuckTime||0)+dt:0;if(e.stuckTime>0.45){const side=e.avoidSide||(Math.random()<0.5?-1:1),heading=Math.atan2(dirY,dirX)+side*Math.PI/2;e.avoidX=Math.cos(heading);e.avoidY=Math.sin(heading);e.avoidT=0.9;e.stuckTime=0;e.x+=e.avoidX*8;e.y+=e.avoidY*8;}
    if(e.kind==='fireAnt')updateAntTrail(e);
    if(ef.damage)e.hp-=ef.damage*dt*0.35;
    const finalR=Math.hypot(e.x-MAP_CENTER.x,e.y-MAP_CENTER.y);if(e.minR&&finalR<e.minR){const sc=e.minR/Math.max(1,finalR);e.x=MAP_CENTER.x+(e.x-MAP_CENTER.x)*sc;e.y=MAP_CENTER.y+(e.y-MAP_CENTER.y)*sc;e.vx*=0.3;e.vy*=0.3;}
    for(const item of state.deployables){if(item.used)continue;const contact=Math.hypot(e.x-item.x,e.y-item.y);if(item.type==='caltrop'&&contact<22){e.hp-=2.5;showEnemyDamage(e,2.5);e.vx=0;e.vy=0;e.stun=0.35;item.used=true;dbg(`[CALTROP] ${e.glyph} took 2.5 damage and lost momentum`);}else if(item.type==='decoy'&&contact<25){e.vx*=0.15;e.vy*=0.15;item.used=true;dbg(`[DECOY] ${e.glyph} knocked over the armor stand`);}}
    repelFromObstacle(e,16); confineEnemyRadius(e,playerR);
    if(e.zone==='creek'&&getZone(e.x,e.y)?.id!=='creek'){const cz=zones.find(z=>z.id==='creek'),pt=randomPointInZone(cz);e.x=pt.x;e.y=pt.y;e.vx=0;e.vy=0;}
  } state.deployables=state.deployables.filter(item=>!item.used); resolveEnemySpacing(dt); hitChecks(); if(p.hp<=0){resurrect();return;}
  if(zone&&!state.pendingReward&&!state.fungusRespawns[zone.id]&&!state.enemies.some(e=>e.zone===zone.id&&e.hp>0))completeWave(zone); }

function applyHit(target, weapon, scale=1){
  const before=target.hp,knock=weapon.knock*scale,pierce=weapon.pierce*scale;
  if(target.type==='tree' && !target.stump){target.hp -= (knock*pierce)*0.08;}
  else if(target.type==='wall' && !target.stump){target.hp -= knock*0.12;}
  const structuralDamage=Math.max(0,before-Math.max(0,target.hp));if(structuralDamage>0)spawnSuitFeedback(target.x,target.y-10,'♠',structuralDamage,'#aab8c8');
  if(target.hp<=0 && !target.stump){target.stump=true;target.solid=true;target.type='stump';target.glyph='◼';}
  return structuralDamage;
}

function knockEnemy(e,angle,impulse){
  impulse*=e.knockResist??1;
  const nx=Math.cos(angle),ny=Math.sin(angle),kick=Math.min(14,impulse*0.045);
  e.vx=(e.vx||0)+nx*impulse;e.vy=(e.vy||0)+ny*impulse;e.x+=nx*kick;e.y+=ny*kick;
  e.knockbackT=Math.max(e.knockbackT||0,Math.min(0.42,0.1+impulse/620));
}
function passiveMeleeContact(dt){const p=state.player,w=effectiveWeapon(weaponDef());if(w.kind!=='swing')return; const a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),sx=p.x+Math.cos(a)*w.reach*0.75,sy=p.y+Math.sin(a)*w.reach*0.75; for(const e of state.enemies){const rel=Math.hypot((p.vx||0)-(e.vx||0),(p.vy||0)-(e.vy||0)); if(rel>35&&Math.hypot(e.x-sx,e.y-sy)<38&&state.t>(e.meleeTouch||0)){const spMul=Math.min(2.6,rel/150),dmg=w.damage*0.45*spMul*w.damageMult,kb=w.knock*spMul*14,ang=Math.atan2(e.y-p.y,e.x-p.x); e.hp-=dmg;showEnemyDamage(e,dmg);e.hitT=state.t;e.lunge=5;knockEnemy(e,ang,kb);e.meleeTouch=state.t+0.32;dbg(`[TOUCH:${w.id}] dmg=${dmg.toFixed(2)} rel=${rel.toFixed(1)} hp=${e.hp.toFixed(2)}`);}}}

function doSwingDamage(){const p=state.player,w=effectiveWeapon(weaponDef());if(w.kind!=='swing')return; const a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2); const sx=p.x+Math.cos(a)*w.reach,sy=p.y+Math.sin(a)*w.reach;
 const swingSpeed = Math.hypot(state.player.vx,state.player.vy) + Math.hypot(state.mouse.x-innerWidth/2,state.mouse.y-innerHeight/2)*0.002;
 for(const e of state.enemies){if(e.swingHit!==p.swingSerial&&Math.hypot(e.x-sx,e.y-sy)<45){e.swingHit=p.swingSerial;const spMul=(1+Math.min(2,swingSpeed/220))*w.swingSpeedMult; const dmg=w.damage*spMul*w.damageMult; e.hp-=dmg;showEnemyDamage(e,dmg); e.hitT=state.t;e.lunge=5; if(p.swingElement)addStatus(e,p.swingElement,1); const kb=w.knock*spMul*18; knockEnemy(e,a,kb); dbg(`[SWING:${w.id}] -> enemy ${e.glyph} dmg=${dmg.toFixed(2)} kb=${kb.toFixed(1)} hp=${e.hp.toFixed(2)} ang=${a.toFixed(2)}`);}}
 for(const t of state.terrain){if(t.swingHit!==p.swingSerial&&Math.hypot(t.x-sx,t.y-sy)<45){t.swingHit=p.swingSerial;applyHit(t,w,1);}} }


function deflectProjectile(pr, tx, ty, slow=0.78, turn=0.35){
  const sp=Math.hypot(pr.vx,pr.vy)||1, ux=pr.vx/sp, uy=pr.vy/sp, dx=pr.x-tx, dy=pr.y-ty, d=Math.hypot(dx,dy)||1;
  let nx=dx/d, ny=dy/d, vx=ux*(1-turn)+nx*turn, vy=uy*(1-turn)+ny*turn;
  const nd=Math.hypot(vx,vy)||1; vx/=nd; vy/=nd;
  pr.vx=vx*sp*slow; pr.vy=vy*sp*slow; pr.speed=Math.hypot(pr.vx,pr.vy); pr.angle=Math.atan2(pr.vy,pr.vx);
  pr.x+=vx*24; pr.y+=vy*24;
}

function hitChecks(){
  const player=state.player;
  for(const pr of state.projectiles){
    if(pr.life<=0)continue;
    if(pr.hostile){
      if(Math.hypot(player.x-pr.x,player.y-pr.y)<22){
        const spMul=1+Math.min(1.5,pr.speed/420);let dmg=pr.damage*spMul*(pr.damageMult||1);
        if(player.shield){const sh=metaFor('shield'),chance=Math.min(.75,.3+(sh.blockChance||0)*.05),block=Math.min(.8,.3+(sh.blockAmount||0)*.05);if(Math.random()<chance)dmg*=1-block;}
        const hpBefore=player.hp;player.hp=Math.max(0,player.hp-dmg);showPlayerDamage(hpBefore-player.hp);const a=Math.atan2(pr.vy,pr.vx),impulse=pr.knock*spMul*8;player.vx+=Math.cos(a)*impulse;player.vy+=Math.sin(a)*impulse;if(pr.element)addStatus(player,pr.element,pr.spore?0.18:1);pr.hit=true;pr.life=0;dbg(`[ENEMY SHOT] ${pr.source} dmg=${dmg.toFixed(2)} hp=${player.hp.toFixed(2)}`);
      }
      continue;
    }
    for(const e of state.enemies){
      if(e===pr.ignore||pr.life<=0)continue;
      if(Math.hypot(e.x-pr.x,e.y-pr.y)<22){
        const spMul=1+Math.min(3,pr.speed/320),cannon=pr.source==='cannon',dmg=pr.damage*spMul*(pr.damageMult||1);
        e.hp-=dmg;showEnemyDamage(e,dmg);e.hitT=state.t;e.lunge=5;if(pr.element)addStatus(e,pr.element,1);
        const kb=pr.knock*spMul*(cannon?10:6),aa=Math.atan2(pr.vy,pr.vx);knockEnemy(e,aa,kb);pr.hit=true;
        dbg(`[HIT] ${pr.source||'proj'} -> enemy ${e.glyph} dmg=${dmg.toFixed(2)} kb=${kb.toFixed(1)} hp=${e.hp.toFixed(2)} ang=${pr.angle.toFixed(2)} spd=${pr.speed.toFixed(1)}`);
        if(pr.shards){spawnShards(pr,e);pr.shards=false;}
        if(cannon&&pr.pierces>0){pr.pierces--;deflectProjectile(pr,e.x,e.y,0.76,0.32);dbg(`[CANNON] deflect ang=${pr.angle.toFixed(2)} spd=${pr.speed.toFixed(1)} pierces=${pr.pierces}`);}else pr.life=0;
      }
    }
    for(const t of state.terrain){
      if(!t.solid||pr.life<=0)continue;
      if(Math.hypot(t.x-pr.x,t.y-pr.y)<22){
        applyHit(t,{knock:pr.knock,pierce:pr.pierce},1);pr.hit=true;
        dbg(`[IMPACT] ${pr.source||'proj'} -> ${t.type}${t.stump?'(stump)':''} hp=${t.hp.toFixed(2)} k=${pr.knock.toFixed(2)} p=${pr.pierce.toFixed(2)}`);
        if(pr.shards){spawnShards(pr);pr.shards=false;}
        if(pr.source==='cannon'&&pr.pierces>0){pr.pierces=Math.max(0,pr.pierces-2);deflectProjectile(pr,t.x,t.y,0.62,0.55);dbg(`[CANNON] ricochet ang=${pr.angle.toFixed(2)} spd=${pr.speed.toFixed(1)} pierces=${pr.pierces}`);}else pr.life=0;
      }
    }
  }
  const dead=state.enemies.filter(e=>e.hp<=0),deadMushroomZones=new Set(dead.filter(e=>e.kind==='mushroom').map(e=>e.zone));
  for(const fallen of dead.filter(e=>e.kind==='fireAnt'))for(const ant of state.enemies)if(ant.followId===fallen.id)ant.followId=null;
  state.enemies=state.enemies.filter(e=>{
    if(e.hp>0)return true;
    let bounty=enemyBounty(e);const jp=metaFor('casino').jackpot||0;
    if(jp&&Math.random()<Math.min(.25,.015*jp)){const bonus=bounty*(3+jp);bounty+=bonus;dbg(`[JACKPOT] ${e.glyph} +${bonus}♦`);}
    const grossBounty=bounty,debtPay=Math.min(bounty,state.finance.debt);state.finance.debt-=debtPay;bounty-=debtPay;state.diamonds+=bounty;if(bounty>0)spawnSuitFeedback(e.x,e.y-14,'♦',bounty,'#68d8ff');if(debtPay>0)spawnSuitFeedback(e.x,e.y+8,'♦',debtPay,'#ff6677',{negative:true,direction:1});dbg(`[BOUNTY] ${e.glyph} +${bounty}♦${debtPay?` · debt -${debtPay}♦`:''} total=${state.diamonds}`);return false;
  });
  for(const zoneId of deadMushroomZones)if(!state.enemies.some(e=>e.kind==='mushroom'&&e.zone===zoneId))scheduleFungusRecovery(zoneId);
}


function spawnShards(pr,ignore=null){
  const m=metaFor('sling'),count=3+(m.shards||0),impactSpeed=Math.hypot(pr.vx||0,pr.vy||0),expansion=impactSpeed*1.35+180*(1+(m.shatterSpeed||0)*0.1),baseVx=pr.vx||0,baseVy=pr.vy||0,baseAng=Math.atan2(baseVy,baseVx)||pr.angle;
  for(let i=0;i<count;i++){
    const offset=count===1?Math.PI:(i===0?Math.PI:((i-1)/(count-1))*Math.PI*2),a=baseAng+offset+(Math.random()-0.5)*0.12,vx=baseVx+Math.cos(a)*expansion,vy=baseVy+Math.sin(a)*expansion,sp=Math.hypot(vx,vy);
    state.projectiles.push({x:pr.x+Math.cos(a)*18,y:pr.y+Math.sin(a)*18,vx,vy,life:0.62,glyph:'triangle',size:9,damage:1.4,knock:6.5,pierce:3,damageMult:0.7,angle:a,speed:sp,source:'jar shard',element:pr.element,ignore,color:'#8b5a2b',rotation:Math.random()*Math.PI*2,spin:(Math.random()<0.5?-1:1)*(9+Math.random()*8)});
  }
  dbg(`[SHATTER] clay jar -> ${count} shards expansion=${expansion.toFixed(0)} impact=${impactSpeed.toFixed(0)}`);
}

function projectileLaunchSpeed(w,h){
  const footTop=(12*RADIUS_UNIT)/60,horseTop=footTop*2.25;
  if(w.id==='sling')return Math.max(footTop,footTop+h*360)*w.speedMult;
  if(w.id==='bow')return (horseTop+h*268)*w.speedMult;
  if(w.id==='ballista')return (horseTop+h*220)*w.speedMult;
  return (240+h*460)*w.speedMult;
}
function maxMountedSlingSpeed(){
  const sling=effectiveWeapon(weapons.find(w=>w.id==='sling')),horseTop=(12*RADIUS_UNIT/60)*2.25;
  return projectileLaunchSpeed(sling,1)+horseTop;
}
function fireCharge(){
  const w=effectiveWeapon(weaponDef()),p=state.player;if((p.attackCooldown||0)>0){dbg(`[COOLDOWN] ${w.id} ${(p.attackCooldown||0).toFixed(2)}s`);return;}
  const h=chargeLevel(state.mouse.held);let a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),sp=projectileLaunchSpeed(w,h);
  let glyph='●',size=12,damage=w.damage,knock=w.knock,pierce=w.pierce,shards=false,damageMult=w.damageMult||1,color='#111',element=null,life=2.2,pierces=0,recoverable=null;
  if(w.id==='bow'){
    if(state.ammo.arrows<=0){dbg('[AMMO] buy arrows in Fletcher Village');return;}state.ammo.arrows--;glyph='➵';size=22;recoverable='arrows';
    if(state.arrowMode==='element'&&state.activeElement&&state.elements[state.activeElement]>0){element=state.activeElement;state.elements[element]--;}
    const wobble=Math.max(0,state.mouse.held-0.7);a+=Math.sin(state.t*20)*wobble*0.06;
  }
  if(w.id==='ballista'){
    if(state.ammo.bolts<=0){dbg('[AMMO] buy ballista bolts in Sawmill Woods');return;}state.ammo.bolts--;glyph='➳';size=36;life=3;damage=13;knock=5.5;pierce=11;
  }
  if(w.id==='cannon'){
    if((p.cannonCooldown||0)>0){dbg(`[CANNON] cooling ${(p.cannonCooldown||0).toFixed(1)}s`);return;}if(state.mouse.held<0.65){dbg('[CANNON] needs warm-up');return;}
    if(state.cannonMode==='grape'&&p.unlocked.has('grapeshot')){
      if(state.ammo.pellets<6){dbg('[AMMO] grapeshot needs 6 metal pellets');return;}state.ammo.pellets-=6;p.cannonCooldown=1.35;p.attackCooldown=1.35;p.attackCooldownTotal=1.35;p.vx-=Math.cos(a)*70;p.vy-=Math.sin(a)*70;
      for(let i=-3;i<=3;i++){const aa=a+i*0.11,sv=maxMountedSlingSpeed();state.projectiles.push({x:p.x+Math.cos(a)*30,y:p.y+Math.sin(a)*30,vx:Math.cos(aa)*sv+p.vx,vy:Math.sin(aa)*sv+p.vy,life:0.75,glyph:'●',size:10,damage:6.5,knock:6,pierce:4.2,damageMult:1,angle:aa,speed:Math.hypot(Math.cos(aa)*sv+p.vx,Math.sin(aa)*sv+p.vy),source:'grapeshot',color:'#111'});}
      for(const e of state.enemies){const da=Math.atan2(Math.sin(Math.atan2(e.y-p.y,e.x-p.x)-a),Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-a)),dist=Math.hypot(e.x-p.x,e.y-p.y);if(Math.abs(da)<0.55&&dist<150){e.vx+=Math.cos(a)*180;e.vy+=Math.sin(a)*180;}}dbg('[CANNON] grapeshot blast');return;
    }
    if(state.ammo.cannonballs<=0){dbg('[AMMO] buy cannonballs at the Foundry');return;}state.ammo.cannonballs--;glyph='●';size=38;damage=42;knock=75;pierce=24;sp=520*w.speedMult;p.cannonCooldown=2;p.vx-=Math.cos(a)*95;p.vy-=Math.sin(a)*95;damageMult=6;life=4;pierces=9;
  }
  if(w.id==='sling'){
    if(state.slingMode==='pellet'){if(state.ammo.pellets<=0){dbg('[AMMO] buy metal pellets in Smith Town');return;}state.ammo.pellets--;glyph='●';size=10;damage=6;knock=5.2;pierce=3.8;color='#111';recoverable='pellets';}
    else if(['jar','elementJar'].includes(state.slingMode)){if(state.ammo.jars<=0){dbg('[AMMO] buy jars at Sling Creekside');return;}state.ammo.jars--;if(state.slingMode==='elementJar'&&state.activeElement&&state.elements[state.activeElement]>0){element=state.activeElement;state.elements[element]--;}glyph='🏺';size=22;damage=1.3;knock=5.5;pierce=1.2;shards=true;}
    else{glyph='●';size=18;damage=1.2;knock=7.5;pierce=0.25;color='#777';}
  }
  const pvx=Math.cos(a)*sp+p.vx,pvy=Math.sin(a)*sp+p.vy,pspd=Math.hypot(pvx,pvy);p.attackCooldown=(w.cooldown||0.5)*w.cooldownMult;p.attackCooldownTotal=p.attackCooldown;
  state.projectiles.push({x:p.x+Math.cos(a)*24,y:p.y+Math.sin(a)*24,vx:pvx,vy:pvy,life,glyph,size,damage,knock,pierce,damageMult,angle:a,speed:pspd,source:w.id,shards,element,pierces,color,recoverable});
  dbg(`[FIRE] ${w.id} dmg=${damage.toFixed(2)} ang=${a.toFixed(2)} spd=${sp.toFixed(1)} knock=${knock.toFixed(2)} cooldown=${p.attackCooldown.toFixed(2)}`);
}

function hex(x,y,r){ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i+Math.PI/6,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();}
function drawHexBackground(){const size=12,pack=1.34,h=Math.sqrt(3)*size*pack,v=1.5*size*pack,worldW=innerWidth*1.3,worldH=innerHeight*1.3; const r0=Math.floor((state.camera.y-worldH*0.5)/v)-2,r1=Math.ceil((state.camera.y+worldH*0.5)/v)+2,c0=Math.floor((state.camera.x-worldW*0.5)/h)-2,c1=Math.ceil((state.camera.x+worldW*0.5)/h)+2; for(let row=r0;row<=r1;row++){for(let col=c0;col<=c1;col++){const wx=col*h+(row%2?h/2:0),wy=row*v,p=projectWorld(wx,wy); if(p.x<-8||p.x>innerWidth+8||p.y<-8||p.y>innerHeight+8)continue; const z=getZone(wx,wy); const q=col-((row-(row&1))>>1),idx=((q-row)%3+3)%3; ctx.fillStyle=z?z.palette[idx]:['#080b0d','#0b0f12','#0e1317'][idx]; hex(p.x,p.y,size); ctx.fill();}}}
function drawWaterPath(path,color,highlight,width){const world=smoothPathPoints(path,5),pts=world.map(p=>projectWorld(p.x,p.y));ctx.lineCap='round';ctx.lineJoin='round';for(const [stroke,lw] of [[color,width*0.55],[highlight,Math.max(4,width*0.14)]]){ctx.strokeStyle=stroke;ctx.lineWidth=lw;for(let i=0;i<pts.length-1;i++){const zone=getZone(world[i].x,world[i].y),progress=i/(pts.length-1),marshFade=zone?.id==='marsh'||zone?.id==='swamp'?Math.max(0.08,1-(progress-0.68)/0.32):1;ctx.globalAlpha=marshFade;ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[i+1].x,pts[i+1].y);ctx.stroke();}}ctx.globalAlpha=1;}
function drawRiver(){drawWaterPath(coldRiverPath,'#197fbeff','#e8fbffff',150);}
function drawSlingCreek(){drawWaterPath(warmCreekPath,'#22b6d8ff','#e1fbffff',48);}


function drawWeaponVisual(w, gridW=700, gridH=620, charge=1){
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(w.id==='club'){ctx.strokeStyle='#6f3f1f';ctx.lineWidth=Math.max(3,gridH*0.045);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-gridW*0.43,0);ctx.lineTo(gridW*0.43,0);ctx.stroke();return;}
  if(w.id==='bow'||w.id==='ballista'){const sx=0.56+0.44*charge; ctx.save();ctx.scale(sx,1);ctx.font=`${Math.round(gridH*(w.id==='ballista'?0.82:0.9))}px serif`;ctx.fillText('🏹',0,0);ctx.restore(); if(w.id==='ballista'){ctx.font=`${Math.round(gridH*0.38)}px serif`;ctx.fillText('⚙️',gridW*0.12,gridH*0.08);}return;}
  if(w.id==='cannon'){ctx.save();ctx.rotate(-Math.PI/2);ctx.scale(0.65,1.2);ctx.font=`${Math.round(gridH*0.92)}px serif`;ctx.fillText('🔔',0,0);ctx.restore();return;}
  ctx.font=`${Math.round(gridH*0.9)}px serif`;ctx.fillText(w.glyph,0,0);
}

function drawSpecialGlyph(id, gridW, gridH){
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(id==='fire'){for(let i=0;i<2;i++){const tick=Math.floor(state.t*12+i)%7,flip=(tick%2?1:-1),sx=flip*(0.75+((tick*13)%35)/100),sy=0.85+((tick*17)%45)/100;ctx.save();ctx.textBaseline='bottom';ctx.translate(i?gridW*0.025:-gridW*0.025,gridH*0.42);ctx.scale(sx,sy);ctx.font=`${Math.round(gridH*0.78)}px serif`;ctx.fillText('🔥',0,0);ctx.restore();}return true;}
  if(id==='poison'||id==='ice'){const glyph=id==='poison'?'☠️':'❄️';ctx.save();ctx.rotate(state.t*0.7);ctx.font=`${Math.round(gridH*0.86)}px serif`;ctx.fillText(glyph,0,0);ctx.restore();ctx.save();ctx.rotate(-state.t*0.95);ctx.scale(0.72,0.72);ctx.font=`${Math.round(gridH*0.86)}px serif`;ctx.fillText(glyph,0,0);ctx.restore();return true;}
  const arrows={arrow1:'➳',arrow2:'➵',arrow3:'➶',arrow4:'➴',arrow5:'➤'}; if(arrows[id]){ctx.font=`${Math.round(gridH*0.92)}px serif`;ctx.fillText(arrows[id],0,0);return true;} return false;
}

function cellPoint(cell,gridW,gridH){ const m=String(cell||'F1').match(/^([A-K])(-?\d+)$/); if(!m)return{x:-gridW/2,y:0}; const row=glyphRows.indexOf(m[1]),col=Number(m[2]); return{x:((col-0.5)/12)*gridW-gridW/2,y:((row+0.5)/11)*gridH-gridH/2}; }
function drawHeldWeapon(w, aim){ if(w.kind==='deployable'){ctx.rotate(aim);ctx.font='18px serif';ctx.fillText(w.glyph,20,0);return;} const hold=chargeLevel(state.mouse.held),reachScale=MELEE_WEAPONS.has(w.id)?1+metaFor(w.id).reach*.1:1, swingViz=(w.id==='club'||w.kind==='swing')?Math.sin((1-Math.max(0,state.player.swing))*Math.PI*2.4)*0.9*Math.max(0,state.player.swing):0, wob=(w.id==='bow'&&state.mouse.down)?Math.sin(state.t*20)*Math.max(0,state.mouse.held-0.7)*0.12:0; const gw=21*reachScale,gh=16.5,pts=weaponGlyphPoints[w.id]||{},hp=cellPoint(pts.handleCell,gw,gh),tp=cellPoint(pts.tipCell,gw,gh),glyphAngle=Math.atan2(tp.y-hp.y,tp.x-hp.x); ctx.rotate(aim+swingViz+wob); ctx.translate(10,0); ctx.rotate(-glyphAngle); ctx.translate(-hp.x,-hp.y); drawWeaponVisual(w,gw,gh,(w.id==='bow'&&state.mouse.down)?hold:0.45); }


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
  const selected=weapons.find(w=>w.id===state.glyphWeapon);
  ctx.save();ctx.translate(left+gridW/2,top+gridH/2); if(selected)drawWeaponVisual(selected,gridW,gridH); else drawSpecialGlyph(state.glyphWeapon,gridW,gridH); ctx.restore();
  const points=weaponGlyphPoints[state.glyphWeapon]||{};
  for(const [label,cell,color] of [['H',points.handleCell,'#76e08d'],['T',points.tipCell,'#ff7676']]){ if(cell){const pt=cellPoint(cell,gridW,gridH);ctx.fillStyle=color;ctx.beginPath();ctx.arc(left+gridW/2+pt.x,top+gridH/2+pt.y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.font='12px monospace';ctx.fillText(label,left+gridW/2+pt.x-4,top+gridH/2+pt.y+4);} }
  ctx.fillStyle='#f5d76e';ctx.font='14px monospace';ctx.fillText(`Handle: ${points.handleCell||'unassigned'}   Tip: ${points.tipCell||'unassigned'}`,24,78);
  ui.innerHTML=`Mode: Glyph Test<br>${glyphTests.map(id=>`<button type="button" data-glyph-weapon="${id}">${id}</button>`).join(' ')}<br><button type="button" data-mode="game">Play Game</button><button type="button" data-mode="menu">Menu</button>`;
}


function statusIconScale(o,type){
  const status=o?.status||{}, max=maxHpOf(o||{}), dmg=Math.max(0,max-(o?.hp??max));
  if(type==='poison')return status.poison?Math.min(2.4,0.65+dmg/Math.max(1,max)*2.2):0;
  if(type==='fire')return status.fire>0?Math.min(2.5,0.55+status.fire/12):0;
  if(type==='ice')return status.ice>0?Math.min(2.0,0.6+status.ice/5):0;
  return 0;
}
function drawStatusIcons(o,x,y){
  const icons=['fire','ice','poison'].map(type=>({type,scale:statusIconScale(o,type)})).filter(i=>i.scale>0);
  icons.forEach((it,i)=>{ctx.font=`${Math.round(11*it.scale)}px serif`;ctx.fillText(ELEMENT_GLYPHS[it.type],x+12+i*(10+8*it.scale),y-14);});
}

function drawWeaponBar(){
  const entries=[...weapons.filter(w=>state.player.unlocked.has(w.id)).map(w=>({slot:weapons.indexOf(w)+1,glyph:w.id==='club'?'┃':w.glyph,active:w.id===state.player.weapon})),...(state.player.caltrops>0?[{slot:8,glyph:'✣',count:state.player.caltrops,active:state.player.weapon==='caltrop'}]:[]),...(state.player.decoys>0?[{slot:9,glyph:'🛡️',count:state.player.decoys,active:state.player.weapon==='decoy'}]:[])];
  const cell=54,total=entries.length*cell,x0=innerWidth/2-total/2,y=innerHeight-38;ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='12px sans-serif';
  entries.forEach((entry,i)=>{
    const x=x0+i*cell+cell/2,left=x-23,top=y-25,width=46,height=48;
    ctx.beginPath();ctx.roundRect(left,top,width,height,8);
    if(entry.active){
      const totalCooldown=Math.max(.001,state.player.attackCooldownTotal||weaponDef().cooldown||.5),cooldownReady=Math.max(0,Math.min(1,1-(state.player.attackCooldown||0)/totalCooldown));
      const charging=isChargeWeapon(weaponDef())&&state.mouse.down&&state.player.attackCooldown<=0,charge=charging?chargeLevel(state.mouse.held):0;
      ctx.fillStyle='rgba(184,42,42,.95)';ctx.fill();
      ctx.save();ctx.beginPath();ctx.roundRect(left,top,width,height,8);ctx.clip();
      ctx.fillStyle='rgba(231,190,49,.96)';ctx.fillRect(left,top+height*(1-cooldownReady),width,height*cooldownReady);
      if(charging){ctx.fillStyle='rgba(42,164,76,.97)';ctx.fillRect(left,top+height*(1-charge),width,height*charge);}
      ctx.restore();
    }else{ctx.fillStyle='rgba(0,0,0,.62)';ctx.fill();}
    ctx.strokeStyle=entry.active?'#fff':'#ffffff55';ctx.lineWidth=entry.active?3:1;ctx.beginPath();ctx.roundRect(left,top,width,height,8);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.fillText(String(entry.slot),x-16,y-16);ctx.font='22px serif';ctx.fillText(entry.glyph,x,y+3);
    if(entry.count!==undefined){ctx.font='11px sans-serif';ctx.fillText(String(entry.count),x+16,y+16);}
  });ctx.restore();
}

function drawFieryInsect(e,p,size){
  const speed=Math.hypot(e.vx||0,e.vy||0),angle=speed>4?Math.atan2(e.vy,e.vx):((e.id||0)*2.399),flicker=Math.sin(state.t*19+(e.id||0)*1.7),trail=9+Math.max(0,Math.min(5,speed/80)),flameSize=12+flicker*1.4;
  ctx.save();ctx.translate(p.x-Math.cos(angle)*trail,p.y-Math.sin(angle)*trail);ctx.scale(flicker>0?1:-1,1);ctx.globalAlpha=.78+.16*Math.sin(state.t*13+(e.id||0));ctx.font=`${flameSize}px serif`;ctx.fillText('🔥',0,0);ctx.restore();
  if(e.kind==='firefly'){ctx.save();ctx.globalAlpha=.2+.12*Math.sin(state.t*8+(e.id||0));ctx.fillStyle='#ffe85e';ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.font=`${size}px serif`;ctx.fillStyle='#fff';ctx.fillText(e.glyph,p.x,p.y);
}
function render(){updateHudFlashes();ctx.clearRect(0,0,innerWidth,innerHeight); drawHexBackground(); drawRiver(); drawSlingCreek(); for(const f of coldSnowflakePositions()){const p=projectWorld(f.x,f.y);ctx.font='18px serif';ctx.fillStyle='#fff';ctx.fillText('❄️',p.x,p.y);}
  const wps=[
    {id:'volcano',glyph:'🌋',h:7.5,r:4.8*RADIUS_UNIT,color:'#fff'},
    {id:'frost',glyph:'🏔️',h:10.5,r:4.8*RADIUS_UNIT,color:'#fff'},
    {id:'marches',glyph:'♜',h:4.5,r:4.55*RADIUS_UNIT,color:'#000'},
    {id:'sawmill',glyph:'🌳',h:1.5,r:4.55*RADIUS_UNIT,color:'#fff'}
  ];
  for(const wp of wps){ const th=(wp.h-3)*Math.PI/6; const wx=MAP_CENTER.x+Math.cos(th)*wp.r, wy=MAP_CENTER.y+Math.sin(th)*wp.r; const actual=projectWorld(wx,wy); const on=actual.x>=30&&actual.x<=innerWidth-30&&actual.y>=30&&actual.y<=innerHeight-30; const dx=actual.x-innerWidth/2,dy=actual.y-innerHeight/2,scale=on?1:Math.min((innerWidth/2-36)/Math.max(1,Math.abs(dx)),(innerHeight/2-36)/Math.max(1,Math.abs(dy)),1); const sx=on?actual.x:innerWidth/2+dx*scale, sy=on?actual.y:innerHeight/2+dy*scale; const dist=Math.hypot(wx-state.player.x,wy-state.player.y); const t=Math.max(0,1-dist/(2.8*RADIUS_UNIT)); const sz=(on?24:34)+56*t; ctx.fillStyle=wp.color; ctx.font=`${sz.toFixed(0)}px serif`; ctx.fillText(wp.glyph,sx,sy);} for(const br of coldBridges){const p=projectWorld(pathPoint(br).x,pathPoint(br).y);ctx.font='24px serif';ctx.fillText('🌉',p.x,p.y);} for(const wp of coldWhirlpools){const p=projectWorld(pathPoint(wp).x,pathPoint(wp).y);ctx.font='24px serif';ctx.fillText('🌀',p.x,p.y);}
 for(const t of state.terrain){const p=projectWorld(t.x,t.y); if(t.color)ctx.fillStyle=t.color; else ctx.fillStyle='#fff'; if(t.stump){ctx.fillStyle='#4a2b1a';ctx.fillRect(p.x-5,p.y-5,10,10);} else {ctx.font=`${t.size|| (t.glyph==='♜'?22:16)}px serif`; ctx.fillText(t.glyph,p.x,p.y);} }
 for(const item of state.deployables){const p=projectWorld(item.x,item.y);ctx.font=item.type==='decoy'?'25px serif':'19px serif';ctx.fillStyle=item.type==='caltrop'?'#d7d7d7':'#fff';ctx.fillText(item.type==='decoy'?'🛡️':'✣',p.x,p.y);}
 if(state.offerNpc){const age=Math.max(0,state.t-(state.offerNpc.born??state.t)),grow=Math.min(1,age/0.9),orbit=10*(1-grow),p=projectWorld(state.offerNpc.x+Math.cos(age*8)*orbit,state.offerNpc.y+Math.sin(age*8)*orbit);ctx.save();ctx.translate(p.x,p.y);ctx.scale(grow,grow);ctx.font='28px serif';ctx.fillStyle='#fff';ctx.fillText(state.offerNpc.glyph,0,0);ctx.font='12px sans-serif';ctx.fillText('upgrade?',-12,14);ctx.restore();}
 for(const e of state.enemies){const p=projectWorld(e.x,e.y),grow=e.kind==='mushroom'?Math.max(.25,1-(e.growT||0)/3):1,size=(e.archetype==='tank'?24:e.archetype==='charger'?19:e.archetype==='fly'?14:16)*grow*(e.visualScale||1);if(e.kind==='firefly'||e.kind==='fireAnt')drawFieryInsect(e,p,size);else{ctx.font=`${size}px serif`;ctx.fillStyle='#fff';ctx.fillText(e.glyph,p.x,p.y);}if(e.weapon){ctx.font='12px serif';ctx.fillText(e.weapon,p.x+12,p.y-8);}drawStatusIcons(e,p.x,p.y);}
 for(const item of state.pickups){const q=projectWorld(item.x,item.y);ctx.fillStyle=item.color;ctx.font=item.ammo==='arrows'?'18px serif':'14px serif';if(item.ammo==='arrows')ctx.fillText(item.glyph,q.x,q.y);else{ctx.beginPath();ctx.arc(q.x,q.y,3.5,0,Math.PI*2);ctx.fill();}}
 for(const pr of state.projectiles){const p=projectWorld(pr.x,pr.y),a=pr.glyph==='triangle'?(pr.rotation||0):Math.atan2(pr.vy,pr.vx); ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle=pr.color||'#111'; if(pr.glyph==='triangle'){ctx.beginPath();ctx.moveTo(pr.size*0.7,0);ctx.lineTo(-pr.size*0.45,-pr.size*0.45);ctx.lineTo(-pr.size*0.45,pr.size*0.45);ctx.closePath();ctx.fill();} else if(pr.glyph!=='●'){ctx.font=`${pr.size}px serif`;ctx.fillText(pr.glyph,0,0);} else {ctx.beginPath();ctx.arc(0,0,pr.size*0.25,0,Math.PI*2);ctx.fill();} ctx.restore(); if(pr.element){ctx.font='13px serif';ctx.fillText(ELEMENT_GLYPHS[pr.element],p.x+9,p.y-10);}}
 drawSuitFeedback();
 const pp=projectWorld(state.player.x,state.player.y),aim=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),w=weaponDef(); ctx.textAlign='center';ctx.textBaseline='middle'; if(state.mount==='horse'&&state.player.unlocked.has('horse')){ctx.font='30px serif';ctx.fillText('🐎',pp.x,pp.y+8);} ctx.font='20px serif';ctx.fillStyle='#fff';ctx.fillText('🙂',pp.x,pp.y); if(state.player.shield){ctx.font='18px serif';ctx.fillText('🛡️',pp.x-18,pp.y+4);}
 ctx.save();ctx.translate(pp.x,pp.y); drawHeldWeapon(w,aim); if(state.activeElement&&state.elements[state.activeElement]>0){ctx.font='14px serif';ctx.fillText(ELEMENT_GLYPHS[state.activeElement],Math.cos(aim)*28,Math.sin(aim)*28-10);} ctx.restore(); drawStatusIcons(state.player,pp.x,pp.y);
 const z=getZone(state.player.x,state.player.y); const dx=state.player.x-MAP_CENTER.x,dy=state.player.y-MAP_CENTER.y,rad=(Math.hypot(dx,dy)/(5*CELL*WORLD_SCALE)).toFixed(2),clock=wrap12((Math.atan2(dy,dx)*6/Math.PI)+3).toFixed(2);
 const tiers=metaFor(w.id),showReward=state.pendingReward&&z?.id===state.pendingReward.zone,modeBits=[];
 if(['bow','sling','club','axe','sword'].includes(w.id))modeBits.push(`Apply: ${['fire','ice','poison'].map(e=>`<button type="button" data-element="${e}">${e}${state.activeElement===e?'*':''} ${state.elements[e]}</button>`).join(' ')}`);
 if(['club','axe','sword'].includes(w.id))modeBits.push('<button type="button" data-enchant="1">enchant held</button>');
 if(w.id==='sling')modeBits.push(`Sling: ${['rock','pellet','jar','elementJar'].map(m=>`<button type="button" data-sling="${m}">${m}${state.slingMode===m?'*':''}</button>`).join(' ')}`);
 if(w.id==='bow')modeBits.push(`Arrows: ${['regular','element'].map(m=>`<button type="button" data-arrow="${m}">${m}${state.arrowMode===m?'*':''}</button>`).join(' ')}`);
 if(w.id==='cannon')modeBits.push(`Cannon: ${['ball','grape'].map(m=>`<button type="button" data-cannon="${m}">${m}${state.cannonMode===m?'*':''}</button>`).join(' ')}`);
 if(state.player.unlocked.has('shield')&&!['bow','ballista','cannon'].includes(w.id))modeBits.push('<button type="button" data-shield="1">shield (Q)</button>');
 const shopHtml=showReward?`<div class="shop-section"><strong>Upgrades — choose one</strong><br>${state.pendingReward.options.map((o,i)=>`<button type="button" data-reward-index="${i}" ${state.pendingReward.purchased?'disabled':''}>${o.label}</button>`).join(' ')}</div><div class="shop-section"><strong>Consumables</strong><br>${shopConsumables(state.pendingReward.zone)}</div>${state.pendingReward.purchased?'<button type="button" data-start-wave="1">Start next wave</button>':''}`:'';
 ui.innerHTML=`<strong>${BUILD_VERSION}</strong><br><span class="hud-value ${state.hudFlash.hp>state.t?'hud-flash-health':''}">♥ ${state.player.hp.toFixed(1)}/${state.player.maxHp}</span> · <span class="hud-value ${state.hudFlash.diamonds>state.t?'hud-flash-diamonds':''}">♦ ${state.diamonds}</span><br>Zone: ${z?z.name:'Boundary'} · R ${rad} · ${clock}:00<br>Weapon: ${w.id} · Mount: ${state.mount}<br>Ammo: ➵ ${state.ammo.arrows} · ➳ ${state.ammo.bolts} · 🏺 ${state.ammo.jars} · ● ${state.ammo.pellets} · ⚫ ${state.ammo.cannonballs}${modeBits.length?`<br>${modeBits.join('<br>')}`:''}${shopHtml}<br><button type="button" data-reset-world="1">Reset World</button>`;
 drawWeaponBar(); }

function selectWeapon(id){
  if(id==='caltrop'&&(state.player.caltrops||0)<=0)return;if(id==='decoy'&&(state.player.decoys||0)<=0)return;
  if(!DEPLOYABLE_TOOLS[id]&&!state.player.unlocked.has(id))return;
  if(!DEPLOYABLE_TOOLS[id])state.player.lastWeapon=id;state.player.weapon=id;state.player.swing=0;state.mouse.down=false;state.mouse.queuedAttack=false;state.mouse.held=0;
}
function useDeployable(type){
  const key=type==='caltrop'?'caltrops':'decoys',count=state.player[key]||0;if(count<=0){dbg(`[ITEM] no ${type}s available`);selectWeapon(state.player.lastWeapon||'club');return;}
  const a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),distance=type==='decoy'?34:0;state.player[key]--;state.deployables.push({type,x:state.player.x+Math.cos(a)*distance,y:state.player.y+Math.sin(a)*distance,used:false});dbg(`[ITEM] deployed ${type}; ${state.player[key]} left`);
  if(state.player[key]<=0)selectWeapon(state.player.lastWeapon||'club');
}
function beginMeleeSwing(){
  const w=effectiveWeapon(weaponDef());if(w.kind!=='swing'||state.player.attackCooldown>0)return;
  state.mouse.queuedAttack=false;state.player.swing=1;state.player.swingSerial=(state.player.swingSerial||0)+1;state.player.attackCooldown=(w.cooldown||0.34)*w.cooldownMult;state.player.attackCooldownTotal=state.player.attackCooldown;
  const el=state.player.enchants[state.player.weapon];state.player.swingElement=(state.activeElement===el&&state.elements[el]>0)?el:null;if(state.player.swingElement)state.elements[state.player.swingElement]--;
}
function trig(){
  if(state.mouse.down)return;const w=weaponDef();
  if(w.kind==='deployable'){useDeployable(w.id);return;}
  state.mouse.down=true;state.mouse.held=0;state.mouse.queuedAttack=true;
  if(state.player.attackCooldown<=0&&!isChargeWeapon(w))beginMeleeSwing();
}
function rel(){
  if(!state.mouse.down)return;
  const wasCharging=isChargeWeapon(weaponDef())&&state.player.attackCooldown<=0;
  state.mouse.down=false;state.mouse.queuedAttack=false;
  if(wasCharging)fireCharge();
}
function loop(ts){if(!state.last)state.last=ts;const dt=Math.min(0.033,(ts-state.last)/1000);state.last=ts;state.t+=dt;if(state.mode==='game'){const p=state.player;p.lastX=p.x;p.lastY=p.y;update(dt);render();}else if(state.mode==='glyph'){renderGlyphTest();}requestAnimationFrame(loop);}

function setMode(mode){state.mode=mode;menu.classList.toggle('hidden',mode!=='menu');ui.style.display=mode==='menu'?'none':'block';if(mode==='game'&&!state.player)resetWorld();if(mode==='glyph')menu.classList.add('hidden');}
menu.addEventListener('click',e=>{const mode=e.target.closest('[data-mode]')?.dataset.mode;if(mode)setMode(mode);});
function handleUiAction(e){const mode=e.target.closest('[data-mode]')?.dataset.mode; if(mode){e.preventDefault();e.stopPropagation();setMode(mode);return true;} const glyph=e.target.closest('[data-glyph-weapon]')?.dataset.glyphWeapon; if(glyph){e.preventDefault();e.stopPropagation();state.glyphWeapon=glyph;return true;} const reward=e.target.closest('[data-reward-index]'); if(reward){e.preventDefault();e.stopPropagation();chooseReward(Number(reward.dataset.rewardIndex));return true;} const buy=e.target.closest('[data-buy]'); if(buy){e.preventDefault();e.stopPropagation();buyItem(buy.dataset.buy);return true;} const financeAdjust=e.target.closest('[data-finance-adjust]');if(financeAdjust){e.preventDefault();e.stopPropagation();adjustFinance(financeAdjust.dataset.account,Number(financeAdjust.dataset.financeAdjust));return true;}const finance=e.target.closest('[data-finance]'); if(finance){e.preventDefault();e.stopPropagation();financeAction(finance.dataset.finance);return true;}const casinoAdjust=e.target.closest('[data-casino-adjust]');if(casinoAdjust){e.preventDefault();e.stopPropagation();adjustCasino(casinoAdjust.dataset.game,Number(casinoAdjust.dataset.casinoAdjust));return true;} const casino=e.target.closest('[data-casino]'); if(casino){e.preventDefault();e.stopPropagation();casinoAction(casino.dataset.casino);return true;} const el=e.target.closest('[data-element]'); if(el){e.preventDefault();e.stopPropagation();state.activeElement=state.activeElement===el.dataset.element?null:el.dataset.element;dbg(`[ELEMENT] applying ${state.activeElement||'none'}`);return true;} const sm=e.target.closest('[data-sling]'); if(sm){e.preventDefault();e.stopPropagation();state.slingMode=sm.dataset.sling;return true;} const ar=e.target.closest('[data-arrow]'); if(ar){e.preventDefault();e.stopPropagation();state.arrowMode=ar.dataset.arrow;return true;} const cm=e.target.closest('[data-cannon]'); if(cm){e.preventDefault();e.stopPropagation();state.cannonMode=cm.dataset.cannon;return true;} if(e.target.closest('[data-shield]')){e.preventDefault();e.stopPropagation();const p=state.player;if(!p.unlocked.has('shield'))dbg('[SHIELD] unlock shield at Armorer Court');else if(['bow','ballista','cannon'].includes(p.weapon))dbg('[SHIELD] cannot use shield with this weapon');else p.shield=!p.shield;return true;} if(e.target.closest('[data-enchant]')){e.preventDefault();e.stopPropagation();const p=state.player,el=state.activeElement,w=p.weapon;if(!['club','axe','sword'].includes(w))dbg('[ENCHANT] choose club, axe, or sword');else if(!el||!p.unlockedElements.has(el))dbg('[ENCHANT] choose an unlocked element');else if(Object.values(p.enchants).includes(el)&&p.enchants[w]!==el)dbg('[ENCHANT] that element is already bound');else{for(const k of Object.keys(p.enchants))if(p.enchants[k]===el)delete p.enchants[k];p.enchants[w]=el;dbg(`[ENCHANT] ${w} now carries ${el}`);}return true;} if(e.target.closest('[data-start-wave]')){e.preventDefault();e.stopPropagation();startNextWave();return true;} if(e.target.closest('[data-reset-world]')){e.preventDefault();e.stopPropagation();resetWorld();return true;} return false;}
ui.addEventListener('pointerdown',e=>{handleUiAction(e)||e.stopPropagation();});
ui.addEventListener('click',e=>{handleUiAction(e)||e.stopPropagation();});
ui.addEventListener('mousedown',e=>e.stopPropagation());
ui.addEventListener('mouseup',e=>e.stopPropagation());
addEventListener('resize',()=>{canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);});
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='escape'){setMode('menu');return;}if(state.mode!=='game')return;state.keys.add(k);if(k===' ')trig();if(k==='r')resetWorld();if(k==='m')state.mount=(state.mount==='horse'?'foot':'horse');if(k==='q'&&state.player.unlocked.has('shield')&&!['bow','ballista','cannon'].includes(state.player.weapon))state.player.shield=!state.player.shield;if(/[1-7]/.test(e.key)){const w=weapons[Number(e.key)-1];if(w)selectWeapon(w.id);}if(e.key==='8')selectWeapon('caltrop');if(e.key==='9')selectWeapon('decoy');});
addEventListener('keyup',e=>{if(state.mode!=='game')return; state.keys.delete(e.key.toLowerCase()); if(e.key===' ')rel();});
canvas.addEventListener('mousemove',e=>{state.mouse.x=e.clientX;state.mouse.y=e.clientY;});
canvas.addEventListener('mousedown',()=>{if(state.mode==='game')trig();}); addEventListener('mouseup',()=>{if(state.mode==='game')rel();});
canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
ui.style.display='none';
addEventListener('notoemoji:progress',event=>{const s=event.detail,total=Math.max(1,s.total),finished=s.ready+s.failed,pct=Math.round(finished/total*100);loadingBar.style.width=`${pct}%`;loadingStatus.textContent=`Loading Noto Emoji ${finished}/${total}${s.failed?` · ${s.failed} unavailable`:''}`;});
async function startGameClient(){
  const timeout=new Promise(resolve=>setTimeout(()=>resolve('timeout'),12000)),result=await Promise.race([emojiPreload.then(()=> 'ready'),timeout]);
  const s=NotoEmojiRenderer.status(),finished=s.ready+s.failed,pct=Math.round(finished/Math.max(1,s.total)*100);loadingBar.style.width=`${pct}%`;
  loadingStatus.textContent=result==='ready'?`Ready · ${s.ready} glyphs cached`:`Starting with ${finished}/${s.total} glyphs cached; the rest will finish in the background`;
  resetWorld();requestAnimationFrame(loop);setTimeout(()=>loading.classList.add('done'),180);
}
startGameClient();
