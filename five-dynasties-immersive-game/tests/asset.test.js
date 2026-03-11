const fs = require('fs');
const path = 'five-dynasties-immersive-game/assets/ink-scroll-bg.svg';
if (!fs.existsSync(path)) throw new Error('svg missing');
const size = fs.statSync(path).size;
if (size > 80000) throw new Error('svg too large');
console.log('asset ok');
