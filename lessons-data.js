/* サイトと編集画面で共通の入力チェック。表示内容は lessons.json で管理します。 */
window.LealeaLessons = {
  validate(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('開催情報の形式が正しくありません。');
    if (typeof data.month !== 'string' || typeof data.lineUrl !== 'string' || !Array.isArray(data.lessons)) throw new Error('月・LINE URL・レッスン一覧を確認してください。');
    if (data.lineUrl) {
      let url;
      try { url = new URL(data.lineUrl); } catch { throw new Error('LINE URLを確認してください。'); }
      if (url.protocol !== 'https:' || !['line.me', 'lin.ee'].includes(url.hostname) || url.username || url.password) throw new Error('LINE URLは https://line.me/ または https://lin.ee/ の公式リンクを入力してください。');
    }
    for (const lesson of data.lessons) {
      if (!lesson || typeof lesson !== 'object' || Array.isArray(lesson)) throw new Error('レッスンの形式が正しくありません。');
      for (const key of ['title', 'venue', 'datetime', 'age', 'price', 'photo', 'photoAlt']) if (typeof lesson[key] !== 'string') throw new Error('レッスンの各項目を文字で入力してください。');
      if (typeof lesson.reservationsOpen !== 'boolean') throw new Error('予約受付の設定を確認してください。');
      if (lesson.photo && !/^assets\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(lesson.photo)) throw new Error('写真は assets/photo.jpg のような半角英数字のファイル名を指定してください。');
    }
    return data;
  }
};
