import { state, updateMoveKey } from './state.js';
import { WORLD_W, WORLD_H, STAGE_CONFIG, WORD_LIST } from './config.js';
import { createEffect, generateWord } from './utils.js';
import * as UI from './ui.js';
import { playKillSound } from './sfx.js'; // [新增] 匯入音效模組

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

export function updatePhysics(canvasWidth, canvasHeight) {
    const { player, enemies, projectiles, enemyProjectiles, fireZones, effects } = state;
    
    // Camera Update
    state.camera.x = Math.max(0, Math.min(player.x - canvasWidth/2, WORLD_W - canvasWidth));
    state.camera.y = Math.max(0, Math.min(player.y - canvasHeight/2, WORLD_H - canvasHeight));

    // Spawning
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
            
            // 20% 機率生成射擊怪 (紫色)
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

    // Enemy Collision (Anti-stacking)
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

    // Enemy Logic (Movement & Shooting)
    enemies.forEach(e => {
        const dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx,dy);
        
        // 判定是否在畫面內
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
                e.shootTimer = 240; 
            }
        }

        if (shouldMove && dist > 0) {
            e.x += (dx/dist) * e.speed;
            e.y += (dy/dist) * e.speed;
        }

        if(dist < player.size) player.hp -= 0.15;

        // Burn Effect
        let inFire = fireZones.some(f => Math.hypot(e.x-f.x, e.y-f.y) < f.radius);
        if (inFire) {
            e.burnTimer++;
            if (e.burnTimer % 60 === 0 && e.word.length > 0) {
                e.word = e.word.slice(0, -1);
                createEffect("..", e.x, e.y-10, '#f80', 10);
                if(e.word.length === 0) {
                    e.dead = true; 
                    playKillSound('molotov'); // [新增] 燒死音效
                }
            }
        }
    });

    // Enemy Projectiles
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        let ep = enemyProjectiles[i];
        ep.x += ep.vx; 
        ep.y += ep.vy; 
        ep.life--;

        if (ep.life <= 0) {
            enemyProjectiles.splice(i, 1);
            continue;
        }

        const distToPlayer = Math.hypot(ep.x - player.x, ep.y - player.y);
        if (distToPlayer < 20) {
            player.hp -= 10;
            createEffect("-10", player.x, player.y - 20, '#f00', 20);
            playKillSound('player_hit'); // [新增] 玩家被打到的音效
            enemyProjectiles.splice(i, 1);
        }
    }

    // Player Projectiles
    for(let i=projectiles.length-1; i>=0; i--) {
        let p = projectiles[i];
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.life <= 0) { projectiles.splice(i,1); continue; }

        for(let e of enemies) {
            let hitRadius = e.size + 5;
            if (Math.hypot(p.x-e.x, p.y-e.y) < hitRadius) {
                let hit = false;
                
                // [新增] 播放音效邏輯
                if (p.weaponId === 'gun' && e.word === p.targetId) { 
                    e.dead = true; 
                    hit = true; 
                    playKillSound('gun'); // [新增] 槍聲
                }
                else if (p.weaponId === 'bow') { 
                    e.dead = true; 
                    hit = true; 
                    addXP(5); 
                    playKillSound('bow'); // [新增] 弓箭聲
                }
                else if (p.weaponId === 'grenade' || p.weaponId === 'molotov') {
                    const radius = 120 + (p.level * 20);
                    const cutChars = 2 + Math.floor(p.level/3);
                    let hitCount = 0; // 簡單統計
                    enemies.forEach(sub => {
                        if(Math.hypot(sub.x-p.x, sub.y-p.y) < radius) {
                            sub.word = sub.word.slice(0, -cutChars);
                            hitCount++;
                            if(sub.word.length === 0) { sub.dead=true; addXP(10); }
                        }
                    });
                    hit = true;
                    if (hitCount > 0) playKillSound(p.weaponId); // [新增] 爆炸/燃燒聲
                    
                    if (p.weaponId === 'molotov') {
                        state.fireZones.push({ x: p.x, y: p.y, radius: 80 + (p.level*10), life: 250 + (p.level*40) });
                    }
                }
                if(hit && p.weaponId !== 'bow') { projectiles.splice(i,1); break; }
            }
        }
    }

    // Update Effects
    for(let i = effects.length - 1; i >= 0; i--) {
        let eff = effects[i];
        eff.y -= 1;
        eff.life--;
        if (eff.life <= 0) {
            effects.splice(i, 1);
        }
    }

    // Cleanup & Events
    state.fireZones = fireZones.filter(z => --z.life > 0);
    const dead = enemies.filter(e => e.dead);
    if(dead.length > 0) {
        dead.forEach(e => { createEffect("KILL", e.x, e.y, '#ff0'); addXP(20); });
        state.enemies = enemies.filter(e => !e.dead);
    }

    if(player.hp <= 0) {
        state.gameState = 'GAMEOVER';
        UI.showGameOver();
    }
}

export function addXP(amt) {
    state.player.xp += amt;
    if (state.player.xp >= state.player.maxXp) {
        state.player.xp -= state.player.maxXp; 
        state.player.level++; 
        state.player.maxXp = Math.floor(state.player.maxXp * 1.2);
        
        if (state.currentStage !== 'ENDLESS' && state.player.level >= 10) {
            state.gameState = 'STAGE_CLEAR';
            UI.showStageClear();
        } else {
            UI.showUpgradeMenu();
        }
    }
    UI.updateHUD(); 
}