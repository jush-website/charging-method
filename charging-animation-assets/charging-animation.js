(() => {
  'use strict';

  const { createTimeline, animate, createMotionPath } = anime;
  const stage = document.querySelector('#charging-stage');
  const energyMap = document.querySelector('#energy-map');
  const parts = [...document.querySelectorAll('[data-part]')];
  const labels = [...document.querySelectorAll('.phase-label')];
  const chargingPath = document.querySelector('#charging-path');
  const powerPath = document.querySelector('#power-path');
  const chargingParticles = [...document.querySelectorAll('.charging-particle')];
  const powerParticles = [...document.querySelectorAll('.power-particle')];
  const batteryLevel = document.querySelector('#battery-level');
  const batteryPercent = document.querySelector('#battery-percent');
  const batteryMeter = document.querySelector('#battery-meter');
  const systemState = document.querySelector('#system-state');
  const toggleButton = document.querySelector('#toggle-play');
  const replayButton = document.querySelector('#replay');
  const trap = document.querySelector('[data-part="trap"]');
  const closedBox = document.querySelector('[data-part="control-box"]');
  const openBox = document.querySelector('[data-part="control-box-open"]');
  const baseParts = parts.filter(part => part !== openBox);
  const phaseIndicator = document.querySelector('#phase-indicator');
  const phaseStatus = document.querySelector('#phase-status');
  const progressPhases = [...document.querySelectorAll('[data-progress-phase]')];
  const languageButtons = [...document.querySelectorAll('[data-language]')];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let motionEnabled = !prefersReducedMotion;
  const translations = {
    en: {
      title: 'Mains-Powered Insect Trap Charging', subtitle: 'From a Micro USB power input to an activated insect trap',
      stageLabel: 'Insect trap charging animation', usbAlt: 'Micro USB charging cable from the mains adapter', moduleAlt: 'Blue charging module',
      closedBoxAlt: 'Closed white control box', openBoxAlt: 'Open control box showing its circuit board and internal battery', trapAlt: 'Insect trap device',
      usbLabel: 'Micro USB input', moduleLabel: 'Charging module', controlLabel: 'Control box', trapLabel: 'Insect trap', batteryLabel: 'Battery level',
      phaseCaption: 'Process phase', progressLabel: 'Animation progress', controlsLabel: 'Animation controls', breakdown: 'Breakdown', charging: 'Charging', activation: 'Activation', ready: 'Ready',
      preparingState: 'Preparing', chargingState: 'Charging', chargedState: 'Charging complete', readyState: 'System Ready',
      pause: 'Pause', play: 'Play', enableMotion: 'Enable animation', replay: 'Replay', replayStatic: 'Show static flow again',
      enableMotionAria: 'Reduced-motion mode: enable animation on this page', enableMotionTitle: 'Play the full animation on this page', replayStaticAria: 'Show the static process diagram again',
      phaseAria: phase => `Process phase: ${phase}`, phaseStatus: phase => `Current process phase: ${phase}`,
      instructionsTitle: 'How to charge', step1Title: 'Take out the connector', step1Text: 'Take out the Micro USB connector.',
      step2Title: 'Find the charging module', step2Text: 'Open the control box and locate the charging module inside.',
      step3Title: 'Connect and charge', step3Text: 'Insert the Micro USB plug into the charging module to begin charging.',
      disclaimer: 'Mains power enters through an adapter and Micro USB. The charging path is illustrative; follow the actual device specifications for wiring.',
      documentTitle: 'Mains-Powered Insect Trap Charging', languageLabel: 'Language',
    },
    zh: {
      title: '捕蟲罐市電充電流程', subtitle: '從市電轉 Micro USB 輸入到捕蟲罐啟動的功能示意',
      stageLabel: '捕蟲罐充電拆解動畫', usbAlt: '市電轉接器的 Micro USB 充電線', moduleAlt: '藍色充電模組',
      closedBoxAlt: '關閉的白色控制盒', openBoxAlt: '掀開盒蓋後可見電路板與內部電池的控制盒', trapAlt: '捕蟲罐裝置',
      usbLabel: 'Micro USB 輸入', moduleLabel: '充電模組', controlLabel: '控制盒', trapLabel: '捕蟲罐', batteryLabel: '電池電量',
      phaseCaption: '流程階段', progressLabel: '動畫進度', controlsLabel: '動畫控制', breakdown: '拆解', charging: '充電', activation: '啟動', ready: '準備',
      preparingState: '準備中', chargingState: '充電中', chargedState: '充電完成', readyState: 'System Ready',
      pause: '暫停', play: '播放', enableMotion: '啟用動畫', replay: '重新播放', replayStatic: '重新顯示流程',
      enableMotionAria: '減少動態模式：在本頁啟用動畫', enableMotionTitle: '依你的選擇，在本頁播放完整動畫', replayStaticAria: '重新顯示靜態流程圖',
      phaseAria: phase => `流程階段：${phase}`, phaseStatus: phase => `目前流程階段：${phase}`,
      instructionsTitle: '充電操作說明', step1Title: '取出接頭', step1Text: '取出 Micro USB 接頭。',
      step2Title: '找到充電模組', step2Text: '打開控制盒，在盒內找到充電模組。',
      step3Title: '接上並充電', step3Text: '將 Micro USB 接頭插入充電模組開始充電。',
      disclaimer: '市電經轉接器以 Micro USB 輸入；充電路徑為功能示意，實際接線依裝置規格為準。',
      documentTitle: '捕蟲罐市電充電流程', languageLabel: '語言',
    },
  };
  let currentLanguage = 'en';
  try { currentLanguage = localStorage.getItem('charging-language') === 'zh' ? 'zh' : 'en'; } catch (_) { currentLanguage = 'en'; }
  let currentStateKey = 'preparingState';
  let currentPhaseKey = 'ready';
  let currentPaused = false;
  const meter = { progress: 0 };
  let chargingMotion;
  let powerMotion;
  let timeline;

  const partOffsets = () => window.matchMedia('(max-width: 720px)').matches
    ? {
        'usb-input': { x: -4, y: 0 }, 'charger-module': { x: 7, y: 0 },
        'control-box': { x: 2, y: 0 }, 'control-box-open': { x: 2, y: 0 }, trap: { x: 2, y: 0 },
      }
    : {
        'usb-input': { x: -18, y: 0 }, 'charger-module': { x: -10, y: 0 },
        'control-box': { x: 2, y: -2 }, 'control-box-open': { x: 2, y: -2 }, trap: { x: 15, y: 0 },
      };

  const text = key => translations[currentLanguage][key];
  const renderMeter = () => {
    const progress = Math.round(meter.progress);
    batteryLevel.style.setProperty('--battery-progress', `${progress}%`);
    batteryPercent.textContent = `${progress}%`;
  };
  const setMeter = progress => {
    const setter = animate(meter, { progress, duration: 1, autoplay: false, onUpdate: renderMeter });
    setter.seek(1);
    setter.cancel();
  };
  const setState = key => {
    currentStateKey = key;
    systemState.textContent = text(key);
  };
  const setProgressPhase = key => {
    currentPhaseKey = key;
    const phase = text(key);
    phaseIndicator.dataset.phase = key;
    phaseIndicator.setAttribute('aria-label', text('phaseAria')(phase));
    phaseStatus.textContent = text('phaseStatus')(phase);
    progressPhases.forEach(item => {
      const active = item.dataset.progressPhase === key;
      item.classList.toggle('is-active', active);
      if (active) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  };
  const setToggleText = paused => {
    currentPaused = paused;
    if (!motionEnabled) {
      toggleButton.disabled = false;
      toggleButton.textContent = text('enableMotion');
      toggleButton.setAttribute('aria-label', text('enableMotionAria'));
      toggleButton.title = text('enableMotionTitle');
      return;
    }
    toggleButton.disabled = false;
    toggleButton.removeAttribute('aria-label');
    toggleButton.removeAttribute('title');
    toggleButton.textContent = paused ? text('play') : text('pause');
  };
  const setReplayText = () => {
    replayButton.textContent = motionEnabled ? text('replay') : text('replayStatic');
    if (motionEnabled) replayButton.removeAttribute('aria-label');
    else replayButton.setAttribute('aria-label', text('replayStaticAria'));
  };
  const applyLanguage = language => {
    currentLanguage = language === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = currentLanguage === 'zh' ? 'zh-Hant' : 'en';
    document.title = text('documentTitle');
    document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = text(element.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label', text(element.dataset.i18nAria)); });
    document.querySelectorAll('[data-i18n-alt]').forEach(element => { element.alt = text(element.dataset.i18nAlt); });
    document.querySelector('.language-switch').setAttribute('aria-label', text('languageLabel'));
    languageButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === currentLanguage)));
    setState(currentStateKey);
    setProgressPhase(currentPhaseKey);
    setToggleText(currentPaused);
    setReplayText();
  };
  const setPathStart = path => {
    path.style.strokeDasharray = '100';
    path.style.strokeDashoffset = '100';
    path.style.opacity = '.18';
  };
  const positionBatteryMeter = () => {
    batteryMeter.style.top = window.matchMedia('(max-width: 720px)').matches ? '50%' : '80%';
  };
  const number = value => Number(value.toFixed(3));
  const partRectWithoutTransform = part => {
    const transform = part.style.transform;
    part.style.transform = 'none';
    const box = part.getBoundingClientRect();
    part.style.transform = transform;
    return box;
  };
  const projectedPartBox = partName => {
    const part = document.querySelector(`[data-part="${partName}"]`);
    const stageBox = stage.getBoundingClientRect();
    const box = partRectWithoutTransform(part);
    const offset = partOffsets()[partName];
    const left = box.left - stageBox.left + box.width * offset.x / 100;
    const top = box.top - stageBox.top + box.height * offset.y / 100;
    return {
      left: left / stageBox.width * 100,
      right: (left + box.width) / stageBox.width * 100,
      top: top / stageBox.height * 100,
      bottom: (top + box.height) / stageBox.height * 100,
      width: box.width / stageBox.width * 100,
      height: box.height / stageBox.height * 100,
    };
  };
  const center = box => ({ x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 });
  const edgeToward = (box, destination) => {
    const origin = center(box);
    const dx = destination.x - origin.x;
    const dy = destination.y - origin.y;
    const scale = Math.max(Math.abs(dx) / (box.width / 2), Math.abs(dy) / (box.height / 2), 1);
    return { x: origin.x + dx / scale, y: origin.y + dy / scale };
  };
  const point = ({ x, y }) => `${number(x)} ${number(y)}`;
  const refreshEnergyMap = () => {
    const stageBox = stage.getBoundingClientRect();
    if (!stageBox.width || !stageBox.height) return;
    const plug = projectedPartBox('usb-input');
    const module = projectedPartBox('charger-module');
    const controlBox = projectedPartBox('control-box-open');
    const trapBox = projectedPartBox('trap');
    const plugCenter = center(plug);
    const moduleCenter = center(module);
    const controlCenter = center(controlBox);
    const trapCenter = center(trapBox);
    const yellowPoints = [
      edgeToward(plug, moduleCenter),
      edgeToward(module, plugCenter),
      moduleCenter,
      edgeToward(module, controlCenter),
      edgeToward(controlBox, moduleCenter),
    ];
    const controlExit = edgeToward(controlBox, trapCenter);
    const trapEntry = edgeToward(trapBox, controlCenter);
    const controlA = { x: controlExit.x + (trapEntry.x - controlExit.x) * .34, y: controlExit.y };
    const controlB = { x: controlExit.x + (trapEntry.x - controlExit.x) * .66, y: trapEntry.y };
    chargingPath.setAttribute('d', `M ${point(yellowPoints[0])} L ${point(yellowPoints[1])} L ${point(yellowPoints[2])} L ${point(yellowPoints[3])} L ${point(yellowPoints[4])}`);
    powerPath.setAttribute('d', `M ${point(controlExit)} C ${point(controlA)}, ${point(controlB)}, ${point(trapEntry)}`);
    chargingMotion = createMotionPath(chargingPath);
    powerMotion = createMotionPath(powerPath);
  };

  const setInitialScene = () => {
    positionBatteryMeter();
    baseParts.forEach(part => {
      part.style.opacity = '0';
      part.style.transform = 'translate(0px, 12px) scale(.92) rotateY(0deg)';
    });
    openBox.style.opacity = '0';
    openBox.style.transform = 'translate(0px, 12px) scale(.92) rotateY(72deg)';
    labels.forEach(label => { label.style.opacity = '0'; });
    setPathStart(chargingPath);
    setPathStart(powerPath);
    [...chargingParticles, ...powerParticles].forEach(particle => {
      particle.setAttribute('cx', '0');
      particle.setAttribute('cy', '0');
      particle.style.opacity = '0';
      particle.style.transform = 'translate(0px, 0px)';
    });
    trap.style.setProperty('--trap-glow', '0rem');
    trap.style.filter = 'drop-shadow(0 .85rem 1rem rgba(0, 0, 0, .55)) drop-shadow(0 0 var(--trap-glow) rgba(102, 217, 161, .8))';
    batteryLevel.style.width = 'var(--battery-progress)';
    setMeter(0);
    setState('preparingState');
    setProgressPhase('ready');
  };

  const buildTimeline = () => {
    const offsets = partOffsets();
    setInitialScene();
    const timeline = createTimeline({ autoplay: false, loop: true, defaults: { ease: 'linear' } });
    timeline
      .call(() => setState('preparingState'), 0)
      .add(baseParts, { opacity: 1, translateY: 0, scale: 1, duration: 2200, ease: 'outQuad' }, 0)
      .add(baseParts, {
        translateX: element => `${offsets[element.dataset.part].x}%`,
        translateY: element => `${offsets[element.dataset.part].y}%`,
        duration: 3000, ease: 'inOutQuad',
      }, 3000);
    timeline.call(() => setProgressPhase('breakdown'), 3000);
    labels.forEach((label, index) => {
      timeline.add(label, { opacity: 1, translateY: [6, 0], duration: 420, ease: 'outQuad' }, 3000 + index * 650);
    });
    timeline
      .add(closedBox, { opacity: 0, rotateY: '-82deg', duration: 1300, ease: 'inOutQuad' }, 3800)
      .add(openBox, {
        opacity: 1,
        translateX: `${offsets['control-box-open'].x}%`,
        translateY: `${offsets['control-box-open'].y}%`,
        scale: 1,
        rotateY: '0deg',
        duration: 1500,
        ease: 'outCubic',
      }, 4000)
      .call(() => {
        setState('chargingState');
        setProgressPhase('charging');
      }, 6000)
      .add(chargingPath, { strokeDashoffset: 0, opacity: .9, duration: 800, ease: 'outQuad' }, 6000)
      .add(chargingParticles, { opacity: 1, duration: 180 }, 6250)
      .add(chargingParticles[0], { ...chargingMotion, duration: 2600, ease: 'inOutSine' }, 6400)
      .add(chargingParticles[1], { ...chargingMotion, duration: 2200, ease: 'inOutSine' }, 6600)
      .add(meter, { progress: 100, duration: 4000, ease: 'linear', onUpdate: renderMeter }, 6000)
      .call(() => {
        setState('chargedState');
        setProgressPhase('activation');
      }, 10000)
      .add(chargingParticles, { opacity: 0, duration: 250 }, 9700)
      .add(powerPath, { strokeDashoffset: 0, opacity: .9, duration: 800, ease: 'outQuad' }, 10000)
      .add(powerParticles, { opacity: 1, duration: 180 }, 10300)
      .add(powerParticles[0], { ...powerMotion, duration: 2100, ease: 'inOutSine' }, 10400)
      .add(trap, { '--trap-glow': '1.25rem', duration: 650, ease: 'outQuad' }, 10800)
      .add(trap, { '--trap-glow': '0rem', duration: 700, ease: 'inQuad' }, 11450)
      .call(() => setState('readyState'), 11800)
      .call(() => setProgressPhase('ready'), 13000)
      .add(labels, { opacity: 0, translateY: -4, duration: 650, ease: 'inQuad' }, 13000)
      .add([chargingPath, powerPath], { opacity: 0, strokeDashoffset: 100, duration: 700, ease: 'inQuad' }, 13000)
      .add([...chargingParticles, ...powerParticles], { opacity: 0, translateX: 0, translateY: 0, duration: 450 }, 13000)
      .add(openBox, { opacity: 0, rotateY: '72deg', translateX: 0, translateY: 0, duration: 900, ease: 'inQuad' }, 13000)
      .add(baseParts, { translateX: 0, translateY: 0, duration: 2000, ease: 'inOutQuad' }, 13000)
      .add(closedBox, { opacity: 1, rotateY: '0deg', duration: 900, ease: 'outQuad' }, 13600)
      .call(() => setState('preparingState'), 14990);
    return timeline;
  };

  applyLanguage(currentLanguage);
  refreshEnergyMap();
  timeline = buildTimeline();
  const showStaticExplodedFlow = () => {
    const offsets = partOffsets();
    baseParts.forEach(part => {
      part.style.opacity = '1';
      part.style.transform = `translate(${offsets[part.dataset.part].x}%, ${offsets[part.dataset.part].y}%) scale(1) rotateY(0deg)`;
    });
    closedBox.style.opacity = '0';
    closedBox.style.transform = `translate(${offsets['control-box'].x}%, ${offsets['control-box'].y}%) scale(1) rotateY(-82deg)`;
    openBox.style.opacity = '1';
    openBox.style.transform = `translate(${offsets['control-box-open'].x}%, ${offsets['control-box-open'].y}%) scale(1) rotateY(0deg)`;
    labels.forEach(label => { label.style.opacity = '1'; });
    [chargingPath, powerPath].forEach(path => {
      path.style.strokeDashoffset = '0';
      path.style.opacity = '.9';
    });
    setMeter(100);
    setState('readyState');
    setProgressPhase('activation');
    setToggleText(true);
    setReplayText();
  };
  const enableMotion = () => {
    motionEnabled = true;
    document.body.classList.add('motion-opt-in');
    refreshEnergyMap();
    timeline = buildTimeline();
    window.chargingAnimation.timeline = timeline;
    timeline.play();
    setToggleText(false);
    setReplayText();
  };
  const restart = () => {
    if (!motionEnabled) return showStaticExplodedFlow();
    setInitialScene();
    timeline.restart();
    setToggleText(false);
    setReplayText();
  };
  const toggle = () => {
    if (!motionEnabled) return enableMotion();
    if (timeline.paused) {
      timeline.play();
      setToggleText(false);
    } else {
      timeline.pause();
      setToggleText(true);
    }
  };

  const rebuildForGeometry = () => {
    if (!motionEnabled) {
      refreshEnergyMap();
      showStaticExplodedFlow();
      return;
    }
    const currentTime = timeline.currentTime || 0;
    const wasPaused = timeline.paused;
    timeline.pause();
    refreshEnergyMap();
    timeline = buildTimeline();
    timeline.seek(currentTime);
    if (!wasPaused) timeline.play();
    window.chargingAnimation.timeline = timeline;
  };
  window.chargingAnimation = { timeline, restart, toggle, isPaused: () => !motionEnabled || timeline.paused, refreshGeometry: rebuildForGeometry };
  languageButtons.forEach(button => button.addEventListener('click', () => {
    try { localStorage.setItem('charging-language', button.dataset.language); } catch (_) {}
    applyLanguage(button.dataset.language);
  }));
  toggleButton.addEventListener('click', toggle);
  replayButton.addEventListener('click', restart);
  let resizeFrame;
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(rebuildForGeometry);
  });
  if (!motionEnabled) showStaticExplodedFlow();
  else {
    timeline.play();
    setToggleText(false);
  }
})();
