//
//Javascript共通ファイル


// 買い物かごに入っているアイテムのデータを取得してモーダルに反映
async function getBasketData() {
  let basketData = await fetch('/basket', { method: 'POST' });
  basketHtml = await basketData.text();
  document.getElementById('modal-1-content').innerHTML = basketHtml;
}

// const aaa = document
async function changeQty(id, mathType) {
  let qty = await fetch('/basket/changeQty', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: mathType
  });
  console.log('you are'+id + mathType);
}

// モーダルセットアップ
window.addEventListener('load', function(){
  MicroModal.init({
    disableScroll: true,
    awaitOpenAnimation: true,
    awaitCloseAnimation: true,
    disableFocus: true
  });
},false);