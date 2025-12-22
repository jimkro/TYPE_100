// js/sfx.js

const AudioContext = window.AudioContext || window.webkitAudioContext;
const ctx = new AudioContext();

// --- 音效 (SFX) 部分 ---
export function playKillSound(weaponId) {
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (weaponId === 'gun') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (weaponId === 'bow') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (weaponId === 'grenade' || weaponId === 'molotov') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (weaponId === 'player_hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}

// --- 背景音樂 (BGM) 部分 ---

let bgmInterval = null;
let currentBgmType = null;
let noteIndex = 0;

// [重要] 外部呼叫此函式來確保音效引擎啟動
export function initAudio() {
    if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("Audio resume failed:", e));
    }
}

export function stopBGM() {
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
    currentBgmType = null;
}

export function switchBGM(type) {
    // 確保在切換音樂時嘗試啟動音效環境
    initAudio();

    if (currentBgmType === type) return; 
    
    stopBGM();
    currentBgmType = type;
    noteIndex = 0;

    if (type === 'normal') {
        // 一般音樂：慢速 (100 BPM)
        // 使用 [低, 低, 高, 中] 的 Bass line
        bgmInterval = setInterval(() => playBassLine([110, 110, 146, 130], 0.3), 600);
    } else if (type === 'boss') {
        // Boss 音樂：快速 (180 BPM)
        bgmInterval = setInterval(() => playBassLine([150, 210, 150, 220], 0.15), 333);
    }
}

// 播放單個 BGM 音符
function playBassLine(notes, duration) {
    // 如果 AudioContext 還是 suspended (例如使用者還沒點擊)，就不要播放
    if (ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    // [修改 1] 將頻率從 400 提高到 1000，讓聲音更清楚，不要那麼悶
    filter.frequency.value = 1000; 

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const freq = notes[noteIndex % notes.length];
    noteIndex++;

    // [修改 2] 一般音樂改用 'square' (方波)，比 triangle 更有存在感
    // Boss 維持 'sawtooth' (鋸齒波) 比較有侵略性
    osc.type = currentBgmType === 'boss' ? 'sawtooth' : 'square';
    
    osc.frequency.setValueAtTime(freq, now);

    // [修改 3] 音量調整
    // 方波比三角波大聲，所以音量設為 0.1 (Boss 是 0.15)
    const vol = currentBgmType === 'boss' ? 0.15 : 0.1;
    
    gain.gain.setValueAtTime(vol, now); 
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
}