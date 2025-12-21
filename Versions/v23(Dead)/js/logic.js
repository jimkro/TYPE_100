import { state, updateMoveKey } from './state.js';
import { WORLD_W, WORLD_H, STAGE_CONFIG, WORD_LIST } from './config.js';
import { createEffect, generateWord } from './utils.js';
import * as UI from './ui.js';
import { playKillSound, switchBGM, stopBGM } from './sfx.js';

export function processCommand() {
    const { player } = state;
    const input = state.currentInput;
    let moved = false;

    // Movement
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

    // Shooting
    const target = state.enemies.find(e => e.word === input);
    if (target) {
        shoot(target);
    } else {
        createEffect("?", player.x, player.y - 50, '#555', 15);
    }
}

function shoot(target) {
    const { player } = state;
    const cur = player.inventory[player.weaponIndex];
    const isEvolved = cur.level >= 5; 

    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.hypot(dx, dy);
    const vx = (dx / dist) * 25;
    const vy = (dy / dist) * 25;

    // --- [進化] 十字弓：散射 ---
    if (cur.id === 'bow' && isEvolved) {
        const angles = [0, -0.2, 0.2]; 
        angles.forEach(angle => {
            const nvx = vx * Math.cos(angle) - vy * Math.sin(angle);
            const nvy = vx * Math.sin(angle) + vy * Math.cos(angle);
            
            state.projectiles.push({
                x: player.x, y: player.y,
                vx: nvx, vy: nvy,
                weaponId: cur.id, level: cur.level, 
                targetId: target.word, life: 80,
                isEvolved: true
            });
        });
    } 
    else {
        state.projectiles.push({
            x: player.x, y: player.y,
            vx: vx, vy: vy,
            weaponId: cur.id, level: cur.level, 
            targetId: target.word, life: 80,
            isEvolved: isEvolved,
            // [進化] 手槍：設定彈射次數
            bounceCount: (cur.id === 'gun' && isEvolved) ? 3 : 0 
        });
    }
}

function findNearestEnemy(x, y, excludeId) {
    let nearest = null;
    let minDst = Infinity;
    state.enemies.forEach(e => {
        if (e.word === excludeId || e.dead) return;
        const d = Math.hypot(e.x - x, e.y - y);
        if (d < minDst) {
            minDst = d;
            nearest = e;
        }
    });
    return (minDst < 400) ? nearest : null;
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
        x: ex, y: ey, 
        size: 60, color: '#ffd700', word: w,
        // [修正] Boss 速度減半 (0.6 -> 0.3)
        speed: 0.3 + (playerLevel * 0.025),
        burnTimer: 0, isShooter: true, shootTimer: 100,
        isBoss: true, lives: bossLives, maxLives: bossLives
    });

    createEffect("WARNING: BOSS!", player.x, player.y - 100, '#ffd700', 40);
    switchBGM('boss');
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

        if (e.isBoss) {
            const hasOtherBoss = state.enemies.some(other => other !== e && other.isBoss && !other.dead);
            if (!hasOtherBoss) switchBGM('normal');
        }
    }
}

export function updatePhysics(canvasWidth, canvasHeight) {
    const { player, enemies, projectiles, enemyProjectiles, fireZones, effects } = state;
    
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
            // [修正] 一般怪物速度減半 (0.8 -> 0.4)
            const baseSpeed = 0.4 + Math.random() * 0.25;
            const levelBonus = player.level * 0.06; 
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

    // Enemy Collision
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

    // Enemy Logic
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

        // Burn Logic
        let inFire = fireZones.some(f => Math.hypot(e.x-f.x, e.y-f.y) < f.radius);
        if (inFire) {
            e.burnTimer++;
            const burnRate = fireZones.some(f => f.isEvolved) ? 30 : 60; // 進化火燒更快
            if (e.burnTimer % burnRate === 0 && e.word.length > 0) {
                e.word = e.word.slice(0, -1);
                createEffect("..", e.x, e.y - e.size/2 - 10, '#f80', 10);
                if(e.word.length === 0) handleEnemyDeathOrPhase(e, 'molotov');
            }
        }
    });

    // Enemy Projectiles
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

    // Player Projectiles
    for(let i=projectiles.length-1; i>=0; i--) {
        let p = projectiles[i];
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.life <= 0) { projectiles.splice(i,1); continue; }

        for(let e of enemies) {
            let hitRadius = e.size + 10;
            if (Math.hypot(p.x-e.x, p.y-e.y) < hitRadius) {
                let hit = false;
                
                // Gun Logic
                if (p.weaponId === 'gun') { 
                    if (e.word === p.targetId || p.isEvolved) {
                        hit = true; 
                        handleEnemyDeathOrPhase(e, 'gun');
                        // Chain
                        if (p.bounceCount > 0) {
                            const nextTarget = findNearestEnemy(e.x, e.y, e.word);
                            if (nextTarget) {
                                p.bounceCount--;
                                p.x = e.x; p.y = e.y;
                                p.life = 60;
                                p.targetId = nextTarget.word;
                                const dx = nextTarget.x - e.x, dy = nextTarget.y - e.y;
                                const dist = Math.hypot(dx, dy);
                                p.vx = (dx/dist)*30; p.vy = (dy/dist)*30;
                                createEffect("CHAIN!", e.x, e.y - 30, '#0ff', 20);
                                hit = false; 
                            }
                        }
                    }
                }
                // Bow Logic
                else if (p.weaponId === 'bow') { 
                    hit = true; 
                    handleEnemyDeathOrPhase(e, 'bow');
                    hit = false; // Penetrate
                }
                // Explosive Logic
                else if (p.weaponId === 'grenade' || p.weaponId === 'molotov') {
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
                    // Cluster Bomb
                    if (p.weaponId === 'grenade' && p.isEvolved) {
                        for(let k=0; k<3; k++) {
                            state.fireZones.push({
                                x: p.x + (Math.random()-0.5)*100, y: p.y + (Math.random()-0.5)*100,
                                radius: 60, life: 30, isEvolved: true
                            });
                        }
                        createEffect("CLUSTER!", p.x, p.y-40, '#ff0', 30);
                    }
                    if (hitCount > 0 && p.weaponId !== 'molotov') playKillSound(p.weaponId);
                    if (p.weaponId === 'molotov') {
                        state.fireZones.push({ 
                            x: p.x, y: p.y, 
                            radius: 80 + (p.level*10) + (p.isEvolved?50:0), 
                            life: 250 + (p.level*40),
                            isEvolved: p.isEvolved
                        });
                    }
                }
                if(hit) { projectiles.splice(i,1); break; }
            }
        }
    }

    // Cleanup
    for(let i = effects.length - 1; i >= 0; i--) { let eff = effects[i]; eff.y -= 1; eff.life--; if (eff.life <= 0) effects.splice(i, 1); }
    state.enemies = enemies.filter(e => !e.dead);
    state.fireZones = fireZones.filter(z => --z.life > 0);

    if(player.hp <= 0) {
        state.gameState = 'GAMEOVER';
        stopBGM();
        UI.showGameOver();
    }
}

export function addXP(amt) {
    state.player.xp += amt;
    if (state.player.xp >= state.player.maxXp) {
        state.player.xp -= state.player.maxXp; 
        state.player.level++; 
        state.player.maxXp = Math.floor(state.player.maxXp * 1.2);
        
        // Spawn Boss every 5 levels
        if (state.player.level % 5 === 0) spawnBoss(state.player.level);

        if (state.currentStage !== 'ENDLESS' && state.player.level >= 10) {
            state.gameState = 'STAGE_CLEAR';
            stopBGM();
            UI.showStageClear();
        } else {
            UI.showUpgradeMenu();
        }
    }
    UI.updateHUD(); 
}