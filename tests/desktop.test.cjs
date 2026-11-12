const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('Windows installer is fully offline and creates the app-mode shortcut in stable profile directory', () => {
  const setup = fs.readFileSync(path.join(root, 'windows', 'install.ps1'));
  assert.deepEqual([...setup.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  const src = setup.toString('utf8');
  assert.match(src, /LOCALAPPDATA/);
  assert.match(src, /TypingHarbor/);
  assert.match(src, /BrowserProfile/);
  assert.match(src, /CreateShortcut/);
  assert.match(src, /--app=/);
  assert.match(src, /--user-data-dir=/);
  assert.match(src, /GetFolderPath\('Desktop'\)/);
  for (const file of ['index.html','styles.css','app.js','engine.js','lessons.js']) {
    assert.ok(fs.existsSync(path.join(root, file)));
    assert.ok(src.includes(file));
  }
  assert.ok(fs.statSync(path.join(root, 'assets', 'typing.ico')).size > 1000);
  assert.doesNotMatch(src, /Invoke-WebRequest|DownloadFile|https?:\/\//i);
});

test('shortcut setup can be invoked by double-click and startup remains possible without installing', () => {
  const setup = fs.readFileSync(path.join(root, '安装到桌面.cmd'), 'utf8');
  assert.match(setup, /powershell.exe/);
  assert.match(setup, /windows\\install.ps1/);
  assert.ok(fs.existsSync(path.join(root, '开始练习.cmd')));
});
