import { state } from './state.js';
import { WORLD_W, WORLD_H } from './config.js';

export function draw(canvas, ctx) {
    ctx.fillStyle = '#050505'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state.gameState === 'MENU') return;

    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);

    // Grid & Border
    ctx.strokeStyle='#222'; ctx.beginPath();
    for(let i=0; i<=WORLD_W; i+=200){ ctx.moveTo(i,0); ctx.lineTo(i,WORLD_H); }
    for(let i=0; i<=WORLD_H; i+=200){ ctx.moveTo(0,i); ctx.lineTo(WORLD_W,i); }
    ctx.stroke();
    ctx.strokeStyle='#f00'; ctx.lineWidth=5; ctx.strokeRect(0,0,WORLD_W,WORLD_H);

    // Fire Zones
    state.fireZones.forEach(z => {
        if (z.isEvolved) ctx.fillStyle = `rgba(50, 100, 255, ${0.4 + Math.random()*0.3})`;
        else ctx.fillStyle = `rgba(255, 100, 0, ${0.3 + Math.random()*0.2})`;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI*2); ctx.fill();
    });

    // Enemies
    state.enemies.forEach(e => {
        if(Math.abs(e.x - state.player.x) > canvas.width && Math.abs(e.y - state.player.y) > canvas.height) return;
        
        if (e.isBoss) {
            ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 4;
            ctx.strokeRect(e.x - e.size/2 - 5, e.y - e.size/2 - 5, e.size + 10, e.size + 10);
            ctx.fillStyle = '#ffd700'; ctx.font = 'bold 14px Courier New'; ctx.textAlign = 'center';
            ctx.fillText(`LIVES: ${e.lives}`, e.x, e.y - e.size/2 - 35);
        } else if (e.isShooter) {
            ctx.strokeStyle = '#d0f'; ctx.lineWidth = 2;
            ctx.strokeRect(e.x - e.size/2 - 2, e.y - e.size/2 - 2, e.size + 4, e.size + 4);
        }

        ctx.fillStyle = e.color; 
        ctx.fillRect(e.x - e.size/2, e.y - e.size/2, e.size, e.size);
        
        ctx.fillStyle = '#fff'; 
        ctx.font = 'bold 16px Courier New'; 
        ctx.textAlign = 'center';
        ctx.fillText(e.word, e.x, e.y - e.size/2 - 10);
    });

    // Enemy Projectiles
    state.enemyProjectiles.forEach(ep => {
        if(Math.abs(ep.x - state.player.x) > canvas.width/2 + 50) return;
        ctx.fillStyle = '#ff00ff'; ctx.beginPath(); ctx.arc(ep.x, ep.y, 5, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 5; ctx.shadowColor = '#ff00ff'; ctx.fill(); ctx.shadowBlur = 0;
    });

    // Player Projectiles
    state.projectiles.forEach(p => {
        if (p.isEvolved) {
            if (p.weaponId === 'gun') ctx.fillStyle = '#0ff';
            else if (p.weaponId === 'bow') ctx.fillStyle = '#fa0';
            else ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.fill();
        }
    });

    // Player
    const p = state.player;
    ctx.fillStyle='#00d2ff'; ctx.fillRect(p.x-15, p.y-15, 30, 30);
    
    if (state.gameState === 'PLAYING') drawMoveHints(ctx, p);

    // Input Box
    ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(p.x-60, p.y-90, 120, 30);
    ctx.fillStyle='#fff'; ctx.font='20px Courier New'; ctx.textAlign='center';
    ctx.fillText(state.currentInput, p.x, p.y-68);

    // Effects
    state.effects.forEach(eff => {
        ctx.fillStyle=eff.color; ctx.font=`bold ${eff.size}px Courier New`;
        ctx.fillText(eff.text, eff.x, eff.y);
    });

    ctx.restore();
    drawMinimap(canvas, ctx);
}

function drawMoveHints(ctx, player) {
    ctx.font = 'bold 20px Courier New'; ctx.textAlign = 'center';
    const drawHint = (key, ox, oy, label) => {
        const isActive = (state.currentInput === key); 
        ctx.fillStyle = isActive ? '#fff' : 'rgba(255, 215, 0, 0.7)';
        ctx.fillText(key.toUpperCase(), player.x + ox, player.y + oy + 7);
        ctx.strokeStyle = isActive ? '#fff' : 'rgba(255, 215, 0, 0.3)'; ctx.lineWidth = 2; ctx.beginPath();
        if(label==='U') { ctx.moveTo(player.x+ox, player.y+oy-15); ctx.lineTo(player.x+ox-5, player.y+oy-8); ctx.lineTo(player.x+ox+5, player.y+oy-8); ctx.lineTo(player.x+ox, player.y+oy-15); }
        if(label==='D') { ctx.moveTo(player.x+ox, player.y+oy+18); ctx.lineTo(player.x+ox-5, player.y+oy+11); ctx.lineTo(player.x+ox+5, player.y+oy+11); ctx.lineTo(player.x+ox, player.y+oy+18); }
        if(label==='L') { ctx.moveTo(player.x+ox-18, player.y+oy); ctx.lineTo(player.x+ox-11, player.y+oy-5); ctx.lineTo(player.x+ox-11, player.y+oy+5); ctx.lineTo(player.x+ox-18, player.y+oy); }
        if(label==='R') { ctx.moveTo(player.x+ox+18, player.y+oy); ctx.lineTo(player.x+ox+11, player.y+oy-5); ctx.lineTo(player.x+ox+11, player.y+oy+5); ctx.lineTo(player.x+ox+18, player.y+oy); }
        ctx.stroke();
    };
    drawHint(state.player.moveKeys.up, 0, -50, 'U'); drawHint(state.player.moveKeys.down, 0, 50, 'D'); drawHint(state.player.moveKeys.left, -60, 0, 'L'); drawHint(state.player.moveKeys.right, 60, 0, 'R');
}

function drawMinimap(canvas, ctx) {
    if (state.gameState !== 'PLAYING') return;
    const mapSize = 150, mapPad = 20;
    const mx = canvas.width - mapSize - mapPad, my = mapPad, scale = mapSize / WORLD_W;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(mx, my, mapSize, mapSize);
    ctx.strokeStyle = '#888'; ctx.lineWidth=2; ctx.strokeRect(mx, my, mapSize, mapSize);
    ctx.fillStyle = '#f00';
    state.enemies.forEach(e => {
        if (e.isBoss) { ctx.fillStyle = '#ffd700'; ctx.fillRect(mx + e.x*scale - 2, my + e.y*scale - 2, 6, 6); } 
        else { ctx.fillStyle = '#f00'; ctx.fillRect(mx + e.x*scale, my + e.y*scale, 2, 2); }
    });
    ctx.fillStyle = '#0ff'; ctx.beginPath(); ctx.arc(mx + state.player.x*scale, my + state.player.y*scale, 3, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth=1; ctx.strokeRect(mx + state.camera.x*scale, my + state.camera.y*scale, canvas.width*scale, canvas.height*scale);
}