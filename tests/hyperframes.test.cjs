const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

test('a sequência de quadros limita o progresso e permanece reversível', () => {
  const window = {
    performance: { now: () => 0 },
    setTimeout,
    clearTimeout
  };
  vm.runInNewContext(readFileSync('js/hyperframes.js', 'utf8'), { window });
  const timeline = new window.Hyperframes.FrameTimeline({ duration: 1600, fps: 60 });

  assert.equal(timeline.seek(-100).getState().progress, 0);
  assert.equal(timeline.seek(800).getState().progress, 0.5);
  assert.equal(timeline.seek(5000).getState().progress, 1);
  assert.equal(timeline.seek(400).getState().progress, 0.25);
  assert.equal(timeline.getState().frame, 24);
});
