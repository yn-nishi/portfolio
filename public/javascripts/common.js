//// Copyright 2021 yn_nishi All Rights Reserved.
//Javascript共通ファイル

// モーダルセットアップ
document.addEventListener('load', ()=>{
  MicroModal.init({
    disableScroll: true,
    awaitOpenAnimation: true,
    awaitCloseAnimation: true,
    disableFocus: true
  });
},false);

// モーダルopen
async function showModal(modalId) {
  getBasketData();
  await new Promise((resolve) => setTimeout(resolve, 200));
  MicroModal.show('modal-' + modalId);
}

// 買い物かごに入っているアイテムのHTMLを取得してモーダルに反映
async function getBasketData() {
  let data = await fetch('/basket/show', { method: 'POST' });
  data = await data.json();
  document.getElementById('modal-1-content').innerHTML = data['html'];
  document.getElementById('js_itemQty').textContent = data['ss']['itemQty']
}

// 買い物かごに入れる
async function addBasketData(id) {
  let data = await fetch('/basket/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify({ id: id - 0 })
  });
  showModal(1);
}

// アイテムの個数を変更
async function changeQty(id, mathType) {
  let data = await fetch('/basket/changeQty', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify({ id: id, mathType: mathType })
  });
  data = await data.json();
  document.getElementById('modal-1-content').innerHTML = data['html'];
  document.getElementById('js_itemQty').textContent = data['ss']['itemQty'];
}

// 購入処理
async function payment() {
  let data = await fetch('/basket/payment', { method: 'POST' });
  const paymentHtml = await data.text();
  document.getElementById('modal-1-content').innerHTML = paymentHtml;
}

document.body.addEventListener('click', async () => {
  let data = await fetch('/basket/payment', { method: 'POST' });

});

// アイコン関係
const $pickIconWin = document.getElementById('js_pickIcon');
const $myIcon = document.getElementById('js_myIcon');
const $use = $myIcon.getElementsByTagName('use')[0];
$myIcon.addEventListener('click', () => {
  $pickIconWin.style.display = 'block';
  const iconRect = $myIcon.getBoundingClientRect();
  const pickIconWinRect = $pickIconWin.getBoundingClientRect();
  console.log('kfoekfekoek');
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
    headers: { 'Content-Type': 'application/json' },
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
  document.body.insertAdjacentHTML('beforeend', data.html);
  $balance.textContent = data.ss.balance.toLocaleString('ja-JP');
  moko(data.income);
  return false;
}
// チャット受信
const $chatView = document.getElementById('js_chatView');
socket.on("s2c", (arg) => {
  $chatView.innerHTML = arg;
});

// もこもこ 
function moko(income) {
  const $moko = document.getElementById('js_' + income);
  const rect = $balance.getBoundingClientRect();
  console.log(rect);
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
      $moko.style.top = startTop - (startTop + 30) * (current / timer) + "px";
    }, 10);
}