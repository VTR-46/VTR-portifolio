(function () {
  'use strict';

  var PROJECT = {
    title: 'Próximo projeto',
    description: 'O primeiro estudo de caso está sendo preparado. Vídeo, imagens e repositório serão publicados aqui quando estiverem prontos.',
    video: '',
    images: [
      { src: '', alt: '' },
      { src: '', alt: '' },
      { src: '', alt: '' },
      { src: '', alt: '' }
    ],
    repository: ''
  };

  var root = document.documentElement;
  var reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktopQuery = window.matchMedia('(min-width: 900px)');
  var mobileNavQuery = window.matchMedia('(max-width: 767px)');
  var reduced = reducedQuery.matches;

  var header = document.getElementById('site-header');
  var navToggle = document.getElementById('nav-toggle');
  var siteNav = document.getElementById('primary-nav');
  var hero = document.getElementById('inicio');
  var stage = document.querySelector('[data-hero-stage]');
  var lead = document.querySelector('[data-hero="lead"]');
  var portrait = document.querySelector('[data-hero="portrait"]');
  var bio = document.querySelector('[data-hero="bio"]');
  var ghost = document.querySelector('.hero__ghost');
  var track = document.querySelector('.hero__track');
  var accentTrack = document.querySelector('.hero__track-accent');
  var portraitLine = document.querySelector('.hero__portrait-line');
  var caption = document.querySelector('.hero__caption');
  var cue = document.querySelector('.hero__cue');
  var intro = document.getElementById('intro');
  var introTrace = document.querySelector('.intro__trace');
  var introFill = document.querySelector('.intro__fill');
  var introProgress = document.getElementById('intro-progress');
  var introSkip = document.getElementById('intro-skip');

  var introTimeline = null;
  var heroTimeline = null;
  var introEnded = false;
  var introTimer = 0;
  var heroScheduled = false;
  var heroShift = 0;
  var mobileObserver = null;
  var mobileRevealTimer = 0;
  var resizeTimer = 0;
  var lastScrollY = 0;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function isDesktopScene() {
    return !reduced && desktopQuery.matches;
  }

  function setHeaderState() {
    var scrollY = Math.max(0, window.scrollY || 0);
    var atTop = scrollY <= 10;
    var scrollingDown = scrollY > lastScrollY;

    if (header) {
      header.classList.toggle('is-scrolled', !atTop);
      header.classList.toggle('is-hidden', atTop || scrollingDown);
    }
    if (scrollY !== lastScrollY) {
      lastScrollY = scrollY;
    }
  }

  function closeNav(restoreFocus) {
    siteNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) navToggle.focus();
  }

  function initNav() {
    if (!header || !navToggle || !siteNav) return;
    navToggle.addEventListener('click', function () {
      var open = siteNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (event) {
      if (siteNav.classList.contains('is-open') &&
          (!header.contains(event.target) || event.target.closest('a'))) closeNav(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && siteNav.classList.contains('is-open')) {
        closeNav(true);
        event.preventDefault();
      }
    });
    root.classList.add('nav-ready');
  }

  function normalizeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) {
      return '';
    }
    try {
      var url = new URL(value.trim(), window.location.href);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.href;
      }
    } catch (error) {
      return '';
    }
    return '';
  }

  function createPlaceholder(slot, kind, index) {
    var isVideo = kind === 'video';
    var number = String(index).padStart(2, '0');
    var indexNode = document.createElement('span');
    var labelNode = document.createElement('span');
    var rule = isVideo ? document.createElement('span') : null;

    indexNode.className = 'media-slot__index';
    indexNode.setAttribute('aria-hidden', 'true');
    indexNode.textContent = isVideo ? '01' : number;

    labelNode.className = 'media-slot__label';
    labelNode.setAttribute('aria-hidden', 'true');
    labelNode.textContent = isVideo ? 'Vídeo em breve' : 'Imagem ' + number;

    slot.classList.remove('has-media');
    slot.setAttribute('role', 'img');
    slot.setAttribute('aria-label', isVideo ? 'Vídeo do projeto em breve' : 'Imagem ' + number + ' do projeto em breve');
    slot.replaceChildren(indexNode, labelNode);

    if (rule) {
      rule.className = 'media-slot__rule';
      rule.setAttribute('aria-hidden', 'true');
      slot.appendChild(rule);
    }
  }

  function mountVideo(slot, src) {
    if (!slot || !src) {
      return;
    }
    var video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = src;
    video.setAttribute('controls', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('preload', 'metadata');
    video.setAttribute('aria-label', 'Vídeo do projeto');
    video.addEventListener('error', function () {
      createPlaceholder(slot, 'video', 1);
    }, { once: true });
    slot.classList.add('has-media');
    slot.removeAttribute('role');
    slot.removeAttribute('aria-label');
    slot.replaceChildren(video);
  }

  function mountImage(slot, image, index) {
    if (!slot || !image || !image.src) {
      return;
    }
    var number = String(index).padStart(2, '0');
    var img = document.createElement('img');
    img.src = image.src;
    img.alt = typeof image.alt === 'string' && image.alt.trim() ? image.alt.trim() : 'Imagem ' + number + ' do projeto';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', function () {
      createPlaceholder(slot, 'image', index);
    }, { once: true });
    slot.classList.add('has-media');
    slot.removeAttribute('role');
    slot.removeAttribute('aria-label');
    slot.replaceChildren(img);
  }

  function mountRepository(node, value) {
    if (!node) {
      return;
    }
    var url = normalizeUrl(value);
    node.replaceChildren();
    if (!url) {
      node.textContent = 'Repositório ainda não publicado';
      return;
    }
    var link = document.createElement('a');
    var arrow = document.createElement('span');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Ver repositório';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    link.appendChild(document.createTextNode(' '));
    link.appendChild(arrow);
    node.appendChild(link);
  }

  function renderProject(project) {
    var title = document.getElementById('project-title');
    var description = document.getElementById('project-description');
    var status = document.getElementById('project-status');
    var repository = document.getElementById('project-repository');
    var videoSlot = document.getElementById('project-video');
    var imageContainer = document.getElementById('project-images');

    if (title && typeof project.title === 'string' && project.title.trim()) {
      title.textContent = project.title.trim();
    }
    if (description && typeof project.description === 'string' && project.description.trim()) {
      description.textContent = project.description.trim();
    }
    if (status) {
      status.textContent = project.video && Array.isArray(project.images) && project.images.length === 4 &&
        project.images.every(function (image) { return image && image.src; }) && normalizeUrl(project.repository)
        ? 'Publicado' : 'Em preparação';
    }

    if (videoSlot && typeof project.video === 'string' && project.video.trim()) {
      mountVideo(videoSlot, project.video.trim());
    }

    if (imageContainer) {
      var slots = Array.prototype.slice.call(imageContainer.children);
      slots.slice(0, 4).forEach(function (slot, index) {
        var image = Array.isArray(project.images) ? project.images[index] : null;
        if (image && typeof image.src === 'string' && image.src.trim()) {
          mountImage(slot, { src: image.src.trim(), alt: image.alt }, index + 1);
        }
      });
    }

    mountRepository(repository, project.repository);
  }

  function renderIntro(state) {
    if (!intro) {
      return;
    }
    var time = state.time;
    var trace = clamp(time / 880, 0, 1);
    var fill = clamp((time - 860) / 320, 0, 1);
    var traceFade = clamp((time - 1180) / 300, 0, 1);
    var fadeOut = clamp((time - 1600) / 400, 0, 1);

    if (introTrace) {
      introTrace.style.strokeDashoffset = String(1 - Hyperframes.easeOutCubic(trace));
      introTrace.style.opacity = String(1 - traceFade * 0.72);
    }
    if (introFill) {
      introFill.style.opacity = String(fill);
    }
    if (introProgress) {
      introProgress.style.width = String(state.progress * 100) + '%';
    }
    if (!intro.classList.contains('is-leaving')) {
      intro.style.opacity = String(1 - fadeOut);
    }
    if (state.progress >= 1) {
      endIntro(true);
    }
  }

  function endIntro(immediate) {
    if (!intro || introEnded) {
      return;
    }
    introEnded = true;
    window.clearTimeout(introTimer);
    document.removeEventListener('keydown', onIntroKey);
    if (introTimeline) {
      introTimeline.pause();
    }
    intro.classList.add('is-leaving');
    intro.style.opacity = '0';
    document.body.classList.remove('intro-active');

    function hide() {
      intro.hidden = true;
      intro.classList.remove('is-leaving');
      intro.style.removeProperty('opacity');
    }

    if (immediate || reduced) {
      hide();
    } else {
      introTimer = window.setTimeout(hide, 380);
    }
  }

  function onIntroKey(event) {
    if (event.key === 'Escape') {
      endIntro(false);
    }
  }

  function initIntro() {
    if (!intro || !introTrace || !introFill) {
      introEnded = true;
      return;
    }
    if (reduced) {
      intro.hidden = true;
      introEnded = true;
      return;
    }

    intro.hidden = false;
    document.body.classList.add('intro-active');
    introTimeline = new Hyperframes.FrameTimeline({
      id: 'intro',
      duration: 2000,
      fps: 60,
      render: renderIntro
    });
    introTimeline.play();

    if (introSkip) {
      introSkip.addEventListener('click', function () {
        endIntro(false);
      });
    }
    document.addEventListener('keydown', onIntroKey);
    introTimer = window.setTimeout(function () {
      endIntro(false);
    }, 3400);
  }

  function measureHero() {
    if (!stage) {
      return;
    }
    heroShift = stage.clientWidth * 0.255;
  }

  function renderHero(progress) {
    if (!isDesktopScene() || !stage || !lead || !portrait || !bio) {
      return;
    }

    var p = clamp(progress, 0, 1);
    var moveRaw = clamp((p - 0.06) / 0.66, 0, 1);
    var move = Hyperframes.easeInOutCubic(moveRaw);
    var leadRaw = clamp((p - 0.02) / 0.36, 0, 1);
    var leadOut = Hyperframes.easeOutCubic(leadRaw);
    var bioRaw = clamp((p - 0.38) / 0.42, 0, 1);
    var bioIn = Hyperframes.easeOutCubic(bioRaw);
    var portraitShift = heroShift * move;
    var portraitScale = 1 - 0.05 * move;

    portrait.style.transform = 'translate3d(calc(-50% + ' + portraitShift.toFixed(2) + 'px), 0, 0) scale(' + portraitScale.toFixed(4) + ')';
    lead.style.opacity = String(1 - leadOut);
    lead.style.transform = 'translate3d(0, ' + (-18 * leadOut).toFixed(2) + 'px, 0)';
    bio.style.opacity = String(bioIn);
    bio.style.transform = 'translate3d(0, calc(-50% + ' + (22 * (1 - bioIn)).toFixed(2) + 'px), 0)';
    bio.classList.toggle('is-active', bioIn > 0.45);

    if (portraitLine) {
      portraitLine.style.transform = 'scaleX(' + (0.14 + 0.86 * move).toFixed(4) + ')';
    }
    if (caption) {
      caption.style.opacity = String(0.4 + 0.6 * move);
    }
    if (ghost) {
      ghost.style.transform = 'translate3d(' + (-18 * p).toFixed(2) + 'px, ' + (-16 * p).toFixed(2) + 'px, 0)';
    }
    if (track) {
      track.style.transform = 'translate3d(0, ' + (-26 * p).toFixed(2) + 'px, 0)';
    }
    if (accentTrack) {
      accentTrack.style.opacity = String(0.28 - 0.12 * p);
    }
    if (cue) {
      cue.tabIndex = leadOut > 0.82 ? -1 : 0;
    }
    if (bio) {
      var bioLinks = bio.querySelectorAll('a');
      Array.prototype.forEach.call(bioLinks, function (link) {
        link.tabIndex = bioIn > 0.45 ? 0 : -1;
      });
    }
  }

  function updateHeroScroll() {
    if (!isDesktopScene() || !hero || !heroTimeline) {
      return;
    }
    var distance = hero.offsetHeight - window.innerHeight;
    if (distance <= 0) {
      heroTimeline.seek(0);
      return;
    }
    var progress = clamp(-hero.getBoundingClientRect().top / distance, 0, 1);
    heroTimeline.seek(progress * heroTimeline.duration);
  }

  function requestHeroUpdate() {
    if (heroScheduled) {
      return;
    }
    heroScheduled = true;
    window.requestAnimationFrame(function () {
      heroScheduled = false;
      updateHeroScroll();
    });
  }

  function resetHeroStyles() {
    if (lead) {
      lead.style.removeProperty('opacity');
      lead.style.removeProperty('transform');
    }
    if (portrait) {
      portrait.style.removeProperty('transform');
    }
    if (bio) {
      bio.style.removeProperty('opacity');
      bio.style.removeProperty('transform');
      bio.classList.remove('is-active');
      Array.prototype.forEach.call(bio.querySelectorAll('a'), function (link) {
        link.tabIndex = 0;
      });
    }
    if (portraitLine) {
      portraitLine.style.removeProperty('transform');
    }
    if (caption) {
      caption.style.removeProperty('opacity');
    }
    if (ghost) {
      ghost.style.removeProperty('transform');
    }
    if (track) {
      track.style.removeProperty('transform');
    }
    if (accentTrack) {
      accentTrack.style.removeProperty('opacity');
    }
    if (cue) {
      cue.tabIndex = 0;
    }
    measureHero();
  }

  function disarmMobileReveal() {
    if (mobileRevealTimer) {
      window.clearTimeout(mobileRevealTimer);
      mobileRevealTimer = 0;
    }
    if (mobileObserver) {
      mobileObserver.disconnect();
      mobileObserver = null;
    }
    if (bio) {
      bio.classList.remove('reveal-armed', 'is-inview');
    }
  }

  function armMobileReveal() {
    if (!bio || reduced || isDesktopScene() || !('IntersectionObserver' in window)) {
      return;
    }
    disarmMobileReveal();
    try {
      mobileObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            bio.classList.add('is-inview');
            if (mobileObserver) {
              mobileObserver.disconnect();
              mobileObserver = null;
            }
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      bio.classList.add('reveal-armed');
      mobileObserver.observe(bio);
    } catch (error) {
      disarmMobileReveal();
    }
  }

  function refreshMotionMode() {
    if (reduced) {
      root.classList.remove('motion-ready');
      disarmMobileReveal();
      resetHeroStyles();
      return;
    }

    root.classList.add('motion-ready');
    if (isDesktopScene()) {
      disarmMobileReveal();
      measureHero();
      updateHeroScroll();
      return;
    }

    resetHeroStyles();
    armMobileReveal();
  }

  function scrollToSection(hash, smooth) {
    var target = hash ? document.querySelector(hash) : null;
    if (!target) {
      return;
    }
    var behavior = smooth && !reduced ? 'smooth' : 'auto';
    var top = 0;

    if (hash === '#inicio') {
      top = 0;
    } else if (hash === '#sobre' && isDesktopScene() && hero) {
      top = hero.offsetTop + hero.offsetHeight - window.innerHeight;
    } else {
      var headerHeight = parseFloat(window.getComputedStyle(root).getPropertyValue('--header-h')) || 0;
      top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    }

    window.scrollTo({ top: Math.max(0, top), behavior: behavior });
  }

  function handleAnchorClick(event) {
    var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link) {
      return;
    }
    var hash = link.getAttribute('href');
    if (hash !== '#inicio' && !(hash === '#sobre' && isDesktopScene())) {
      return;
    }
    event.preventDefault();
    scrollToSection(hash, true);
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', hash);
    }
  }

  function initHero() {
    if (!hero || !stage) {
      return;
    }
    heroTimeline = new Hyperframes.FrameTimeline({
      id: 'hero',
      duration: 1600,
      fps: 60,
      render: function (state) {
        renderHero(state.progress);
      }
    });
    measureHero();
    refreshMotionMode();
    setHeaderState();
    updateHeroScroll();
  }

  function applyInitialHash() {
    var hash = window.location.hash;
    if (!hash) {
      return;
    }
    window.requestAnimationFrame(function () {
      scrollToSection(hash, false);
      setHeaderState();
      if (isDesktopScene()) {
        updateHeroScroll();
      }
    });
  }

  function observeMedia() {
    var videos = document.querySelectorAll('video');
    Array.prototype.forEach.call(videos, function (video) {
      video.addEventListener('error', function () {
        var slot = video.closest('.media-slot');
        if (slot) {
          createPlaceholder(slot, 'video', 1);
        }
      }, { once: true });
    });
  }

  function exposeApi() {
    window.VTR = {
      project: PROJECT,
      timelines: {
        intro: introTimeline,
        hero: heroTimeline
      },
      seekHero: function (progress) {
        if (!heroTimeline) {
          return null;
        }
        var value = clamp(Number(progress) || 0, 0, 1);
        heroTimeline.seek(value * heroTimeline.duration);
        return heroTimeline.getState();
      },
      getState: function () {
        return {
          reducedMotion: reduced,
          desktopScene: isDesktopScene(),
          introEnded: introEnded,
          intro: introTimeline ? introTimeline.getState() : null,
          hero: heroTimeline ? heroTimeline.getState() : null,
          heroShift: heroShift
        };
      },
      skipIntro: function () {
        endIntro(false);
      }
    };
  }

  function onResize() {
    if (!mobileNavQuery.matches && siteNav && navToggle) closeNav(false);
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      refreshMotionMode();
      setHeaderState();
      requestHeroUpdate();
    }, 120);
  }

  function onScroll() {
    setHeaderState();
    if (isDesktopScene()) {
      requestHeroUpdate();
    }
  }

  function failSafe() {
    if (intro) {
      endIntro(true);
    }
    root.classList.remove('motion-ready');
    disarmMobileReveal();
    resetHeroStyles();
  }

  function boot() {
    renderProject(PROJECT);
    observeMedia();
    initHero();
    initIntro();
    initNav();
    exposeApi();
    applyInitialHash();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('click', handleAnchorClick);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        measureHero();
        if (isDesktopScene()) {
          updateHeroScroll();
        }
      });
    }

    if (reducedQuery.addEventListener) {
      reducedQuery.addEventListener('change', function (event) {
        reduced = event.matches;
        if (reduced && !introEnded) {
          endIntro(true);
        }
        refreshMotionMode();
      });
    }
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', function () {
        refreshMotionMode();
        requestHeroUpdate();
      });
    }
  }

  window.addEventListener('error', function () {
    if (!introEnded) {
      failSafe();
    }
  });

  window.addEventListener('unhandledrejection', function () {
    if (!introEnded) {
      failSafe();
    }
  });

  try {
    boot();
  } catch (error) {
    failSafe();
    if (window.console && window.console.error) {
      window.console.error('Portfolio initialization failed.', error);
    }
  }
}());
