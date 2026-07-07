# 変身スタジオ — GitHub Pages「あいことば解凍ゲート」

`docs/` は GitHub Pages 公開用の**暗号化済みビルド**です。各HTMLは AES-256-GCM + PBKDF2(SHA-256, 20万回) で
暗号化された「解凍ローダー」で、正しいあいことばを入れると復号してスタジオが立ち上がります。
セッション中は一度入力すれば、iframe・別窓・ページ遷移でも再入力なしで自動解凍されます（タブを閉じると鍵は消えます）。

## 再ビルド（あいことばを決め直したら、この1コマンド）

```
cd ~/css && node tools/build-pages.js --password "<新しいあいことば>"
```

- 現在の暫定あいことば: `orimo-dante`（正式決定したら上のコマンドで再ビルド）。
- 平文パスワードは**リポジトリに残りません**（引数で渡すだけ・出力には salt と暗号文のみ）。
- 元ファイル（`~/css` 直下の controller.html 等）は無変更。ローカルの `起動.command` は従来どおり動きます。

## GitHub Pages 有効化手順（折茂本人が実行）

1. `feature/henshin` を GitHub へ push（このゲートは push しない指示なので、公開時に本人が実行）。
2. GitHub リポジトリ → Settings → Pages。
3. Source: 「Deploy from a branch」、Branch: 公開したいブランチ、フォルダ: **`/docs`** を選択して Save。
4. 数十秒後、`https://<user>.github.io/<repo>/` を開く → `controller.html` へ誘導 → あいことば入力。

## 注意（防御レベル）

- これは**カジュアルゲート**です。リポジトリが公開の場合、`docs/*.html` の暗号文とビルドスクリプトは誰でも読めます。
  あいことばが分からなければ復号はできませんが、総当たり耐性は「あいことばの強さ」次第です。推測しづらい語を選んでください。
- 本当に秘匿したいものはこの方式に置かない（＝機密対策ではなく、共有相手を絞るための鍵）。

## 中身

| ファイル | 中身 |
|---|---|
| `index.html` | 入口（`controller.html` へ誘導。秘密なし） |
| `controller.html` | 操作パネル＋モデル表示（暗号化） |
| `css-vtuber.html` ほか6本 | 各キャラモデル（暗号化・controllerがiframeで読む） |
| `vcam-extension/` | 仮想カメラ用Chrome拡張（暗号化不要・そのままコピー） |

## 暗号仕様（監査用）

- 鍵導出: `PBKDF2-HMAC-SHA256(password, salt=16B, iterations=200000) → 32Bキー`
- 暗号化: `AES-256-GCM`、`payload = iv(12) || ciphertext || authTag(16)`（Base64・WebCrypto互換レイアウト）
- 誤あいことば判定: GCM認証タグ検証の失敗（＝復号例外）で判定。ブラウザ側は WebCrypto の `crypto.subtle` を使用（https必須）。
