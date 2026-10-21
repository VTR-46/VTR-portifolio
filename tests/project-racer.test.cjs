const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

test('carro revela o banner junto à traseira e reverte com a rolagem', () => {
  const classes = new Set();
  const racer = {
    clientWidth: 1000,
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value)
    },
    style: { setProperty(name, value) { this[name] = value; } },
    getBoundingClientRect: () => ({ top })
  };
  const car = { clientWidth: 400, style: {} };
  const events = {};
  const reduced = { matches: false, addEventListener(type, listener) { events.reduced = listener; } };
  let top = 680;
  const document = {
    documentElement: { classList: { add() {}, remove() {} } },
    getElementById: () => null,
    querySelector: selector => ({ '.project__racer': racer, '.project__racer-car': car })[selector] || null,
    querySelectorAll: () => [],
    addEventListener() {}
  };
  const window = {
    innerHeight: 800,
    scrollY: 0,
    location: { hash: '' },
    matchMedia: query => query.includes('reduced-motion') ? reduced : { matches: false },
    addEventListener(type, listener) { events[type] = listener; },
    requestAnimationFrame(callback) { callback(); }
  };
  vm.runInNewContext(readFileSync('js/portfolio.js', 'utf8'), { window, document });

  assert.equal(car.style.transform, 'translate3d(1000px, 0, 0)');
  assert.equal(racer.style['--reveal-left'], '1000px');
  top = 340;
  events.scroll();
  assert.equal(car.style.transform, 'translate3d(300px, 0, 0)');
  assert.equal(racer.style['--reveal-left'], '700px');
  top = 0;
  events.scroll();
  assert.equal(car.style.transform, 'translate3d(-400px, 0, 0)');
  assert.equal(racer.style['--reveal-left'], '0px');
  top = 340;
  events.scroll();
  assert.equal(racer.style['--reveal-left'], '700px');
  reduced.matches = true;
  events.reduced({ matches: true });
  assert.equal(classes.has('is-active'), false);
});
