import { WORLD_W, WORLD_H, HOME_ROW } from './config.js';

export const state = {
    gameState: 'MENU', // MENU, PLAYING, PAUSED, GAMEOVER, STAGE_CLEAR
    currentStage: 1,
    currentInput: "",
    camera: { x: 0, y: 0 },
    
    player: {
        x: WORLD_W / 2, y: WORLD_H / 2, size: 30,
        hp: 100, maxHp: 100,
        xp: 0, maxXp: 100, level: 1,
        speed: 150,
        inventory: [], weaponIndex: 0,
        moveKeys: { up: '', down: '', left: '', right: '' }
    },
    
    enemies: [],
    projectiles: [],
    effects: [],
    fireZones: []
};

// 初始化移動鍵位
function initMoveKeys() {
    let pool = [...HOME_ROW].sort(() => 0.5 - Math.random());
    state.player.moveKeys.up = pool[0];
    state.player.moveKeys.down = pool[1];
    state.player.moveKeys.left = pool[2];
    state.player.moveKeys.right = pool[3];
}

export function resetGame(stage) {
    state.currentStage = stage;
    state.gameState = 'PLAYING';
    state.currentInput = "";
    
    state.player.x = WORLD_W / 2;
    state.player.y = WORLD_H / 2;
    state.player.hp = 100;
    state.player.maxHp = 100;
    state.player.xp = 0;
    state.player.maxXp = 100;
    state.player.level = 1;
    state.player.inventory = [{id: 'gun', level: 1}];
    state.player.weaponIndex = 0;
    
    initMoveKeys();

    state.enemies = [];
    state.projectiles = [];
    state.fireZones = [];
    state.effects = [];
}

export function updateMoveKey(dir) {
    const currentKeys = Object.values(state.player.moveKeys);
    const available = HOME_ROW.filter(k => !currentKeys.includes(k));
    const newKey = available[Math.floor(Math.random() * available.length)];
    state.player.moveKeys[dir] = newKey;
}