/* 編集画面・実際のサイト・プレビュー共通のデータ形式。 */
window.LealeaLessons = (() => {
  const types = { studio: 'スタジオレッスン', cafe: 'カフェレッスン', wedding: '結婚式場イベント' };
  const statuses = ['詳細準備中', '受付中', '満席', '受付終了'];
  const defaults = () => ({ version: 2, month: '', lineUrl: '', hidePast: true, venues: [
    { id: 'kawabun', name: 'THE KAWABUN NAGOYA', type: 'wedding', photo: '', photoAlt: '' },
    { id: 'nanzan', name: 'THE NANZAN HOUSE', type: 'wedding', photo: '', photoAlt: '' }
  ], lessons: [] });
  const id = () => 'item-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  function normalize(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('開催情報の形式を確認してください。');
    if (input.version === 2) { validate(input); return JSON.parse(JSON.stringify(input)); }
    if (typeof input.month !== 'string' || typeof input.lineUrl !== 'string' || !Array.isArray(input.lessons)) throw new Error('開催情報の形式を確認してください。');
    const data = defaults(); data.month = input.month; data.lineUrl = input.lineUrl;
    for (const old of input.lessons) {
      if (!old || typeof old.title !== 'string' || typeof old.venue !== 'string') throw new Error('旧形式のレッスン情報を確認してください。');
      let venue = data.venues.find(v => v.name === old.venue);
      if (!venue && old.venue) { venue = { id: id(), name: old.venue, type: 'studio', photo: old.photo || '', photoAlt: old.photoAlt || '' }; data.venues.push(venue); }
      data.lessons.push({ id: id(), title: old.title, type: venue?.type || 'studio', venueId: venue?.id || '', date: '', time: '', legacyDatetime: old.datetime || '', price: old.price || '', age: old.age || '', items: '', status: old.reservationsOpen ? '受付中' : '詳細準備中', hidden: false });
    }
    validate(data); return data;
  }
  function validate(data) {
    if (!data || data.version !== 2 || typeof data.month !== 'string' || typeof data.lineUrl !== 'string' || typeof data.hidePast !== 'boolean' || !Array.isArray(data.venues) || !Array.isArray(data.lessons)) throw new Error('開催情報の形式を確認してください。');
    if (data.lineUrl) {
      let url; try { url = new URL(data.lineUrl); } catch { throw new Error('公式LINEのURLを確認してください。'); }
      if (url.protocol !== 'https:' || !['line.me', 'lin.ee'].includes(url.hostname) || url.username || url.password) throw new Error('https://line.me/ または https://lin.ee/ の公式LINEリンクを入力してください。');
    }
    const ids = new Set();
    for (const venue of data.venues) {
      for (const key of ['id', 'name', 'type', 'photo', 'photoAlt']) if (typeof venue[key] !== 'string') throw new Error('会場の入力内容を確認してください。');
      if (!venue.id || ids.has(venue.id) || !types[venue.type]) throw new Error('会場の種類または識別情報を確認してください。');
      ids.add(venue.id);
      if (venue.photo && !/^assets\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(venue.photo) && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(venue.photo)) throw new Error('写真の形式はJPEG・PNG・WebPにしてください。');
    }
    const eventIds = new Set();
    for (const event of data.lessons) {
      for (const key of ['id', 'title', 'type', 'venueId', 'date', 'time', 'price', 'age', 'items', 'status']) if (typeof event[key] !== 'string') throw new Error('イベントの入力内容を確認してください。');
      if (!event.id || eventIds.has(event.id) || !types[event.type] || !statuses.includes(event.status) || typeof event.hidden !== 'boolean') throw new Error('イベントの種類・受付状態・表示設定を確認してください。');
      eventIds.add(event.id);
      if (event.venueId && data.venues.find(v => v.id === event.venueId)?.type !== event.type) throw new Error('イベントと会場の種類を合わせてください。');
      if (event.venueId && !ids.has(event.venueId)) throw new Error('イベントの会場を選び直してください。');
      if (event.date && (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || Number.isNaN(Date.parse(event.date)) || new Date(event.date).toISOString().slice(0,10) !== event.date)) throw new Error('開催日を確認してください。');
      if (event.legacyDatetime !== undefined && typeof event.legacyDatetime !== 'string') throw new Error('旧開催日時の形式を確認してください。');
    }
    return data;
  }
  function today() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = type => parts.find(p => p.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  const visible = (event, data) => !event.hidden && !(data.hidePast && event.date && event.date < today());
  return { types, statuses, defaults, id, normalize, validate, today, visible };
})();
