import { state } from './state.js';
import { STAGE_CONFIG, WEAPON_DB } from './config.js';

// DOM Elements
const uiLayer = document.getElementById('ui-layer');
const mainMenu = document.getElementById('main-menu');
const modal = document.getElementById('modal-overlay');
const cardContainer = document.getElementById('cardContainer');
const stageDisplay = document.getElementById('stageDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const hpBar = document.getElementById('hp-bar');
const xpBar = document.getElementById('xp-bar');
const currentWeaponDisplay = document.getElementById('currentWeaponDisplay');
const inventoryList = document.getElementById('inventoryList');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');

// Buttons
export const nextStageBtn = document.getElementById('nextStageBtn');
export const restartBtn = document.getElementById('restartBtn');
export const menuBtn = document.getElementById('menuBtn');

export function showMainMenu() {
    mainMenu.style.display = 'flex';
    uiLayer.style.display = 'none';
    modal.style.display = 'none';
}

export function initGameUI() {
    mainMenu.style.display = 'none';
    uiLayer.style.display = 'flex';
    modal.style.display = 'none';
    updateHUD();
}

export function updateHUD() {
    if (state.gameState === 'MENU') return;
    
    const p = state.player;
    stageDisplay.innerText = STAGE_CONFIG[state.currentStage].name;
    levelDisplay.innerText = p.level;
    
    hpBar.style.width = Math.max(0, (p.hp / p.maxHp * 100)) + "%";
    xpBar.style.width = Math.max(0, (p.xp / p.maxXp * 100)) + "%";

    const cur = p.inventory[p.weaponIndex];
    currentWeaponDisplay.innerText = `${WEAPON_DB[cur.id].name} (Lv.${cur.level})`;
    
    inventoryList.innerHTML = '';
    p.inventory.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = `weapon-slot ${idx === p.weaponIndex ? 'active' : ''}`;
        div.innerText = `${WEAPON_DB[item.id].name.substring(0,2)} ${item.level}`;
        inventoryList.appendChild(div);
    });
}

export function showGameOver() {
    modal.style.display = 'flex';
    cardContainer.style.display = 'none';
    modalTitle.innerText = "YOU DIED";
    modalTitle.style.color = "red";
    modalDesc.innerText = `你在 ${STAGE_CONFIG[state.currentStage].name} 陣亡了。\n存活等級: ${state.player.level}`;
    
    restartBtn.style.display = 'block'; 
    menuBtn.style.display = 'block';
    nextStageBtn.style.display = 'none';
}

export function showStageClear() {
    modal.style.display = 'flex';
    cardContainer.style.display = 'none';
    modalTitle.innerText = "STAGE CLEARED!";
    modalTitle.style.color = "#0f0";
    modalDesc.innerText = `恭喜完成 ${STAGE_CONFIG[state.currentStage].name}！`;
    
    nextStageBtn.style.display = 'block'; 
    menuBtn.style.display = 'block';
    restartBtn.style.display = 'none';
}

export function showUpgradeMenu() {
    state.gameState = 'PAUSED';
    modal.style.display = 'flex';
    cardContainer.style.display = 'flex';
    cardContainer.innerHTML = '';
    modalTitle.innerText = "LEVEL UP!";
    modalTitle.style.color = "white";
    modalDesc.innerText = "選擇一項升級獎勵";
    
    restartBtn.style.display = 'none';
    menuBtn.style.display = 'none';
    nextStageBtn.style.display = 'none';
    
    const pool = ['gun', 'bow', 'grenade', 'molotov', 'heal'];
    const options = pool.sort(()=>0.5-Math.random()).slice(0,3);

    options.forEach((key, idx) => {
        const hasWep = state.player.inventory.find(i => i.id === key);
        const db = WEAPON_DB[key];
        const card = document.createElement('div');
        card.className = 'card';
        
        let tag = hasWep ? `UPGRADE` : `NEW`;
        if(key === 'heal') tag = "INSTANT";

        card.innerHTML = `<h3>${db.name}</h3><div class="level-tag">${tag}</div><p>${db.baseDesc}</p><span class="key-hint">按 [${idx+1}]</span>`;
        
        card.onclick = () => selectUpgrade(key, hasWep);
        cardContainer.appendChild(card);
    });
}

function selectUpgrade(key, hasWep) {
    if (key === 'heal') {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 50);
    } else {
        if (hasWep) hasWep.level++;
        else state.player.inventory.push({id: key, level: 1});
    }
    modal.style.display = 'none'; 
    state.gameState = 'PLAYING'; 
    updateHUD();
}