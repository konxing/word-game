(function () {
  'use strict';
  const lessons = window.TYPING_LESSONS;
  const engine = window.TypingGameEngine;
  const STORAGE_KEY = 'typing-harbor-progress-v1';
  const byId = (id) => document.getElementById(id);
  const dom = {
    welcome: byId('welcomeView'), lesson: byId('lessonView'), result: byId('resultView'), main: byId('mainContent'),
    list: byId('lessonList'), completed: byId('completedCount'), days: byId('practicedDays'),
    target: byId('targetDisplay'), feedback: byId('feedback'), keyboard: byId('visualKeyboard'),
    lessonNumber: byId('lessonNumber'), lessonTitle: byId('lessonTitle'), lessonDescription: byId('lessonDescription'), phase: byId('phaseLabel'),
    progressText: byId('lessonProgressText'), progressFill: byId('progressFill'), progressMarker: byId('progressMarker'),
    targetLabel: byId('targetLabel'), fingerHint: byId('fingerHint'), imeWrap: byId('chineseEntryWrap'), imeInput: byId('chineseEntry'), keyboardPanel: byId('keyboardPanel'),
    fontToggle: byId('fontToggle'), soundToggle: byId('soundToggle'), showAll: byId('showAllLessonsButton')
  };
  let session = null;
  let finishTimer = null;
  let audioContext = null;
  let composing = false;
  let memoryOnly = false;
  let showAllLessons = false;
  const defaults = { completed: {}, days: [], lastLessonId: '01', largeText: false, soundEnabled: false };
  function localDay() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaults, completed: {}, days: [] };
      const parsed = JSON.parse(raw);
      return {
        ...defaults,
        completed: parsed && typeof parsed.completed === 'object' && parsed.completed && !Array.isArray(parsed.completed) ? parsed.completed : {},
        days: Array.isArray(parsed.days) ? parsed.days.filter(day => /^\d{4}-\d\d-\d\d$/.test(day)).slice(-366) : [],
        lastLessonId: lessons.some(l => l.id === parsed.lastLessonId) ? parsed.lastLessonId : '01',
        largeText: parsed.largeText === true,
        soundEnabled: parsed.soundEnabled === true
      };
    } catch (_) { memoryOnly = true; return { ...defaults, completed: {}, days: [] }; }
  }
  let progress = loadProgress();
  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
    catch (_) { memoryOnly = true; }
  }
  function setView(view) {
    dom.welcome.hidden = view !== 'welcome';
    dom.lesson.hidden = view !== 'lesson';
    dom.result.hidden = view !== 'result';
  }
  function setFeedback(message, kind) {
    dom.feedback.textContent = message;
    dom.feedback.className = 'feedback' + (kind ? ' ' + kind : '');
  }
  function renderStats() {
    const count = lessons.filter(l => progress.completed[l.id]).length;
    dom.completed.textContent = `${count} / ${lessons.length} 关`;
    dom.days.textContent = `${new Set(progress.days).size} 天`;
  }
  function renderList() {
    dom.list.replaceChildren();
    const anchor = session ? session.lesson : engine.nextRecommendedLesson(lessons, progress.completed, localDay());
    const anchorIndex = Math.max(0, lessons.findIndex(l => l.id === anchor.id));
    const start = Math.max(0, Math.min(anchorIndex - 1, lessons.length - 4));
    const visible = showAllLessons ? lessons : lessons.slice(start, start + 4);
    dom.showAll.textContent = showAllLessons ? '收起关卡' : `查看全部 ${lessons.length} 关`;
    dom.showAll.setAttribute('aria-expanded', String(showAllLessons));
    let lastPhase = '';
    visible.forEach(lesson => {
      if (lesson.phase !== lastPhase) {
        lastPhase = lesson.phase;
        const title = document.createElement('div');
        title.className = 'phase-title';
        title.textContent = lastPhase;
        dom.list.appendChild(title);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lesson-tile' + (session && session.lesson.id === lesson.id ? ' active' : '');
      button.setAttribute('aria-label', `第 ${Number(lesson.id)} 关：${lesson.title}${progress.completed[lesson.id] ? '，已完成' : ''}`);
      if (session && session.lesson.id === lesson.id) button.setAttribute('aria-current', 'step');
      const index = document.createElement('span');
      index.className = 'lesson-index'; index.textContent = lesson.id;
      const details = document.createElement('span'); details.className = 'lesson-text';
      const name = document.createElement('span'); name.className = 'lesson-name'; name.textContent = lesson.title;
      const sub = document.createElement('span'); sub.className = 'lesson-sub'; sub.textContent = progress.completed[lesson.id] ? '已经练过 · 随时复习' : '点一下就能练';
      details.append(name, sub); button.append(index, details);
      if (progress.completed[lesson.id]) {
        const check = document.createElement('span'); check.className = 'lesson-check'; check.textContent = '✓'; check.setAttribute('aria-hidden', 'true'); button.appendChild(check);
      }
      button.addEventListener('click', () => startLesson(lesson.id));
      dom.list.appendChild(button);
    });
  }
  const keyboardRows = [
    '1234567890'.split('').map(key => [key, key]),
    'qwertyuiop'.split('').map(key => [key, key.toUpperCase()]),
    'asdfghjkl;'.split('').map(key => [key, key === ';' ? '；' : key.toUpperCase()]).concat([['Enter', '回车']]),
    'zxcvbnm'.split('').map(key => [key, key.toUpperCase()]),
    [[' ', '空格']]
  ];
  function buildKeyboard() {
    dom.keyboard.replaceChildren();
    dom.keyboard.setAttribute('aria-hidden', 'true');
    keyboardRows.forEach(rowKeys => {
      const row = document.createElement('div'); row.className = 'key-row';
      rowKeys.forEach(([key, label]) => {
        const keyDiv = document.createElement('div');
        keyDiv.className = 'key';
        if (key === 'f' || key === 'j') keyDiv.classList.add('home-marker');
        if (key === ' ') keyDiv.classList.add('space-key');
        if (key === 'Enter') keyDiv.classList.add('enter-key');
        keyDiv.dataset.key = key;
        keyDiv.textContent = label;
        row.appendChild(keyDiv);
      });
      dom.keyboard.appendChild(row);
    });
  }
  function highlightKey(expected, wrong) {
    dom.keyboard.querySelectorAll('.key').forEach(node => {
      node.classList.toggle('key-expected', !!expected && node.dataset.key === expected);
      node.classList.toggle('wrong-key', !!wrong && node.dataset.key === wrong);
    });
  }
  function clearTimer() {
    if (finishTimer !== null) { clearTimeout(finishTimer); finishTimer = null; }
  }
  function focusGame() {
    dom.main.focus({ preventScroll: true });
  }
  function showHome() {
    clearTimer(); session = null; composing = false;
    setView('welcome'); renderList(); renderStats();
    const next = engine.nextRecommendedLesson(lessons, progress.completed, localDay());
    const begin = byId('beginButton');
    begin.dataset.lessonId = next.id;
    begin.innerHTML = `${Object.keys(progress.completed).length ? '开始今天的轻松练习' : '开始轻松练习'} <span aria-hidden="true">→</span>`;
    const dueReview = !!progress.completed[next.id];
    byId('recommendationHint').textContent = dueReview
      ? `推荐先复习「${next.title}」。重复练过的内容，会更熟悉。`
      : `推荐从「${next.title}」开始。每次只练一小段，不用赶时间。`;
  }
  function startLesson(id, mode = 'easy') {
    const original = lessons.find(l => l.id === id);
    if (!original) return;
    const lesson = { ...original, items: engine.practiceItems(original, mode) };
    clearTimer(); composing = false;
    session = { lesson, practiceMode: mode, itemIndex: 0, characterIndex: 0, correct: 0, errors: 0, consecutiveErrors: 0, locked: false, lastInputWasWrong: false };
    progress.lastLessonId = lesson.id; saveProgress();
    dom.lessonNumber.textContent = `第 ${Number(lesson.id)} 关 / 共 ${lessons.length} 关`;
    dom.lessonTitle.textContent = lesson.title;
    dom.lessonDescription.textContent = lesson.description;
    byId('practiceMode').textContent = mode === 'full' ? '完整练习 · 不计时' : '轻松练习 · 只练一小段';
    dom.phase.textContent = lesson.phase;
    dom.imeWrap.hidden = lesson.mode !== 'hanzi';
    dom.keyboardPanel.hidden = lesson.mode === 'hanzi';
    dom.imeInput.value = ''; dom.imeInput.disabled = false;
    setView('lesson'); renderList(); renderExercise();
    setFeedback(lesson.mode === 'hanzi' ? '在输入框中打出屏幕上的汉字。' : '看哪个键发亮，就按哪个键。');
    if (lesson.mode === 'hanzi') dom.imeInput.focus({ preventScroll: true }); else focusGame();
  }
  function renderExercise() {
    if (!session) return;
    const { lesson, itemIndex, characterIndex, correct } = session;
    const item = lesson.items[itemIndex];
    if (item === undefined) return;
    const total = engine.totalUnits(lesson);
    const pct = engine.percent(correct, total);
    dom.progressText.textContent = `${correct} / ${total}`;
    dom.progressFill.style.width = pct + '%';
    dom.progressMarker.style.left = pct + '%';
    dom.target.replaceChildren();
    dom.targetLabel.textContent = lesson.mode === 'key' ? '请按这个键' : lesson.mode === 'latin' ? '照着输入这一行' : '请打出这句话';
    if (lesson.mode === 'key') {
      const span = document.createElement('span');
      span.className = 'target-char key-single current';
      if (item === ' ') span.classList.add('space-char');
      span.textContent = engine.displayKey(item);
      dom.target.appendChild(span);
    } else {
      const typed = lesson.mode === 'hanzi' ? dom.imeInput.value : '';
      const currentPosition = lesson.mode === 'hanzi' && engine.validChinesePrefix(typed, item) ? Array.from(typed).length : characterIndex;
      Array.from(item).forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'target-char ' + (i < currentPosition ? 'correct' : i === currentPosition ? 'current' : 'pending');
        if (ch === ' ') span.classList.add('space-char');
        span.textContent = ch === ' ' ? ' ' : ch;
        dom.target.appendChild(span);
      });
    }
    if (lesson.mode === 'hanzi') {
      dom.fingerHint.textContent = lesson.hint;
    } else {
      const key = engine.nextCharacter(lesson, itemIndex, characterIndex);
      dom.fingerHint.textContent = engine.fingerHint(key);
      highlightKey(key);
    }
  }
  function beep(success) {
    if (!progress.soundEnabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioContext ||= new Audio();
      if (audioContext.state === 'suspended') audioContext.resume();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine'; osc.frequency.value = success ? 620 : 230;
      gain.gain.setValueAtTime(0.035, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + .1);
      osc.connect(gain).connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + .11);
    } catch (_) { /* 声音不可用时不影响练习 */ }
  }
  function markItemCompleted(unitCount) {
    if (!session) return;
    session.correct += unitCount;
    session.consecutiveErrors = 0;
    session.locked = true;
    renderExercise();
    setFeedback('打对了！继续保持。', 'success');
    beep(true);
    finishTimer = setTimeout(() => {
      finishTimer = null;
      if (!session) return;
      session.itemIndex += 1;
      session.characterIndex = 0;
      session.lastInputWasWrong = false;
      session.locked = false;
      dom.imeInput.disabled = false;
      dom.imeInput.value = '';
      if (session.itemIndex >= session.lesson.items.length) finishLesson();
      else {
        renderExercise();
        setFeedback(session.lesson.mode === 'hanzi' ? '很好，接着输入下一句。' : '很好，接着按发亮的键。', 'success');
        if (session.lesson.mode === 'hanzi') dom.imeInput.focus({ preventScroll: true });
        else focusGame();
      }
    }, 350);
  }
  function onGlobalKey(event) {
    if (!session || session.locked || session.lesson.mode === 'hanzi' || event.isComposing || event.keyCode === 229) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key;
    if (key.length !== 1 && key !== 'Enter' && key !== 'Backspace') return;
    // 此关不使用浏览器文本框；阻止空格滚动和回车激活旧按钮。
    event.preventDefault();
    if (key === 'Backspace') { setFeedback('这关不需要删除；照着发亮的键再按一次就好。'); return; }
    const next = engine.nextCharacter(session.lesson, session.itemIndex, session.characterIndex);
    if (engine.matchesKey(key, next)) {
      session.consecutiveErrors = 0;
      if (session.lesson.mode === 'key') {
        markItemCompleted(1);
      } else {
        session.correct += 1;
        session.characterIndex += 1;
        if (session.characterIndex >= Array.from(session.lesson.items[session.itemIndex]).length) {
          // correct 已经计入，避免重复累加。
          markItemCompleted(0);
        } else {
          renderExercise(); setFeedback('对了！继续按下一个亮起的键。', 'success'); beep(true);
        }
      }
    } else {
      session.errors += 1;
      session.consecutiveErrors += 1;
      const readable = engine.displayKey(next);
      setFeedback(session.consecutiveErrors >= 2
        ? `可以先看下方亮起来的「${readable}」键，再慢慢找，找到了就按。`
        : `没关系，再找一下「${readable}」键。`, 'warning');
      highlightKey(next, key.toLowerCase()); beep(false);
    }
  }
  function handleChineseInput() {
    if (!session || session.lesson.mode !== 'hanzi' || composing || session.locked) return;
    const item = session.lesson.items[session.itemIndex];
    const typed = dom.imeInput.value;
    const isPrefix = engine.validChinesePrefix(typed, item);
    if (!isPrefix) {
      if (!session.lastInputWasWrong) session.errors++;
      session.lastInputWasWrong = true;
      setFeedback('有一个字不一样。可以按退格键修改，再继续输入。', 'warning');
      renderExercise(); return;
    }
    session.lastInputWasWrong = false;
    if (typed === item) {
      dom.imeInput.disabled = true;
      markItemCompleted(Array.from(item).length);
    } else {
      renderExercise();
      setFeedback(typed ? '很好，接着打出剩下的字。' : '在上面的输入框里输入汉字。', 'success');
    }
  }
  function finishLesson() {
    if (!session) return;
    const { lesson, correct, errors } = session;
    const acc = engine.accuracy(correct, errors);
    const rating = engine.stars(correct, errors);
    const day = localDay();
    const current = progress.completed[lesson.id] || {};
    progress.completed[lesson.id] = {
      stars: Math.max(rating, Number(current.stars) || 0),
      bestAccuracy: Math.max(acc, Number(current.bestAccuracy) || 0),
      attempts: (Number(current.attempts) || 0) + 1,
      fullAttempts: (Number(current.fullAttempts) || 0) + (session.practiceMode === 'full' ? 1 : 0),
      lastPracticed: day
    };
    if (!progress.days.includes(day)) progress.days.push(day);
    if (progress.days.length > 366) progress.days = progress.days.slice(-366);
    saveProgress();
    byId('resultCorrect').textContent = String(correct);
    byId('resultAccuracy').textContent = acc + '%';
    byId('resultTitle').textContent = '这一小段，练完了！';
    byId('resultAchievement').textContent = `今天又练熟了 ${correct} 个按键或字符`;
    byId('resultMessage').textContent = errors === 0
      ? '这次全部按对了。记住手指找到键盘的感觉，下一关也可以慢慢来。'
      : '打错以后能重新找到正确的键，同样是在学习。继续练，手指会越来越熟悉。';
    const hasNextLesson = lessons.findIndex(l => l.id === lesson.id) < lessons.length - 1;
    byId('nextButton').textContent = hasNextLesson ? '试试下一关 →' : '所有关卡都练过了 · 回首页';
    setView('result'); renderStats(); renderList();
    byId('nextButton').focus({ preventScroll: true });
  }
  function applyPreferences() {
    document.documentElement.classList.toggle('large-mode', progress.largeText);
    dom.fontToggle.setAttribute('aria-pressed', String(progress.largeText));
    dom.fontToggle.textContent = progress.largeText ? 'A− 恢复字体' : 'A+ 放大字体';
    dom.soundToggle.setAttribute('aria-pressed', String(progress.soundEnabled));
    dom.soundToggle.textContent = `声音：${progress.soundEnabled ? '开' : '关'}`;
  }
  byId('beginButton').addEventListener('click', () => startLesson(byId('beginButton').dataset.lessonId || '01'));
  byId('backButton').addEventListener('click', showHome);
  byId('restartButton').addEventListener('click', () => { if (session) startLesson(session.lesson.id, session.practiceMode); });
  byId('againButton').addEventListener('click', () => { if (session) startLesson(session.lesson.id, 'easy'); });
  byId('fullLessonButton').addEventListener('click', () => { if (session) startLesson(session.lesson.id, 'full'); });
  byId('resultHomeButton').addEventListener('click', showHome);
  byId('nextButton').addEventListener('click', () => {
    if (!session) return;
    const index = lessons.findIndex(l => l.id === session.lesson.id);
    if (index < 0 || index === lessons.length - 1) showHome(); else startLesson(lessons[index + 1].id, 'easy');
  });
  dom.showAll.addEventListener('click', () => { showAllLessons = !showAllLessons; renderList(); });
  dom.fontToggle.addEventListener('click', () => { progress.largeText = !progress.largeText; applyPreferences(); saveProgress(); });
  dom.soundToggle.addEventListener('click', () => { progress.soundEnabled = !progress.soundEnabled; applyPreferences(); saveProgress(); });
  dom.imeInput.addEventListener('compositionstart', () => { composing = true; });
  dom.imeInput.addEventListener('compositionend', () => { composing = false; handleChineseInput(); });
  dom.imeInput.addEventListener('input', handleChineseInput);
  document.addEventListener('keydown', onGlobalKey);
  buildKeyboard(); applyPreferences(); showHome();
  if (memoryOnly) {
    const note = document.querySelector('.small-note');
    note.textContent = '当前浏览器禁用了本地记录。可以正常练习，但关闭以后可能无法保存进度。';
  }
})();
