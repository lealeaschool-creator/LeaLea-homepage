const content = window.LEALEA_CONTENT;
const setText = (id, value) => { document.getElementById(id).textContent = value; };
const list = document.getElementById('lesson-list');
function renderLessons(data) {
  setText('lesson-month', data.month ? `${data.month} のレッスン` : '開催情報の詳細準備中');
  window.renderLealeaLessons(data, list, message => setText('lesson-list-status', message));
}
renderLessons(window.LealeaLessons.defaults());
if (window.location.protocol === 'file:' && window.LEALEA_LESSONS_INLINE) {
  try { renderLessons(window.LealeaLessons.normalize(window.LEALEA_LESSONS_INLINE)); }
  catch { setText('lesson-list-status', '開催情報の表示に失敗しました。'); }
} else {
  fetch('lessons.json', { cache: 'no-cache' }).then(response => { if (!response.ok) throw new Error('読み込み失敗'); return response.json(); }).then(input => renderLessons(window.LealeaLessons.normalize(input))).catch(() => {
    if (window.LEALEA_LESSONS_INLINE) { try { renderLessons(window.LealeaLessons.normalize(window.LEALEA_LESSONS_INLINE)); return; } catch {} }
    setText('lesson-list-status', '開催情報を読み込めませんでした。詳細準備中です。時間をおいて再度ご確認ください。');
  });
}
content.faqs.forEach((faq, index) => {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  const num = document.createElement('span'); num.className = 'faq-number'; num.textContent = String(index + 1).padStart(2, '0');
  const question = document.createElement('span'); question.textContent = faq.question;
  const icon = document.createElement('span'); icon.className = 'faq-toggle'; icon.textContent = '+'; icon.setAttribute('aria-hidden', 'true');
  const answer = document.createElement('p'); answer.textContent = faq.answer;
  summary.append(num, question, icon); details.append(summary, answer);
  document.getElementById('faq-list').append(details);
});
for (const name of ['line', 'instagram']) {
  const link = document.getElementById(`${name}-link`);
  let url;
  try { url = new URL(content.social[name]); } catch { url = null; }
  if (url && url.protocol === 'https:') {
    link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
  } else {
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', event => { event.preventDefault(); setText('contact-status', `${name === 'line' ? '公式LINE' : 'Instagram'}のURLは準備中です。現在はお問い合わせを送信できません。`); });
  }
}
if (content.social.line && content.social.instagram) setText('contact-status', '外部の公式SNSへ移動します。');
setText('year', new Date().getFullYear());
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.getElementById('mobile-nav');
function closeMenu() { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'メニューを開く'); }
menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  mobileNav.hidden = isOpen; menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'メニューを開く' : 'メニューを閉じる');
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); } });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion-enabled');
  const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
