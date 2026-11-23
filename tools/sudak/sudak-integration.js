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

  var drawSudak = renderAllN;
  renderAllN = function () {
    drawSudak();
    var root = document.getElementById('allBox');
    var panel = root && root.querySelector('.lv.all');
    if (!panel) return;
    SudakGlass.enhance(root);
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
