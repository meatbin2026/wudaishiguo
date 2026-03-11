const fs = require('fs');
const html = fs.readFileSync('five-dynasties-immersive-game/index.html', 'utf8');
const mustHave = [
  'screen-intro',
  'screen-roles',
  'screen-story',
  'screen-ending',
  'status-bar',
  'options'
];
for (const id of mustHave) {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Missing id: ${id}`);
  }
}
const css = fs.readFileSync('five-dynasties-immersive-game/styles.css', 'utf8');
if (!css.includes('ink-scroll-bg.svg')) throw new Error('svg not referenced');
console.log('structure ok');
