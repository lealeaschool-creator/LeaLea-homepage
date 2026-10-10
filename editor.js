const form = document.getElementById('editor-form');
const entries = document.getElementById('editor-lessons');
const status = document.getElementById('editor-status');
const fields = [['title', 'レッスン名'], ['venue', '会場名'], ['datetime', '開催日時'], ['age', '対象月齢'], ['price', '参加費（円・税込なども入力）'], ['photo', '写真の場所（assets/ファイル名.jpg）'], ['photoAlt', '写真の説明（読み上げ用）']];
let loaded = false;
function addLesson(data = {}) {
  const article = document.createElement('section'); article.className = 'editor-entry';
  const header = document.createElement('div'); header.className = 'editor-entry-header';
  const title = document.createElement('h2'); title.textContent = 'レッスン情報';
  const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '削除';
  remove.addEventListener('click', () => { if (confirm('このレッスンを一覧から削除しますか？')) article.remove(); });
  header.append(title, remove);
  const grid = document.createElement('div'); grid.className = 'editor-fields';
  for (const [key, caption] of fields) {
    const label = document.createElement('label'); label.textContent = caption;
    const input = document.createElement('input'); input.type = 'text'; input.dataset.field = key;
    input.value = data[key] || ''; input.placeholder = key === 'photo' ? '未掲載の場合は空欄' : '未確定なら空欄';
    label.append(input); grid.append(label);
  }
  const checkLabel = document.createElement('label'); checkLabel.className = 'editor-check';
  const check = document.createElement('input'); check.type = 'checkbox'; check.dataset.field = 'reservationsOpen'; check.checked = !!data.reservationsOpen;
  checkLabel.append(check, document.createTextNode('予約受付中（正式な募集内容が確定している場合のみ）'));
  const photoLabel = document.createElement('label'); photoLabel.className = 'editor-photo-select'; photoLabel.textContent = '写真ファイルを選んで名前を入力（画像は別途GitHubにアップロード）';
  const photoInput = document.createElement('input'); photoInput.type = 'file'; photoInput.accept = '.jpg,.jpeg,.png,.webp';
  photoInput.addEventListener('change', () => { const file = photoInput.files[0]; if (file) grid.querySelector('[data-field=photo]').value = `assets/${file.name}`; });
  photoLabel.append(photoInput); article.append(header, grid, photoLabel, checkLabel); entries.append(article);
}
function loadData(data) {
  window.LealeaLessons.validate(data);
  document.getElementById('month').value = data.month;
  document.getElementById('line-url').value = data.lineUrl;
  entries.replaceChildren(); data.lessons.forEach(addLesson); form.hidden = false; loaded = true;
  status.textContent = '開催情報を読み込みました。編集後は更新ファイルを保存してください。';
}
fetch('lessons.json', { cache: 'no-cache' }).then(response => { if (!response.ok) throw new Error('読込失敗'); return response.json(); }).then(loadData).catch(() => { if (!loaded) status.textContent = '既存情報を自動で読み込めませんでした。「保存済み情報を読み込む」で現在のlessons.jsonを選んでください。'; });
document.getElementById('import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try { loadData(JSON.parse((await file.text()).replace(/^\uFEFF/, ''))); } catch (error) { status.textContent = `読み込めませんでした：${error.message}`; }
  event.target.value = '';
});
document.getElementById('new-data').addEventListener('click', () => {
  if ((!loaded || confirm('画面上の編集内容を破棄して、空の一覧から始めますか？'))) loadData({ month: '', lineUrl: '', lessons: [] });
});
document.getElementById('add-lesson').addEventListener('click', () => addLesson());
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = { month: document.getElementById('month').value.trim(), lineUrl: document.getElementById('line-url').value.trim(), lessons: [] };
  for (const entry of entries.querySelectorAll('.editor-entry')) {
    const lesson = {};
    entry.querySelectorAll('[data-field]').forEach(input => { lesson[input.dataset.field] = input.type === 'checkbox' ? input.checked : input.value.trim(); });
    data.lessons.push(lesson);
  }
  try { window.LealeaLessons.validate(data); } catch (error) { status.textContent = error.message; return; }
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = 'lessons.json'; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = '更新ファイルの保存を開始しました。GitHubへlessons.jsonをアップロードすると、保存されたサイト情報が更新されます。自動反映はされません。';
});
