/* Study v014 — W tab with exact source wallpaper + template gallery. */
(function(){
  var css = `
#wallpaperStudio{display:block}
.w-slot{min-width:0}.w-slot select{max-width:100%}.w-slot+.w-slot{margin-top:8px}.w-clock-slots{margin-top:16px}.w-clock-slots h4{margin:0 0 6px}.w-clock-slots p{margin:0 0 8px}
.w-zone{background:var(--paper);border:2.5px solid var(--edge);border-radius:22px;box-shadow:var(--shadow);padding:16px;margin-bottom:16px}
.w-zone h3,.w-zone h4{margin:0 0 8px;font-family:var(--brand)}
.w-lead{color:var(--muted);margin:0 0 12px;line-height:1.45}
.w-mode-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.w-mode{display:flex;align-items:center;justify-content:center;gap:8px;min-height:56px;border:2px solid var(--edge);border-radius:18px;background:var(--paper2);box-shadow:0 3px 0 rgba(0,0,0,.16);font:800 17px/1 var(--brand)}
.w-mode.on{background:var(--y)}
.w-grid{display:grid;grid-template-columns:1fr;gap:14px}
.w-slot{background:var(--paper2);border:1.5px dashed var(--line);border-radius:18px;padding:12px}
.w-slot label{display:block;font-size:12px;font-weight:800;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:7px}
.w-slot select{width:100%;padding:12px 14px;border:2px solid var(--edge);border-radius:14px;background:var(--paper);color:var(--ink);font-size:15px}
.w-pill{display:inline-flex;align-items:center;gap:8px;border:1.5px solid var(--line);background:var(--paper2);border-radius:999px;padding:8px 12px;font-size:13px;color:var(--muted)}
.w-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.w-btn{appearance:none;border:2px solid var(--edge);background:var(--y);color:#241a16;border-radius:16px;min-height:50px;padding:10px 14px;box-shadow:0 4px 0 rgba(0,0,0,.22);font:800 15px/1.1 var(--brand)}
.w-btn.sec{background:var(--paper)}
.w-btn[disabled]{opacity:.45;filter:saturate(.5);box-shadow:none}
.w-preview-wrap{display:grid;gap:12px}
.w-preview{width:100%;max-width:330px;border-radius:28px;border:3px solid var(--edge);box-shadow:0 12px 30px rgba(0,0,0,.18);background:#f4d02c}
.w-catalog{font-size:12px;color:var(--muted);line-height:1.5}
.w-note{margin-top:10px;font-size:12.5px;line-height:1.45;color:var(--muted)}
.w-ok{margin-top:10px;color:#2d6b4a;font-weight:700;min-height:1.4em}
.w-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.w-tpl{border:2px solid var(--line);border-radius:16px;background:var(--paper2);padding:8px;box-shadow:0 2px 0 rgba(0,0,0,.12);text-align:left}
.w-tpl.on{border-color:var(--edge);background:#fff7db;box-shadow:0 0 0 2px rgba(255,200,0,.3) inset}
.w-tpl img{width:100%;aspect-ratio:9/19.5;object-fit:cover;border-radius:12px;display:block;background:#111}
.w-tpl b{display:block;margin:8px 2px 2px;font-size:12.5px;line-height:1.2}
.w-tpl span{display:block;margin:0 2px 2px;font-size:11px;color:var(--muted);line-height:1.3}
.w-source{display:grid;gap:10px;grid-template-columns:1fr 1fr}
.w-badge{display:inline-block;border-radius:999px;background:#fff2b8;border:1.5px solid #d7b547;padding:4px 10px;font-size:11px;font-weight:800;margin-left:8px}
@media(min-width:760px){.w-grid{grid-template-columns:1.1fr .9fr}.w-preview-wrap{align-items:start;justify-items:center}.w-gallery{grid-template-columns:repeat(4,minmax(0,1fr))}}
`; 
  var st=document.createElement('style'); st.id='study-v014-w'; st.textContent=css; document.head.appendChild(st);

  var W_RUNTIME = {url:'',name:'',blob:null,file:null,signature:'',sharing:false,busy:false,job:0};
  var W_TEMPLATES = {
    walkman_yellow:{label:'Sony Walkman yellow', family:'Sony Walkman', note:'exact clean source', src:'v016_walkman_yellow.png', thumb:'v016_thumb_walkman_yellow.png', text:'#111', singleOne:null, basisW:1290,basisH:2796,zones:{one:{x:92,y:1380,w:268,h:500,layout:'list',align:'left'}, two:{x:155,y:2520,w:980,h:190,layout:'grid',align:'center'}}, style:'walkman'},
    walkman_sports:{label:'Walkman Sports', family:'Sony Walkman', note:'original reference added by you', src:'v016_walkman_sports.jpg', thumb:'v016_thumb_walkman_sports.png', text:'#141414', singleOne:{x:505,y:1150,w:300,h:420,layout:'list',align:'left'}, zones:{one:{x:505,y:1150,w:300,h:420,layout:'list',align:'left'}, two:{x:95,y:1710,w:730,h:230,layout:'grid',align:'center'}}, style:'retro'},
    beta_l500:{label:'Sony Beta L-500', family:'Sony Beta', note:'original reference added by you', src:'v016_beta_l500.jpg', thumb:'v016_thumb_beta_l500.png', text:'#141414', singleOne:{x:78,y:120,w:690,h:860,layout:'list',align:'left'}, zones:{one:{x:78,y:120,w:690,h:860,layout:'list',align:'left'}, two:{x:78,y:1660,w:700,h:235,layout:'grid',align:'center'}}, style:'retro'},
    ipod_black:{label:'iPod black', family:'iPod', note:'original reference added by you', src:'v016_ipod_black.jpg', thumb:'v016_thumb_ipod_black.png', text:'#1c1c1c', singleOne:{x:76,y:105,w:790,h:620,layout:'list',align:'center'}, zones:{one:{x:76,y:105,w:790,h:300,layout:'list',align:'center'}, two:{x:76,y:425,w:790,h:300,layout:'list',align:'center'}}, style:'screen'},
    ipod_red:{label:'iPod red', family:'iPod', note:'original reference added by you', src:'v016_ipod_red.jpg', thumb:'v016_thumb_ipod_red.png', text:'#1c1c1c', singleOne:{x:76,y:105,w:790,h:620,layout:'list',align:'center'}, zones:{one:{x:76,y:105,w:790,h:300,layout:'list',align:'center'}, two:{x:76,y:425,w:790,h:300,layout:'list',align:'center'}}, style:'screen'}
  };
  var W_TEMPLATE_ORDER = ['walkman_yellow','walkman_sports','beta_l500','ipod_black','ipod_red'];

  function wState(){ state.wallpaper = state.wallpaper || {mode:'W1',left:'',bottom:'',lastFile:'',template:'walkman_yellow'}; if(!state.wallpaper.template || !W_TEMPLATES[state.wallpaper.template]) state.wallpaper.template='walkman_yellow'; return state.wallpaper; }
  function wTpl(id){ return W_TEMPLATES[id] || W_TEMPLATES.walkman_yellow; }
  function wPackWords(rows){
    return rows.map(function(row){return String((row&&row[1])||(row&&row[0])||'').trim();}).filter(Boolean);
  }
  function wCatalog(){
    var rows=[];
    SECTIONS.forEach(function(sec){
      (sec.live||[]).forEach(function(it){
        if(!it || it.div || it.guide || !it.c) return;
        var pk = PACKS[it.c] || [];
        if(pk.length !== 5) return;
        var words = wPackWords(pk);
        if(words.length !== 5) return;
        rows.push({secId:sec.id, secTitle:sec.title, secKo:sec.ko||'', code:it.c, title:it.title||it.c, words:words});
      });
    });
    rows.sort(function(a,b){return (a.secTitle+' '+a.code).localeCompare(b.secTitle+' '+b.code,'ru');});
    return rows;
  }
  function wByCode(code){ if(!code)return null; var cat=wCatalog(); for(var i=0;i<cat.length;i++) if(cat[i].code===code) return cat[i]; return null; }
  function wOptgroups(selected,optional){
    var cat=wCatalog(), by={};
    cat.forEach(function(r){ (by[r.secTitle] = by[r.secTitle] || []).push(r); });
    var out='<option value="">'+(optional?'Без блока':'Выбери подраздел из пяти слов')+'</option>';
    Object.keys(by).sort(function(a,b){return a.localeCompare(b,'ru');}).forEach(function(name){
      out += '<optgroup label="'+esc(name)+'">';
      by[name].forEach(function(r){ out += '<option value="'+esc(r.code)+'"'+(selected===r.code?' selected':'')+'>'+esc(r.code+' · '+r.title)+'</option>'; });
      out += '</optgroup>';
    });
    return out;
  }
  function wSelectionCard(label, code, id, optional){
    var current=wByCode(code);
    return '<div class="w-slot"><label for="'+id+'">'+esc(label)+'</label><select id="'+id+'">'+wOptgroups(code,optional)+'</select>'+
      (current ? '<div class="w-note"><b>'+esc(current.secTitle)+'</b> · '+esc((current.words||[]).join(' · '))+'</div>' : '') +
      '</div>';
  }
  function wTemplateGrid(selected){
    return '<div class="w-gallery">'+W_TEMPLATE_ORDER.map(function(id){ var t=wTpl(id); return '<button type="button" class="w-tpl'+(selected===id?' on':'')+'" data-wtpl="'+id+'"><img src="'+t.thumb+'" alt="'+esc(t.label)+'"><b>'+esc(t.label)+'</b><span>'+esc(t.family)+' · '+esc(t.note)+'</span></button>'; }).join('')+'</div>';
  }
  function loadImage(src){ return new Promise(function(resolve,reject){ var img=new Image(); img.crossOrigin='anonymous'; img.onload=function(){ resolve(img); }; img.onerror=reject; img.src=src; }); }
  // All generated exports are 1290 × 2796; zones use each template's source coordinate system.
  function wrapLines(ctx,text,maxWidth){
    var tokens=String(text||'').trim().split(/\s+/).filter(Boolean),lines=[],line='';
    function width(s){var m=ctx.measureText(s);return Math.max(m.width,(m.actualBoundingBoxLeft||0)+(m.actualBoundingBoxRight||0));}
    tokens.forEach(function(token){
      if(!lines)return;
      if(width(token)>maxWidth){
        // Compound terms can wrap at an existing hyphen without dropping any letters.
        var pieces=token.match(/[^-‐]+[-‐]?|[-‐]/g)||[token];
        if(pieces.some(function(piece){return width(piece)>maxWidth;})){lines=null;return;}
        if(line){lines.push(line);line='';}
        pieces.forEach(function(piece){
          if(line&&width(line+piece)>maxWidth){lines.push(line);line='';}
          line+=piece;
        });
        return;
      }
      var next=line?line+' '+token:token;
      if(line&&width(next)>maxWidth){lines.push(line);line=token;}else line=next;
    });
    if(!lines)return null;
    if(line)lines.push(line);
    return lines.length?lines:[''];
  }
  function fitWordsList(ctx,words,zone,style){
    var pad=6,usable=zone.w-2*pad;
    for(var fs=(style==='walkman'?60:60);fs>=12;fs-=0.5){
      ctx.font='700 '+fs+'px Arial, Helvetica, sans-serif';
      var lh=fs*1.18,gap=fs*0.36,total=0,all=[],ok=true;
      for(var i=0;i<words.length;i++){
        var lines=wrapLines(ctx,words[i],usable);
        if(!lines||lines.length>4){ok=false;break;}
        all.push(lines);total+=lines.length*lh+(i?gap:0);
      }
      if(ok&&total<=zone.h-2*pad)return{font:fs,lineHeight:lh,gap:gap,lines:all,total:total,pad:pad};
    }
    throw Error('Слишком длинные слова для этой области. Выбери другой шаблон — текст не будет обрезан.');
  }
  function fitWordsGrid(ctx,words,zone){
    // A 3 + 2 layout uses the lower strip without squeezing five words into a tiny column.
    var rows=[words.slice(0,3),words.slice(3)],pad=8;
    for(var fs=54;fs>=12;fs-=0.5){
      ctx.font='700 '+fs+'px Arial, Helvetica, sans-serif';
      var lh=fs*1.18,rowGap=fs*.36,cellGap=20,wrapped=[],total=0,ok=true;
      for(var r=0;r<rows.length;r++){
        var row=rows[r],cellW=(zone.w-2*pad-cellGap*(row.length-1))/row.length,rowH=0,cells=[];
        for(var c=0;c<row.length;c++){
          var lines=wrapLines(ctx,row[c],cellW-12);
          if(!lines||lines.length>4){ok=false;break;}
          cells.push(lines);rowH=Math.max(rowH,lines.length*lh);
        }
        if(!ok)break;
        wrapped.push({cells:cells,height:rowH,width:cellW,gap:cellGap,count:row.length});
        total+=rowH+(r?rowGap:0);
      }
      if(ok&&total<=zone.h-2*pad)return{font:fs,lineHeight:lh,rowGap:rowGap,rows:wrapped,total:total,pad:pad};
    }
    throw Error('Слишком длинные слова для нижней области. Выбери другой шаблон.');
  }
  function wLayoutWords(ctx,entry,zone,style){
    if(!entry||!zone)return[];
    if(!entry.words||entry.words.length!==5)throw Error('Нужен подраздел ровно из пяти слов.');
    var words=entry.words,commands=[];
    if(zone.layout==='grid'){
      var f=fitWordsGrid(ctx,words,zone),y=zone.y+(zone.h-f.total)/2;
      f.rows.forEach(function(row){
        var x=zone.x+f.pad;
        row.cells.forEach(function(lines,i){
          var cy=y+(row.height-lines.length*f.lineHeight)/2;
          lines.forEach(function(line){commands.push({text:line,x:x+i*(row.width+row.gap)+row.width/2,y:cy,font:f.font,align:'center'});cy+=f.lineHeight;});
        });
        y+=row.height+f.rowGap;
      });
    }else{
      var f=fitWordsList(ctx,words,zone,style),y=zone.y+(zone.h-f.total)/2;
      var align=zone.align==='center'?'center':'left',x=align==='center'?zone.x+zone.w/2:zone.x+f.pad;
      f.lines.forEach(function(lines){lines.forEach(function(line){commands.push({text:line,x:x,y:y,font:f.font,align:align});y+=f.lineHeight;});y+=f.gap;});
    }
    return commands;
  }
  function drawWords(ctx,entry,zone,style,color){
    var commands=wLayoutWords(ctx,entry,zone,style);
    if(!commands.length)return;
    ctx.save();
    // A secondary guard prevents even anti-aliased strokes from touching the cassette or labels.
    ctx.beginPath();ctx.rect(zone.x,zone.y,zone.w,zone.h);ctx.clip();
    ctx.fillStyle=color||'#111';ctx.textBaseline='alphabetic';
    commands.forEach(function(c){
      ctx.font='700 '+c.font+'px Arial, Helvetica, sans-serif';ctx.textAlign=c.align;
      var m=ctx.measureText(c.text),ascent=m.actualBoundingBoxAscent||c.font*.8;
      ctx.fillText(c.text,c.x,c.y+ascent);
    });
    ctx.restore();
  }
  // Clock-side areas use final PNG pixels on both source images; keep the middle 810 px clear.
  var W_CLOCK_ZONES = {
    topLeft:{x:38,y:228,w:202,h:650,align:'left'},
    topRight:{x:1050,y:228,w:202,h:650,align:'right'}
  };
  var W_CLOCK_COLOR = '#F5F1E8';
  var wCharacters = typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter(undefined, {granularity:'grapheme'}) : null;
  function wIsWalkman(tpl){return tpl.family==='Sony Walkman';}
  function wClockFont(size){return '600 '+size+'px Arial, Helvetica, sans-serif';}
  function wInkWidth(ctx,line){
    var m=ctx.measureText(line);
    return Math.max(m.width,m.actualBoundingBoxRight||0)+Math.max(0,m.actualBoundingBoxLeft||0);
  }
  function wWrapClockWord(ctx,word,width,splitLong){
    var tokens=word.trim().split(/\s+/),lines=[],line='';
    for(var token of tokens){
      var next=line?line+' '+token:token;
      if(wInkWidth(ctx,next)<=width){line=next;continue;}
      if(line){lines.push(line);line='';}
      if(wInkWidth(ctx,token)<=width){line=token;continue;}
      if(!splitLong)return null;
      var chars=wCharacters?Array.from(wCharacters.segment(token),function(item){return item.segment;}):Array.from(token);
      var start=0;
      while(start<chars.length){
        var end=start+1;
        if(wInkWidth(ctx,chars[start])>width)return null;
        while(end<chars.length&&wInkWidth(ctx,chars.slice(start,end+1).join(''))<=width)end++;
        // Keep a two-character ending together when breaking a long, unspaced word.
        if(end===chars.length-1&&end-start>2)end--;
        var part=chars.slice(start,end).join('');
        if(end===chars.length)line=part;else lines.push(part);
        start=end;
      }
    }
    if(line)lines.push(line);
    return lines;
  }
  function wClockPlan(ctx,entry,zone){
    if(!entry)return [];
    if(!entry.words||entry.words.length!==5)throw Error('Для блока у часов нужен подраздел из пяти слов.');
    var pad=4,width=zone.w-pad*2;
    ctx.textAlign='left';
    // First try whole words at a readable size, then allow long terms to span lines.
    for(var split of [false,true]){
      for(var size=31;size>=(split?18:25);size--){
        ctx.font=wClockFont(size);
        var groups=entry.words.map(function(word){return wWrapClockWord(ctx,word,width,split);});
        if(groups.some(function(lines){return !lines||!lines.length;}))continue;
        var gap=Math.round(size*.45),minLineHeight=Math.ceil(size*1.17);
        var ascent=0,descent=0,rows=0;
        groups.forEach(function(lines){
          rows+=lines.length;
          lines.forEach(function(line){
            var m=ctx.measureText(line);
            ascent=Math.max(ascent,m.actualBoundingBoxAscent||size*.8);
            descent=Math.max(descent,m.actualBoundingBoxDescent||size*.2);
          });
        });
        var lineHeight=Math.max(minLineHeight,Math.ceil(ascent+descent+1));
        var total=(rows-1)*lineHeight+ascent+descent+(groups.length-1)*gap;
        if(total>zone.h-pad*2)continue;
        // Keep short lists level with the clock. Only long phrases reach farther down.
        var top=Math.max(zone.y+pad,466-total/2);
        var y=Math.min(top,zone.y+zone.h-pad-total)+ascent,commands=[];
        groups.forEach(function(lines){
          lines.forEach(function(line){
            var m=ctx.measureText(line);
            var x=zone.align==='right'?zone.x+zone.w-pad-Math.max(m.width,m.actualBoundingBoxRight||0)
              :zone.x+pad+Math.max(0,m.actualBoundingBoxLeft||0);
            commands.push({text:line,x:x,y:y,font:size});
            y+=lineHeight;
          });
          y+=gap;
        });
        return commands;
      }
    }
    throw Error('Пять слов слишком длинны для поля у часов. Выбери для этого подраздела область на корпусе.');
  }
  function wDrawClock(ctx,entry,zone){
    if(!entry)return;
    ctx.save();
    ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle=W_CLOCK_COLOR;
    wClockPlan(ctx,entry,zone).forEach(function(c){
      ctx.font=wClockFont(c.font);ctx.fillText(c.text,c.x,c.y);
    });
    ctx.restore();
  }

  function wSignature(){
    var s=wState(),slots=[s.left,s.mode==='W2'?s.bottom:''];
    if(wIsWalkman(wTpl(s.template)))slots.push(s.topLeft,s.topRight);
    return JSON.stringify([CURP||'',s.template,s.mode,slots.map(function(code){return code?[code,wPackWords(PACKS[code]||[])]:null;})]);
  }
  function wClockSlots(stt){
    return '<div class="w-clock-slots"><h4>По краям часов</h4><p class="w-note">Эти два блока необязательны. На обоях между ними останется место для стандартных часов iPhone.</p>'+
      wSelectionCard('Слева от часов',stt.topLeft||'','wTopLeftSelect',true)+wSelectionCard('Справа от часов',stt.topRight||'','wTopRightSelect',true)+'</div>';
  }
  function wReady(){return !!W_RUNTIME.url&&!!W_RUNTIME.blob&&W_RUNTIME.signature===wSignature();}
  function wTell(text){var el=document.getElementById('wallpaperStudioStatus');if(el)el.textContent=text;var info=document.getElementById('wShareStatus');if(info)info.textContent=text;}
  function wInvalidate(){
    W_RUNTIME.job++;W_RUNTIME.busy=false;
    if(W_RUNTIME.url)URL.revokeObjectURL(W_RUNTIME.url);
    W_RUNTIME.url='';W_RUNTIME.blob=null;W_RUNTIME.file=null;W_RUNTIME.name='';W_RUNTIME.signature='';
  }
  function wUpdateOutput(){
    var ready=wReady(),image=document.getElementById('wallpaperStudioPreview');
    if(image&&ready)image.src=W_RUNTIME.url;
    var dl=document.getElementById('wDownloadBtn');if(dl)dl.disabled=!ready||W_RUNTIME.sharing;
    var options=document.getElementById('wSaveAlternatives');if(options)options.hidden=!ready;
    var file=document.getElementById('wPngDownload');if(file&&ready){file.href=W_RUNTIME.url;file.download=W_RUNTIME.name;}
    var open=document.getElementById('wOpenImage');if(open&&ready)open.href=W_RUNTIME.url;
  }
  function wStoreResult(blob,name,signature){
    if(!blob||!blob.size)throw Error('Не удалось подготовить PNG. Повтори создание Preview.');
    if(W_RUNTIME.url)URL.revokeObjectURL(W_RUNTIME.url);
    W_RUNTIME.blob=blob;W_RUNTIME.name=name;W_RUNTIME.url=URL.createObjectURL(blob);W_RUNTIME.signature=signature;
    W_RUNTIME.file=typeof File==='function'?new File([blob],name,{type:'image/png',lastModified:Date.now()}):null;
    wUpdateOutput();
  }
  function wLoadSource(src){
    return new Promise(function(resolve,reject){var img=new Image(),timer=setTimeout(function(){reject(Error('Изображение не загрузилось. Проверь, что все файлы архива загружены рядом с index.html.'));},20000);
      img.onload=function(){clearTimeout(timer);resolve(img);};img.onerror=function(){clearTimeout(timer);reject(Error('Не найден файл '+src+'. Загрузите все файлы из архива в корень репозитория.'));};img.src=src;});
  }
  async function wGenerate(blankOnly){
    var stt=wState(),tpl=wTpl(stt.template),signature=wSignature();
    var left=wByCode(stt.left),bottom=stt.mode==='W2'?wByCode(stt.bottom):null;
    var walkman=wIsWalkman(tpl),topLeft=walkman&&stt.topLeft?wByCode(stt.topLeft):null;
    var topRight=walkman&&stt.topRight?wByCode(stt.topRight):null;
    if(!blankOnly&&walkman&&((stt.topLeft&&!topLeft)||(stt.topRight&&!topRight)))throw Error('Выбери актуальный подраздел для поля у часов.');
    if(!blankOnly&&(!left||(stt.mode==='W2'&&!bottom)))throw Error('Сначала выбери нужные подразделы.');
    if(W_RUNTIME.busy||W_RUNTIME.sharing)return;
    wInvalidate();var job=W_RUNTIME.job;W_RUNTIME.busy=true;wUpdateOutput();
    var button=document.getElementById('wMakeBtn'),blank=document.getElementById('wBlankBtn');if(button)button.disabled=true;if(blank)blank.disabled=true;
    wTell('Готовлю PNG для Preview и сохранения в «Фото»…');
    try{
      var img=await wLoadSource(tpl.src);
      if(job!==W_RUNTIME.job||signature!==wSignature())return;
      var canvas=document.createElement('canvas');canvas.width=1290;canvas.height=2796;
      var ctx=canvas.getContext('2d');if(!ctx)throw Error('Браузер не смог создать изображение.');
      ctx.drawImage(img,0,0,1290,2796);
      if(!blankOnly){
        ctx.save();ctx.scale(1290/(tpl.basisW||img.naturalWidth),2796/(tpl.basisH||img.naturalHeight));
        drawWords(ctx,left,stt.mode==='W1'&&tpl.singleOne?tpl.singleOne:tpl.zones.one,tpl.style,tpl.text);
        if(stt.mode==='W2')drawWords(ctx,bottom,tpl.zones.two,tpl.style,tpl.text);
        ctx.restore();
        wDrawClock(ctx,topLeft,W_CLOCK_ZONES.topLeft);
        wDrawClock(ctx,topRight,W_CLOCK_ZONES.topRight);
      }
      var blob=await new Promise(function(resolve,reject){canvas.toBlob(function(b){b?resolve(b):reject(Error('Не удалось сохранить PNG.'));},'image/png');});
      if(job!==W_RUNTIME.job||signature!==wSignature())return;
      var parts=['Study_v019',blankOnly?'base':stt.mode,stt.template];
      if(!blankOnly){
        parts.push(stt.left);if(stt.mode==='W2')parts.push(stt.bottom);
        if(topLeft)parts.push('L',stt.topLeft);if(topRight)parts.push('R',stt.topRight);
      }
      var name=parts.join('_').replace(/[^a-z0-9_.-]+/gi,'-')+'.png';
      wStoreResult(blob,name,signature);stt.lastFile=name;save();
      wTell('Готово: 1290 × 2796. Нажми Download и выбери «Сохранить изображение» в меню iPhone.');
    }finally{
      if(job===W_RUNTIME.job){W_RUNTIME.busy=false;if(button&&button.isConnected)button.disabled=!left||(stt.mode==='W2'&&!bottom);if(blank&&blank.isConnected)blank.disabled=false;wUpdateOutput();}
    }
  }
  function wShowImage(){
    if(!wReady()){wTell('Сначала создай Preview.');return;}
    var old=document.getElementById('w16ImageDialog');if(old)old.remove();
    var layer=document.createElement('div');layer.id='w16ImageDialog';layer.className='w16-image-dialog';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label','Обои для сохранения');
    var head=document.createElement('div');head.className='w16-image-head';
    var note=document.createElement('p');note.textContent='Это полное PNG-изображение. Удерживай его и выбери сохранение в «Фото», если браузер предлагает этот пункт.';
    var close=document.createElement('button');close.type='button';close.textContent='Закрыть';close.onclick=function(){layer.remove();document.removeEventListener('keydown',key);};
    function key(e){if(e.key==='Escape')close.click();}document.addEventListener('keydown',key);
    head.appendChild(note);head.appendChild(close);layer.appendChild(head);
    var image=document.createElement('img');image.src=W_RUNTIME.url;image.alt='Готовые обои 1290 × 2796';image.width=1290;image.height=2796;layer.appendChild(image);document.body.appendChild(layer);close.focus();
  }
  function wDownloadPreview(){
    if(!wReady()){wTell('Сначала создай Preview.');return;}
    if(W_RUNTIME.sharing)return;
    // File is prepared BEFORE this click. No fetch, toBlob or await before native share.
    var payload=W_RUNTIME.file?{files:[W_RUNTIME.file]}:null,can=false;
    try{can=!!payload&&typeof navigator.share==='function'&&(typeof navigator.canShare!=='function'||navigator.canShare(payload));}catch(e){can=false;}
    if(can){
      W_RUNTIME.sharing=true;wUpdateOutput();var result;
      try{result=navigator.share(payload);}catch(e){finish(e);return;}
      if(!result||typeof result.then!=='function'){finish(Error('Системное меню сохранения недоступно.'));return;}
      result.then(function(){finish(null);},finish);
      function finish(err){
        W_RUNTIME.sharing=false;wUpdateOutput();
        if(!err){wTell('Системное меню закрыто. Если выбрано «Сохранить изображение», проверь приложение «Фото».');return;}
        if(err.name==='AbortError'){wTell('Сохранение отменено. Preview остался — можно нажать Download ещё раз.');return;}
        wTell('Меню сохранения недоступно. Нажми «Показать изображение» ниже и удерживай обои, либо выбери «PNG-файл».');
      }
      return;
    }
    if(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)){
      wShowImage();wTell('Этот режим браузера не передаёт файлы в меню iPhone. Удерживай открытое изображение для сохранения.');return;
    }
    var a=document.getElementById('wPngDownload');if(a)a.click();wTell('PNG передан браузеру для скачивания. Если загрузка не началась, нажми «Показать изображение».');
  }
  function renderWallpaperStudio(){
    var root=document.getElementById('wallpaperStudio'); if(!root) return; var stt=wState(); if(stt.mode!=='W2') stt.mode='W1';
    if(W_RUNTIME.signature && W_RUNTIME.signature!==wSignature()) wInvalidate();
    var ready=!!wByCode(stt.left) && (stt.mode==='W1' || !!wByCode(stt.bottom)); var count=wCatalog().length; var tpl=wTpl(stt.template);
    root.innerHTML=''+
      '<div class="h-sign" style="margin-top:20px"><h2>W</h2><span class="ko">벽지</span><span class="rule"></span></div>'+
      '<p class="lead">Выбери шаблон и подразделы. Один блок содержит пять слов.</p>'+
      '<div class="w-grid">'+
        '<div>'+
          '<div class="w-zone"><h3>На корпусе плеера</h3><div class="w-mode-row"><button type="button" class="w-mode'+(stt.mode==='W1'?' on':'')+'" data-wmode="W1">Один блок</button><button type="button" class="w-mode'+(stt.mode==='W2'?' on':'')+'" data-wmode="W2">Два блока</button></div><div class="w-note">Доступно подразделов по пять слов — <b>'+count+'</b>.</div></div>'+
          '<div class="w-zone"><h3>Шаблон обоев</h3>'+wTemplateGrid(stt.template)+'</div>'+
          '<div class="w-zone"><h3>Подразделы</h3>'+wSelectionCard('Основной блок', stt.left || '', 'wLeftSelect')+(stt.mode==='W2'?wSelectionCard('Нижний блок', stt.bottom || '', 'wBottomSelect'):'')+(wIsWalkman(tpl)?wClockSlots(stt):'')+'<div class="w-actions"><button type="button" class="w-btn" id="wMakeBtn"'+(ready?'':' disabled')+'>make preview</button><button type="button" class="w-btn sec" id="wBlankBtn">base preview</button></div><div id="wallpaperStudioStatus" class="w-ok"></div></div>'+
          '<div class="w-zone"><h4>Sources used in this build</h4><div class="w-source"><span class="w-pill">Exact clean yellow Walkman source</span><span class="w-pill">Walkman Sports original</span><span class="w-pill">Sony Beta original</span><span class="w-pill">iPod black original</span><span class="w-pill">iPod red original</span></div><p class="w-note">Каждый PNG выводится в размере 1290 × 2796. Масштаб и Extend в редакторе экрана блокировки управляются iOS, а не сайтом.</p></div>'+
        '</div>'+
        '<div class="w-preview-wrap"><div class="w-zone" style="text-align:center"><h3>Preview</h3><img id="wallpaperStudioPreview" class="w-preview" alt="Generated W wallpaper preview" src="'+tpl.thumb+'"><div class="w16-save-panel"><button type="button" class="w-btn" id="wDownloadBtn" disabled>Download · в «Фото»</button><div id="wSaveAlternatives" hidden><button type="button" id="wShowImage">Показать изображение</button><a id="wPngDownload" download>PNG-файл</a><a id="wOpenImage" target="_blank" rel="noopener">Открыть PNG</a></div><p id="wShareStatus" role="status" aria-live="polite"></p></div><p class="w-note">Сначала make preview, затем Download. В системном меню iPhone выбери «Сохранить изображение» (Save Image). Обои сохраняются в «Фото» после твоего подтверждения. Размер PNG — 1290 × 2796.</p></div><div class="w-zone"><h4>What goes onto the wallpaper</h4><div class="w-catalog">Only the target learning words or terms are used — for example the English word, Bashkir word, philosopher name, or legal term from the chosen subdivision. No translations are forced into the wallpaper output unless you later ask to add them.</div></div></div>'+
      '</div>';
    Array.prototype.forEach.call(root.querySelectorAll('[data-wmode]'),function(b){ b.onclick=function(){ wInvalidate(); var ws=wState(); ws.mode=b.getAttribute('data-wmode'); if(ws.mode==='W1') ws.bottom=''; save(); renderWallpaperStudio(); }; });
    Array.prototype.forEach.call(root.querySelectorAll('[data-wtpl]'),function(b){ b.onclick=function(){ wState().template=b.getAttribute('data-wtpl'); wInvalidate(); save(); renderWallpaperStudio(); }; });
    [['wLeftSelect','left'],['wBottomSelect','bottom'],['wTopLeftSelect','topLeft'],['wTopRightSelect','topRight']].forEach(function(slot){
      var select=document.getElementById(slot[0]);
      if(select)select.onchange=function(){wInvalidate();wState()[slot[1]]=select.value;save();renderWallpaperStudio();};
    });
    var make=document.getElementById('wMakeBtn'); if(make) make.onclick=function(){ wGenerate(false).catch(function(err){ var s=document.getElementById('wallpaperStudioStatus'); if(s) s.textContent='Could not create wallpaper: '+err; }); };
    var blank=document.getElementById('wBlankBtn'); if(blank) blank.onclick=function(){ wGenerate(true).catch(function(err){ var s=document.getElementById('wallpaperStudioStatus'); if(s) s.textContent='Could not download base wallpaper: '+err; }); };
    var dl=document.getElementById('wDownloadBtn'); if(dl) dl.onclick=wDownloadPreview;
    var show=document.getElementById('wShowImage');if(show)show.onclick=wShowImage;
    wUpdateOutput();
  }
  window.renderWallpaperStudio = renderWallpaperStudio;
  // Pure layout hook also used by automated geometry checks; contains no user data.
  window.StudyWallpaperLayout={plan:wLayoutWords,templates:W_TEMPLATES,clockPlan:wClockPlan,clockZones:W_CLOCK_ZONES};
})();
