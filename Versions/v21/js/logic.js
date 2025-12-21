import { state, updateMoveKey } from './state.js';
import { WORLD_W, WORLD_H, STAGE_CONFIG, WORD_LIST } from './config.js';
import { createEffect, generateWord } from './utils.js';
import * as UI from './ui.js';
import { playKillSound, switchBGM, stopBGM } from './sfx.js'; // [修改] 匯入 BGM 相關函式

export function processCommand() {
    const { player } = state;
    const input = state.currentInput;
    let moved = false;

    // Movement Logic
    if (input === player.moveKeys.up) {
        player.y = Math.max(0, player.y - player.speed);
        updateMoveKey('up'); moved = true;
    } else if (input === player.moveKeys.down) {
        player.y = Math.min(WORLD_H - player.size, player.y + player.speed);
        updateMoveKey('down'); moved = true;
    } else if (input === player.moveKeys.left) {
        player.x = Math.max(0, player.x - player.speed);
        updateMoveKey('left'); moved = true;
    } else if (input === player.moveKeys.right) {
        player.x = Math.min(WORLD_W - player.size, player.x + player.speed);
        updateMoveKey('right'); moved = true;
    }

    if (moved) return;

    // Shooting Logic
    const target = state.enemies.find(e => e.word === input);
    if (target) {
        shoot(target);
    } else {
        createEffect("?", player.x, player.y - 50, '#555', 15);
    }
}

function shoot(target) {
    const { player } = state;
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.hypot(dx, dy);
    const cur = player.inventory[player.weaponIndex];
    
    state.projectiles.push({
        x: player.x, y: player.y,
        vx: (dx/dist)*25, vy: (dy/dist)*25,
        weaponId: cur.id, level: cur.level, targetId: target.word, life: 80
    });
}

function spawnBoss(playerLevel) {
    const { player } = state;
    let ex, ey, d;
    do { 
        ex = Math.random() * WORLD_W; 
        ey = Math.random() * WORLD_H; 
        d = Math.hypot(ex - player.x, ey - player.y); 
    } while(d < 800);

    let w = generateWord(STAGE_CONFIG[state.currentStage], playerLevel, WORD_LIST);
    if (state.currentStage === 'ENDLESS') w += generateWord(STAGE_CONFIG[state.currentStage], playerLevel, WORD_LIST);

    const bossLives = Math.floor(playerLevel / 5);

    state.enemies.push({
        x: ex, y: ey, size: 60, color: '#ffd700', word: w,
        speed: 0.6 + (playerLevel * 0.05),
        burnTimer: 0, isShooter: true, shootTimer: 100,
        isBoss: true, lives: bossLives, maxLives: bossLives
    });

    createEffect("WARNING: BOSS!", player.x, player.y - 100, '#ffd700', 40);
    switchBGM('boss'); // [新增] 切換為 Boss 音樂
}

function handleEnemyDeathOrPhase(e, weaponId) {
    if (e.isBoss && e.lives > 1) {
        e.lives--;
        e.word = generateWord(STAGE_CONFIG[state.currentStage], state.player.level, WORD_LIST);
        if (state.currentStage === 'ENDLESS') e.word += generateWord(STAGE_CONFIG[state.currentStage], state.player.level, WORD_LIST);
        createEffect("NEXT PHASE!", e.x, e.y - 50, '#fff', 25);
        playKillSound('gun');
        e.burnTimer = 0;
    } else {
        e.dead = true;
        const xpReward = e.isBoss ? 200 * e.maxLives : 20;
        createEffect(e.isBoss ? "BOSS CLEARED!" : "KILL", e.x, e.y, '#ff0');
        playKillSound(weaponId || 'gun');
        addXP(xpReward);

        // [新增] 如果 Boss 死了，檢查場上是否還有其他 Boss，沒有的話切回一般音樂
        if (e.isBoss) {
            const hasOtherBoss = state.enemies.some(other => other !== e && other.isBoss && !other.dead);
            if (!hasOtherBoss) {
                switchBGM('normal');
            }
        }
    }
}

export function updatePhysics(canvasWidth, canvasHeight) {
    const { player, enemies, projectiles, enemyProjectiles, fireZones, effects } = state;
    
    state.camera.x = Math.max(0, Math.min(player.x - canvasWidth/2, WORLD_W - canvasWidth));
    state.camera.y = Math.max(0, Math.min(player.y - canvasHeight/2, WORLD_H - canvasHeight));

    if (Math.random() < 0.02) {
        let ex, ey, d;
        do { 
            ex = Math.random() * WORLD_W; 
            ey = Math.random() * WORLD_H; 
            d = Math.hypot(ex - player.x, ey - player.y); 
        } while(d < 600);
        
        const w = generateWord(STAGE_CONFIG[state.currentStage], player.level, WORD_LIST);
        if (w) {
            const baseSpeed = 0.8 + Math.random() * 0.5;
            const levelBonus = player.level * 0.12; 
            const isShooter = Math.random() < 0.2;

            enemies.push({ 
                x: ex, y: ey, size: 25, 
                color: isShooter ? '#d0f' : '#ff3333', 
                word: w, 
                speed: baseSpeed + levelBonus, 
                burnTimer: 0,
                isShooter: isShooter,
                shootTimer: Math.random() * 200
            });
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        let e1 = enemies[i];
        for (let j = i + 1; j < enemies.length; j++) {
            let e2 = enemies[j];
            let dx = e1.x - e2.x, dy = e1.y - e2.y;
            let dist = Math.hypot(dx, dy);
            let minDist = (e1.size/2 + e2.size/2) + 15; 
            if (dist < minDist && dist > 0) {
                let force = (minDist - dist) / minDist; 
                e1.x += (dx/dist)*force*1.5; e1.y += (dy/dist)*force*1.5;
                e2.x -= (dx/dist)*force*1.5; e2.y -= (dy/dist)*force*1.5;
            }
        }
    }

    enemies.forEach(e => {
        const dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx,dy);
        const onScreen = e.x >= state.camera.x && e.x <= state.camera.x + canvasWidth &&
                         e.y >= state.camera.y && e.y <= state.camera.y + canvasHeight;
        let shouldMove = true;

        if (e.isShooter && onScreen) {
            shouldMove = false; 
            e.shootTimer--;
            if (e.shootTimer <= 0) {
                state.enemyProjectiles.push({
                    x: e.x, y: e.y,
                    vx: (dx/dist) * 1.2,
                    vy: (dy/dist) * 1.2,
                    life: 600
                });
                e.shootTimer = e.isBoss ? 150 : 240;
            }
        }

        if (shouldMove && dist > 0) {
            e.x += (dx/dist) * e.speed;
            e.y += (dy/dist) * e.speed;
        }

        if(dist < player.size + e.size/2) player.hp -= 0.15;

        let inFire = fireZones.some(f => Math.hypot(e.x-f.x, e.y-f.y) < f.radius);
        if (inFire) {
            e.burnTimer++;
            if (e.burnTimer % 60 === 0 && e.word.length > 0) {
                e.word = e.word.slice(0, -1);
                createEffect("..", e.x, e.y - e.size/2 - 10, '#f80', 10);
                if(e.word.length === 0) {
                    handleEnemyDeathOrPhase(e, 'molotov');
                }
            }
        }
    });

    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        let ep = enemyProjectiles[i];
        ep.x += ep.vx; ep.y += ep.vy; ep.life--;
        if (ep.life <= 0) { enemyProjectiles.splice(i, 1); continue; }
        if (Math.hypot(ep.x - player.x, ep.y - player.y) < 20) {
            player.hp -= 10;
            createEffect("-10", player.x, player.y - 20, '#f00', 20);
            playKillSound('player_hit');
            enemyProjectiles.splice(i, 1);
        }
    }

    for(let i=projectiles.length-1; i>=0; i--) {
        let p = projectiles[i];
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.life <= 0) { projectiles.splice(i,1); continue; }
        for(let e of enemies) {
            let hitRadius = e.size + 5;
            if (Math.hypot(p.x-e.x, p.y-e.y) < hitRadius) {
                let hit = false;
                if (p.weaponId === 'gun' && e.word === p.targetId) { 
                    hit = true; handleEnemyDeathOrPhase(e, 'gun');
                } else if (p.weaponId === 'bow') { 
                    hit = true; handleEnemyDeathOrPhase(e, 'bow');
                } else if (p.weaponId === 'grenade' || p.weaponId === 'molotov') {
                    const radius = 120 + (p.level * 20);
                    const cutChars = 2 + Math.floor(p.level/3);
                    let hitCount = 0;
                    enemies.forEach(sub => {
                        if(Math.hypot(sub.x-p.x, sub.y-p.y) < radius) {
                            sub.word = sub.word.slice(0, -cutChars);
                            hitCount++;
                            if(sub.word.length === 0) handleEnemyDeathOrPhase(sub, p.weaponId);
                        }
                    });
                    hit = true;
                    if (hitCount > 0 && p.weaponId !== 'molotov') playKillSound(p.weaponId);
                    if (p.weaponId === 'molotov') state.fireZones.push({ x: p.x, y: p.y, radius: 80 + (p.level*10), life: 250 + (p.level*40) });
                }
                if(hit && p.weaponId !== 'bow') { projectiles.splice(i,1); break; }
            }
        }
    }

    for(let i = effects.length - 1; i >= 0; i--) {
        let eff = effects[i]; eff.y -= 1; eff.life--;
        if (eff.life <= 0) effects.splice(i, 1);
    }

    state.enemies = enemies.filter(e => !e.dead);
    state.fireZones = fireZones.filter(z => --z.life > 0);

    if(player.hp <= 0) {
        state.gameState = 'GAMEOVER';
        stopBGM(); // [新增] 遊戲結束停止音樂
        UI.showGameOver();
    }
}

export function addXP(amt) {
    state.player.xp += amt;
    if (state.player.xp >= state.player.maxXp) {
        state.player.xp -= state.player.maxXp; 
        state.player.level++; 
        state.player.maxXp = Math.floor(state.player.maxXp * 1.2);
        
        if (state.player.level % 5 === 0) spawnBoss(state.player.level);

        if (state.currentStage !== 'ENDLESS' && state.player.level >= 10) {
            state.gameState = 'STAGE_CLEAR';
            stopBGM(); // [新增] 過關停止音樂
            UI.showStageClear();
        } else {
            UI.showUpgradeMenu();
        }
    }
    UI.updateHUD(); 
}