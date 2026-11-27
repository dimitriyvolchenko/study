/* Export the active Sudak words to an iScreen photo widget or a private Scriptable widget. */
(() => {
  'use strict';
  const scriptSource = __STUDY_SCRIPTABLE_SOURCE__;
  const format = 'study-sudak-widget/1';
  const scriptName = 'Study-Sudak';

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function action(label, handler, className = 'btn sec') {
    const node = element('button', label, className);
    node.type = 'button';
    node.addEventListener('click', handler);
    return node;
  }
  function link(label, url, className) {
    const node = element('a', label, className);
    node.href = url;
    return node;
  }

  function lines(ctx, text, width) {
    const result = [];
    let line = '';
    for (const word of text.trim().split(/\s+/u)) {
      if (!word) continue;
      const next = line ? line + ' ' + word : word;
      if (ctx.measureText(next).width <= width) { line = next; continue; }
      if (line) result.push(line);
      line = '';
      for (const ch of word) {
        if (line && ctx.measureText(line + ch).width > width) {
          result.push(line);
          line = '';
        }
        line += ch;
      }
    }
    if (line) result.push(line);
    return result;
  }
  function drawText(ctx, text, x, y, width, height, weight, size, minSize, ink) {
    let rows, leading, allowed;
    for (;;) {
      ctx.font = weight + ' ' + size + 'px -apple-system, BlinkMacSystemFont, Arial, sans-serif';
      leading = Math.ceil(size * 1.16);
      allowed = Math.max(1, Math.floor(height / leading));
      rows = lines(ctx, text, width);
      if (rows.length <= allowed || size <= minSize) break;
      size = Math.max(minSize, size - 2);
    }
    if (rows.length > allowed) {
      rows = rows.slice(0, allowed);
      const chars = [...rows[rows.length - 1]];
      while (chars.length && ctx.measureText(chars.join('') + '…').width > width) chars.pop();
      rows[rows.length - 1] = chars.join('') + '…';
    }
    ctx.fillStyle = ink;
    rows.forEach((value, i) => ctx.fillText(value, x, y + i * leading));
    return rows.length * leading;
  }
  function paint(canvas, row, wide) {
    const w = wide ? 1280 : 880, h = wide ? 600 : 880, pad = wide ? 66 : 64;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#2d2823'); bg.addColorStop(1, '#151412');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const width = w - 2 * pad;
    drawText(ctx, row[2] || 'Судак', pad, pad, width, h * 0.09, 600, wide ? 38 : 36, 27, '#e2bc8c');
    const divider = pad + (wide ? 65 : 68);
    ctx.fillStyle = '#665746';
    ctx.fillRect(pad, divider, width, 2);
    const top = divider + (wide ? 35 : 57);
    const used = drawText(ctx, row[0], pad, top, width, h * 0.34, 700, wide ? 91 : 88, 44, '#fbf3df');
    const next = top + used + (wide ? 16 : 28);
    drawText(ctx, row[1], pad, next, width, h - pad - next, 400, wide ? 51 : 49, 29, '#e4d7c1');
  }
  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = link('', url);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function copy(text, status, label) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('manual');
      await navigator.clipboard.writeText(text);
      status.replaceChildren(label);
    } catch (_) {
      const field = element('textarea');
      field.value = text;
      field.readOnly = true;
      field.setAttribute('aria-label', 'Текст для копирования');
      status.replaceChildren(field);
      field.focus();
      field.select();
      if (document.execCommand && document.execCommand('copy')) status.replaceChildren(label);
      else status.append(element('p', 'Выберите «Скопировать» для выделенного текста.'));
    }
  }

  function showPhotos(host, words) {
    if (!words.length) {
      host.append(element('p', 'Добавьте в Rocket урок со словами, затем вернитесь в Судак.'));
      return;
    }
    const controls = element('div', '', 'swid-fields');
    const wordLabel = element('label', 'Карточка'), sizeLabel = element('label', 'Размер виджета');
    const choice = element('select'), size = element('select');
    const groups = new Map();
    words.forEach((row, index) => {
      const section = row[2] || 'Судак';
      if (!groups.has(section)) {
        const group = element('optgroup'); group.label = section;
        groups.set(section, group); choice.append(group);
      }
      const option = element('option', row[0]);
      option.value = String(index);
      groups.get(section).append(option);
    });
    [['small','Квадратный'],['medium','Средний']].forEach(([id,title]) => {
      const option = element('option', title); option.value = id; size.append(option);
    });
    wordLabel.append(choice); sizeLabel.append(size); controls.append(wordLabel, sizeLabel);
    const canvas = element('canvas', '', 'swid-preview');
    canvas.setAttribute('role', 'img');
    const status = element('p', '', 'swid-status');
    status.setAttribute('role', 'status');
    let revision = 0, blob, file, canShare;
    const save = action('Сохранить карточку PNG', async () => {
      if (!blob) return;
      if (canShare) {
        try { await navigator.share({files: [file], title: words[Number(choice.value)][0]}); return; }
        catch (e) { if (e.name === 'AbortError') return; }
      }
      saveBlob(blob, 'Sudak-' + (Number(choice.value) + 1) + '-' + size.value + '.png');
      status.textContent = 'PNG сохранён в загрузки. На iPhone откройте его в «Файлах» и сохраните в «Фото».';
    }, 'btn');
    function redraw() {
      const token = ++revision, index = Number(choice.value) || 0, row = words[index];
      save.disabled = true; blob = null;
      status.textContent = '';
      paint(canvas, row, size.value === 'medium');
      canvas.setAttribute('aria-label', row[0] + ' — ' + row[1]);
      canvas.toBlob(result => {
        if (token !== revision || !host.isConnected) return;
        if (!result) { status.textContent = 'Не удалось подготовить PNG. Выберите карточку ещё раз.'; return; }
        blob = result;
        canShare = false;
        if (typeof File === 'function' && navigator.share && navigator.canShare) {
          file = new File([result], 'Sudak-' + (index + 1) + '-' + size.value + '.png', {type:'image/png'});
          try { canShare = navigator.canShare({files: [file]}); } catch (_) {}
        }
        save.disabled = false;
      }, 'image/png');
    }
    const guide = element('ol', '', 'swid-guide');
    for (const text of [
      'Сохраните карточку в «Фото». Для альбома сохраните несколько карточек по очереди.',
      'В iScreen откройте шаблон Photos или Album, выберите свои снимки и нажмите Save to My Widgets.',
      'Удерживайте свободное место на экране «Домой», добавьте виджет iScreen того же размера. В его настройках выберите сохранённый шаблон.'
    ]) guide.append(element('li', text));
    host.append(controls, canvas, save, status, guide);
    choice.onchange = size.onchange = redraw;
    redraw();
  }

  function showScript(host, words) {
    const how = element('details', '', 'swid-install');
    how.append(element('summary', 'Установить скрипт на iPhone'));
    const steps = element('ol', '', 'swid-guide');
    const install = element('li');
    const app = link('Scriptable', 'https://apps.apple.com/app/id1405459188');
    app.target = '_blank'; app.rel = 'noopener';
    install.append('Установите ', app, ' и откройте его один раз.');
    const make = element('li');
    make.append('Скопируйте код, ', link('создайте скрипт', 'scriptable:///add'), ', вставьте код и сохраните под именем Study-Sudak.');
    steps.append(install, make, element('li', 'Вернитесь сюда и перенесите слова кнопками ниже. На экране «Домой» добавьте виджет Scriptable и в его настройках выберите Study-Sudak. На экране блокировки подойдут строка или прямоугольник.'));
    const codeStatus = element('div', '', 'swid-status'); codeStatus.setAttribute('role', 'status');
    const getCode = action('Скопировать код', () => copy(scriptSource, codeStatus, 'Код скопирован.'));
    how.append(steps, getCode, codeStatus);
    const caption = element('p', words.length ? 'Виджет будет по очереди показывать эти слова и их переводы. Время обновления выбирает iOS.' : 'В текущем наборе нет слов. Импорт пустого набора очистит подборку виджета.');
    const copyStatus = element('div', '', 'swid-status'); copyStatus.setAttribute('role', 'status');
    const push = action('1. Скопировать слова (' + words.length + ')', () => copy(JSON.stringify({format, words}), copyStatus, 'Набор скопирован. Теперь импортируйте его в Scriptable.'), 'btn');
    const open = link('2. Импортировать в Scriptable', 'scriptable:///run/' + scriptName + '?import=1', 'btn sec');
    const actions = element('div', '', 'swid-actions'); actions.append(push, open);
    host.append(how, caption, actions, copyStatus, element('p', 'После изменения занятий в Rocket повторите перенос слов. Нажатие на виджет открывает Судак.'));
  }

  function mount(panel, entries) {
    panel.append(action('Виджеты iPhone', () => {
      const words = entries().filter(e => e && String(e.answer || '').trim()).map(e =>
        [String(e.answer), String(e.clue || ''), String(e.section || '')]);
      v7OpenDialog('Виджеты iPhone', '');
      const root = document.getElementById('v7DialogBody');
      const tabbar = element('div', '', 'swid-tabs');
      tabbar.setAttribute('role', 'group');
      tabbar.setAttribute('aria-label', 'Приложение для виджета');
      const host = element('div', '', 'swid-content');
      const tabs = [action('iScreen', () => select(0)), action('Scriptable', () => select(1))];
      function select(idx) {
        tabs.forEach((b, i) => b.setAttribute('aria-pressed', String(i === idx)));
        host.replaceChildren();
        if (idx === 0) showPhotos(host, words); else showScript(host, words);
      }
      tabbar.append(...tabs); root.append(tabbar, host); select(0);
    }, 'btn sec swid-launch'));
  }
  window.SudakWidgets = Object.freeze({mount});
})();
