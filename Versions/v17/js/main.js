import { state, resetGame } from './state.js';
import { updatePhysics, processCommand } from './logic.js';
import { draw } from './renderer.js';
import * as UI from './ui.js';
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

// --- 遊戲迴圈 ---
function gameLoop() {
    if (state.gameState === 'PLAYING') {
        updatePhysics(canvas.width, canvas.height);
        UI.updateHUD(); // 確保 HUD 血條實時更新
    }
    draw(canvas, ctx);
    requestAnimationFrame(gameLoop);
}

// --- 初始化函式 ---
function startGame(stageId) {
    // 轉換 stageId: 如果是數字字串轉數字，ENDLESS 保持字串
    const stage = isNaN(stageId) ? stageId : parseInt(stageId);
    resetGame(stage);
    UI.initGameUI();
}

// --- 事件監聽 ---

// 1. 鍵盤輸入
window.addEventListener('keydown', (e) => {
    if (state.gameState === 'MENU') return;
    
    // 升級選單數字鍵
    if (state.gameState === 'PAUSED') {
        if (['1','2','3'].includes(e.key)) {
            const idx = parseInt(e.key) - 1;
            const cards = document.querySelectorAll('.card');
            if (cards[idx]) cards[idx].click();
        }
        return;
    }

    if (state.gameState === 'GAMEOVER' || state.gameState === 'STAGE_CLEAR') return;

    // 切換武器
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

    // 確認/移動
    if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        processCommand();
        state.currentInput = "";
        return;
    }

    // 打字
    if (e.key === 'Backspace') {
        state.currentInput = state.currentInput.slice(0, -1);
    } else if (/^[a-zA-Z;,]$/.test(e.key)) {
        state.currentInput += e.key.toLowerCase();
    }
});

// 2. 按鈕綁定
document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.onclick = () => startGame(btn.dataset.stage);
});

UI.nextStageBtn.onclick = () => {
    const next = state.currentStage === 3 ? 'ENDLESS' : state.currentStage + 1;
    startGame(next);
};
UI.restartBtn.onclick = () => startGame(state.currentStage);
UI.menuBtn.onclick = () => UI.showMainMenu();

// --- 啟動 ---
UI.showMainMenu();
gameLoop();