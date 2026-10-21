(function (global) {
  'use strict';

  var raf = global.requestAnimationFrame
    ? global.requestAnimationFrame.bind(global)
    : function (callback) { return global.setTimeout(function () { callback(global.performance.now()); }, 16); };

  var caf = global.cancelAnimationFrame
    ? global.cancelAnimationFrame.bind(global)
    : global.clearTimeout.bind(global);

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function easeOutCubic(value) {
    var t = clamp(value, 0, 1);
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOutCubic(value) {
    var t = clamp(value, 0, 1);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function FrameTimeline(options) {
    options = options || {};
    this.id = options.id || 'timeline';
    this.duration = Math.max(1, Number(options.duration) || 1000);
    this.fps = Math.max(1, Number(options.fps) || 60);
    this.frameStep = 1000 / this.fps;
    this.totalFrames = Math.max(1, Math.ceil(this.duration / this.frameStep));
    this.time = 0;
    this.frame = 0;
    this.progress = 0;
    this.playing = false;
    this._raf = 0;
    this._playStart = 0;
    this._playTime = 0;
    this._render = typeof options.render === 'function' ? options.render : null;
    this._subscribers = new Set();
    this._loop = this._loop.bind(this);
    this._emit();
  }

  FrameTimeline.prototype.getState = function () {
    return {
      id: this.id,
      time: this.time,
      frame: this.frame,
      totalFrames: this.totalFrames,
      duration: this.duration,
      fps: this.fps,
      progress: this.progress,
      playing: this.playing
    };
  };

  FrameTimeline.prototype.seek = function (value) {
    var nextTime = clamp(Number(value) || 0, 0, this.duration);
    this.time = nextTime;
    this.frame = Math.min(this.totalFrames - 1, Math.floor(nextTime / this.frameStep + 0.000001));
    this.progress = nextTime / this.duration;
    this._emit();
    return this;
  };

  FrameTimeline.prototype.play = function () {
    if (this.playing) {
      return this;
    }
    if (this.time >= this.duration) {
      this.seek(0);
    }
    this.playing = true;
    this._playTime = this.time;
    this._playStart = global.performance.now();
    this._raf = raf(this._loop);
    this._emit();
    return this;
  };

  FrameTimeline.prototype.pause = function () {
    if (!this.playing) {
      return this;
    }
    this.playing = false;
    if (this._raf) {
      caf(this._raf);
      this._raf = 0;
    }
    this._emit();
    return this;
  };

  FrameTimeline.prototype.toggle = function () {
    return this.playing ? this.pause() : this.play();
  };

  FrameTimeline.prototype._loop = function (now) {
    if (!this.playing) {
      return;
    }
    var nextTime = this._playTime + (now - this._playStart);
    if (nextTime >= this.duration) {
      this.playing = false;
      this._raf = 0;
      this.seek(this.duration);
      return;
    }
    this.seek(nextTime);
    if (this.playing) {
      this._raf = raf(this._loop);
    }
  };

  FrameTimeline.prototype.onUpdate = function (callback) {
    var list = this._subscribers;
    list.add(callback);
    callback(this.getState());
    return function () { list.delete(callback); };
  };

  FrameTimeline.prototype._emit = function () {
    var state = this.getState();
    if (this._render) {
      this._render(state);
    }
    this._subscribers.forEach(function (callback) {
      callback(state);
    });
  };

  global.Hyperframes = {
    FrameTimeline: FrameTimeline,
    clamp: clamp,
    easeOutCubic: easeOutCubic,
    easeInOutCubic: easeInOutCubic
  };
}(window));
