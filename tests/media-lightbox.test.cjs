const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

test('mídias ampliam e o controle do vídeo some após 500 ms de reprodução', () => {
  const events = () => ({
    addEventListener(type, listener) { (this.listeners ||= {})[type] = listener; }
  });
  const classes = { add(value) { this[value] = true; }, contains(value) { return !!this[value]; } };
  const image = { tagName: 'IMG', src: 'foto.png', alt: 'Foto', getAttribute() { return null; } };
  const video = { tagName: 'VIDEO', src: 'filme.mp4', controls: true, pause() { this.paused = true; }, getAttribute() { return 'Vídeo'; } };
  const slot = media => ({
    ...events(), classList: { add(value) { this[value] = true; }, contains: () => true },
    querySelector: () => media,
    setAttribute(name, value) { (this.attributes ||= {})[name] = value; },
    focus() { this.focused = true; }
  });
  const imageSlot = slot(image);
  const videoSlot = slot(video);
  const content = { replaceChildren(...children) { this.children = children; } };
  const dialog = {
    ...events(), showModal() { this.open = true; },
    close() { this.open = false; this.listeners.close(); }
  };
  const close = events();
  let hideTimer = null;
  const document = {
    documentElement: { classList: classes },
    getElementById(id) { return { 'media-dialog': dialog, 'media-dialog-content': content, 'media-dialog-close': close }[id] || null; },
    querySelector() { return null; },
    querySelectorAll(selector) { return selector === '.projects .media-slot.has-media' ? [imageSlot, videoSlot] : []; },
    createElement(tag) {
      return {
        ...events(), tagName: tag.toUpperCase(), paused: true,
        classList: {
          add(name) { this[name] = true; },
          remove(name) { this[name] = false; },
          toggle(name, active) { this[name] = active; }
        },
        setAttribute(name, value) { this[name] = value; },
        append(...children) { this.children = children; },
        play() { this.paused = false; this.listeners.play(); },
        pause() { this.paused = true; this.listeners.pause(); }
      };
    },
    addEventListener() {}
  };
  const window = {
    matchMedia: () => ({ matches: false }),
    addEventListener() {}, location: { hash: '' },
    setTimeout(callback, delay) { assert.equal(delay, 500); hideTimer = callback; return 1; },
    clearTimeout() { hideTimer = null; }
  };
  vm.runInNewContext(readFileSync('js/portfolio.js', 'utf8'), { document, window });

  assert.equal(classes['media-ready'], true);
  assert.equal(video.controls, false);
  imageSlot.listeners.click();
  assert.equal(dialog.open, true);
  assert.equal(content.children[0].src, 'foto.png');
  assert.equal(content.children[0].alt, 'Foto');
  close.listeners.click();
  assert.equal(content.children.length, 0);
  assert.equal(imageSlot.focused, true);

  let prevented = false;
  videoSlot.listeners.keydown({ key: 'Enter', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(video.paused, true);
  assert.equal(videoSlot.classList['has-video'], true);
  const [enlarged, playButton] = content.children[0].children;
  assert.equal(enlarged.src, 'filme.mp4');
  assert.equal(enlarged.controls, true);
  assert.equal(enlarged.paused, false);
  assert.equal(playButton['aria-label'], 'Pausar vídeo');
  hideTimer();
  assert.equal(playButton.classList['is-hidden'], true);
  content.children[0].listeners.pointermove();
  assert.equal(playButton.classList['is-hidden'], false);
  hideTimer();
  enlarged.listeners.click();
  assert.equal(playButton.classList['is-hidden'], false);
  playButton.listeners.click();
  assert.equal(enlarged.paused, true);
  assert.equal(playButton['aria-label'], 'Reproduzir vídeo');
  assert.equal(hideTimer, null);
  playButton.listeners.click();
  assert.equal(enlarged.paused, false);
  dialog.listeners.click({ target: dialog });
  assert.equal(dialog.open, false);
  assert.equal(hideTimer, null);
  assert.equal(videoSlot.focused, true);
});
