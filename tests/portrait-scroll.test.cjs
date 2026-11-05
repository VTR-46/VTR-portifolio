const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function setup({ desktop = false, hash = '', reduced = false } = {}) {
  const events = {};
  const preloaded = [];
  const classes = () => ({ add() {}, remove() {}, toggle() {} });
  const image = { src: 'data/img/pessoa1.png' };
  const portrait = {
    style: { removeProperty() {} },
    querySelector: () => image,
    getBoundingClientRect: () => ({ top: 900 - window.scrollY })
  };
  const bio = {
    style: { removeProperty() {} },
    classList: classes(),
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ top: 1700 - window.scrollY })
  };
  const hero = {
    offsetTop: 0,
    offsetHeight: 2400,
    getBoundingClientRect: () => ({ top: -window.scrollY })
  };
  const stage = { clientWidth: 1000 };
  const lead = { style: { removeProperty() {} } };
  const desktopQuery = { matches: desktop };
  const document = {
    documentElement: { classList: classes() },
    getElementById: id => id === 'inicio' ? hero : null,
    querySelector: selector => ({
      '[data-hero-stage]': stage,
      '[data-hero="lead"]': lead,
      '[data-hero="portrait"]': portrait,
      '[data-hero="bio"]': bio,
      '#sobre': bio
    })[selector] || null,
    querySelectorAll: () => [],
    addEventListener() {}
  };
  const window = {
    innerHeight: 800,
    scrollY: 0,
    location: { hash },
    performance: { now: () => 0 },
    matchMedia: query => query.includes('900px') ? desktopQuery : { matches: query.includes('reduced-motion') && reduced },
    addEventListener(type, listener) { events[type] = listener; },
    requestAnimationFrame(callback) { callback(); },
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {},
    scrollTo({ top }) { this.scrollY = top; },
    getComputedStyle: () => ({ getPropertyValue: () => '0' }),
    Image: function () { preloaded.push(this); }
  };
  const context = { window, document };
  vm.runInNewContext(readFileSync('js/hyperframes.js', 'utf8'), context);
  context.Hyperframes = window.Hyperframes;
  vm.runInNewContext(readFileSync('js/portfolio.js', 'utf8'), context);
  return {
    image, preloaded, window,
    scrollTo(top) { window.scrollY = top; events.scroll(); },
    resizeToDesktop(value) { desktopQuery.matches = value; events.resize(); }
  };
}

test('no desktop, as fotos avançam antes de Sobre e revertem ao subir', () => {
  const page = setup({ desktop: true });
  assert.deepEqual(page.preloaded.map(image => image.src), [2, 3, 4, 5].map(n => `data/img/pessoa${n}.png`));
  for (const [top, number] of [[0, 1], [140, 2], [280, 3], [420, 4], [560, 5], [610, 1], [800, 1], [560, 5], [420, 4], [280, 3], [140, 2], [0, 1]]) {
    page.scrollTo(top);
    assert.equal(page.image.src, `data/img/pessoa${number}.png`, `scroll ${top}`);
  }
});

test('no celular, Sobre fixa pessoa1 e a subida percorre as fotos novamente', () => {
  const page = setup();
  for (const [top, number] of [[0, 1], [260, 2], [420, 3], [580, 4], [740, 5], [900, 1], [1100, 1], [740, 5], [580, 4], [420, 3], [260, 2], [0, 1]]) {
    page.scrollTo(top);
    assert.equal(page.image.src, `data/img/pessoa${number}.png`, `scroll ${top}`);
  }
});

test('abrir diretamente Sobre mantém pessoa1 no desktop e no celular', () => {
  for (const desktop of [true, false]) {
    const page = setup({ desktop, hash: '#sobre' });
    assert.equal(page.image.src, 'data/img/pessoa1.png');
    assert.ok(page.window.scrollY > 0);
  }
});

test('redimensionar recalcula a foto para o layout atual', () => {
  const page = setup();
  page.scrollTo(740);
  assert.equal(page.image.src, 'data/img/pessoa5.png');
  page.resizeToDesktop(true);
  assert.equal(page.image.src, 'data/img/pessoa1.png');
  page.resizeToDesktop(false);
  assert.equal(page.image.src, 'data/img/pessoa5.png');
});
