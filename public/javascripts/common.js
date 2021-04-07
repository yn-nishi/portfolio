//// Copyright 2021 yn_nishi All Rights Reserved.
// 全ページ共通ファイル

// 画面サイズ振り分け
let size = 'nomal';
if (window.matchMedia && window.matchMedia('(max-device-width: 1000px)').matches) {
  size = 'small';
}
// モーダルセットアップ
window.addEventListener('load', ()=>{
  MicroModal.init({});
},false);

// モーダルopen
async function showModal(modalId) {
  document.getElementById('modal-1-title').textContent = 'カートの中身';
  getBasketData();
  await new Promise((resolve) => setTimeout(resolve, 200));
  MicroModal.show('modal-' + modalId, {
    disableScroll: true,
    awaitOpenAnimation: true,
    awaitCloseAnimation: true,
    disableFocus: true
  });
}

// 買い物かごに入っているアイテムのHTMLを取得してモーダルに反映
async function getBasketData() {
  let data = await fetch('/basket/show', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    credentials: 'same-origin',
    body: JSON.stringify({ size })
  });
  if(data.ok) {
    data = await data.json();
    document.getElementById('modal-1-content').innerHTML = data['html'];
    document.getElementById('js_itemQty').textContent = data['ss']['itemQty'];
  }
}

// 買い物かごに入れる
async function addBasketData(id) {
  let data = await fetch('/basket/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    credentials: 'same-origin',
    body: JSON.stringify({ id: id - 0 })
  });
  showModal(1);
}

// アイテムの個数を変更
async function changeQty(id, mathType) {
  let data = await fetch('/basket/changeQty', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    credentials: 'same-origin',
    body: JSON.stringify({ id, mathType, size })
  });
  data = await data.json();
  document.getElementById('modal-1-content').innerHTML = data.html;
  document.getElementById('js_itemQty').textContent = data.ss.itemQty;
}

// 購入処理
async function payment() {
  let data = await fetch('/basket/payment', { method: 'POST' });
  if(data.ok) {
    document.getElementById('modal-1-title').textContent = '購入完了';
  }
  data = await data.json();
  document.getElementById('modal-1-content').innerHTML = data.html;
  document.getElementById('js_itemQty').textContent = data.ss.itemQty;
}

// アイコン関係
const $pickIconWin = document.getElementById('js_pickIcon');
const $myIcon = document.getElementById('js_myIcon');
const $use = $myIcon.getElementsByTagName('use')[0];
$myIcon.addEventListener('click', () => {
  $pickIconWin.style.display = 'block';
  const iconRect = $myIcon.getBoundingClientRect();
  const pickIconWinRect = $pickIconWin.getBoundingClientRect();
  $pickIconWin.style.top = iconRect.bottom + 15 + 'px';
  $pickIconWin.style.left = iconRect.left +  iconRect.width - pickIconWinRect.width / 2 + 'px';
});
document.addEventListener('click', (e) => {
  if(!e.path.includes($pickIconWin) && !e.path.includes($myIcon)) {
    $pickIconWin.style.display = 'none';
    
  }
});
function setMyIcon(num) {
  $use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `/images/icons/defs.svg#${num}`);
  $pickIconWin.style.display = 'none';
}

// chat送信
const socket = io();
const $name = document.getElementById('js_chatInput_name');
const $msg = document.getElementById('js_chatInput_msg');
const $sbm = document.getElementById('js_chatInput_sbm');
const $balance = document.getElementById('js_balance');
$sbm.addEventListener('click', submitChat);
$msg.addEventListener('submit', submitChat);
async function submitChat(e) {
  e.stopPropagation();
  e.preventDefault();
  if(!$name.value.trim()) {
    $name.placeholder = '名前ないよ！';
    $name.classList.add("hp_ph_red")
    return false;
  }
  if(!$msg.value.trim()) {
    $msg.placeholder = '何か一言！';
    $msg.classList.add("hp_ph_red")
    return false;
  }
  const $myIconHref = $use.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
  const formData = {
    'icon' : $myIconHref.match(/\d+$/)[0],
    'name' : $name.value,
    'msg': $msg.value
  };
  let data = await fetch('/emit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    credentials: 'same-origin',
    body: JSON.stringify(formData)
  });
  if(data.ok) {
    $msg.value = '';
    $name.classList.remove("hp_ph_red");
    $name.placeholder= '';
    $msg.classList.remove("hp_ph_red");
    $msg.placeholder= 'Message';
  }
  data = await data.json();
  moko(data);
  $balance.textContent = data.ss.balance.toLocaleString('ja-JP');
  if(document.getElementById('js_myName') !== null) {
    document.getElementById('js_myName').textContent = $name.value;
  }
  return false;
}
// チャット受信
socket.on("s2c", async (data) => {
  // チャットログhtml取得・更新
  if(document.getElementById('js_chatView') !== null) {
    let data = await fetch('/chatLoad', { method: 'POST', credentials: 'same-origin' });
    data = await data.text();
    document.getElementById('js_chatView').innerHTML = data;
  }
  // 弾幕
  const $barrage = document.createElement('div');
  $barrage.className = 'un_barrage';
  $barrage.textContent = data['msg'];
  document.body.appendChild($barrage);
  $barrage.style.display = 'inline-block';
  const rect = $barrage.getBoundingClientRect();
  $barrage.style.left = window.outerWidth + 'px';
  $barrage.style.top = Math.abs(~~(Math.random() * document.documentElement.clientHeight) - rect.height) + 'px';
  let begin = new Date() - 0;
  let timer = 10000;
  const barrageId = setInterval(() => {
    var current = new Date() - begin;
    if (current > timer) {
        clearInterval(barrageId);
        current = timer;
        $barrage.remove();
    }
    $barrage.style.left = window.outerWidth - (2 * rect.width + window.outerWidth) * (current / timer) + 'px';
  }, 10);
});

async function random() {
  let data = await fetch('/random', { method: 'POST' });
  if(data.ok) {
    data = await data.json();
    $msg.value = data.comment;
  }
}
// お金が増える時のもこもこ
function moko(data) {
  document.body.insertAdjacentHTML('beforeend', data.html);
  const $moko = document.getElementById('js_' + data.income);
  const rect = $balance.getBoundingClientRect();
  let min = rect.left - 1.5 * rect.width;
  let max = rect.right - 1.5 * rect.width;
  let startTop = rect.bottom  + 30 + (Math.random () * 30);
  $moko.style.left = min + (Math.random () * (max - min)) + 'px';
  let begin = new Date() - 0;
  let timer = 3000;
  const id = setInterval(() => {
    var current = new Date() - begin;
    if (current > timer) {
        clearInterval(id);
        current = timer;
        $moko.remove();
    }
    $moko.style.top = startTop - (startTop + 35) * (current / timer) + "px";
  }, 10);
}

// 評価送信
async function appraise(review) {
  let data = await fetch('/item/appraise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    credentials: 'same-origin',
    body: JSON.stringify(review)
  });
  if(data.ok) {
    data = await data.json();
    document.getElementById('js_reputation').innerHTML = data.starHtml;
    document.getElementById('js_reputation_count').textContent = data.rep_count + '個の評価';
    document.getElementById('js_myReputation').innerHTML = data.myStarHtml;
  }
  
  return false;
}
