import { state } from './state.js';

export function createEffect(text, x, y, color, size=20) {
    state.effects.push({ text, x, y, color, life: 40, size });
}

export function generateWord(stageConfig, playerLevel, wordList) {
    if (state.currentStage === 'ENDLESS') {
        let w = wordList[Math.floor(Math.random() * wordList.length)];
        if (playerLevel > 15 && Math.random() > 0.7) {
            w += wordList[Math.floor(Math.random() * wordList.length)];
        }
        return w;
    }
    
    const len = Math.floor(Math.random() * (stageConfig.maxLen - stageConfig.minLen + 1)) + stageConfig.minLen;
    let word = "";
    for(let i=0; i<len; i++) {
        word += stageConfig.chars[Math.floor(Math.random() * stageConfig.chars.length)];
    }
    return word;
}