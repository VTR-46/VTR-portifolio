const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function setup({ loaded = true, reduced = false, observerAvailable = true } = {}) {
  const classes = new Set();
  const logo = {
    complete: loaded,
    naturalWidth: loaded ? 1679 : 0,
    classList: { add: value => classes.add(value) },
    addEventListener(type, listener) { this.onload = listener; }
  };
  let observer;
  const window = {
    location: { hash: '' },
    matchMedia: query => ({ matches: query.includes('reduced-motion') && reduced }),
    addEventListener() {}
  };
  const document = {
    documentElement: { classList: { add() {}, remove() {} } },
    getElementById: () => null,
    querySelector: selector => selector === '.project__pit-logo' ? logo : null,
    querySelectorAll: () => [],
    addEventListener() {}
  };
  function IntersectionObserver(callback) {
    observer = {
      observe(target) { assert.equal(target, logo); },
      disconnect() { this.disconnected = true; },
      enter() { callback([{ isIntersecting: true }]); }
    };
    return observer;
  }
  if (observerAvailable) window.IntersectionObserver = IntersectionObserver;
  vm.runInNewContext(readFileSync('js/portfolio.js', 'utf8'), { window, document, IntersectionObserver });
  return { classes, logo, getObserver: () => observer };
}

test('logo do PitHub surge ao entrar na tela, após carregar', () => {
  const page = setup({ loaded: false });
  assert.equal(page.classes.has('reveal-armed'), false);
  page.logo.onload();
  assert.equal(page.classes.has('reveal-armed'), true);
  page.getObserver().enter();
  assert.equal(page.classes.has('is-inview'), true);
  assert.equal(page.getObserver().disconnected, true);
});

test('logo permanece visível sem animação quando movimento é reduzido ou observador indisponível', () => {
  for (const options of [{ reduced: true }, { observerAvailable: false }]) {
    const page = setup(options);
    assert.equal(page.classes.has('reveal-armed'), false);
  }
});
