(function(global){
  'use strict';

  const NOTO_VERSION = 'v2.051';
  const NOTO_BASE = `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@${NOTO_VERSION}/svg/`;
  const emojiRecords = new Map();
  const aliases = new Map([
    // Unicode has no dragonfly emoji yet. Keep the game free of tofu by using
    // the Noto fly artwork until DownFall gets a custom dragonfly asset.
    ['𓆦', '🪰'],
  ]);
  const emojiSequence = /^(?:(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji_Modifier}|\uFE0F|\u200D))+$/u;

  function canonicalGlyph(glyph){ return aliases.get(glyph) || glyph; }
  function codepoints(glyph, includeVariationSelectors=true){
    return Array.from(canonicalGlyph(glyph))
      .map(char=>char.codePointAt(0))
      .filter(code=>includeVariationSelectors || code!==0xfe0f)
      .map(code=>code.toString(16));
  }
  function filenames(glyph){
    const exact=codepoints(glyph,true),withoutVs=codepoints(glyph,false),names=[];
    if(exact.length)names.push(`emoji_u${exact.join('_')}.svg`);
    const simplified=`emoji_u${withoutVs.join('_')}.svg`;
    if(withoutVs.length&&!names.includes(simplified))names.push(simplified);
    return names;
  }
  function shouldUseNoto(glyph){
    if(typeof glyph!=='string'||!glyph)return false;
    return aliases.has(glyph)||emojiSequence.test(glyph);
  }
  function loadGlyph(glyph){
    if(!shouldUseNoto(glyph)||typeof Image==='undefined')return null;
    const key=canonicalGlyph(glyph);if(emojiRecords.has(key))return emojiRecords.get(key);
    const record={glyph:key,image:null,status:'loading',candidate:0,filenames:filenames(key)};
    emojiRecords.set(key,record);
    const tryNext=()=>{
      const filename=record.filenames[record.candidate++];
      if(!filename){record.status='failed';return;}
      const image=new Image();image.crossOrigin='anonymous';record.image=image;
      image.onload=()=>{record.status='ready';global.dispatchEvent?.(new CustomEvent('notoemoji:ready',{detail:{glyph:key}}));};
      image.onerror=tryNext;image.src=NOTO_BASE+filename;
    };
    tryNext();return record;
  }
  function fontPixels(font){const match=/(\d+(?:\.\d+)?)px/.exec(font||'');return match?Number(match[1]):16;}
  function drawPlaceholder(ctx,nativeFillText,x,y,size,failed=false){
    ctx.save();ctx.globalAlpha*=failed ? .72 : .28;ctx.fillStyle=failed?'#8b5f67':'#8fa4a0';ctx.beginPath();ctx.arc(x,y,Math.max(2,size*.2),0,Math.PI*2);ctx.fill();
    if(failed){ctx.fillStyle='#fff';ctx.font=`${Math.max(8,size*.42)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';nativeFillText('?',x,y);}
    ctx.restore();
  }
  function drawImageLikeText(ctx,image,x,y,size){
    let left=x,top=y;
    if(ctx.textAlign==='center')left-=size/2;else if(ctx.textAlign==='right'||ctx.textAlign==='end')left-=size;
    if(ctx.textBaseline==='middle')top-=size/2;
    else if(ctx.textBaseline==='bottom'||ctx.textBaseline==='ideographic')top-=size;
    else if(ctx.textBaseline==='alphabetic')top-=size*.82;
    ctx.drawImage(image,left,top,size,size);
  }
  function install(ctx){
    if(!ctx||ctx.__notoEmojiInstalled)return ctx;
    const nativeFillText=ctx.fillText.bind(ctx);ctx.__notoEmojiInstalled=true;
    ctx.fillText=function(text,x,y,maxWidth){
      const glyph=String(text);
      if(!shouldUseNoto(glyph))return maxWidth===undefined?nativeFillText(glyph,x,y):nativeFillText(glyph,x,y,maxWidth);
      const record=loadGlyph(glyph),size=fontPixels(ctx.font);
      if(record?.status==='ready'&&record.image){drawImageLikeText(ctx,record.image,x,y,size);return;}
      if(record?.status==='failed'){drawPlaceholder(ctx,nativeFillText,x,y,size,true);return;}
      drawPlaceholder(ctx,nativeFillText,x,y,size);
    };
    return ctx;
  }
  function preload(glyphs){for(const glyph of glyphs)loadGlyph(glyph);}
  function status(){
    const values=[...emojiRecords.values()];return{version:NOTO_VERSION,total:values.length,ready:values.filter(v=>v.status==='ready').length,failed:values.filter(v=>v.status==='failed').length};
  }

  global.NotoEmojiRenderer={install,preload,status,shouldUseNoto,filenames,version:NOTO_VERSION,baseUrl:NOTO_BASE};
})(globalThis);
