
-- Items Table
CREATE TABLE Items (
id SMALLSERIAL PRIMARY KEY,         --商品ID
title VARCHAR(30),                  --商品タイトル
description TEXT,                   --商品説明(/item/:idで使用)
outline TEXT,                       --商品概要(/item/view/:categoryで使用 )
content TEXT,                       --購入者のみ表示
price INTEGER NOT NULL,             --商品値段
category VARCHAR(15) DEFAULT 'app', --商品ジャンル(アプリ,個人情報,ネタ等)
type VARCHAR(30) NOT NULL,          --商品タイプ(ブラウザ拡張機能,HP,ジョーク等)
purchased_qty INTEGER DEFAULT 0,    --購入された数
reputation NUMERIC DEFAULT 0,       --評価(評価総計 / 評価した人数)
rep_amount INTEGER DEFAULT 0,       --評価総計
rep_count INTEGER DEFAULT 0         --評価した人数
);

-- INSERT例
INSERT INTO
Items (id, title, description, outline, content, price, category, type, purchased_qty, reputation, rep_amount, rep_count)
VALUES (DEFAULT,  '商品タイトル', '商品の詳しい説明文', '商品の簡潔な説明文', '商品の購入済み文章', 5000, 'app', 'ブラウザ拡張機能', DEFAULT, DEFAULT, DEFAULT, DEFAULT);


-- Receipt TABLE
CREATE TABLE Receipt (
sid VARCHAR(40) PRIMARY KEY,  -- 購入者のSessionID
purchased_items JSONB,        -- { 購入したアイテムID: 個数 }
reviews JSONB,                -- { 評価したアイテムID: 5段階評価 }
);

-- Chat Table
CREATE TABLE Chat (
sid VARCHAR(40) NOT NULL,       -- 投稿者のSessionID
chat_icon VARCHAR(2) NOT NULL,
chat_name VARCHAR(20) NOT NULL,
chat_msg VARCHAR(200) NOT NULL,
posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP PRIMARY KEY
);
