/* A focused view of the live Sudak card, including its original study controls. */
(function () {
  'use strict';

  var grades = {
    look: ['初', 'Ознакомление'], work: ['固', 'Закрепление'],
    learn: ['習', 'Заучивание'], done: ['憶', 'Запоминание'], '': ['×', 'Снять отметку. Удерживайте 2 секунды']
  };
  var active = null;

  function focusQuietly(el) {
    if (el && el.isConnected) {
      try { el.focus({preventScroll: true}); } catch (e) { el.focus(); }
    }
  }

  function configureToggle(button, opened) {
    var label = opened ? 'Закрыть стекло' : 'Открыть на стекле';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-expanded', String(opened));
  }

  function updateGrade(row, stage) {
    row.classList.toggle('sg-has-stage', Boolean(stage && grades[stage]));
    row.querySelectorAll('[data-word-stage]').forEach(function (button) {
      var value = button.getAttribute('data-word-stage');
      if (!value) return;
      var current = value === stage;
      button.classList.toggle('on', current);
      button.setAttribute('aria-pressed', String(current));
    });
    var caption = row.parentElement.querySelector('small');
    if (caption) {
      var label = stage && grades[stage];
      caption.textContent = label ? 'Word Pack · ' + label[1] : 'Word Pack';
    }
  }

  function bindHoldToClear(button, applyGrade) {
    var timer = null, pointer = null, key = null, x = 0, y = 0;
    button.onclick = null;
    function stop() {
      if (timer === null) return;
      clearTimeout(timer);
      timer = null;
      key = null;
      var captured = pointer;
      pointer = null;
      if (captured !== null && button.hasPointerCapture && button.hasPointerCapture(captured)) {
        button.releasePointerCapture(captured);
      }
      button.classList.remove('sg-holding');
      window.removeEventListener('blur', stop);
      window.removeEventListener('pagehide', stop);
      window.removeEventListener('hashchange', stop);
      document.removeEventListener('visibilitychange', stop);
      window.removeEventListener('pointerdown', otherPointer, true);
    }
    function otherPointer(event) {
      if (event.pointerId !== pointer) stop();
    }
    function start() {
      button.classList.add('sg-holding');
      window.addEventListener('blur', stop);
      window.addEventListener('pagehide', stop);
      window.addEventListener('hashchange', stop);
      document.addEventListener('visibilitychange', stop);
      window.addEventListener('pointerdown', otherPointer, true);
      timer = setTimeout(function () {
        stop();
        if (button.isConnected && button.getClientRects().length && !document.hidden) applyGrade(button);
      }, 2000);
    }
    button.addEventListener('pointerdown', function (event) {
      if (!event.isPrimary || event.button !== 0 || timer !== null) return;
      pointer = event.pointerId;
      x = event.clientX;
      y = event.clientY;
      try { button.setPointerCapture(pointer); } catch (e) {}
      start();
    });
    button.addEventListener('pointermove', function (event) {
      if (pointer !== event.pointerId) return;
      var bounds = button.getBoundingClientRect();
      if (Math.hypot(event.clientX - x, event.clientY - y) > 12 ||
          event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) stop();
    });
    ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach(function (name) {
      button.addEventListener(name, function (event) { if (event.pointerId === pointer) stop(); });
    });
    button.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { stop(); return; }
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (timer !== null || event.repeat) return;
      key = event.key;
      start();
    });
    button.addEventListener('keyup', function (event) {
      if (event.key === ' ' || event.key === 'Enter') event.preventDefault();
      if (event.key === key) stop();
    });
    button.addEventListener('blur', stop);
    button.addEventListener('contextmenu', function (event) { event.preventDefault(); });
    button.addEventListener('click', function (event) {
      // A short tap or a synthesized click must never invoke the old clear handler.
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  function enhance(box, applyGrade) {
    if (!box) return;
    var cards = Array.from(box.querySelectorAll('.apack[data-apcode]'));
    cards.forEach(function (card) {
      var row = card.querySelector('.word-stage-marks');
      if (!row || row.querySelector('.sudak-glass-toggle')) return;
      row.classList.add('sg-grade-row');
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', 'Стадия повторения');
      var selected = row.querySelector('[data-word-stage].on');
      row.querySelectorAll('[data-word-stage]').forEach(function (button) {
        var stage = button.getAttribute('data-word-stage'), grade = grades[stage];
        if (!grade) return;
        var glyph = document.createElement('span');
        if (stage) glyph.lang = 'zh-Hant';
        glyph.setAttribute('aria-hidden', 'true');
        glyph.textContent = grade[0];
        button.replaceChildren(glyph);
        button.lang = 'ru';
        button.setAttribute('aria-label', grade[1]);
        button.title = grade[1];
        if (!stage) bindHoldToClear(button, applyGrade);
      });
      updateGrade(row, selected ? selected.getAttribute('data-word-stage') : '');
      var button = document.createElement('button');
      button.className = 'word-stage-btn sudak-glass-toggle';
      button.type = 'button';
      var glyph = document.createElement('span');
      glyph.textContent = '璃';
      glyph.lang = 'zh-Hant';
      button.appendChild(glyph);
      button.lang = 'ru';
      button.setAttribute('aria-haspopup', 'dialog');
      configureToggle(button, false);
      button.addEventListener('click', function () {
        if (active && active.card === card) close(true);
        else open(card, button, true);
      });
      row.appendChild(button);
    });
    // A full Sudak refresh can replace an open card, such as when starting a recall check.
    if (active && !active.dialog.isConnected) {
      var code = active.code, stage = active.lastStage;
      close(false);
      var card = cards.find(function (item) { return item.getAttribute('data-apcode') === code; });
      var toggle = card && card.querySelector('.sudak-glass-toggle');
      if (toggle) {
        open(card, toggle, false);
        if (stage != null) focusQuietly(card.querySelector('[data-word-stage="' + stage + '"]'));
      }
    }
  }

  function fit() {
    if (!active) return;
    var a = active, viewport = window.visualViewport;
    a.frame = 0;
    var dialog = a.dialog, stage = a.stage, canvas = a.canvas, card = a.card;
    // iOS may change the visual viewport as the keyboard or browser bars move.
    if (viewport) {
      dialog.style.width = viewport.width + 'px';
      dialog.style.height = viewport.height + 'px';
      dialog.style.top = viewport.offsetTop + 'px';
      dialog.style.left = viewport.offsetLeft + 'px';
    }
    var padding = getComputedStyle(dialog);
    var availWidth = Math.max(1, dialog.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight) - 2);
    var availHeight = Math.max(1, dialog.clientHeight - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom) - 2);
    var natural = Math.min(680, availWidth), words = card.querySelector('.v11-word-list');
    var count = words ? words.children.length : 0, best = null;
    // For a long subdivision, try columns before shrinking the type. Reading order stays vertical.
    var maxColumns = Math.min(4, Math.max(1, Math.ceil(count / 9)));
    function setLayout(width, columns) {
      canvas.style.width = width + 'px';
      if (words) words.style.columnCount = String(columns);
    }
    for (var columns = 1; columns <= maxColumns; columns++) {
      var width = columns === 1 ? natural : Math.max(natural, columns * 292);
      setLayout(width, columns);
      var usedWidth = Math.max(canvas.offsetWidth, card.scrollWidth), height = canvas.offsetHeight;
      var scale = Math.min(1, availWidth / usedWidth, availHeight / Math.max(1, height));
      if (!best || scale > best.scale * 1.025) best = {width: width, used: usedWidth, height: height, columns: columns, scale: scale};
      if (scale >= .999) break;
    }
    setLayout(best.width, best.columns);
    stage.style.width = (best.used * best.scale) + 'px';
    stage.style.height = (best.height * best.scale) + 'px';
    canvas.style.transform = 'scale(' + best.scale + ')';
  }

  function requestFit() {
    if (active && !active.frame) active.frame = requestAnimationFrame(fit);
  }

  function close(restoreFocus) {
    var a = active;
    if (!a) return;
    active = null;
    if (a.frame) cancelAnimationFrame(a.frame);
    if (a.observer) a.observer.disconnect();
    window.removeEventListener('resize', requestFit);
    if (window.visualViewport) {
      visualViewport.removeEventListener('resize', requestFit);
      visualViewport.removeEventListener('scroll', requestFit);
    }
    if (a.dialog.open && a.dialog.close) a.dialog.close();
    var list = a.card.querySelector('.v11-word-list');
    if (list) list.style.removeProperty('column-count');
    if (a.themeMeta) a.themeMeta.content = a.themeBefore;
    configureToggle(a.button, false);
    if (a.placeholder.isConnected) a.placeholder.replaceWith(a.card);
    a.dialog.remove();
    document.documentElement.classList.remove('sg-view-open');
    if (restoreFocus) focusQuietly(a.button);
  }

  function open(card, button, animate) {
    if (active) close(false);
    var origin = card.getBoundingClientRect(), parent = card.parentNode;
    var placeholder = document.createElement('div');
    placeholder.style.height = card.offsetHeight + 'px';
    placeholder.setAttribute('aria-hidden', 'true');
    var dialog = document.createElement('dialog');
    dialog.id = 'sudak-glass-dialog';
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Стекло · ' + (card.querySelector('.v11-section-name') || card.querySelector('.kh .tt')).textContent + ' · ' + card.getAttribute('data-apcode'));
    var stage = document.createElement('div'), canvas = document.createElement('div');
    stage.className = 'sg-fit-stage';
    canvas.className = 'sg-fit-canvas';
    stage.appendChild(canvas);
    dialog.appendChild(stage);
    parent.insertBefore(placeholder, card);
    parent.appendChild(dialog);
    canvas.appendChild(card);
    var a = active = {card: card, button: button, code: card.getAttribute('data-apcode'), dialog: dialog, placeholder: placeholder, stage: stage, canvas: canvas, frame: 0};
    a.themeMeta = document.querySelector('meta[name="theme-color"]');
    if (a.themeMeta) { a.themeBefore = a.themeMeta.content; a.themeMeta.content = '#000000'; }
    document.documentElement.classList.add('sg-view-open');
    configureToggle(button, true);
    // This stays in #allBox so note expansion, inputs and original event handlers keep working.
    if (dialog.showModal) dialog.showModal();
    else { dialog.setAttribute('open', ''); dialog.setAttribute('role', 'dialog'); }
    focusQuietly(button);
    fit();
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && stage.animate) {
      var end = stage.getBoundingClientRect();
      var dx = origin.left + origin.width / 2 - end.left - end.width / 2;
      var dy = origin.top + origin.height / 2 - end.top - end.height / 2;
      // A tall pack can start several screens above its own button. Keep its lift visible.
      dx = Math.max(-30, Math.min(30, dx * .2));
      dy = Math.max(-40, Math.min(40, dy * .2));
      var initial = Math.max(.85, Math.min(1, origin.width / Math.max(1, end.width))) * .96;
      stage.animate([
        {transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + initial + ')', opacity: .22},
        {transform: 'translate(0,0) scale(1)', opacity: 1}
      ], {duration: 460, easing: 'cubic-bezier(.19,.82,.25,1)'});
      card.classList.add('sg-forming');
      card.addEventListener('animationend', function done() { card.classList.remove('sg-forming'); }, {once: true});
    }
    if (window.ResizeObserver) {
      a.observer = new ResizeObserver(requestFit);
      a.observer.observe(card);
    }
    window.addEventListener('resize', requestFit);
    if (window.visualViewport) {
      visualViewport.addEventListener('resize', requestFit);
      visualViewport.addEventListener('scroll', requestFit);
    }
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(true); });
    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) { close(true); return; }
      var grade = event.target.closest('[data-word-stage]');
      a.lastStage = grade ? grade.getAttribute('data-word-stage') : null;
      if (grade) return;
      // Return the card to its siblings before the existing list handles reordering.
      if (event.target.closest('[data-v9-step]')) close(false);
      else requestFit();
    }, true);
    dialog.addEventListener('pointerdown', function (event) {
      if (event.target.closest('[data-v9-grab]')) close(false);
    }, true);
  }

  window.addEventListener('hashchange', function () { if (active && location.hash !== '#/all') close(false); });
  window.SudakGlass = {enhance: enhance, updateGrade: updateGrade, close: function () { close(true); }};
})();
