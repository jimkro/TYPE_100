# ⌨️ Typing Survival: Vibe Evolution

![Version](https://img.shields.io/badge/version-v25.0-blueviolet?style=for-the-badge)
![Coding Style](https://img.shields.io/badge/style-Vibe_Coding-orange?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/tech-ES6_Modules_%7C_Canvas_%7C_Web_Audio-yellow?style=for-the-badge)

**Typing Survival** 是一款將「打字練習」與「類倖存者 (Survivor-like)」機制結合的生存動作遊戲。玩家不再使用 WASD，而是透過快速且精確的打字來控制位移、施放技能與擊殺海量敵人。

本專案貫徹 **Vibe Coding** 精神：從單一檔案的原型出發，隨靈感迭代至如今的模組化架構，並整合了專業的遊戲迴圈與原生音效合成技術。

---

## 🕹️ v25 核心特色 (New Features)

### 1. 深度戰鬥與進化系統
* **全鍵盤戰術操作**：輸入 `up`, `down` 等指令並按下 `Space/Enter` 進行戰術位移，邊打字邊走位。
* **武器進化 (Weapon Evolution)**：武器升級至 Lv.5 將觸發質變：
    * 🔫 **Handgun ➜ Chain Gun**：子彈在敵人之間連鎖彈射，單點爆發轉為群體傷害。
    * 🏹 **Bow ➜ Multishot Bow**：一次發射三支穿透箭矢，大範圍清理扇形區域。
    * 💣 **Grenade ➜ Cluster Bomb**：爆炸後分裂出多個小炸彈，造成二次毀滅打擊。
    * 🔥 **Molotov ➜ Blue Hellfire**：燃燒範圍大幅擴大，藍色烈焰傷害頻率倍增。
* **史詩 BOSS 戰**：每 5 級或 10 級遭遇強大 BOSS，具備多階段血量、特殊外型與專屬戰鬥 BGM。

### 2. 專業級遊戲引擎優化
* **固定時間步長 (Fixed Time Step)**：採用 Accumulator 模式，解決了高刷新率螢幕 (144Hz+) 導致遊戲速度過快的問題，確保所有裝置上的物理運算一致。
* **平滑渲染 (Interpolation)**：實作 `Lerp` 插值算法與座標快照 (Snapshot)，讓角色與敵人在邏輯幀之間移動絲滑流暢，告別殘影與頓挫。
* **模組化架構**：從單檔義大利麵程式碼重構為 `ES6 Modules` (Logic, State, Renderer, SFX 分離)，結構清晰，易於維護與擴充。

### 3. 沈浸式視聽體驗
* **Web Audio 合成音效**：不使用任何外部 MP3 素材，完全透過瀏覽器 `Oscillator` 與 `GainNode` 即時合成復古風 BGM 與打擊音效。
* **多題庫選擇**：
    * 🔤 **常用英文**：日常高頻單字。
    * 💻 **資訊工程**：Coding 專用術語 (Binary, Cache, Algorithm)。
    * 🎓 **教育主題**：校園與學術詞彙。

---

## 🚀 迭代歷程 (Changelog Highlights)

見證從一個 `index.html` 到完整遊戲引擎的進化：

| 版本區間 | 核心里程碑 | 技術細節 |
| :--- | :--- | :--- |
| **v1 - v9** | **原型驗證** | 確立打字移動、基礎武器與階段關卡機制。 |
| **v10 - v13** | **物理與平衡** | 引入怪物防重疊物理 (Soft Collision)、難度動態縮放。 |
| **v14 - v18** | **架構重構** | **重大更新**：捨棄單一檔案，全面轉向 ES6 模組化開發。 |
| **v19 - v21** | **音效引擎** | 實作 `sfx.js`，加入動態 BGM 切換 (Normal/Boss) 與合成打擊音效。 |
| **v22 - v23** | **渲染優化** | 實作遊戲迴圈分離 (Update/Draw) 與畫面內插 (Smoothing)，解決 FPS 差異問題。 |
| **v24 - v25** | **內容擴充** | **當前版本**：武器進化系統、題庫選擇器、UI 視覺與操作手感升級。 |

---

## 🛠️ 開發哲學：Vibe Coding

這個專案是「直覺驅動開發」的極致體現：
1.  **AI 結對編程**：將抽象的「手感」需求（如：怪太多了、畫面不夠滑）丟給 AI，協作產出專業級的數學公式與演算法。
2.  **無視過度設計**：不預設完美架構，遇到效能瓶頸（如 FPS 問題）才進行重構。
3.  **瀏覽器即引擎**：堅持使用原生 Canvas API 與 Web Audio API，不依賴龐大的遊戲引擎 (Unity/Phaser)。

---

## 🎮 如何開始 (Installation)

由於 v14 後採用了 **ES6 Modules** (`import/export`)，受限於瀏覽器的 CORS 安全策略，**不能**直接雙擊 `index.html` 開啟。請選擇以下任一方式：

### 使用 VS Code (推薦)
1. 安裝 VS Code 套件 **Live Server**。
2. 右鍵點擊 `index.html`，選擇 `Open with Live Server`。
