const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');

test('carrosséis exibem os ícones locais na ordem certa e ocultam as cópias', () => {
  const html = readFileSync('index.html', 'utf8');
  const groups = [...html.matchAll(/<ul class="tech-marquee__group"([^>]*)>([\s\S]*?)<\/ul>/g)];
  const items = group => [...group[2].matchAll(/<li><img src="([^"]+)" alt=""[^>]*><span>([^<]+)<\/span><\/li>/g)]
    .map(([, src, label]) => ({ src, label }));
  const expected = [
    ['C', 'Java', 'JavaScript', 'TypeScript', 'Python'],
    ['MySQL', 'Oracle', 'Git', 'GitHub', 'Supabase', 'Vercel', 'VS Code', 'Figma', 'Photoshop', 'Bootstrap', 'Tailwind CSS']
  ];

  assert.equal(groups.length, 4);
  for (let row = 0; row < 2; row++) {
    const original = items(groups[row * 2]);
    assert.deepEqual(original.map(item => item.label), expected[row]);
    assert.deepEqual(items(groups[row * 2 + 1]), original);
    assert.match(groups[row * 2 + 1][1], /aria-hidden="true"/);
    for (const { src } of original) assert.ok(existsSync(src), `${src} ausente`);
  }
});
