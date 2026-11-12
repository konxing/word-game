const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../engine.js');
const lessons = require('../lessons.js');

test('16 关按阶段排序，ID 唯一，且题目非空', () => {
  assert.equal(lessons.length, 16);
  assert.equal(new Set(lessons.map(x => x.id)).size, 16);
  for (const lesson of lessons) {
    assert.ok(['key', 'latin', 'hanzi'].includes(lesson.mode));
    assert.ok(lesson.items.length > 0);
    assert.ok(engine.totalUnits(lesson) >= lesson.items.length);
  }
  assert.equal(lessons[0].mode, 'key');
  assert.equal(lessons.at(-1).mode, 'hanzi');
});
test('按键判定大小写、空格、回车与错误输入', () => {
  assert.equal(engine.matchesKey('F', 'f'), true);
  assert.equal(engine.matchesKey('f', 'j'), false);
  assert.equal(engine.matchesKey(' ', ' '), true);
  assert.equal(engine.matchesKey('Enter', 'Enter'), true);
  assert.equal(engine.matchesKey('a', 'Enter'), false);
  assert.equal(engine.nextCharacter(lessons[0], 0, 0), 'f');
  assert.equal(engine.displayKey(' '), '空格');
});
test('拼音空格和连续字符索引', () => {
  const lesson = lessons.find(l => l.id === '11');
  assert.equal(engine.nextCharacter(lesson, 0, 2), ' ');
  assert.equal(engine.nextCharacter(lesson, 0, 6), null);
});
test('错误不会导致负进度，正确率与星级区间合理', () => {
  assert.equal(engine.percent(200, 12), 100);
  assert.equal(engine.percent(-1, 12), 0);
  assert.equal(engine.accuracy(10, 0), 100);
  assert.equal(engine.accuracy(10, 2), 83);
  assert.equal(engine.stars(10, 0), 3);
  assert.equal(engine.stars(9, 1), 2);
  assert.equal(engine.stars(10, 3), 1);
});
test('中文用完整前缀判断，错字可修正，汉字练习无网络', () => {
  assert.equal(engine.validChinesePrefix('我会', '我会打字了'), true);
  assert.equal(engine.validChinesePrefix('我慧', '我会打字了'), false);
  assert.equal(engine.validChinesePrefix('我会打字了', '我会打字了'), true);
  assert.equal(engine.fingerHint('f').includes('左手食指'), true);
});


test('轻松练习保留短小任务，完整模式不缩减', () => {
  assert.equal(engine.practiceItems(lessons[3]).length, 6);
  assert.equal(engine.practiceItems(lessons[12]).length, 1);
  assert.equal(engine.practiceItems(lessons[3], 'full').length, lessons[3].items.length);
});

test('复习推荐优先考虑两天前练过的课，但不因当天完成而要求反复复习', () => {
  const completed = {'01': {lastPracticed: '2026-11-09'}};
  assert.equal(engine.nextRecommendedLesson(lessons, completed, '2026-11-12').id, '01');
  completed['01'].lastPracticed = '2026-11-12';
  assert.equal(engine.nextRecommendedLesson(lessons, completed, '2026-11-12').id, '02');
});
