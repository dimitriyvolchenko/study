// Variables used by Scriptable.
// icon-color: deep-gray; icon-glyph: book-open;
// Study-Sudak • Виджет слов из Судака для Scriptable на iPhone.
const home = 'https://dimitriyvolchenko.github.io/study/?open=sudak-widget#/all';
const fm = FileManager.local();
const path = fm.joinPath(fm.documentsDirectory(), 'study-sudak-words-v1.json');

function parseSnapshot(raw) {
  const snapshot = JSON.parse(raw);
  if (!snapshot || snapshot.format !== 'study-sudak-widget/1' || !Array.isArray(snapshot.words)) {
    throw new Error('Сначала нажмите «Скопировать слова» в разделе виджетов Судака.');
  }
  return snapshot.words.map(row => {
    if (!Array.isArray(row) || row.length !== 3 || row.some(part => typeof part !== 'string') || !row[0].trim()) {
      throw new Error('Не удалось прочитать карточки. Скопируйте слова из Судака ещё раз.');
    }
    return row;
  });
}

async function message(text) {
  const alert = new Alert();
  alert.title = 'Судак';
  alert.message = text;
  alert.addAction('Готово');
  await alert.presentAlert();
}

function readWords() {
  try { return fm.fileExists(path) ? parseSnapshot(fm.readString(path)) : []; }
  catch (_) { return []; }
}

async function importWords() {
  try {
    const words = parseSnapshot(Pasteboard.pasteString() || 'null');
    fm.writeString(path, JSON.stringify({format: 'study-sudak-widget/1', words}));
    await message(words.length ? 'Слова обновлены: ' + words.length + '. Виджет покажет их при следующем обновлении iOS.' :
      'Список очищен. Следующий набор можно перенести из Судака тем же способом.');
  } catch (error) {
    await message(error instanceof SyntaxError ? 'В буфере нет набора Судака. Нажмите «Скопировать слова» в приложении Study.' : error.message);
  }
}

function line(widget, text, font, color, lines, scale) {
  const item = widget.addText(text);
  item.font = font;
  if (color) item.textColor = new Color(color);
  item.lineLimit = lines;
  item.minimumScaleFactor = scale;
  return item;
}

function buildWidget(words, family, now) {
  const widget = new ListWidget();
  widget.url = home;
  const interval = 30 * 60 * 1000;
  const slot = Math.floor(now / interval);
  widget.refreshAfterDate = new Date((slot + 1) * interval);
  const current = words.length ? words[slot % words.length] : null;
  const term = current ? current[0] : 'Судак';
  const clue = current ? current[1] : 'Перенесите слова из Study';
  const section = current ? current[2] : 'Study';
  if (family === 'accessoryInline') {
    widget.addText(current ? term + ' · ' + clue : 'Судак · перенесите слова');
  } else if (family === 'accessoryCircular') {
    line(widget, term, Font.boldSystemFont(15), null, 3, 0.65);
  } else if (family === 'accessoryRectangular') {
    line(widget, term, Font.boldSystemFont(16), null, 1, 0.7);
    line(widget, clue, Font.systemFont(13), null, 2, 0.75);
  } else {
    const compact = family === 'small';
    widget.backgroundColor = new Color('#201d1a');
    widget.setPadding(compact ? 12 : 16, compact ? 14 : 19, compact ? 12 : 16, compact ? 14 : 19);
    line(widget, section, Font.semiboldSystemFont(11), '#e2bc8c', 1, 0.82);
    widget.addSpacer();
    line(widget, term, Font.boldSystemFont(compact ? 21 : 25), '#faf2dd', 2, 0.65);
    widget.addSpacer(4);
    line(widget, clue, Font.systemFont(compact ? 12 : 15), '#ded1bb', compact ? 3 : family === 'large' ? 8 : 3, 0.77);
    widget.addSpacer();
  }
  return widget;
}

if (!config.runsInWidget && args.queryParameters?.import === '1') {
  await importWords();
} else {
  let words = readWords();
  if (!config.runsInWidget && !words.length) {
    const alert = new Alert();
    alert.title = 'Слова Судака';
    alert.message = 'В Study откройте «Виджеты iPhone» → Scriptable и скопируйте слова.';
    alert.addAction('Импортировать из буфера');
    alert.addCancelAction('Позже');
    if (await alert.presentAlert() === 0) { await importWords(); words = readWords(); }
  }
  const widget = buildWidget(words, config.widgetFamily || 'medium', Date.now());
  Script.setWidget(widget);
  if (!config.runsInWidget) await widget.presentMedium();
}
Script.complete();
