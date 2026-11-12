const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('README directs nontechnical users to a Windows EXE release instead of CMD files', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /github\.com\/konxing\/word-game\/releases\/latest/);
  assert.match(readme, /打字小站\.exe/);
  assert.match(readme, /桌面快捷方式/);
  assert.ok(!fs.existsSync(path.join(root, '开始练习.cmd')));
  assert.ok(!fs.existsSync(path.join(root, '安装到桌面.cmd')));
});

test('GitHub Actions builds a Windows GUI EXE and attaches it to a durable Release', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'windows-exe.yml'), 'utf8');
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /go build/);
  assert.match(workflow, /windowsgui/);
  assert.match(workflow, /gh release create/);
  assert.match(workflow, /打字小站\.exe/);
});

test('Windows launcher embeds the real hands and keeps the user profile', () => {
  const source = fs.readFileSync(path.join(root, 'launcher.go'), 'utf8');
  for (const name of ['assets/left-hand-cutout.png', 'assets/right-hand-cutout.png']) {
    assert.match(source, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.ok(fs.existsSync(path.join(root, name)));
  }
  assert.match(source, /BrowserProfile/);
  assert.match(source, /--app=/);
  assert.match(source, /--user-data-dir=/);
});
