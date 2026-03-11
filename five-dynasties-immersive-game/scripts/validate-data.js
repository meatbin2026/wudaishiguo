const data = require('../data');

if (!data.roles || data.roles.length !== 18) throw new Error('roles count');
if (!data.chapters || data.chapters.length !== 10) throw new Error('chapters count');

for (const r of data.roles) {
  if (!r.id || !r.name || !r.route) throw new Error('role schema');
}

const routes = ['military', 'court', 'fiscal', 'scholar'];
for (const ch of data.chapters) {
  for (const rt of routes) {
    if (!ch.nodes.some((n) => n.route === rt)) throw new Error('missing route node');
  }
  for (const n of ch.nodes) {
    if (!n.options || n.options.length < 2) throw new Error('options count');
  }
}

console.log('data ok');
