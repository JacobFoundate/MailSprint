import React, { useRef, useEffect, useCallback, useState, useImperativeHandle } from 'react';
import soundManager from '@/utils/SoundManager';

const GAME_CONFIG = {
  PLAYER_WIDTH: 50,
  PLAYER_HEIGHT: 70,
  PLAYER_X: 100,
  JUMP_FORCE: -18,
  GRAVITY: 0.8,
  MAX_FALL_SPEED: 20,
  MAX_LIVES: 5,
  GROUND_HEIGHT: 100,
  INITIAL_SPEED: 6,
  MAX_SPEED: 12,
  SPEED_INCREMENT: 0.0004,
  TARGET_FPS: 60,
  MIN_SPAWN_DISTANCE: 300,
  MAX_SPAWN_DISTANCE: 600,
  MAILBOX_SPAWN_CHANCE: 0.35,
  OBSTACLE_TYPES: ['dog', 'pylon', 'hydrant', 'trash', 'baby', 'basketball', 'child', 'trampoline'],
  DELIVERY_POINTS: 100,
  DISTANCE_POINTS: 1,
  DAY_NIGHT_CYCLE_DURATION: 120,
  CYCLES_PER_SEASON: 15,
  WEATHER_PARTICLE_COUNT: 100,
  HEART_SPAWN_INTERVAL: 45,
  ROAD_HAZARD_MIN_INTERVAL: 15,
  ROAD_HAZARD_MAX_INTERVAL: 45,
  ROAD_HAZARD_TYPES: ['car', 'tire', 'tumbleweed', 'biker'],
  POWERUP_SPAWN_INTERVAL: 12,
  POWERUP_DURATION: 30,
  POWERUP_TYPES: ['rapidFire', 'straightShot', 'doubleShot', 'speedBoost', 'slowMotion', 'superJump', 'invincibility', 'knockback', 'superman'],
  LEPRECHAUN_SPAWN_INTERVAL: 60, // Every 60-90 seconds
  RAINBOW_PLATFORM_DURATION: 60,
  PEDESTRIAN_MIN_INTERVAL: 8,
  PEDESTRIAN_MAX_INTERVAL: 20,
  BIRD_MIN_INTERVAL: 5,
  BIRD_MAX_INTERVAL: 15,
};

const SEASONS = { SPRING: 0, SUMMER: 1, FALL: 2, WINTER: 3 };

const SEASON_CONFIG = {
  [SEASONS.SPRING]: { name: 'Spring', skyDay: ['#87CEEB', '#B0E0E6'], skyNight: ['#1a1a2e', '#16213e'], grassColor: ['#7CB342', '#558B2F'] },
  [SEASONS.SUMMER]: { name: 'Summer', skyDay: ['#4FB4E8', '#87CEEB'], skyNight: ['#0f0f23', '#1a1a3e'], grassColor: ['#8BC34A', '#689F38'] },
  [SEASONS.FALL]: { name: 'Fall', skyDay: ['#E8A87C', '#C38D6B'], skyNight: ['#2d1b4e', '#1a1a2e'], grassColor: ['#D4A574', '#8B7355'] },
  [SEASONS.WINTER]: { name: 'Winter', skyDay: ['#B0C4DE', '#87CEEB'], skyNight: ['#0a1628', '#162447'], grassColor: ['#E8E8E8', '#C0C0C0'] },
};

const POWERUP_CONFIG = {
  rapidFire: { color: '#FF5722', icon: '🔥', name: 'Rapid Fire' },
  straightShot: { color: '#2196F3', icon: '➡️', name: 'Straight Shot' },
  doubleShot: { color: '#9C27B0', icon: '↔️', name: 'Double Shot' },
  speedBoost: { color: '#4CAF50', icon: '⚡', name: 'Speed Boost' },
  slowMotion: { color: '#00BCD4', icon: '🐌', name: 'Slow Motion' },
  superJump: { color: '#FFEB3B', icon: '🦘', name: 'Super Jump' },
  invincibility: { color: '#E91E63', icon: '🛡️', name: 'Invincible' },
  knockback: { color: '#FF9800', icon: '💥', name: 'Knockback' },
  superman: { color: '#1976D2', icon: '🦸', name: 'Superman' },
};

const CAR_COLORS = ['#E53935', '#1E88E5', '#43A047', '#FDD835', '#8E24AA', '#FF6F00', '#00ACC1'];
const RAINBOW_COLORS = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

const generateClouds = (width) => Array.from({ length: 6 }, () => ({
  x: Math.random() * width * 1.5, y: Math.random() * 150 + 30, width: Math.random() * 80 + 60, speed: Math.random() * 0.5 + 0.2
}));

const generateHouses = (width) => Array.from({ length: 5 }, (_, i) => ({
  x: i * 400 + Math.random() * 100, width: Math.random() * 60 + 80, height: Math.random() * 40 + 80,
  color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 5)],
  roofColor: ['#C0392B', '#2C3E50', '#8E44AD', '#27AE60', '#E74C3C'][Math.floor(Math.random() * 5)],
}));

const generateTrees = (width) => Array.from({ length: 8 }, (_, i) => ({
  x: i * 300 + Math.random() * 150 + 50,
  height: Math.random() * 40 + 60,
  trunkWidth: Math.random() * 8 + 12,
  foliageType: Math.floor(Math.random() * 3), // 0=round, 1=pine, 2=oak
  foliageColor: ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A'][Math.floor(Math.random() * 5)],
}));

const generateWeatherParticles = (width, height, season) => Array.from({ length: GAME_CONFIG.WEATHER_PARTICLE_COUNT }, () => {
  const base = { x: Math.random() * width * 1.5, y: Math.random() * height, size: Math.random() * 4 + 2, speed: Math.random() * 2 + 1, wobble: Math.random() * Math.PI * 2, wobbleSpeed: Math.random() * 0.1 + 0.02 };
  switch (season) {
    case SEASONS.SPRING: return { ...base, size: 2, speed: Math.random() * 8 + 10, length: Math.random() * 15 + 10 };
    case SEASONS.SUMMER: return { ...base, size: Math.random() * 3 + 1, speed: Math.random() * 4 + 6, horizontal: Math.random() * 3 + 2 };
    case SEASONS.FALL: return { ...base, size: Math.random() * 8 + 6, speed: Math.random() * 2 + 1, rotation: Math.random() * 360, rotationSpeed: Math.random() * 5 - 2.5 };
    case SEASONS.WINTER: return { ...base, size: Math.random() * 4 + 2, speed: Math.random() * 1.5 + 0.5 };
    default: return base;
  }
});

const GameCanvas = React.forwardRef(({ isPlaying, onGameOver, onScoreUpdate }, ref) => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const initGame = useCallback(() => {
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT - GAME_CONFIG.PLAYER_HEIGHT;
    const randomSeason = Math.floor(Math.random() * 4);
    
    gameStateRef.current = {
      player: { x: GAME_CONFIG.PLAYER_X, y: groundY, vy: 0, isJumping: false, isOnGround: true, isFlying: false, moveLeft: false, moveRight: false },
      obstacles: [], mailboxes: [], mails: [], clouds: generateClouds(canvasSize.width), houses: generateHouses(canvasSize.width),
      trees: generateTrees(canvasSize.width), pedestrians: [], birds: [],
      hearts: [], roadHazards: [], powerups: [], activePowerups: {}, coins: [], rainbowPlatforms: [], leprechauns: [],
      score: 0, deliveries: 0, distance: 0, speed: GAME_CONFIG.INITIAL_SPEED, nextSpawnDistance: GAME_CONFIG.MIN_SPAWN_DISTANCE,
      lives: GAME_CONFIG.MAX_LIVES, isInvincible: false, invincibleTimer: 0, lastMailThrow: 0, particles: [],
      gameTime: 0, dayNightProgress: 0, cycleCount: 0, season: randomSeason,
      weatherParticles: generateWeatherParticles(canvasSize.width, canvasSize.height, randomSeason),
      isStorming: false, stormIntensity: 0, nextStormChange: Math.random() * 30 + 15,
      nextHeartSpawn: GAME_CONFIG.HEART_SPAWN_INTERVAL + Math.random() * 30,
      nextRoadHazard: GAME_CONFIG.ROAD_HAZARD_MIN_INTERVAL + Math.random() * (GAME_CONFIG.ROAD_HAZARD_MAX_INTERVAL - GAME_CONFIG.ROAD_HAZARD_MIN_INTERVAL),
      nextPowerupSpawn: GAME_CONFIG.POWERUP_SPAWN_INTERVAL + Math.random() * 15,
      nextLeprechaunSpawn: GAME_CONFIG.LEPRECHAUN_SPAWN_INTERVAL + Math.random() * 30,
      nextPedestrianSpawn: GAME_CONFIG.PEDESTRIAN_MIN_INTERVAL + Math.random() * (GAME_CONFIG.PEDESTRIAN_MAX_INTERVAL - GAME_CONFIG.PEDESTRIAN_MIN_INTERVAL),
      nextBirdSpawn: GAME_CONFIG.BIRD_MIN_INTERVAL + Math.random() * (GAME_CONFIG.BIRD_MAX_INTERVAL - GAME_CONFIG.BIRD_MIN_INTERVAL),
      rapidFireTimer: 0, rainbowPlatformTimer: 0,
    };
    lastTimeRef.current = performance.now();
  }, [canvasSize]);

  const spawnGameObject = useCallback(() => {
    const state = gameStateRef.current;
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
    const spawnX = canvasSize.width + 100;

    if (Math.random() < GAME_CONFIG.MAILBOX_SPAWN_CHANCE) {
      state.mailboxes.push({ x: spawnX, y: groundY - 80, width: 50, height: 80, hasDelivery: false });
    } else {
      const type = GAME_CONFIG.OBSTACLE_TYPES[Math.floor(Math.random() * GAME_CONFIG.OBSTACLE_TYPES.length)];
      let obs = { type, x: spawnX };
      switch (type) {
        case 'dog': obs = { ...obs, y: groundY - 40, width: 50, height: 40, frame: 0 }; break;
        case 'pylon': obs = { ...obs, y: groundY - 50, width: 25, height: 50 }; break;
        case 'hydrant': obs = { ...obs, y: groundY - 45, width: 30, height: 45 }; break;
        case 'trash': obs = { ...obs, y: groundY - 55, width: 40, height: 55 }; break;
        case 'baby': obs = { ...obs, y: groundY - 50, width: 55, height: 50 }; break;
        case 'basketball': obs = { ...obs, y: groundY - 35, width: 35, height: 35, bounce: 0 }; break;
        case 'child': obs = { ...obs, y: groundY - 45, width: 30, height: 45, frame: 0, shirtColor: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'][Math.floor(Math.random() * 4)] }; break;
        case 'trampoline': obs = { ...obs, y: groundY - 30, width: 60, height: 30, springPhase: 0 }; break;
        default: obs = { ...obs, y: groundY - 40, width: 40, height: 40 };
      }
      state.obstacles.push(obs);
    }
    state.nextSpawnDistance = Math.random() * (GAME_CONFIG.MAX_SPAWN_DISTANCE - GAME_CONFIG.MIN_SPAWN_DISTANCE) + GAME_CONFIG.MIN_SPAWN_DISTANCE;
  }, [canvasSize]);

  const spawnHeart = useCallback(() => {
    const state = gameStateRef.current;
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
    state.hearts.push({ x: canvasSize.width + 50, y: groundY - 120 - Math.random() * 60, width: 30, height: 30, pulse: 0 });
  }, [canvasSize]);

  const spawnRoadHazard = useCallback(() => {
    const state = gameStateRef.current;
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
    const goingRight = Math.random() > 0.5;
    const type = GAME_CONFIG.ROAD_HAZARD_TYPES[Math.floor(Math.random() * GAME_CONFIG.ROAD_HAZARD_TYPES.length)];
    let hazard = { type, x: goingRight ? -150 : canvasSize.width + 150, y: groundY + 20, speed: (Math.random() * 5 + 10) * (goingRight ? 1 : -1), rotation: 0 };
    switch (type) {
      case 'car': hazard = { ...hazard, width: 120, height: 50, color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)] }; soundManager.playCarHorn(); break;
      case 'tire': hazard = { ...hazard, y: groundY + 5, width: 40, height: 40, bouncePhase: 0 }; break;
      case 'tumbleweed': hazard = { ...hazard, y: groundY - 10, width: 50, height: 50, speed: hazard.speed * 0.7 }; break;
      case 'biker': hazard = { ...hazard, width: 60, height: 60, pedalPhase: 0, color: ['#E53935', '#1E88E5', '#43A047', '#FDD835'][Math.floor(Math.random() * 4)] }; break;
      default: break;
    }
    state.roadHazards.push(hazard);
  }, [canvasSize]);

  const spawnPowerup = useCallback(() => {
    const state = gameStateRef.current;
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
    const type = GAME_CONFIG.POWERUP_TYPES[Math.floor(Math.random() * GAME_CONFIG.POWERUP_TYPES.length)];
    state.powerups.push({ type, x: canvasSize.width + 50, y: groundY - 100 - Math.random() * 80, width: 40, height: 40, pulse: 0, rotation: 0 });
  }, [canvasSize]);

  const spawnLeprechaun = useCallback(() => {
    const state = gameStateRef.current;
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
    state.leprechauns.push({ x: canvasSize.width + 50, y: groundY - 50, width: 40, height: 50, frame: 0, hits: 0, maxHits: 3 });
  }, [canvasSize]);

  const spawnPedestrian = useCallback(() => {
    const state = gameStateRef.current;
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
    const goingRight = Math.random() > 0.5;
    const pedestrianTypes = ['man', 'woman', 'jogger', 'elderly'];
    const type = pedestrianTypes[Math.floor(Math.random() * pedestrianTypes.length)];
    state.pedestrians.push({
      type,
      x: goingRight ? -50 : canvasSize.width + 50,
      y: groundY - 55,
      speed: (Math.random() * 1.5 + 1.5) * (goingRight ? 1 : -1),
      frame: 0,
      shirtColor: ['#E53935', '#1E88E5', '#43A047', '#FDD835', '#8E24AA', '#FF6F00'][Math.floor(Math.random() * 6)],
      pantsColor: ['#1565C0', '#5D4037', '#37474F', '#6D4C41'][Math.floor(Math.random() * 4)],
      skinTone: ['#FFCC80', '#E0AC69', '#C68642', '#8D5524'][Math.floor(Math.random() * 4)],
    });
  }, [canvasSize]);

  const spawnBird = useCallback(() => {
    const state = gameStateRef.current;
    const goingRight = Math.random() > 0.5;
    const birdTypes = ['small', 'large', 'flock'];
    const type = birdTypes[Math.floor(Math.random() * birdTypes.length)];
    const y = Math.random() * 150 + 50;
    
    if (type === 'flock') {
      // Spawn a small flock of 3-5 birds
      const count = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < count; i++) {
        state.birds.push({
          type: 'small',
          x: (goingRight ? -30 : canvasSize.width + 30) - i * 25,
          y: y + Math.sin(i) * 20,
          speed: (Math.random() * 2 + 3) * (goingRight ? 1 : -1),
          wingPhase: Math.random() * Math.PI * 2,
          color: '#37474F',
        });
      }
    } else {
      state.birds.push({
        type,
        x: goingRight ? -30 : canvasSize.width + 30,
        y,
        speed: (Math.random() * 2 + (type === 'large' ? 2 : 3)) * (goingRight ? 1 : -1),
        wingPhase: Math.random() * Math.PI * 2,
        color: type === 'large' ? '#5D4037' : '#37474F',
      });
    }
  }, [canvasSize]);

  const spawnRainbowPlatforms = useCallback(() => {
    const state = gameStateRef.current;
    state.rainbowPlatforms = [];
    // Create a series of rainbow platforms at different heights
    for (let i = 0; i < 8; i++) {
      state.rainbowPlatforms.push({
        x: 200 + i * 250 + Math.random() * 100,
        y: 150 + Math.sin(i * 0.8) * 80 + Math.random() * 50,
        width: 120,
        height: 20,
        colorIndex: i % 7,
        wobble: Math.random() * Math.PI * 2,
      });
    }
    state.rainbowPlatformTimer = GAME_CONFIG.RAINBOW_PLATFORM_DURATION;
  }, []);

  const spawnCoins = useCallback((x, y, count = 15) => {
    const state = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      state.coins.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 15 - 5,
        rotation: Math.random() * 360,
        life: 1,
      });
    }
    soundManager.playCoin();
  }, []);

  const activatePowerup = useCallback((type) => {
    const state = gameStateRef.current;
    state.activePowerups[type] = GAME_CONFIG.POWERUP_DURATION;
    if (type === 'superman') {
      state.player.isFlying = true;
      soundManager.playFlyWhoosh();
    } else {
      soundManager.playHeal();
    }
  }, []);

  const addParticles = useCallback((x, y, color, count = 10) => {
    const state = gameStateRef.current;
    if (!state) return;
    for (let i = 0; i < count; i++) {
      state.particles.push({ x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10 - 5, size: Math.random() * 8 + 4, color, life: 1 });
    }
  }, []);

  const throwMail = useCallback((backward = false, downward = false) => {
    const state = gameStateRef.current;
    if (!state) return;
    const hasStraightShot = state.activePowerups.straightShot > 0;
    const hasKnockback = state.activePowerups.knockback > 0;
    
    let vx = backward ? -10 : 12;
    let vy = hasStraightShot ? 0 : -8;
    
    if (downward && state.player.isFlying) {
      vx = 2;
      vy = 15; // Throw downward
    }
    
    state.mails.push({ 
      x: state.player.x + (backward ? -10 : GAME_CONFIG.PLAYER_WIDTH), 
      y: state.player.y + 20, 
      vx, 
      vy, 
      rotation: 0, 
      knockback: hasKnockback,
      isStraight: hasStraightShot  // Mark as straight shot to prevent gravity
    });
    if (!backward) soundManager.playThrow();
  }, []);

  const doThrowMail = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) return;
    const now = Date.now();
    const hasRapidFire = state.activePowerups.rapidFire > 0;
    const cooldown = hasRapidFire ? 100 : 300;
    if (now - state.lastMailThrow < cooldown) return;
    
    // If flying (superman), throw downward
    if (state.player.isFlying) {
      throwMail(false, true);
    } else {
      throwMail(false, false);
    }
    
    if (state.activePowerups.doubleShot > 0) throwMail(true, false);
    state.lastMailThrow = now;
  }, [throwMail]);

  const jump = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) return;
    
    // If flying, move up
    if (state.player.isFlying) {
      state.player.vy = -10;
      return;
    }
    
    // Normal jump or from rainbow platform
    if (state.player.isOnGround || state.player.onPlatform) {
      const hasSuperJump = state.activePowerups.superJump > 0;
      state.player.vy = hasSuperJump ? GAME_CONFIG.JUMP_FORCE * 1.5 : GAME_CONFIG.JUMP_FORCE;
      state.player.isJumping = true;
      state.player.isOnGround = false;
      state.player.onPlatform = false;
      soundManager.playJump();
    }
  }, []);

  // Cut jump short when key is released (variable jump height)
  const releaseJump = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) return;
    // If player is rising (vy < 0) and jumping, reduce upward velocity
    if (state.player.isJumping && state.player.vy < -5) {
      state.player.vy = -5; // Cap upward velocity to give control
    }
  }, []);

  useImperativeHandle(ref, () => ({ jump: () => jump(), throwMail: () => doThrowMail(), releaseJump: () => releaseJump() }), [jump, doThrowMail, releaseJump]);

  useEffect(() => {
    if (!isPlaying) return;
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
      if (e.code === 'KeyE') { e.preventDefault(); doThrowMail(); }
      // Superman: S to descend
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        const state = gameStateRef.current;
        if (state && state.player.isFlying) {
          e.preventDefault();
          state.player.vy = 10;
        }
      }
    };
    const handleKeyUp = (e) => {
      // Variable jump height - release to stop rising
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        releaseJump();
      }
    };
    const handleClick = (e) => { if (window.matchMedia('(pointer: fine)').matches) doThrowMail(); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('click', handleClick);
    return () => { 
      window.removeEventListener('keydown', handleKeyDown); 
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('click', handleClick); 
    };
  }, [isPlaying, jump, doThrowMail, releaseJump]);

  const hexToRgb = (hex) => { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r ? `rgb(${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)})` : hex; };
  const lerpColor = (c1, c2, t) => { const a = c1.match(/\d+/g).map(Number), b = c2.match(/\d+/g).map(Number); return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(a[1] + (b[1] - a[1]) * t)}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`; };

  const drawObstacle = (ctx, obs, state) => {
    switch (obs.type) {
      case 'dog':
        ctx.fillStyle = '#8D6E63'; ctx.fillRect(obs.x, obs.y + 10, 40, 25);
        ctx.beginPath(); ctx.arc(obs.x + 45, obs.y + 15, 12, 0, Math.PI * 2); ctx.fill();
        const legOff = Math.floor(obs.frame) * 5;
        ctx.fillRect(obs.x + 5, obs.y + 30, 8, 10 + legOff); ctx.fillRect(obs.x + 25, obs.y + 30, 8, 10 - legOff);
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(obs.x + 48, obs.y + 13, 2, 0, Math.PI * 2); ctx.fill();
        break;
      case 'pylon':
        ctx.fillStyle = '#FF6F00'; ctx.beginPath();
        ctx.moveTo(obs.x + obs.width / 2, obs.y); ctx.lineTo(obs.x + obs.width, obs.y + obs.height); ctx.lineTo(obs.x, obs.y + obs.height);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FFF'; ctx.fillRect(obs.x + 5, obs.y + 20, obs.width - 10, 8); ctx.fillRect(obs.x + 3, obs.y + 35, obs.width - 6, 8);
        break;
      case 'hydrant':
        ctx.fillStyle = '#C62828'; ctx.fillRect(obs.x + 5, obs.y, 20, obs.height); ctx.fillRect(obs.x, obs.y + 10, obs.width, 15);
        ctx.beginPath(); ctx.arc(obs.x + 15, obs.y, 10, 0, Math.PI * 2); ctx.fill();
        break;
      case 'trash':
        ctx.fillStyle = '#37474F'; ctx.fillRect(obs.x, obs.y + 10, obs.width, obs.height - 10); ctx.fillRect(obs.x - 3, obs.y, obs.width + 6, 12);
        ctx.beginPath(); ctx.arc(obs.x + obs.width / 2, obs.y, obs.width / 2 + 3, Math.PI, 0); ctx.fill();
        break;
      case 'baby':
        ctx.fillStyle = '#E91E63'; ctx.beginPath(); ctx.ellipse(obs.x + 27, obs.y + 25, 25, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#C2185B'; ctx.beginPath(); ctx.arc(obs.x + 15, obs.y + 15, 20, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#FFCC80'; ctx.beginPath(); ctx.arc(obs.x + 20, obs.y + 20, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(obs.x + 10, obs.y + 45, 8, 0, Math.PI * 2); ctx.arc(obs.x + 45, obs.y + 45, 8, 0, Math.PI * 2); ctx.fill();
        break;
      case 'basketball':
        const bounceOff = Math.sin(obs.bounce) * 5;
        ctx.fillStyle = '#FF5722'; ctx.beginPath(); ctx.arc(obs.x + 17, obs.y + 17 - bounceOff, 17, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#BF360C'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(obs.x + 17, obs.y + 17 - bounceOff, 17, 0, Math.PI * 2); ctx.stroke();
        break;
      case 'child':
        ctx.fillStyle = '#FFCC80'; ctx.beginPath(); ctx.arc(obs.x + 15, obs.y + 10, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5D4037'; ctx.beginPath(); ctx.arc(obs.x + 15, obs.y + 6, 10, Math.PI, 0); ctx.fill();
        ctx.fillStyle = obs.shirtColor || '#2196F3'; ctx.fillRect(obs.x + 5, obs.y + 18, 20, 15);
        ctx.fillStyle = '#1565C0'; ctx.fillRect(obs.x + 5, obs.y + 31, 20, 8);
        ctx.fillStyle = '#FFCC80'; const cLeg = Math.sin(obs.frame) * 3;
        ctx.fillRect(obs.x + 7, obs.y + 38, 6, 10 + cLeg); ctx.fillRect(obs.x + 17, obs.y + 38, 6, 10 - cLeg);
        break;
      case 'trampoline':
        // Frame
        ctx.fillStyle = '#37474F';
        ctx.fillRect(obs.x, obs.y + obs.height - 8, 8, 8);
        ctx.fillRect(obs.x + obs.width - 8, obs.y + obs.height - 8, 8, 8);
        // Legs
        ctx.fillRect(obs.x + 2, obs.y + obs.height - 8, 4, 12);
        ctx.fillRect(obs.x + obs.width - 6, obs.y + obs.height - 8, 4, 12);
        // Bouncy surface
        const springOffset = Math.sin(obs.springPhase) * 3;
        ctx.fillStyle = '#E91E63';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height - 8);
        ctx.quadraticCurveTo(obs.x + obs.width / 2, obs.y + springOffset, obs.x + obs.width, obs.y + obs.height - 8);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height - 5);
        ctx.quadraticCurveTo(obs.x + obs.width / 2, obs.y + springOffset + 5, obs.x, obs.y + obs.height - 5);
        ctx.closePath();
        ctx.fill();
        // Springs
        ctx.strokeStyle = '#9E9E9E'; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const sx = obs.x + 10 + i * 14;
          ctx.beginPath(); ctx.moveTo(sx, obs.y + obs.height - 5); ctx.lineTo(sx, obs.y + obs.height + 4); ctx.stroke();
        }
        break;
      default:
        ctx.fillStyle = '#757575'; ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }
  };

  const drawRoadHazard = (ctx, hazard) => {
    const dir = hazard.speed > 0 ? 1 : -1;
    ctx.save();
    switch (hazard.type) {
      case 'car':
        if (dir < 0) { ctx.translate(hazard.x + hazard.width, hazard.y); ctx.scale(-1, 1); ctx.translate(0, -hazard.y); }
        const dx = dir < 0 ? 0 : hazard.x;
        ctx.fillStyle = hazard.color; ctx.beginPath(); ctx.roundRect(dx, hazard.y - 20, hazard.width, 35, 5); ctx.fill();
        ctx.beginPath(); ctx.roundRect(dx + 25, hazard.y - 45, 60, 28, 8); ctx.fill();
        ctx.fillStyle = '#81D4FA'; ctx.beginPath(); ctx.roundRect(dx + 30, hazard.y - 42, 22, 20, 3); ctx.fill();
        ctx.beginPath(); ctx.roundRect(dx + 58, hazard.y - 42, 22, 20, 3); ctx.fill();
        ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(dx + 25, hazard.y + 15, 12, 0, Math.PI * 2); ctx.arc(dx + hazard.width - 25, hazard.y + 15, 12, 0, Math.PI * 2); ctx.fill();
        break;
      case 'tire':
        const tireY = hazard.y + Math.sin(hazard.bouncePhase) * 15;
        ctx.translate(hazard.x + 20, tireY); ctx.rotate(hazard.rotation);
        ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#616161'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
        break;
      case 'tumbleweed':
        ctx.translate(hazard.x + 25, hazard.y + 25); ctx.rotate(hazard.rotation);
        ctx.fillStyle = '#8B7355'; ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6D5D4D'; ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); ctx.lineTo(Math.cos(a + 0.3) * 25, Math.sin(a + 0.3) * 25); ctx.stroke(); }
        break;
      case 'biker':
        if (dir < 0) { ctx.translate(hazard.x + hazard.width, hazard.y); ctx.scale(-1, 1); ctx.translate(0, -hazard.y); }
        const bx = dir < 0 ? 0 : hazard.x;
        ctx.strokeStyle = hazard.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(bx + 15, hazard.y - 10); ctx.lineTo(bx + 35, hazard.y - 25); ctx.lineTo(bx + 45, hazard.y - 10); ctx.stroke();
        ctx.strokeStyle = '#333'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(bx + 15, hazard.y, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(bx + 45, hazard.y, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#FFCC80'; ctx.beginPath(); ctx.arc(bx + 35, hazard.y - 48, 8, 0, Math.PI * 2); ctx.fill();
        break;
      default: break;
    }
    ctx.restore();
  };

  const drawLeprechaun = (ctx, lep) => {
    ctx.save();
    ctx.translate(lep.x + lep.width / 2, lep.y + lep.height / 2);
    
    // Body (green coat)
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(-15, -5, 30, 30);
    
    // Head
    ctx.fillStyle = '#FFCC80';
    ctx.beginPath(); ctx.arc(0, -15, 12, 0, Math.PI * 2); ctx.fill();
    
    // Beard (orange)
    ctx.fillStyle = '#FF6D00';
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.quadraticCurveTo(0, 10, 10, -8);
    ctx.fill();
    
    // Hat
    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(-15, -30, 30, 8);
    ctx.fillRect(-10, -45, 20, 18);
    // Hat buckle
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-5, -38, 10, 8);
    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(-2, -36, 4, 4);
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-4, -18, 2, 0, Math.PI * 2); ctx.arc(4, -18, 2, 0, Math.PI * 2); ctx.fill();
    
    // Smile
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, -12, 5, 0.2, Math.PI - 0.2); ctx.stroke();
    
    // Legs
    ctx.fillStyle = '#1B5E20';
    const legAnim = Math.sin(lep.frame) * 3;
    ctx.fillRect(-12, 22, 8, 12 + legAnim);
    ctx.fillRect(4, 22, 8, 12 - legAnim);
    
    // Shoes (with buckle)
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(-14, 32 + legAnim, 12, 6);
    ctx.fillRect(2, 32 - legAnim, 12, 6);
    
    // Hit indicator
    if (lep.hits > 0) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.beginPath(); ctx.arc(0, 0, 30 + lep.hits * 10, 0, Math.PI * 2); ctx.fill();
    }
    
    ctx.restore();
  };

  const drawRainbowPlatform = (ctx, platform) => {
    const wobbleY = Math.sin(platform.wobble) * 3;
    
    // Glow
    ctx.fillStyle = RAINBOW_COLORS[platform.colorIndex] + '40';
    ctx.beginPath();
    ctx.roundRect(platform.x - 5, platform.y + wobbleY - 5, platform.width + 10, platform.height + 10, 15);
    ctx.fill();
    
    // Platform
    const gradient = ctx.createLinearGradient(platform.x, platform.y, platform.x + platform.width, platform.y);
    gradient.addColorStop(0, RAINBOW_COLORS[platform.colorIndex]);
    gradient.addColorStop(0.5, RAINBOW_COLORS[(platform.colorIndex + 1) % 7]);
    gradient.addColorStop(1, RAINBOW_COLORS[(platform.colorIndex + 2) % 7]);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(platform.x, platform.y + wobbleY, platform.width, platform.height, 10);
    ctx.fill();
    
    // Sparkles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 3; i++) {
      const sx = platform.x + 20 + i * 40;
      const sy = platform.y + wobbleY + 10 + Math.sin(platform.wobble + i) * 5;
      ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
    }
  };

  const drawCoin = (ctx, coin) => {
    ctx.save();
    ctx.translate(coin.x, coin.y);
    ctx.rotate((coin.rotation * Math.PI) / 180);
    ctx.globalAlpha = coin.life;
    
    // Gold coin
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
    
    // Shine
    ctx.fillStyle = '#FFF59D';
    ctx.beginPath(); ctx.ellipse(-3, -3, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    
    // Dollar sign
    ctx.fillStyle = '#B8860B';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0);
    
    ctx.restore();
  };

  const drawActivePowerups = (ctx, state, canvasWidth) => {
    const active = Object.entries(state.activePowerups).filter(([_, t]) => t > 0);
    if (active.length === 0) return;
    let y = 100;
    active.forEach(([type, timeLeft]) => {
      const config = POWERUP_CONFIG[type];
      const barWidth = 120, progress = timeLeft / GAME_CONFIG.POWERUP_DURATION;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(canvasWidth - barWidth - 20, y, barWidth, 30, 5); ctx.fill();
      ctx.fillStyle = config.color; ctx.beginPath(); ctx.roundRect(canvasWidth - barWidth - 18, y + 2, (barWidth - 4) * progress, 26, 4); ctx.fill();
      ctx.fillStyle = '#FFF'; ctx.font = '14px Arial'; ctx.textAlign = 'left';
      ctx.fillText(`${config.icon} ${Math.ceil(timeLeft)}s`, canvasWidth - barWidth - 12, y + 20);
      y += 35;
    });
  };

  const drawTree = (ctx, tree, groundY, nightAmount) => {
    const baseY = groundY - 30;
    const trunkHeight = tree.height * 0.4;
    
    // Trunk
    ctx.fillStyle = nightAmount > 0.5 ? '#4E342E' : '#5D4037';
    ctx.fillRect(tree.x - tree.trunkWidth / 2, baseY - trunkHeight, tree.trunkWidth, trunkHeight);
    
    // Foliage - adjust color for night
    const foliageColor = nightAmount > 0.5 
      ? '#1B5E20' 
      : tree.foliageColor;
    
    ctx.fillStyle = foliageColor;
    
    switch (tree.foliageType) {
      case 0: // Round tree
        ctx.beginPath();
        ctx.arc(tree.x, baseY - trunkHeight - tree.height * 0.35, tree.height * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Second layer
        ctx.beginPath();
        ctx.arc(tree.x - tree.height * 0.2, baseY - trunkHeight - tree.height * 0.2, tree.height * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tree.x + tree.height * 0.2, baseY - trunkHeight - tree.height * 0.2, tree.height * 0.25, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 1: // Pine tree
        ctx.beginPath();
        ctx.moveTo(tree.x, baseY - tree.height);
        ctx.lineTo(tree.x - tree.height * 0.35, baseY - trunkHeight);
        ctx.lineTo(tree.x + tree.height * 0.35, baseY - trunkHeight);
        ctx.closePath();
        ctx.fill();
        // Second layer
        ctx.beginPath();
        ctx.moveTo(tree.x, baseY - tree.height + tree.height * 0.15);
        ctx.lineTo(tree.x - tree.height * 0.28, baseY - trunkHeight - tree.height * 0.2);
        ctx.lineTo(tree.x + tree.height * 0.28, baseY - trunkHeight - tree.height * 0.2);
        ctx.closePath();
        ctx.fill();
        break;
      case 2: // Oak tree (fluffy)
        const cx = tree.x;
        const cy = baseY - trunkHeight - tree.height * 0.3;
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const r = tree.height * 0.25;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(angle) * r * 0.5, cy + Math.sin(angle) * r * 0.3, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(cx, cy, tree.height * 0.28, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        break;
    }
  };

  const drawPedestrian = (ctx, ped) => {
    ctx.save();
    const dir = ped.speed > 0 ? 1 : -1;
    if (dir < 0) {
      ctx.translate(ped.x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-ped.x, 0);
    }
    
    const walkAnim = Math.sin(ped.frame) * 4;
    
    // Head
    ctx.fillStyle = ped.skinTone;
    ctx.beginPath();
    ctx.arc(ped.x, ped.y + 8, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Hair
    ctx.fillStyle = ped.type === 'elderly' ? '#9E9E9E' : '#5D4037';
    if (ped.type === 'woman') {
      ctx.beginPath();
      ctx.arc(ped.x, ped.y + 5, 9, Math.PI, 0);
      ctx.fill();
      // Long hair
      ctx.fillRect(ped.x - 9, ped.y + 5, 4, 15);
      ctx.fillRect(ped.x + 5, ped.y + 5, 4, 15);
    } else {
      ctx.beginPath();
      ctx.arc(ped.x, ped.y + 5, 8, Math.PI + 0.3, -0.3);
      ctx.fill();
    }
    
    // Body/shirt
    ctx.fillStyle = ped.shirtColor;
    ctx.fillRect(ped.x - 8, ped.y + 15, 16, 20);
    
    // Arms
    ctx.fillStyle = ped.skinTone;
    ctx.save();
    ctx.translate(ped.x - 10, ped.y + 18);
    ctx.rotate(Math.sin(ped.frame) * 0.3);
    ctx.fillRect(-2, 0, 4, 12);
    ctx.restore();
    ctx.save();
    ctx.translate(ped.x + 10, ped.y + 18);
    ctx.rotate(-Math.sin(ped.frame) * 0.3);
    ctx.fillRect(-2, 0, 4, 12);
    ctx.restore();
    
    // Pants
    ctx.fillStyle = ped.pantsColor;
    ctx.fillRect(ped.x - 8, ped.y + 33, 7, 15 + walkAnim);
    ctx.fillRect(ped.x + 1, ped.y + 33, 7, 15 - walkAnim);
    
    // Jogger extras
    if (ped.type === 'jogger') {
      // Headband
      ctx.fillStyle = '#E91E63';
      ctx.fillRect(ped.x - 8, ped.y + 2, 16, 3);
    }
    
    // Elderly extras
    if (ped.type === 'elderly') {
      // Walking cane
      ctx.strokeStyle = '#6D4C41';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ped.x + 12, ped.y + 20);
      ctx.lineTo(ped.x + 18, ped.y + 55);
      ctx.stroke();
      // Cane handle
      ctx.beginPath();
      ctx.arc(ped.x + 12, ped.y + 18, 4, Math.PI, 0);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  const drawBird = (ctx, bird) => {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    
    const dir = bird.speed > 0 ? 1 : -1;
    if (dir < 0) {
      ctx.scale(-1, 1);
    }
    
    const wingY = Math.sin(bird.wingPhase) * 8;
    const size = bird.type === 'large' ? 1.5 : 1;
    
    ctx.fillStyle = bird.color;
    
    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 8 * size, 5 * size, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.arc(10 * size, -2 * size, 4 * size, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak
    ctx.fillStyle = '#FF8F00';
    ctx.beginPath();
    ctx.moveTo(14 * size, -2 * size);
    ctx.lineTo(18 * size, 0);
    ctx.lineTo(14 * size, 1 * size);
    ctx.closePath();
    ctx.fill();
    
    // Wings
    ctx.fillStyle = bird.color;
    ctx.beginPath();
    ctx.moveTo(-2 * size, 0);
    ctx.quadraticCurveTo(-8 * size, wingY - 5 * size, -12 * size, wingY);
    ctx.quadraticCurveTo(-8 * size, wingY + 3 * size, -2 * size, 2 * size);
    ctx.closePath();
    ctx.fill();
    
    // Tail
    ctx.beginPath();
    ctx.moveTo(-8 * size, 0);
    ctx.lineTo(-15 * size, -3 * size);
    ctx.lineTo(-15 * size, 3 * size);
    ctx.closePath();
    ctx.fill();
    
    // Eye
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(11 * size, -3 * size, 2 * size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(11.5 * size, -3 * size, 1 * size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  // Main game loop
  useEffect(() => {
    if (!canvasRef.current || canvasSize.width === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    initGame();

    const gameLoop = (currentTime) => {
      let deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      
      // Cap deltaTime to prevent speed spikes on high refresh rate displays or lag
      // This ensures consistent game speed across all devices
      const maxDeltaTime = 1 / GAME_CONFIG.TARGET_FPS;
      deltaTime = Math.min(deltaTime, maxDeltaTime * 2); // Cap at 2x target frame time
      
      if (!isPlaying) { animationRef.current = requestAnimationFrame(gameLoop); return; }
      const state = gameStateRef.current;
      if (!state) { animationRef.current = requestAnimationFrame(gameLoop); return; }
      
      const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
      const hasSpeedBoost = state.activePowerups.speedBoost > 0;
      const hasSlowMotion = state.activePowerups.slowMotion > 0;
      const speedMod = hasSpeedBoost ? 1.5 : hasSlowMotion ? 0.5 : 1;
      const hasInvincibility = state.activePowerups.invincibility > 0;
      
      // Normalize speed calculations to target FPS for consistent gameplay
      const frameMultiplier = deltaTime * GAME_CONFIG.TARGET_FPS;

      // Update powerup timers
      Object.keys(state.activePowerups).forEach(key => {
        if (state.activePowerups[key] > 0) {
          state.activePowerups[key] -= deltaTime;
          if (state.activePowerups[key] <= 0 && key === 'superman') {
            state.player.isFlying = false;
          }
        }
      });

      // Rainbow platform timer
      if (state.rainbowPlatformTimer > 0) {
        state.rainbowPlatformTimer -= deltaTime;
        if (state.rainbowPlatformTimer <= 0) {
          state.rainbowPlatforms = [];
        }
      }

      // Rapid fire
      if (state.activePowerups.rapidFire > 0) {
        state.rapidFireTimer -= deltaTime;
        if (state.rapidFireTimer <= 0) {
          const now = Date.now();
          if (now - state.lastMailThrow >= 100) {
            if (state.player.isFlying) throwMail(false, true); else throwMail(false, false);
            if (state.activePowerups.doubleShot > 0) throwMail(true, false);
            state.lastMailThrow = now;
          }
          state.rapidFireTimer = 0.1;
        }
      }

      // Time & Weather
      state.gameTime += deltaTime;
      state.dayNightProgress = (state.gameTime % GAME_CONFIG.DAY_NIGHT_CYCLE_DURATION) / GAME_CONFIG.DAY_NIGHT_CYCLE_DURATION;
      const newCycleCount = Math.floor(state.gameTime / GAME_CONFIG.DAY_NIGHT_CYCLE_DURATION);
      if (newCycleCount > state.cycleCount) {
        state.cycleCount = newCycleCount;
        const newSeason = Math.floor(state.cycleCount / GAME_CONFIG.CYCLES_PER_SEASON) % 4;
        if (newSeason !== state.season) { state.season = newSeason; state.weatherParticles = generateWeatherParticles(canvasSize.width, canvasSize.height, state.season); }
      }
      state.nextStormChange -= deltaTime;
      if (state.nextStormChange <= 0) { state.isStorming = !state.isStorming; state.nextStormChange = Math.random() * 30 + (state.isStorming ? 10 : 20); }
      state.stormIntensity += ((state.isStorming ? 1 : 0) - state.stormIntensity) * 0.02;
      
      state.weatherParticles.forEach(p => {
        p.wobble += p.wobbleSpeed;
        switch (state.season) {
          case SEASONS.SPRING: p.y += p.speed * state.stormIntensity; p.x -= 1; break;
          case SEASONS.SUMMER: p.y += p.speed * 0.3 * state.stormIntensity; p.x -= p.horizontal * state.stormIntensity; break;
          case SEASONS.FALL: p.y += p.speed * state.stormIntensity; p.x -= (2 + Math.sin(p.wobble) * 2) * state.stormIntensity; p.rotation += p.rotationSpeed * state.stormIntensity; break;
          case SEASONS.WINTER: p.y += p.speed * state.stormIntensity; p.x += Math.sin(p.wobble) * 0.5 * state.stormIntensity; break;
          default: break;
        }
        if (p.y > canvasSize.height || p.x < -50) { p.x = Math.random() * canvasSize.width * 1.5; p.y = -20; }
      });

      // Spawning
      state.nextHeartSpawn -= deltaTime;
      if (state.nextHeartSpawn <= 0 && state.lives < GAME_CONFIG.MAX_LIVES) { spawnHeart(); state.nextHeartSpawn = GAME_CONFIG.HEART_SPAWN_INTERVAL + Math.random() * 30; }
      state.nextRoadHazard -= deltaTime;
      if (state.nextRoadHazard <= 0) { spawnRoadHazard(); state.nextRoadHazard = GAME_CONFIG.ROAD_HAZARD_MIN_INTERVAL + Math.random() * (GAME_CONFIG.ROAD_HAZARD_MAX_INTERVAL - GAME_CONFIG.ROAD_HAZARD_MIN_INTERVAL); }
      state.nextPowerupSpawn -= deltaTime;
      if (state.nextPowerupSpawn <= 0) { spawnPowerup(); state.nextPowerupSpawn = GAME_CONFIG.POWERUP_SPAWN_INTERVAL + Math.random() * 15; }
      state.nextLeprechaunSpawn -= deltaTime;
      if (state.nextLeprechaunSpawn <= 0) { spawnLeprechaun(); state.nextLeprechaunSpawn = GAME_CONFIG.LEPRECHAUN_SPAWN_INTERVAL + Math.random() * 30; }
      state.nextPedestrianSpawn -= deltaTime;
      if (state.nextPedestrianSpawn <= 0) { spawnPedestrian(); state.nextPedestrianSpawn = GAME_CONFIG.PEDESTRIAN_MIN_INTERVAL + Math.random() * (GAME_CONFIG.PEDESTRIAN_MAX_INTERVAL - GAME_CONFIG.PEDESTRIAN_MIN_INTERVAL); }
      state.nextBirdSpawn -= deltaTime;
      if (state.nextBirdSpawn <= 0) { spawnBird(); state.nextBirdSpawn = GAME_CONFIG.BIRD_MIN_INTERVAL + Math.random() * (GAME_CONFIG.BIRD_MAX_INTERVAL - GAME_CONFIG.BIRD_MIN_INTERVAL); }

      // Game mechanics - Apply frameMultiplier for frame-rate independence
      state.speed = Math.min(GAME_CONFIG.MAX_SPEED, state.speed + GAME_CONFIG.SPEED_INCREMENT * frameMultiplier);
      const effectiveSpeed = state.speed * speedMod * frameMultiplier;
      state.distance += effectiveSpeed / 10;
      state.score += GAME_CONFIG.DISTANCE_POINTS * frameMultiplier;

      // Player horizontal movement (left/right positioning)
      if (state.player.moveLeft) {
        state.player.x -= 5 * frameMultiplier;
      }
      if (state.player.moveRight) {
        state.player.x += 5 * frameMultiplier;
      }
      // Constrain player to screen bounds
      state.player.x = Math.max(30, Math.min(canvasSize.width * 0.4, state.player.x));

      // Player physics - Apply frameMultiplier for consistent physics
      if (state.player.isFlying) {
        state.player.vy *= Math.pow(0.9, frameMultiplier); // Air resistance when flying
        state.player.y += state.player.vy * frameMultiplier;
        // Keep in bounds
        if (state.player.y < 50) { state.player.y = 50; state.player.vy = 0; }
        if (state.player.y > groundY - GAME_CONFIG.PLAYER_HEIGHT) { state.player.y = groundY - GAME_CONFIG.PLAYER_HEIGHT; state.player.vy = 0; }
      } else {
        state.player.vy += GAME_CONFIG.GRAVITY * frameMultiplier;
        state.player.vy = Math.min(state.player.vy, GAME_CONFIG.MAX_FALL_SPEED);
        state.player.y += state.player.vy * frameMultiplier;
      }

      // Ground collision
      const playerGroundY = groundY - GAME_CONFIG.PLAYER_HEIGHT;
      if (state.player.y >= playerGroundY && !state.player.isFlying) {
        state.player.y = playerGroundY;
        state.player.vy = 0;
        state.player.isOnGround = true;
        state.player.isJumping = false;
      }

      // Rainbow platform collision
      state.player.onPlatform = false;
      if (!state.player.isFlying && state.player.vy >= 0) {
        state.rainbowPlatforms.forEach(plat => {
          plat.x -= effectiveSpeed * 0.5;
          plat.wobble += 0.05;
          const platY = plat.y + Math.sin(plat.wobble) * 3;
          if (state.player.x + GAME_CONFIG.PLAYER_WIDTH > plat.x && state.player.x < plat.x + plat.width &&
              state.player.y + GAME_CONFIG.PLAYER_HEIGHT >= platY && state.player.y + GAME_CONFIG.PLAYER_HEIGHT <= platY + plat.height + 10) {
            state.player.y = platY - GAME_CONFIG.PLAYER_HEIGHT;
            state.player.vy = 0;
            state.player.isOnGround = false;
            state.player.onPlatform = true;
          }
        });
      }

      if (state.isInvincible) { state.invincibleTimer--; if (state.invincibleTimer <= 0) state.isInvincible = false; }

      state.nextSpawnDistance -= effectiveSpeed;
      if (state.nextSpawnDistance <= 0) spawnGameObject();

      // Update clouds
      state.clouds.forEach(c => { c.x -= c.speed; if (c.x + c.width < 0) { c.x = canvasSize.width + c.width; c.y = Math.random() * 150 + 30; } });

      // Update houses
      state.houses.forEach(h => { h.x -= effectiveSpeed * 0.3; if (h.x + h.width < 0) { h.x = canvasSize.width + Math.random() * 200; } });

      // Update trees
      state.trees.forEach(t => { t.x -= effectiveSpeed * 0.3; if (t.x < -50) { t.x = canvasSize.width + Math.random() * 200 + 50; } });

      // Update pedestrians (background, no collision)
      state.pedestrians = state.pedestrians.filter(ped => {
        ped.x += ped.speed;
        ped.frame += 0.15 * Math.abs(ped.speed);
        // Remove when off screen
        return ped.speed > 0 ? ped.x < canvasSize.width + 100 : ped.x > -100;
      });

      // Update birds
      state.birds = state.birds.filter(bird => {
        bird.x += bird.speed;
        bird.wingPhase += 0.3;
        // Remove when off screen
        return bird.speed > 0 ? bird.x < canvasSize.width + 100 : bird.x > -100;
      });

      // Update hearts
      state.hearts = state.hearts.filter(heart => {
        heart.x -= effectiveSpeed; heart.pulse += 0.1;
        const pb = { x: state.player.x, y: state.player.y, width: GAME_CONFIG.PLAYER_WIDTH, height: GAME_CONFIG.PLAYER_HEIGHT };
        if (pb.x < heart.x + heart.width && pb.x + pb.width > heart.x && pb.y < heart.y + heart.height && pb.y + pb.height > heart.y) {
          // Heal 2 lives (but don't exceed max)
          state.lives = Math.min(GAME_CONFIG.MAX_LIVES, state.lives + 2);
          soundManager.playHeal();
          addParticles(heart.x + 15, heart.y + 15, '#E91E63', 15);
          return false;
        }
        return heart.x > -50;
      });

      // Update powerups
      state.powerups = state.powerups.filter(pu => {
        pu.x -= effectiveSpeed; pu.pulse += 0.1; pu.rotation += 0.02;
        const pb = { x: state.player.x, y: state.player.y, width: GAME_CONFIG.PLAYER_WIDTH, height: GAME_CONFIG.PLAYER_HEIGHT };
        if (pb.x < pu.x + pu.width && pb.x + pb.width > pu.x && pb.y < pu.y + pu.height && pb.y + pb.height > pu.y) {
          activatePowerup(pu.type); addParticles(pu.x + 20, pu.y + 20, POWERUP_CONFIG[pu.type].color, 20);
          return false;
        }
        return pu.x > -50;
      });

      // Update leprechauns - simple kill for bonus points
      state.leprechauns = state.leprechauns.filter(lep => {
        lep.x -= effectiveSpeed; lep.frame += 0.15;
        const pb = { x: state.player.x, y: state.player.y, width: GAME_CONFIG.PLAYER_WIDTH, height: GAME_CONFIG.PLAYER_HEIGHT };
        // Check if player touches/jumps on leprechaun - instant kill for bonus
        if (pb.x + pb.width > lep.x && pb.x < lep.x + lep.width &&
            pb.y + pb.height > lep.y && pb.y < lep.y + lep.height) {
          soundManager.playLeprechaunLaugh();
          spawnCoins(lep.x + lep.width / 2, lep.y, 15);
          state.score += 500; // Big bonus!
          state.player.vy = -10; // Small bounce
          addParticles(lep.x + lep.width / 2, lep.y, '#FFD700', 20);
          return false;
        }
        return lep.x > -50;
      });

      // Update coins
      state.coins = state.coins.filter(coin => {
        coin.x += coin.vx; coin.y += coin.vy; coin.vy += 0.5; coin.rotation += 10; coin.life -= 0.015;
        // Collect coins
        const pb = { x: state.player.x, y: state.player.y, width: GAME_CONFIG.PLAYER_WIDTH, height: GAME_CONFIG.PLAYER_HEIGHT };
        if (coin.life > 0.3 && pb.x < coin.x + 10 && pb.x + pb.width > coin.x - 10 && pb.y < coin.y + 10 && pb.y + pb.height > coin.y - 10) {
          state.score += 10;
          soundManager.playCoin();
          return false;
        }
        return coin.life > 0;
      });

      // Update road hazards (no damage)
      state.roadHazards = state.roadHazards.filter(h => {
        h.x += h.speed * speedMod; h.rotation += Math.abs(h.speed) * 0.05;
        if (h.bouncePhase !== undefined) h.bouncePhase += 0.2;
        if (h.pedalPhase !== undefined) h.pedalPhase += 0.3;
        return h.speed > 0 ? h.x < canvasSize.width + 200 : h.x > -200;
      });

      // Update obstacles
      state.obstacles = state.obstacles.filter(obs => {
        obs.x -= effectiveSpeed;
        if (obs.type === 'dog') obs.frame = (obs.frame + 0.2) % 2;
        if (obs.type === 'basketball') obs.bounce += 0.15;
        if (obs.type === 'child') obs.frame += 0.1;
        if (obs.type === 'trampoline') obs.springPhase += 0.1;
        
        const pb = { x: state.player.x + 10, y: state.player.y + 10, width: GAME_CONFIG.PLAYER_WIDTH - 20, height: GAME_CONFIG.PLAYER_HEIGHT - 10 };
        
        // Trampoline special handling - only bounces, no damage
        if (obs.type === 'trampoline') {
          // Check if landing on top or touching (bouncing)
          if (pb.x + pb.width > obs.x && pb.x < obs.x + obs.width &&
              pb.y + pb.height >= obs.y && pb.y + pb.height <= obs.y + obs.height) {
            state.player.vy = -28; // Super bounce!
            obs.springPhase = 0;
            soundManager.playBoing();
            addParticles(obs.x + obs.width / 2, obs.y, '#E91E63', 10);
          }
          return obs.x + obs.width > -50;
        }
        
        // Regular obstacle collision
        if (!state.isInvincible && !hasInvincibility && !state.player.isFlying) {
          if (pb.x < obs.x + obs.width && pb.x + pb.width > obs.x && pb.y < obs.y + obs.height && pb.y + pb.height > obs.y) {
            state.lives--;
            state.isInvincible = true;
            state.invincibleTimer = 120;
            addParticles(state.player.x + GAME_CONFIG.PLAYER_WIDTH / 2, state.player.y + GAME_CONFIG.PLAYER_HEIGHT / 2, '#FF6B6B', 15);
            if (obs.type === 'dog') soundManager.playBark();
            else if (obs.type === 'baby') soundManager.playBabyCry();
            else soundManager.playThud();
            if (state.lives <= 0) { state.lives = 0; soundManager.stopMusic(); onGameOver(state.score, state.deliveries, Math.floor(state.distance)); }
          }
        }
        return obs.x + obs.width > -50;
      });

      // Update mailboxes
      state.mailboxes = state.mailboxes.filter(box => { box.x -= effectiveSpeed; return box.x + box.width > -50; });

      // Update mails
      state.mails = state.mails.filter(mail => {
        mail.x += mail.vx; mail.y += mail.vy;
        // Only apply gravity if NOT a straight shot
        if (!mail.isStraight) mail.vy += 0.5;
        mail.rotation += 15;
        for (let box of state.mailboxes) {
          if (!box.hasDelivery && mail.x + 20 > box.x - 10 && mail.x < box.x + box.width + 10 && mail.y + 20 > box.y - 10 && mail.y < box.y + box.height + 20) {
            box.hasDelivery = true; state.deliveries++; state.score += GAME_CONFIG.DELIVERY_POINTS;
            addParticles(box.x + box.width / 2, box.y, '#4ECDC4', 20); soundManager.playDelivery();
            return false;
          }
        }
        if (mail.knockback) {
          state.obstacles = state.obstacles.filter(obs => {
            if (mail.x + 20 > obs.x && mail.x < obs.x + obs.width && mail.y + 20 > obs.y && mail.y < obs.y + obs.height) {
              addParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#FF9800', 15); state.score += 25;
              return false;
            }
            return true;
          });
        }
        return mail.y < canvasSize.height && mail.x < canvasSize.width + 100 && mail.x > -50;
      });

      // Update particles
      state.particles = state.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= 0.02; return p.life > 0; });

      onScoreUpdate(state.score, state.deliveries, Math.floor(state.distance), state.lives);

      // ============ RENDERING ============
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      const seasonConfig = SEASON_CONFIG[state.season];
      const nightAmount = (Math.sin(state.dayNightProgress * Math.PI * 2 - Math.PI / 2) + 1) / 2;

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, lerpColor(hexToRgb(seasonConfig.skyDay[0]), hexToRgb(seasonConfig.skyNight[0]), nightAmount));
      skyGrad.addColorStop(1, lerpColor(hexToRgb(seasonConfig.skyDay[1]), hexToRgb(seasonConfig.skyNight[1]), nightAmount));
      ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvasSize.width, groundY);

      // Sun/Moon
      const cX = canvasSize.width - 100, cY = 50 + Math.sin(state.dayNightProgress * Math.PI * 2) * 30;
      if (nightAmount < 0.5) { ctx.fillStyle = `rgba(255, 217, 61, ${1 - nightAmount * 2})`; ctx.beginPath(); ctx.arc(cX, cY, 50, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillStyle = `rgba(230, 230, 250, ${(nightAmount - 0.5) * 2})`; ctx.beginPath(); ctx.arc(cX, cY, 40, 0, Math.PI * 2); ctx.fill(); }

      // Stars
      if (nightAmount > 0.3) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(nightAmount - 0.3) / 0.7 * 0.8})`;
        for (let i = 0; i < 50; i++) { ctx.beginPath(); ctx.arc((i * 137.5 + state.gameTime * 0.5) % canvasSize.width, (i * 97.3) % (groundY - 100) + 20, (Math.sin(state.gameTime * 2 + i) + 1) * 1.5 + 0.5, 0, Math.PI * 2); ctx.fill(); }
      }

      // Clouds
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * (1 - nightAmount * 0.5)})`;
      state.clouds.forEach(c => { ctx.beginPath(); ctx.ellipse(c.x, c.y, c.width / 2, c.width / 4, 0, 0, Math.PI * 2); ctx.fill(); });

      // Birds in the sky
      state.birds.forEach(bird => drawBird(ctx, bird));

      // Rainbow platforms
      state.rainbowPlatforms.forEach(p => drawRainbowPlatform(ctx, p));

      // Trees (behind houses)
      state.trees.forEach(tree => drawTree(ctx, tree, groundY, nightAmount));

      // Houses - FIXED WINDOWS
      state.houses.forEach(h => {
        const hb = groundY - 30;
        ctx.fillStyle = h.color; ctx.fillRect(h.x, hb - h.height, h.width, h.height);
        ctx.fillStyle = h.roofColor; ctx.beginPath(); ctx.moveTo(h.x - 10, hb - h.height); ctx.lineTo(h.x + h.width / 2, hb - h.height - 40); ctx.lineTo(h.x + h.width + 10, hb - h.height); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5D4037'; ctx.fillRect(h.x + h.width / 2 - 10, hb - 35, 20, 35);
        // Windows: dark/gray during day, warm yellow at night
        ctx.fillStyle = nightAmount > 0.4 ? `rgba(255, 220, 100, ${0.9})` : '#2C3E50';
        ctx.fillRect(h.x + 15, hb - h.height + 20, 20, 20);
        ctx.fillRect(h.x + h.width - 35, hb - h.height + 20, 20, 20);
        // Window frame
        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2;
        ctx.strokeRect(h.x + 15, hb - h.height + 20, 20, 20);
        ctx.strokeRect(h.x + h.width - 35, hb - h.height + 20, 20, 20);
        // Window cross
        ctx.beginPath(); ctx.moveTo(h.x + 25, hb - h.height + 20); ctx.lineTo(h.x + 25, hb - h.height + 40); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(h.x + 15, hb - h.height + 30); ctx.lineTo(h.x + 35, hb - h.height + 30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(h.x + h.width - 25, hb - h.height + 20); ctx.lineTo(h.x + h.width - 25, hb - h.height + 40); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(h.x + h.width - 35, hb - h.height + 30); ctx.lineTo(h.x + h.width - 15, hb - h.height + 30); ctx.stroke();
      });

      // Grass
      const grassGrad = ctx.createLinearGradient(0, groundY - 30, 0, groundY);
      grassGrad.addColorStop(0, lerpColor(hexToRgb(seasonConfig.grassColor[0]), 'rgb(40,60,40)', nightAmount * 0.5));
      grassGrad.addColorStop(1, lerpColor(hexToRgb(seasonConfig.grassColor[1]), 'rgb(30,50,30)', nightAmount * 0.5));
      ctx.fillStyle = grassGrad; ctx.fillRect(0, groundY - 30, canvasSize.width, 30);

      // Pedestrians walking on sidewalk (background)
      state.pedestrians.forEach(ped => drawPedestrian(ctx, ped));

      // Road
      ctx.fillStyle = nightAmount > 0.5 ? '#404040' : '#616161'; ctx.fillRect(0, groundY, canvasSize.width, GAME_CONFIG.GROUND_HEIGHT);
      ctx.fillStyle = '#FFD54F'; const mo = (state.distance * 5) % 80;
      for (let i = -1; i < canvasSize.width / 80 + 1; i++) ctx.fillRect(i * 80 - mo, groundY + GAME_CONFIG.GROUND_HEIGHT / 2 - 3, 40, 6);
      ctx.fillStyle = nightAmount > 0.5 ? '#909090' : '#BDBDBD'; ctx.fillRect(0, groundY - 5, canvasSize.width, 10);

      // Mailboxes
      state.mailboxes.forEach(box => {
        ctx.fillStyle = '#5D4037'; ctx.fillRect(box.x + 10, box.y, 10, box.height);
        ctx.fillStyle = box.hasDelivery ? '#4CAF50' : '#1565C0'; ctx.fillRect(box.x, box.y, box.width, 25);
        ctx.fillStyle = box.hasDelivery ? '#4CAF50' : '#F44336'; ctx.fillRect(box.x + box.width - 5, box.y + 5, 8, 15);
      });

      // Hearts & Powerups
      state.hearts.forEach(h => {
        const pulse = Math.sin(h.pulse) * 3, size = 15 + pulse;
        ctx.save(); ctx.translate(h.x + 15, h.y + 15);
        ctx.fillStyle = 'rgba(255, 100, 100, 0.3)'; ctx.beginPath(); ctx.arc(0, 0, size + 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#E91E63'; ctx.beginPath(); ctx.moveTo(0, size * 0.3);
        ctx.bezierCurveTo(-size, -size * 0.5, -size, size * 0.5, 0, size);
        ctx.bezierCurveTo(size, size * 0.5, size, -size * 0.5, 0, size * 0.3); ctx.fill();
        ctx.restore();
      });
      
      state.powerups.forEach(pu => {
        const config = POWERUP_CONFIG[pu.type], pulse = Math.sin(pu.pulse) * 4;
        ctx.save(); ctx.translate(pu.x + 20, pu.y + 20); ctx.rotate(pu.rotation);
        ctx.fillStyle = config.color + '40'; ctx.beginPath(); ctx.arc(0, 0, 30 + pulse, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = config.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 22 + pulse / 2, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = config.color; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFF'; ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(config.icon, 0, 0);
        ctx.restore();
      });

      // Leprechauns
      state.leprechauns.forEach(l => drawLeprechaun(ctx, l));

      // Coins
      state.coins.forEach(c => drawCoin(ctx, c));

      // Obstacles
      state.obstacles.forEach(o => drawObstacle(ctx, o, state));

      // Mails
      state.mails.forEach(mail => {
        ctx.save(); ctx.translate(mail.x + 10, mail.y + 7); ctx.rotate((mail.rotation * Math.PI) / 180);
        ctx.fillStyle = mail.knockback ? '#FF9800' : '#FFF'; ctx.fillRect(-10, -7, 20, 14);
        ctx.strokeStyle = mail.knockback ? '#E65100' : '#1565C0'; ctx.lineWidth = 2; ctx.strokeRect(-10, -7, 20, 14);
        ctx.beginPath(); ctx.moveTo(-10, -7); ctx.lineTo(0, 2); ctx.lineTo(10, -7); ctx.stroke();
        ctx.restore();
      });

      // Player
      const px = state.player.x, py = state.player.y;
      const flash = state.isInvincible && Math.floor(state.invincibleTimer / 5) % 2 === 0;
      
      // Shield effect
      if (hasInvincibility) {
        ctx.fillStyle = 'rgba(233, 30, 99, 0.3)'; ctx.beginPath(); ctx.arc(px + GAME_CONFIG.PLAYER_WIDTH / 2, py + GAME_CONFIG.PLAYER_HEIGHT / 2, 50, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#E91E63'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px + GAME_CONFIG.PLAYER_WIDTH / 2, py + GAME_CONFIG.PLAYER_HEIGHT / 2, 50, 0, Math.PI * 2); ctx.stroke();
      }
      
      // Superman flying effect
      if (state.player.isFlying) {
        // Cape
        ctx.fillStyle = '#C62828';
        ctx.beginPath();
        ctx.moveTo(px + 10, py + 25);
        ctx.quadraticCurveTo(px - 20, py + 50, px - 10, py + 80);
        ctx.lineTo(px + 40, py + 60);
        ctx.quadraticCurveTo(px + 30, py + 40, px + 40, py + 25);
        ctx.closePath();
        ctx.fill();
        // Wind lines
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(px - 30 - i * 20, py + 30 + i * 10);
          ctx.lineTo(px - 50 - i * 20, py + 30 + i * 10);
          ctx.stroke();
        }
      }
      
      if (!flash) {
        ctx.fillStyle = '#1A237E'; const legAnim = Math.sin(state.distance * 0.3) * (state.player.isOnGround && !state.player.isFlying ? 5 : 0);
        if (!state.player.isFlying) {
          ctx.fillRect(px + 10, py + 50, 12, 20 + legAnim); ctx.fillRect(px + 28, py + 50, 12, 20 - legAnim);
        } else {
          // Flying pose - legs together stretched back
          ctx.fillRect(px + 15, py + 50, 20, 8);
        }
        ctx.fillStyle = state.player.isFlying ? '#1565C0' : '#1976D2'; ctx.fillRect(px + 8, py + 25, 34, 30);
        ctx.fillStyle = '#FFD54F'; ctx.fillRect(px + 38, py + 30, 15, 20);
        ctx.fillStyle = '#FFF'; ctx.fillRect(px + 41, py + 35, 9, 10);
        ctx.fillStyle = '#FFCC80'; ctx.beginPath(); ctx.arc(px + 25, py + 15, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1976D2'; ctx.fillRect(px + 8, py + 5, 34, 8); ctx.fillRect(px + 12, py - 5, 26, 12);
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px + 20, py + 13, 2, 0, Math.PI * 2); ctx.arc(px + 30, py + 13, 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + 25, py + 18, 5, 0.2, Math.PI - 0.2); ctx.stroke();
        
        if (state.player.isFlying) {
          // Arms forward
          ctx.fillStyle = '#FFCC80';
          ctx.save(); ctx.translate(px + 45, py + 30); ctx.rotate(-0.3);
          ctx.fillRect(0, -5, 25, 10); ctx.restore();
        } else {
          ctx.save(); ctx.translate(px + 40, py + 35); ctx.rotate(state.lastMailThrow > Date.now() - 200 ? -0.5 : 0);
          ctx.fillStyle = '#FFCC80'; ctx.fillRect(0, -5, 15, 10); ctx.restore();
        }
      }

      // Road hazards (foreground - in front of player since they're on the road closer to camera)
      state.roadHazards.forEach(h => drawRoadHazard(ctx, h));

      // Weather
      if (state.isStorming && state.stormIntensity > 0.1) {
        const alpha = state.stormIntensity * 0.8;
        state.weatherParticles.forEach(p => {
          ctx.save();
          switch (state.season) {
            case SEASONS.SPRING: ctx.strokeStyle = `rgba(120, 180, 255, ${alpha})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 2, p.y + p.length); ctx.stroke(); break;
            case SEASONS.SUMMER: ctx.fillStyle = `rgba(210, 180, 140, ${alpha * 0.7})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); break;
            case SEASONS.FALL: ctx.translate(p.x, p.y); ctx.rotate((p.rotation * Math.PI) / 180); ctx.fillStyle = `rgba(${180 + (p.x % 40)}, ${60 + (p.y % 40)}, 0, ${alpha})`; ctx.beginPath(); ctx.moveTo(0, -p.size / 2); ctx.quadraticCurveTo(p.size / 2, 0, 0, p.size / 2); ctx.quadraticCurveTo(-p.size / 2, 0, 0, -p.size / 2); ctx.fill(); break;
            case SEASONS.WINTER: ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); break;
            default: break;
          }
          ctx.restore();
        });
      }

      // Storm overlay
      if (state.stormIntensity > 0.1) {
        ctx.fillStyle = state.season === SEASONS.WINTER ? `rgba(200,220,255,${state.stormIntensity * 0.15})` : state.season === SEASONS.SUMMER ? `rgba(255,220,180,${state.stormIntensity * 0.15})` : `rgba(100,100,120,${state.stormIntensity * 0.15})`;
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      }

      // Particles
      state.particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;

      // Active powerups
      drawActivePowerups(ctx, state, canvasSize.width);

      // Rainbow timer
      if (state.rainbowPlatformTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(10, canvasSize.height - 50, 150, 35, 5); ctx.fill();
        const rainbowGrad = ctx.createLinearGradient(15, 0, 145, 0);
        RAINBOW_COLORS.forEach((c, i) => rainbowGrad.addColorStop(i / 6, c));
        ctx.fillStyle = rainbowGrad; ctx.beginPath(); ctx.roundRect(15, canvasSize.height - 45, 140 * (state.rainbowPlatformTimer / GAME_CONFIG.RAINBOW_PLATFORM_DURATION), 25, 4); ctx.fill();
        ctx.fillStyle = '#FFF'; ctx.font = '12px Arial'; ctx.fillText(`🌈 ${Math.ceil(state.rainbowPlatformTimer)}s`, 20, canvasSize.height - 28);
      }

      // Season indicator
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(canvasSize.width - 140, canvasSize.height - 45, 130, 35);
      ctx.fillStyle = '#FFF'; ctx.font = '14px Nunito, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${seasonConfig.name} ${nightAmount > 0.5 ? '🌙' : '☀️'}`, canvasSize.width - 75, canvasSize.height - 22);
      if (state.isStorming) ctx.fillText(state.season === SEASONS.WINTER ? '❄️' : state.season === SEASONS.SUMMER ? '🏜️' : state.season === SEASONS.FALL ? '🍂' : '🌧️', canvasSize.width - 75, canvasSize.height - 5);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [canvasSize, isPlaying, initGame, spawnGameObject, spawnHeart, spawnRoadHazard, spawnPowerup, spawnLeprechaun, spawnPedestrian, spawnBird, spawnRainbowPlatforms, spawnCoins, activatePowerup, onGameOver, onScoreUpdate, addParticles, throwMail]);

  return <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="absolute inset-0 game-canvas" />;
});

export default GameCanvas;
