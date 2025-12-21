import { state, resetGame } from './state.js';
import { updatePhysics, processCommand, addXP } from './logic.js'; 
import { draw } from './renderer.js';
import * as UI from './ui.js';
import { initAudio, switchBGM } from './sfx.js';
import { WEAPON_DB } from './config.js'; 
import { createEffect } from './utils.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- [核心修改] 固定時間步長設定 ---
const FPS = 60;
const TIME_STEP = 1000 / FPS; // 每一幀應該是多少毫秒 (約 16.67ms)
let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp) {
    // 第一次執行沒有 timestamp，先初始化
    if (!lastTime) lastTime = timestamp;

    // 計算距離上次執行的時間差 (ms)
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // [防呆機制] 如果切換分頁或是卡頓太久 (例如 > 2秒)，強制限制最大時間差
    // 避免一次運算幾千次迴圈導致死當
    if (deltaTime > 2000) deltaTime = TIME_STEP;

    // 累積時間
    accumulator += deltaTime;

    if (state.gameState === 'PLAYING') {
        // [核心迴圈] 只要累積的時間夠多，就執行物理運算
        // 這樣可以保證無論螢幕 60Hz 還是 144Hz，物理運算的總次數是一樣的
        while (accumulator >= TIME_STEP) {
            updatePhysics(canvas.width, canvas.height); 
            UI.updateHUD(); // HUD 更新也可以放在這裡
            
            // 扣除已消耗的時間
            accumulator -= TIME_STEP;
        }
    } else {
        // 如果不在遊戲中 (例如 MENU)，還是要清空累積器，避免切換回來瞬間爆衝
        accumulator = 0;
    }

    // [渲染] 盡可能高頻率地畫圖 (內插補間可選，這邊先維持基本渲染)
    draw(canvas, ctx);

    requestAnimationFrame(gameLoop);
}

function startGame(stageId) {
    initAudio();
    switchBGM('normal');

    const stage = isNaN(stageId) ? stageId : parseInt(stageId);
    resetGame(stage);
    UI.initGameUI();
    
    // 重置計時器，避免第一幀爆衝
    lastTime = 0; 
    accumulator = 0;
}

window.addEventListener('keydown', (e) => {
    // [新增] 第一次按鍵時也嘗試啟動音效 (雙重保險)
    initAudio();

    if (state.gameState === 'MENU') return;
    
    if (state.gameState === 'PAUSED') {
        if (['1','2','3'].includes(e.key)) {
            const idx = parseInt(e.key) - 1;
            const cards = document.querySelectorAll('.card');
            if (cards[idx]) cards[idx].click();
        }
        return;
    }

    if (state.gameState === 'GAMEOVER' || state.gameState === 'STAGE_CLEAR') return;

    if (e.key === '\\') {
        createEffect("CHEAT! LVL UP", state.player.x, state.player.y - 80, '#0f0', 30);
        addXP(state.player.maxXp);
        return;
    }

    if (e.code === 'Tab') {
        e.preventDefault();
        const p = state.player;
        if (p.inventory.length <= 1) return;
        p.weaponIndex = (p.weaponIndex + 1) % p.inventory.length;
        const wepName = WEAPON_DB[p.inventory[p.weaponIndex].id].name;
        createEffect(wepName, p.x, p.y - 50, '#00d2ff', 25);
        UI.updateHUD();
        return;
    }

    if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        processCommand();
        state.currentInput = "";
        return;
    }

    if (e.key === 'Backspace') {
        state.currentInput = state.currentInput.slice(0, -1);
    } else if (/^[a-zA-Z;,]$/.test(e.key)) {
        state.currentInput += e.key.toLowerCase();
    }
});

// 啟動 UI 相關按鈕
UI.nextStageBtn.onclick = () => {
    if (state.currentStage === 3) startGame('ENDLESS');
    else startGame(state.currentStage + 1);
};
UI.restartBtn.onclick = () => startGame(state.currentStage);
UI.menuBtn.onclick = () => UI.showMainMenu();

// 啟動主選單按鈕監聽
document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.onclick = () => {
        const stage = btn.getAttribute('data-stage');
        startGame(stage);
    };
});

// 開始迴圈
requestAnimationFrame(gameLoop);