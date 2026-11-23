/* Sudak crosswords. Coordinates count written letters, including the silent ones. */
(() => {
  'use strict';

  function normalizeAnswer(answer) {
    return String(answer ?? '').normalize('NFC').toUpperCase().replace(/[^\p{L}\p{N}]/gu, '');
  }

  function languageFor(language, word) {
    const name = String(language || '').toLowerCase();
    if (/^ba(?:$|[-_])|bash|баш/.test(name)) return 'ba';
    if (/^fr|фран/.test(name)) return 'fr';
    if (/^ru|russ|рус|философ/.test(name)) return 'ru';
    if (/^en|англ/.test(name)) return 'en';
    if (/[ӘӨҮҒҠҢҺҘҪ]/u.test(word)) return 'ba';
    if (/\p{Script=Cyrillic}/u.test(word)) return 'ru';
    return 'en';
  }

  // Russian sound approximations are only used to find a crossing. They never
  // change the number of squares or the spelling checked by the game.
  const cyrillic = {
    Е:'Э', Ё:'О', Ю:'У', Я:'А', Ь:'', Ъ:'',
    Ә:'Э', Ө:'О', Ү:'У', Ғ:'Г', Ҡ:'К', Ң:'Н', Һ:'Х', Ҙ:'З', Ҫ:'С'
  };
  const latin = {
    A:'А', B:'Б', C:'К', D:'Д', E:'Э', F:'Ф', G:'Г', H:'Х', I:'И',
    J:'ДЖ', K:'К', L:'Л', M:'М', N:'Н', O:'О', P:'П', Q:'К', R:'Р',
    S:'С', T:'Т', U:'У', V:'В', W:'У', X:'КС', Y:'Й', Z:'З', Ç:'С', Œ:'Э'
  };
  // Each grapheme group has a sound anchor in its first square. Empty
  // continuation squares can still cross an identical letter in the same language.
  const englishGroups = [
    ['TCH','Ч'], ['DGE','ДЖ'], ['IGH','АЙ'], ['SH','Ш'], ['CH','Ч'],
    ['PH','Ф'], ['CK','К'], ['NG','Н'], ['EE','И'], ['OO','У'], ['EA','И'],
    ['AI','ЭЙ'], ['AY','ЭЙ'], ['OA','ОУ'], ['OI','ОЙ'], ['OY','ОЙ']
  ];
  const frenchGroups = [
    ['EAU','О'], ['PH','Ф'], ['CH','Ш'], ['GN','Н'], ['QU','К'],
    ['OU','У'], ['AU','О'], ['AI','Э'], ['EI','Э'], ['EU','Э'], ['ŒU','Э'],
    ['OI','УА']
  ];
  const stripAccent = letter => letter.normalize('NFD').replace(/\p{M}/gu, '');
  const isLatinVowel = letter => !!letter && 'AEIOUYŒ'.includes(stripAccent(letter));
  const englishVoicedTh = /^(THE|THESE|THOSE|THIS|THAT|THEN|THAN|THUS|THEM|THEIR|THEIRS|THEY|THERE|THOUGH|THEREFORE)$/;
  const frenchNasal = {AIN:'Э',AIM:'Э',EIN:'Э',IN:'Э',IM:'Э',AN:'А',AM:'А',EN:'А',EM:'А',ON:'О',OM:'О',UN:'Э',UM:'Э'};
  function latinSounds(word, lang) {
    const letters = [...word];
    const french = lang === 'fr';
    const sounds = Array(letters.length).fill('');
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i], next = letters[i + 1] || '', prev = letters[i - 1] || '';
      const tail = letters.slice(i).join('');
      const base = stripAccent(letter);
      if (!latin[letter] && !latin[base]) {
        sounds[i] = cyrillic[letter] ?? letter;
        continue;
      }
      if (tail.startsWith('TION') && (tail === 'TION' || tail.startsWith('TIONS') || tail.startsWith('TIONAL'))) {
        sounds[i] = french ? 'С' : 'Ш';
        sounds[i + 1] = french ? 'Й' : '';
        sounds[i + 2] = french ? 'О' : 'Э';
        sounds[i + 3] = french ? '' : 'Н';
        i += 3;
        continue;
      }
      if (french) {
        const nasal = [tail.slice(0, 3), tail.slice(0, 2)].find(group => {
          if (!frenchNasal[group]) return false;
          const after = tail[group.length];
          return !isLatinVowel(after) && after !== group[group.length - 1];
        });
        if (nasal) {
          sounds[i] = frenchNasal[nasal];
          i += nasal.length - 1;
          continue;
        }
      }
      const group = (french ? frenchGroups : englishGroups).find(([pattern]) => tail.startsWith(pattern));
      if (group) {
        sounds[i] = group[1];
        i += group[0].length - 1;
        continue;
      }
      let sound = latin[letter] || latin[base];
      if (letter === 'C' && /[EIY]/.test(stripAccent(next))) sound = 'С';
      if (letter === 'G' && /[EIY]/.test(stripAccent(next))) {
        sound = french ? 'Ж' : /^(GET|GIV|GIRL|GIFT|GEAR|GEESE)/.test(tail) ? 'Г' : 'ДЖ';
      }
      if (french) {
        if (letter === 'H') sound = '';
        if (letter === 'J') sound = 'Ж';
        if (letter === 'Y' && !isLatinVowel(next)) sound = 'И';
        if (letter === 'S' && isLatinVowel(prev) && isLatinVowel(next)) sound = 'З';
        if (i === letters.length - 1 && /[ESXDTZP]/.test(letter) && letters.length > 1 &&
            !/^(LE|DE|JE|ME|TE|SE|CE|QUE|AVEC|BUS|SUD|SEPT|NET)$/.test(word)) sound = '';
        if (i === letters.length - 1 && letter === 'R' && prev === 'E' && letters.length > 2 &&
            !/^(MER|FER|HIER|HIVER|CHER|AMER)$/.test(word)) sound = '';
      } else {
        if (tail.startsWith('TH')) {
          sounds[i] = englishVoicedTh.test(word) || /^(OTHER|MOTHER|FATHER|BROTHER|WEATHER|TOGETHER)/.test(word) ? 'З' : 'С';
          i++;
          continue;
        }
        if (letter === 'A') sound = 'Э';
        if (letter === 'U') sound = 'А';
        if (/^[AEIOU][BCDFGHJKLMNPQRSTVWXZ]E(?:S|D)?$/.test(tail) && !/^(HAVE|GIVE|LIVE|LOVE|COME|SOME|DONE)$/.test(word)) {
          sound = {A:'ЭЙ',E:'И',I:'АЙ',O:'ОУ',U:'У'}[letter];
        }
        if (letter === 'Y' && !isLatinVowel(next)) sound = 'И';
        if (i === letters.length - 1 && letter === 'E' && letters.length > 2) sound = '';
        if (i === 0 && (tail.startsWith('KN') || tail.startsWith('WR'))) sound = '';
        if (tail === 'MB' && i > 0) {
          sounds[i] = 'М';
          i++;
          continue;
        }
      }
      sounds[i] = sound;
      if (letter === next && !isLatinVowel(letter) && !(letter === 'C' && /[IEY]/.test(letters[i + 2] || ''))) i++;
    }
    return sounds;
  }

  const ipaToRussian = {
    'tʃ':'Ч','dʒ':'ДЖ','eɪ':'ЭЙ','aɪ':'АЙ','ɔɪ':'ОЙ','oʊ':'ОУ','əʊ':'ОУ','aʊ':'АУ',
    'ɪə':'ИЭ','eə':'Э','ʊə':'УЭ','wa':'УА','ɑ̃':'А','ɛ̃':'Э','ɔ̃':'О','œ̃':'Э',
    p:'П',b:'Б',t:'Т',d:'Д',k:'К',g:'Г','ɡ':'Г',f:'Ф',v:'В',s:'С',z:'З','ʃ':'Ш','ʒ':'Ж',
    'θ':'С','ð':'З',h:'Х',x:'Х',m:'М',n:'Н','ŋ':'Н','ɲ':'Н',l:'Л','ɫ':'Л',r:'Р','ɹ':'Р','ʁ':'Р',
    j:'Й',w:'У','ɥ':'У',a:'А','ɑ':'А','ʌ':'А','ɐ':'А','æ':'Э',e:'Э','ɛ':'Э','ə':'Э','ɜ':'Э',
    'ɚ':'ЭР','ɝ':'ЭР',i:'И','ɪ':'И',u:'У','ʊ':'У',y:'У',o:'О','ɔ':'О','ɒ':'О','ø':'Э','œ':'Э'
  };
  function ipaSounds(transcription) {
    const raw = String(transcription || '').trim().replace(/^[[/]/u, '').split(/[/\],;]/u)[0];
    const symbols = [...raw.normalize('NFD').replace(/[.\sˈˌːˑ͡()]/gu, '')];
    const sounds = [];
    for (let i = 0; i < symbols.length; i++) {
      const pair = symbols[i] + (symbols[i + 1] || '');
      if (symbols[i + 1] && ipaToRussian[pair]) {
        sounds.push(ipaToRussian[pair]);
        i++;
      } else if (ipaToRussian[symbols[i]]) {
        sounds.push(ipaToRussian[symbols[i]]);
      } else {
        return []; // Unknown transcription notation: retain the spelling rules.
      }
    }
    return sounds;
  }

  // Align a recorded lesson pronunciation with its written anchors. For example,
  // the French 'ch' in 'chaise' anchors /ʃ/ at c and leaves h for spelling only.
  function withPronunciation(estimate, recorded) {
    const slots = estimate.flatMap((sound, i) => sound ? [i] : []);
    if (!recorded.length || !slots.length || slots.length * recorded.length > 10000) return estimate;
    const isVowel = sound => /^[АЭИОУЫ]/.test(sound);
    const rows = slots.length + 1, cols = recorded.length + 1;
    const cost = Array.from({length:rows}, () => new Float32Array(cols));
    const step = Array.from({length:rows}, () => new Uint8Array(cols));
    for (let i = 1; i < rows; i++) { cost[i][0] = i; step[i][0] = 1; }
    for (let j = 1; j < cols; j++) { cost[0][j] = j; step[0][j] = 2; }
    for (let i = 1; i < rows; i++) {
      const predicted = estimate[slots[i - 1]];
      for (let j = 1; j < cols; j++) {
        const actual = recorded[j - 1];
        const difference = actual === predicted ? 0 : isVowel(actual) === isVowel(predicted) ? 0.8 : 2.3;
        const match = cost[i - 1][j - 1] + difference;
        const skipSlot = cost[i - 1][j] + 1, skipSound = cost[i][j - 1] + 1;
        const best = Math.min(match, skipSlot, skipSound);
        cost[i][j] = best;
        step[i][j] = best === match ? 0 : best === skipSlot ? 1 : 2;
      }
    }
    const result = Array(estimate.length).fill('');
    let i = rows - 1, j = cols - 1;
    while (i || j) {
      const move = step[i][j];
      if (move === 0) result[slots[--i]] = recorded[--j];
      else if (move === 1) i--;
      else j--;
    }
    return result;
  }

  function soundKeys(answer, language, ipa) {
    const word = normalizeAnswer(answer), lang = languageFor(language, word);
    // Resolve contexts per word, so "mot de passe" never forms digraphs across spaces.
    const segments = String(answer ?? '').normalize('NFC').toUpperCase().match(/[\p{L}\p{N}]+/gu) || [];
    const estimate = segments.flatMap(segment => {
      if (lang === 'fr' || lang === 'en') return latinSounds(segment, lang);
      return [...segment].map(letter => cyrillic[letter] ?? letter);
    });
    return ipa && (lang === 'fr' || lang === 'en') ? withPronunciation(estimate, ipaSounds(ipa)) : estimate;
  }

  const coord = (x, y) => x + ',' + y;
  function makeRandom(seed) {
    let state = 2166136261;
    for (const char of String(seed ?? 'sudak')) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function compatible(first, second) {
    if (first.lang === second.lang) return first.letter === second.letter;
    return !!first.sound && first.sound === second.sound;
  }

  function makeComponent() {
    return {grid:new Map(), index:new Map(), entries:[], left:0, right:0, top:0, bottom:0};
  }

  function indexKeys(token) {
    const exact = token.lang + ':' + token.letter;
    return token.sound ? [exact, '~' + token.sound] : [exact];
  }

  function place(board, entry, x, y, vertical) {
    const dx = vertical ? 0 : 1, dy = vertical ? 1 : 0;
    board.entries.push({...entry.data, letters:entry.letters, x, y, direction:vertical ? 'down' : 'across'});
    board.left = Math.min(board.left, x);
    board.top = Math.min(board.top, y);
    board.right = Math.max(board.right, x + (entry.tokens.length - 1) * dx);
    board.bottom = Math.max(board.bottom, y + (entry.tokens.length - 1) * dy);
    entry.tokens.forEach((token, i) => {
      const cx = x + i * dx, cy = y + i * dy, key = coord(cx, cy);
      const existing = board.grid.get(key);
      if (existing) {
        existing.crossed = true;
        return;
      }
      const anchor = {x:cx, y:cy, vertical, token, crossed:false};
      board.grid.set(key, anchor);
      for (const lookup of indexKeys(token)) {
        if (!board.index.has(lookup)) board.index.set(lookup, []);
        board.index.get(lookup).push(anchor);
      }
    });
  }

  function scorePosition(board, entry, x, y, vertical) {
    const dx = vertical ? 0 : 1, dy = vertical ? 1 : 0;
    const length = entry.tokens.length;
    const at = (cx, cy) => board.grid.get(coord(cx, cy));
    if (at(x - dx, y - dy) || at(x + dx * length, y + dy * length)) return -Infinity;
    let intersections = 0;
    for (let i = 0; i < length; i++) {
      const cx = x + dx * i, cy = y + dy * i;
      const cell = at(cx, cy);
      if (cell) {
        if (cell.crossed || cell.vertical === vertical || !compatible(entry.tokens[i], cell.token)) return -Infinity;
        intersections++;
      } else if (at(cx + dy, cy + dx) || at(cx - dy, cy - dx)) return -Infinity;
    }
    const width = Math.max(board.right, x + (length - 1) * dx) - Math.min(board.left, x) + 1;
    const height = Math.max(board.bottom, y + (length - 1) * dy) - Math.min(board.top, y) + 1;
    return intersections * 10 - (width + height) - Math.abs(width - height) * 0.4;
  }

  function findPosition(board, entry, random) {
    const tried = new Set();
    let best = null, high = -Infinity;
    for (let i = 0; i < entry.tokens.length; i++) {
      const token = entry.tokens[i];
      for (const lookup of indexKeys(token)) {
        const anchors = board.index.get(lookup);
        if (!anchors) continue;
        // Sample across the whole index on large daily lists, keeping lookup bounded.
        const count = Math.min(anchors.length, 24);
        const start = Math.floor(random() * anchors.length);
        for (let j = 0; j < count; j++) {
          const anchor = anchors[(start + Math.floor(j * anchors.length / count)) % anchors.length];
          if (anchor.crossed || !compatible(token, anchor.token)) continue;
          const vertical = !anchor.vertical;
          const x = anchor.x - (vertical ? 0 : i), y = anchor.y - (vertical ? i : 0);
          const signature = coord(x, y) + (vertical ? 'd' : 'a');
          if (tried.has(signature)) continue;
          tried.add(signature);
          const score = scorePosition(board, entry, x, y, vertical) + (i === 0 ? 0.25 : 0) + random() * 0.1;
          if (score > high) { high = score; best = {x,y,vertical}; }
        }
      }
    }
    return best;
  }

  function pack(components) {
    const area = components.reduce((sum, c) => sum + (c.right-c.left+2) * (c.bottom-c.top+2), 0);
    const wrap = Math.max(1, Math.ceil(Math.sqrt(area)));
    let x = 0, y = 0, rowHeight = 0, width = 0, height = 0;
    const entries = [];
    for (const board of components) {
      const w = board.right - board.left + 1, h = board.bottom - board.top + 1;
      if (x && x + w > wrap) { x = 0; y += rowHeight + 1; rowHeight = 0; }
      for (const entry of board.entries) entries.push({...entry, x:x + entry.x - board.left, y:y + entry.y - board.top});
      width = Math.max(width, x + w);
      height = Math.max(height, y + h);
      rowHeight = Math.max(rowHeight, h);
      x += w + 1;
    }
    entries.sort((a, b) => a.y - b.y || a.x - b.x || Number(a.direction === 'down') - Number(b.direction === 'down'));
    let number = 0, last = '';
    for (const entry of entries) {
      const start = coord(entry.x, entry.y);
      if (start !== last) number++;
      entry.number = number;
      last = start;
    }
    return {width,height,entries};
  }

  function build(source, seed) {
    const random = makeRandom(seed);
    let waiting = [];
    for (let i = 0; i < source.length; i++) {
      const data = source[i], word = normalizeAnswer(data.answer);
      if (!word) continue;
      const letters = [...word], lang = languageFor(data.lang, word);
      const sounds = soundKeys(data.answer, lang, data.ipa);
      const tokens = letters.map((letter, j) => ({letter, lang, sound:sounds[j]}));
      waiting.push({data:{...data, id:data.id ?? String(i)}, letters, tokens});
    }
    const components = [];
    while (waiting.length) {
      const board = makeComponent();
      components.push(board);
      place(board, waiting[0], 0, 0, false);
      waiting = waiting.slice(1);
      let previousSize;
      do {
        previousSize = waiting.length;
        waiting = waiting.filter(entry => {
          const position = findPosition(board, entry, random);
          if (!position) return true;
          place(board, entry, position.x, position.y, position.vertical);
          return false;
        });
      } while (waiting.length && waiting.length < previousSize);
      // Disjoint alphabets and words without a legal crossing form separate islands.
    }
    return pack(components);
  }

  globalThis.SudakCrosswordEngine = Object.freeze({build, normalizeAnswer, soundKeys});
})();
