const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

test('menu móvel abre, fecha por link, Escape, toque fora e mudança de largura', () => {
  const classes = () => {
    const values = new Set();
    return {
      add: value => values.add(value),
      remove: value => values.delete(value),
      contains: value => values.has(value),
      toggle: (value, force) => {
        if (typeof force === 'boolean') {
          if (force) values.add(value); else values.delete(value);
          return force;
        }
        return values.has(value) ? (values.delete(value), false) : (values.add(value), true);
      }
    };
  };
  const events = {};
  const documentEvents = {};
  const button = {
    attributes: {},
    addEventListener(type, listener) { events[type] = listener; },
    setAttribute(name, value) { this.attributes[name] = value; },
    closest() { return null; },
    focus() { this.focused = true; }
  };
  const nav = { classList: classes() };
  const outside = { closest() { return null; } };
  const link = { closest(selector) { return selector === 'a' ? this : null; } };
  const header = { contains(target) { return target !== outside; }, classList: classes() };
  const mobile = { matches: true };
  let scrollY = 0;
  const document = {
    documentElement: { classList: classes() },
    getElementById(id) { return { 'site-header': header, 'nav-toggle': button, 'primary-nav': nav }[id] || null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener(type, listener) { (documentEvents[type] ||= []).push(listener); }
  };
  const window = {
    get scrollY() { return scrollY; },
    matchMedia(query) { return query.includes('767px') ? mobile : { matches: false }; },
    addEventListener(type, listener) { events[type] = listener; },
    setTimeout() { return 1; }, clearTimeout() {},
    location: { hash: '' }
  };
  vm.runInNewContext(readFileSync('js/portfolio.js', 'utf8'), { window, document });

  assert.equal(document.documentElement.classList.contains('nav-ready'), true);
  events.scroll();
  assert.equal(header.classList.contains('is-hidden'), true);
  scrollY = 120;
  events.scroll();
  assert.equal(header.classList.contains('is-hidden'), true);
  scrollY = 60;
  events.scroll();
  assert.equal(header.classList.contains('is-hidden'), false);
  scrollY = 0;
  events.scroll();
  assert.equal(header.classList.contains('is-hidden'), true);

  events.click();
  assert.equal(button.attributes['aria-expanded'], 'true');
  assert.equal(nav.classList.contains('is-open'), true);

  documentEvents.click.forEach(listener => listener({ target: link }));
  assert.equal(button.attributes['aria-expanded'], 'false');

  events.click();
  documentEvents.keydown.forEach(listener => listener({ key: 'Escape', preventDefault() {} }));
  assert.equal(button.focused, true);
  assert.equal(nav.classList.contains('is-open'), false);

  events.click();
  documentEvents.click.forEach(listener => listener({ target: outside }));
  assert.equal(nav.classList.contains('is-open'), false);

  events.click();
  mobile.matches = false;
  events.resize();
  assert.equal(nav.classList.contains('is-open'), false);
});
