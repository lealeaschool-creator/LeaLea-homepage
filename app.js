const content = window.LEALEA_CONTENT;
const setText = (id, value) => { document.getElementById(id).textContent = value; };
setText('lesson-title', content.lesson.title);
setText('lesson-summary', content.lesson.summary);
setText('lesson-price', content.lesson.price);
setText('lesson-note', content.lesson.note);
for (const item of content.lesson.details) {
  const row = document.createElement('div');
  const label = document.createElement('dt');
  const value = document.createElement('dd');
  label.textContent = item.label; value.textContent = item.value;
  row.append(label, value); document.getElementById('lesson-details').append(row);
}
const scheduleList = document.getElementById('schedule-list');
if (!content.schedules.length) {
  const empty = document.createElement('div'); empty.className = 'schedule-empty';
  empty.innerHTML = '<span class="schedule-symbol" aria-hidden="true">▦</span><div><span class="eyebrow">COMING SOON</span><h3>次回の開催日程を準備しています。</h3><p>日程・会場が決まり次第、こちらでお知らせします。</p></div><a class="text-link" href="#contact">お問い合わせ <span>↗</span></a>';
  scheduleList.append(empty);
} else {
  for (const event of content.schedules) {
    const row = document.createElement('article'); row.className = 'schedule-row';
    for (const key of ['date', 'time', 'title', 'place', 'status']) {
      const field = document.createElement('span'); field.textContent = event[key] || ''; row.append(field);
    }
    scheduleList.append(row);
  }
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
