const content = window.LEALEA_CONTENT;
const setText = (id, value) => { document.getElementById(id).textContent = value; };
const pending = '詳細準備中';
const list = document.getElementById('lesson-list');
function lessonCard(lesson, lineUrl, empty = false) {
  const card = document.createElement('article'); card.className = 'lesson-list-card';
  const photo = document.createElement('img'); photo.className = 'lesson-list-photo';
  photo.src = lesson.photo || 'assets/lesson-placeholder.svg';
  photo.alt = lesson.photo ? (lesson.photoAlt || 'レッスンの写真') : 'レッスン写真は詳細準備中';
  photo.loading = 'lazy'; photo.width = 600; photo.height = 400;
  photo.addEventListener('error', () => { photo.src = 'assets/lesson-placeholder.svg'; photo.alt = 'レッスン写真は詳細準備中'; }, { once: true });
  const body = document.createElement('div'); body.className = 'lesson-list-body';
  const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = empty ? 'COMING SOON' : 'BABY MASSAGE LESSON';
  const title = document.createElement('h3'); title.textContent = lesson.title || 'ベビーマッサージレッスン';
  const details = document.createElement('dl');
  for (const [label, key] of [['会場名', 'venue'], ['開催日時', 'datetime'], ['対象月齢', 'age'], ['参加費', 'price']]) {
    const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = label; dd.textContent = lesson[key] || pending; row.append(dt, dd); details.append(row);
  }
  const reservation = document.createElement('a'); reservation.className = 'button button-dark full';
  const canReserve = !!lineUrl && !empty && lesson.reservationsOpen;
  reservation.textContent = canReserve ? '公式LINEで予約する ↗' : '予約の詳細準備中';
  if (canReserve) { reservation.href = lineUrl; reservation.target = '_blank'; reservation.rel = 'noopener noreferrer'; }
  else { reservation.href = '#contact'; reservation.setAttribute('aria-disabled', 'true'); reservation.addEventListener('click', event => { event.preventDefault(); document.getElementById('lesson-list-status').textContent = '予約の詳細準備中です。現在このレッスンの予約は受け付けていません。'; }); }
  body.append(eyebrow, title, details, reservation); card.append(photo, body); return card;
}
function renderLessons(data) {
  list.replaceChildren();
  setText('lesson-month', data.month ? `${data.month} のレッスン` : '開催情報の詳細準備中');
  if (!data.lessons.length) { list.append(lessonCard({}, null, true)); return; }
  const groups = new Map();
  for (const lesson of data.lessons) { const venue = lesson.venue || pending; if (!groups.has(venue)) groups.set(venue, []); groups.get(venue).push(lesson); }
  for (const [venue, lessons] of groups) {
    const section = document.createElement('section'); section.className = 'venue-group';
    const heading = document.createElement('h3'); heading.className = 'venue-title'; heading.textContent = venue;
    const grid = document.createElement('div'); grid.className = 'lesson-list-grid';
    lessons.forEach(lesson => grid.append(lessonCard(lesson, data.lineUrl)));
    section.append(heading, grid); list.append(section);
  }
}
renderLessons({ month: '', lineUrl: '', lessons: [] });
fetch('lessons.json', { cache: 'no-cache' }).then(response => { if (!response.ok) throw new Error('読み込み失敗'); return response.json(); }).then(data => { window.LealeaLessons.validate(data); renderLessons(data); }).catch(() => { setText('lesson-list-status', '開催情報を読み込めませんでした。詳細準備中です。時間をおいて再度ご確認ください。'); });
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
