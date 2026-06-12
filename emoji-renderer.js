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
  function install(ctx){
    if(!ctx||ctx.__notoEmojiInstalled)return ctx;
    const nativeFillText=ctx.fillText.bind(ctx);ctx.__notoEmojiInstalled=true;
    ctx.fillText=function(text,x,y,maxWidth){
      const glyph=String(text);if(!shouldUseNoto(glyph))return maxWidth===undefined?nativeFillText(glyph,x,y):nativeFillText(glyph,x,y,maxWidth);
      const record=loadGlyph(glyph),size=fontPixels(ctx.font);
      if(record?.status==='ready'&&record.image){drawImageLikeText(ctx,rasterFor(record,size),x,y,size);return;}
      drawPlaceholder(ctx,nativeFillText,x,y,size,record?.status==='failed');
    };
    return ctx;
  }

  global.NotoEmojiRenderer={install,preload,status,shouldUseNoto,filenames,version:NOTO_VERSION,baseUrl:NOTO_BASE};
})(globalThis);
