const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');
const menu = document.getElementById('menu');

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
  { id: 'casino', name: 'Gambling Parlor', palette: ['#5d294f','#87366e','#bc568f'], enemy: '🤢', unlock: null, ring: ring(3,4), arc:[5,7], deco:'casino' },
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
  { id: 'swamp', name: 'Swamp', palette: ['#2f5a2f','#4f7b46','#7ea85f'], enemy: '☠️', unlock: null, ring: ring(5,6), arc:[2,4], slowWater:true, deco:'swamp', specialist:'witch', element:'poison' },
  { id: 'foundry', name: 'Foundry/Monastery', palette: ['#5e4339','#7a5a4f','#a37d6b'], enemy: '👹', unlock: 'cannon', ring: ring(5,6), arc:[8,10], deco:'foundry' },
];

const state = { mode:'menu',glyphWeapon:'club',t:0,last:0,keys:new Set(),mouse:{x:0,y:0,down:false,held:0},camera:{x:MAP_CENTER.x,y:MAP_CENTER.y},player:null,projectiles:[],pickups:[],enemies:[],terrain:[],waves:{},mount:'foot',debug:[],diamonds:0,ammo:{arrows:0,bolts:0,jars:0,pellets:0,cannonballs:0},elements:{fire:0,ice:0,poison:0},activeElement:null,meta:{},pendingReward:null,offerNpc:null,currentZone:null,run:1,hazards:[],deployables:[],finance:{savings:0,debt:0,trust:0,trustAvailable:0,amounts:{savings:5,loan:10,trust:5}},casinoWagers:{coin:1,dice:1,card:1},shopPurchases:{} };
const BUILD_VERSION = 'v0.8.3 build 2026-06-10 13:35 UTC';
const wrap12=h=>(h%12+12)%12; const inArc=(h,[s,e])=>{h=wrap12(h);s=wrap12(s);e=wrap12(e);if(s===e)return true;return s<=e?(h>=s&&h<e):(h>=s||h<e)}; const toClockHour=t=>wrap12((t*6/Math.PI)+3);
const weaponDef=()=>weapons.find(w=>w.id===state.player.weapon);
const MERCHANT_ZONES = new Set(['bank','tanner','inn','casino','farrier','armorer']);
const MINOR_ZONES = new Set(['tundra','marsh','desert','mine']);
const UPGRADE_STATS = ['speed','range','damage','knockback'];
const ELEMENT_UPGRADE_STATS = {fire:['damage','duration'],ice:['slow','duration'],poison:['potency','dose']};
const ELEMENT_GLYPHS = {fire:'🔥',ice:'❄️',poison:'☠️'};
const SMITH_UNLOCKS = ['sword'];
const FOUNDRY_UNLOCKS = ['cannon','grapeshot'];
const upgradeStatsFor=id=>id==='horse'?['speed','accel']:id==='sling'?['speed','range','damage','knockback','shards','shatterSpeed']:UPGRADE_STATS;
function merchantOptions(zone,wave){ const cost=upgradeCost(wave),cash={diamonds:3+wave,label:`take ${3+wave}♦`}; if(zone.id==='bank')return [{merchant:'bank',stat:'bounty',cost,label:`banker: +1♦ per enemy (${cost}♦)`},cash]; if(zone.id==='tanner')return [{merchant:'foot',stat:'speed',cost,label:`tanner: +10% foot speed (${cost}♦)`},{merchant:'foot',stat:'accel',cost,label:`tanner: +10% foot acceleration (${cost}♦)`},cash]; if(zone.id==='inn')return [{merchant:'player',stat:'maxHp',cost:cost+4,label:`innkeeper: +1 max HP (${cost+4}♦)`},cash]; if(zone.id==='casino')return [{merchant:'casino',stat:'jackpot',cost,label:`casino: +10% hidden jackpot odds (${cost}♦)`},cash]; if(zone.id==='farrier')return [...(!state.player.unlocked.has('pellets')?[{unlock:'pellets',cost:unlockCost(zone),label:`farrier: unlock metal pellets (${unlockCost(zone)}♦)`}]:[]),{weapon:'horse',stat:'accel',cost,label:`farrier: +10% horse acceleration (${cost}♦)`},{weapon:'horse',stat:'speed',cost,label:`farrier: +10% horse top speed (${cost}♦)`},cash]; if(zone.id==='armorer'){ if(!state.player.unlocked.has('shield'))return [{unlock:'shield',cost:unlockCost(zone),label:`armorer: unlock shield (${unlockCost(zone)}♦)`},cash]; return [{merchant:'shield',stat:'blockChance',cost,label:`armorer: +5% shield block chance (${cost}♦)`},{merchant:'shield',stat:'blockAmount',cost,label:`armorer: +5% shield reduction (${cost}♦)`},cash]; } return null;}
const ZONE_NPCS = {bank:'🏦',tanner:'🧵',inn:'🍲',casino:'🎰',farrier:'🐴',armorer:'🛡️',orchard:'👨‍🌾',creek:'🧒',axe:'🧔',pasture:'🐎',smith:'🛡️',fletcher:'🏹',sawmill:'🪚',marches:'♜',volcano:'🧙‍♂️',frost:'🧙',swamp:'🧙‍♀️',foundry:'🙏'};
function metaFor(id){ if(!state.meta[id]) state.meta[id]={speed:0,range:0,damage:0,knockback:0,accel:0,poison:0,poisonResist:0,potency:0,dose:0,duration:0,slow:0,maxHp:0,bounty:0,jackpot:0,blockChance:0,blockAmount:0}; return state.meta[id]; }
function effectiveWeapon(base){ const m=metaFor(base.id); return {...base, knock:base.knock*(1+m.knockback*0.1), reach:base.reach*(1+m.range*0.1), damageMult:1+m.damage*0.1, speedMult:1+m.speed*0.1, cooldownMult:Math.pow(0.9,m.speed||0), tiers:m}; }
function rewardWeaponForZone(zone){ return zone.id==='smith'?(SMITH_UNLOCKS.find(u=>!state.player.unlocked.has(u))||'sword'):zone.id==='foundry'?(FOUNDRY_UNLOCKS.find(u=>!state.player.unlocked.has(u))||'cannon'):(zone.element || zone.unlock || state.player.weapon); }
function unlockCost(zone){return zone.id==='orchard'?0:14;} function upgradeCost(wave){return 10+wave*5;} function upgradeLabel(id,stat,cost){return stat==='shards'?`${id} +1 shard (${cost}♦)`: `${id} +10% ${stat} (${cost}♦)`;}
function buildReward(zone){ const wave=state.waves[zone.id]?.wave||1, rewardId=rewardWeaponForZone(zone); let options; if(MERCHANT_ZONES.has(zone.id)){ options=merchantOptions(zone,wave); } else if(zone.id==='smith'&&SMITH_UNLOCKS.some(u=>!state.player.unlocked.has(u))){ const next=SMITH_UNLOCKS.find(u=>!state.player.unlocked.has(u)),cost=unlockCost(zone); options=[{unlock:next,cost,label:`unlock ${next} (${cost}♦)`},{diamonds:3+wave,label:`take ${3+wave}♦`}]; } else if(zone.id==='foundry'&&FOUNDRY_UNLOCKS.some(u=>!state.player.unlocked.has(u))){ const next=FOUNDRY_UNLOCKS.find(u=>!state.player.unlocked.has(u)),cost=unlockCost(zone); options=[{unlock:next,cost,label:`unlock ${next} (${cost}♦)`},{diamonds:3+wave,label:`take ${3+wave}♦`}]; } else if(wave===1&&zone.unlock&&!state.player.unlocked.has(zone.unlock)){ const cost=unlockCost(zone); options=[{unlock:zone.unlock,cost,label:`unlock ${zone.unlock} (${cost}♦)`},{diamonds:3+wave,label:`take ${3+wave}♦`}]; } else if(zone.element&&!state.player.unlockedElements.has(zone.element)){ const cost=unlockCost(zone); options=[{elementUnlock:zone.element,cost,label:`unlock ${zone.element} (${cost}♦)`},{diamonds:3+wave,label:`take ${3+wave}♦`}]; } else if(zone.element){ const stats=ELEMENT_UPGRADE_STATS[zone.element].map(stat=>({element:zone.element,stat,cost:upgradeCost(wave),label:`${zone.element} +10% ${stat} (${upgradeCost(wave)}♦)`})); options=[stats[wave%stats.length],stats[(wave+1)%stats.length],{diamonds:3+wave,label:`take ${3+wave}♦`}]; } else { const stats=upgradeStatsFor(rewardId).map(stat=>({weapon:rewardId,stat,cost:upgradeCost(wave),label:upgradeLabel(rewardId,stat,upgradeCost(wave))})); options=[stats[wave%stats.length],stats[(wave+1)%stats.length],{diamonds:3+wave,label:`take ${3+wave}♦`}]; } state.pendingReward={zone:zone.id,wave,options,purchased:false}; state.offerNpc={x:state.player.x+42,y:state.player.y-34,glyph:ZONE_NPCS[zone.id]||'🙂',zone:zone.id,born:state.t}; dbg(`[REWARD] ${zone.name} wave ${wave} cleared; NPC selling reward`); }
function chooseReward(i){ const reward=state.pendingReward, here=getZone(state.player.x,state.player.y); if(!reward||reward.purchased||here?.id!==reward.zone) return; const option=reward.options[i]; if(!option) return; if(option.diamonds){state.diamonds+=option.diamonds;dbg(`[PAYOUT] +${option.diamonds}♦`);reward.purchased=true;return;} const cost=option.cost||0; if(state.diamonds<cost){dbg(`[SHOP] need ${cost}♦ for ${option.label}; have ${state.diamonds}♦`);return;} state.diamonds-=cost; if(option.unlock){ state.player.unlocked.add(option.unlock); if(weapons.some(w=>w.id===option.unlock))state.player.weapon=option.unlock; dbg(`[UNLOCK] ${option.unlock} bought for ${cost}♦`); } else if(option.elementUnlock){ state.player.unlockedElements.add(option.elementUnlock); state.activeElement=option.elementUnlock; dbg(`[UNLOCK] ${option.elementUnlock} element bought for ${cost}♦`); } else if(option.element){ const m=metaFor(option.element); m[option.stat]++; dbg(`[UPGRADE] ${option.element}.${option.stat} -> ${m[option.stat]} cost=${cost}♦`); } else if(option.merchant){ const m=metaFor(option.merchant); m[option.stat]++; if(option.merchant==='player'&&option.stat==='maxHp'){state.player.maxHp++;state.player.hp=Math.min(state.player.maxHp,state.player.hp+1);} dbg(`[UPGRADE] ${option.merchant}.${option.stat} -> ${m[option.stat]} cost=${cost}♦`); } else if(option.heal){ state.player.hp=Math.min(state.player.maxHp,state.player.hp+option.heal); dbg(`[HEAL] +${option.heal} HP cost=${cost}♦`); } else { const m=metaFor(option.weapon); m[option.stat]++; dbg(`[UPGRADE] ${option.weapon}.${option.stat} -> ${m[option.stat]} cost=${cost}♦`); } reward.purchased=true; }
const CONSUMABLE_BASE={arrows:3,bolts:12,jars:5,pellets:4,cannonballs:8,fire:7,ice:7,poison:7,antitoxin:8,fruit:2,meat:4,cheese:6,stew:8,cloak:9,caltrops:7,decoy:9};
const ESCALATING_CONSUMABLES=new Set(['fruit','meat','cheese','stew','cloak','caltrops','decoy']);
function purchaseKey(kind){const zone=state.pendingReward?.zone||state.currentZone||'none',wave=state.waves[zone]?.wave||1;return `${state.run}:${zone}:${wave}:${kind}`;}
function consumablePrice(kind){const base=CONSUMABLE_BASE[kind],bought=state.shopPurchases[purchaseKey(kind)]||0;return base+(ESCALATING_CONSUMABLES.has(kind)?bought:0);}
function buyItem(kind){
  const qty={arrows:6,bolts:3,jars:2,pellets:8,cannonballs:2,fire:2,ice:2,poison:2},heals={fruit:1,meat:2,cheese:3,stew:4};
  const here=getZone(state.player.x,state.player.y),z=(state.pendingReward&&here?.id===state.pendingReward.zone)?state.pendingReward.zone:state.currentZone,home={arrows:'fletcher',bolts:'sawmill',jars:'creek',pellets:'smith',cannonballs:'foundry',fruit:'orchard',meat:'axe',cheese:'pasture',stew:'inn',cloak:'tanner',caltrops:'farrier',decoy:'armorer',fire:'volcano',ice:'frost',poison:'swamp',antitoxin:'swamp'}[kind];
  if(home&&z!==home){dbg(`[SHOP] ${kind} is sold in ${home}`);return;}
  if(kind==='arrows'&&!state.player.unlocked.has('bow'))return dbg('[SHOP] unlock bow before buying arrows');
  if(kind==='bolts'&&!state.player.unlocked.has('ballista'))return dbg('[SHOP] unlock ballista before buying bolts');
  if(kind==='jars'&&!state.player.unlocked.has('sling'))return dbg('[SHOP] unlock sling before buying jars');
  if(kind==='pellets'&&!state.player.unlocked.has('pellets'))return dbg('[SHOP] unlock pellets before buying them');
  if(kind==='cannonballs'&&!state.player.unlocked.has('cannon'))return dbg('[SHOP] unlock cannon before buying cannonballs');
  if(['fire','ice','poison'].includes(kind)&&!state.player.unlockedElements.has(kind))return dbg(`[SHOP] unlock ${kind} before buying charges`);
  const cost=consumablePrice(kind);if(cost===undefined)return;if(state.diamonds<cost)return dbg(`[SHOP] need ${cost}♦ for ${kind}`);state.diamonds-=cost;const key=purchaseKey(kind);state.shopPurchases[key]=(state.shopPurchases[key]||0)+1;
  if(heals[kind]){const before=state.player.hp;state.player.hp=Math.min(state.player.maxHp,state.player.hp+heals[kind]);dbg(`[HEAL] ${kind} +${(state.player.hp-before).toFixed(1)} HP; next ${consumablePrice(kind)}♦`);return;}
  if(kind==='antitoxin'){state.player.status.poison=0;return dbg('[SHOP] anti-toxin cleared poison');}
  if(kind==='cloak'){state.player.cloaks=(state.player.cloaks||0)+1;return dbg('[SHOP] elemental cloak +1');}
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
  let html=items.map(([kind,label])=>`<button type="button" data-buy="${kind}">${label} · ${consumablePrice(kind)}♦</button>`).join(' ');
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
function resurrect(){ dbg(`[DOWNFALL] run ${state.run} ended; upgrades persist, waves reset`); state.run++; state.player.x=MAP_CENTER.x; state.player.y=MAP_CENTER.y; state.player.vx=0; state.player.vy=0; state.player.maxHp=5+(metaFor('player').maxHp||0); state.player.hp=state.player.maxHp; state.player.status={}; state.player.weapon='club'; state.player.unlocked=new Set(['club']); state.player.unlockedElements=new Set(); state.player.shield=false; state.player.enchants={}; state.player.caltrops=0; state.player.decoys=0; state.player.cloaks=0; state.mount='foot'; state.enemies=[]; state.projectiles=[]; state.pickups=[]; state.ammo={arrows:0,bolts:0,jars:0,pellets:0,cannonballs:0}; state.elements={fire:0,ice:0,poison:0}; state.activeElement=null; state.deployables=[]; state.player.attackCooldown=0;state.player.attackCooldownTotal=0; const trust=state.finance.trust,liquidPay=Math.min(state.finance.debt,state.diamonds+state.finance.savings),remainingDebt=Math.max(0,state.finance.debt-liquidPay),trustCover=Math.min(remainingDebt,Math.floor(trust*0.1));state.finance={savings:0,debt:0,trust:Math.max(0,trust-trustCover),trustAvailable:0,amounts:{savings:5,loan:10,trust:5}};state.diamonds=0; state.pendingReward=null; state.offerNpc=null; state.currentZone=null; for(const z of zones) state.waves[z.id]={wave:1,spawned:false,cleared:false}; }
function randomPointInZone(zone){ for(let tries=0;tries<80;tries++){ const span=((zone.arc[1]-zone.arc[0]+12)%12)||12,h=(zone.arc[0]+Math.random()*span)%12,rr=zone.ring.min+(zone.ring.max-zone.ring.min)*(0.08+Math.random()*0.84),th=(h-3)*Math.PI/6,x=MAP_CENTER.x+Math.cos(th)*rr,y=MAP_CENTER.y+Math.sin(th)*rr; if(!collidesObstacle(x,y))return{x,y}; } return {x:state.player.x+80,y:state.player.y}; }
function spawnPointOuterEdge(zone,i,count){const span=((zone.arc[1]-zone.arc[0]+12)%12)||12,h=(zone.arc[0]+span*((i+0.5)/count))%12,rr=zone.ring.max-45-Math.random()*80,th=(h-3)*Math.PI/6;return{x:MAP_CENTER.x+Math.cos(th)*rr,y:MAP_CENTER.y+Math.sin(th)*rr};}
function enemyVariant(zone,wave,i){
  let glyph=zone.enemy||'😠',hpMul=1,powMul=1,kind=zone.id==='axe'?'spider':zone.id,weapon=null;
  if(zone.id==='orchard'&&wave>1&&i%3===0){glyph='🐿️';hpMul=.65;powMul=.9;kind='squirrel';}
  if(zone.id==='creek'&&wave>1&&i%4===0){glyph='🐢';hpMul=2.6;powMul=1.8;kind='turtle';}
  if(zone.id==='axe'&&wave>1&&i%3===0){glyph='🦌';hpMul=1.2;powMul=1.3;kind='deer';}
  if(zone.id==='fletcher'){
    const opts=wave<2?['🐦‍⬛']:wave<4?['🐦‍⬛','🦃']:['🐦‍⬛','🦃','🦅'];
    glyph=opts[i%opts.length];kind=glyph==='🦅'?'eagle':glyph==='🦃'?'turkey':'crow';
    hpMul=glyph==='🦃'?2.4:glyph==='🐦‍⬛'?.75:1;powMul=glyph==='🦅'?1.8:glyph==='🦃'?1.7:.8;
  }
  if(zone.id==='smith'){glyph='♙';kind='pawn';weapon=wave>3?'🏹':wave>2?'🗡️':wave>1?'🪓':null;}
  if(zone.id==='pasture'&&wave>1&&i%3===0){glyph='🐇';hpMul=.45;powMul=.75;kind='rabbit';}
  if(zone.id==='inn'){glyph='🤢';kind='innDrunk';hpMul=1.15;powMul=1.25;}
  if(zone.id==='casino'){glyph='🤢';kind='casinoDrunk';hpMul=1.05;powMul=1.2;}
  const treeZones=new Set(['orchard','axe','fletcher','sawmill']);
  if(wave>=3&&treeZones.has(zone.id)&&kind!=='squirrel'&&i%6===5){glyph='🐿️';hpMul=.72;powMul=.95;kind='squirrel';}
  return{glyph,hpMul,powMul,kind,weapon};
}
function spawnWave(zone){
  const wave=state.waves[zone.id]?.wave||1,radTier=zone.ring.min/RADIUS_UNIT,difficulty=Math.pow(1.65,radTier),enemyPower=1.25*Math.pow(2.15,radTier)*Math.pow(1.1,wave*3);
  state.waves[zone.id].spawned=true;
  const count=6+Math.min(24,Math.floor(wave*1.25+radTier*2.1));
  let hp=5*difficulty*(1+wave*0.08);if(zone.id==='orchard')hp*=0.83;if(zone.id==='fletcher')hp*=0.55;
  for(let i=0;i<count;i++){
    const pt=spawnPointOuterEdge(zone,i,count),v=enemyVariant(zone,wave,i);
    state.enemies.push({x:pt.x,y:pt.y,hp:hp*v.hpMul,maxHp:hp*v.hpMul,status:{},glyph:v.glyph,kind:v.kind,weapon:v.weapon,zone:zone.id,wave,minR:zone.ring.min,vx:0,vy:0,bounty:1+Math.floor((wave-1)/2)+Math.floor(radTier/2),hop:Math.random()*0.8,power:enemyPower*v.powMul,shotT:1+Math.random()*2});
  }
  dbg(`[WAVE] ${zone.name} wave ${wave} enemies=${count} hp=${hp.toFixed(1)} power=${enemyPower.toFixed(2)}`);
}
function completeWave(zone){ const waveState=state.waves[zone.id]; if(!waveState||waveState.cleared) return; waveState.cleared=true;if(zone.id==='bank'){if(state.finance.savings>0){const interest=Math.max(1,Math.floor(state.finance.savings*0.08));state.finance.savings+=interest;dbg(`[BANK] savings interest +${interest}♦`);}if(state.finance.trust>0){const interest=Math.max(1,Math.floor(state.finance.trust*0.08));state.finance.trust+=interest;state.finance.trustAvailable+=interest*2;dbg(`[BANK] trust interest +${interest}♦; withdrawal allowance +${interest*2}♦`);}} if(MINOR_ZONES.has(zone.id)){ const bonus=2+Math.floor((waveState.wave||1)/2); state.diamonds+=bonus; dbg(`[MINOR] ${zone.name} wave ${waveState.wave} +${bonus}♦`); waveState.wave++; waveState.spawned=false; waveState.cleared=false; return; } buildReward(zone); }
function resolveEnemySpacing(dt){ const p=state.player; const pr=state.mount==='horse'&&p.unlocked.has('horse')?28:18, er=16; for(let i=0;i<state.enemies.length;i++){ const e=state.enemies[i]; for(let j=i+1;j<state.enemies.length;j++){ const o=state.enemies[j], dx=o.x-e.x, dy=o.y-e.y, d=Math.hypot(dx,dy)||1, min=er*2; if(d<min){ const push=(min-d)*0.5, nx=dx/d, ny=dy/d; e.x-=nx*push; e.y-=ny*push; o.x+=nx*push; o.y+=ny*push; } } const dx=p.x-e.x, dy=p.y-e.y, d=Math.hypot(dx,dy)||1, min=pr+er; if(d<min&&(e.stun||0)<=0&&(e.knockbackT||0)<=0){ const nx=dx/d, ny=dy/d, push=min-d; e.x-=nx*push*0.65; e.y-=ny*push*0.65; p.x+=nx*push*0.35; p.y+=ny*push*0.35; p.vx+=nx*18; p.vy+=ny*18; let hit=(0.7+0.55*Math.sqrt(e.power||1))*dt*(e.kind==='turtle'||e.kind==='turkey'?1.7:e.kind==='eagle'?1+Math.min(1.5,Math.hypot(e.vx||0,e.vy||0)/260):1); if(p.shield){const sh=metaFor('shield'),chance=Math.min(0.75,0.3+(sh.blockChance||0)*0.05),block=Math.min(0.8,0.3+(sh.blockAmount||0)*0.05); if(Math.random()<chance){hit*=1-block;p.vx+=nx*22;p.vy+=ny*22;e.vx-=nx*22;e.vy-=ny*22;dbg(`[SHIELD] blocked ${(block*100).toFixed(0)}% contact damage`);}} p.hp=Math.max(0,p.hp-hit); if(e.kind==='spider'||e.kind==='snake'||e.zone==='swamp'||e.zone==='marsh')addStatus(p,'poison',0.02*(e.power||1)); } } }
function getZone(x,y){const dx=x-MAP_CENTER.x,dy=y-MAP_CENTER.y,r=Math.hypot(dx,dy),h=toClockHour(Math.atan2(dy,dx)); return zones.find(z=>r>=z.ring.min&&r<z.ring.max&&inArc(h,z.arc))||null;}
function projectWorld(wx,wy){ const dx=wx-state.camera.x, dy=wy-state.camera.y; const pxPerWorld=0.55; return {x:innerWidth*0.5 + dx*pxPerWorld, y:innerHeight*0.5 + dy*pxPerWorld, scale:1}; }

function spawnZoneDecor(z){
  const cfg={bank:{n:20,g:['🏦','🪨']},tanner:{n:24,g:['🧵','🪵']},inn:{n:18,g:['🏠','🍲']},casino:{n:18,g:['🎰','🃏']},farrier:{n:24,g:['🧲','🪨']},armorer:{n:28,g:['🛡️','🧱']},orchard:{n:48,g:['🌳','🌳','🌲'],uniform:true},axe_grove:{n:70,g:['🌲','🌲','🌲','🌲','🌲','🌳']},sawmill:{n:720,g:['🌲','🌳','🌴','🌲','🌲','🌳']},smith:{n:90,g:['🧱']},fletcher:{n:25,g:['🧱','🌲']},foundry:{n:35,g:['🧱','🪨']},mine:{n:80,g:['🪨']},frost:{n:70,g:['🪨']},marches:{n:45,g:['♜']},desert:{n:55,g:['🌵']},creek:{n:18,g:['🌲']},swamp:{n:18,g:['🌲']},pasture:{n:8,g:['🌿']},marsh:{n:14,g:['🌿']},volcano:{n:16,g:['🪨']},snow:{n:10,g:['🪨']}}[z.deco]||{n:8,g:['🌿']};
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

function resetWorld(){const s={x:MAP_CENTER.x,y:MAP_CENTER.y};state.player={x:s.x,y:s.y,vx:0,vy:0,hp:5+(metaFor('player').maxHp||0),maxHp:5+(metaFor('player').maxHp||0),status:{},weapon:'club',unlocked:new Set(['club']),unlockedElements:new Set(),shield:false,enchants:{},swing:0,swingSerial:0,attackCooldown:0,attackCooldownTotal:0,cannonCooldown:0,lastX:s.x,lastY:s.y}; state.mount='foot'; state.ammo={arrows:0,bolts:0,jars:0,pellets:0,cannonballs:0}; state.slingMode='rock'; state.arrowMode='regular'; state.elements={fire:0,ice:0,poison:0}; state.activeElement=null; state.projectiles=[];state.pickups=[];state.enemies=[];state.terrain=[];state.hazards=[];state.deployables=[];state.waves={};state.pendingReward=null;state.offerNpc=null;state.currentZone=null;state.finance={savings:0,debt:0,trust:0,trustAvailable:0,amounts:{savings:5,loan:10,trust:5}};state.casinoWagers={coin:1,dice:1,card:1};state.shopPurchases={}; for(const z of zones){state.waves[z.id]={wave:1,spawned:false,cleared:false};spawnZoneDecor(z);} spawnNaturalBarriers(); }

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

function enemyMotionProfile(e){
  const tier=Math.max(0,Math.min(5,Math.round((e.minR||0)/RADIUS_UNIT)));
  const ringTop=[112,166,192,388,426,458][tier];
  const profiles={
    orchard:{top:112,cruise:0.9,fast:520,slow:12,brake:820,turn:690},
    creek:{top:178,cruise:0.82,fast:760,slow:25,brake:900,turn:760,hop:true},
    pasture:{top:192,cruise:0.88,fast:760,slow:18,brake:980,turn:820},
    pawn:{top:188,cruise:0.9,fast:690,slow:14,brake:920,turn:760},
    crow:{top:276,cruise:0.84,fast:620,slow:12,brake:90,turn:185,flying:true},
    turkey:{top:168,cruise:0.9,fast:455,slow:9,brake:78,turn:145,flying:true},
    eagle:{top:334,cruise:0.82,fast:560,slow:11,brake:105,turn:170,flying:true},
    squirrel:{top:210,cruise:0.86,fast:820,slow:22,brake:1080,turn:940},
    turtle:{top:104,cruise:0.92,fast:300,slow:7,brake:620,turn:480},
    deer:{top:266,cruise:0.84,fast:620,slow:12,brake:860,turn:660},
    rabbit:{top:248,cruise:0.84,fast:920,slow:24,brake:1180,turn:980},
    innDrunk:{top:445,cruise:0.9,fast:1180,slow:36,brake:1320,turn:1040},
    casinoDrunk:{top:460,cruise:0.88,fast:1220,slow:38,brake:1360,turn:1080},
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
  if((e.wave||1)<2)return;
  const p=state.player,dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
  let glyph=null,size=13,damage=0.7,knock=1.2,speed=220,vx=ux*speed,vy=uy*speed,life=2.4,color='#6b4525';
  if(e.kind==='squirrel'){glyph='🌰';size=14;damage=.65;knock=1.5;speed=230;vx=ux*speed;vy=uy*speed;e.shotT=2.1+Math.random()*1.8;}
  else if(['crow','turkey','eagle'].includes(e.kind)){glyph='●';size=8;color='#fff';damage=e.kind==='eagle'?1.25:.65;knock=.6;vx=(e.vx||0)*.82+ux*105;vy=(e.vy||0)*.82+uy*105;e.shotT=1.8+Math.random()*2.4;}
  else if(e.kind==='casinoDrunk'){glyph=Math.random()<.5?'♦':'🎲';size=16;color='#eee';damage=1.15;knock=1.1;speed=265;vx=ux*speed;vy=uy*speed;e.shotT=1.4+Math.random()*1.5;}
  else if(e.kind==='innDrunk'){glyph='🍾';size=17;color='#78a66d';damage=1.3;knock=1.4;speed=245;vx=ux*speed;vy=uy*speed;e.shotT=1.7+Math.random()*1.7;}
  else return;
  state.projectiles.push({x:e.x+ux*18,y:e.y+uy*18,vx,vy,life,glyph,size,damage,knock,pierce:1,damageMult:1,angle:Math.atan2(vy,vx),speed:Math.hypot(vx,vy),source:`enemy ${e.kind}`,hostile:true,color});
}

function update(dt){const p=state.player; let dx=(state.keys.has('d')?1:0)-(state.keys.has('a')?1:0),dy=(state.keys.has('s')?1:0)-(state.keys.has('w')?1:0); const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;
  const zone=getZone(p.x,p.y), flow=riverPushAt(p.x,p.y), snowflakes=coldSnowflakePositions(); state.lastWater=flow.type?`${flow.type} d=${flow.d.toFixed(0)} push=${Math.hypot(flow.x,flow.y).toFixed(0)}`:'dry'; if(flow.damage)p.hp=Math.max(0,p.hp-flow.damage*dt); tickStatus(p,dt,true); applyEnvironmentalHazards(p,dt); applyColdSnowflakes(p,dt,snowflakes); if(state.pendingReward&&zone?.id!==state.pendingReward.zone){dbg(`[SHOP] left ${state.pendingReward.zone}; dialogue closed; next wave queued`);queueNextWaveFromReward('LEAVE',true);} if(zone?.id!==state.currentZone){state.currentZone=zone?.id||null; if(zone)dbg(`[ZONE] entered ${zone.name} wave=${state.waves[zone.id]?.wave||1} spawned=${!!state.waves[zone.id]?.spawned}`);} const horseEq=state.mount==='horse'&&p.unlocked.has('horse')&&!['cannon','ballista'].includes(p.weapon); const horse=metaFor('horse'); const foot=metaFor('foot'); const speed=horseEq?2.25*(1+horse.speed*0.1):1*(1+(foot.speed||0)*0.1),accel=horseEq?4.8*(1+horse.accel*0.1):7.5*(1+(foot.accel||0)*0.1);
  const baseSpeed = (12 * RADIUS_UNIT) / 60; // 12 radii per minute
  const outx=(p.x-MAP_CENTER.x)/(Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y)||1),outy=(p.y-MAP_CENTER.y)/(Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y)||1),radial=dx*outx+dy*outy,ringProgress=zone?Math.max(0,Math.min(1,(Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y)-zone.ring.min)/(zone.ring.max-zone.ring.min))):0,frontier=Math.max(0,(ringProgress-0.68)/0.32),liveEnemies=zone?state.enemies.filter(e=>e.zone===zone.id&&e.hp>0):[],blockers=liveEnemies.filter(e=>{const er=Math.hypot(e.x-MAP_CENTER.x,e.y-MAP_CENTER.y),pr=Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y);return er>pr;}).length,pressure=Math.min(1,blockers/Math.max(2,liveEnemies.length*0.55)),radialMove=radial>0?Math.max(0.7,0.95-0.25*frontier*pressure):radial<0?1.05:1,groundSlow=zone?.id==='marsh'?(horseEq?0.32:0.52):1; const tvx=dx*baseSpeed*speed*flow.slow*groundSlow*radialMove,tvy=dy*baseSpeed*speed*flow.slow*groundSlow*radialMove; p.vx+=(tvx-p.vx)*Math.min(1,accel*dt); p.vy+=(tvy-p.vy)*Math.min(1,accel*dt);
  const nx=p.x+(p.vx+flow.x)*dt, ny=p.y+(p.vy+flow.y)*dt; const block=collidesObstacle(nx,ny),nextZone=getZone(nx,ny); if(block||!nextZone){if(block?.stump){p.vx*=0.35;p.vy*=0.35;p.x=nx;p.y=ny;}else{p.vx*=0.2;p.vy*=0.2;}} else {p.x=nx;p.y=ny;}
  repelFromObstacle(p,horseEq?27:18); collectPickups();
  const rr=Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y); if(rr>WORLD_MAX_R-20){const s=(WORLD_MAX_R-20)/rr;p.x=MAP_CENTER.x+(p.x-MAP_CENTER.x)*s;p.y=MAP_CENTER.y+(p.y-MAP_CENTER.y)*s;p.vx=0;p.vy=0;}
  state.camera.x+=(p.x-state.camera.x)*0.1; state.camera.y+=(p.y-state.camera.y)*0.1;
  if(state.mouse.down)state.mouse.held+=dt; p.cannonCooldown=Math.max(0,(p.cannonCooldown||0)-dt); if(['bow','ballista','cannon'].includes(p.weapon))p.shield=false; if(['ballista','cannon'].includes(p.weapon))state.mount='foot';
  if(zone&&!state.pendingReward&&!state.waves[zone.id].spawned&&!state.waves[zone.id].cleared&&!state.enemies.some(e=>e.zone===zone.id&&e.hp>0))spawnWave(zone);
  p.attackCooldown=Math.max(0,(p.attackCooldown||0)-dt); if(p.swing>0){p.swing-=dt*3;doSwingDamage();} passiveMeleeContact(dt);
  for(const pr of state.projectiles){
    pr.vx*=Math.max(0,1-dt*0.45);pr.vy*=Math.max(0,1-dt*0.45);pr.speed=Math.hypot(pr.vx,pr.vy);if(pr.spin)pr.rotation=(pr.rotation||0)+pr.spin*dt;
    const nx=pr.x+pr.vx*dt,ny=pr.y+pr.vy*dt;
    if(collidesObstacle(nx,ny,{blockStumps:false})&&!pr.overStump){if(pr.shards)spawnShards(pr);dropRecoverable(pr);pr.life=0;continue;}
    pr.x=nx;pr.y=ny;pr.life-=dt;
    if(pr.life<=0){if(pr.shards){spawnShards(pr);pr.shards=false;}dropRecoverable(pr);}
  }
  state.projectiles=state.projectiles.filter(pr=>pr.life>0);
  for(const e of state.enemies){
    tickStatus(e,dt,false);applyEnvironmentalHazards(e,dt);applyColdSnowflakes(e,dt,snowflakes);
    const oldX=e.x,oldY=e.y;let target=p,targetDistance=Math.hypot(p.x-e.x,p.y-e.y);for(const item of state.deployables){if(item.type!=='decoy'||item.used)continue;const dd=Math.hypot(item.x-e.x,item.y-e.y);if(dd<targetDistance){target=item;targetDistance=dd;}}let ax=target.x-e.x,ay=target.y-e.y,d=Math.hypot(ax,ay)||1;const profile=enemyMotionProfile(e),ep=projectWorld(e.x,e.y),off=ep.x<-40||ep.x>innerWidth+40||ep.y<-40||ep.y>innerHeight+40;
    let dirX=ax/d,dirY=ay/d,top=profile.top,accelMul=off?1.55:1; e.shotT=(e.shotT||0)-dt;if(e.shotT<=0)fireEnemyProjectile(e);
    const playerR=Math.hypot(p.x-MAP_CENTER.x,p.y-MAP_CENTER.y);
    if(e.minR&&playerR<e.minR-20){
      e.wanderT=(e.wanderT||0)-dt;
      if(e.wanderT<=0||!e.wx){const wz=zones.find(z=>z.id===e.zone),pt=randomPointInZone(wz);e.wx=pt.x;e.wy=pt.y;e.wanderT=1.2+Math.random()*2.4;}
      const wx=e.wx-e.x,wy=e.wy-e.y,wd=Math.hypot(wx,wy)||1;dirX=wx/wd;dirY=wy/wd;top*=0.72;
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
    } else if(e.kind==='deer'){
      const er=Math.hypot(e.x-MAP_CENTER.x,e.y-MAP_CENTER.y)||1;if(d<260){dirX=ax/d;dirY=ay/d;top=profile.top;}else{dirX=(e.x-MAP_CENTER.x)/er;dirY=(e.y-MAP_CENTER.y)/er;top=205;}
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
    } else steerEnemy(e,dirX,dirY,top,profile,dt,accelMul);
    const ef=waterPushAt(e.x,e.y),nx=e.x+(e.vx+ef.x)*dt,ny=e.y+(e.vy+ef.y)*dt,obstacle=collidesObstacle(nx,ny,{blockStumps:false});
    if(obstacle){const side=e.avoidSide||(e.avoidSide=Math.random()<0.5?-1:1),heading=Math.atan2(e.vy||dirY,e.vx||dirX)+side*Math.PI/2;e.avoidX=Math.cos(heading);e.avoidY=Math.sin(heading);e.avoidT=0.65+Math.random()*0.45;e.vx=e.avoidX*profile.top*0.45;e.vy=e.avoidY*profile.top*0.45;}else{e.x=nx;e.y=ny;}
    const moved=Math.hypot(e.x-oldX,e.y-oldY);e.stuckTime=moved<0.35?(e.stuckTime||0)+dt:0;if(e.stuckTime>0.45){const side=e.avoidSide||(Math.random()<0.5?-1:1),heading=Math.atan2(dirY,dirX)+side*Math.PI/2;e.avoidX=Math.cos(heading);e.avoidY=Math.sin(heading);e.avoidT=0.9;e.stuckTime=0;e.x+=e.avoidX*8;e.y+=e.avoidY*8;}
    if(ef.damage)e.hp-=ef.damage*dt*0.35;
    const finalR=Math.hypot(e.x-MAP_CENTER.x,e.y-MAP_CENTER.y);if(e.minR&&finalR<e.minR){const sc=e.minR/Math.max(1,finalR);e.x=MAP_CENTER.x+(e.x-MAP_CENTER.x)*sc;e.y=MAP_CENTER.y+(e.y-MAP_CENTER.y)*sc;e.vx*=0.3;e.vy*=0.3;}
    for(const item of state.deployables){if(item.used)continue;const contact=Math.hypot(e.x-item.x,e.y-item.y);if(item.type==='caltrop'&&contact<22){e.hp-=2.5;e.vx=0;e.vy=0;e.stun=0.35;item.used=true;dbg(`[CALTROP] ${e.glyph} took 2.5 damage and lost momentum`);}else if(item.type==='decoy'&&contact<25){e.vx*=0.15;e.vy*=0.15;item.used=true;dbg(`[DECOY] ${e.glyph} knocked over the armor stand`);}}
    repelFromObstacle(e,16); confineEnemyRadius(e,playerR);
    if(e.zone==='creek'&&getZone(e.x,e.y)?.id!=='creek'){const cz=zones.find(z=>z.id==='creek'),pt=randomPointInZone(cz);e.x=pt.x;e.y=pt.y;e.vx=0;e.vy=0;}
  } state.deployables=state.deployables.filter(item=>!item.used); resolveEnemySpacing(dt); hitChecks(); if(p.hp<=0){resurrect();return;}
  if(zone&&!state.pendingReward&&!state.enemies.some(e=>e.zone===zone.id&&e.hp>0))completeWave(zone); }

function applyHit(target, weapon, scale=1){
  const knock=weapon.knock*scale, pierce=weapon.pierce*scale;
  if(target.type==='tree' && !target.stump){target.hp -= (knock*pierce)*0.08;}
  else if(target.type==='wall' && !target.stump){target.hp -= knock*0.12;}
  if(target.hp<=0 && !target.stump){target.stump=true;target.solid=true; target.type='stump'; target.glyph=(target.type==='wall'?'◼':'◼');}
}

function knockEnemy(e,angle,impulse){
  const nx=Math.cos(angle),ny=Math.sin(angle),kick=Math.min(14,impulse*0.045);
  e.vx=(e.vx||0)+nx*impulse;e.vy=(e.vy||0)+ny*impulse;e.x+=nx*kick;e.y+=ny*kick;
  e.knockbackT=Math.max(e.knockbackT||0,Math.min(0.42,0.1+impulse/620));
}
function passiveMeleeContact(dt){const p=state.player,w=effectiveWeapon(weaponDef());if(w.kind!=='swing')return; const a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),sx=p.x+Math.cos(a)*w.reach*0.75,sy=p.y+Math.sin(a)*w.reach*0.75; for(const e of state.enemies){const rel=Math.hypot((p.vx||0)-(e.vx||0),(p.vy||0)-(e.vy||0)); if(rel>35&&Math.hypot(e.x-sx,e.y-sy)<38&&state.t>(e.meleeTouch||0)){const spMul=Math.min(2.6,rel/150)*w.speedMult,dmg=w.damage*0.45*spMul*w.damageMult,kb=w.knock*spMul*14,ang=Math.atan2(e.y-p.y,e.x-p.x); e.hp-=dmg;e.hitT=state.t;e.lunge=5;knockEnemy(e,ang,kb);e.meleeTouch=state.t+0.32;dbg(`[TOUCH:${w.id}] dmg=${dmg.toFixed(2)} rel=${rel.toFixed(1)} hp=${e.hp.toFixed(2)}`);}}}

function doSwingDamage(){const p=state.player,w=effectiveWeapon(weaponDef());if(w.kind!=='swing')return; const a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2); const sx=p.x+Math.cos(a)*w.reach,sy=p.y+Math.sin(a)*w.reach;
 const swingSpeed = Math.hypot(state.player.vx,state.player.vy) + Math.hypot(state.mouse.x-innerWidth/2,state.mouse.y-innerHeight/2)*0.002;
 for(const e of state.enemies){if(e.swingHit!==p.swingSerial&&Math.hypot(e.x-sx,e.y-sy)<45){e.swingHit=p.swingSerial;const spMul=(1+Math.min(2,swingSpeed/220))*w.speedMult; const dmg=w.damage*spMul*w.damageMult; e.hp-=dmg; e.hitT=state.t;e.lunge=5; if(p.swingElement)addStatus(e,p.swingElement,1); const kb=w.knock*spMul*18; knockEnemy(e,a,kb); dbg(`[SWING:${w.id}] -> enemy ${e.glyph} dmg=${dmg.toFixed(2)} kb=${kb.toFixed(1)} hp=${e.hp.toFixed(2)} ang=${a.toFixed(2)}`);}}
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
        player.hp=Math.max(0,player.hp-dmg);const a=Math.atan2(pr.vy,pr.vx),impulse=pr.knock*spMul*8;player.vx+=Math.cos(a)*impulse;player.vy+=Math.sin(a)*impulse;pr.hit=true;pr.life=0;dbg(`[ENEMY SHOT] ${pr.source} dmg=${dmg.toFixed(2)} hp=${player.hp.toFixed(2)}`);
      }
      continue;
    }
    for(const e of state.enemies){
      if(e===pr.ignore||pr.life<=0)continue;
      if(Math.hypot(e.x-pr.x,e.y-pr.y)<22){
        const spMul=1+Math.min(3,pr.speed/320),cannon=pr.source==='cannon',dmg=pr.damage*spMul*(pr.damageMult||1);
        e.hp-=dmg;e.hitT=state.t;e.lunge=5;if(pr.element)addStatus(e,pr.element,1);
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
  state.enemies=state.enemies.filter(e=>{
    if(e.hp>0)return true;
    let bounty=(e.bounty||2)+(metaFor('bank').bounty||0);const jp=metaFor('casino').jackpot||0;
    if(jp&&Math.random()<Math.min(.25,.015*jp)){const bonus=bounty*(3+jp);bounty+=bonus;dbg(`[JACKPOT] ${e.glyph} +${bonus}♦`);}
    const debtPay=Math.min(bounty,state.finance.debt);state.finance.debt-=debtPay;bounty-=debtPay;state.diamonds+=bounty;dbg(`[BOUNTY] ${e.glyph} +${bounty}♦${debtPay?` · debt -${debtPay}♦`:''} total=${state.diamonds}`);return false;
  });
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
  const h=Math.min(1,state.mouse.held/1.5);let a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),sp=projectileLaunchSpeed(w,h);
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
    if(state.slingMode==='pellet'){if(state.ammo.pellets<=0){dbg('[AMMO] unlock pellets at the Farrier, then buy them in Smith Town');return;}state.ammo.pellets--;glyph='●';size=10;damage=6;knock=5.2;pierce=3.8;color='#111';recoverable='pellets';}
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
function drawHeldWeapon(w, aim){ const hold=Math.min(1,state.mouse.held/1.5), swingViz=(w.id==='club'||w.kind==='swing')?Math.sin((1-Math.max(0,state.player.swing))*Math.PI*2.4)*0.9*Math.max(0,state.player.swing):0, wob=(w.id==='bow'&&state.mouse.down)?Math.sin(state.t*20)*Math.max(0,state.mouse.held-0.7)*0.12:0; const gw=21,gh=16.5,pts=weaponGlyphPoints[w.id]||{},hp=cellPoint(pts.handleCell,gw,gh),tp=cellPoint(pts.tipCell,gw,gh),glyphAngle=Math.atan2(tp.y-hp.y,tp.x-hp.x); ctx.rotate(aim+swingViz+wob); ctx.translate(10,0); ctx.rotate(-glyphAngle); ctx.translate(-hp.x,-hp.y); drawWeaponVisual(w,gw,gh,(w.id==='bow'&&state.mouse.down)?hold:0.45); }


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
  const entries=[...weapons.filter(w=>state.player.unlocked.has(w.id)).map(w=>({slot:weapons.indexOf(w)+1,glyph:w.id==='club'?'┃':w.glyph,active:w.id===state.player.weapon})),{slot:8,glyph:'✣',count:state.player.caltrops||0},{slot:9,glyph:'🛡️',count:state.player.decoys||0}];
  const cell=54,total=entries.length*cell,x0=innerWidth/2-total/2,y=innerHeight-38;ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='12px sans-serif';
  entries.forEach((entry,i)=>{
    const x=x0+i*cell+cell/2,left=x-23,top=y-25,width=46,height=48;
    ctx.beginPath();ctx.roundRect(left,top,width,height,8);
    if(entry.active){
      const totalCooldown=Math.max(.001,state.player.attackCooldownTotal||weaponDef().cooldown||.5),ready=Math.max(0,Math.min(1,1-(state.player.attackCooldown||0)/totalCooldown));
      ctx.fillStyle='rgba(184,42,42,.94)';ctx.fill();
      ctx.save();ctx.beginPath();ctx.roundRect(left,top,width,height,8);ctx.clip();ctx.fillStyle='rgba(42,154,73,.94)';ctx.fillRect(left,top+height*(1-ready),width,height*ready);ctx.restore();
    }else{ctx.fillStyle='rgba(0,0,0,.62)';ctx.fill();}
    ctx.strokeStyle=entry.active?'#fff':'#ffffff55';ctx.lineWidth=entry.active?3:1;ctx.beginPath();ctx.roundRect(left,top,width,height,8);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.fillText(String(entry.slot),x-16,y-16);ctx.font='22px serif';ctx.fillText(entry.glyph,x,y+3);
    if(entry.count!==undefined){ctx.font='11px sans-serif';ctx.fillText(String(entry.count),x+16,y+16);}
  });ctx.restore();
}

function render(){ctx.clearRect(0,0,innerWidth,innerHeight); drawHexBackground(); drawRiver(); drawSlingCreek(); for(const f of coldSnowflakePositions()){const p=projectWorld(f.x,f.y);ctx.font='18px serif';ctx.fillStyle='#fff';ctx.fillText('❄️',p.x,p.y);}
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
 for(const e of state.enemies){const p=projectWorld(e.x,e.y);ctx.font='16px serif';ctx.fillStyle='#fff';ctx.fillText(e.glyph,p.x,p.y);if(e.weapon){ctx.font='12px serif';ctx.fillText(e.weapon,p.x+12,p.y-8);}drawStatusIcons(e,p.x,p.y);}
 for(const item of state.pickups){const q=projectWorld(item.x,item.y);ctx.fillStyle=item.color;ctx.font=item.ammo==='arrows'?'18px serif':'14px serif';if(item.ammo==='arrows')ctx.fillText(item.glyph,q.x,q.y);else{ctx.beginPath();ctx.arc(q.x,q.y,3.5,0,Math.PI*2);ctx.fill();}}
 for(const pr of state.projectiles){const p=projectWorld(pr.x,pr.y),a=pr.glyph==='triangle'?(pr.rotation||0):Math.atan2(pr.vy,pr.vx); ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle=pr.color||'#111'; if(pr.glyph==='triangle'){ctx.beginPath();ctx.moveTo(pr.size*0.7,0);ctx.lineTo(-pr.size*0.45,-pr.size*0.45);ctx.lineTo(-pr.size*0.45,pr.size*0.45);ctx.closePath();ctx.fill();} else if(pr.glyph!=='●'){ctx.font=`${pr.size}px serif`;ctx.fillText(pr.glyph,0,0);} else {ctx.beginPath();ctx.arc(0,0,pr.size*0.25,0,Math.PI*2);ctx.fill();} ctx.restore(); if(pr.element){ctx.font='13px serif';ctx.fillText(ELEMENT_GLYPHS[pr.element],p.x+9,p.y-10);}}
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
 ui.innerHTML=`<strong>${BUILD_VERSION}</strong><br>HP ${state.player.hp.toFixed(1)}/${state.player.maxHp} · ♦ ${state.diamonds}<br>Zone: ${z?z.name:'Boundary'} · R ${rad} · ${clock}:00<br>Weapon: ${w.id} · Mount: ${state.mount}<br>Ammo: ➵ ${state.ammo.arrows} · ➳ ${state.ammo.bolts} · 🏺 ${state.ammo.jars} · ● ${state.ammo.pellets} · ⚫ ${state.ammo.cannonballs}${modeBits.length?`<br>${modeBits.join('<br>')}`:''}${shopHtml}<br><button type="button" data-reset-world="1">Reset World</button>`;
 drawWeaponBar(); }

function useDeployable(type){const key=type==='caltrop'?'caltrops':'decoys',count=state.player[key]||0;if(count<=0){dbg(`[ITEM] no ${type}s available`);return;}const a=Math.atan2(state.mouse.y-innerHeight/2,state.mouse.x-innerWidth/2),distance=type==='decoy'?34:0;state.player[key]--;state.deployables.push({type,x:state.player.x+Math.cos(a)*distance,y:state.player.y+Math.sin(a)*distance,used:false});dbg(`[ITEM] deployed ${type}; ${state.player[key]} left`);}
function trig(){if(state.mouse.down||state.player.attackCooldown>0)return;state.mouse.down=true;state.mouse.held=0;const w=effectiveWeapon(weaponDef());if(w.kind==='swing'){state.player.swing=1;state.player.swingSerial=(state.player.swingSerial||0)+1;state.player.attackCooldown=(w.cooldown||0.34)*w.cooldownMult;state.player.attackCooldownTotal=state.player.attackCooldown;const el=state.player.enchants[state.player.weapon];state.player.swingElement=(state.activeElement===el&&state.elements[el]>0)?el:null;if(state.player.swingElement)state.elements[state.player.swingElement]--;}}
function rel(){if(!state.mouse.down)return; state.mouse.down=false; if(['bow','sling','cannon'].includes(weaponDef().id)||weaponDef().kind==='bow')fireCharge();}
function loop(ts){if(!state.last)state.last=ts;const dt=Math.min(0.033,(ts-state.last)/1000);state.last=ts;state.t+=dt;if(state.mode==='game'){const p=state.player;p.lastX=p.x;p.lastY=p.y;update(dt);render();}else if(state.mode==='glyph'){renderGlyphTest();}requestAnimationFrame(loop);}

function setMode(mode){state.mode=mode;menu.classList.toggle('hidden',mode!=='menu');ui.style.display=mode==='menu'?'none':'block';if(mode==='game'&&!state.player)resetWorld();if(mode==='glyph')menu.classList.add('hidden');}
menu.addEventListener('click',e=>{const mode=e.target.closest('[data-mode]')?.dataset.mode;if(mode)setMode(mode);});
function handleUiAction(e){const mode=e.target.closest('[data-mode]')?.dataset.mode; if(mode){e.preventDefault();e.stopPropagation();setMode(mode);return true;} const glyph=e.target.closest('[data-glyph-weapon]')?.dataset.glyphWeapon; if(glyph){e.preventDefault();e.stopPropagation();state.glyphWeapon=glyph;return true;} const reward=e.target.closest('[data-reward-index]'); if(reward){e.preventDefault();e.stopPropagation();chooseReward(Number(reward.dataset.rewardIndex));return true;} const buy=e.target.closest('[data-buy]'); if(buy){e.preventDefault();e.stopPropagation();buyItem(buy.dataset.buy);return true;} const financeAdjust=e.target.closest('[data-finance-adjust]');if(financeAdjust){e.preventDefault();e.stopPropagation();adjustFinance(financeAdjust.dataset.account,Number(financeAdjust.dataset.financeAdjust));return true;}const finance=e.target.closest('[data-finance]'); if(finance){e.preventDefault();e.stopPropagation();financeAction(finance.dataset.finance);return true;}const casinoAdjust=e.target.closest('[data-casino-adjust]');if(casinoAdjust){e.preventDefault();e.stopPropagation();adjustCasino(casinoAdjust.dataset.game,Number(casinoAdjust.dataset.casinoAdjust));return true;} const casino=e.target.closest('[data-casino]'); if(casino){e.preventDefault();e.stopPropagation();casinoAction(casino.dataset.casino);return true;} const el=e.target.closest('[data-element]'); if(el){e.preventDefault();e.stopPropagation();state.activeElement=state.activeElement===el.dataset.element?null:el.dataset.element;dbg(`[ELEMENT] applying ${state.activeElement||'none'}`);return true;} const sm=e.target.closest('[data-sling]'); if(sm){e.preventDefault();e.stopPropagation();state.slingMode=sm.dataset.sling;return true;} const ar=e.target.closest('[data-arrow]'); if(ar){e.preventDefault();e.stopPropagation();state.arrowMode=ar.dataset.arrow;return true;} const cm=e.target.closest('[data-cannon]'); if(cm){e.preventDefault();e.stopPropagation();state.cannonMode=cm.dataset.cannon;return true;} if(e.target.closest('[data-shield]')){e.preventDefault();e.stopPropagation();const p=state.player;if(!p.unlocked.has('shield'))dbg('[SHIELD] unlock shield at Armorer Court');else if(['bow','ballista','cannon'].includes(p.weapon))dbg('[SHIELD] cannot use shield with this weapon');else p.shield=!p.shield;return true;} if(e.target.closest('[data-enchant]')){e.preventDefault();e.stopPropagation();const p=state.player,el=state.activeElement,w=p.weapon;if(!['club','axe','sword'].includes(w))dbg('[ENCHANT] choose club, axe, or sword');else if(!el||!p.unlockedElements.has(el))dbg('[ENCHANT] choose an unlocked element');else if(Object.values(p.enchants).includes(el)&&p.enchants[w]!==el)dbg('[ENCHANT] that element is already bound');else{for(const k of Object.keys(p.enchants))if(p.enchants[k]===el)delete p.enchants[k];p.enchants[w]=el;dbg(`[ENCHANT] ${w} now carries ${el}`);}return true;} if(e.target.closest('[data-start-wave]')){e.preventDefault();e.stopPropagation();startNextWave();return true;} if(e.target.closest('[data-reset-world]')){e.preventDefault();e.stopPropagation();resetWorld();return true;} return false;}
ui.addEventListener('pointerdown',e=>{handleUiAction(e)||e.stopPropagation();});
ui.addEventListener('click',e=>{handleUiAction(e)||e.stopPropagation();});
ui.addEventListener('mousedown',e=>e.stopPropagation());
ui.addEventListener('mouseup',e=>e.stopPropagation());
addEventListener('resize',()=>{canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);});
addEventListener('keydown',e=>{const k=e.key.toLowerCase(); if(k==='escape'){setMode('menu');return;} if(state.mode!=='game')return; state.keys.add(k); if(state.pendingReward&&/[1-3]/.test(e.key)){chooseReward(Number(e.key)-1);return;} if(k===' ')trig(); if(k==='r')resetWorld(); if(k==='m')state.mount=(state.mount==='horse'?'foot':'horse'); if(k==='q'&&state.player.unlocked.has('shield')&&!['bow','ballista','cannon'].includes(state.player.weapon))state.player.shield=!state.player.shield; if(/[1-7]/.test(e.key)){const w=weapons[Number(e.key)-1];if(state.player.unlocked.has(w.id))state.player.weapon=w.id;}if(e.key==='8')useDeployable('caltrop');if(e.key==='9')useDeployable('decoy');});
addEventListener('keyup',e=>{if(state.mode!=='game')return; state.keys.delete(e.key.toLowerCase()); if(e.key===' ')rel();});
canvas.addEventListener('mousemove',e=>{state.mouse.x=e.clientX;state.mouse.y=e.clientY;});
canvas.addEventListener('mousedown',()=>{if(state.mode==='game')trig();}); addEventListener('mouseup',()=>{if(state.mode==='game')rel();});
canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
ui.style.display='none'; resetWorld(); requestAnimationFrame(loop);
