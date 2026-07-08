# CSS VTuber プロジェクト — 引き継ぎドキュメント

## プロジェクト概要
画像素材を一切使わず、**HTML+CSSのみで描画されるVTuberモデル**と、それを動かすアプリ。
**方針: これは「VTuberモデルを動かすアプリ」であり、配信画面(スタジオ)は対象外。**
JSの役割は「CSS変数への書き込み」と「クラスのON/OFF」だけに限定する(絶対原則)。
描画・変形ロジックはすべてCSS側に置く。フェイストラッキングも変数注入のみで動く。

- 本体: `css-vtuber.html` (モデル+エディタ+トラッキング全部入り・単一ファイル)
- 操作アプリ: `controller.html` (モデルをiframe表示し postMessage で操作。
  マウス追従/表情ホットキー/スライダー/自動アニメON-OFF/カメラ遠隔起動/別窓ビューア)
- 開発サーバー: `serve.js` (`node serve.js` → http://localhost:8321/ でcontrollerが開く。ポート8321固定)
- ワンクリック起動: `start-vtuber.bat` (ダブルクリックでサーバー起動+ブラウザでcontrollerを開く。
  二重起動してもメッセージを出して安全に終了する)
- 仮想カメラ: `vcam-extension/` (Chrome拡張。Meet/YouTubeのgetUserMediaを差し替えて
  「CSS VTuber Camera」デバイスを生やす。詳細は同フォルダのREADME.md)
- `STUDIO_PLAN.md` は旧・配信スタジオ計画 (凍結)。モデル改善メモとしてのみ参照
- キャラクター: オレンジ髪の少年(制作者本人がモチーフ)。レトロポップ、フラット塗り+暗め朱色の縁取り

## 起動モード
| URL | 用途 |
|---|---|
| `css-vtuber.html` | エディタモード(調整パネル表示・アニメ停止) |
| `?live` | パネル非表示・背景透過・縁取りON・アイドルアニメ有効・カメラ自動起動 |
| `?live&zoom=0.8` | 表示倍率指定 |
| `?obs` | 透過+パネル非表示+アイドルアニメ有効(カメラ手動)。controllerの埋め込みはこれ |
| `?full` | 配信軽量モードを解除して全部入り(重い)に戻す。`?obs`/`?live`は既定で軽量 |
| `controller.html` | 操作アプリ(モデル表示+操作パネル) |
| `controller.html?viewer` | モデル表示のみの別窓(コントローラーから遠隔操作される側) |
| `?viewer&bg=00ff00` / `bg=transparent` | ビューアの背景指定 (OBS/クロマキー/仮想カメラ用) |
| Hキー | パネル表示切替 |

## レイヤー構造 (後ろ→前)
```
#model (320x680, --zoom でスケール)
└ .bob (アイドル浮遊アニメ + キャラ外周縁取りfilter)
   ├ #decoBack     … 襟足・もみあげ (顔の後ろ) ※縁取りあり
   ├ .bodygrp      … 体一式 (顔より後ろ→あごが襟に被さる) ※縁取りあり
   ├ .head (260x280, model左上から left:30/top:22 のオフセット)
   │  ├ .facegrp   … 輪郭(f-base) + 耳(.ear.l/.ear.r) ※一体で縁取り
   │  ├ .hair      … 髪 (縁取りなし=キャラ外周線に任せる)
   │  └ .feat      … 口(.mouth)
   └ #deco         … 白目・黒目・眉・ハイライト (頭に追従して回転)
      └ .eyegrp    … 白目2円のunion縁取りグループ
```

## パーツマップ (完全版)
- **輪郭**: `.facegrp .f-base` — polygon%座標 (頂点編集可能)。肌色 #f9eace
- **耳**: `.ear.l` / `.ear.r` — 半円 (`border-radius:100% 0 0 100% / 50% 0 0 50%` の左右ミラー)。
  内側の線: `.ear.l .e1/.e2`, `.ear.r .e1/.e2` (インク色バー)
- **髪(前面/.hair)**: b1(左上大玉) b3(右上) b2(右横) b4(左横) b8(中央充填) / u1(あほ毛) n2(右前髪) n34(右跳ね)
- **髪ハイライト**: `#deco .n1` (白・回転楕円)
- **サイド髪玉**: `#deco .n14`(左) `.n19`(右)
- **髪(後面/#decoBack)**: 右もみあげ=n5,u2 / 右襟足=u5,u4,n27 / 左もみあげ=n28,n4 / 左襟足=n21
- **白目**: `#deco .n12`(左・小さめ) `.n11`(右) — 左右非対称がキャラのキー。`.eyegrp`で包みunion外周だけ縁取り(メガネ型)
- **黒目**: `#deco .u3`(左) `.n15`(右) — 縦長楕円 + `radial-gradient(13% 9% at 66% 22%)`の右上ハイライト
- **眉(表情用)**: `#deco .xbrowL/.xbrowR` — 通常display:none、怒り/困り/照れ/ドヤ/ねむい表情で出現
- **頬の赤み(表情用)**: `#deco .xcheekL/.xcheekR` — 通常display:none、照れ表情で出現
- **閉じ目の線**: `#deco .xlidL/.xlidR` — まぶたのライン。opacityが `calc((.14 - var(--eo))*12)` で
  目を閉じきると自動で現れる(目が消える対策)。表情中は非表示(exp-closeのみ表示)
- **口**: `.mouth` — width固定17px、heightが `calc(6px + var(--mouth-open)*26px)` でリップシンク
- **首**: `.bodygrp .u6` (肌色台形)
- **体(.bodygrp)**: v2=シャツ v3/v4=袖 v5/v6=腕 v7/v8=手 v9〜v12=指の溝 v13=ショーツ
  v14〜v16=縫い目 v17/v18=脚 v19/v20=靴 v21/v22=フラップ v23/v24=黄ライン v25/v26=ソール n25/n26=足首

## 変数API (トラッキング/演出はこれを叩くだけ)
```
--yaw --pitch --roll      : 首 (-1..1) → head/deco/decoBack回転(yaw*7deg)+顔パーツ視差+
                            顔のscaleX擬似遠近+体の遅れ追従(bodygrpのtransition慣性)
--eye-open                : まばたき (1=開, 0=閉) → 白目+黒目scaleY、閉じきると閉じ目線
--eye-open-l --eye-open-r : 左右別まばたき(あれば--eye-openより優先。ウィンク用)。
                            各目要素は --eo エイリアス経由で参照する
--pupil-x --pupil-y       : 視線 (-1..1) → 黒目translate
--mouth-open              : 口の開き (0..1) → 口のheight
--mouth-w                 : 口の横幅 (-0.45..0.9)。にやり+/すぼめ- → width:17px*(1+値)
--zoom                    : 表示倍率
--line-out --line-in      : 縁取り太さ(外周/内側) デフォルト 4 / 3.33
--line                    : 縁取り色 デフォルト #7f2f16 (暗め朱色)
--hair --ink              : 髪色 / 口・耳線の色
```

## 表情クラス (#model に付与、複数排他)
`exp-smile`(にっこり) `exp-bikkuri` `exp-jito` `exp-angry` `exp-sad` `exp-close`(目閉じ)
`exp-wink`(左目ウィンク) `exp-tere`(照れ・頬赤み) `exp-doya`(ドヤ顔) `exp-nemui`(ねむい) `exp-guru`(目を回す)
`exp-heart`(ハート目・鼓動) `exp-star`(星目・回転) — 黒目を消して `#deco .xeyeL/.xeyeR`
(clip-pathのハート/星)を表示する特殊目
白目scaleY・黒目opacity/translate/animation・口のwidth/height/radius・眉/頬表示の組み合わせで実装。
表情中は目のアイドルアニメ(blink/gaze)を `animation:none!important` で停止(表情優先)。
exp-guru の黒目ぐるぐるだけは同じ !important+後置で勝たせている。
トラッキング中は笑顔検出(mouthSmile>0.6)で exp-smile が自動トグルされる。

## アイドルアニメクラス (#model に付与、個別ON/OFF可)
`auto-blink`(まばたき・二段カーブ) `auto-gaze`(目の泳ぎ) `idle-bob`(浮遊) `idle-breathe`(呼吸=シャツv2+袖)
`hair-sway`(髪ゆれ=b4/b2+あほ毛u1+跳ねn34) `hair-follow`(首回転への髪の遅延追従=transition)
`arm-swing`(腕v5-v8) `body-sway`(体の重心移動)
- keyframes内で `var(--eye-open)` 等を参照し、手動/トラッキング値と**乗算合成**される
- インラインtransformを持つパーツは独立プロパティ(`translate`/`rotate`/`scale`)で揺らして衝突回避
- エディタモードは `.editing` が `animation:none!important` で全停止

## ポーズクラス (#model に付与、複数同時OK)
`pose-raise-l`(左手上げ) `pose-raise-r`(右手上げ、両方=ばんざい) `pose-wave`(上げた手を振る)
`pose-think`(右手をあごへ) `pose-front`(両手を胸の前に=ワクワク。手はz-index:2でシャツより前、
腕はscaleY短縮でシャツ裏に隠す)。腕v5/v6・手v7/v8・袖v3/v4のleft/top/rotateを差し替えて表現。
手が動くポーズ中は指の溝(v9-v12)が取り残されるため該当側をdisplay:noneで隠す。
腕の回転後の下端が肩(左97,352/右198,350)に接続するよう座標調整済み。
カメラON中はポーズ検出(3フレームに1回)が classList を直接更新するため手動指定は上書きされる。

## エモート/ノリノリ/アイテム (すべてCSS描画・#modelのクラス)
- **エモート** `emo-heart/anger/sweat/ex/q/zzz`: 頭の横に1回ポップして消える(forwards)。
  実体は `#deco .xemo.e*`。!?とzzZは文字グリフ+text-stroke縁取り。
  ブリッジがreflowを挟んで同名連打でも再発火させる。表情連動はcontroller側 EXP_EMO
- **ノリノリ** `mode-groove`: 全身がリズム揺れ(頭+deco+decoBack同期/腕/体)。
  1拍=`--beat`秒(controllerのテンポスライダー、60/BPM)。ANIMS扱いでON/OFF
- **アイテム** `item-cup`(右手マグカップ・湯気アニメ) `item-light`(左手ペンライト・グロー)。
  `.bodygrp .xcup/.xlight`。該当側の手を上げると自動非表示。groove×light=振る
- **カラーテーマ**: `--hair/--line/--tee` の差し替えだけで髪・縁取り・服の色が変わる
  (u5とv2/v3/v4はvar参照に変更済み)。controllerにプリセット6色+ピッカー
- **音声リップシンク**: controllerがマイクRMS→`--mic`を注入し、口の高さは
  `max(var(--mouth-open), var(--mic,0))` でカメラと併存。マイクはcontrollerページ側で取得

## FX (CSS芸・一発演出。orimo君のみ実装、fx-*クラス)
`fx-scatter`(ばらける!=顔パーツが拡散→集合。飛び先は各パーツの--fxx/--fxy/--fxrで指定し
keyframes1本を共有、ディレイをばらして有機的に) `fx-glitch`(ノイズ=clip-path inset+
hue-rotate/invert+微振動をsteps(1)で離散化。※steps(1,jump-none)は無効値なので不可)
`fx-spin`(1回転) `fx-boing`(足元originのスカッシュ&ストレッチジャンプ)
- ブリッジ{type:'fx',name}が付与し、FXS[name]のミリ秒後にクラスを自動で外す
  (アイドルアニメと同じ要素のanimationを奪い合うため、外して返す必要がある)
- controllerの「CSS芸」ボタン (T/Y/U/I)。他キャラへはスキンブロックより前に同じCSSを移植すれば動く

## postMessage API (controller→モデルiframe)
```
{type:'exp',  name:'smile'|''}                 表情切替 (''=ニュートラル)
{type:'emo',  name:'heart'}                    エモート1回再生
{type:'fx',   name:'scatter'}                  CSS芸FX1回再生 (時間経過で自動解除)
{type:'item', name:'cup', on:true}             アイテムON/OFF
{type:'var',  key:'--zoom', value:0.9}         CSS変数1件
{type:'vars', vars:{'--yaw':0.3, ...}}         CSS変数一括 (マウス追従は毎フレームこれ)
{type:'anim', name:'auto-blink', on:true}      アイドルアニメクラスON/OFF
{type:'pose', name:'raise-l', on:true}         ポーズクラスON/OFF
{type:'cfg',  key:'eyeGain', value:1.4}        トラッキング設定 (eyeGain/smooth/pose)
{type:'track', vars:{...}, poses:[...], smile:bool}  トラッキング結果の一括反映 (別窓同期用)
{type:'cam',  on:true}                         フェイストラッキング開始/停止
```
モデルはロード完了時に親へ `{type:'vtuber-ready'}` を、カメラの成否変化時に
`{type:'cam-state', on:bool, error:''}` を、トラッキング中は毎フレーム `{type:'track'}` を送る。
まばたきは白目scaleYに加えて黒目も `scaleY(var(--eye-open))` で連動して閉じる。

## 別窓ビューアの同期 (controller.html?viewer)
- controller→ビューアは **opener参照へのpostMessage + BroadcastChannel('cssvtuber-ctrl')** の
  二系統で中継 (URL直打ちで開いた別窓/別タブにもBC経由で届く)
- ビューアはALLOWリスト (`exp/var/vars/anim/pose/cfg/track`) のみ自iframeへ転送。
  **'cam' は転送しない**: カメラはcontroller側モデルだけが起動し、
  結果は camLoop が毎フレーム親へ送る `{type:'track'}` を controller が relay() で別窓へ配る
- ビューアのモデル準備完了時は `viewer-ready` をBC+openerの両方へ送り、controllerが全状態を再送
- **撮影範囲**: ビューア右下「⚙撮影範囲」で全身/バスト/顔アップ+倍率・上下を指定
  (iframeのscale+transform-origin。ビューア窓ローカル設定でlocalStorage保存)。
  UIとバッジは3秒操作なしで自動フェード(配信映像への映り込み防止)

## フェイストラッキング (MediaPipe Face Landmarker + Pose Landmarker)
- CDN動的import (`@mediapipe/tasks-vision@0.10.14`) + face_landmarker.task (float16)
- blendshapes → 変数: eyeBlinkLeft/Right→--eye-open-l/-r(ミラーで左右交差) /
  jawOpen→--mouth-open / mouthSmile,mouthPucker→--mouth-w / eyeLook*→--pupil-x/y
- **目の自動キャリブレーション**: NEU(l/r)が「普段の開き」をEMAで追従し raw/NEU で正規化。
  目が細い人でも普段=全開1.0になる。感度は CFG.eyeGain (controllerのスライダー)
- **適応平滑化** step(): 小さい揺れは強く平滑(プルプル抑制)、大きい動きは速く追従。
  ベース値は CFG.smooth
- **首の正面キャリブレーション** NEUP: 起動後約30フレームの平均姿勢を正面として差し引く
  (カメラ位置の癖を吸収)。`{type:'cfg', key:'recenter'}` で再学習(controllerの📐ボタン)。
  応答カーブ curve() で小さい揺れ控えめ・大きい動きは伸びる
- facialTransformationMatrix → yaw/pitch/roll (deg→/25で正規化、ミラー写像)
- **ポーズ検出** (pose_landmarker_lite、3フレームに1回): 手首y<肩y→pose-raise-*、
  上げた手首xの往復→pose-wave、手首があご付近→pose-think。CFG.pose でON/OFF
- 軸が逆に感じたら camLoop 内の符号を反転する

## 仮想カメラ (OBS不要でMeet/YouTube配信のカメラになる)
`vcam-extension/` をChromeに読み込む (chrome://extensions → デベロッパーモード → 読み込み)。
- 仕組み: Meet/YouTubeページの `getUserMedia`/`enumerateDevices` をMAINワールドで上書きし
  「CSS VTuber Camera」を追加。ビューアタブが `getDisplayMedia(preferCurrentTab)` で自分を
  キャプチャし、WebRTC(タブ間ループバック、シグナリングは拡張のbg.js経由)で会議タブへ渡す
- 流れ: start-vtuber.bat (またはserve.js) → controller → 別窓ビューア →
  ビューア左下「🎥仮想カメラ開始」→ Meet/YouTubeのカメラ選択で「CSS VTuber Camera」
- ビューア未起動なら6秒で実カメラにフォールバック。ポート8321がmanifestに固定で入っている
- 会社PCでデベロッパーモード禁止の場合の代替: Meetの画面共有(ウィンドウ)でビューア窓を共有。
  自宅などソフトを入れられる環境ならOBSブラウザソース+OBS Virtual Cameraが最高画質

## バージョン退避
- `css-vtuber-ver01.html` / `controller-ver01.html`: 首振り強化・ポーズ・精度改善前
  (2026-07-04時点) のスナップショット。品質比較・巻き戻し用

## エディタの運用ループ (重要)
1. ユーザーが下絵画像を読み込み、素材パレットの図形を手置きしてトレース
2. 「調整CSSをコピー」で全パーツのCSSを書き出し → チャットに貼る
3. アシスタント側で**クラスルールに焼き込む** (このとき以下に注意):
   - エクスポートは**インラインstyleのみ**を含む。クラス由来のclip-path/グラデ/背景は
     出力に現れないので、**既存クラス定義の該当プロパティを消さないこと**
   - 同名クラスが2要素分ある場合は採番衝突 → 2つ目を u* にリネームして両方生かす
   - width:0/height:0 の眉(xbrow)等が混ざっていたら**無視**(非表示パーツの選択事故)
4. DOM順=描画順。エクスポートの並び順をDOMに反映する

## エディタ機能一覧
クリック選択/ドラッグ移動、8ハンドルリサイズ、回転ハンドル(Shiftで15°スナップ)、
頂点編集(polygon図形)、素材パレット(円/楕円/スパイク/フリック3種×左右/線/四角/三角/半円/台形/くさび/黒目/耳)、
色ピッカー、光の反射(radial-gradient位置・大きさ)、レイヤー切替(髪/自由/最背面)、
重なり順([ ]キー、▲▼)、矢印キー移動(Shiftで10px)、Ctrl+Z Undo(60手)、
パーツ選択ドロップダウン(耳・輪郭・口)、下絵表示(不透明度/大きさ/位置)、ホイールズーム

## 新キャラ制作の手順 (テンプレ運用)
**方式A: スキン上書き (推奨・実績あり)** — `css-vtuber-chochin.html` (提灯おばけ) がこの方式。
`css-vtuber.html` を複製し、`</style>` 直前に「★スキン★」ブロックを1つ追記するだけ。
orimo君のパーツ定義は消さず、後置上書きで「隠す(display:none)/形を変える/位置を変える」。
採番・変数API・表情/ポーズ/エモート/ブリッジは全部そのまま動く。
パーツの流用対応: f-base=本体シルエット / b1=装飾 / u1=あほ毛→火の玉等の可動小物(hair-sway連動) /
n1=ハイライト / u2,u4=背面装飾 / v7,v8=手(ポーズ・アイテム連動)。
controller.html の `MODELS` にファイルを登録すると「モデル」ドロップダウンに出る
(`?model=名前` でも指定可。切替はビューアにも同期し、vtuber-readyで状態が再送される)。

**方式B: 下絵トレース** —
1. `css-vtuber.html` を複製
2. 参考画像を下絵に読み込み (頭合わせでサイズ校正)
3. 輪郭(f-base)の頂点編集 → 髪blob → 目(白目union+黒目グラデ) → 耳 → 体 の順でトレース
4. 縁取りは「グループ単位のdrop-shadow×4」: 顔+耳/体/襟足/白目に内側線、キャラ全体に外周線
5. 表情は exp-* クラスとして白目/黒目/口/眉の変形で追加
6. トラッキング変数の配線はそのまま流用できる

## キャラ一覧 (すべてユーザーのイラストが原案。方式Aのスキン上書きで実装)
- **orimo君**: `css-vtuber.html` (オレンジ髪の少年・本人モチーフ) — 完成
- **提灯おばけ**: `css-vtuber-chochin.html` — 朱色提灯の体(リブ=repeating-gradient)+
  頭上の火の玉(u1流用・髪ゆれで揺らめく)+大口と舌(開くと舌が見える)+浮き手のみ+
  ぶら下がりスイング(body-sway→chSwing、上端軸)
- **ぶちたま**: `css-vtuber-buchitama.html` — 白まんまる妖怪。頭のこぶ2つ(b1,b3+割れ線b4)、
  茶ブチ(b2,b8)、不機嫌眉ライン(n14)、への字口+キバ(mouth::after)、しっぽ(u2)
- **にくすけ**: `css-vtuber-nikusuke.html` — 赤い塊くん。角丸スラブ体、頭のチョコだれ(b1,b3)、
  でか白目union+黒目左寄り(とぼけ目線がデフォ)、ミトン足(v19,v20)+足ひも(v17,v18)
- **びんぞう**: `css-vtuber-binzo.html` — 横たわった緑ビンの付喪神。横型バレル体+ラベル(b8)+
  注ぎ口(b1,b3)、上辺フラットの白目=ジト目がデフォ、白手袋(v7,v8)、
  **item-light(ペンライト)がナイフに改装済み**、body-sway→bnRoll(ごろごろ)
- **くらげちゃん**: `css-vtuber-kurage.html` — orimo君ベースの人間キャラ2号。
  水色のクラゲヘアー: 水玉模様+ツヤ入りのドーム傘(b1,b8)+丸前髪(b3,n2)+
  **触手毛束7本**(前=b4,b2,n34/後=decoBack u2,n5,n28,n4。S字波型clip-pathで先細り、
  hair-swayで kTent アニメが個別ディレイでゆらゆら漂う)。
  顔は**ダウナー系女性**: 上まぶたフラットの半目+まぶたライン(n14,n19)+目尻まつげ(::after)、
  あごを絞った専用輪郭polygon、常設うすチーク(opacity .4、照れで.95)。
  体も華奢化(手44x54卵型/腕11px/首38px/脚12px/口14px)。
  **クラゲワンピース**: 釣り鐘型に広がるワンピ(v2改装・呼吸アニメ有効)+裾の白フリル
  (v13をジグザグclipに改装)+パフ袖(v3,v4)。縫い目v14-16非表示。--tee:#e0f2f8 --line:#2f5d70

## 既知の注意点
- 縁取りは filter drop-shadow なので、内側線グループがキャラ外周に露出する箇所(耳先など)は
  外周線と重なって太く見える。--line-in / --line-out のバランスで調整する
- 表情の transform 上書きとトラッキングの scaleY は競合し得る(表情が優先される設計)
- .bodygrp 内のパーツはレイヤー切替ドロップダウン対象外
- getUserMedia は file:// でも動くが、環境によっては http サーバー経由が必要
