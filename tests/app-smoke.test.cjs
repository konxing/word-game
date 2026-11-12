/* 无浏览器依赖的交互烟雾测试：以轻量 DOM 替身跑真实 app.js。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lessons = require('../lessons.js');
const engine = require('../engine.js');

class FakeElement {
  constructor(id = '') {
    this.id = id; this.children = []; this.handlers = {}; this.style = {};
    this.dataset = {}; this.attributes = {}; this.hidden = false;
    this.textContent = ''; this.innerHTML = ''; this.value = ''; this.disabled = false;
    this.className = ''; this.classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(name => this.classes.add(name)),
      toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name)
    };
  }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.children.push(node); return node; }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  addEventListener(type, fn) { this.handlers[type] = fn; }
  setAttribute(name, value) { this.attributes[name] = value; }
  focus() {}
  querySelectorAll(selector) {
    const answer = [];
    const visit = el => {
      if (selector === '.key' && String(el.className).split(' ').includes('key')) answer.push(el);
      if (selector === '.hand-finger' && String(el.className).split(' ').includes('hand-finger')) answer.push(el);
      for (const child of el.children) visit(child);
    };
    visit(this); return answer;
  }
  fire(event, data = {}) { if (this.handlers[event]) this.handlers[event]({ preventDefault() {}, ...data }); }
}
function createApp() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
  const elements = Object.fromEntries(ids.map(id => [id, new FakeElement(id)]));
  const document = {
    getElementById: id => elements[id] || null,
    createElement: () => new FakeElement(),
    querySelector: () => new FakeElement(),
    addEventListener(event, fn) { this.handlers[event] = fn; },
    handlers: {},
    documentElement: new FakeElement('html')
  };
  const store = new Map();
  const localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, val)
  };
  const root = new FakeElement();
  const window = { TYPING_LESSONS: lessons, TypingGameEngine: engine };
  const script = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  vm.runInNewContext(script, {
    document, window, localStorage, Date, console,
    setTimeout: fn => { fn(); return 1; },
    clearTimeout: () => {},
  });
  return { elements, document, store, root };
}

test('首页默认只显示四关，完成轻松练习后保存进度与日期', () => {
  const { elements: e, document: doc, store } = createApp();
  assert.equal(e.lessonList.children.filter(x => x.className.includes('lesson-tile')).length, 4);
  assert.equal(e.showAllLessonsButton.attributes['aria-expanded'], 'false');
  e.beginButton.fire('click');
  assert.equal(e.lessonTitle.textContent, '找到 F 和 J');
  assert.equal(e.lessonView.hidden, false);
  for (const key of lessons[0].items) doc.handlers.keydown({ key, isComposing: false, preventDefault() {} });
  assert.equal(e.resultView.hidden, false);
  assert.equal(e.resultAccuracy.textContent, '100%');
  assert.equal(e.completedCount.textContent, '1 / 22 关');
  assert.ok(JSON.parse(store.get('typing-harbor-progress-v1')).completed['01']);
});

test('能从中文关卡直接练习，纠错后继续并完成整关', () => {
  const { elements: e } = createApp();
  e.showAllLessonsButton.fire('click');
  const buttons = e.lessonList.children.filter(x => x.className.includes('lesson-tile'));
  assert.equal(buttons.length, 22);
  buttons[12].fire('click');
  assert.equal(e.lessonTitle.textContent, '第一句中文');
  assert.equal(e.chineseEntryWrap.hidden, false);
  e.chineseEntry.value = '你号'; e.chineseEntry.fire('input');
  assert.ok(e.feedback.textContent.includes('不一样'));
  for (const phrase of engine.practiceItems(lessons[12], 'easy')) {
    e.chineseEntry.value = phrase;
    e.chineseEntry.fire('input');
  }
  assert.equal(e.resultView.hidden, false);
  assert.ok(e.resultMessage.textContent.includes('打错'));
  assert.equal(e.completedCount.textContent, '1 / 22 关');
});


test('错误按键连续两次显示辅助提示，但可以无惩罚地完成', () => {
  const { elements: e, document: doc } = createApp();
  e.beginButton.fire('click');
  doc.handlers.keydown({ key: 'x', preventDefault() {} });
  doc.handlers.keydown({ key: 'x', preventDefault() {} });
  assert.ok(e.feedback.textContent.includes('下方亮起来'));
  for (const key of engine.practiceItems(lessons[0])) doc.handlers.keydown({ key, preventDefault() {} });
  assert.equal(e.resultView.hidden, false);
  assert.ok(e.resultMessage.textContent.includes('重新找到'));
});

test('完整练习可由结算页主动选择，不影响默认轻松练习', () => {
  const { elements: e, document: doc } = createApp();
  e.beginButton.fire('click');
  for (const key of engine.practiceItems(lessons[0])) doc.handlers.keydown({ key, preventDefault() {} });
  e.fullLessonButton.fire('click');
  assert.ok(e.practiceMode.textContent.includes('完整'));
  assert.equal(e.lessonView.hidden, false);
});

test('练习时启用单屏专注布局，中文句子展示对应拼音，返回后恢复首页', () => {
  const {elements:e,document:doc}=createApp();
  e.showAllLessonsButton.fire('click');
  const buttons=e.lessonList.children.filter(x=>x.className.includes('lesson-tile'));
  buttons[16].fire('click');
  assert.ok(doc.documentElement.classes.has('practice-focus'));
  assert.equal(e.pinyinHint.hidden, false);
  assert.ok(e.pinyinHint.textContent.includes('每个汉字'));
  const syllables=e.targetDisplay.children.map(x=>x.children[0]?.children[0]?.textContent);
  assert.deepEqual(syllables,['ni','jin','tian','mang','ma']);
  assert.equal(e.targetDisplay.children.map(x=>x.children[0]?.textContent).join(''),'你今天忙吗');
  e.backButton.fire('click');
  assert.equal(doc.documentElement.classes.has('practice-focus'),false);
  assert.equal(e.welcomeView.hidden,false);
});


test('按键练习会同步高亮对应手指，帮助用户知道该用哪根手指', () => {
  const { elements: e } = createApp();
  e.beginButton.fire('click');
  const active = e.handGuide.querySelectorAll('.hand-finger').filter(x => x.classes.has('active'));
  assert.equal(active.length, 1);
  assert.equal(active[0].dataset.finger, 'left-index');
  assert.ok(e.fingerHint.textContent.includes('左手食指'));
});


test('所有关卡含中文关均展示手型；中文练习根据拼音变换亮起的手指', () => {
  const { elements:e, document:doc } = createApp();
  e.showAllLessonsButton.fire('click');
  const buttons=e.lessonList.children.filter(x=>x.className.includes('lesson-tile'));
  for (const button of buttons) {
    button.fire('click');
    assert.equal(e.keyboardPanel.hidden, false);
    assert.equal(e.handGuide.hidden, false);
    assert.equal(e.handGuide.querySelectorAll('.hand-finger').length, 10);
    assert.ok(e.handGuide.querySelectorAll('.hand-finger').some(x=>x.classes.has('active')));
  }
  buttons[16].fire('click'); // 你今天忙吗：ni
  assert.equal(e.handGuide.querySelectorAll('.hand-finger').find(x=>x.classes.has('active')).dataset.finger, 'right-index');
  doc.handlers.keydown({key:'n',preventDefault(){}});
  assert.equal(e.handGuide.querySelectorAll('.hand-finger').find(x=>x.classes.has('active')).dataset.finger, 'right-middle');
  assert.equal(e.chineseEntryWrap.hidden,false);
});
