(function () {
  'use strict';
  const mounted = new WeakSet();
  const memory = new Map();
  let source, launcher, dialog, view, game, entriesById, boardCells, selected;
  let cursor = 0;
  let profile, sessionId = 0, databasePromise, storageIssue = false, refs = {};
  const engine = () => window.SudakCrosswordEngine;
  const wordKey = entry => 'w:' + entry.id;
  const byNumber = (a, b) => a.number - b.number || (a.direction === 'across' ? -1 : 1);
  const languageNames = {en: 'английский', fr: 'французский', ba: 'башкирский', ru: 'русский'};
  const specialLetters = {ba:'әғҙҡңөҫүһ', fr:'àâæçéèêëîïôœùûüÿ'};
  const direction = e => e.direction === 'down' ? 'по вертикали' : 'по горизонтали';
  const emptyProgress = () => ({solved: {}, drafts: {}, selected: null});
  const solved = e => game.progress.solved[wordKey(e)] === e.letters.join('');
  const finished = () => game.grid.entries.length > 0 && game.grid.entries.every(solved);
  const readKey = () => String((typeof source.storageKey === 'function' ? source.storageKey() : source.storageKey) || 'study.sudak.crossword.v1');
  const locationOf = (e, i) => [e.x + (e.direction === 'down' ? 0 : i), e.y + (e.direction === 'down' ? i : 0)];

  function element(tag, cls, value) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value != null) el.textContent = value;
    return el;
  }
  function button(label, cls, onClick) {
    const el = element('button', cls, label);
    el.type = 'button';
    el.addEventListener('click', onClick);
    return el;
  }
  function showMessage(text, kind) {
    if (!refs.status) return;
    refs.status.textContent = text;
    refs.status.dataset.kind = kind || '';
  }
  function storageWarning() {
    storageIssue = true;
    if (refs.storage) {
      refs.storage.hidden = false;
      refs.storage.textContent = 'Память устройства недоступна. Изменения сохраняются только до закрытия страницы.';
    }
  }
  function readLocal(key) {
    if (memory.has(key)) return memory.get(key);
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (err) { storageWarning(); return null; }
  }
  function writeLocal(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      memory.delete(key);
      return true;
    } catch (err) {
      memory.set(key, data);
      storageWarning();
      return false;
    }
  }
  function readProgress(key) {
    const stored = readLocal(key);
    return stored && stored.solved && stored.drafts ? stored : emptyProgress();
  }
  function saveProgress() {
    if (!game) return;
    game.progress.selected = selected ? String(selected.id) : null;
    writeLocal(game.key, game.progress);
  }

  // Keep large immutable layouts in IndexedDB. Partial answers use small, synchronous writes.
  function archiveDB() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise(resolve => {
      let request;
      try { request = indexedDB.open('study.sudak.crosswords', 1); }
      catch (err) { resolve(null); return; }
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore('puzzles', {keyPath: 'key'});
        const index = db.createObjectStore('titles', {keyPath: 'key'});
        index.createIndex('profile', 'profile');
      };
      request.onerror = request.onblocked = () => resolve(null);
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); databasePromise = null; };
        resolve(request.result);
      };
    });
    return databasePromise;
  }
  async function dbRead(store, run) {
    const db = await archiveDB();
    if (!db) return null;
    return new Promise(resolve => {
      try {
        const request = run(db.transaction(store).objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch (err) { resolve(null); }
    });
  }
  async function storeSnapshot(snapshot) {
    const {key, profile: owner, id, date, count} = snapshot;
    const meta = {key, profile: owner, id, date, count};
    const db = await archiveDB();
    if (db) {
      const success = await new Promise(resolve => {
        try {
          const tx = db.transaction(['puzzles', 'titles'], 'readwrite');
          tx.oncomplete = () => resolve(true);
          tx.onabort = tx.onerror = () => resolve(false);
          tx.objectStore('titles').put(meta);
          tx.objectStore('puzzles').put(snapshot);
        } catch (err) { resolve(false); }
      });
      if (success) return true;
    }
    const k = owner + '.saved';
    const archive = readLocal(k) || {};
    archive[id] = snapshot;
    return writeLocal(k, archive);
  }
  async function archiveTitles(owner) {
    const records = await dbRead('titles', s => s.index('profile').getAll(owner)) || [];
    const all = new Map(records.map(v => [v.id, v]));
    Object.values(readLocal(owner + '.saved') || {}).forEach(v => all.set(v.id, v));
    return Array.from(all.values()).sort((a, b) => b.date - a.date);
  }
  async function readSnapshot(owner, id) {
    return (readLocal(owner + '.saved') || {})[id] ||
      await dbRead('puzzles', s => s.get(owner + ':' + id));
  }

  function canonicalEntries() {
    const entries = [], ids = new Map();
    for (const item of source.getEntries() || []) {
      if (!item || !engine().normalizeAnswer(item.answer || '')) continue;
      const base = String(item.id == null ? [item.section, item.lang, item.answer, item.clue].join('/') : item.id);
      let id = base, n = ids.get(base) || 0;
      while (ids.has(id)) id = base + '#' + (++n);
      ids.set(id, 1);
      entries.push({id, answer: String(item.answer), clue: String(item.clue || ''),
        lang: String(item.lang || ''), section: String(item.section || ''), ipa: String(item.ipa || '')});
    }
    return entries;
  }
  function signature(entries) {
    const text = JSON.stringify(entries);
    let a = 2166136261, b = 23;
    for (let i = 0; i < text.length; i++) {
      a = Math.imul(a ^ text.charCodeAt(i), 16777619);
      b = Math.imul(b, 31) + text.charCodeAt(i) | 0;
    }
    return entries.length + '-' + (a >>> 0).toString(36) + (b >>> 0).toString(36);
  }
  function setGame(grid, id, archived) {
    const key = profile + (archived ? '.replay.' + id : '.live');
    const progress = readProgress(key);
    if (!archived && progress.signature !== id) {
      // An unchanged word keeps its draft or solution when another section changes.
      const keep = emptyProgress();
      keep.signature = id;
      grid.entries.forEach(e => {
        const k = wordKey(e), answer = e.letters.join('');
        if (progress.solved[k] === answer) keep.solved[k] = answer;
        if (progress.drafts[k] && progress.drafts[k][0] === answer) keep.drafts[k] = progress.drafts[k];
      });
      keep.selected = progress.selected;
      game = {id, grid, archived, key, progress: keep};
    } else game = {id, grid, archived, key, progress};
    entriesById = new Map(grid.entries.map(e => [String(e.id), e]));
    selected = entriesById.get(String(game.progress.selected)) || grid.entries.slice().sort(byNumber).find(e => !solved(e)) || grid.entries[0];
    saveProgress();
  }
  function loadCurrent(force) {
    const currentProfile = readKey(), entries = canonicalEntries(), id = 'vertical-' + signature(entries);
    if (!force && game && !game.archived && game.id === id && profile === currentProfile) return;
    profile = currentProfile;
    const grid = engine().build(entries, id);
    setGame(grid, id, false);
    renderPuzzle();
  }
  function clearView(next) {
    ++sessionId;
    if(refs.boardObserver) refs.boardObserver.disconnect();
    view = next;
    dialog.replaceChildren();
    dialog.dataset.view = next;
    refs = {};
  }
  function makeHeader(title, fromArchive) {
    const header = element('header', 'sdx-header');
    const back = button(fromArchive ? 'К архиву' : 'Судак', 'sdx-text-btn', fromArchive ? renderArchive : close);
    header.append(back, element('h2', '', title));
    if (view === 'puzzle') header.append(button('Архив', 'sdx-text-btn', renderArchive));
    else header.append(button('Текущий', 'sdx-text-btn', () => loadCurrent(true)));
    dialog.append(header);
    if (fromArchive && view === 'puzzle') header.lastChild.hidden = true;
    refs.storage = element('p', 'sdx-storage');
    refs.storage.hidden = true;
    dialog.append(refs.storage);
    if (storageIssue) storageWarning();
  }
  function archiveDate(ms) {
    return new Date(ms).toLocaleString('ru-RU', {day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'});
  }
  function plural(n, forms) {
    const x = n % 100, y = n % 10;
    return n + ' ' + forms[(x >= 11 && x <= 14) ? 2 : (y === 1 ? 0 : (y >= 2 && y <= 4 ? 1 : 2))];
  }
  async function renderArchive() {
    clearView('archive');
    makeHeader('Архив', false);
    const list = element('div', 'sdx-archive-list');
    const msg = element('p', 'sdx-empty', 'Загрузка архива…');
    list.append(msg);
    dialog.append(list);
    const token = sessionId, owner = profile;
    const rows = await archiveTitles(owner);
    if (token !== sessionId) return;
    if (!rows.length) { msg.textContent = 'Здесь появятся сохранённые кроссворды.'; return; }
    list.replaceChildren();
    for (const row of rows) {
      const tile = element('article', 'sdx-archive-row'), labels = element('div', 'sdx-archive-title');
      const p = readProgress(owner + '.replay.' + row.id);
      const done = Object.keys(p.solved).length;
      const started = done > 0 || Object.keys(p.drafts).length > 0;
      labels.append(element('strong', '', archiveDate(row.date)), element('span', '', plural(row.count, ['слово', 'слова', 'слов']) + (started ? ' · ' + done + ' из ' + row.count + ' решено' : '')));
      tile.append(labels);
      const openSaved = async restart => {
        const snap = await readSnapshot(owner, row.id);
        if (token !== sessionId) return;
        if (!snap) { msg.textContent = 'Сетка недоступна на этом устройстве.'; list.prepend(msg); return; }
        if (restart) writeLocal(owner + '.replay.' + row.id, emptyProgress());
        setGame(snap.grid, row.id, true);
        renderPuzzle();
      };
      if (started && done < row.count) tile.append(button('Продолжить', 'sdx-text-btn', () => openSaved(false)));
      tile.append(button(started ? 'Решить заново' : 'Решить', 'sdx-solid-btn', () => openSaved(true)));
      list.append(tile);
    }
  }
  async function archiveCurrent() {
    if (!game || game.archived || !game.grid.entries.length || game.saving) return;
    const snapshotGame = game, owner = profile;
    const id = game.id;
    const snap = {key: owner + ':' + id, profile: owner, id, date: Date.now(), count: game.grid.entries.length, grid: game.grid};
    game.saving = true;
    if (refs.save) refs.save.disabled = true;
    let ok = false;
    try { ok = await storeSnapshot(snap); }
    finally { snapshotGame.saving = false; }
    if (ok) {
      snapshotGame.progress.archived = true;
      const saved = readProgress(snapshotGame.key);
      if (saved.signature === snapshotGame.id) {
        saved.archived = true;
        writeLocal(snapshotGame.key, saved);
      }
    }
    if (game === snapshotGame && view === 'puzzle') {
      if (refs.save) { refs.save.disabled = ok; refs.save.textContent = ok ? 'В архиве' : 'Сохранить в архив'; }
      showMessage(ok ? (finished() ? 'Всё решено. Кроссворд сохранён в архиве.' : 'Кроссворд сохранён в архиве.') : 'Не удалось записать архив в память устройства.', ok ? 'ok' : 'error');
    }
  }

  function makeBoard() {
    boardCells = new Map();
    const scroll = element('div', 'sdx-grid-scroll');
    scroll.tabIndex = 0;
    scroll.setAttribute('role','region');
    scroll.setAttribute('aria-label','Сетка кроссворда. Для выбора слова нажмите на клетку или используйте список подсказок.');
    const board = element('div', 'sdx-grid');
    board.style.setProperty('--sdx-cols', String(game.grid.width));
    board.style.setProperty('--sdx-rows', String(game.grid.height));
    for (const entry of game.grid.entries) {
      entry.letters.forEach((_, offset) => {
        const [x,y] = locationOf(entry, offset), key = x + ',' + y;
        if (!boardCells.has(key)) boardCells.set(key, {x, y, refs: [], number: null});
        const cell = boardCells.get(key);
        cell.refs.push({entry, offset});
        if (offset === 0) cell.number = entry.number;
      });
    }
    const frag = document.createDocumentFragment();
    boardCells.forEach(cell => {
      const square = element('button', 'sdx-cell');
      square.type = 'button';
      square.tabIndex = -1;
      square.style.setProperty('--sdx-x', String(cell.x));
      square.style.setProperty('--sdx-y', String(cell.y));
      square.dataset.xy = cell.x + ',' + cell.y;
      square.setAttribute('aria-label', cell.refs.map(v => v.entry.number + ' ' + direction(v.entry)).join(', '));
      if (cell.number != null) square.append(element('small','',cell.number));
      const glyph = element('span', 'sdx-letter');
      square.append(glyph);
      cell.el = square; cell.glyph = glyph;
      frag.append(square);
    });
    board.append(frag);
    board.addEventListener('click', evt => {
      const cell = evt.target.closest('[data-xy]');
      if (!cell) return;
      const refsHere=boardCells.get(cell.dataset.xy).refs;
      const active=refsHere.find(r=>r.entry===selected);
      const target=active && active.offset===cursor && refsHere.length===2
        ? refsHere.find(r=>r!==active) : active || refsHere.find(r=>!solved(r.entry)) || refsHere[0];
      activate(target.entry,{focus:true,offset:target.offset});
    });
    const frame = element('div', 'sdx-grid-frame');
    frame.append(board);
    scroll.append(frame);
    refs.scroll = scroll; refs.board = board;
    // Fit the exact stored geometry, including wide legacy archives, without horizontal panning.
    const resize = () => {
      if (!scroll.isConnected) return;
      const styles=getComputedStyle(scroll);
      const available=scroll.clientWidth-parseFloat(styles.paddingLeft)-parseFloat(styles.paddingRight)-2;
      const px=Math.min(43,Math.max(1,available/Math.max(1,game.grid.width)));
      board.style.setProperty('--sdx-measured-cell',px+'px');
      board.classList.toggle('sdx-dense',px<19);
    };
    refs.fitBoard=resize;
    if(window.ResizeObserver){ refs.boardObserver=new ResizeObserver(resize);refs.boardObserver.observe(scroll); }
    requestAnimationFrame(resize);
    return scroll;
  }
  function draftSlots(e) {
    const draft = game.progress.drafts[wordKey(e)];
    if (!draft || draft[0] !== e.letters.join('')) return [];
    // Old versions saved the native input string. New drafts preserve holes after editing a cell.
    return Array.isArray(draft[2]) ? draft[2] : Array.from(engine().normalizeAnswer(draft[1] || ''));
  }

  function refAt(entry, i) { return boardCells.get(locationOf(entry, i).join(',')); }
  function confirmed(cell) { return cell.refs.find(r => solved(r.entry)); }
  function displayedLetter(entry, i) {
    if (confirmed(refAt(entry, i))) return entry.letters[i];
    return draftSlots(entry)[i] || '';
  }
  function nextWritable(start, step, emptyOnly) {
    for (let i=start; i>=0 && i<selected.letters.length; i+=step) {
      if (!confirmed(refAt(selected,i)) && (!emptyOnly || !draftSlots(selected)[i])) return i;
    }
    return -1;
  }
  function paintCells(cells) {
    for (const cell of cells) {
      const active = cell.refs.find(r => r.entry === selected);
      const checked = confirmed(cell);
      const ownDraft = active || cell.refs.find(r => draftSlots(r.entry)[r.offset]);
      const glyph = checked ? (active || checked).entry.letters[(active || checked).offset] :
        ownDraft ? draftSlots(ownDraft.entry)[ownDraft.offset] || '' : '';
      if (cell.glyph.textContent !== glyph) cell.glyph.textContent = glyph;
      cell.el.classList.toggle('sdx-active', !!active);
      cell.el.classList.toggle('sdx-cursor', !!active && active.offset===cursor && !solved(selected));
      cell.el.classList.toggle('sdx-known', !!checked);
    }
  }
  function keepCursorVisible() {
    if (!selected || !refs.scroll) return;
    const cell = refAt(selected,cursor);
    if (!cell) return;
    const pane=refs.scroll, viewport=pane.getBoundingClientRect(), square=cell.el.getBoundingClientRect(), inset=8;
    if (square.top < viewport.top+inset) pane.scrollTop += square.top-viewport.top-inset;
    else if (square.bottom > viewport.bottom-inset) pane.scrollTop += square.bottom-viewport.bottom+inset;
  }
  function changeCursor(offset, follow) {
    const old=cursor;
    cursor=Math.max(0,Math.min(selected.letters.length-1,offset));
    paintCells([refAt(selected,old),refAt(selected,cursor)].filter(Boolean));
    if (follow) keepCursorVisible();
  }
  function nativeOffset(index) {
    return Array.from(refs.input.value).slice(0,index).join('').length;
  }
  function selectionOffsets() {
    const input=refs.input;
    return [input.selectionStart,input.selectionEnd].map(pos=>Array.from(input.value.slice(0,pos == null ? input.value.length : pos)).length);
  }
  function showInput() {
    const input=refs.input;
    input.value=selected.letters.map((_,i)=>displayedLetter(selected,i)||'·').join('');
    input.setSelectionRange(nativeOffset(cursor),nativeOffset(cursor+1));
  }
  function rememberSlots(slots) {
    const key=wordKey(selected);
    if (slots.some(Boolean)) game.progress.drafts[key]=[selected.letters.join(''),slots.join(''),slots];
    else delete game.progress.drafts[key];
    saveProgress();
  }
  function writeLetters(text,start,end,advance) {
    const letters=Array.from(engine().normalizeAnswer(text));
    if (!letters.length || solved(selected)) { showInput(); return; }
    const n=selected.letters.length, slots=Array.from({length:n},(_,i)=>draftSlots(selected)[i]||'');
    let i=Math.min(start,n-1),written=i;
    if (letters.length===n) {
      letters.forEach((ch,j)=>{if(!confirmed(refAt(selected,j))) slots[j]=ch;});
      written=n-1;
    } else {
      if(end-start>1) for(let j=start;j<Math.min(end,n);j++) slots[j]='';
      for (const letter of letters) {
        i=nextWritable(i,1,false);
        if(i<0)break;
        slots[i]=letter; written=i; i++;
      }
    }
    rememberSlots(slots);
    const next=nextWritable(written+1,1,true), first=nextWritable(0,1,true);
    changeCursor(next>=0?next:first>=0?first:written,true);
    showInput(); paintCells(selected.letters.map((_,j)=>refAt(selected,j)));
    showMessage('');
    if(advance && selected.letters.every((ch,j)=>displayedLetter(selected,j)===ch)) acceptWord();
  }
  function eraseLetters(start,end,backward) {
    if (solved(selected)) return;
    const slots=Array.from({length:selected.letters.length},(_,i)=>draftSlots(selected)[i]||'');
    let pos=Math.min(start,slots.length-1);
    if(end-start>1){
      for(let i=start; i<Math.min(end,slots.length); i++) slots[i]='';
    } else {
      if (backward && (!slots[pos] || confirmed(refAt(selected,pos)))) pos=nextWritable(pos-1,-1,false);
      else if (!backward && confirmed(refAt(selected,pos))) pos=nextWritable(pos+1,1,false);
      if(pos<0)return;
      slots[pos]='';
    }
    rememberSlots(slots);
    changeCursor(pos,true);showInput();paintCells(selected.letters.map((_,j)=>refAt(selected,j)));
    showMessage('');
  }
  function switchWord(delta, focus) {
    const entries=game.grid.entries, i=entries.indexOf(selected);
    if(i<0||entries.length<2)return;
    activate(entries[(i+delta+entries.length)%entries.length],{center:true,focus});
  }
  function optionLabel(e) {
    return (solved(e)?'✓ ':'')+e.number+(e.direction==='down'?' ↓ ':' → ')+(languageNames[e.lang]||'')+' · '+(e.clue||'Без подсказки');
  }
  function showPalette(entry) {
    refs.keys.hidden=!specialLetters[entry.lang]||solved(entry);
    refs.chars.hidden=true; refs.keys.setAttribute('aria-expanded','false');
    refs.keys.textContent=entry.lang==='ba'?'Ә':'É';
    refs.keys.setAttribute('aria-label',entry.lang==='ba'?'Башкирские буквы':'Французские буквы');
    refs.chars.replaceChildren();
    for(const ch of specialLetters[entry.lang]||''){
      const key=button(ch,'sdx-char',()=>{
        refs.input.focus({preventScroll:true});
        writeLetters(ch,cursor,cursor+1,true);
      });
      key.addEventListener('pointerdown',e=>e.preventDefault());
      refs.chars.append(key);
    }
  }
  function activate(entry, opts={}) {
    if(!entry)return;
    const previous = selected;
    selected=entry;
    const first=nextWritable(0,1,true);
    cursor=Number.isInteger(opts.offset)?opts.offset:first>=0?first:0;
    refs.input.readOnly=solved(entry);
    refs.input.lang=languageNames[entry.lang]?entry.lang:'';
    refs.submit.disabled=solved(entry);
    refs.select.value=String(entry.id);
    refs.number.textContent=entry.number+' '+direction(entry);
    refs.language.textContent=languageNames[entry.lang]||entry.section||'';
    refs.length.textContent=plural(entry.letters.length,['буква','буквы','букв']);
    refs.clue.textContent=entry.clue||'Подсказка отсутствует в Судаке.';
    const total=game.grid.entries.length, done=Object.keys(game.progress.solved).length;
    refs.progress.textContent=done+' / '+total;
    refs.meter.value=done; refs.meter.max=total;
    refs.meter.setAttribute('aria-label','Разгадано '+done+' из '+total);
    showMessage(finished()?'Все слова разгаданы.':solved(entry)?'Слово разгадано.':'',solved(entry)?'ok':'');
    if (refs.painted && previous) {
      const changed = new Set();
      for (const word of [previous, entry]) {
        word.letters.forEach((_, offset) => changed.add(refAt(word, offset)));
      }
      paintCells(changed);
    } else {
      paintCells(boardCells.values());
      refs.painted = true;
    }
    showPalette(entry);showInput();saveProgress();
    if(opts.center)keepCursorVisible();
    if(opts.focus&&!solved(entry)){refs.input.focus({preventScroll:true});showInput();}
  }
  function acceptWord() {
    if(!selected||solved(selected))return;
    const k=wordKey(selected);
    game.progress.solved[k]=selected.letters.join('');
    delete game.progress.drafts[k];
    refs.select.options[refs.select.selectedIndex].textContent=optionLabel(selected);
    const all=game.grid.entries,i=all.indexOf(selected);
    const next=all.slice(i+1).concat(all.slice(0,i)).find(e=>!solved(e));
    activate(next||selected,{center:true,focus:!!next && document.activeElement===refs.input});
    if(next)showMessage('Верно. Следующее слово.','ok');
    else{
      refs.input.blur();
      if(!game.archived&&!game.progress.archived)archiveCurrent();
      else showMessage('Все слова разгаданы.','ok');
    }
  }
  function submit(event) {
    event.preventDefault();
    if(!selected||solved(selected))return;
    if(selected.letters.every((ch,i)=>displayedLetter(selected,i)===ch)){acceptWord();return;}
    const blank=nextWritable(0,1,true);
    if(blank>=0){changeCursor(blank,true);showMessage('Остались пустые клетки.','error');}
    else showMessage('Проверьте написание слова.','error');
    refs.input.focus({preventScroll:true});showInput();
  }
  function bindTyping(input) {
    let composing=false;
    input.addEventListener('beforeinput',event=>{
      if(composing||event.isComposing||!event.cancelable||solved(selected))return;
      const [start,end]=selectionOffsets();
      if(event.inputType.startsWith('delete')){
        event.preventDefault();eraseLetters(start,end,event.inputType.includes('Backward'));
      } else if(event.inputType.startsWith('insert') && event.data!=null){
        event.preventDefault();writeLetters(event.data,start,end,true);
      }
    });
    input.addEventListener('paste',event=>{
      if(!event.clipboardData||solved(selected))return;
      const text=event.clipboardData.getData('text');
      if(!text)return;
      event.preventDefault();
      const [start,end]=selectionOffsets();
      writeLetters(text,start,end,true);
    });
    // Some keyboards commit composed accents or dictation without cancelable beforeinput.
    function syncNative() {
      if(!selected||solved(selected)||composing)return;
      const segments=input.value.normalize('NFC').toUpperCase().split('·');
      const slots=segments.flatMap((part,i)=>(i?['']:[]).concat(Array.from(engine().normalizeAnswer(part)))).slice(0,selected.letters.length);
      const caret=selectionOffsets()[0];
      rememberSlots(slots);changeCursor(Math.min(caret,selected.letters.length-1),true);
      showInput();paintCells(selected.letters.map((_,i)=>refAt(selected,i)));showMessage('');
    }
    input.addEventListener('input',event=>{if(!event.isComposing)syncNative();});
    input.addEventListener('compositionstart',()=>{composing=true;});
    input.addEventListener('compositionend',()=>{composing=false;syncNative();});
    input.addEventListener('click',()=>{
      if(solved(selected))return;
      const [start,end]=selectionOffsets();
      if(end-start>1)return;
      changeCursor(start,true);showInput();
    });
    input.addEventListener('keydown',event=>{
      if(composing||event.isComposing)return;
      const backwards=event.key==='ArrowLeft'||event.key==='ArrowUp';
      if(backwards||event.key==='ArrowRight'||event.key==='ArrowDown'){
        if(event.shiftKey||event.metaKey||event.ctrlKey||event.altKey)return;
        event.preventDefault();changeCursor(cursor+(backwards?-1:1),true);showInput();
      }
    });
  }
  function makeEditor() {
    const editor=element('section','sdx-editor');
    const bar=element('div','sdx-cluebar'), labels=element('div','sdx-clue-labels');
    refs.number=element('strong','sdx-number');
    const meta=element('span','sdx-meta');
    refs.language=element('span');refs.length=element('span');meta.append(refs.language,refs.length);
    labels.append(refs.number,meta);
    const navigation=element('div','sdx-direction-controls');
    const prev=button('‹','sdx-step',()=>switchWord(-1,false)),next=button('›','sdx-step',()=>switchWord(1,false));
    for (const step of [prev, next]) {
      step.addEventListener('pointerdown', event => {
        if (document.activeElement === refs.input) event.preventDefault();
      });
    }
    prev.setAttribute('aria-label','Предыдущая подсказка');next.setAttribute('aria-label','Следующая подсказка');
    const picker=element('label','sdx-picker');
    picker.append(element('span','','Подсказки'));
    refs.select=element('select','sdx-select');refs.select.setAttribute('aria-label','Выбрать подсказку');
    for(const entry of game.grid.entries){const opt=element('option','',optionLabel(entry));opt.value=String(entry.id);refs.select.append(opt);}
    refs.select.addEventListener('change',()=>activate(entriesById.get(refs.select.value),{center:true}));
    picker.append(refs.select);navigation.append(prev,picker,next);
    prev.disabled=next.disabled=game.grid.entries.length<2;
    bar.append(labels,navigation);
    refs.clue=element('p','sdx-clue');refs.clue.id='sdx-current-clue';
    const form=element('form','sdx-form');
    refs.input=element('input','sdx-answer');
    Object.assign(refs.input,{type:'text',autocomplete:'off',spellcheck:false,enterKeyHint:'go'});
    refs.input.setAttribute('autocorrect','off');refs.input.setAttribute('autocapitalize','off');
    refs.input.setAttribute('aria-label','Буквы выбранного слова');refs.input.setAttribute('aria-describedby',refs.clue.id);
    bindTyping(refs.input);form.addEventListener('submit',submit);
    refs.submit=element('button','sdx-solid-btn','Проверить');refs.submit.type='submit';
    refs.chars=element('div','sdx-chars');refs.chars.hidden=true;
    refs.keys=button('É','sdx-keys',()=>{
      refs.chars.hidden=!refs.chars.hidden;refs.keys.setAttribute('aria-expanded',String(!refs.chars.hidden));
    });
    form.append(refs.input,refs.keys,refs.submit);
    refs.status=element('p','sdx-feedback');refs.status.setAttribute('role','status');
    editor.append(bar,refs.clue,form,refs.chars,refs.status);
    return editor;
  }
  function renderPuzzle() {
    clearView('puzzle');
    makeHeader('Кроссворд', game.archived);
    if (!game.grid.entries.length) {
      dialog.append(element('p','sdx-empty','В Судаке пока нет слов для кроссворда.'));
      return;
    }
    const tools = element('div','sdx-grid-tools');
    const summary=element('div','sdx-summary');
    summary.append(element('span','',game.archived ? 'Из архива' : 'Решено'));
    refs.progress=element('strong','sdx-progress');
    refs.meter=element('progress','sdx-meter');
    summary.append(refs.progress,refs.meter);tools.append(summary);
    if (!game.archived) {
      refs.save = button(game.progress.archived ? 'В архиве' : 'Сохранить в архив','sdx-link',archiveCurrent);
      refs.save.disabled = !!game.progress.archived; tools.append(refs.save);
    }
    const main = element('main','sdx-play');
    main.append(makeBoard(),makeEditor()); dialog.append(tools, main);
    activate(selected);
    const token = sessionId;
    requestAnimationFrame(() => { if (sessionId === token) { refs.fitBoard(); keepCursorVisible(); } });
  }

  function fitViewport() {
    if (!dialog) return;
    const vp = window.visualViewport;
    const height = vp ? vp.height : innerHeight;
    dialog.dataset.compact = String(height < 480);
    dialog.style.setProperty('--sdx-vh', height + 'px');
    dialog.style.setProperty('--sdx-top', (vp ? vp.offsetTop : 0) + 'px');
    if (refs.fitBoard) refs.fitBoard();
  }
  function ensureDialog() {
    if (dialog) return;
    dialog = element('dialog','sdx-dialog');
    dialog.setAttribute('aria-label','Кроссворды Судака');
    dialog.addEventListener('close', afterClose);
    document.body.append(dialog);
    window.addEventListener('hashchange', () => { if (view) close(); });
    window.addEventListener('resize', fitViewport);
    if (window.visualViewport) {
      visualViewport.addEventListener('resize', fitViewport);
      visualViewport.addEventListener('scroll', fitViewport);
    }
  }
  function afterClose() {
    ++sessionId;
    if(refs.boardObserver) refs.boardObserver.disconnect();
    view = null; game = null; entriesById = null; boardCells = null; selected = null; refs = {};
    document.documentElement.classList.remove('sdx-open');
    if (dialog) dialog.replaceChildren();
    if (launcher && launcher.isConnected) launcher.focus({preventScroll:true});
  }
  function close() {
    if (!dialog || !view) return;
    if (typeof dialog.close === 'function') dialog.close();
    else { dialog.removeAttribute('open'); afterClose(); }
  }
  function open() {
    if (!source || view) return;
    ensureDialog(); fitViewport();
    view = 'opening';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open','');
    document.documentElement.classList.add('sdx-open');
    profile = readKey();
    const token = sessionId;
    const busy = element('p','sdx-empty','Собираем кроссворд…');
    dialog.replaceChildren(busy);
    requestAnimationFrame(() => {
      if (token !== sessionId || !view || !dialog.hasAttribute('open')) return;
      loadCurrent(true);
      const heading = dialog.querySelector('h2');
      if (heading) { heading.tabIndex = -1; heading.focus({preventScroll:true}); }
    });
  }
  function mount(el, options) {
    if (!el || !options || typeof options.getEntries !== 'function') return;
    source = options; launcher = el;
    if (mounted.has(el)) return;
    mounted.add(el);
    el.type = 'button'; el.classList.add('sdx-launch');
    el.setAttribute('aria-label','Кроссворд. Удерживайте две секунды, чтобы открыть.');
    const label = element('strong','','십자말풀이');
    label.lang = 'ko';
    el.replaceChildren(label, element('small','','Удерживайте 2 секунды'));
    let timer = 0, pointer = null, startX, startY, holdKey = null;
    function stop() {
      clearTimeout(timer); timer = 0; pointer = null; holdKey = null; el.classList.remove('sdx-holding');
      window.removeEventListener('blur',stop); document.removeEventListener('visibilitychange',stop);
    }
    function start() {
      el.classList.add('sdx-holding');
      window.addEventListener('blur',stop);
      document.addEventListener('visibilitychange',stop);
      timer = setTimeout(() => { stop(); if (el.isConnected && !document.hidden) open(); }, 2000);
    }
    el.addEventListener('pointerdown', e => {
      if (!e.isPrimary || e.button !== 0 || timer) return;
      pointer = e.pointerId; startX = e.clientX; startY = e.clientY;
      try { el.setPointerCapture(pointer); } catch (err) {}
      start();
    });
    el.addEventListener('pointermove', e => {
      if (e.pointerId !== pointer) return;
      const box = el.getBoundingClientRect();
      if (Math.hypot(e.clientX-startX, e.clientY-startY)>12 || e.clientX<box.left || e.clientX>box.right || e.clientY<box.top || e.clientY>box.bottom) stop();
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(type => el.addEventListener(type,e => { if (pointer === e.pointerId) stop(); }));
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('keydown', e => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (e.repeat || timer) return;
      holdKey = e.key; start();
    });
    el.addEventListener('keyup', e => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault(); if (holdKey === e.key) stop();
    });
    el.addEventListener('blur', () => { if (holdKey) stop(); });
    el.addEventListener('click', e => {
      // Assistive technology can activate a button without pointer or key events.
      if (e.detail === 0 && !timer) open();
    });
  }
  function refresh() {
    if (!view || view === 'opening') return;
    if (readKey() !== profile) { loadCurrent(true); return; }
    if (view === 'puzzle' && game && !game.archived) loadCurrent(false);
  }
  window.SudakCrossword = Object.freeze({mount, refresh, open, close});
}());
