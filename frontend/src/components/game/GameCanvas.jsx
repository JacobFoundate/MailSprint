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
  
  // Obstacles - expanded list
  OBSTACLE_TYPES: ['dog', 'pylon', 'hydrant', 'trash', 'baby', 'basketball', 'child'],
  
  // Scoring
  DELIVERY_POINTS: 100,
  DISTANCE_POINTS: 1,
  BONUS_MULTIPLIER: 1.5,
  
  // Time & Weather
  DAY_NIGHT_CYCLE_DURATION: 120, // 2 minutes
  CYCLES_PER_SEASON: 15,
  WEATHER_PARTICLE_COUNT: 100,
  
  // Heart pickups
  HEART_SPAWN_INTERVAL: 120, // ~2 minutes
  
  // Cars
  CAR_SPAWN_MIN_INTERVAL: 60, // 1 minute minimum
  CAR_SPAWN_MAX_INTERVAL: 180, // 3 minutes maximum
  CAR_SPEED: 15,
};

// Seasons enum
const SEASONS = {
  SPRING: 0,
  SUMMER: 1,
  FALL: 2,
  WINTER: 3,
};

// Season colors and settings
const SEASON_CONFIG = {
  [SEASONS.SPRING]: {
    name: 'Spring',
    skyDay: ['#87CEEB', '#B0E0E6'],
    skyNight: ['#1a1a2e', '#16213e'],
    grassColor: ['#7CB342', '#558B2F'],
    treeColor: '#90EE90',
    weatherColor: 'rgba(120, 180, 255, 0.6)',
  },
  [SEASONS.SUMMER]: {
    name: 'Summer',
    skyDay: ['#4FB4E8', '#87CEEB'],
    skyNight: ['#0f0f23', '#1a1a3e'],
    grassColor: ['#8BC34A', '#689F38'],
    treeColor: '#228B22',
    weatherColor: 'rgba(210, 180, 140, 0.7)',
  },
  [SEASONS.FALL]: {
    name: 'Fall',
    skyDay: ['#E8A87C', '#C38D6B'],
    skyNight: ['#2d1b4e', '#1a1a2e'],
    grassColor: ['#D4A574', '#8B7355'],
    treeColor: '#D2691E',
    weatherColor: 'rgba(205, 92, 0, 0.8)',
  },
  [SEASONS.WINTER]: {
    name: 'Winter',
    skyDay: ['#B0C4DE', '#87CEEB'],
    skyNight: ['#0a1628', '#162447'],
    grassColor: ['#E8E8E8', '#C0C0C0'],
    treeColor: '#8B4513',
    weatherColor: 'rgba(255, 255, 255, 0.9)',
  },
};

// Car colors
const CAR_COLORS = ['#E53935', '#1E88E5', '#43A047', '#FDD835', '#8E24AA', '#FF6F00', '#00ACC1'];

// Generate initial clouds
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

// Generate initial houses
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

// Generate weather particles
const generateWeatherParticles = (width, height, season) => {
  const particles = [];
  for (let i = 0; i < GAME_CONFIG.WEATHER_PARTICLE_COUNT; i++) {
    particles.push(createWeatherParticle(width, height, season, true));
  }
  return particles;
};

const createWeatherParticle = (width, height, season, randomY = false) => {
  const baseParticle = {
    x: Math.random() * width * 1.5,
    y: randomY ? Math.random() * height : -20,
    size: Math.random() * 4 + 2,
    speed: Math.random() * 2 + 1,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: Math.random() * 0.1 + 0.02,
  };

  switch (season) {
    case SEASONS.SPRING:
      return { ...baseParticle, size: 2, speed: Math.random() * 8 + 10, length: Math.random() * 15 + 10 };
    case SEASONS.SUMMER:
      return { ...baseParticle, size: Math.random() * 3 + 1, speed: Math.random() * 4 + 6, horizontal: Math.random() * 3 + 2 };
    case SEASONS.FALL:
      return { ...baseParticle, size: Math.random() * 8 + 6, speed: Math.random() * 2 + 1, rotation: Math.random() * 360, rotationSpeed: Math.random() * 5 - 2.5 };
    case SEASONS.WINTER:
      return { ...baseParticle, size: Math.random() * 4 + 2, speed: Math.random() * 1.5 + 0.5 };
    default:
      return baseParticle;
  }
};

const GameCanvas = ({ isPlaying, onGameOver, onScoreUpdate }) => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Initialize canvas size
  useEffect(() => {
    const updateSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize game objects
  const initGame = useCallback(() => {
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT - GAME_CONFIG.PLAYER_HEIGHT;
    const randomSeason = Math.floor(Math.random() * 4); // Random starting season
    
    gameStateRef.current = {
      player: {
        x: GAME_CONFIG.PLAYER_X,
        y: groundY,
        vy: 0,
        isJumping: false,
        isOnGround: true,
      },
      obstacles: [],
      mailboxes: [],
      mails: [],
      clouds: generateClouds(canvasSize.width),
      houses: generateHouses(canvasSize.width),
      hearts: [], // Heart pickups
      cars: [], // Moving cars
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
      // Time & Weather
      gameTime: 0,
      dayNightProgress: 0,
      cycleCount: 0,
      season: randomSeason,
      weatherParticles: generateWeatherParticles(canvasSize.width, canvasSize.height, randomSeason),
      isStorming: false,
      stormIntensity: 0,
      nextStormChange: Math.random() * 30 + 15,
      // Heart spawning
      nextHeartSpawn: GAME_CONFIG.HEART_SPAWN_INTERVAL + Math.random() * 30,
      // Car spawning
      nextCarSpawn: GAME_CONFIG.CAR_SPAWN_MIN_INTERVAL + Math.random() * (GAME_CONFIG.CAR_SPAWN_MAX_INTERVAL - GAME_CONFIG.CAR_SPAWN_MIN_INTERVAL),
    };
    lastTimeRef.current = performance.now();
  }, [canvasSize]);

  // Spawn obstacle or mailbox
  const spawnGameObject = useCallback(() => {
    const state = gameStateRef.current;
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
    const spawnX = canvasSize.width + 100;

    if (Math.random() < GAME_CONFIG.MAILBOX_SPAWN_CHANCE) {
      state.mailboxes.push({
        x: spawnX,
        y: groundY - 80,
        width: 50,
        height: 80,
        hasDelivery: false,
        animating: false,
      });
    } else {
      const type = GAME_CONFIG.OBSTACLE_TYPES[Math.floor(Math.random() * GAME_CONFIG.OBSTACLE_TYPES.length)];
      let obstacle = { type, x: spawnX };
      
      switch (type) {
        case 'dog':
          obstacle = { ...obstacle, y: groundY - 40, width: 50, height: 40, frame: 0 };
          break;
        case 'pylon':
          obstacle = { ...obstacle, y: groundY - 50, width: 25, height: 50 };
          break;
        case 'hydrant':
          obstacle = { ...obstacle, y: groundY - 45, width: 30, height: 45 };
          break;
        case 'trash':
          obstacle = { ...obstacle, y: groundY - 55, width: 40, height: 55 };
          break;
        case 'baby':
          obstacle = { ...obstacle, y: groundY - 50, width: 55, height: 50, wheelFrame: 0 };
          break;
        case 'basketball':
          obstacle = { ...obstacle, y: groundY - 35, width: 35, height: 35, bounce: 0 };
          break;
        case 'child':
          obstacle = { ...obstacle, y: groundY - 45, width: 30, height: 45, frame: 0 };
          break;
        default:
          obstacle = { ...obstacle, y: groundY - 40, width: 40, height: 40 };
      }
      
      state.obstacles.push(obstacle);
    }

    state.nextSpawnDistance = Math.random() * (GAME_CONFIG.MAX_SPAWN_DISTANCE - GAME_CONFIG.MIN_SPAWN_DISTANCE) + GAME_CONFIG.MIN_SPAWN_DISTANCE;
  }, [canvasSize]);

  // Spawn heart pickup
  const spawnHeart = useCallback(() => {
    const state = gameStateRef.current;
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
    
    state.hearts.push({
      x: canvasSize.width + 50,
      y: groundY - 120 - Math.random() * 60, // Floating above ground
      width: 30,
      height: 30,
      pulse: 0,
    });
  }, [canvasSize]);

  // Spawn car
  const spawnCar = useCallback(() => {
    const state = gameStateRef.current;
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
    const goingRight = Math.random() > 0.5;
    
    state.cars.push({
      x: goingRight ? -150 : canvasSize.width + 150,
      y: groundY + 20,
      width: 120,
      height: 50,
      speed: GAME_CONFIG.CAR_SPEED * (goingRight ? 1 : -1),
      color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
      hasHonked: false,
    });
    
    // Play horn sound
    soundManager.playCarHorn();
  }, [canvasSize]);

  // Jump action
  const jump = useCallback(() => {
    const state = gameStateRef.current;
    if (state && state.player.isOnGround) {
      state.player.vy = GAME_CONFIG.JUMP_FORCE;
      state.player.isJumping = true;
      state.player.isOnGround = false;
      soundManager.playJump();
    }
  }, []);

  // Throw mail action
  const throwMail = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) return;
    const now = Date.now();
    
    if (now - state.lastMailThrow < 300) return;
    
    state.mails.push({
      x: state.player.x + GAME_CONFIG.PLAYER_WIDTH,
      y: state.player.y + 20,
      vx: 12,
      vy: -8,
      rotation: 0,
    });
    
    state.lastMailThrow = now;
    soundManager.playThrow();
  }, []);

  // Add particles for effects
  const addParticles = useCallback((x, y, color, count = 10) => {
    const state = gameStateRef.current;
    if (!state) return;
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 5,
        size: Math.random() * 8 + 4,
        color,
        life: 1,
      });
    }
  }, []);

  // Input handlers
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
      if (e.code === 'KeyE') {
        e.preventDefault();
        throwMail();
      }
    };

    const handleClick = () => {
      throwMail();
    };

    const handleTouch = (e) => {
      const touch = e.touches[0];
      if (touch.clientY < window.innerHeight / 2) {
        jump();
      } else {
        throwMail();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    window.addEventListener('touchstart', handleTouch);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [isPlaying, jump, throwMail]);

  // Color interpolation helpers
  const lerpColor = (color1, color2, t) => {
    const c1 = color1.match(/\d+/g).map(Number);
    const c2 = color2.match(/\d+/g).map(Number);
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : hex;
  };

  // Draw weather particles
  const drawWeatherParticles = (ctx, state, seasonConfig) => {
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
        default:
          break;
      }
      
      ctx.restore();
    });
  };

  // Draw obstacles with new types
  const drawObstacle = (ctx, obs, state) => {
    switch (obs.type) {
      case 'dog':
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(obs.x, obs.y + 10, 40, 25);
        ctx.beginPath();
        ctx.arc(obs.x + 45, obs.y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        const legOffset = Math.floor(obs.frame) * 5;
        ctx.fillRect(obs.x + 5, obs.y + 30, 8, 10 + legOffset);
        ctx.fillRect(obs.x + 25, obs.y + 30, 8, 10 - legOffset);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(obs.x + 48, obs.y + 13, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'pylon':
        ctx.fillStyle = '#FF6F00';
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.lineTo(obs.x, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.fillRect(obs.x + 5, obs.y + 20, obs.width - 10, 8);
        ctx.fillRect(obs.x + 3, obs.y + 35, obs.width - 6, 8);
        break;
        
      case 'hydrant':
        ctx.fillStyle = '#C62828';
        ctx.fillRect(obs.x + 5, obs.y, 20, obs.height);
        ctx.fillRect(obs.x, obs.y + 10, obs.width, 15);
        ctx.beginPath();
        ctx.arc(obs.x + 15, obs.y, 10, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'trash':
        ctx.fillStyle = '#37474F';
        ctx.fillRect(obs.x, obs.y + 10, obs.width, obs.height - 10);
        ctx.fillRect(obs.x - 3, obs.y, obs.width + 6, 12);
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y, obs.width / 2 + 3, Math.PI, 0);
        ctx.fill();
        break;
        
      case 'baby':
        // Baby carriage
        // Carriage body
        ctx.fillStyle = '#E91E63';
        ctx.beginPath();
        ctx.ellipse(obs.x + 27, obs.y + 25, 25, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        // Hood
        ctx.fillStyle = '#C2185B';
        ctx.beginPath();
        ctx.arc(obs.x + 15, obs.y + 15, 20, Math.PI, 0);
        ctx.fill();
        // Baby head
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath();
        ctx.arc(obs.x + 20, obs.y + 20, 8, 0, Math.PI * 2);
        ctx.fill();
        // Eyes (closed/sleeping)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(obs.x + 17, obs.y + 19, 2, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(obs.x + 23, obs.y + 19, 2, 0, Math.PI);
        ctx.stroke();
        // Wheels
        ctx.fillStyle = '#333';
        const wheelY = obs.y + obs.height - 5;
        ctx.beginPath();
        ctx.arc(obs.x + 10, wheelY, 8, 0, Math.PI * 2);
        ctx.arc(obs.x + 45, wheelY, 8, 0, Math.PI * 2);
        ctx.fill();
        // Wheel spokes animation
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        const spokeAngle = (state.distance * 0.1) % (Math.PI * 2);
        for (let i = 0; i < 4; i++) {
          const angle = spokeAngle + (i * Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(obs.x + 10, wheelY);
          ctx.lineTo(obs.x + 10 + Math.cos(angle) * 6, wheelY + Math.sin(angle) * 6);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(obs.x + 45, wheelY);
          ctx.lineTo(obs.x + 45 + Math.cos(angle) * 6, wheelY + Math.sin(angle) * 6);
          ctx.stroke();
        }
        break;
        
      case 'basketball':
        // Bouncing basketball
        const bounceOffset = Math.sin(obs.bounce) * 5;
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(obs.x + 17, obs.y + 17 - bounceOffset, 17, 0, Math.PI * 2);
        ctx.fill();
        // Lines on ball
        ctx.strokeStyle = '#BF360C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(obs.x + 17, obs.y + 17 - bounceOffset, 17, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + 17 - bounceOffset);
        ctx.lineTo(obs.x + 34, obs.y + 17 - bounceOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(obs.x + 17, obs.y - bounceOffset);
        ctx.lineTo(obs.x + 17, obs.y + 34 - bounceOffset);
        ctx.stroke();
        break;
        
      case 'child':
        // Simple child figure
        // Head
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath();
        ctx.arc(obs.x + 15, obs.y + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        // Hair
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.arc(obs.x + 15, obs.y + 6, 10, Math.PI, 0);
        ctx.fill();
        // Body (t-shirt)
        ctx.fillStyle = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'][Math.floor(obs.x) % 4];
        ctx.fillRect(obs.x + 5, obs.y + 18, 20, 15);
        // Shorts
        ctx.fillStyle = '#1565C0';
        ctx.fillRect(obs.x + 5, obs.y + 31, 20, 8);
        // Legs
        ctx.fillStyle = '#FFCC80';
        const childLegAnim = Math.sin(obs.frame) * 3;
        ctx.fillRect(obs.x + 7, obs.y + 38, 6, 10 + childLegAnim);
        ctx.fillRect(obs.x + 17, obs.y + 38, 6, 10 - childLegAnim);
        // Face
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(obs.x + 12, obs.y + 9, 1.5, 0, Math.PI * 2);
        ctx.arc(obs.x + 18, obs.y + 9, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(obs.x + 15, obs.y + 12, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();
        break;
        
      default:
        ctx.fillStyle = '#757575';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }
  };

  // Draw car
  const drawCar = (ctx, car) => {
    const direction = car.speed > 0 ? 1 : -1;
    
    ctx.save();
    if (direction < 0) {
      ctx.translate(car.x + car.width, car.y);
      ctx.scale(-1, 1);
      ctx.translate(0, -car.y);
    }
    
    const drawX = direction < 0 ? 0 : car.x;
    
    // Car body
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.roundRect(drawX, car.y - 20, car.width, 35, 5);
    ctx.fill();
    
    // Car top
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.roundRect(drawX + 25, car.y - 45, 60, 28, 8);
    ctx.fill();
    
    // Windows
    ctx.fillStyle = '#81D4FA';
    ctx.beginPath();
    ctx.roundRect(drawX + 30, car.y - 42, 22, 20, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(drawX + 58, car.y - 42, 22, 20, 3);
    ctx.fill();
    
    // Headlights
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.ellipse(drawX + car.width - 5, car.y - 5, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Taillights
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.ellipse(drawX + 5, car.y - 5, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheels
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(drawX + 25, car.y + 15, 12, 0, Math.PI * 2);
    ctx.arc(drawX + car.width - 25, car.y + 15, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Hubcaps
    ctx.fillStyle = '#9E9E9E';
    ctx.beginPath();
    ctx.arc(drawX + 25, car.y + 15, 6, 0, Math.PI * 2);
    ctx.arc(drawX + car.width - 25, car.y + 15, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  // Draw heart pickup
  const drawHeart = (ctx, heart) => {
    const pulse = Math.sin(heart.pulse) * 3;
    const size = 15 + pulse;
    
    ctx.save();
    ctx.translate(heart.x + heart.width / 2, heart.y + heart.height / 2);
    
    // Glow effect
    ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, size + 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Heart shape
    ctx.fillStyle = '#E91E63';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(-size, -size * 0.5, -size, size * 0.5, 0, size);
    ctx.bezierCurveTo(size, size * 0.5, size, -size * 0.5, 0, size * 0.3);
    ctx.fill();
    
    // Shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-size * 0.3, -size * 0.1, size * 0.25, 0, Math.PI * 2);
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
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      if (!isPlaying) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const state = gameStateRef.current;
      if (!state) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;

      // ============ UPDATE TIME & WEATHER ============
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
      
      // Storm management
      state.nextStormChange -= deltaTime;
      if (state.nextStormChange <= 0) {
        state.isStorming = !state.isStorming;
        state.nextStormChange = Math.random() * 30 + (state.isStorming ? 10 : 20);
      }
      
      const targetIntensity = state.isStorming ? 1 : 0;
      state.stormIntensity += (targetIntensity - state.stormIntensity) * 0.02;
      
      // Update weather particles
      state.weatherParticles.forEach(p => {
        p.wobble += p.wobbleSpeed;
        
        switch (state.season) {
          case SEASONS.SPRING:
            p.y += p.speed * state.stormIntensity;
            p.x -= 1;
            break;
          case SEASONS.SUMMER:
            p.y += p.speed * 0.3 * state.stormIntensity;
            p.x -= p.horizontal * state.stormIntensity;
            break;
          case SEASONS.FALL:
            p.y += p.speed * state.stormIntensity;
            p.x -= (2 + Math.sin(p.wobble) * 2) * state.stormIntensity;
            p.rotation += p.rotationSpeed * state.stormIntensity;
            break;
          case SEASONS.WINTER:
            p.y += p.speed * state.stormIntensity;
            p.x += Math.sin(p.wobble) * 0.5 * state.stormIntensity;
            break;
          default:
            break;
        }
        
        if (p.y > canvasSize.height || p.x < -50) {
          p.x = Math.random() * canvasSize.width * 1.5;
          p.y = -20;
          if (state.season === SEASONS.FALL) {
            p.rotation = Math.random() * 360;
          }
        }
      });

      // ============ SPAWN HEARTS ============
      state.nextHeartSpawn -= deltaTime;
      if (state.nextHeartSpawn <= 0 && state.lives < GAME_CONFIG.MAX_LIVES) {
        spawnHeart();
        state.nextHeartSpawn = GAME_CONFIG.HEART_SPAWN_INTERVAL + Math.random() * 30;
      }

      // ============ SPAWN CARS ============
      state.nextCarSpawn -= deltaTime;
      if (state.nextCarSpawn <= 0) {
        spawnCar();
        state.nextCarSpawn = GAME_CONFIG.CAR_SPAWN_MIN_INTERVAL + Math.random() * (GAME_CONFIG.CAR_SPAWN_MAX_INTERVAL - GAME_CONFIG.CAR_SPAWN_MIN_INTERVAL);
      }

      // ============ GAME LOGIC ============
      state.speed = Math.min(GAME_CONFIG.MAX_SPEED, state.speed + GAME_CONFIG.SPEED_INCREMENT);
      state.distance += state.speed / 10;
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

      // Invincibility timer
      if (state.isInvincible) {
        state.invincibleTimer--;
        if (state.invincibleTimer <= 0) {
          state.isInvincible = false;
        }
      }

      // Spawn objects
      state.nextSpawnDistance -= state.speed;
      if (state.nextSpawnDistance <= 0) {
        spawnGameObject();
      }

      // Update clouds
      state.clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
          cloud.x = canvasSize.width + cloud.width;
          cloud.y = Math.random() * 150 + 30;
        }
      });

      // Update houses
      state.houses.forEach(house => {
        house.x -= state.speed * 0.3;
        if (house.x + house.width < 0) {
          house.x = canvasSize.width + Math.random() * 200;
          house.color = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 5)];
        }
      });

      // Update hearts
      state.hearts = state.hearts.filter(heart => {
        heart.x -= state.speed;
        heart.pulse += 0.1;
        
        // Check collection
        const playerBox = {
          x: state.player.x,
          y: state.player.y,
          width: GAME_CONFIG.PLAYER_WIDTH,
          height: GAME_CONFIG.PLAYER_HEIGHT,
        };
        
        if (
          playerBox.x < heart.x + heart.width &&
          playerBox.x + playerBox.width > heart.x &&
          playerBox.y < heart.y + heart.height &&
          playerBox.y + playerBox.height > heart.y
        ) {
          if (state.lives < GAME_CONFIG.MAX_LIVES) {
            state.lives++;
            soundManager.playHeal();
            addParticles(heart.x + heart.width / 2, heart.y + heart.height / 2, '#E91E63', 15);
          }
          return false;
        }
        
        return heart.x > -50;
      });

      // Update cars
      state.cars = state.cars.filter(car => {
        car.x += car.speed;
        
        // Check collision with player
        if (!state.isInvincible) {
          const playerBox = {
            x: state.player.x + 10,
            y: state.player.y + 10,
            width: GAME_CONFIG.PLAYER_WIDTH - 20,
            height: GAME_CONFIG.PLAYER_HEIGHT - 10,
          };
          
          const carBox = {
            x: car.x,
            y: car.y - 45,
            width: car.width,
            height: 60,
          };
          
          if (
            playerBox.x < carBox.x + carBox.width &&
            playerBox.x + playerBox.width > carBox.x &&
            playerBox.y < carBox.y + carBox.height &&
            playerBox.y + playerBox.height > carBox.y
          ) {
            state.lives -= 2; // Cars do 2 damage!
            state.isInvincible = true;
            state.invincibleTimer = 120;
            addParticles(state.player.x + GAME_CONFIG.PLAYER_WIDTH / 2, state.player.y + GAME_CONFIG.PLAYER_HEIGHT / 2, '#FF6B6B', 20);
            soundManager.playThud();
            
            if (state.lives <= 0) {
              state.lives = 0;
              soundManager.stopMusic();
              onGameOver(state.score, state.deliveries, Math.floor(state.distance));
            }
          }
        }
        
        // Remove if off screen
        if (car.speed > 0) {
          return car.x < canvasSize.width + 200;
        } else {
          return car.x > -200;
        }
      });

      // Update obstacles
      state.obstacles = state.obstacles.filter(obs => {
        obs.x -= state.speed;
        
        // Animate specific obstacles
        if (obs.type === 'dog') obs.frame = (obs.frame + 0.2) % 2;
        if (obs.type === 'basketball') obs.bounce += 0.15;
        if (obs.type === 'child') obs.frame += 0.1;
        if (obs.type === 'baby') obs.wheelFrame += 0.1;
        
        // Collision detection
        if (!state.isInvincible) {
          const playerBox = {
            x: state.player.x + 10,
            y: state.player.y + 10,
            width: GAME_CONFIG.PLAYER_WIDTH - 20,
            height: GAME_CONFIG.PLAYER_HEIGHT - 10,
          };
          
          if (
            playerBox.x < obs.x + obs.width &&
            playerBox.x + playerBox.width > obs.x &&
            playerBox.y < obs.y + obs.height &&
            playerBox.y + playerBox.height > obs.y
          ) {
            state.lives--;
            state.isInvincible = true;
            state.invincibleTimer = 120;
            addParticles(state.player.x + GAME_CONFIG.PLAYER_WIDTH / 2, state.player.y + GAME_CONFIG.PLAYER_HEIGHT / 2, '#FF6B6B', 15);
            
            // Play appropriate sound
            if (obs.type === 'dog') {
              soundManager.playBark();
            } else if (obs.type === 'baby') {
              soundManager.playBabyCry();
            } else {
              soundManager.playThud();
            }
            
            if (state.lives <= 0) {
              state.lives = 0;
              soundManager.stopMusic();
              onGameOver(state.score, state.deliveries, Math.floor(state.distance));
            }
          }
        }
        
        return obs.x + obs.width > -50;
      });

      // Update mailboxes
      state.mailboxes = state.mailboxes.filter(box => {
        box.x -= state.speed;
        return box.x + box.width > -50;
      });

      // Update mails
      state.mails = state.mails.filter(mail => {
        mail.x += mail.vx;
        mail.y += mail.vy;
        mail.vy += 0.5;
        mail.rotation += 15;

        for (let box of state.mailboxes) {
          if (
            !box.hasDelivery &&
            mail.x + 20 > box.x - 10 &&
            mail.x < box.x + box.width + 10 &&
            mail.y + 20 > box.y - 10 &&
            mail.y < box.y + box.height + 20
          ) {
            box.hasDelivery = true;
            state.deliveries++;
            state.score += GAME_CONFIG.DELIVERY_POINTS;
            addParticles(box.x + box.width / 2, box.y, '#4ECDC4', 20);
            soundManager.playDelivery();
            return false;
          }
        }

        return mail.y < canvasSize.height && mail.x < canvasSize.width + 100;
      });

      // Update particles
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life -= 0.02;
        return p.life > 0;
      });

      // Update score callback
      onScoreUpdate(state.score, state.deliveries, Math.floor(state.distance), state.lives);

      // ============ RENDERING ============
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

      const seasonConfig = SEASON_CONFIG[state.season];
      const nightAmount = (Math.sin(state.dayNightProgress * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      
      // Sky
      const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
      const skyTopDay = hexToRgb(seasonConfig.skyDay[0]);
      const skyBottomDay = hexToRgb(seasonConfig.skyDay[1]);
      const skyTopNight = hexToRgb(seasonConfig.skyNight[0]);
      const skyBottomNight = hexToRgb(seasonConfig.skyNight[1]);
      
      skyGradient.addColorStop(0, lerpColor(skyTopDay, skyTopNight, nightAmount));
      skyGradient.addColorStop(1, lerpColor(skyBottomDay, skyBottomNight, nightAmount));
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvasSize.width, groundY);

      // Sun/Moon
      const celestialX = canvasSize.width - 100;
      const celestialY = 50 + Math.sin(state.dayNightProgress * Math.PI * 2) * 30;
      
      if (nightAmount < 0.5) {
        ctx.fillStyle = `rgba(255, 217, 61, ${1 - nightAmount * 2})`;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 217, 61, ${(1 - nightAmount * 2) * 0.3})`;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 70, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(230, 230, 250, ${(nightAmount - 0.5) * 2})`;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(200, 200, 220, ${(nightAmount - 0.5) * 2})`;
        ctx.beginPath();
        ctx.arc(celestialX - 10, celestialY - 5, 8, 0, Math.PI * 2);
        ctx.arc(celestialX + 12, celestialY + 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars
      if (nightAmount > 0.3) {
        const starAlpha = (nightAmount - 0.3) / 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * 0.8})`;
        for (let i = 0; i < 50; i++) {
          const starX = (i * 137.5 + state.gameTime * 0.5) % canvasSize.width;
          const starY = (i * 97.3) % (groundY - 100) + 20;
          const starSize = (Math.sin(state.gameTime * 2 + i) + 1) * 1.5 + 0.5;
          ctx.beginPath();
          ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Clouds
      const cloudAlpha = 1 - nightAmount * 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * cloudAlpha})`;
      state.clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.width / 4, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Houses
      state.houses.forEach(house => {
        const houseBottom = groundY - 30;
        ctx.fillStyle = house.color;
        ctx.fillRect(house.x, houseBottom - house.height, house.width, house.height);
        ctx.fillStyle = house.roofColor;
        ctx.beginPath();
        ctx.moveTo(house.x - 10, houseBottom - house.height);
        ctx.lineTo(house.x + house.width / 2, houseBottom - house.height - 40);
        ctx.lineTo(house.x + house.width + 10, houseBottom - house.height);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(house.x + house.width / 2 - 10, houseBottom - 35, 20, 35);
        const windowGlow = nightAmount > 0.4 ? (nightAmount - 0.4) / 0.6 : 0;
        ctx.fillStyle = windowGlow > 0 ? `rgba(255, 220, 100, ${0.8 * windowGlow})` : '#81D4FA';
        ctx.fillRect(house.x + 15, houseBottom - house.height + 20, 20, 20);
        ctx.fillRect(house.x + house.width - 35, houseBottom - house.height + 20, 20, 20);
      });

      // Grass
      const grassGradient = ctx.createLinearGradient(0, groundY - 30, 0, groundY);
      const grassLight = hexToRgb(seasonConfig.grassColor[0]);
      const grassDark = hexToRgb(seasonConfig.grassColor[1]);
      grassGradient.addColorStop(0, lerpColor(grassLight, 'rgb(40, 60, 40)', nightAmount * 0.5));
      grassGradient.addColorStop(1, lerpColor(grassDark, 'rgb(30, 50, 30)', nightAmount * 0.5));
      ctx.fillStyle = grassGradient;
      ctx.fillRect(0, groundY - 30, canvasSize.width, 30);

      // Road
      const roadColor = nightAmount > 0.5 ? '#404040' : '#616161';
      ctx.fillStyle = roadColor;
      ctx.fillRect(0, groundY, canvasSize.width, GAME_CONFIG.GROUND_HEIGHT);
      ctx.fillStyle = '#FFD54F';
      const markingOffset = (state.distance * 5) % 80;
      for (let i = -1; i < canvasSize.width / 80 + 1; i++) {
        ctx.fillRect(i * 80 - markingOffset, groundY + GAME_CONFIG.GROUND_HEIGHT / 2 - 3, 40, 6);
      }

      // Sidewalk
      ctx.fillStyle = nightAmount > 0.5 ? '#909090' : '#BDBDBD';
      ctx.fillRect(0, groundY - 5, canvasSize.width, 10);

      // Draw cars (behind player)
      state.cars.forEach(car => drawCar(ctx, car));

      // Mailboxes
      state.mailboxes.forEach(box => {
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(box.x + 10, box.y, 10, box.height);
        ctx.fillStyle = box.hasDelivery ? '#4CAF50' : '#1565C0';
        ctx.fillRect(box.x, box.y, box.width, 25);
        ctx.fillStyle = box.hasDelivery ? '#4CAF50' : '#F44336';
        ctx.fillRect(box.x + box.width - 5, box.y + 5, 8, 15);
      });

      // Hearts
      state.hearts.forEach(heart => drawHeart(ctx, heart));

      // Obstacles
      state.obstacles.forEach(obs => drawObstacle(ctx, obs, state));

      // Mails
      state.mails.forEach(mail => {
        ctx.save();
        ctx.translate(mail.x + 10, mail.y + 7);
        ctx.rotate((mail.rotation * Math.PI) / 180);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(-10, -7, 20, 14);
        ctx.strokeStyle = '#1565C0';
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -7, 20, 14);
        ctx.beginPath();
        ctx.moveTo(-10, -7);
        ctx.lineTo(0, 2);
        ctx.lineTo(10, -7);
        ctx.stroke();
        ctx.restore();
      });

      // Player
      const px = state.player.x;
      const py = state.player.y;
      const flash = state.isInvincible && Math.floor(state.invincibleTimer / 5) % 2 === 0;
      
      if (!flash) {
        ctx.fillStyle = '#1A237E';
        const legAnim = Math.sin(state.distance * 0.3) * (state.player.isOnGround ? 5 : 0);
        ctx.fillRect(px + 10, py + 50, 12, 20 + legAnim);
        ctx.fillRect(px + 28, py + 50, 12, 20 - legAnim);
        
        ctx.fillStyle = '#1976D2';
        ctx.fillRect(px + 8, py + 25, 34, 30);
        
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(px + 38, py + 30, 15, 20);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(px + 41, py + 35, 9, 10);
        
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath();
        ctx.arc(px + 25, py + 15, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1976D2';
        ctx.fillRect(px + 8, py + 5, 34, 8);
        ctx.fillRect(px + 12, py - 5, 26, 12);
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(px + 20, py + 13, 2, 0, Math.PI * 2);
        ctx.arc(px + 30, py + 13, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + 25, py + 18, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        const armAngle = state.lastMailThrow > Date.now() - 200 ? -0.5 : 0;
        ctx.save();
        ctx.translate(px + 40, py + 35);
        ctx.rotate(armAngle);
        ctx.fillStyle = '#FFCC80';
        ctx.fillRect(0, -5, 15, 10);
        ctx.restore();
      }

      // Weather
      drawWeatherParticles(ctx, state, seasonConfig);

      // Storm overlay
      if (state.stormIntensity > 0.1) {
        const overlayAlpha = state.stormIntensity * 0.15;
        ctx.fillStyle = state.season === SEASONS.WINTER 
          ? `rgba(200, 220, 255, ${overlayAlpha})`
          : state.season === SEASONS.SUMMER
            ? `rgba(255, 220, 180, ${overlayAlpha})`
            : `rgba(100, 100, 120, ${overlayAlpha})`;
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      }

      // Effect particles
      state.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Season/time indicator
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(canvasSize.width - 140, canvasSize.height - 45, 130, 35);
      ctx.fillStyle = '#FFF';
      ctx.font = '14px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${seasonConfig.name} ${nightAmount > 0.5 ? '🌙' : '☀️'}`, canvasSize.width - 75, canvasSize.height - 22);
      if (state.isStorming) {
        const weatherEmoji = state.season === SEASONS.WINTER ? '❄️' : 
                            state.season === SEASONS.SUMMER ? '🏜️' :
                            state.season === SEASONS.FALL ? '🍂' : '🌧️';
        ctx.fillText(weatherEmoji, canvasSize.width - 75, canvasSize.height - 5);
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvasSize, isPlaying, initGame, spawnGameObject, spawnHeart, spawnCar, onGameOver, onScoreUpdate, addParticles]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      className="absolute inset-0 game-canvas"
    />
  );
};

export default GameCanvas;
