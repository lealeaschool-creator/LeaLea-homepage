window.addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== window.location.origin) return;
  if (event.data?.type !== 'lealea-preview') return;
  try {
    const data = window.LealeaLessons.normalize(event.data.data);
    document.getElementById('preview-month').textContent = data.month || '開催情報の詳細準備中';
    window.renderLealeaLessons(data, document.getElementById('lesson-list'), message => { document.getElementById('preview-message').textContent = message; });
  } catch { document.getElementById('preview-message').textContent = '入力内容を確認してください。'; }
});
