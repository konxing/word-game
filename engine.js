/* 不依赖浏览器 DOM 的计算逻辑，便于离线测试。 */
(function (root) {
  'use strict';
  function displayKey(key) {
    if (key === ' ') return '空格';
    if (key === 'Enter') return '回车';
    if (key === ';') return '；';
    return String(key || '').toUpperCase();
  }
  function matchesKey(pressed, expected) {
    if (typeof pressed !== 'string' || typeof expected !== 'string') return false;
    if (expected === 'Enter' || expected === ' ') return pressed === expected;
    return pressed.toLowerCase() === expected.toLowerCase();
  }
  function totalUnits(lesson) {
    return lesson.items.reduce((total, item) => total + (lesson.mode === 'key' ? 1 : Array.from(item).length), 0);
  }
  function percent(done, total) {
    return total ? Math.round(Math.max(0, Math.min(1, done / total)) * 100) : 0;
  }
  function accuracy(correct, errors) {
    return correct + errors ? Math.round(100 * correct / (correct + errors)) : 100;
  }
  function stars(correct, errors) {
    const score = accuracy(correct, errors);
    return score >= 98 ? 3 : score >= 85 ? 2 : 1;
  }
  function practiceItems(lesson, mode = 'easy') {
    if (mode === 'full') return lesson.items.slice();
    if (lesson.mode === 'key') return lesson.items.slice(0, 6);
    return lesson.items.slice(0, 1);
  }
  function nextRecommendedLesson(lessons, completed, today) {
    const done = completed && typeof completed === 'object' ? completed : {};
    // Revisit one previously practised lesson after at least two calendar days.
    const due = lessons.find(lesson => {
      const info = done[lesson.id];
      if (!info || !/^\d{4}-\d{2}-\d{2}$/.test(info.lastPracticed || '')) return false;
      const days = Math.floor((Date.parse(today + 'T00:00:00Z') - Date.parse(info.lastPracticed + 'T00:00:00Z')) / 86400000);
      return Number.isFinite(days) && days >= 2;
    });
    return due || lessons.find(l => !done[l.id]) || lessons[0];
  }
  function validChinesePrefix(typed, expected) {
    return expected.startsWith(typed);
  }
  function nextCharacter(lesson, itemIndex, characterIndex) {
    const item = lesson.items[itemIndex];
    if (item === undefined) return null;
    return lesson.mode === 'key' ? item : Array.from(item)[characterIndex] ?? null;
  }
  function fingerAssignment(char) {
    if (!char) return null;
    if (char === ' ') {
      return {
        codes: ['left-thumb', 'right-thumb'], hand: '双手', finger: '大拇指',
        shortLabel: '左右大拇指', text: '左右手任意一只大拇指', display: '空格'
      };
    }
    if (char === 'Enter') {
      return {
        codes: ['right-pinky'], hand: '右手', finger: '小指',
        shortLabel: '右小指', text: '右手小指', display: '回车'
      };
    }
    const groups = [
      ['qaz1', { code: 'left-pinky', hand: '左手', finger: '小指', shortLabel: '左小指' }],
      ['wsx2', { code: 'left-ring', hand: '左手', finger: '无名指', shortLabel: '左无名指' }],
      ['edc3', { code: 'left-middle', hand: '左手', finger: '中指', shortLabel: '左中指' }],
      ['rtfgvb45', { code: 'left-index', hand: '左手', finger: '食指', shortLabel: '左食指' }],
      ['yuhjnm67', { code: 'right-index', hand: '右手', finger: '食指', shortLabel: '右食指' }],
      ['ik8', { code: 'right-middle', hand: '右手', finger: '中指', shortLabel: '右中指' }],
      ['ol9', { code: 'right-ring', hand: '右手', finger: '无名指', shortLabel: '右无名指' }],
      ['p;0', { code: 'right-pinky', hand: '右手', finger: '小指', shortLabel: '右小指' }]
    ];
    const found = groups.find(([keys]) => keys.includes(String(char).toLowerCase()));
    if (!found) return null;
    const detail = found[1];
    return {
      codes: [detail.code], hand: detail.hand, finger: detail.finger,
      shortLabel: detail.shortLabel, text: `${detail.hand}${detail.finger}`,
      display: displayKey(char)
    };
  }
  function nextPinyinGuideKey(syllable, typed) {
    const reading = String(syllable || '').toLowerCase().replace(/[^a-z]/g, '');
    const input = String(typed || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!reading) return null;
    if (reading.startsWith(input) && input.length < reading.length) return reading[input.length];
    // 不认识输入法内部状态时，提示从该音节首字母重新定位，不做错误判断。
    return reading[0];
  }
  function fingerHint(char) {
    const info = fingerAssignment(char);
    if (!info) return `请找到 ${displayKey(char)} 键。`;
    if (char === ' ') return '看手图中亮起的大拇指，按最下面的长空格键。';
    if (char === 'Enter') return '看手图中亮起的右手小指，按右侧回车键。';
    return `看手图里亮起来的${info.text}，按 ${info.display} 键。`;
  }
  const api = { displayKey, matchesKey, totalUnits, percent, accuracy, stars, practiceItems, nextRecommendedLesson, validChinesePrefix, nextCharacter, nextPinyinGuideKey, fingerAssignment, fingerHint };
  root.TypingGameEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
