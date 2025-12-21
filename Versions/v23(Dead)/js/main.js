import { state, resetGame } from './state.js';
import { updatePhysics, processCommand, addXP } from './logic.js';
import { draw } from './renderer.js';
import * as UI from './ui.js';
import { WEAPON_DB } from './config.js';
import { createEffect } from './utils.js';
import { initAudio, switchBGM } from './sfx.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function gameLoop() {
    if (state.gameState === 'PLAYING') {
        updatePhysics(canvas.width, canvas.height);
        UI.updateHUD();
    }
    draw(canvas, ctx);
    requestAnimationFrame(gameLoop);
}

function startGame(stageId) {
    initAudio();
    switchBGM('normal');

    const stage = isNaN(stageId) ? stageId : parseInt(stageId);
    resetGame(stage);
    UI.initGameUI();
}

window.addEventListener('keydown', (e) => {
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

document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.onclick = () => startGame(btn.dataset.stage);
});

UI.nextStageBtn.onclick = () => {
    const next = state.currentStage === 3 ? 'ENDLESS' : state.currentStage + 1;
    startGame(next);
};
UI.restartBtn.onclick = () => startGame(state.currentStage);
UI.menuBtn.onclick = () => UI.showMainMenu();

UI.showMainMenu();
gameLoop();