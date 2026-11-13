(() => {
  "use strict";

  const root = document.getElementById("cursor");
  const shirt = document.getElementById("cursor-shirt");
  const float = document.getElementById("cursor-float");
  const dot = document.getElementById("cursor-dot");
  const label = document.getElementById("cursor-label");
  const image = document.getElementById("cursor-image");
  const leftSleeve = document.getElementById("cursor-sleeve-left");
  const rightSleeve = document.getElementById("cursor-sleeve-right");

  if (
    !root ||
    !shirt ||
    !float ||
    !dot ||
    !label ||
    !image ||
    !leftSleeve ||
    !rightSleeve
  ) {
    return;
  }

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const CONFIG = {
    gap: 22,
    hoverGap: 16,
    edge: 18,
    stiffness: 120,
    damping: 18,
    tiltFactor: 0.006,
    maxTilt: 14,
    bankFactor: 0.004,
    maxBank: 8,
    sleeveFactorX: 0.006,
    sleeveFactorY: 0.003,
    maxSleeveTilt: 8,
    sleeveStretch: 0.005,
    hoverScale: 1.045,
    pressScale: 0.94,
    dotScale: 2.2,
    maxDt: 1 / 30,
    minDt: 1 / 240,
    snapDistance: 320,
    spawnX: 34,
    spawnY: 26,
  };

  const state = {
    ready: false,
    active: false,
    pointerInside: false,
    moved: false,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    tilt: 0,
    bank: 0,
    leftAngle: 0,
    rightAngle: 0,
    scale: 1,
    dotScale: 1,
    hovered: false,
    labelText: "",
    pressed: false,
    overText: false,
    shirtW: 0,
    shirtH: 0,
    lastTime: 0,
    raf: 0,
    running: false,
    lastHoverTarget: null,
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const damp = (current, target, lambda, dt) =>
    target + (current - target) * Math.exp(-lambda * dt);
  const canUse = () => finePointer.matches && !reducedMotion.matches;

  function measure() {
    const rect = shirt.getBoundingClientRect();
    const cssWidth = Number.parseFloat(getComputedStyle(shirt).width);

    state.shirtW = rect.width || cssWidth || 120;
    state.shirtH = rect.height || state.shirtW * (375 / 400);
  }

  function getAnchor() {
    const gap = state.hovered ? CONFIG.hoverGap : CONFIG.gap;
    const edge = CONFIG.edge;

    const x = clamp(
      state.targetX + gap,
      edge,
      Math.max(edge, window.innerWidth - edge - state.shirtW),
    );
    const y = clamp(
      state.targetY + gap,
      edge,
      Math.max(edge, window.innerHeight - edge - state.shirtH),
    );

    return { x, y };
  }

  function paintInitial() {
    shirt.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
    float.style.transform =
      "translate3d(0px, 0px, 0) rotate(0deg) rotateY(0deg) scale(1)";
    leftSleeve.style.transform = "rotate(0deg) scale(1)";
    rightSleeve.style.transform = "rotate(0deg) scale(1)";
    dot.style.transform =
      `translate3d(${state.targetX}px, ${state.targetY}px, 0) ` +
      `translate(-50%, -50%) scale(${state.dotScale})`;
  }

  function render(dt) {
    const time = performance.now() * 0.001;
    const calm = state.hovered ? 0.35 : 1;

    const wantedTilt = state.hovered
      ? 0
      : clamp(state.vx * CONFIG.tiltFactor, -CONFIG.maxTilt, CONFIG.maxTilt);
    const wantedBank = state.hovered
      ? 0
      : clamp(state.vx * CONFIG.bankFactor, -CONFIG.maxBank, CONFIG.maxBank);

    state.tilt = damp(state.tilt, wantedTilt, state.hovered ? 14 : 8, dt);
    state.bank = damp(state.bank, wantedBank, 8, dt);

    const wantedLeft = state.hovered
      ? 0
      : clamp(
          state.vx * CONFIG.sleeveFactorX + state.vy * CONFIG.sleeveFactorY,
          -CONFIG.maxSleeveTilt,
          CONFIG.maxSleeveTilt,
        );
    const wantedRight = state.hovered
      ? 0
      : clamp(
          state.vx * CONFIG.sleeveFactorX - state.vy * CONFIG.sleeveFactorY,
          -CONFIG.maxSleeveTilt,
          CONFIG.maxSleeveTilt,
        );
    const sleeveEase = state.hovered ? 14 : 7;

    state.leftAngle = damp(state.leftAngle, wantedLeft, sleeveEase, dt);
    state.rightAngle = damp(state.rightAngle, wantedRight, sleeveEase, dt);

    const wantedScale = state.pressed
      ? CONFIG.pressScale
      : state.hovered
        ? CONFIG.hoverScale
        : 1;
    state.scale = damp(state.scale, wantedScale, 14, dt);

    const wantedDot = state.hovered ? CONFIG.dotScale : 1;
    state.dotScale = damp(state.dotScale, wantedDot, 16, dt);

    const bobX = Math.cos(time * 0.9) * 2.2 * calm;
    const bobY = Math.sin(time * 1.25) * 3.4 * calm;
    const idleTilt = Math.sin(time * 0.8) * 1.1 * calm;
    const idleBank = Math.sin(time * 1.05) * 2.6 * calm;
    const idleSleeve = Math.sin(time * 1.05) * 0.7 * calm;
    const leftAngle = state.leftAngle + idleSleeve;
    const rightAngle = state.rightAngle - idleSleeve;

    shirt.style.transform =
      `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0)`;

    float.style.transform =
      `translate3d(${bobX.toFixed(2)}px, ${bobY.toFixed(2)}px, 0) ` +
      `rotate(${(state.tilt + idleTilt).toFixed(2)}deg) ` +
      `rotateY(${(state.bank + idleBank).toFixed(2)}deg) ` +
      `scale(${state.scale.toFixed(3)})`;

    leftSleeve.style.transform =
      `rotate(${leftAngle.toFixed(2)}deg) ` +
      `scale(${(1 + Math.abs(state.leftAngle) * CONFIG.sleeveStretch).toFixed(3)})`;

    rightSleeve.style.transform =
      `rotate(${rightAngle.toFixed(2)}deg) ` +
      `scale(${(1 + Math.abs(state.rightAngle) * CONFIG.sleeveStretch).toFixed(3)})`;

    dot.style.transform =
      `translate3d(${state.targetX}px, ${state.targetY}px, 0) ` +
      `translate(-50%, -50%) scale(${state.dotScale.toFixed(3)})`;

    if (state.labelText) {
      const flipX = state.targetX + 106 > window.innerWidth;
      const flipY = state.targetY + 46 > window.innerHeight;
      const labelX = flipX ? state.targetX - 16 : state.targetX + 16;
      const labelY = flipY ? state.targetY - 16 : state.targetY + 16;

      label.style.transform =
        `translate3d(${labelX}px, ${labelY}px, 0) ` +
        `translate(${flipX ? "-100%" : "0"}, ${flipY ? "-100%" : "0"})`;
    }
  }

  function tick(now) {
    if (!state.running) return;

    const dt = clamp(
      (now - state.lastTime) / 1000,
      CONFIG.minDt,
      CONFIG.maxDt,
    );
    state.lastTime = now;

    const anchor = getAnchor();
    const ax = (anchor.x - state.x) * CONFIG.stiffness;
    const ay = (anchor.y - state.y) * CONFIG.stiffness;

    state.vx += ax * dt;
    state.vy += ay * dt;

    const decay = Math.exp(-CONFIG.damping * dt);
    state.vx *= decay;
    state.vy *= decay;

    state.x += state.vx * dt;
    state.y += state.vy * dt;

    render(dt);
    state.raf = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (state.running || !state.active) return;

    state.running = true;
    state.lastTime = performance.now();
    state.raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    state.running = false;

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    }
  }

  function setHover(hovered, text) {
    if (hovered === state.hovered && text === state.labelText) return;

    state.hovered = hovered;
    state.labelText = text;
    root.classList.toggle("is-hovering", hovered);

    if (text) {
      label.textContent = text;
      label.classList.add("is-visible");
    } else {
      label.textContent = "";
      label.classList.remove("is-visible");
    }
  }

  function updateHover(target) {
    if (!(target instanceof Element)) {
      state.overText = false;
      root.classList.remove("is-text");
      setHover(false, "");
      return;
    }

    const field = target.closest(
      "input, textarea, select, [contenteditable='true']",
    );

    if (field) {
      state.overText = true;
      root.classList.add("is-text");
      setHover(false, "");
      return;
    }

    state.overText = false;
    root.classList.remove("is-text");

    const interactive = target.closest(
      "a, button, [role='button'], [data-cursor]",
    );

    if (!interactive) {
      setHover(false, "");
      return;
    }

    setHover(true, interactive.getAttribute("data-cursor") || "");
  }

  function activate() {
    if (!state.ready || state.active || !canUse()) return;

    measure();

    state.active = true;
    state.pressed = false;
    state.x = state.targetX + CONFIG.gap + CONFIG.spawnX;
    state.y = state.targetY + CONFIG.gap + CONFIG.spawnY;
    state.vx = 0;
    state.vy = 0;
    state.tilt = 0;
    state.bank = 0;
    state.leftAngle = 0;
    state.rightAngle = 0;
    state.scale = 1;
    state.dotScale = state.hovered ? CONFIG.dotScale : 1;

    document.documentElement.classList.add("has-shirt-body");
    root.classList.add("is-visible");
    paintInitial();

    const target = document.elementFromPoint(state.targetX, state.targetY);
    if (target) {
      state.lastHoverTarget = target;
      updateHover(target);
    }

    startLoop();
  }

  function deactivate() {
    state.active = false;
    state.pressed = false;
    state.overText = false;
    state.lastHoverTarget = null;

    setHover(false, "");
    document.documentElement.classList.remove("has-shirt-body");
    root.classList.remove("is-visible", "is-text", "is-hovering", "is-pressed");
    label.classList.remove("is-visible");
    label.textContent = "";

    stopLoop();
  }

  function onPointerMove(event) {
    if (event.pointerType && event.pointerType !== "mouse") return;

    state.targetX = event.clientX;
    state.targetY = event.clientY;
    state.pointerInside = true;
    state.moved = true;

    if (!state.active) {
      if (state.ready) activate();

      if (state.active && event.target !== state.lastHoverTarget) {
        state.lastHoverTarget = event.target;
        updateHover(event.target);
      }

      return;
    }

    if (event.target !== state.lastHoverTarget) {
      state.lastHoverTarget = event.target;
      updateHover(event.target);
    }
  }

  function onPointerDown(event) {
    if (event.pointerType && event.pointerType !== "mouse") return;
    if (event.button !== 0 || !state.active) return;

    state.pressed = true;
    root.classList.add("is-pressed");
  }

  function onPointerUp() {
    state.pressed = false;
    root.classList.remove("is-pressed");
  }

  function onPointerLeave() {
    state.pointerInside = false;
    deactivate();
  }

  function onWindowBlur() {
    state.pointerInside = false;
    deactivate();
  }

  function onVisibilityChange() {
    if (document.hidden) {
      stopLoop();
    } else if (state.active) {
      startLoop();
    }
  }

  function onResize() {
    measure();
  }

  function onModeChange() {
    if (!canUse()) {
      deactivate();
      return;
    }

    if (state.ready && state.moved && state.pointerInside) {
      activate();
    }
  }

  function markReady() {
    if (state.ready) return;

    state.ready = true;
    measure();

    if (state.moved && state.pointerInside && canUse()) {
      activate();
    }
  }

  function markFailed() {
    state.ready = false;
    deactivate();
  }

  const images = [image, leftSleeve, rightSleeve];

  function checkLoaded() {
    if (images.every((img) => img.complete && img.naturalWidth > 0)) {
      markReady();
      return;
    }

    if (images.some((img) => img.complete && img.naturalWidth === 0)) {
      markFailed();
    }
  }

  function initImages() {
    images.forEach((img) => {
      if (img.complete) return;

      img.addEventListener("load", checkLoaded, { once: true });
      img.addEventListener("error", checkLoaded, { once: true });
    });

    checkLoaded();
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  window.addEventListener("blur", onWindowBlur);
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("load", measure, { once: true });

  document.documentElement.addEventListener("mouseleave", onPointerLeave);
  document.addEventListener("visibilitychange", onVisibilityChange);

  finePointer.addEventListener("change", onModeChange);
  reducedMotion.addEventListener("change", onModeChange);

  initImages();
})();
