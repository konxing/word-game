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
  function validChinesePrefix(typed, expected) {
    return expected.startsWith(typed);
  }
  function nextCharacter(lesson, itemIndex, characterIndex) {
    const item = lesson.items[itemIndex];
    if (item === undefined) return null;
    return lesson.mode === 'key' ? item : Array.from(item)[characterIndex] ?? null;
  }
  function fingerHint(char) {
    if (char === ' ') return '用任意一只大拇指，按最下面的长空格键。';
    if (char === 'Enter') return '用右手小指，找到右侧的回车键。';
    const groups = [
      ['qaz1', '左手小指'], ['wsx2', '左手无名指'], ['edc3', '左手中指'],
      ['rtfgvb45', '左手食指'], ['yuhjnm67', '右手食指'], ['ik8', '右手中指'],
      ['ol9', '右手无名指'], ['p;0', '右手小指']
    ];
    const match = groups.find(([keys]) => keys.includes(String(char).toLowerCase()));
    return match ? `建议用${match[1]}按 ${displayKey(char)} 键。` : `请找到 ${displayKey(char)} 键。`;
  }
  const api = { displayKey, matchesKey, totalUnits, percent, accuracy, stars, validChinesePrefix, nextCharacter, fingerHint };
  root.TypingGameEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
