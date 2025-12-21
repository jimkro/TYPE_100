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

export function initAudio() {
    if (ctx.state === 'suspended') ctx.resume();
}

export function stopBGM() {
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
    currentBgmType = null;
}

export function switchBGM(type) {
    if (currentBgmType === type) return; 
    stopBGM();
    currentBgmType = type;
    noteIndex = 0;

    if (type === 'normal') {
        // 一般音樂：慢速
        bgmInterval = setInterval(() => playBassLine([110, 110, 146, 130], 0.3), 600);
    } else if (type === 'boss') {
        // Boss 音樂：快速緊張
        bgmInterval = setInterval(() => playBassLine([150, 210, 150, 220], 0.15), 333);
    }
}

function playBassLine(notes, duration) {
    if (ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const freq = notes[noteIndex % notes.length];
    noteIndex++;

    osc.type = currentBgmType === 'boss' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
}