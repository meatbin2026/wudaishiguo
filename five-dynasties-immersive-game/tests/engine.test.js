const assert = require('assert');
const { applyEffects, chooseNode, serializeState, restoreState, pickEnding } = require('../engine');

const base = { reputation: 50, silver: 50 };
const out = applyEffects(base, { reputation: +10, silver: -5 });
assert.equal(out.reputation, 60);
assert.equal(out.silver, 45);

const chapter = { nodes: [{ id: 'c1.a', route: 'court' }] };
const node = chooseNode(chapter, { route: 'court', flags: {}, stats: {} });
assert.equal(node.id, 'c1.a');

const payload = serializeState({ chapter: 1 });
const restored = restoreState(payload);
assert.equal(restored.chapter, 1);

const ending = pickEnding({ route: 'court', stats: {}, flags: {} }, { endings: [{ id: 'e1', route: 'court' }] });
assert.equal(ending.id, 'e1');

console.log('engine ok');
