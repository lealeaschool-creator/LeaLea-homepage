/* サイトと編集プレビューに同じ一覧を表示します。 */
window.renderLealeaLessons = (data, root, notice = () => {}) => {
  const model = window.LealeaLessons;
  root.replaceChildren();
  const text = (tag, value, className) => { const el = document.createElement(tag); el.textContent = value; if (className) el.className = className; return el; };
  const pending = '詳細準備中';
  function card(event, venue, type) {
    const article = document.createElement('article'); article.className = 'lesson-list-card';
    const image = document.createElement('img'); image.className = 'lesson-list-photo'; image.src = venue?.photo || 'assets/lesson-placeholder.svg'; image.alt = venue?.photo ? venue.photoAlt || `${venue.name || '会場'}の写真` : '会場写真は詳細準備中'; image.loading = 'lazy'; image.width = 600; image.height = 400;
    image.addEventListener('error', () => { image.src = 'assets/lesson-placeholder.svg'; image.alt = '会場写真は詳細準備中'; }, { once: true });
    const body = document.createElement('div'); body.className = 'lesson-list-body';
    body.append(text('p', model.types[type], 'eyebrow'), text('h3', event?.title || model.types[type]));
    const status = event?.status || pending; body.append(text('p', status, 'availability'));
    const dl = document.createElement('dl');
    for (const [label, value] of [['会場名',venue?.name],['開催日',event?.displayDates || event?.date || event?.legacyDatetime],['時間',event?.time],['対象月齢',event?.age],['参加費',event?.price],['持ち物',event?.items]]) { const row = document.createElement('div'); row.append(text('dt',label),text('dd',value || pending)); dl.append(row); }
    const button = text('a', status === '受付中' && data.lineUrl && event ? '公式LINEで予約する ↗' : status === '受付中' ? '予約の詳細準備中' : status, 'button button-dark full');
    const active = event && status === '受付中' && data.lineUrl;
    if (active) { button.href = data.lineUrl; button.target = '_blank'; button.rel = 'noopener noreferrer'; }
    else { button.href = '#'; button.setAttribute('aria-disabled','true'); button.addEventListener('click', e => { e.preventDefault(); notice('このイベントの予約は現在受け付けていません。'); }); }
    body.append(dl,button); article.append(image,body); return article;
  }
  for (const [type, originalLabel] of Object.entries(model.types)) {
    if (type === 'cafe') continue;
    const label = type === 'studio' ? 'スタジオ・カフェレッスン' : originalLabel;
    const section = document.createElement('section'); section.className = 'venue-group'; section.append(text('h3',label,'venue-title'));
    const events = data.lessons.filter(e => (type === 'studio' ? ['studio','cafe'].includes(e.type) : e.type === type) && model.visible(e,data)).sort((a,b) => (a.date || '9999').localeCompare(b.date || '9999'));
    const grid = document.createElement('div'); grid.className = 'lesson-list-grid';
    if (!events.length) { grid.append(card(null,null,type)); const venueNames = data.venues.filter(v => v.type === type && v.name).map(v => v.name); if (venueNames.length) section.append(text('p',`登録会場：${venueNames.join(' ／ ')}（開催情報は詳細準備中）`,'small-note')); }
    // 同じ会場・条件のスタジオレッスンは、開催日をまとめて1枚のカードに表示します。
    const displayed = [];
    const grouped = new Map();
    for (const event of events) {
      if (event.type !== 'studio' || !event.venueId || !event.date) {
        displayed.push(event);
        continue;
      }
      const key = JSON.stringify([event.venueId,event.title,event.time,event.age,event.price,event.items,event.status]);
      if (!grouped.has(key)) {
        const entry = { ...event, dates: [event.date] };
        grouped.set(key, entry);
        displayed.push(entry);
      } else {
        grouped.get(key).dates.push(event.date);
      }
    }
    const formatDate = date => {
      const [year,month,day] = date.split('-').map(Number);
      const weekday = ['日','月','火','水','木','金','土'][new Date(Date.UTC(year,month-1,day)).getUTCDay()];
      return `${month}月${day}日（${weekday}）`;
    };
    displayed.forEach(event => {
      event.displayDates = event.dates ? event.dates.map(formatDate).join(' ／ ') : event.date ? formatDate(event.date) : '';
      grid.append(card(event,data.venues.find(v => v.id === event.venueId),event.type));
    });
    section.append(grid); root.append(section);
  }
};
