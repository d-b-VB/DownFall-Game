(function(global){
  'use strict';

  const NOTO_VERSION = 'v2.051';
  const NOTO_BASE = `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@${NOTO_VERSION}/svg/`;
  const MAX_CONCURRENT_LOADS = 6;
  const LOAD_TIMEOUT_MS = 8000;
  const emojiRecords = new Map();
  const loadQueue = [];
  let activeLoads = 0;
  const aliases = new Map([
    // Unicode has no dragonfly emoji yet. Keep the game free of tofu by using
    // the Noto fly artwork until DownFall gets a custom dragonfly asset.
    ['𓆦', '🪰'],
  ]);
  const emojiSequence = /^(?:(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji_Modifier}|\uFE0F|\u200D))+$/u;
  const chessPieces = new Map([['♙','pawn'],['♟','pawn'],['♘','knight'],['♞','knight'],['♗','bishop'],['♝','bishop'],['♖','rook'],['♜','rook'],['♕','queen'],['♛','queen'],['♔','king'],['♚','king']]);

  function emit(type,detail){
    if(typeof global.dispatchEvent!=='function'||typeof global.CustomEvent!=='function')return;
    global.dispatchEvent(new global.CustomEvent(type,{detail}));
  }
  function canonicalGlyph(glyph){return aliases.get(glyph)||glyph;}
  function codepoints(glyph,includeVariationSelectors=true){
    return Array.from(canonicalGlyph(glyph)).map(char=>char.codePointAt(0)).filter(code=>includeVariationSelectors||code!==0xfe0f).map(code=>code.toString(16));
  }
  function filenames(glyph){
    const exact=codepoints(glyph,true),withoutVs=codepoints(glyph,false),names=[];
    if(exact.length)names.push(`emoji_u${exact.join('_')}.svg`);
    const simplified=`emoji_u${withoutVs.join('_')}.svg`;
    if(withoutVs.length&&!names.includes(simplified))names.push(simplified);
    return names;
  }
  function shouldUseNoto(glyph){return typeof glyph==='string'&&glyph.length>0&&(aliases.has(glyph)||emojiSequence.test(glyph));}
  function status(){
    const values=[...emojiRecords.values()];
    return{version:NOTO_VERSION,total:values.length,queued:values.filter(v=>v.status==='queued').length,loading:values.filter(v=>v.status==='loading').length,ready:values.filter(v=>v.status==='ready').length,failed:values.filter(v=>v.status==='failed').length};
  }
  function reportProgress(){emit('notoemoji:progress',status());}
  function finishRecord(record,statusValue){
    record.status=statusValue;activeLoads=Math.max(0,activeLoads-1);record.resolve(record);reportProgress();pumpQueue();
  }
  function tryCandidate(record){
    const filename=record.filenames[record.candidate++];
    if(!filename){finishRecord(record,'failed');return;}
    const image=new Image();let settled=false;
    const timer=global.setTimeout?.(()=>{if(settled)return;settled=true;image.src='';tryCandidate(record);},LOAD_TIMEOUT_MS);
    const settle=fn=>{if(settled)return;settled=true;if(timer)global.clearTimeout?.(timer);fn();};
    image.crossOrigin='anonymous';
    image.onload=()=>settle(()=>{record.image=image;finishRecord(record,'ready');emit('notoemoji:ready',{glyph:record.glyph});});
    image.onerror=()=>settle(()=>tryCandidate(record));
    image.src=NOTO_BASE+filename;
  }
  function pumpQueue(){
    while(activeLoads<MAX_CONCURRENT_LOADS&&loadQueue.length){const record=loadQueue.shift();if(record.status!=='queued')continue;record.status='loading';activeLoads++;tryCandidate(record);}
    reportProgress();
  }
  function loadGlyph(glyph){
    if(!shouldUseNoto(glyph)||typeof Image==='undefined')return null;
    const key=canonicalGlyph(glyph);if(emojiRecords.has(key))return emojiRecords.get(key);
    let resolve;const promise=new Promise(done=>{resolve=done;});
    const record={glyph:key,image:null,status:'queued',candidate:0,filenames:filenames(key),rasters:new Map(),promise,resolve};
    emojiRecords.set(key,record);loadQueue.push(record);pumpQueue();return record;
  }
  function preload(glyphs){
    const records=[...new Set(glyphs)].map(loadGlyph).filter(Boolean);
    reportProgress();return Promise.all(records.map(record=>record.promise)).then(()=>status());
  }
  function fontPixels(font){const match=/(\d+(?:\.\d+)?)px/.exec(font||'');return match?Number(match[1]):16;}
  function drawPlaceholder(ctx,nativeFillText,x,y,size,failed=false){
    ctx.save();ctx.globalAlpha*=failed ? .72 : .28;ctx.fillStyle=failed?'#8b5f67':'#8fa4a0';ctx.beginPath();ctx.arc(x,y,Math.max(2,size*.2),0,Math.PI*2);ctx.fill();
    if(failed){ctx.fillStyle='#fff';ctx.font=`${Math.max(8,size*.42)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';nativeFillText('?',x,y);}
    ctx.restore();
  }
  function rasterFor(record,size){
    const rasterSize=Math.max(8,Math.ceil(size/2)*2),cached=record.rasters.get(rasterSize);if(cached)return cached;
    let raster=null;
    if(typeof OffscreenCanvas==='function')raster=new OffscreenCanvas(rasterSize,rasterSize);
    else if(global.document?.createElement){raster=global.document.createElement('canvas');raster.width=rasterSize;raster.height=rasterSize;}
    if(!raster)return record.image;
    raster.width=rasterSize;raster.height=rasterSize;const rasterCtx=raster.getContext('2d');rasterCtx.clearRect(0,0,rasterSize,rasterSize);rasterCtx.drawImage(record.image,0,0,rasterSize,rasterSize);record.rasters.set(rasterSize,raster);return raster;
  }
  function drawImageLikeText(ctx,image,x,y,size){
    let left=x,top=y;if(ctx.textAlign==='center')left-=size/2;else if(ctx.textAlign==='right'||ctx.textAlign==='end')left-=size;
    if(ctx.textBaseline==='middle')top-=size/2;else if(ctx.textBaseline==='bottom'||ctx.textBaseline==='ideographic')top-=size;else if(ctx.textBaseline==='alphabetic')top-=size*.82;
    ctx.drawImage(image,left,top,size,size);
  }
  function textBoxCenter(ctx,x,y,size){
    let left=x,top=y;if(ctx.textAlign==='center')left-=size/2;else if(ctx.textAlign==='right'||ctx.textAlign==='end')left-=size;
    if(ctx.textBaseline==='middle')top-=size/2;else if(ctx.textBaseline==='bottom'||ctx.textBaseline==='ideographic')top-=size;else if(ctx.textBaseline==='alphabetic')top-=size*.82;
    return{x:left+size/2,y:top+size/2};
  }
  function drawChessPiece(ctx,glyph,x,y,size){
    const type=chessPieces.get(glyph);if(!type)return false;
    const center=textBoxCenter(ctx,x,y,size),white='♙♘♗♖♕♔'.includes(glyph);
    ctx.save();ctx.translate(center.x,center.y);ctx.scale(size/32,size/32);ctx.fillStyle=white?'#f5f1df':'#17191b';ctx.strokeStyle=white?'#25292c':'#ece7d8';ctx.lineWidth=1.6;ctx.lineJoin='round';ctx.lineCap='round';
    const fillStroke=()=>{ctx.fill();ctx.stroke();};
    ctx.beginPath();ctx.roundRect(-11,11,22,4,1.5);fillStroke();ctx.beginPath();ctx.roundRect(-8,7,16,4,1.2);fillStroke();
    if(type==='pawn'){ctx.beginPath();ctx.moveTo(-7,7);ctx.quadraticCurveTo(-5,-2,-2,-4);ctx.lineTo(2,-4);ctx.quadraticCurveTo(5,-2,7,7);ctx.closePath();fillStroke();ctx.beginPath();ctx.arc(0,-8,5,0,Math.PI*2);fillStroke();}
    else if(type==='rook'){ctx.beginPath();ctx.moveTo(-7,7);ctx.lineTo(-6,-5);ctx.lineTo(6,-5);ctx.lineTo(7,7);ctx.closePath();fillStroke();ctx.beginPath();ctx.moveTo(-8,-5);ctx.lineTo(-8,-12);ctx.lineTo(-4,-12);ctx.lineTo(-4,-8);ctx.lineTo(-1,-8);ctx.lineTo(-1,-12);ctx.lineTo(2,-12);ctx.lineTo(2,-8);ctx.lineTo(5,-8);ctx.lineTo(5,-12);ctx.lineTo(8,-12);ctx.lineTo(8,-5);ctx.closePath();fillStroke();}
    else if(type==='bishop'){ctx.beginPath();ctx.moveTo(-7,7);ctx.quadraticCurveTo(-5,-1,0,-5);ctx.quadraticCurveTo(5,-1,7,7);ctx.closePath();fillStroke();ctx.beginPath();ctx.arc(0,-9,5.5,0,Math.PI*2);fillStroke();ctx.beginPath();ctx.moveTo(-1,-13);ctx.lineTo(2,-6);ctx.stroke();}
    else if(type==='knight'){ctx.beginPath();ctx.moveTo(-7,7);ctx.quadraticCurveTo(-6,0,-2,-3);ctx.lineTo(-5,-8);ctx.lineTo(1,-14);ctx.lineTo(7,-10);ctx.lineTo(5,-5);ctx.lineTo(8,1);ctx.lineTo(4,4);ctx.lineTo(7,7);ctx.closePath();fillStroke();ctx.beginPath();ctx.arc(2,-9,1,0,Math.PI*2);ctx.fillStyle=white?'#25292c':'#ece7d8';ctx.fill();}
    else{ctx.beginPath();ctx.moveTo(-7,7);ctx.quadraticCurveTo(-6,-2,-3,-5);ctx.lineTo(3,-5);ctx.quadraticCurveTo(6,-2,7,7);ctx.closePath();fillStroke();ctx.beginPath();ctx.arc(0,-8,4.5,0,Math.PI*2);fillStroke();ctx.beginPath();if(type==='king'){ctx.moveTo(0,-16);ctx.lineTo(0,-10);ctx.moveTo(-3,-13);ctx.lineTo(3,-13);}else{for(let i=-1;i<=1;i++){ctx.moveTo(i*5,-13);ctx.lineTo(i*4,-8);}}ctx.stroke();}
    ctx.restore();return true;
  }
  function install(ctx){
    if(!ctx||ctx.__notoEmojiInstalled)return ctx;
    const nativeFillText=ctx.fillText.bind(ctx);ctx.__notoEmojiInstalled=true;
    ctx.fillText=function(text,x,y,maxWidth){
      const glyph=String(text),size=fontPixels(ctx.font);if(drawChessPiece(ctx,glyph,x,y,size))return;if(!shouldUseNoto(glyph))return maxWidth===undefined?nativeFillText(glyph,x,y):nativeFillText(glyph,x,y,maxWidth);
      const record=loadGlyph(glyph);
      if(record?.status==='ready'&&record.image){drawImageLikeText(ctx,rasterFor(record,size),x,y,size);return;}
      drawPlaceholder(ctx,nativeFillText,x,y,size,record?.status==='failed');
    };
    return ctx;
  }

  global.NotoEmojiRenderer={install,preload,status,shouldUseNoto,filenames,version:NOTO_VERSION,baseUrl:NOTO_BASE};
})(globalThis);
