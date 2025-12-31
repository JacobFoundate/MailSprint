import React, { useRef, useEffect, useCallback, useState } from 'react';
import soundManager from '@/utils/SoundManager';

const GAME_CONFIG = {
  // Player
  PLAYER_WIDTH: 50,
  PLAYER_HEIGHT: 70,
  PLAYER_X: 100,
  JUMP_FORCE: -18,
  GRAVITY: 0.8,
  MAX_FALL_SPEED: 20,
  MAX_LIVES: 5,
  
  // Ground
  GROUND_HEIGHT: 100,
  
  // Game speed
  INITIAL_SPEED: 6,
  MAX_SPEED: 15,
  SPEED_INCREMENT: 0.001,
  
  // Spawning
  MIN_SPAWN_DISTANCE: 300,
  MAX_SPAWN_DISTANCE: 600,
  MAILBOX_SPAWN_CHANCE: 0.35,
  
  // Obstacles
  OBSTACLE_TYPES: ['dog', 'pylon', 'hydrant', 'trash', 'baby', 'basketball', 'child'],
  
  // Scoring
  DELIVERY_POINTS: 100,
  DISTANCE_POINTS: 1,
  
  // Time & Weather
  DAY_NIGHT_CYCLE_DURATION: 120,
  CYCLES_PER_SEASON: 15,
  WEATHER_PARTICLE_COUNT: 100,
  
  // Heart pickups
  HEART_SPAWN_INTERVAL: 120,
  
  // Road hazards (cars, tires, tumbleweeds, bikers)
  ROAD_HAZARD_MIN_INTERVAL: 15,
  ROAD_HAZARD_MAX_INTERVAL: 45,
  ROAD_HAZARD_TYPES: ['car', 'tire', 'tumbleweed', 'biker'],
  
  // Power-ups
  POWERUP_SPAWN_INTERVAL: 25, // Every 25-40 seconds
  POWERUP_DURATION: 30, // 30 seconds
  POWERUP_TYPES: [
    'rapidFire',      // Nonstop fire letters
    'straightShot',   // Letters fire straight
    'doubleShot',     // Fire behind you too
    'speedBoost',     // Move faster
    'slowMotion',     // Move slower (enemies too)
    'superJump',      // Jump higher
    'invincibility',  // Avoid damage
    'knockback',      // Letters knock obstacles away
  ],
};

// Seasons
const SEASONS = { SPRING: 0, SUMMER: 1, FALL: 2, WINTER: 3 };

const SEASON_CONFIG = {
  [SEASONS.SPRING]: {
    name: 'Spring',
    skyDay: ['#87CEEB', '#B0E0E6'],
    skyNight: ['#1a1a2e', '#16213e'],
    grassColor: ['#7CB342', '#558B2F'],
  },
  [SEASONS.SUMMER]: {
    name: 'Summer',
    skyDay: ['#4FB4E8', '#87CEEB'],
    skyNight: ['#0f0f23', '#1a1a3e'],
    grassColor: ['#8BC34A', '#689F38'],
  },
  [SEASONS.FALL]: {
    name: 'Fall',
    skyDay: ['#E8A87C', '#C38D6B'],
    skyNight: ['#2d1b4e', '#1a1a2e'],
    grassColor: ['#D4A574', '#8B7355'],
  },
  [SEASONS.WINTER]: {
    name: 'Winter',
    skyDay: ['#B0C4DE', '#87CEEB'],
    skyNight: ['#0a1628', '#162447'],
    grassColor: ['#E8E8E8', '#C0C0C0'],
  },
};

// Power-up colors and icons
const POWERUP_CONFIG = {
  rapidFire: { color: '#FF5722', icon: '🔥', name: 'Rapid Fire' },
  straightShot: { color: '#2196F3', icon: '➡️', name: 'Straight Shot' },
  doubleShot: { color: '#9C27B0', icon: '↔️', name: 'Double Shot' },
  speedBoost: { color: '#4CAF50', icon: '⚡', name: 'Speed Boost' },
  slowMotion: { color: '#00BCD4', icon: '🐌', name: 'Slow Motion' },
  superJump: { color: '#FFEB3B', icon: '🦘', name: 'Super Jump' },
  invincibility: { color: '#E91E63', icon: '🛡️', name: 'Invincible' },
  knockback: { color: '#FF9800', icon: '💥', name: 'Knockback' },
};

const CAR_COLORS = ['#E53935', '#1E88E5', '#43A047', '#FDD835', '#8E24AA', '#FF6F00', '#00ACC1'];

// Helper functions
const generateClouds = (width) => {
  const clouds = [];
  for (let i = 0; i < 6; i++) {
    clouds.push({
      x: Math.random() * width * 1.5,
      y: Math.random() * 150 + 30,
      width: Math.random() * 80 + 60,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  return clouds;
};

const generateHouses = (width) => {
  const houses = [];
  for (let i = 0; i < 5; i++) {
    houses.push({
      x: i * 400 + Math.random() * 100,
      width: Math.random() * 60 + 80,
      height: Math.random() * 40 + 80,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 5)],
      roofColor: ['#C0392B', '#2C3E50', '#8E44AD', '#27AE60', '#E74C3C'][Math.floor(Math.random() * 5)],
    });
  }
  return houses;
};

const generateWeatherParticles = (width, height, season) => {
  const particles = [];
  for (let i = 0; i < GAME_CONFIG.WEATHER_PARTICLE_COUNT; i++) {
    particles.push(createWeatherParticle(width, height, season, true));
  }
  return particles;
};

const createWeatherParticle = (width, height, season, randomY = false) => {
  const base = {
    x: Math.random() * width * 1.5,
    y: randomY ? Math.random() * height : -20,
    size: Math.random() * 4 + 2,
    speed: Math.random() * 2 + 1,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: Math.random() * 0.1 + 0.02,
  };
  switch (season) {
    case SEASONS.SPRING: return { ...base, size: 2, speed: Math.random() * 8 + 10, length: Math.random() * 15 + 10 };
    case SEASONS.SUMMER: return { ...base, size: Math.random() * 3 + 1, speed: Math.random() * 4 + 6, horizontal: Math.random() * 3 + 2 };
    case SEASONS.FALL: return { ...base, size: Math.random() * 8 + 6, speed: Math.random() * 2 + 1, rotation: Math.random() * 360, rotationSpeed: Math.random() * 5 - 2.5 };
    case SEASONS.WINTER: return { ...base, size: Math.random() * 4 + 2, speed: Math.random() * 1.5 + 0.5 };
    default: return base;
  }
};

const GameCanvas = ({ isPlaying, onGameOver, onScoreUpdate }) => {
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
      player: { x: GAME_CONFIG.PLAYER_X, y: groundY, vy: 0, isJumping: false, isOnGround: true },
      obstacles: [],
      mailboxes: [],
      mails: [],
      clouds: generateClouds(canvasSize.width),
      houses: generateHouses(canvasSize.width),
      hearts: [],
      roadHazards: [],
      powerups: [],
      activePowerups: {},
      score: 0,
      deliveries: 0,
      distance: 0,
      speed: GAME_CONFIG.INITIAL_SPEED,
      nextSpawnDistance: GAME_CONFIG.MIN_SPAWN_DISTANCE,
      lives: GAME_CONFIG.MAX_LIVES,
      isInvincible: false,
      invincibleTimer: 0,
      lastMailThrow: 0,
      particles: [],
      gameTime: 0,
      dayNightProgress: 0,
      cycleCount: 0,
      season: randomSeason,
      weatherParticles: generateWeatherParticles(canvasSize.width, canvasSize.height, randomSeason),
      isStorming: false,
      stormIntensity: 0,
      nextStormChange: Math.random() * 30 + 15,
      nextHeartSpawn: GAME_CONFIG.HEART_SPAWN_INTERVAL + Math.random() * 30,
      nextRoadHazard: GAME_CONFIG.ROAD_HAZARD_MIN_INTERVAL + Math.random() * (GAME_CONFIG.ROAD_HAZARD_MAX_INTERVAL - GAME_CONFIG.ROAD_HAZARD_MIN_INTERVAL),
      nextPowerupSpawn: GAME_CONFIG.POWERUP_SPAWN_INTERVAL + Math.random() * 15,
      rapidFireTimer: 0,
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
        case 'child': obs = { ...obs, y: groundY - 45, width: 30, height: 45, frame: 0 }; break;
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
    
    let hazard = {
      type,
      x: goingRight ? -150 : canvasSize.width + 150,
      y: groundY + 20,
      speed: (Math.random() * 5 + 10) * (goingRight ? 1 : -1),
      rotation: 0,
    };
    
    switch (type) {
      case 'car':
        hazard = { ...hazard, width: 120, height: 50, color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)] };
        soundManager.playCarHorn();
        break;
      case 'tire':
        hazard = { ...hazard, y: groundY + 5, width: 40, height: 40, bouncePhase: 0 };
        break;
      case 'tumbleweed':
        hazard = { ...hazard, y: groundY - 10, width: 50, height: 50, speed: hazard.speed * 0.7 };
        break;
      case 'biker':
        hazard = { ...hazard, width: 60, height: 60, pedalPhase: 0, color: ['#E53935', '#1E88E5', '#43A047', '#FDD835'][Math.floor(Math.random() * 4)] };
        break;
      default:
        break;
    }
    
    state.roadHazards.push(hazard);
  }, [canvasSize]);

  const spawnPowerup = useCallback(() => {
    const state = gameStateRef.current;
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
    const type = GAME_CONFIG.POWERUP_TYPES[Math.floor(Math.random() * GAME_CONFIG.POWERUP_TYPES.length)];
    
    state.powerups.push({
      type,
      x: canvasSize.width + 50,
      y: groundY - 100 - Math.random() * 80,
      width: 40,
      height: 40,
      pulse: 0,
      rotation: 0,
    });
  }, [canvasSize]);

  const activatePowerup = useCallback((type) => {
    const state = gameStateRef.current;
    state.activePowerups[type] = GAME_CONFIG.POWERUP_DURATION;
    soundManager.playHeal();
  }, []);

  const addParticles = useCallback((x, y, color, count = 10) => {
    const state = gameStateRef.current;
    if (!state) return;
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 5,
        size: Math.random() * 8 + 4,
        color,
        life: 1,
      });
    }
  }, []);

  const throwMail = useCallback((backward = false) => {
    const state = gameStateRef.current;
    if (!state) return;
    
    const hasStraightShot = state.activePowerups.straightShot > 0;
    const hasKnockback = state.activePowerups.knockback > 0;
    
    state.mails.push({
      x: state.player.x + (backward ? -10 : GAME_CONFIG.PLAYER_WIDTH),
      y: state.player.y + 20,
      vx: backward ? -10 : 12,
      vy: hasStraightShot ? 0 : -8,
      rotation: 0,
      knockback: hasKnockback,
    });
    
    if (!backward) {
      soundManager.playThrow();
    }
  }, []);

  const doThrowMail = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) return;
    const now = Date.now();
    
    const hasRapidFire = state.activePowerups.rapidFire > 0;
    const cooldown = hasRapidFire ? 100 : 300;
    
    if (now - state.lastMailThrow < cooldown) return;
    
    throwMail(false);
    
    // Double shot - also throw behind
    if (state.activePowerups.doubleShot > 0) {
      throwMail(true);
    }
    
    state.lastMailThrow = now;
  }, [throwMail]);

  const jump = useCallback(() => {
    const state = gameStateRef.current;
    if (state && state.player.isOnGround) {
      const hasSuperJump = state.activePowerups.superJump > 0;
      state.player.vy = hasSuperJump ? GAME_CONFIG.JUMP_FORCE * 1.5 : GAME_CONFIG.JUMP_FORCE;
      state.player.isJumping = true;
      state.player.isOnGround = false;
      soundManager.playJump();
    }
  }, []);

  // Input handlers
  useEffect(() => {
    if (!isPlaying) return;
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
      if (e.code === 'KeyE') { e.preventDefault(); doThrowMail(); }
    };
    const handleClick = () => doThrowMail();
    const handleTouch = (e) => {
      const touch = e.touches[0];
      if (touch.clientY < window.innerHeight / 2) jump();
      else doThrowMail();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    window.addEventListener('touchstart', handleTouch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [isPlaying, jump, doThrowMail]);

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : hex;
  };

  const lerpColor = (color1, color2, t) => {
    const c1 = color1.match(/\d+/g).map(Number);
    const c2 = color2.match(/\d+/g).map(Number);
    return `rgb(${Math.round(c1[0] + (c2[0] - c1[0]) * t)}, ${Math.round(c1[1] + (c2[1] - c1[1]) * t)}, ${Math.round(c1[2] + (c2[2] - c1[2]) * t)})`;
  };

  // Drawing functions
  const drawWeatherParticles = (ctx, state) => {
    if (!state.isStorming || state.stormIntensity < 0.1) return;
    const alpha = state.stormIntensity * 0.8;
    state.weatherParticles.forEach(p => {
      ctx.save();
      switch (state.season) {
        case SEASONS.SPRING:
          ctx.strokeStyle = `rgba(120, 180, 255, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + p.length);
          ctx.stroke();
          break;
        case SEASONS.SUMMER:
          ctx.fillStyle = `rgba(210, 180, 140, ${alpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case SEASONS.FALL:
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = `rgba(${180 + (p.x % 40)}, ${60 + (p.y % 40)}, 0, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.quadraticCurveTo(p.size / 2, -p.size / 4, p.size / 2, 0);
          ctx.quadraticCurveTo(p.size / 2, p.size / 4, 0, p.size / 2);
          ctx.quadraticCurveTo(-p.size / 2, p.size / 4, -p.size / 2, 0);
          ctx.quadraticCurveTo(-p.size / 2, -p.size / 4, 0, -p.size / 2);
          ctx.fill();
          break;
        case SEASONS.WINTER:
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        default: break;
      }
      ctx.restore();
    });
  };

  const drawObstacle = (ctx, obs, state) => {
    switch (obs.type) {
      case 'dog':
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(obs.x, obs.y + 10, 40, 25);
        ctx.beginPath(); ctx.arc(obs.x + 45, obs.y + 15, 12, 0, Math.PI * 2); ctx.fill();
        const legOff = Math.floor(obs.frame) * 5;
        ctx.fillRect(obs.x + 5, obs.y + 30, 8, 10 + legOff);
        ctx.fillRect(obs.x + 25, obs.y + 30, 8, 10 - legOff);
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(obs.x + 48, obs.y + 13, 2, 0, Math.PI * 2); ctx.fill();
        break;
      case 'pylon':
        ctx.fillStyle = '#FF6F00';
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.lineTo(obs.x, obs.y + obs.height);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.fillRect(obs.x + 5, obs.y + 20, obs.width - 10, 8);
        ctx.fillRect(obs.x + 3, obs.y + 35, obs.width - 6, 8);
        break;
      case 'hydrant':
        ctx.fillStyle = '#C62828';
        ctx.fillRect(obs.x + 5, obs.y, 20, obs.height);
        ctx.fillRect(obs.x, obs.y + 10, obs.width, 15);
        ctx.beginPath(); ctx.arc(obs.x + 15, obs.y, 10, 0, Math.PI * 2); ctx.fill();
        break;
      case 'trash':
        ctx.fillStyle = '#37474F';
        ctx.fillRect(obs.x, obs.y + 10, obs.width, obs.height - 10);
        ctx.fillRect(obs.x - 3, obs.y, obs.width + 6, 12);
        ctx.beginPath(); ctx.arc(obs.x + obs.width / 2, obs.y, obs.width / 2 + 3, Math.PI, 0); ctx.fill();
        break;
      case 'baby':
        ctx.fillStyle = '#E91E63';
        ctx.beginPath(); ctx.ellipse(obs.x + 27, obs.y + 25, 25, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#C2185B';
        ctx.beginPath(); ctx.arc(obs.x + 15, obs.y + 15, 20, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath(); ctx.arc(obs.x + 20, obs.y + 20, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(obs.x + 10, obs.y + 45, 8, 0, Math.PI * 2);
        ctx.arc(obs.x + 45, obs.y + 45, 8, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'basketball':
        const bounceOff = Math.sin(obs.bounce) * 5;
        ctx.fillStyle = '#FF5722';
        ctx.beginPath(); ctx.arc(obs.x + 17, obs.y + 17 - bounceOff, 17, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#BF360C'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(obs.x + 17, obs.y + 17 - bounceOff, 17, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(obs.x, obs.y + 17 - bounceOff); ctx.lineTo(obs.x + 34, obs.y + 17 - bounceOff); ctx.stroke();
        break;
      case 'child':
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath(); ctx.arc(obs.x + 15, obs.y + 10, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5D4037';
        ctx.beginPath(); ctx.arc(obs.x + 15, obs.y + 6, 10, Math.PI, 0); ctx.fill();
        ctx.fillStyle = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'][Math.floor(obs.x) % 4];
        ctx.fillRect(obs.x + 5, obs.y + 18, 20, 15);
        ctx.fillStyle = '#1565C0';
        ctx.fillRect(obs.x + 5, obs.y + 31, 20, 8);
        ctx.fillStyle = '#FFCC80';
        const cLeg = Math.sin(obs.frame) * 3;
        ctx.fillRect(obs.x + 7, obs.y + 38, 6, 10 + cLeg);
        ctx.fillRect(obs.x + 17, obs.y + 38, 6, 10 - cLeg);
        break;
      default:
        ctx.fillStyle = '#757575';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }
  };

  const drawRoadHazard = (ctx, hazard) => {
    const dir = hazard.speed > 0 ? 1 : -1;
    ctx.save();
    
    switch (hazard.type) {
      case 'car':
        if (dir < 0) { ctx.translate(hazard.x + hazard.width, hazard.y); ctx.scale(-1, 1); ctx.translate(0, -hazard.y); }
        const dx = dir < 0 ? 0 : hazard.x;
        ctx.fillStyle = hazard.color;
        ctx.beginPath(); ctx.roundRect(dx, hazard.y - 20, hazard.width, 35, 5); ctx.fill();
        ctx.beginPath(); ctx.roundRect(dx + 25, hazard.y - 45, 60, 28, 8); ctx.fill();
        ctx.fillStyle = '#81D4FA';
        ctx.beginPath(); ctx.roundRect(dx + 30, hazard.y - 42, 22, 20, 3); ctx.fill();
        ctx.beginPath(); ctx.roundRect(dx + 58, hazard.y - 42, 22, 20, 3); ctx.fill();
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath(); ctx.ellipse(dx + hazard.width - 5, hazard.y - 5, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#F44336';
        ctx.beginPath(); ctx.ellipse(dx + 5, hazard.y - 5, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(dx + 25, hazard.y + 15, 12, 0, Math.PI * 2);
        ctx.arc(dx + hazard.width - 25, hazard.y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'tire':
        const tireY = hazard.y + Math.sin(hazard.bouncePhase) * 15;
        ctx.translate(hazard.x + 20, tireY);
        ctx.rotate(hazard.rotation);
        ctx.fillStyle = '#212121';
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#424242';
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#616161';
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
        // Tread marks
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.moveTo(Math.cos(i * Math.PI / 4) * 14, Math.sin(i * Math.PI / 4) * 14);
          ctx.lineTo(Math.cos(i * Math.PI / 4) * 19, Math.sin(i * Math.PI / 4) * 19);
          ctx.stroke();
        }
        break;
        
      case 'tumbleweed':
        ctx.translate(hazard.x + 25, hazard.y + 25);
        ctx.rotate(hazard.rotation);
        ctx.fillStyle = '#8B7355';
        ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fill();
        // Twigs
        ctx.strokeStyle = '#6D5D4D';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI / 6);
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 10, Math.sin(angle) * 10);
          ctx.lineTo(Math.cos(angle + 0.3) * 25, Math.sin(angle + 0.3) * 25);
          ctx.stroke();
        }
        ctx.strokeStyle = '#A08060';
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI / 4) + 0.2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 5, Math.sin(angle) * 5);
          ctx.lineTo(Math.cos(angle - 0.2) * 20, Math.sin(angle - 0.2) * 20);
          ctx.stroke();
        }
        break;
        
      case 'biker':
        if (dir < 0) { ctx.translate(hazard.x + hazard.width, hazard.y); ctx.scale(-1, 1); ctx.translate(0, -hazard.y); }
        const bx = dir < 0 ? 0 : hazard.x;
        // Bike frame
        ctx.strokeStyle = hazard.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx + 15, hazard.y - 10);
        ctx.lineTo(bx + 35, hazard.y - 25);
        ctx.lineTo(bx + 45, hazard.y - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + 35, hazard.y - 25);
        ctx.lineTo(bx + 35, hazard.y - 40);
        ctx.stroke();
        // Wheels
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(bx + 15, hazard.y, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(bx + 45, hazard.y, 12, 0, Math.PI * 2); ctx.stroke();
        // Rider head
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath(); ctx.arc(bx + 35, hazard.y - 48, 8, 0, Math.PI * 2); ctx.fill();
        // Helmet
        ctx.fillStyle = hazard.color;
        ctx.beginPath(); ctx.arc(bx + 35, hazard.y - 52, 10, Math.PI, 0); ctx.fill();
        // Body
        ctx.fillStyle = '#333';
        ctx.fillRect(bx + 30, hazard.y - 40, 10, 15);
        // Legs (pedaling)
        const pedal = Math.sin(hazard.pedalPhase) * 8;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bx + 35, hazard.y - 25);
        ctx.lineTo(bx + 30 + pedal, hazard.y - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + 35, hazard.y - 25);
        ctx.lineTo(bx + 40 - pedal, hazard.y - 10);
        ctx.stroke();
        break;
      default: break;
    }
    ctx.restore();
  };

  const drawPowerup = (ctx, pu) => {
    const config = POWERUP_CONFIG[pu.type];
    const pulse = Math.sin(pu.pulse) * 4;
    
    ctx.save();
    ctx.translate(pu.x + pu.width / 2, pu.y + pu.height / 2);
    ctx.rotate(pu.rotation);
    
    // Glow
    ctx.fillStyle = config.color + '40';
    ctx.beginPath(); ctx.arc(0, 0, 30 + pulse, 0, Math.PI * 2); ctx.fill();
    
    // Outer ring
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 22 + pulse / 2, 0, Math.PI * 2); ctx.stroke();
    
    // Inner circle
    ctx.fillStyle = config.color;
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
    
    // Icon
    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.icon, 0, 0);
    
    ctx.restore();
  };

  const drawHeart = (ctx, heart) => {
    const pulse = Math.sin(heart.pulse) * 3;
    const size = 15 + pulse;
    ctx.save();
    ctx.translate(heart.x + heart.width / 2, heart.y + heart.height / 2);
    ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
    ctx.beginPath(); ctx.arc(0, 0, size + 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#E91E63';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(-size, -size * 0.5, -size, size * 0.5, 0, size);
    ctx.bezierCurveTo(size, size * 0.5, size, -size * 0.5, 0, size * 0.3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath(); ctx.arc(-size * 0.3, -size * 0.1, size * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  const drawActivePowerups = (ctx, state, canvasWidth) => {
    const active = Object.entries(state.activePowerups).filter(([_, time]) => time > 0);
    if (active.length === 0) return;
    
    let y = 100;
    active.forEach(([type, timeLeft]) => {
      const config = POWERUP_CONFIG[type];
      const barWidth = 120;
      const progress = timeLeft / GAME_CONFIG.POWERUP_DURATION;
      
      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(canvasWidth - barWidth - 20, y, barWidth, 30, 5);
      ctx.fill();
      
      // Progress bar
      ctx.fillStyle = config.color;
      ctx.beginPath();
      ctx.roundRect(canvasWidth - barWidth - 18, y + 2, (barWidth - 4) * progress, 26, 4);
      ctx.fill();
      
      // Icon and text
      ctx.fillStyle = '#FFF';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${config.icon} ${Math.ceil(timeLeft)}s`, canvasWidth - barWidth - 12, y + 20);
      
      y += 35;
    });
  };

  // Main game loop
  useEffect(() => {
    if (!canvasRef.current || canvasSize.width === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    initGame();

    const gameLoop = (currentTime) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      if (!isPlaying) { animationRef.current = requestAnimationFrame(gameLoop); return; }

      const state = gameStateRef.current;
      if (!state) { animationRef.current = requestAnimationFrame(gameLoop); return; }
      
      const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
      
      // Speed modifiers from powerups
      const hasSpeedBoost = state.activePowerups.speedBoost > 0;
      const hasSlowMotion = state.activePowerups.slowMotion > 0;
      const speedMod = hasSpeedBoost ? 1.5 : hasSlowMotion ? 0.5 : 1;

      // Update powerup timers
      Object.keys(state.activePowerups).forEach(key => {
        if (state.activePowerups[key] > 0) {
          state.activePowerups[key] -= deltaTime;
        }
      });

      // Rapid fire auto-throw
      if (state.activePowerups.rapidFire > 0) {
        state.rapidFireTimer -= deltaTime;
        if (state.rapidFireTimer <= 0) {
          const now = Date.now();
          if (now - state.lastMailThrow >= 100) {
            throwMail(false);
            if (state.activePowerups.doubleShot > 0) throwMail(true);
            state.lastMailThrow = now;
          }
          state.rapidFireTimer = 0.1;
        }
      }

      // Time & Weather
      state.gameTime += deltaTime;
      const cycleProgress = (state.gameTime % GAME_CONFIG.DAY_NIGHT_CYCLE_DURATION) / GAME_CONFIG.DAY_NIGHT_CYCLE_DURATION;
      state.dayNightProgress = cycleProgress;
      
      const newCycleCount = Math.floor(state.gameTime / GAME_CONFIG.DAY_NIGHT_CYCLE_DURATION);
      if (newCycleCount > state.cycleCount) {
        state.cycleCount = newCycleCount;
        const newSeason = Math.floor(state.cycleCount / GAME_CONFIG.CYCLES_PER_SEASON) % 4;
        if (newSeason !== state.season) {
          state.season = newSeason;
          state.weatherParticles = generateWeatherParticles(canvasSize.width, canvasSize.height, state.season);
        }
      }
      
      state.nextStormChange -= deltaTime;
      if (state.nextStormChange <= 0) {
        state.isStorming = !state.isStorming;
        state.nextStormChange = Math.random() * 30 + (state.isStorming ? 10 : 20);
      }
      state.stormIntensity += ((state.isStorming ? 1 : 0) - state.stormIntensity) * 0.02;
      
      // Update weather particles
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
      if (state.nextHeartSpawn <= 0 && state.lives < GAME_CONFIG.MAX_LIVES) {
        spawnHeart();
        state.nextHeartSpawn = GAME_CONFIG.HEART_SPAWN_INTERVAL + Math.random() * 30;
      }

      state.nextRoadHazard -= deltaTime;
      if (state.nextRoadHazard <= 0) {
        spawnRoadHazard();
        state.nextRoadHazard = GAME_CONFIG.ROAD_HAZARD_MIN_INTERVAL + Math.random() * (GAME_CONFIG.ROAD_HAZARD_MAX_INTERVAL - GAME_CONFIG.ROAD_HAZARD_MIN_INTERVAL);
      }

      state.nextPowerupSpawn -= deltaTime;
      if (state.nextPowerupSpawn <= 0) {
        spawnPowerup();
        state.nextPowerupSpawn = GAME_CONFIG.POWERUP_SPAWN_INTERVAL + Math.random() * 15;
      }

      // Game mechanics
      state.speed = Math.min(GAME_CONFIG.MAX_SPEED, state.speed + GAME_CONFIG.SPEED_INCREMENT);
      const effectiveSpeed = state.speed * speedMod;
      state.distance += effectiveSpeed / 10;
      state.score += GAME_CONFIG.DISTANCE_POINTS;

      // Player physics
      state.player.vy += GAME_CONFIG.GRAVITY;
      state.player.vy = Math.min(state.player.vy, GAME_CONFIG.MAX_FALL_SPEED);
      state.player.y += state.player.vy;

      const playerGroundY = groundY - GAME_CONFIG.PLAYER_HEIGHT;
      if (state.player.y >= playerGroundY) {
        state.player.y = playerGroundY;
        state.player.vy = 0;
        state.player.isOnGround = true;
        state.player.isJumping = false;
      }

      if (state.isInvincible) {
        state.invincibleTimer--;
        if (state.invincibleTimer <= 0) state.isInvincible = false;
      }

      state.nextSpawnDistance -= effectiveSpeed;
      if (state.nextSpawnDistance <= 0) spawnGameObject();

      // Update clouds
      state.clouds.forEach(c => { c.x -= c.speed; if (c.x + c.width < 0) { c.x = canvasSize.width + c.width; c.y = Math.random() * 150 + 30; } });

      // Update houses
      state.houses.forEach(h => { h.x -= effectiveSpeed * 0.3; if (h.x + h.width < 0) { h.x = canvasSize.width + Math.random() * 200; } });

      // Update hearts
      state.hearts = state.hearts.filter(heart => {
        heart.x -= effectiveSpeed;
        heart.pulse += 0.1;
        const pb = { x: state.player.x, y: state.player.y, width: GAME_CONFIG.PLAYER_WIDTH, height: GAME_CONFIG.PLAYER_HEIGHT };
        if (pb.x < heart.x + heart.width && pb.x + pb.width > heart.x && pb.y < heart.y + heart.height && pb.y + pb.height > heart.y) {
          if (state.lives < GAME_CONFIG.MAX_LIVES) { state.lives++; soundManager.playHeal(); addParticles(heart.x + 15, heart.y + 15, '#E91E63', 15); }
          return false;
        }
        return heart.x > -50;
      });

      // Update powerups
      state.powerups = state.powerups.filter(pu => {
        pu.x -= effectiveSpeed;
        pu.pulse += 0.1;
        pu.rotation += 0.02;
        const pb = { x: state.player.x, y: state.player.y, width: GAME_CONFIG.PLAYER_WIDTH, height: GAME_CONFIG.PLAYER_HEIGHT };
        if (pb.x < pu.x + pu.width && pb.x + pb.width > pu.x && pb.y < pu.y + pu.height && pb.y + pb.height > pu.y) {
          activatePowerup(pu.type);
          addParticles(pu.x + 20, pu.y + 20, POWERUP_CONFIG[pu.type].color, 20);
          return false;
        }
        return pu.x > -50;
      });

      // Check invincibility powerup
      const hasInvincibility = state.activePowerups.invincibility > 0;

      // Update road hazards
      state.roadHazards = state.roadHazards.filter(hazard => {
        hazard.x += hazard.speed * speedMod;
        hazard.rotation += Math.abs(hazard.speed) * 0.05;
        if (hazard.bouncePhase !== undefined) hazard.bouncePhase += 0.2;
        if (hazard.pedalPhase !== undefined) hazard.pedalPhase += 0.3;
        
        if (!state.isInvincible && !hasInvincibility) {
          const pb = { x: state.player.x + 10, y: state.player.y + 10, width: GAME_CONFIG.PLAYER_WIDTH - 20, height: GAME_CONFIG.PLAYER_HEIGHT - 10 };
          const hb = { x: hazard.x, y: hazard.y - (hazard.type === 'car' ? 45 : 30), width: hazard.width || 50, height: hazard.type === 'car' ? 60 : 50 };
          if (pb.x < hb.x + hb.width && pb.x + pb.width > hb.x && pb.y < hb.y + hb.height && pb.y + pb.height > hb.y) {
            const damage = hazard.type === 'car' ? 2 : 1;
            state.lives -= damage;
            state.isInvincible = true;
            state.invincibleTimer = 120;
            addParticles(state.player.x + GAME_CONFIG.PLAYER_WIDTH / 2, state.player.y + GAME_CONFIG.PLAYER_HEIGHT / 2, '#FF6B6B', 20);
            soundManager.playThud();
            if (state.lives <= 0) { state.lives = 0; soundManager.stopMusic(); onGameOver(state.score, state.deliveries, Math.floor(state.distance)); }
          }
        }
        return hazard.speed > 0 ? hazard.x < canvasSize.width + 200 : hazard.x > -200;
      });

      // Update obstacles
      state.obstacles = state.obstacles.filter(obs => {
        obs.x -= effectiveSpeed;
        if (obs.type === 'dog') obs.frame = (obs.frame + 0.2) % 2;
        if (obs.type === 'basketball') obs.bounce += 0.15;
        if (obs.type === 'child') obs.frame += 0.1;
        
        if (!state.isInvincible && !hasInvincibility) {
          const pb = { x: state.player.x + 10, y: state.player.y + 10, width: GAME_CONFIG.PLAYER_WIDTH - 20, height: GAME_CONFIG.PLAYER_HEIGHT - 10 };
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
        mail.x += mail.vx;
        mail.y += mail.vy;
        if (!mail.knockback || state.activePowerups.straightShot <= 0) mail.vy += 0.5;
        mail.rotation += 15;

        // Check mailbox collision
        for (let box of state.mailboxes) {
          if (!box.hasDelivery && mail.x + 20 > box.x - 10 && mail.x < box.x + box.width + 10 && mail.y + 20 > box.y - 10 && mail.y < box.y + box.height + 20) {
            box.hasDelivery = true;
            state.deliveries++;
            state.score += GAME_CONFIG.DELIVERY_POINTS;
            addParticles(box.x + box.width / 2, box.y, '#4ECDC4', 20);
            soundManager.playDelivery();
            return false;
          }
        }

        // Knockback - destroy obstacles
        if (mail.knockback) {
          state.obstacles = state.obstacles.filter(obs => {
            if (mail.x + 20 > obs.x && mail.x < obs.x + obs.width && mail.y + 20 > obs.y && mail.y < obs.y + obs.height) {
              addParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#FF9800', 15);
              state.score += 25;
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
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvasSize.width, groundY);

      // Sun/Moon
      const cX = canvasSize.width - 100, cY = 50 + Math.sin(state.dayNightProgress * Math.PI * 2) * 30;
      if (nightAmount < 0.5) {
        ctx.fillStyle = `rgba(255, 217, 61, ${1 - nightAmount * 2})`; ctx.beginPath(); ctx.arc(cX, cY, 50, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(230, 230, 250, ${(nightAmount - 0.5) * 2})`; ctx.beginPath(); ctx.arc(cX, cY, 40, 0, Math.PI * 2); ctx.fill();
      }

      // Stars
      if (nightAmount > 0.3) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(nightAmount - 0.3) / 0.7 * 0.8})`;
        for (let i = 0; i < 50; i++) { ctx.beginPath(); ctx.arc((i * 137.5 + state.gameTime * 0.5) % canvasSize.width, (i * 97.3) % (groundY - 100) + 20, (Math.sin(state.gameTime * 2 + i) + 1) * 1.5 + 0.5, 0, Math.PI * 2); ctx.fill(); }
      }

      // Clouds
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * (1 - nightAmount * 0.5)})`;
      state.clouds.forEach(c => { ctx.beginPath(); ctx.ellipse(c.x, c.y, c.width / 2, c.width / 4, 0, 0, Math.PI * 2); ctx.fill(); });

      // Houses
      state.houses.forEach(h => {
        const hb = groundY - 30;
        ctx.fillStyle = h.color; ctx.fillRect(h.x, hb - h.height, h.width, h.height);
        ctx.fillStyle = h.roofColor; ctx.beginPath(); ctx.moveTo(h.x - 10, hb - h.height); ctx.lineTo(h.x + h.width / 2, hb - h.height - 40); ctx.lineTo(h.x + h.width + 10, hb - h.height); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5D4037'; ctx.fillRect(h.x + h.width / 2 - 10, hb - 35, 20, 35);
        const wg = nightAmount > 0.4 ? (nightAmount - 0.4) / 0.6 : 0;
        ctx.fillStyle = wg > 0 ? `rgba(255, 220, 100, ${0.8 * wg})` : '#81D4FA';
        ctx.fillRect(h.x + 15, hb - h.height + 20, 20, 20);
        ctx.fillRect(h.x + h.width - 35, hb - h.height + 20, 20, 20);
      });

      // Grass
      const grassGrad = ctx.createLinearGradient(0, groundY - 30, 0, groundY);
      grassGrad.addColorStop(0, lerpColor(hexToRgb(seasonConfig.grassColor[0]), 'rgb(40,60,40)', nightAmount * 0.5));
      grassGrad.addColorStop(1, lerpColor(hexToRgb(seasonConfig.grassColor[1]), 'rgb(30,50,30)', nightAmount * 0.5));
      ctx.fillStyle = grassGrad; ctx.fillRect(0, groundY - 30, canvasSize.width, 30);

      // Road
      ctx.fillStyle = nightAmount > 0.5 ? '#404040' : '#616161'; ctx.fillRect(0, groundY, canvasSize.width, GAME_CONFIG.GROUND_HEIGHT);
      ctx.fillStyle = '#FFD54F';
      const mo = (state.distance * 5) % 80;
      for (let i = -1; i < canvasSize.width / 80 + 1; i++) ctx.fillRect(i * 80 - mo, groundY + GAME_CONFIG.GROUND_HEIGHT / 2 - 3, 40, 6);
      ctx.fillStyle = nightAmount > 0.5 ? '#909090' : '#BDBDBD'; ctx.fillRect(0, groundY - 5, canvasSize.width, 10);

      // Road hazards
      state.roadHazards.forEach(h => drawRoadHazard(ctx, h));

      // Mailboxes
      state.mailboxes.forEach(box => {
        ctx.fillStyle = '#5D4037'; ctx.fillRect(box.x + 10, box.y, 10, box.height);
        ctx.fillStyle = box.hasDelivery ? '#4CAF50' : '#1565C0'; ctx.fillRect(box.x, box.y, box.width, 25);
        ctx.fillStyle = box.hasDelivery ? '#4CAF50' : '#F44336'; ctx.fillRect(box.x + box.width - 5, box.y + 5, 8, 15);
      });

      // Hearts & Powerups
      state.hearts.forEach(h => drawHeart(ctx, h));
      state.powerups.forEach(p => drawPowerup(ctx, p));

      // Obstacles
      state.obstacles.forEach(o => drawObstacle(ctx, o, state));

      // Mails
      state.mails.forEach(mail => {
        ctx.save();
        ctx.translate(mail.x + 10, mail.y + 7);
        ctx.rotate((mail.rotation * Math.PI) / 180);
        ctx.fillStyle = mail.knockback ? '#FF9800' : '#FFF';
        ctx.fillRect(-10, -7, 20, 14);
        ctx.strokeStyle = mail.knockback ? '#E65100' : '#1565C0';
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -7, 20, 14);
        ctx.beginPath(); ctx.moveTo(-10, -7); ctx.lineTo(0, 2); ctx.lineTo(10, -7); ctx.stroke();
        ctx.restore();
      });

      // Player
      const px = state.player.x, py = state.player.y;
      const flash = state.isInvincible && Math.floor(state.invincibleTimer / 5) % 2 === 0;
      const hasShield = hasInvincibility;
      
      if (hasShield) {
        ctx.fillStyle = 'rgba(233, 30, 99, 0.3)';
        ctx.beginPath(); ctx.arc(px + GAME_CONFIG.PLAYER_WIDTH / 2, py + GAME_CONFIG.PLAYER_HEIGHT / 2, 50, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#E91E63'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(px + GAME_CONFIG.PLAYER_WIDTH / 2, py + GAME_CONFIG.PLAYER_HEIGHT / 2, 50, 0, Math.PI * 2); ctx.stroke();
      }
      
      if (!flash) {
        ctx.fillStyle = '#1A237E';
        const legAnim = Math.sin(state.distance * 0.3) * (state.player.isOnGround ? 5 : 0);
        ctx.fillRect(px + 10, py + 50, 12, 20 + legAnim);
        ctx.fillRect(px + 28, py + 50, 12, 20 - legAnim);
        ctx.fillStyle = '#1976D2'; ctx.fillRect(px + 8, py + 25, 34, 30);
        ctx.fillStyle = '#FFD54F'; ctx.fillRect(px + 38, py + 30, 15, 20);
        ctx.fillStyle = '#FFF'; ctx.fillRect(px + 41, py + 35, 9, 10);
        ctx.fillStyle = '#FFCC80'; ctx.beginPath(); ctx.arc(px + 25, py + 15, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1976D2'; ctx.fillRect(px + 8, py + 5, 34, 8); ctx.fillRect(px + 12, py - 5, 26, 12);
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px + 20, py + 13, 2, 0, Math.PI * 2); ctx.arc(px + 30, py + 13, 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + 25, py + 18, 5, 0.2, Math.PI - 0.2); ctx.stroke();
        ctx.save(); ctx.translate(px + 40, py + 35); ctx.rotate(state.lastMailThrow > Date.now() - 200 ? -0.5 : 0);
        ctx.fillStyle = '#FFCC80'; ctx.fillRect(0, -5, 15, 10); ctx.restore();
      }

      // Weather
      drawWeatherParticles(ctx, state);

      // Storm overlay
      if (state.stormIntensity > 0.1) {
        ctx.fillStyle = state.season === SEASONS.WINTER ? `rgba(200,220,255,${state.stormIntensity * 0.15})` : state.season === SEASONS.SUMMER ? `rgba(255,220,180,${state.stormIntensity * 0.15})` : `rgba(100,100,120,${state.stormIntensity * 0.15})`;
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      }

      // Particles
      state.particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;

      // Active powerups display
      drawActivePowerups(ctx, state, canvasSize.width);

      // Season indicator
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(canvasSize.width - 140, canvasSize.height - 45, 130, 35);
      ctx.fillStyle = '#FFF'; ctx.font = '14px Nunito, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${seasonConfig.name} ${nightAmount > 0.5 ? '🌙' : '☀️'}`, canvasSize.width - 75, canvasSize.height - 22);
      if (state.isStorming) ctx.fillText(state.season === SEASONS.WINTER ? '❄️' : state.season === SEASONS.SUMMER ? '🏜️' : state.season === SEASONS.FALL ? '🍂' : '🌧️', canvasSize.width - 75, canvasSize.height - 5);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [canvasSize, isPlaying, initGame, spawnGameObject, spawnHeart, spawnRoadHazard, spawnPowerup, activatePowerup, onGameOver, onScoreUpdate, addParticles, throwMail]);

  return <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="absolute inset-0 game-canvas" />;
};

export default GameCanvas;
