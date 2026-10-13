const model = window.LealeaLessons;
const storageKey = 'lealea-lessons-draft-v2';
const form = document.getElementById('editor-form');
const status = document.getElementById('editor-status');
const frame = document.getElementById('preview-frame');
let data = null;
let revision = 0;
const clone = value => JSON.parse(JSON.stringify(value));
function persist() {
  revision++;
  if (!data) return;
  try { localStorage.setItem(storageKey, JSON.stringify(data)); status.textContent = 'このブラウザに自動保存しました。GitHubにはまだ反映されていません。'; }
  catch { status.textContent = 'ブラウザに保存できませんでした。容量や保存設定を確認し、閉じる前に「更新ファイルを保存」で必ず保存してください。'; }
}
function preview() {
  if (!data || document.getElementById('preview-panel').hidden) return;
  try { model.validate(data); document.getElementById('preview-status').textContent = ''; frame.hidden=false; frame.contentWindow.postMessage({type:'lealea-preview',data}, window.location.origin === 'null' ? '*' : window.location.origin); }
  catch (error) { document.getElementById('preview-status').textContent = error.message; frame.hidden=true; }
}
function changed() { persist(); preview(); }
function field(parent, labelText, object, key, type = 'text', options = null) {
  const label = document.createElement('label'); label.append(document.createTextNode(labelText));
  const input = document.createElement(options ? 'select' : 'input');
  if (options) options.forEach(([value, caption]) => { const option = document.createElement('option'); option.value=value; option.textContent=caption; input.append(option); });
  else { input.type = type; if (type !== 'checkbox') input.placeholder='未確定なら空欄'; }
  input.dataset.field=key;
  if (type === 'checkbox') { input.checked=object[key]; label.className='editor-check'; }
  else input.value=object[key] || '';
  input.addEventListener(type === 'checkbox' || options ? 'change' : 'input', () => {
    object[key] = type === 'checkbox' ? input.checked : input.value;
    if (key === 'type' && 'venueId' in object && data.venues.find(v=>v.id===object.venueId)?.type !== object.type) object.venueId='';
    if (key === 'name' || key === 'type') refreshVenueChoices();
    changed();
  });
  label.append(input); parent.append(label); return input;
}
function button(parent, title, handler) { const el=document.createElement('button'); el.type='button'; el.textContent=title; el.className='button button-outline'; el.addEventListener('click',handler); parent.append(el); return el; }
function refreshVenueChoices() {
  document.querySelectorAll('[data-event-id]').forEach(article => {
    const event=data.lessons.find(e=>e.id===article.dataset.eventId);
    const select=article.querySelector('[data-field=venueId]'); select.replaceChildren();
    const options=[['','詳細準備中'],...data.venues.filter(v=>v.type===event.type).map(v=>[v.id,v.name || '会場名の詳細準備中'])];
    options.forEach(([value,name])=>{const option=document.createElement('option');option.value=value;option.textContent=name;select.append(option);});
    if (!options.some(([value])=>value===event.venueId)) event.venueId='';
    select.value=event.venueId;
  });
}
function render() {
  form.hidden=false;
  document.getElementById('month').value=data.month; document.getElementById('line-url').value=data.lineUrl; document.getElementById('hide-past').checked=data.hidePast;
  const venues=document.getElementById('editor-venues'); venues.replaceChildren();
  for (const venue of data.venues) {
    const article=document.createElement('section'); article.className='editor-entry'; article.dataset.venueId=venue.id;
    const heading=document.createElement('div'); heading.className='editor-entry-header'; const title=document.createElement('h3'); title.textContent='会場情報';heading.append(title);
    button(heading,'会場を削除',()=>{if(confirm('会場を削除しますか？関連イベントは残りますが、会場を選び直す必要があります。')){data.venues=data.venues.filter(v=>v.id!==venue.id);data.lessons.forEach(e=>{if(e.venueId===venue.id)e.venueId='';});render();changed();}});
    const grid=document.createElement('div');grid.className='editor-fields';
    field(grid,'種類',venue,'type','text',Object.entries(model.types));field(grid,'会場名',venue,'name');field(grid,'写真の説明',venue,'photoAlt');
    const external=field(grid,'GitHubに保存済みの写真（任意）',venue,'photo');
    if(venue.photo.startsWith('data:')) {external.value='';external.placeholder='選択した写真を保存済み';}
    const image=document.createElement('img');image.className='editor-photo-preview';image.alt=venue.photoAlt || '会場写真';image.src=venue.photo || 'assets/lesson-placeholder.svg';
    external.addEventListener('input',()=>{image.src=venue.photo || 'assets/lesson-placeholder.svg';});
    const photoLabel=document.createElement('label');photoLabel.textContent='会場写真を選ぶ（1枚800KBまで）';
    const picker=document.createElement('input');picker.type='file';picker.accept='image/jpeg,image/png,image/webp';picker.dataset.photoPicker=venue.id;
    picker.addEventListener('change',async()=>{
      const file=picker.files[0];if(!file)return;
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>800*1024){status.textContent='JPEG・PNG・WebPの800KB以下の写真を選んでください。大きな画像はGitHubのassetsに保存し、写真の場所を入力できます。';picker.value='';return;}
      try {
        const result=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
        const candidate=clone(data);candidate.venues.find(v=>v.id===venue.id).photo=result;
        if(JSON.stringify(candidate).length>3000000)throw new Error('写真の合計容量が大きすぎます。写真をGitHubのassetsに保存し、写真の場所を入力してください。');
        venue.photo=result;image.src=result;external.value='';external.placeholder='選択した写真を保存済み';changed();
      } catch(error){status.textContent=error.message || '写真を読み込めませんでした。';} picker.value='';
    });
    photoLabel.append(picker);button(grid,'写真を外す',()=>{venue.photo='';image.src='assets/lesson-placeholder.svg';external.value='';changed();});
    article.append(heading,grid,photoLabel,image);venues.append(article);
  }
  const events=document.getElementById('editor-lessons');events.replaceChildren();
  for(const event of data.lessons) {
    const article=document.createElement('section');article.className='editor-entry';article.dataset.eventId=event.id;
    const heading=document.createElement('div');heading.className='editor-entry-header';const title=document.createElement('h3');title.textContent=event.title || 'イベント情報';heading.append(title);
    button(heading,'複製して再利用',()=>{data.lessons.push({...clone(event),id:model.id(),date:'',legacyDatetime:'',hidden:false,status:'詳細準備中'});render();changed();});
    button(heading,'削除',()=>{if(confirm('このイベントを削除しますか？記録を残したい場合は「非表示」を選んでください。')){data.lessons=data.lessons.filter(e=>e.id!==event.id);render();changed();}});
    const grid=document.createElement('div');grid.className='editor-fields';
    field(grid,'種類',event,'type','text',Object.entries(model.types));field(grid,'会場',event,'venueId','text', [['','詳細準備中']]);field(grid,'イベント名',event,'title');field(grid,'開催日',event,'date','date');field(grid,'時間（開始〜終了）',event,'time');field(grid,'参加費（円・税込なども入力）',event,'price');field(grid,'対象月齢',event,'age');field(grid,'持ち物',event,'items');field(grid,'受付状態',event,'status','text',model.statuses.map(v=>[v,v]));field(grid,'このイベントを非表示にする',event,'hidden','checkbox');
    if(event.legacyDatetime){const note=document.createElement('p');note.textContent=`旧形式の開催日時：${event.legacyDatetime}（開催日・時間に入力し直してください）`;note.className='small-note';article.append(note);}
    const note=document.createElement('p');note.className='small-note';note.textContent=event.date && event.date < model.today() ? '過去のイベントです。終了日が過ぎたイベントを自動非表示にする設定に従います。複製して再利用できます。' : '非表示にしても、この編集画面には記録が残ります。';
    article.append(heading,grid,note);events.append(article);
  }
  refreshVenueChoices();
}
function adopt(input) {data=model.normalize(input);render();changed();}
for (const [id,key] of [['month','month'],['line-url','lineUrl'],['hide-past','hidePast']]) document.getElementById(id).addEventListener(id==='hide-past'?'change':'input',e=>{data[key]=id==='hide-past'?e.target.checked:e.target.value;changed();});
document.getElementById('add-venue').addEventListener('click',()=>{data.venues.push({id:model.id(),name:'',type:'studio',photo:'',photoAlt:''});render();changed();});
document.getElementById('add-lesson').addEventListener('click',()=>{data.lessons.push({id:model.id(),title:'',type:'studio',venueId:'',date:'',time:'',price:'',age:'',items:'',status:'詳細準備中',hidden:false});render();changed();});
document.getElementById('show-preview').addEventListener('click',()=>{document.getElementById('preview-panel').hidden=false;preview();document.getElementById('preview-panel').scrollIntoView({behavior:'smooth'});});
frame.addEventListener('load',preview);
document.getElementById('import-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;if(data&&!confirm('ブラウザの編集内容を、選択したファイルで置き換えますか？')){event.target.value='';return;}try{adopt(JSON.parse((await file.text()).replace(/^\uFEFF/,'')));}catch(error){status.textContent=`読み込めませんでした：${error.message}`;}event.target.value='';});
async function loadRepository() {
  const initialRevision=revision;
  try{const response=await fetch('lessons.json',{cache:'no-cache'});if(!response.ok)throw new Error();const input=await response.json();if(revision!==initialRevision)return;adopt(input);}
  catch{status.textContent='保存済み情報を読み込めませんでした。現在のlessons.jsonを「保存済み情報を読み込む」で選択してください。';}
}
document.getElementById('load-repository').addEventListener('click',()=>{if(!data||confirm('ブラウザの編集内容を破棄し、サイトの保存済み情報に戻しますか？'))loadRepository();});
form.addEventListener('submit',event=>{
  event.preventDefault();try{model.validate(data);}catch(error){status.textContent=error.message;return;}
  persist();const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='lessons.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='更新ファイルの保存を開始しました。ファイル名をlessons.jsonにして、GitHubの作業ブランチのルートへアップロードしてください。';
});
try {
  const raw=localStorage.getItem(storageKey);
  if(raw){const draft=JSON.parse(raw);model.validate({...draft,lineUrl:''});data=draft;render();status.textContent='前回の編集内容をこのブラウザから復元しました。';}
  else loadRepository();
}catch{status.textContent='ブラウザの保存内容を復元できませんでした。更新ファイルを読み込むか「サイトの保存済み情報に戻す」を選んでください。';}
