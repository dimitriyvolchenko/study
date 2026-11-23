(function () {
  'use strict';
  const mounted = new WeakSet();
  const memory = new Map();
  let source, launcher, dialog, view, game, entriesById, boardCells, selected;
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
    const currentProfile = readKey(), entries = canonicalEntries(), id = signature(entries);
    if (!force && game && !game.archived && game.id === id && profile === currentProfile) return;
    profile = currentProfile;
    const grid = engine().build(entries, id);
    setGame(grid, id, false);
    renderPuzzle();
  }
  function clearView(next) {
    ++sessionId;
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
      const related = boardCells.get(cell.dataset.xy).refs;
      const at = related.findIndex(r => r.entry === selected);
      activate(related[(at + 1) % related.length].entry, {focus: true, center: false});
    });
    scroll.append(board);
    refs.scroll = scroll; refs.board = board;
    return scroll;
  }
  function centerSelected() {
    if (!selected || !refs.scroll) return;
    const [x, y] = locationOf(selected, 0), cell = boardCells.get(x + ',' + y);
    if (!cell) return;
    const pane = refs.scroll, box = pane.getBoundingClientRect(), tile = cell.el.getBoundingClientRect();
    // A long answer starts inside the viewport; pan within the grid without moving the page.
    const leadX = Math.min(box.width / 3, 2 * tile.width);
    const leadY = Math.min(box.height / 3, 2 * tile.height);
    if (tile.left < box.left || tile.right > box.right || tile.top < box.top || tile.bottom > box.bottom) {
      pane.scrollLeft += tile.left - box.left - leadX;
      pane.scrollTop += tile.top - box.top - leadY;
    }
  }
  function paintCells(cells) {
    const drafts = game.progress.drafts;
    const activeDraft = selected && drafts[wordKey(selected)];
    const typed = activeDraft ? Array.from(engine().normalizeAnswer(activeDraft[1])) : [];
    cells.forEach(cell => {
      const active = selected && cell.refs.find(r => r.entry === selected);
      const known = cell.refs.find(r => solved(r.entry));
      const display = active || known;
      let glyph = '';
      if (known && display) glyph = display.entry.letters[display.offset];
      else if (active && typed[active.offset]) glyph = typed[active.offset];
      if (cell.glyph.textContent !== glyph) cell.glyph.textContent = glyph;
      cell.el.classList.toggle('sdx-active', !!active);
      cell.el.classList.toggle('sdx-known', !!known);
    });
  }
  function progressLabel() {
    const n = Object.keys(game.progress.solved).length;
    return n + ' / ' + game.grid.entries.length;
  }
  function optionLabel(e) {
    return (solved(e) ? '✓ ' : '') + e.number + (e.direction === 'down' ? ' ↓ ' : ' → ') + (languageNames[e.lang] ? languageNames[e.lang] + ' · ' : '') + (e.clue || 'Без подсказки');
  }
  function activate(entry, opts) {
    if (!entry) return;
    selected = entry;
    const draft = game.progress.drafts[wordKey(entry)];
    refs.input.value = solved(entry) ? entry.answer : draft ? draft[1] : '';
    refs.input.readOnly = solved(entry);
    refs.input.lang = ['ru','en','ba','fr'].includes(entry.lang) ? entry.lang : '';
    refs.submit.disabled = solved(entry);
    refs.keys.hidden = !specialLetters[entry.lang] || solved(entry);
    refs.chars.hidden = true; refs.keys.setAttribute('aria-expanded','false');
    refs.keys.textContent = entry.lang === 'ba' ? 'Ә' : 'É';
    refs.keys.setAttribute('aria-label', entry.lang === 'ba' ? 'Башкирские буквы' : 'Французские буквы');
    refs.chars.replaceChildren();
    for (const ch of (specialLetters[entry.lang] || '')) {
      const key = button(ch, 'sdx-char', () => {
        const field = refs.input;
        const begin = field.selectionStart == null ? field.value.length : field.selectionStart;
        field.setRangeText(ch, begin, field.selectionEnd == null ? begin : field.selectionEnd, 'end');
        field.dispatchEvent(new Event('input', {bubbles:true})); field.focus({preventScroll:true});
      });
      key.addEventListener('pointerdown', evt => evt.preventDefault());
      refs.chars.append(key);
    }
    refs.select.value = String(entry.id);
    refs.number.textContent = entry.number + ' ' + direction(entry);
    refs.language.textContent = languageNames[entry.lang] || entry.section || '';
    refs.clue.textContent = entry.clue || 'Подсказка отсутствует в Судаке.';
    refs.length.textContent = plural(entry.letters.length, ['буква','буквы','букв']);
    refs.progress.textContent = progressLabel();
    showMessage(finished() ? 'Все слова разгаданы.' : solved(entry) ? 'Слово разгадано.' : '', solved(entry) ? 'ok' : '');
    paintCells(boardCells);
    saveProgress();
    if (opts && opts.center) centerSelected();
    if (opts && opts.focus && !solved(entry)) refs.input.focus({preventScroll:true});
  }
  function submit(evt) {
    evt.preventDefault();
    if (!selected || solved(selected)) return;
    if (engine().normalizeAnswer(refs.input.value) !== selected.letters.join('')) {
      showMessage('Пока не сходится. Проверьте написание слова.', 'error');
      refs.input.focus({preventScroll:true}); return;
    }
    const k = wordKey(selected);
    game.progress.solved[k] = selected.letters.join('');
    delete game.progress.drafts[k];
    refs.select.options[refs.select.selectedIndex].textContent = optionLabel(selected);
    const complete = finished();
    const choices = Array.from(refs.select.options).map(o => entriesById.get(o.value));
    const i = choices.indexOf(selected);
    const next = complete ? selected : choices.slice(i + 1).concat(choices.slice(0, i)).find(e => !solved(e));
    activate(next, {center:true, focus:!complete});
    if (!complete) showMessage('Верно. Следующая подсказка открыта.', 'ok');
    else {
      refs.input.blur();
      if (!game.archived && !game.progress.archived) archiveCurrent();
      else showMessage('Все слова разгаданы.', 'ok');
    }
  }
  function makeEditor() {
    const editor = element('section','sdx-editor');
    const navigation = element('div','sdx-navigation'), selectLabel = element('label','sdx-picker');
    const humanLabel = element('span','','Подсказки');
    const select = element('select','sdx-select');
    select.setAttribute('aria-label','Выбрать подсказку');
    game.grid.entries.slice().sort(byNumber).forEach(e => {
      const option = element('option','',optionLabel(e));
      option.value = String(e.id); select.append(option);
    });
    select.addEventListener('change', () => activate(entriesById.get(select.value), {center:true}));
    selectLabel.append(humanLabel, select);
    refs.progress = element('strong','sdx-progress');
    refs.progress.setAttribute('aria-label','Разгадано слов');
    refs.select = select;
    navigation.append(selectLabel, refs.progress);
    const info = element('div','sdx-meta');
    refs.number = element('strong'); refs.language = element('span'); refs.length = element('span');
    info.append(refs.number, refs.language, refs.length);
    refs.clue = element('p','sdx-clue');
    refs.clue.id = 'sdx-current-clue';
    const form = element('form','sdx-form');
    refs.input = element('input','sdx-answer');
    refs.input.type = 'text';
    refs.input.placeholder = 'Ваш ответ';
    refs.input.enterKeyHint = 'go';
    refs.input.autocomplete = 'off';
    refs.input.setAttribute('autocorrect','off'); refs.input.setAttribute('autocapitalize','off');
    refs.input.spellcheck = false;
    refs.input.setAttribute('aria-label','Ответ на подсказку');
    refs.input.setAttribute('aria-describedby',refs.clue.id);
    refs.input.addEventListener('input', () => {
      const key = wordKey(selected), raw = refs.input.value;
      if (raw) game.progress.drafts[key] = [selected.letters.join(''), raw];
      else delete game.progress.drafts[key];
      showMessage('');
      paintCells(selected.letters.map((_, i) => boardCells.get(locationOf(selected, i).join(','))));
      saveProgress();
    });
    form.addEventListener('submit', submit);
    refs.submit = element('button','sdx-solid-btn','Проверить'); refs.submit.type = 'submit';
    refs.chars = element('div','sdx-chars'); refs.chars.hidden = true;
    refs.keys = button('É', 'sdx-keys', () => {
      refs.chars.hidden = !refs.chars.hidden; refs.keys.setAttribute('aria-expanded', String(!refs.chars.hidden));
    });
    form.append(refs.input, refs.keys, refs.submit);
    refs.status = element('p','sdx-feedback');
    refs.status.setAttribute('role','status');
    editor.append(navigation, info, refs.clue, form, refs.chars, refs.status);
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
    tools.append(element('span','',game.archived ? 'Из архива' : 'Слова из Судака'));
    if (!game.archived) {
      refs.save = button(game.progress.archived ? 'В архиве' : 'Сохранить в архив','sdx-link',archiveCurrent);
      refs.save.disabled = !!game.progress.archived; tools.append(refs.save);
    }
    const main = element('main','sdx-play');
    main.append(makeBoard(),makeEditor()); dialog.append(tools, main);
    activate(selected);
    const token = sessionId;
    requestAnimationFrame(() => { if (sessionId === token) centerSelected(); });
  }

  function fitViewport() {
    if (!dialog) return;
    const vp = window.visualViewport;
    const height = vp ? vp.height : innerHeight;
    dialog.dataset.compact = String(height < 480);
    dialog.style.setProperty('--sdx-vh', height + 'px');
    dialog.style.setProperty('--sdx-top', (vp ? vp.offsetTop : 0) + 'px');
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
