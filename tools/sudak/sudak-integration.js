/* Connect both study modes to the same ordered packs and entries as the Sudak cards. */
(function () {
  function wordLanguage(word, section) {
    if (['ru', 'en', 'fr', 'ba'].includes(word.lang)) return word.lang;
    if (section.id === 'ba' || /башкир|bashkir/i.test(section.title)) return 'ba';
    if (/français|french|француз/i.test(section.title)) return 'fr';
    return /[а-яё]/i.test(word.target) ? 'ru' : 'en';
  }

  function crosswordEntries() {
    var packs = [];
    allGroups().forEach(function (group) {
      group.list.forEach(function (pack) {
        packs.push({code: pack.it.c, section: group.s});
      });
    });
    var ordered = StudyBoxOrder.ordered(packs, 'sudak', function (pack) { return pack.code; });
    var entries = [];
    ordered.forEach(function (pack) {
      v10Entries(pack.code).forEach(function (word, index) {
        var lang = wordLanguage(word, pack.section);
        var row = (PACKS[pack.code] || [])[index] || [];
        var clue = word.translation || word.etymology || v10Text(row[0]) || v10Text(row[2]);
        entries.push({
          id: word.id, answer: word.target, lang: lang, ipa: word.ipa || '',
          clue: clue || (pack.code + ' · слово ' + (index + 1)),
          section: pack.section.title + ' · ' + pack.code
        });
      });
    });
    return entries;
  }

  // Sync records are replaced on change. Keep a shallow snapshot so an upload
  // acknowledgment or a second tab's grade can update the existing card in place.
  var paintedOps = null;

  function paintGrade(card, stage) {
    var row = card.querySelector('.word-stage-marks');
    if (!row) return;
    SudakGlass.updateGrade(row, stage);
    var header = card.querySelector('.kh');
    var marker = header.querySelector('.mnow');
    if (!marker) {
      marker = document.createElement('span');
      marker.className = 'big-emoji mnow';
      header.insertBefore(marker, header.querySelector('.cdone, .cbtn'));
    }
    var status = ST[stage];
    marker.style.visibility = status ? 'visible' : 'hidden';
    marker.textContent = status ? status.e : '';
    marker.title = status ? status.name : '';
  }

  function applyGrade(button) {
    var card = button.closest('.apack[data-apcode]');
    if (!card || !card.isConnected) return;
    var code = card.getAttribute('data-apcode');
    var stage = button.getAttribute('data-word-stage') || '';
    var mark = {s: stage || null, t: Date.now()};
    var dayKey = todayISO() + '|' + code;
    state.wordMarks[code] = mark;
    state.wordLog[dayKey] = mark;
    paintGrade(card, stage);
    // autoSave persists locally before scheduling sync. Home and Habits redraw their trackers on entry.
    autoSave();
    if (paintedOps && state.syncOps) {
      [['wordMarks', code], ['wordLog', dayKey]].forEach(function (path) {
        var key = JSON.stringify(path);
        paintedOps[key] = state.syncOps[key];
      });
    }
  }

  var syncRender = v10RenderSyncResult;
  v10RenderSyncResult = function () {
    if (location.hash !== '#/all' || !paintedOps) return syncRender();
    var current = state.syncOps || {}, changedCodes = new Set();
    var keys = new Set(Object.keys(paintedOps).concat(Object.keys(current)));
    for (var key of keys) {
      var old = paintedOps[key], now = current[key];
      if (old === now || ProgressSync.same(old && old.v, now && now.v)) continue;
      var path = JSON.parse(key);
      // Opening Study can register daily activity after the initial Sudak draw.
      if (path[0] === 'activity') continue;
      if (path[0] !== 'wordMarks' && path[0] !== 'wordLog') return syncRender();
      if (path[0] === 'wordMarks') changedCodes.add(path[1]);
    }
    if (changedCodes.size) {
      document.querySelectorAll('#allBox .apack[data-apcode]').forEach(function (card) {
        var code = card.getAttribute('data-apcode');
        if (changedCodes.has(code)) paintGrade(card, (state.wordMarks[code] || {}).s || '');
      });
    }
    paintedOps = Object.assign({}, current);
    v10DeferredRender = false;
    refreshSaveMark();
  };

  var drawSudak = renderAllN;
  renderAllN = function () {
    drawSudak();
    var root = document.getElementById('allBox');
    var panel = root && root.querySelector('.lv.all');
    if (!panel) return;
    SudakGlass.enhance(root, applyGrade);
    root.querySelectorAll('.apack[data-apcode]').forEach(function (card) {
      var current = state.wordMarks[card.getAttribute('data-apcode')];
      paintGrade(card, (current && current.s) || '');
      card.querySelectorAll('[data-word-stage]:not([data-word-stage=""])').forEach(function (button) {
        button.onclick = function () { applyGrade(button); };
      });
    });
    paintedOps = Object.assign({}, state.syncOps);
    var launch = document.createElement('button');
    launch.type = 'button';
    panel.appendChild(launch);
    SudakCrossword.mount(launch, {
      getEntries: crosswordEntries,
      storageKey: 'study.sudak.crossword.v1.' + (CURP || 'guest')
    });
    SudakCrossword.refresh();
  };
})();
