/**
 * IRON PULSE — PREMIER PERFORMANCE SANCTUARY
 * Engine: Lenis Smooth Scroll + GSAP ScrollTrigger + Hero Stage Controller
 */

document.addEventListener('DOMContentLoaded', () => {

  // ═══════════════════════════════════════════════════════════
  // 1. LENIS SMOOTH SCROLL INITIALIZATION
  // ═══════════════════════════════════════════════════════════

  gsap.registerPlugin(ScrollTrigger);

  const isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 768;

  let lenis = null;
  if (!isTouchDevice && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Enable optimal lag smoothing so dropped frames interpolate smoothly
  gsap.ticker.lagSmoothing(500, 33);

  // Smooth scroll for anchor navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          if (lenis) {
            lenis.scrollTo(targetElement, {
              offset: -70,
              duration: 1.4,
            });
          } else {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 3. INTERACTIVE CUSTOM CURSOR (GPU HARDWARE-ACCELERATED)
  // ═══════════════════════════════════════════════════════════

  const cursorDot = document.getElementById('cursorDot');
  const cursorCircle = document.getElementById('cursorCircle');

  if (cursorDot && cursorCircle && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let circleX = mouseX;
    let circleY = mouseY;
    let cursorActive = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      cursorActive = true;
    }, { passive: true });

    gsap.ticker.add(() => {
      if (!cursorActive) return;
      const dx = mouseX - circleX;
      const dy = mouseY - circleY;
      circleX += dx * 0.18;
      circleY += dy * 0.18;
      cursorCircle.style.transform = `translate3d(${circleX}px, ${circleY}px, 0) translate(-50%, -50%)`;
      if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15) {
        cursorActive = false;
      }
    });

    // High-performance event delegation for hover states
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('[data-cursor="hover"], a, button, .pricing-card, .amenity-item, .why-3d-card, .trainer-control-btn, .review-ctrl-btn, .map-bar-btn')) {
        cursorCircle.classList.add('active');
      }
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('[data-cursor="hover"], a, button, .pricing-card, .amenity-item, .why-3d-card, .trainer-control-btn, .review-ctrl-btn, .map-bar-btn')) {
        cursorCircle.classList.remove('active');
      }
    }, { passive: true });
  }

  // ═══════════════════════════════════════════════════════════
  // 4. MINIMAL TASKBAR CONTROLLER, MOBILE MENU & SCROLLSPY
  // ═══════════════════════════════════════════════════════════

  const siteHeader = document.getElementById('siteHeader');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenuDrawer = document.getElementById('mobileMenuDrawer');

  // Minimal taskbar: hidden at hero section when not scrolling, slides into view only on scroll
  if (siteHeader) {
    window.addEventListener('scroll', () => {
      siteHeader.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
    // Initial check
    if ((window.pageYOffset || 0) > 50) siteHeader.classList.add('scrolled');
  }

  // Mobile menu drawer toggle
  if (mobileMenuBtn && mobileMenuDrawer) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileMenuDrawer.classList.toggle('open');
      const icon = mobileMenuBtn.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.textContent = isOpen ? 'close' : 'menu';
      }
    });

    // Close on link click inside drawer
    mobileMenuDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenuDrawer.classList.remove('open');
        const icon = mobileMenuBtn.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'menu';
      });
    });

    // Close drawer when clicking outside
    document.addEventListener('click', (e) => {
      if (!siteHeader.contains(e.target) && mobileMenuDrawer.classList.contains('open')) {
        mobileMenuDrawer.classList.remove('open');
        const icon = mobileMenuBtn.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'menu';
      }
    });
  }

  // Active Link ScrollSpy for the 7 Pages Present
  const pageNavItems = [
    { id: 'hero', selector: 'a[href="#hero"]' },
    { id: 'why-us', selector: 'a[href="#why-us"]' },
    { id: 'trainers', selector: 'a[href="#trainers"]' },
    { id: 'reviews', selector: 'a[href="#reviews"]' },
    { id: 'memberships', selector: 'a[href="#memberships"]' },
    { id: 'location', selector: 'a[href="#location"]' },
    { id: 'concierge', selector: 'a[href="#concierge"]' },
  ];

  function setActivePageLink(activeId) {
    if (!activeId) return;
    pageNavItems.forEach((item) => {
      const links = document.querySelectorAll(item.selector);
      links.forEach((link) => {
        if (item.id === activeId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    });
  }



  // ═══════════════════════════════════════════════════════════
  // 5. HERO SECTION STAGE AUTOMATION & 3-SECOND CAROUSEL
  // ═══════════════════════════════════════════════════════════

  let heroStage = 'logo'; // 'logo' | 'move' | 'athlete'
  let heroTimer1 = null;
  let heroTimer2 = null;

  // Cinematic Slide Carousel State — Smooth Glide
  let currentHeroSlide = 0;
  const totalHeroSlides = 3;
  let heroSlideInterval = null;
  const HERO_SLIDE_DURATION = 3500; // 3.5 seconds snappy athletic dwell per slide
  const INITIAL_HERO_DWELL = 3500;  // 3.5 seconds for first slide — zero lag / delay!
  let initialHeroDwellDone = false;
  const SLIDE_TRANSITION_MS = 900;  // 0.9s silky smooth athletic swipe
  let isSlideBusy = false;

  // Independent theme cycling — synced to precision (orange), discipline (gold), force (green)
  const themeClasses = ['theme-precision', 'theme-discipline', 'theme-force'];
  let currentThemeIndex = 0;
  let themeCycleInterval = null;
  let heroIsVisible = true; // Track hero visibility
  let trainerIsVisible = false; // Track trainer section visibility
  let reviewIsVisible = false; // Track review section visibility

  function applyTheme(index) {
    currentThemeIndex = (index + themeClasses.length) % themeClasses.length;
    document.body.classList.remove('theme-discipline', 'theme-force', 'theme-precision');
    document.body.classList.add(themeClasses[currentThemeIndex]);
  }

  function startThemeCycleTimer() {
    stopThemeCycleTimer();
    themeCycleInterval = setInterval(() => {
      applyTheme(currentThemeIndex + 1);
    }, HERO_SLIDE_DURATION);
  }

  function stopThemeCycleTimer() {
    if (themeCycleInterval) {
      clearInterval(themeCycleInterval);
      themeCycleInterval = null;
    }
  }

  // Scroll lock controllers — website cannot be scrolled until logo finishes and hero appears
  function preventScroll(e) {
    e.preventDefault();
  }

  function preventKeyScroll(e) {
    if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode || e.which)) {
      e.preventDefault();
    }
  }

  function lockScroll() {
    document.documentElement.classList.add('scroll-locked');
    document.body.classList.add('scroll-locked');
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', preventKeyScroll, { passive: false });
    if (lenis) {
      try { lenis.stop(); } catch (e) { }
    }
  }

  function unlockScroll() {
    document.documentElement.classList.remove('scroll-locked');
    document.body.classList.remove('scroll-locked');
    window.removeEventListener('wheel', preventScroll);
    window.removeEventListener('touchmove', preventScroll);
    window.removeEventListener('keydown', preventKeyScroll);
    if (lenis) {
      try { lenis.start(); } catch (e) { }
    }
  }

  function heroStart() {
    clearTimeout(heroTimer1);
    clearTimeout(heroTimer2);
    if (new URLSearchParams(window.location.search).get('stage') === 'athlete') {
      goStage('athlete');
      return;
    }
    goStage('logo');
    // Logo appears permanently for 3 full seconds before transitioning
    heroTimer1 = setTimeout(() => goStage('move'), 3000);
  }

  function goStage(stage) {
    heroStage = stage;
    updateStageUI();
    if (stage === 'move') {
      clearTimeout(heroTimer2);
      heroTimer2 = setTimeout(() => goStage('athlete'), 450);
    }
  }

  function updateStageUI() {
    const stageLogo = document.getElementById('stage-logo');
    const stageAthlete = document.getElementById('stage-athlete');
    const logoContainer = document.getElementById('logo-container');
    const logoSubtext = document.getElementById('logo-subtext');

    if (!stageLogo || !stageAthlete) return;

    if (heroStage === 'logo') {
      lockScroll();
      stageLogo.classList.remove('hidden-logo');
      stageAthlete.classList.remove('active');
      if (logoContainer) logoContainer.classList.add('visible');
      if (logoSubtext) {
        logoSubtext.classList.add('visible');
        logoSubtext.classList.remove('hidden-sub');
      }
      stopHeroSlideTimer();
    } else if (heroStage === 'move') {
      stageLogo.classList.add('hidden-logo');
      stageAthlete.classList.remove('active');
      if (logoSubtext) logoSubtext.classList.add('hidden-sub');
      stopHeroSlideTimer();
    } else if (heroStage === 'athlete') {
      clearTimeout(heroTimer1);
      clearTimeout(heroTimer2);
      stageLogo.classList.add('hidden-logo');
      unlockScroll();
      stageAthlete.classList.add('active');
      const slideParam = parseInt(new URLSearchParams(window.location.search).get('slide'), 10);
      const initSlide = (!isNaN(slideParam) && slideParam >= 0 && slideParam <= 2) ? slideParam : 0;
      goToHeroSlide(initSlide, 'init');
      startHeroSlideTimer(HERO_SLIDE_DURATION);
    }
  }

  function triggerSlideZoom(slideEl, isSwipe = false) {
    if (!slideEl) return;
    const glass = slideEl.querySelector('.athlete-glass-panel');
    const frame = slideEl.querySelector('.athlete-frame');
    const delay = isSwipe ? '0.15s' : '0s';
    if (glass) {
      glass.style.animation = 'none';
      void glass.offsetHeight;
      glass.style.animation = `heroGlassSingleZoomIn 2.4s cubic-bezier(0.16, 1, 0.3, 1) ${delay} both`;
    }
    if (frame) {
      frame.style.animation = 'none';
      void frame.offsetHeight;
      frame.style.animation = `heroAthleteSingleZoomIn 2.4s cubic-bezier(0.16, 1, 0.3, 1) ${delay} both`;
    }
  }

  // Smooth Quartic Eased Counter for Hero Section Specification Numbers
  function animateHeroStats(slideEl) {
    if (!slideEl) return;
    const statValues = slideEl.querySelectorAll('.stat-value[data-target]');
    statValues.forEach((el) => {
      if (el._statAnimId) {
        cancelAnimationFrame(el._statAnimId);
      }
      const target = parseFloat(el.getAttribute('data-target'));
      const startVal = el.hasAttribute('data-start') ? parseFloat(el.getAttribute('data-start')) : 0;
      const suffix = el.getAttribute('data-suffix') || '';
      const prefix = el.getAttribute('data-prefix') || '';
      const isComma = el.getAttribute('data-format') === 'comma';
      const decimals = parseInt(el.getAttribute('data-decimal'), 10) || 0;

      const duration = 1200;
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Quartic out ease (fast punchy start, silky smooth deceleration)
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const current = startVal + (target - startVal) * easeProgress;

        let formatted;
        if (decimals > 0) {
          formatted = current.toFixed(decimals);
        } else {
          const rounded = Math.round(current);
          formatted = isComma ? rounded.toLocaleString() : rounded.toString();
        }

        el.textContent = `${prefix}${formatted}${suffix}`;

        if (progress < 1) {
          el._statAnimId = requestAnimationFrame(update);
        } else {
          const finalVal = decimals > 0
            ? target.toFixed(decimals)
            : (isComma ? Math.round(target).toLocaleString() : Math.round(target).toString());
          el.textContent = `${prefix}${finalVal}${suffix}`;
          el._statAnimId = null;
        }
      }
      el._statAnimId = requestAnimationFrame(update);
    });
  }

  let heroWatchdog = null;

  function goToHeroSlide(index, dir = 'next') {
    if (isSlideBusy && dir !== 'init') {
      if (dir === 'next') resetHeroSlideTimer(500);
      return;
    }
    const slides = document.querySelectorAll('.hero-slide');
    const progressBars = document.querySelectorAll('.slide-progress-bar');
    if (!slides.length) return;

    const targetIndex = (index + totalHeroSlides) % totalHeroSlides;
    if (targetIndex === currentHeroSlide && dir !== 'init') return;

    // Sync theme palette to current slide when hero is visible
    applyTheme(targetIndex);

    // Automatically determine direction if direct index selected
    if (dir !== 'next' && dir !== 'prev' && dir !== 'init') {
      dir = targetIndex > currentHeroSlide ? 'next' : 'prev';
    }

    const previousIndex = currentHeroSlide;
    currentHeroSlide = targetIndex;

    const outgoing = slides[previousIndex];
    const incoming = slides[targetIndex];

    if (dir === 'init') {
      slides.forEach((slide, idx) => {
        if (idx === targetIndex) {
          slide.style.transform = 'translate3d(0, 0, 0)';
          slide.style.opacity = '1';
          if (!slide.classList.contains('active')) {
            slide.classList.add('active');
            triggerSlideZoom(slide, false);
          }
          setTimeout(() => animateHeroStats(slide), 350);
        } else {
          slide.className = 'hero-slide next';
          slide.style.transform = 'translate3d(100%, 0, 0)';
          slide.style.opacity = '0';
        }
      });

      // Initialize progress bar for the very first slide
      progressBars.forEach((bar, idx) => {
        const isCurrent = (idx % totalHeroSlides) === targetIndex;
        bar.classList.toggle('active', isCurrent);
        const fill = bar.querySelector('.progress-fill');
        if (fill) {
          fill.style.animation = 'none';
          void fill.offsetHeight;
          if (isCurrent) {
            fill.style.animation = `heroFillProgress ${initialHeroDwellDone ? HERO_SLIDE_DURATION : INITIAL_HERO_DWELL}ms linear forwards`;
          }
        }
      });

      return;
    }

    isSlideBusy = true;
    initialHeroDwellDone = true;
    clearTimeout(heroWatchdog);
    heroWatchdog = setTimeout(() => {
      isSlideBusy = false;
    }, SLIDE_TRANSITION_MS + 250);

    const enterX = dir === 'next' ? '100%' : '-100%';
    const exitX = dir === 'next' ? '-100%' : '100%';
    const transitionCurve = `transform ${SLIDE_TRANSITION_MS}ms cubic-bezier(0.22, 0.68, 0.35, 1.0), opacity ${SLIDE_TRANSITION_MS}ms cubic-bezier(0.22, 0.68, 0.35, 1.0)`;

    // Pre-position incoming slide instantly at entry side without transition
    incoming.style.transition = 'none';
    incoming.className = 'hero-slide';
    incoming.style.transform = `translate3d(${enterX}, 0, 0)`;
    incoming.style.opacity = '0';

    // Keep any idle slides out of the way
    slides.forEach((slide, idx) => {
      if (idx !== previousIndex && idx !== targetIndex) {
        slide.style.transition = 'none';
        slide.className = 'hero-slide';
        slide.style.transform = `translate3d(${enterX}, 0, 0)`;
        slide.style.opacity = '0';
      }
    });

    // Single hardware repaint registration
    void incoming.offsetHeight;

    // Animate both slides smoothly and simultaneously in the same unified direction
    incoming.style.transition = transitionCurve;
    outgoing.style.transition = transitionCurve;

    incoming.className = 'hero-slide active';
    incoming.style.transform = 'translate3d(0, 0, 0)';
    incoming.style.opacity = '1';

    outgoing.className = `hero-slide ${dir === 'next' ? 'prev' : 'next'}`;
    outgoing.style.transform = `translate3d(${exitX}, 0, 0)`;
    outgoing.style.opacity = '0';

    // Trigger the exact zoom animation on incoming slide as it swipes in
    triggerSlideZoom(incoming, true);
    animateHeroStats(incoming);

    // Clear outgoing slide animation
    const outGlass = outgoing.querySelector('.athlete-glass-panel');
    const outFrame = outgoing.querySelector('.athlete-frame');
    if (outGlass) outGlass.style.animation = 'none';
    if (outFrame) outFrame.style.animation = 'none';

    setTimeout(() => {
      clearTimeout(heroWatchdog);
      isSlideBusy = false;
      incoming.style.transition = '';
      outgoing.style.transition = '';
    }, SLIDE_TRANSITION_MS + 50);

    // Update progress bars
    progressBars.forEach((bar, idx) => {
      const isCurrent = (idx % totalHeroSlides) === targetIndex;
      bar.classList.toggle('active', isCurrent);
      const fill = bar.querySelector('.progress-fill');
      if (fill) {
        fill.style.animation = 'none';
        void fill.offsetHeight;
        if (isCurrent) {
          fill.style.animation = `heroFillProgress ${HERO_SLIDE_DURATION}ms linear forwards`;
        }
      }
    });

    if (dir !== 'init') {
      resetHeroSlideTimer(HERO_SLIDE_DURATION);
    }
  }

  function nextHeroSlide() {
    goToHeroSlide(currentHeroSlide + 1, 'next');
  }

  function prevHeroSlide() {
    goToHeroSlide(currentHeroSlide - 1, 'prev');
  }

  function startHeroSlideTimer(delay) {
    stopHeroSlideTimer();
    if (document.hidden || !heroIsVisible || heroStage !== 'athlete') return;
    const duration = delay !== undefined ? delay : (initialHeroDwellDone ? HERO_SLIDE_DURATION : INITIAL_HERO_DWELL);
    heroSlideInterval = setTimeout(() => {
      initialHeroDwellDone = true;
      nextHeroSlide();
    }, duration);
  }

  function stopHeroSlideTimer() {
    if (heroSlideInterval) {
      clearTimeout(heroSlideInterval);
      heroSlideInterval = null;
    }
  }

  function resetHeroSlideTimer(delay = HERO_SLIDE_DURATION) {
    stopHeroSlideTimer();
    startHeroSlideTimer(delay);
  }

  // Expose hero slide controls globally for onclick handlers in HTML
  window.goToHeroSlide = goToHeroSlide;
  window.nextHeroSlide = nextHeroSlide;
  window.prevHeroSlide = prevHeroSlide;

  // Pause on hover ONLY over the controls pagination (never pause from whole-screen mouseover)
  const heroPagination = document.querySelector('.hero-slider-pagination');
  if (heroPagination) {
    heroPagination.addEventListener('mouseenter', () => stopHeroSlideTimer());
    heroPagination.addEventListener('mouseleave', () => {
      if (heroStage === 'athlete') startHeroSlideTimer();
    });
  }

  // High-Performance Touch Swipe Support for Mobile Phones
  const heroSectionEl = document.getElementById('hero') || document.getElementById('stage-athlete');
  if (heroSectionEl) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwiping = false;

    heroSectionEl.addEventListener('touchstart', (e) => {
      if (heroStage !== 'athlete') return;
      if (!e.touches || e.touches.length === 0) return;
      // Do not intercept touches directly on buttons, links, or pagination controls
      if (e.target.closest('button, a, .hero-slider-pagination')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isSwiping = true;
    }, { passive: true });

    heroSectionEl.addEventListener('touchmove', (e) => {
      if (heroStage !== 'athlete') return;
      if (!isSwiping || !e.touches || e.touches.length === 0) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = touchStartX - currentX;
      const diffY = touchStartY - currentY;
      // If predominantly horizontal, prevent browser from accidentally jittering scroll
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 12) {
        if (e.cancelable) e.preventDefault();
      }
    }, { passive: false });

    heroSectionEl.addEventListener('touchend', (e) => {
      if (heroStage !== 'athlete') return;
      if (!isSwiping || !e.changedTouches || e.changedTouches.length === 0) return;
      isSwiping = false;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;
      const elapsed = Date.now() - touchStartTime;

      // Reliable swipe detection: horizontal displacement > vertical, > 35px threshold, within 900ms
      if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) && elapsed < 900) {
        if (diffX > 0) {
          nextHeroSlide(); // Swiped left -> advance to next slide
        } else {
          prevHeroSlide(); // Swiped right -> return to previous slide
        }
      }
    }, { passive: true });
  }

  // Smart Visibility: Pause hero carousel when scrolled out of view to save GPU cycles
  // Theme cycling continues independently via themeCycleInterval
  if ('IntersectionObserver' in window) {
    const heroSection = document.getElementById('hero');
    if (heroSection) {
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            heroIsVisible = true;
            // Hero is back in view — resume slide timer, stop standalone theme timer
            // (theme is driven by slide changes when hero is visible)
            stopThemeCycleTimer();
            if (heroStage === 'athlete') startHeroSlideTimer();
          } else {
            heroIsVisible = false;
            // Hero scrolled away — stop slide animation but keep theme cycling
            stopHeroSlideTimer();
            startThemeCycleTimer();
          }
        });
      }, { threshold: 0.05 });
      heroObserver.observe(heroSection);
    }
  }

  // Start sequence at logo stage, locking scroll to top
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  heroStart();



  const pricingData = {
    monthly: { club: 39, reserve: 69, legacy: 119 },
    annual: { club: 29, reserve: 55, legacy: 95 }, // Save 20-25% on annual commitment
  };

  window.setBilling = function (cycle) {
    const btnM = document.getElementById('btnMonthly');
    const btnA = document.getElementById('btnAnnual');
    const priceClub = document.getElementById('priceClub');
    const priceReserve = document.getElementById('priceReserve');
    const priceLegacy = document.getElementById('priceLegacy');

    if (cycle === 'annual') {
      btnA.classList.add('active');
      btnM.classList.remove('active');
      animatePrice(priceClub, pricingData.annual.club);
      animatePrice(priceReserve, pricingData.annual.reserve);
      animatePrice(priceLegacy, pricingData.annual.legacy);
    } else {
      btnM.classList.add('active');
      btnA.classList.remove('active');
      animatePrice(priceClub, pricingData.monthly.club);
      animatePrice(priceReserve, pricingData.monthly.reserve);
      animatePrice(priceLegacy, pricingData.monthly.legacy);
    }
  };

  function animatePrice(element, targetValue) {
    if (!element) return;
    const current = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
    const obj = { val: current };
    gsap.to(obj, {
      val: targetValue,
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: () => {
        element.textContent = Math.round(obj.val);
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 6. GSAP SCROLLTRIGGERS & MASK REVEALS (IDLE-SCHEDULED FOR ZERO TBT)
  // ═══════════════════════════════════════════════════════════

  function initScrollTriggers() {
    // Connect Lenis to ScrollTrigger on idle init
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
    }

    // ScrollSpy navigation tracking
    pageNavItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onEnter: () => setActivePageLink(item.id),
          onEnterBack: () => setActivePageLink(item.id),
        });
      }
    });

    // Manifesto Section Mask Reveals
    const manifestoLines = document.querySelectorAll('.manifesto-section .mask-inner');
    manifestoLines.forEach((line) => {
      gsap.fromTo(
        line,
        { yPercent: 105, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: line,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Animated Statistics Numbers
    const counters = document.querySelectorAll('.counter');
    counters.forEach((counter) => {
      const target = +counter.getAttribute('data-target');
      ScrollTrigger.create({
        trigger: counter,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          let current = 0;
          const duration = 2000;
          const startTime = performance.now();

          function updateNumber(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            current = Math.floor(easeProgress * target);
            counter.textContent = current.toLocaleString();
            if (progress < 1) {
              requestAnimationFrame(updateNumber);
            } else {
              counter.textContent = target.toLocaleString();
            }
          }
          requestAnimationFrame(updateNumber);
        },
      });
    });

    // Section 3: Expanding Imagery Showcase Block
    const showcaseContainer = document.getElementById('showcaseExpandContainer');
    const showcaseImg = document.getElementById('showcaseExpandImg');

    if (showcaseContainer && showcaseImg) {
      const expandTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#showcase',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
          pin: '.showcase-sticky-wrap',
          anticipatePin: 1,
          fastScrollEnd: true,
          preventOverlaps: true,
        },
      });

      expandTl
        .to(showcaseContainer, {
          scale: 1,
          borderRadius: '0px',
          maxWidth: '100vw',
          maxHeight: '100vh',
          boxShadow: 'none',
          ease: 'power2.inOut',
        }, 0)
        .to(showcaseImg, {
          scale: 1.0,
          ease: 'power2.inOut',
        }, 0)
        .fromTo('.showcase-overlay-content', {
          opacity: 0.6,
          y: 20,
        }, {
          opacity: 1,
          y: 0,
          ease: 'power2.out',
        }, 0.1);
    }

    // ═══════════════════════════════════════════════════════════
    // 7. WHY CHOOSE US (REFERENCE 2) — TIMELINE SCROLL REVEALS
    // ═══════════════════════════════════════════════════════════

    // Header Reveal
    const whyHeader = document.querySelector('.why-header');
    if (whyHeader) {
      gsap.fromTo(
        whyHeader,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: whyHeader,
            start: 'top 85%',
          },
        }
      );
    }

    // Row-by-Row Alternating Directional Scroll Entrances (Left & Right)
    const timelineRows = document.querySelectorAll('.why-timeline-row');
    if (timelineRows.length) {
      timelineRows.forEach((row) => {
        const leftCol = row.querySelector('.why-col-left');
        const rightCol = row.querySelector('.why-col-right');
        const centerNode = row.querySelector('.why-timeline-node');

        const isMobileView = window.innerWidth <= 768;

        if (isMobileView) {
          // Mobile: Smooth, cinematic fade up with subtle translation to avoid abrupt jerks
          const specCol = row.querySelector('.why-feature-box')?.closest('.why-row-col');
          const imgCol = row.querySelector('.why-3d-card-container')?.closest('.why-row-col');

          if (specCol) {
            gsap.fromTo(
              specCol,
              { opacity: 0, y: 24 },
              {
                opacity: 1,
                y: 0,
                duration: 0.95,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: row,
                  start: 'top 88%',
                  toggleActions: 'play none none none',
                },
              }
            );
          }

          if (imgCol) {
            gsap.fromTo(
              imgCol,
              { opacity: 0, y: 24, scale: 0.96 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.95,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: row,
                  start: 'top 88%',
                  toggleActions: 'play none none none',
                },
              }
            );
          }
        } else {
          // Desktop / Tablet: Directional horizontal scroll entrance with buttery smooth ease
          if (leftCol) {
            gsap.fromTo(
              leftCol,
              { opacity: 0, x: -50 },
              {
                opacity: 1,
                x: 0,
                duration: 1.1,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: row,
                  start: 'top 85%',
                  toggleActions: 'play none none none',
                },
              }
            );
          }

          if (rightCol) {
            gsap.fromTo(
              rightCol,
              { opacity: 0, x: 50 },
              {
                opacity: 1,
                x: 0,
                duration: 1.1,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: row,
                  start: 'top 85%',
                  toggleActions: 'play none none none',
                },
              }
            );
          }
        }

        // Center Node: Elastic Scale Reveal
        if (centerNode) {
          gsap.fromTo(
            centerNode,
            { opacity: 0, scale: 0 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.8,
              delay: 0.15,
              ease: 'back.out(1.7)',
              scrollTrigger: {
                trigger: row,
                start: 'top 82%',
              },
            }
          );
        }
      });
    }

    // ═══════════════════════════════════════════════════════════
    // 7B. ACETERNITY UI 3D CARD ENGINE (WHY CHOOSE US VISUALS ONLY)
    // ═══════════════════════════════════════════════════════════

    const why3DCards = document.querySelectorAll('.why-3d-card');
    if (why3DCards.length) {
      why3DCards.forEach((card) => {
        const depthElements = card.querySelectorAll('[data-3d-depth]');
        let rafId = null;
        let cachedRect = null;

        card.addEventListener('mouseenter', () => {
          cachedRect = card.getBoundingClientRect();
          card.style.transition = 'transform 0.15s ease-out, box-shadow 0.3s ease';
          depthElements.forEach((el) => {
            const depth = el.getAttribute('data-3d-depth') || 30;
            el.style.transform = `translateZ(${depth}px)`;
          });
        }, { passive: true });

        card.addEventListener('mousemove', (e) => {
          if (!cachedRect) cachedRect = card.getBoundingClientRect();
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            const relX = (e.clientX - cachedRect.left - cachedRect.width / 2) / 16;
            const relY = (e.clientY - cachedRect.top - cachedRect.height / 2) / 16;
            card.style.transform = `rotateY(${relX}deg) rotateX(${-relY}deg)`;
          });
        }, { passive: true });

        card.addEventListener('mouseleave', () => {
          cachedRect = null;
          if (rafId) cancelAnimationFrame(rafId);
          card.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.3, 1), box-shadow 0.6s ease';
          card.style.transform = 'rotateY(0deg) rotateX(0deg)';
          depthElements.forEach((el) => {
            el.style.transform = 'translateZ(0px)';
          });
        }, { passive: true });

        // Touch screen support (Mobile & Tablet)
        card.addEventListener('touchstart', () => {
          cachedRect = card.getBoundingClientRect();
          card.style.transition = 'transform 0.15s ease-out, box-shadow 0.3s ease';
          depthElements.forEach((el) => {
            const depth = el.getAttribute('data-3d-depth') || 30;
            el.style.transform = `translateZ(${depth}px)`;
          });
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
          if (!e.touches || !e.touches[0]) return;
          if (!cachedRect) cachedRect = card.getBoundingClientRect();
          const touch = e.touches[0];
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            const relX = (touch.clientX - cachedRect.left - cachedRect.width / 2) / 12;
            const relY = (touch.clientY - cachedRect.top - cachedRect.height / 2) / 12;
            card.style.transform = `rotateY(${relX}deg) rotateX(${-relY}deg)`;
          });
        }, { passive: true });

        const handleTouchEnd = () => {
          cachedRect = null;
          if (rafId) cancelAnimationFrame(rafId);
          card.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.3, 1), box-shadow 0.6s ease';
          card.style.transform = 'rotateY(0deg) rotateX(0deg)';
          depthElements.forEach((el) => {
            el.style.transform = 'translateZ(0px)';
          });
        };

        card.addEventListener('touchend', handleTouchEnd, { passive: true });
        card.addEventListener('touchcancel', handleTouchEnd, { passive: true });
      });
    }

    // ═══════════════════════════════════════════════════════════
    // 7C. ACETERNITY UI ANIMATED TESTIMONIALS (MASTER TRAINERS)
    // ═══════════════════════════════════════════════════════════

    const trainersData = [
      {
        name: "Marcus Vance, CSCS",
        faculty: "FACULTY 01 / 04",
        designation: "HEAD OF STRENGTH & BIOMECHANICS",
        specialties: ["Olympic Weightlifting", "Force Vector Analysis", "Hypertrophy Architecture"],
        quote: "True physical discipline isn't about exhausting yourself every day; it's about calibrated biomechanics, flawless bar paths, and building strength that lasts for decades."
      },
      {
        name: "Elena Rostova, DPT",
        faculty: "FACULTY 02 / 04",
        designation: "DIRECTOR OF CONTRAST & ATHLETIC RECOVERY",
        specialties: ["Cryotherapy Protocols", "Neuromuscular Reset", "Mobility Science"],
        quote: "Recovery is not passive rest—it is an active biological weapon. Calibrated contrast cycles and cellular oxygenation will cut your training plateau in half."
      },
      {
        name: "David Sterling, USAW-2",
        faculty: "FACULTY 03 / 04",
        designation: "METABOLIC CONDITIONING & VO2 SPECIALIST",
        specialties: ["Lactate Threshold", "Anaerobic Ergometry", "Sprint Mechanics"],
        quote: "We engineer conditioning to expand your anaerobic ceiling. You don't just endure the work; your cardiovascular engine thrives under extreme load."
      },
      {
        name: "Julian Hayes, CSCS",
        faculty: "FACULTY 04 / 04",
        designation: "KINETIC MOVEMENT & TACTICAL PERFORMANCE",
        specialties: ["Plyometric Elasticity", "Core Anti-Rotation", "Structural Balance"],
        quote: "Aesthetics are a natural byproduct of raw performance. When every kinetic chain fires in perfect harmony, explosive strength becomes effortless."
      }
    ];

    let currentTrainerIdx = 0;
    let trainerTimer = null;
    let isTrainerBusy = false;
    const TRAINER_CYCLE_MS = 3000; // 3 seconds continuous auto-switch

    const stackCards = document.querySelectorAll('.trainer-stack-card');
    const timerDots = document.querySelectorAll('.timer-dot');
    const trainerNameEl = document.getElementById('trainerName');
    const trainerFacultyEl = document.getElementById('trainerFaculty');
    const trainerDesignationEl = document.getElementById('trainerDesignation');
    const trainerSpecialtiesEl = document.getElementById('trainerSpecialties');
    const trainerQuoteEl = document.getElementById('trainerQuote');
    const btnPrevTrainer = document.getElementById('btnPrevTrainer');
    const btnNextTrainer = document.getElementById('btnNextTrainer');
    const animatedTrainers = document.getElementById('animatedTrainers');

    // Precision 3D Stack Configuration for Aceternity Card Deck (Responsive)
    const isMobileStack = window.innerWidth <= 768;
    const stackConfigs = isMobileStack ? [
      { rotation: 0, scale: 1, x: 0, y: 0, opacity: 1, zIndex: 40, shadow: '0 16px 36px rgba(0,0,0,0.65)' },
      { rotation: -4, scale: 0.95, x: -4, y: 6, opacity: 0.80, zIndex: 30, shadow: '0 12px 28px rgba(0,0,0,0.55)' },
      { rotation: 3, scale: 0.90, x: 4, y: 12, opacity: 0.60, zIndex: 20, shadow: '0 8px 20px rgba(0,0,0,0.45)' },
      { rotation: -2, scale: 0.85, x: -2, y: 16, opacity: 0.40, zIndex: 10, shadow: '0 6px 16px rgba(0,0,0,0.35)' }
    ] : [
      { rotation: 0, scale: 1, x: 0, y: 0, opacity: 1, zIndex: 40, shadow: '0 32px 75px rgba(0,0,0,0.85)' },
      { rotation: -6, scale: 0.94, x: -6, y: 10, opacity: 0.78, zIndex: 30, shadow: '0 20px 50px rgba(0,0,0,0.7)' },
      { rotation: 5, scale: 0.88, x: 6, y: 20, opacity: 0.55, zIndex: 20, shadow: '0 15px 35px rgba(0,0,0,0.6)' },
      { rotation: -3, scale: 0.82, x: -3, y: 28, opacity: 0.35, zIndex: 10, shadow: '0 10px 25px rgba(0,0,0,0.5)' }
    ];

    let trainerWatchdog = null;

    function renderTrainer(index, direction = 'next') {
      if (isTrainerBusy && direction !== 'init') {
        if (direction === 'next') resetTrainerTimer(400);
        return;
      }
      isTrainerBusy = true;
      clearTimeout(trainerWatchdog);
      trainerWatchdog = setTimeout(() => {
        isTrainerBusy = false;
      }, 750);

      const previousIndex = currentTrainerIdx;
      currentTrainerIdx = (index + trainersData.length) % trainersData.length;
      const data = trainersData[currentTrainerIdx];

      // Card Stack Physical Animation with ultra-smooth easing
      stackCards.forEach((card, idx) => {
        const offset = (idx - currentTrainerIdx + trainersData.length) % trainersData.length;
        const cfg = stackConfigs[offset];

        if (direction === 'init') {
          gsap.set(card, {
            rotation: cfg.rotation,
            scale: cfg.scale,
            x: cfg.x,
            y: cfg.y,
            opacity: cfg.opacity,
            zIndex: cfg.zIndex,
            boxShadow: cfg.shadow,
            transformOrigin: 'bottom center'
          });
        } else if (offset === 0) {
          // Active incoming card: Buttery smooth elevation float & settle
          gsap.fromTo(card,
            { y: -24, scale: 0.96, opacity: 0.85, zIndex: 45 },
            {
              rotation: 0,
              scale: 1,
              x: 0,
              y: 0,
              opacity: 1,
              zIndex: 40,
              boxShadow: cfg.shadow,
              duration: 0.75,
              ease: 'power2.out'
            }
          );
        } else {
          // Smoothly glide into background deck positions
          gsap.to(card, {
            rotation: cfg.rotation,
            scale: cfg.scale,
            x: cfg.x,
            y: cfg.y,
            opacity: cfg.opacity,
            zIndex: cfg.zIndex,
            boxShadow: cfg.shadow,
            duration: 0.75,
            ease: 'power2.out'
          });
        }
      });

      // Animate Info Panel with smooth fluid transition
      if (trainerFacultyEl) trainerFacultyEl.textContent = data.faculty;
      if (trainerNameEl) {
        gsap.fromTo(trainerNameEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        trainerNameEl.textContent = data.name;
      }
      if (trainerDesignationEl) {
        gsap.fromTo(trainerDesignationEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.05, ease: 'power2.out' });
        trainerDesignationEl.textContent = data.designation;
      }

      function escapeHTML(str) {
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      // Specialties Chips
      if (trainerSpecialtiesEl) {
        trainerSpecialtiesEl.innerHTML = data.specialties.map(spec => `<span class="spec-chip">${escapeHTML(spec)}</span>`).join('');
        gsap.fromTo('.spec-chip', { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, stagger: 0.04, duration: 0.4, ease: 'power2.out' });
      }

      // Word-by-word quote reveal
      if (trainerQuoteEl) {
        const words = data.quote.split(' ');
        trainerQuoteEl.innerHTML = words.map((w, i) =>
          `<span class="word-blur-span" style="animation-delay: ${i * 0.016}s">${escapeHTML(w)}&nbsp;</span>`
        ).join('');
      }

      // Timer Progress Dots
      timerDots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentTrainerIdx);
        const fill = dot.querySelector('.dot-fill');
        if (fill) {
          fill.style.animation = 'none';
          void fill.offsetHeight;
          if (idx === currentTrainerIdx) {
            fill.style.animation = `fillTrainerDot ${TRAINER_CYCLE_MS}ms linear forwards`;
          }
        }
      });

      setTimeout(() => {
        clearTimeout(trainerWatchdog);
        isTrainerBusy = false;
      }, 500);
    }

    function nextTrainer() {
      renderTrainer(currentTrainerIdx + 1, 'next');
      resetTrainerTimer();
    }

    function prevTrainer() {
      renderTrainer(currentTrainerIdx - 1, 'prev');
      resetTrainerTimer();
    }

    function startTrainerTimer(delay = TRAINER_CYCLE_MS) {
      stopTrainerTimer();
      if (document.hidden || !trainerIsVisible) return;
      trainerTimer = setTimeout(() => {
        renderTrainer(currentTrainerIdx + 1, 'next');
        startTrainerTimer(TRAINER_CYCLE_MS);
      }, delay);
    }

    function stopTrainerTimer() {
      if (trainerTimer) {
        clearTimeout(trainerTimer);
        trainerTimer = null;
      }
    }

    function resetTrainerTimer(delay = TRAINER_CYCLE_MS) {
      stopTrainerTimer();
      startTrainerTimer(delay);
    }

    if (btnNextTrainer) btnNextTrainer.addEventListener('click', nextTrainer);
    if (btnPrevTrainer) btnPrevTrainer.addEventListener('click', prevTrainer);

    timerDots.forEach((dot) => {
      dot.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-index'), 10);
        renderTrainer(idx, 'next');
        resetTrainerTimer();
      });
    });

    // Pause on hover, resume on leave
    if (animatedTrainers) {
      animatedTrainers.addEventListener('mouseenter', stopTrainerTimer);
      animatedTrainers.addEventListener('mouseleave', startTrainerTimer);
    }

    // Guaranteed Startup: Render immediately on page load & start auto-cycle
    renderTrainer(0, 'init');
    startTrainerTimer();

    // Smart Visibility: Pause when scrolled far away, resume when visible
    if ('IntersectionObserver' in window && animatedTrainers) {
      const trainerSection = document.getElementById('trainers') || animatedTrainers;
      const trainersObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          trainerIsVisible = entry.isIntersecting;
          if (entry.isIntersecting) {
            isTrainerBusy = false; // Clear stuck flag on re-enter
            startTrainerTimer();
          } else {
            stopTrainerTimer();
          }
        });
      }, { threshold: 0.1 });
      trainersObserver.observe(trainerSection);
    }

    // ═══════════════════════════════════════════════════════════
    // 7D. GOOGLE REVIEWS CAROUSEL (3 VISIBLE, 1 SHIFTS EVERY 2S)
    // ═══════════════════════════════════════════════════════════

    const reviewsTrack = document.getElementById('reviewsTrack');
    const reviewsWrapper = document.getElementById('reviewsCarouselWrapper');
    const btnPrevReview = document.getElementById('btnPrevReview');
    const btnNextReview = document.getElementById('btnNextReview');

    let reviewTimer = null;
    let isReviewSliding = false;
    let reviewWatchdog = null;
    const REVIEW_CYCLE_MS = 2000; // 2 seconds continuous shift

    let cachedShiftDistance = 0;
    function updateReviewShiftDistance() {
      if (!reviewsTrack) return 0;
      const firstCard = reviewsTrack.querySelector('.review-card');
      if (!firstCard) return 0;
      const style = window.getComputedStyle(reviewsTrack);
      const gap = parseFloat(style.gap) || 28;
      cachedShiftDistance = firstCard.offsetWidth + gap;
      return cachedShiftDistance;
    }
    function getShiftDistance() {
      return cachedShiftDistance || updateReviewShiftDistance();
    }
    let _resizeDebounce = null;
    window.addEventListener('resize', () => {
      clearTimeout(_resizeDebounce);
      _resizeDebounce = setTimeout(updateReviewShiftDistance, 150);
    }, { passive: true });

    function slideNextReview() {
      if (!reviewsTrack) return;
      if (isReviewSliding) {
        resetReviewTimer(350);
        return;
      }
      const firstCard = reviewsTrack.firstElementChild;
      if (!firstCard) return;

      isReviewSliding = true;
      clearTimeout(reviewWatchdog);
      reviewWatchdog = setTimeout(() => {
        isReviewSliding = false;
        if (reviewsTrack) gsap.set(reviewsTrack, { x: 0 });
      }, 850);

      const shift = getShiftDistance();

      gsap.to(reviewsTrack, {
        x: -shift,
        duration: 0.65,
        ease: 'power3.inOut',
        overwrite: 'auto',
        onComplete: () => {
          clearTimeout(reviewWatchdog);
          reviewsTrack.appendChild(firstCard);
          gsap.set(reviewsTrack, { x: 0 });
          isReviewSliding = false;
        }
      });
    }

    function slidePrevReview() {
      if (!reviewsTrack) return;
      if (isReviewSliding) {
        resetReviewTimer(350);
        return;
      }
      const lastCard = reviewsTrack.lastElementChild;
      if (!lastCard) return;

      isReviewSliding = true;
      clearTimeout(reviewWatchdog);
      reviewWatchdog = setTimeout(() => {
        isReviewSliding = false;
        if (reviewsTrack) gsap.set(reviewsTrack, { x: 0 });
      }, 850);

      const shift = getShiftDistance();
      reviewsTrack.insertBefore(lastCard, reviewsTrack.firstElementChild);
      gsap.set(reviewsTrack, { x: -shift });

      gsap.to(reviewsTrack, {
        x: 0,
        duration: 0.65,
        ease: 'power3.inOut',
        overwrite: 'auto',
        onComplete: () => {
          clearTimeout(reviewWatchdog);
          isReviewSliding = false;
        }
      });
    }

    function startReviewTimer(delay = REVIEW_CYCLE_MS) {
      stopReviewTimer();
      if (document.hidden || !reviewIsVisible) return;
      reviewTimer = setTimeout(() => {
        slideNextReview();
        startReviewTimer(REVIEW_CYCLE_MS);
      }, delay);
    }

    function stopReviewTimer() {
      if (reviewTimer) {
        clearTimeout(reviewTimer);
        reviewTimer = null;
      }
    }

    function resetReviewTimer(delay = REVIEW_CYCLE_MS) {
      stopReviewTimer();
      startReviewTimer(delay);
    }

    if (btnNextReview) {
      btnNextReview.addEventListener('click', () => {
        slideNextReview();
        resetReviewTimer();
      });
    }

    if (btnPrevReview) {
      btnPrevReview.addEventListener('click', () => {
        slidePrevReview();
        resetReviewTimer();
      });
    }

    // Hover to pause, leave to resume
    if (reviewsWrapper) {
      reviewsWrapper.addEventListener('mouseenter', stopReviewTimer);
      reviewsWrapper.addEventListener('mouseleave', () => {
        if (reviewIsVisible) startReviewTimer();
      });
    }

    // Guaranteed Startup on Load
    startReviewTimer();

    // Smart Visibility Observer
    if ('IntersectionObserver' in window && reviewsWrapper) {
      const reviewsSection = document.getElementById('reviews') || reviewsWrapper;
      const reviewsObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          reviewIsVisible = entry.isIntersecting;
          if (entry.isIntersecting) {
            isReviewSliding = false; // Clear stuck flag on re-enter
            startReviewTimer();
          } else {
            stopReviewTimer();
          }
        });
      }, { threshold: 0.1 });
      reviewsObserver.observe(reviewsSection);
    }

    // ─── UNIFIED VISIBILITY MANAGER FOR ALL THREE SLIDERS ───
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopHeroSlideTimer();
        stopThemeCycleTimer();
        stopTrainerTimer();
        stopReviewTimer();
      } else {
        // Force clear any stuck transitions
        isSlideBusy = false;
        isTrainerBusy = false;
        isReviewSliding = false;
        if (reviewsTrack) gsap.set(reviewsTrack, { x: 0 });

        // Resume timers only for sections that are actually visible in viewport
        if (heroStage === 'athlete' && heroIsVisible) {
          startHeroSlideTimer(HERO_SLIDE_DURATION);
        } else if (!heroIsVisible) {
          startThemeCycleTimer();
        }
        if (trainerIsVisible) {
          startTrainerTimer(TRAINER_CYCLE_MS);
        }
        if (reviewIsVisible) {
          startReviewTimer(REVIEW_CYCLE_MS);
        }
      }
    });

    // ═══════════════════════════════════════════════════════════
    // 8. MEMBERSHIPS SECTION & BILLING CYCLE TOGGLE
    //    Bouncy, energetic pop-up spring reveal for membership cards
    // ═══════════════════════════════════════════════════════════

    const pricingCards = document.querySelectorAll('.pricing-card');
    const membershipsSection = document.getElementById('memberships');

    if (pricingCards.length) {
      const popUpCard = (card, delay = 0) => {
        if (card.dataset.revealed === 'true') return;
        card.dataset.revealed = 'true';
        card.style.transition = 'none';

        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 60,
            scale: 0.88,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            delay: delay,
            ease: 'back.out(1.6)', // Crisp, energetic, bouncy pop-up spring
            onComplete: () => {
              card.style.transition = '';
              gsap.set(card, { clearProps: 'transform,opacity' });
            },
          }
        );
      };

      const isMobilePricing = window.innerWidth <= 768;

      if (isMobilePricing) {
        // Mobile: Each card pops up independently as it enters the viewport
        pricingCards.forEach((card) => {
          ScrollTrigger.create({
            trigger: card,
            start: 'top 92%',
            once: true,
            onEnter: () => popUpCard(card, 0),
          });

          if ('IntersectionObserver' in window) {
            const cardObserver = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    popUpCard(card, 0);
                    cardObserver.unobserve(card);
                  }
                });
              },
              { threshold: 0.08 }
            );
            cardObserver.observe(card);
          }
        });
      } else {
        // Desktop / Tablet: Sequential staggered pop-up reveal
        ScrollTrigger.create({
          trigger: '.tier-cards-grid',
          start: 'top 88%',
          once: true,
          onEnter: () => {
            pricingCards.forEach((card, idx) => {
              popUpCard(card, idx * 0.16);
            });
          },
        });

        if ('IntersectionObserver' in window && membershipsSection) {
          const memObserver = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  pricingCards.forEach((card, idx) => {
                    popUpCard(card, idx * 0.16);
                  });
                  memObserver.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.12 }
          );
          memObserver.observe(membershipsSection);
        }
      }
    }


    // ═══════════════════════════════════════════════════════════
    // 8B. OUR LOCATION SECTION - DUAL DIRECTIONAL SCROLL REVEAL
    //     Left: Written Address & Specifications (from Left)
    //     Right: Interactive Google Map (from Right)
    // ═══════════════════════════════════════════════════════════

    const locationSection = document.getElementById('location');
    if (locationSection) {
      const leftCol = locationSection.querySelector('.location-reveal-left');
      const rightCol = locationSection.querySelector('.location-reveal-right');

      const revealLeftCol = () => {
        if (!leftCol || leftCol.dataset.revealed === 'true') return;
        leftCol.dataset.revealed = 'true';
        locationSection.classList.add('is-revealed');
        leftCol.classList.add('is-revealed');
        leftCol.style.transition = 'none';

        gsap.fromTo(
          leftCol,
          { opacity: 0, x: -75 },
          {
            opacity: 1,
            x: 0,
            duration: 1.1,
            ease: 'power3.out',
            onComplete: () => {
              leftCol.style.transition = '';
              gsap.set(leftCol, { clearProps: 'transform,opacity' });
            },
          }
        );
      };

      const revealRightCol = () => {
        if (!rightCol || rightCol.dataset.revealed === 'true') return;
        rightCol.dataset.revealed = 'true';
        locationSection.classList.add('is-revealed');
        rightCol.classList.add('is-revealed');
        rightCol.style.transition = 'none';

        gsap.fromTo(
          rightCol,
          { opacity: 0, x: 75 },
          {
            opacity: 1,
            x: 0,
            duration: 1.1,
            ease: 'power3.out',
            onComplete: () => {
              rightCol.style.transition = '';
              gsap.set(rightCol, { clearProps: 'transform,opacity' });
            },
          }
        );
      };

      const isMobileLoc = window.innerWidth <= 768;

      if (isMobileLoc) {
        // Mobile: Stacked layout; reveal left address card and right map independently
        if (leftCol) {
          ScrollTrigger.create({
            trigger: leftCol,
            start: 'top 92%',
            once: true,
            onEnter: revealLeftCol,
          });

          if ('IntersectionObserver' in window) {
            const obsLeft = new IntersectionObserver((entries) => {
              entries.forEach((e) => {
                if (e.isIntersecting) {
                  revealLeftCol();
                  obsLeft.unobserve(e.target);
                }
              });
            }, { threshold: 0.08 });
            obsLeft.observe(leftCol);
          }
        }

        if (rightCol) {
          ScrollTrigger.create({
            trigger: rightCol,
            start: 'top 92%',
            once: true,
            onEnter: revealRightCol,
          });

          if ('IntersectionObserver' in window) {
            const obsRight = new IntersectionObserver((entries) => {
              entries.forEach((e) => {
                if (e.isIntersecting) {
                  revealRightCol();
                  obsRight.unobserve(e.target);
                }
              });
            }, { threshold: 0.08 });
            obsRight.observe(rightCol);
          }
        }
      } else {
        // Desktop / Tablet: Dual simultaneous entrance when #location section enters view
        ScrollTrigger.create({
          trigger: locationSection,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            revealLeftCol();
            revealRightCol();
          },
        });

        if ('IntersectionObserver' in window) {
          const obsLocation = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                revealLeftCol();
                revealRightCol();
                obsLocation.unobserve(e.target);
              }
            });
          }, { threshold: 0.12 });
          obsLocation.observe(locationSection);
        }
      }
    }
  } // End of initScrollTriggers

  // ── IDLE-SCHEDULED SCROLLTRIGGERS INITIALIZER (ZERO TBT) ──
  let scrollTriggersReady = false;
  function triggerScrollTriggers() {
    if (scrollTriggersReady) return;
    scrollTriggersReady = true;
    initScrollTriggers();
    ScrollTrigger.refresh();
  }

  if (window.scrollY > 40) {
    triggerScrollTriggers();
  } else {
    window.addEventListener('scroll', triggerScrollTriggers, { passive: true, once: true });
    window.addEventListener('wheel', triggerScrollTriggers, { passive: true, once: true });
    window.addEventListener('touchstart', triggerScrollTriggers, { passive: true, once: true });
    window.addEventListener('pointerdown', triggerScrollTriggers, { passive: true, once: true });
    window.addEventListener('keydown', triggerScrollTriggers, { passive: true, once: true });
    setTimeout(triggerScrollTriggers, 2500);
  }

  // ═══════════════════════════════════════════════════════════
  // 9. PRIVATE INVITATION MODAL HANDLERS
  // ═══════════════════════════════════════════════════════════

  const modal = document.getElementById('inquiryModal');
  const modalForm = document.getElementById('modalForm');
  const modalSuccess = document.getElementById('modalSuccess');
  const applicantTier = document.getElementById('applicantTier');

  // Direct On-Page Intake Form Submission
  window.handleDirectPageFormSubmit = function (e) {
    e.preventDefault();
    const form = document.getElementById('directPageForm');
    const success = document.getElementById('directFormSuccess');
    if (form) form.style.display = 'none';
    if (success) success.style.display = 'block';
  };

  window.openModal = function (tierName) {
    // 1. Update Direct On-Page Form
    const directTier = document.getElementById('directTier');
    const conciergeSection = document.getElementById('concierge');
    const directNameInput = document.getElementById('directName');

    if (directTier && tierName) {
      for (let i = 0; i < directTier.options.length; i++) {
        if (directTier.options[i].value === tierName || directTier.options[i].text.toLowerCase().includes(tierName.toLowerCase())) {
          directTier.selectedIndex = i;
          break;
        }
      }
    }

    // Scroll smoothly to direct form on page
    if (conciergeSection) {
      if (typeof lenis !== 'undefined' && lenis) {
        lenis.scrollTo(conciergeSection, { offset: -40, duration: 1.2 });
      } else {
        conciergeSection.scrollIntoView({ behavior: 'smooth' });
      }
      setTimeout(() => {
        if (directNameInput) directNameInput.focus();
      }, 700);
      return;
    }

    // Fallback: If modal is needed
    if (!modal) return;
    if (applicantTier && tierName) {
      let matched = false;
      for (let i = 0; i < applicantTier.options.length; i++) {
        if (applicantTier.options[i].value === tierName || applicantTier.options[i].text.includes(tierName)) {
          applicantTier.selectedIndex = i;
          matched = true;
          break;
        }
      }
      if (!matched && tierName) {
        applicantTier.value = 'Free Trial';
      }
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (typeof lenis !== 'undefined' && lenis) lenis.stop();

    requestAnimationFrame(() => {
      modal.classList.add('is-open');
    });
  };

  window.closeModal = function () {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    lenis.start();

    setTimeout(() => {
      modal.style.display = 'none';
      if (modalForm) {
        modalForm.style.display = 'block';
        modalForm.reset();
      }
      if (modalSuccess) {
        modalSuccess.style.display = 'none';
      }
    }, 400);
  };

  window.handleFormSubmit = function (e) {
    e.preventDefault();
    if (modalForm) modalForm.style.display = 'none';
    if (modalSuccess) modalSuccess.style.display = 'block';
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      window.closeModal();
    }
  });

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        window.closeModal();
      }
    });
  }

  // Final Calibration: Recalculate all ScrollTrigger positions after all assets load
  window.addEventListener('load', () => {
    if (scrollTriggersReady) ScrollTrigger.refresh();
  });

});
