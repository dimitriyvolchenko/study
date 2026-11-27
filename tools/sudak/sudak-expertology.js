/* Include expertology reading assignments in the regular Rocket selection and counts.
   Non-guide story-only entries already have a card in Sudak's reading list. */
function studyExpertReading(sectionId, item) {
  if (sectionId !== 'forensics' && sectionId !== 'pooh_expertology_full') return false;
  return !(PACKS[item.c] || []).length && (item.guide || !STORIES[item.c]);
}

(function () {
  'use strict';

  // Review prompts taken from the corresponding pages of the installed reader.
  // The prologue has no vocabulary. The exam uses the questions and key in chapters 18–19.
  var bookPacks = {
    POOHBK01: [
      ['Наука об общих закономерностях судебно-экспертной деятельности, её научных основах, методах, организации и развитии.', 'Судебная экспертология'],
      ['Предусмотренное процессуальным законом исследование с применением специальных знаний и дачей заключения.', 'Судебная экспертиза'],
      ['Знания за пределами обычного житейского опыта, необходимые для решения конкретной профессиональной задачи.', 'Специальные знания']
    ],
    POOHBK02: [
      ['Предоставленный для исследования носитель информации, например след, документ или файл.', 'Объект'],
      ['Обстоятельства, которые устанавливают с помощью специальных знаний при конкретной экспертизе.', 'Предмет'],
      ['То, что именно требуется установить, отвечая на конкретный вопрос исследования.', 'Задача']
    ],
    POOHBK03: [
      ['Установление индивидуального тождества объекта по его отображениям и признакам.', 'Криминалистическая идентификация']
    ],
    POOHBK04: [
      ['Задача отнести объект к определённому классу, виду или иной группе по общим признакам.', 'Классификационная задача']
    ],
    POOHBK05: [
      ['Установление по доступным признакам свойств и состояния объекта, характера изменений, механизма и условий события.', 'Судебно-экспертная диагностика']
    ],
    POOHBK06: [
      ['Какой тип задачи решают, когда выясняют, были ли осколки частями одного горшка?', 'Идентификация'],
      ['Какой тип задачи решают, когда устанавливают, каким воздействием разрушен горшок?', 'Диагностика'],
      ['Какой тип задачи решают, когда по следу определяют модель подошвы?', 'Классификация']
    ],
    POOHBK07: [
      ['Особенность объекта, используемая для его отождествления.', 'Идентификационный признак'],
      ['Время, в течение которого значимые свойства сохраняются настолько, что задачу отождествления ещё можно решить.', 'Идентификационный период'],
      ['Объект, чьё тождество устанавливают.', 'Идентифицируемый объект'],
      ['Носитель отображения, по которому устанавливают тождество, например след.', 'Идентифицирующий объект']
    ],
    POOHBK08: [
      ['Образцы, возникшие вне связи с данным делом, обычно до него. Пример — прежние записи.', 'Свободные образцы'],
      ['Образцы, возникшие в связи с делом, но без специальной цели провести экспертизу. Пример — собственноручное объяснение.', 'Условно-свободные образцы'],
      ['Образцы, полученные специально для сравнительного исследования.', 'Экспериментальные образцы']
    ],
    POOHBK09: [
      ['Кто по УПК РФ обладает специальными знаниями и назначается для производства судебной экспертизы и дачи заключения?', 'Эксперт'],
      ['Кого привлекают для профессиональной помощи при процессуальных действиях, работы с техникой, постановки вопросов эксперту и разъяснений?', 'Специалист']
    ],
    POOHBK10: [
      ['Форма использования специальных знаний, предусмотренная процессуальным законом и подчинённая его порядку.', 'Процессуальная форма'],
      ['Деятельность вне процессуальной формы, например обучение, научная работа или методическая консультация.', 'Непроцессуальная деятельность']
    ],
    POOHBK11: [
      ['Как называется письменное изложение содержания исследования и выводов по поставленным перед экспертом вопросам?', 'Заключение эксперта'],
      ['Завершающая часть заключения с ответами на поставленные вопросы.', 'Выводы'],
      ['Что даёт эксперт при допросе для разъяснения или уточнения уже данного заключения?', 'Показания эксперта']
    ],
    POOHBK12: [
      ['Способ исследования, например измерение или микроскопия.', 'Метод'],
      ['Научно обоснованная система действий, методов и условий их применения для решения определённой экспертной задачи.', 'Методика'],
      ['Как называют исследование, которое проверяет версии в контролируемых условиях?', 'Эксперимент']
    ],
    POOHBK13: [
      ['Вывод, который даёт определённый ответ в пределах исследованного вопроса.', 'Категорический вывод'],
      ['Вывод, который выражает обоснованное предположение.', 'Вероятный вывод'],
      ['Что констатирует эксперт, если научно обоснованный ответ по имеющимся данным получить нельзя?', 'Невозможность решения']
    ],
    POOHBK14: [
      ['Как называется рассмотрение заключения вместе с другими доказательствами с учётом его допустимости, относимости, достоверности и обоснованности?', 'Оценка заключения'],
      ['Какое качество исследования усиливается, когда в заключении отражены исходные данные, методы, иллюстрации и ограничения?', 'Проверяемость']
    ],
    POOHBK15: [
      ['Как называется экспертиза по ст. 200 УПК РФ, в которой участвуют не менее двух экспертов одной специальности?', 'Комиссионная экспертиза'],
      ['Как называется экспертиза по ст. 201 УПК РФ, в которой участвуют эксперты разных специальностей?', 'Комплексная экспертиза']
    ],
    POOHBK16: [
      ['Какую экспертизу по УПК РФ назначают при недостаточной ясности или полноте заключения либо при новых вопросах о ранее исследованных обстоятельствах?', 'Дополнительная экспертиза'],
      ['Какую экспертизу по тем же вопросам поручают другому эксперту при сомнениях в обоснованности заключения или противоречиях в выводах?', 'Повторная экспертиза'],
      ['Как называется экспертиза, которую по этим вопросам проводят впервые?', 'Первичная экспертиза']
    ],
    POOHBK17: [
      ['Круг профессиональных вопросов и полномочий эксперта.', 'Компетенция'],
      ['Фактическая способность человека решать вопросы, входящие в его профессиональную область.', 'Компетентность']
    ],
    POOHBK18: [
      ['Оставлен ли след данным ботинком Кролика? Назови тип задачи.', 'Идентификация'],
      ['Образовалась ли трещина от удара или нагревания? Назови тип задачи.', 'Диагностика'],
      ['К какому виду относится материал горшка? Назови тип задачи.', 'Классификация'],
      ['Сова помогает при осмотре правильно сфотографировать след. Какова её роль?', 'Специалист'],
      ['Дело ещё не возбуждено, но экспертиза назначена по ст. 144 УПК РФ. Какова форма использования специальных знаний?', 'Процессуальная'],
      ['Два эксперта одной специальности работают по ст. 200 УПК РФ. Какая это экспертиза?', 'Комиссионная'],
      ['Новый вопрос о ранее исследованных обстоятельствах требует исследования. Какая экспертиза возможна?', 'Дополнительная'],
      ['Возникли сомнения в обоснованности ответа на прежний вопрос. Какая экспертиза возможна?', 'Повторная'],
      ['Как называется письменное суждение специалиста по вопросам сторон в уголовном процессе?', 'Заключение специалиста']
    ],
    POOHBK19: [
      ['Тот же индивидуальный объект.', 'тождество'],
      ['Свойства, состояние, механизм.', 'диагностика'],
      ['Отнесение к группе.', 'классификация'],
      ['Сравнительный материал известного происхождения.', 'образец'],
      ['Итоговая часть заключения.', 'выводы'],
      ['Система научно обоснованных действий для задачи.', 'методика']
    ]
  };

  // All pack consumers expect the third column to contain an association or a source.
  Object.keys(bookPacks).forEach(function (code) {
    var source = 'Экспертология с Винни-Пухом · с. ' + (Number(code.slice(-2)) + 1);
    bookPacks[code] = bookPacks[code].map(function (row) { return [row[0], row[1], source]; });
  });

  // Older project metadata limits a pack clue to 140 characters. The SE2001
  // lessons also store each full term–definition pair as its own line in the story.
  // Recover matching continuations for offline consumers without opening the reader.
  function restoreCourseDefinitions() {
    Object.keys(PACKS).forEach(function (code) {
      if (PKG_CODE[code] !== 'se2001_full_unit_1' || !STORIES[code]) return;
      var pack = PACKS[code];
      if (!pack.some(function (row) { return row[0].length === 140; })) return;
      var lines = STORIES[code].text.split(/\r?\n/);
      PACKS[code] = pack.map(function (row) {
        if (row[0].length !== 140) return row;
        var prefix = row[1] + ' — ';
        var line = lines.find(function (text) { return text.startsWith(prefix + row[0]); });
        if (!line || line.length <= prefix.length + row[0].length) return row;
        return [line.slice(prefix.length), row[1], row[2]];
      });
    });
  }

  function composeReviewPacks() {
    Object.keys(bookPacks).forEach(function (code) {
      if (PKG_CODE[code] === 'pooh_expertology_full_book' && !(PACKS[code] || []).length) {
        PACKS[code] = bookPacks[code];
      }
    });
    restoreCourseDefinitions();
  }

  var composeStories = pkgComposeStories;
  pkgComposeStories = function () {
    composeStories();
    composeReviewPacks();
  };
  composeReviewPacks();

  function sourceInfo(code, description) {
    var story = STORIES[code];
    var hasTerms = Boolean((PACKS[code] || []).length);
    var isBook = PKG_CODE[code] === 'pooh_expertology_full_book';
    var isStory = !hasTerms && Boolean(story);
    var excerpt = description;
    if (isStory) excerpt = v10Text(String(story.text || story.hook_in || description || '').split(/\n\s*\n/)[0]);
    if (isBook && code === 'POOHBK00') {
      excerpt = 'Идентификация, диагностика, заключение эксперта и другие вещи, которые полезно различать до того, как съедены вещественные доказательства.';
    }
    return {
      href: (isStory ? '#/n/' : '#/l/') + encodeURIComponent(code),
      label: isBook ? 'Открыть главу' : isStory ? 'Открыть задание' : 'Открыть урок',
      excerpt: excerpt || ''
    };
  }

  function materialHTML(code, description, includeExcerpt) {
    var source = sourceInfo(code, description);
    var preview = includeExcerpt && source.excerpt
      ? '<p class="s19-reading-text">' + esc(source.excerpt) + '</p>' : '';
    return preview + '<a class="s19-source-link" href="' + esc(source.href) + '">' + source.label + '</a>';
  }

  function inExpertology(sectionId) {
    return sectionId === 'forensics' || sectionId === 'pooh_expertology_full';
  }

  var originalPack = apackHTML;
  apackHTML = function (group, entry) {
    var html = originalPack(group, entry);
    if (!inExpertology(group.s.id)) return html;
    var holder = document.createElement('div');
    holder.innerHTML = html;
    var card = holder.firstElementChild;
    var code = entry.it.c;
    var reading = !(PACKS[code] || []).length;
    card.classList.add('s19-expertology');
    if (reading) {
      var count = card.querySelector('.v11-count');
      if (count) count.textContent = 'Чтение';
      card.querySelectorAll('ol, [data-chk], .ap-lv').forEach(function (element) { element.remove(); });
    }
    card.querySelector('.ap-foot').insertAdjacentHTML('beforebegin', materialHTML(code, entry.it.d, reading));
    return holder.innerHTML;
  };

  // Story-only courses from older or imported projects already render in their own sortable cards.
  var drawSudak = renderAllN;
  renderAllN = function () {
    drawSudak();
    var box = document.getElementById('allBox');
    if (!box) return;
    box.querySelectorAll('.v9-story-only').forEach(function (card) {
      var code = card.dataset.v9Code;
      var item = v7Item(code);
      var notice = card.querySelector('.v11-no-list');
      if (!item || !inExpertology(item.sec) || !notice) return;
      card.classList.add('s19-expertology');
      notice.outerHTML = '<p class="s19-reading-title">' + esc(item.title) + '</p>' + materialHTML(code, item.desc, true);
    });
    box.querySelectorAll('.s19-source-link').forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        go(link.getAttribute('href'));
      });
    });
  };
})();
