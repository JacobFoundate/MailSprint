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
  
  // Ground
  GROUND_HEIGHT: 100,
  
  // Game speed
  INITIAL_SPEED: 6,
  MAX_SPEED: 15,
  SPEED_INCREMENT: 0.001,
  
  // Spawning
  MIN_SPAWN_DISTANCE: 300,
  MAX_SPAWN_DISTANCE: 600,
  MAILBOX_SPAWN_CHANCE: 0.4,
  
  // Obstacles
  OBSTACLE_TYPES: ['dog', 'pylon', 'hydrant', 'trash'],
  
  // Scoring
  DELIVERY_POINTS: 100,
  DISTANCE_POINTS: 1,
  BONUS_MULTIPLIER: 1.5,
  
  // Time & Weather
  DAY_NIGHT_CYCLE_DURATION: 120, // 2 minutes in seconds
  CYCLES_PER_SEASON: 15,
  WEATHER_PARTICLE_COUNT: 100,
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
    weatherColor: 'rgba(120, 180, 255, 0.6)', // Rain - light blue
  },
  [SEASONS.SUMMER]: {
    name: 'Summer',
    skyDay: ['#4FB4E8', '#87CEEB'],
    skyNight: ['#0f0f23', '#1a1a3e'],
    grassColor: ['#8BC34A', '#689F38'],
    treeColor: '#228B22',
    weatherColor: 'rgba(210, 180, 140, 0.7)', // Sand - tan
  },
  [SEASONS.FALL]: {
    name: 'Fall',
    skyDay: ['#E8A87C', '#C38D6B'],
    skyNight: ['#2d1b4e', '#1a1a2e'],
    grassColor: ['#D4A574', '#8B7355'],
    treeColor: '#D2691E',
    weatherColor: 'rgba(205, 92, 0, 0.8)', // Maple leaves - orange
  },
  [SEASONS.WINTER]: {
    name: 'Winter',
    skyDay: ['#B0C4DE', '#87CEEB'],
    skyNight: ['#0a1628', '#162447'],
    grassColor: ['#E8E8E8', '#C0C0C0'],
    treeColor: '#8B4513',
    weatherColor: 'rgba(255, 255, 255, 0.9)', // Snow - white
  },
};

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
    case SEASONS.SPRING: // Rain
      return { ...baseParticle, size: 2, speed: Math.random() * 8 + 10, length: Math.random() * 15 + 10 };
    case SEASONS.SUMMER: // Sand
      return { ...baseParticle, size: Math.random() * 3 + 1, speed: Math.random() * 4 + 6, horizontal: Math.random() * 3 + 2 };
    case SEASONS.FALL: // Maple leaves
      return { ...baseParticle, size: Math.random() * 8 + 6, speed: Math.random() * 2 + 1, rotation: Math.random() * 360, rotationSpeed: Math.random() * 5 - 2.5 };
    case SEASONS.WINTER: // Snow
      return { ...baseParticle, size: Math.random() * 4 + 2, speed: Math.random() * 1.5 + 0.5 };
    default:
      return baseParticle;
  }
};

const GameCanvas = ({ isPlaying, onGameOver, onScoreUpdate }) => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef({
    player: {
      x: GAME_CONFIG.PLAYER_X,
      y: 0,
      vy: 0,
      isJumping: false,
      isOnGround: true,
    },
    obstacles: [],
    mailboxes: [],
    mails: [],
    clouds: [],
    houses: [],
    score: 0,
    deliveries: 0,
    distance: 0,
    speed: GAME_CONFIG.INITIAL_SPEED,
    nextSpawnDistance: GAME_CONFIG.MIN_SPAWN_DISTANCE,
    lives: 3,
    isInvincible: false,
    invincibleTimer: 0,
    lastMailThrow: 0,
    particles: [],
    // Time & Weather
    gameTime: 0,
    dayNightProgress: 0, // 0 to 1 (0 = noon, 0.5 = midnight, 1 = noon again)
    cycleCount: 0,
    season: SEASONS.SPRING,
    weatherParticles: [],
    isStorming: false,
    stormIntensity: 0,
    nextStormChange: Math.random() * 30 + 15, // Random storm timing
  });
  
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
      score: 0,
      deliveries: 0,
      distance: 0,
      speed: GAME_CONFIG.INITIAL_SPEED,
      nextSpawnDistance: GAME_CONFIG.MIN_SPAWN_DISTANCE,
      lives: 3,
      isInvincible: false,
      invincibleTimer: 0,
      lastMailThrow: 0,
      particles: [],
      // Time & Weather
      gameTime: 0,
      dayNightProgress: 0,
      cycleCount: 0,
      season: SEASONS.SPRING,
      weatherParticles: generateWeatherParticles(canvasSize.width, canvasSize.height, SEASONS.SPRING),
      isStorming: false,
      stormIntensity: 0,
      nextStormChange: Math.random() * 30 + 15,
    };
    lastTimeRef.current = performance.now();
  }, [canvasSize]);

  // Spawn obstacle or mailbox
  const spawnGameObject = useCallback(() => {
    const state = gameStateRef.current;
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
    const spawnX = canvasSize.width + 100;

    if (Math.random() < GAME_CONFIG.MAILBOX_SPAWN_CHANCE) {
      // Spawn mailbox - larger hitbox for easier deliveries
      state.mailboxes.push({
        x: spawnX,
        y: groundY - 80,
        width: 50,
        height: 80,
        hasDelivery: false,
        animating: false,
      });
    } else {
      // Spawn obstacle
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
        default:
          obstacle = { ...obstacle, y: groundY - 40, width: 40, height: 40 };
      }
      
      state.obstacles.push(obstacle);
    }

    // Set next spawn distance
    state.nextSpawnDistance = Math.random() * (GAME_CONFIG.MAX_SPAWN_DISTANCE - GAME_CONFIG.MIN_SPAWN_DISTANCE) + GAME_CONFIG.MIN_SPAWN_DISTANCE;
  }, [canvasSize]);

  // Jump action
  const jump = useCallback(() => {
    const state = gameStateRef.current;
    if (state.player.isOnGround) {
      state.player.vy = GAME_CONFIG.JUMP_FORCE;
      state.player.isJumping = true;
      state.player.isOnGround = false;
      soundManager.playJump();
    }
  }, []);

  // Throw mail action
  const throwMail = useCallback(() => {
    const state = gameStateRef.current;
    const now = Date.now();
    
    if (now - state.lastMailThrow < 300) return; // Cooldown
    
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

  // Interpolate between two colors
  const lerpColor = (color1, color2, t) => {
    const c1 = color1.match(/\d+/g).map(Number);
    const c2 = color2.match(/\d+/g).map(Number);
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Convert hex to rgb string
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
        case SEASONS.SPRING: // Rain
          ctx.strokeStyle = `rgba(120, 180, 255, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + p.length);
          ctx.stroke();
          break;
          
        case SEASONS.SUMMER: // Sand particles
          ctx.fillStyle = `rgba(210, 180, 140, ${alpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case SEASONS.FALL: // Maple leaves
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = `rgba(${180 + Math.random() * 40}, ${60 + Math.random() * 40}, 0, ${alpha})`;
          // Draw simple leaf shape
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.quadraticCurveTo(p.size / 2, -p.size / 4, p.size / 2, 0);
          ctx.quadraticCurveTo(p.size / 2, p.size / 4, 0, p.size / 2);
          ctx.quadraticCurveTo(-p.size / 2, p.size / 4, -p.size / 2, 0);
          ctx.quadraticCurveTo(-p.size / 2, -p.size / 4, 0, -p.size / 2);
          ctx.fill();
          break;
          
        case SEASONS.WINTER: // Snow
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          // Add sparkle
          if (Math.random() > 0.95) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 1.5})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        default:
          break;
      }
      
      ctx.restore();
    });
  };

  // Main game loop
  useEffect(() => {
    if (!canvasRef.current || canvasSize.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    initGame();

    const gameLoop = (currentTime) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = currentTime;

      if (!isPlaying) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const state = gameStateRef.current;
      const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;

      // ============ UPDATE TIME & WEATHER ============
      state.gameTime += deltaTime;
      
      // Day/Night cycle (2 minutes = 120 seconds per cycle)
      const cycleProgress = (state.gameTime % GAME_CONFIG.DAY_NIGHT_CYCLE_DURATION) / GAME_CONFIG.DAY_NIGHT_CYCLE_DURATION;
      state.dayNightProgress = cycleProgress;
      
      // Check for new cycle
      const newCycleCount = Math.floor(state.gameTime / GAME_CONFIG.DAY_NIGHT_CYCLE_DURATION);
      if (newCycleCount > state.cycleCount) {
        state.cycleCount = newCycleCount;
        // Check for season change (every 15 cycles)
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
        state.nextStormChange = Math.random() * 30 + (state.isStorming ? 10 : 20); // Storm lasts 10-40s, clear 20-50s
      }
      
      // Update storm intensity (smooth transition)
      const targetIntensity = state.isStorming ? 1 : 0;
      state.stormIntensity += (targetIntensity - state.stormIntensity) * 0.02;
      
      // Update weather particles
      state.weatherParticles.forEach(p => {
        p.wobble += p.wobbleSpeed;
        
        switch (state.season) {
          case SEASONS.SPRING: // Rain - falls straight down fast
            p.y += p.speed * state.stormIntensity;
            p.x -= 1; // Slight wind
            break;
          case SEASONS.SUMMER: // Sand - blows horizontally
            p.y += p.speed * 0.3 * state.stormIntensity;
            p.x -= p.horizontal * state.stormIntensity;
            break;
          case SEASONS.FALL: // Leaves - flutter down
            p.y += p.speed * state.stormIntensity;
            p.x -= (2 + Math.sin(p.wobble) * 2) * state.stormIntensity;
            p.rotation += p.rotationSpeed * state.stormIntensity;
            break;
          case SEASONS.WINTER: // Snow - drifts down slowly
            p.y += p.speed * state.stormIntensity;
            p.x += Math.sin(p.wobble) * 0.5 * state.stormIntensity;
            break;
          default:
            break;
        }
        
        // Reset particle if off screen
        if (p.y > canvasSize.height || p.x < -50) {
          p.x = Math.random() * canvasSize.width * 1.5;
          p.y = -20;
          if (state.season === SEASONS.FALL) {
            p.rotation = Math.random() * 360;
          }
        }
      });

      // ============ GAME LOGIC ============
      
      // Update game speed
      state.speed = Math.min(GAME_CONFIG.MAX_SPEED, state.speed + GAME_CONFIG.SPEED_INCREMENT);

      // Update distance and score
      state.distance += state.speed / 10;
      state.score += GAME_CONFIG.DISTANCE_POINTS;

      // Update player physics
      state.player.vy += GAME_CONFIG.GRAVITY;
      state.player.vy = Math.min(state.player.vy, GAME_CONFIG.MAX_FALL_SPEED);
      state.player.y += state.player.vy;

      // Ground collision
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

      // Spawn new objects
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

      // Update obstacles
      state.obstacles = state.obstacles.filter(obs => {
        obs.x -= state.speed;
        if (obs.type === 'dog') obs.frame = (obs.frame + 0.2) % 2;
        
        // Collision detection with player
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
            
            if (obs.type === 'dog') {
              soundManager.playBark();
            } else {
              soundManager.playThud();
            }
            
            if (state.lives <= 0) {
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
            box.animating = true;
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
      
      // Calculate day/night interpolation (0 = day, 1 = night)
      // Use sine wave for smooth transition
      const nightAmount = (Math.sin(state.dayNightProgress * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      
      // Draw sky gradient with day/night cycle
      const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
      const skyTopDay = hexToRgb(seasonConfig.skyDay[0]);
      const skyBottomDay = hexToRgb(seasonConfig.skyDay[1]);
      const skyTopNight = hexToRgb(seasonConfig.skyNight[0]);
      const skyBottomNight = hexToRgb(seasonConfig.skyNight[1]);
      
      skyGradient.addColorStop(0, lerpColor(skyTopDay, skyTopNight, nightAmount));
      skyGradient.addColorStop(1, lerpColor(skyBottomDay, skyBottomNight, nightAmount));
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvasSize.width, groundY);

      // Draw sun/moon
      const celestialX = canvasSize.width - 100;
      const celestialY = 50 + Math.sin(state.dayNightProgress * Math.PI * 2) * 30;
      
      if (nightAmount < 0.5) {
        // Sun
        ctx.fillStyle = `rgba(255, 217, 61, ${1 - nightAmount * 2})`;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 50, 0, Math.PI * 2);
        ctx.fill();
        // Sun glow
        ctx.fillStyle = `rgba(255, 217, 61, ${(1 - nightAmount * 2) * 0.3})`;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 70, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Moon
        ctx.fillStyle = `rgba(230, 230, 250, ${(nightAmount - 0.5) * 2})`;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 40, 0, Math.PI * 2);
        ctx.fill();
        // Moon craters
        ctx.fillStyle = `rgba(200, 200, 220, ${(nightAmount - 0.5) * 2})`;
        ctx.beginPath();
        ctx.arc(celestialX - 10, celestialY - 5, 8, 0, Math.PI * 2);
        ctx.arc(celestialX + 12, celestialY + 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw stars at night
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

      // Draw clouds (darker at night)
      const cloudAlpha = 1 - nightAmount * 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * cloudAlpha})`;
      state.clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.width / 4, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw houses (background) with lights at night
      state.houses.forEach(house => {
        const houseBottom = groundY - 30;
        // House body
        ctx.fillStyle = house.color;
        ctx.fillRect(house.x, houseBottom - house.height, house.width, house.height);
        // Roof
        ctx.fillStyle = house.roofColor;
        ctx.beginPath();
        ctx.moveTo(house.x - 10, houseBottom - house.height);
        ctx.lineTo(house.x + house.width / 2, houseBottom - house.height - 40);
        ctx.lineTo(house.x + house.width + 10, houseBottom - house.height);
        ctx.closePath();
        ctx.fill();
        // Door
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(house.x + house.width / 2 - 10, houseBottom - 35, 20, 35);
        // Windows (glow at night)
        const windowGlow = nightAmount > 0.4 ? (nightAmount - 0.4) / 0.6 : 0;
        ctx.fillStyle = windowGlow > 0 ? `rgba(255, 220, 100, ${0.8 * windowGlow})` : '#81D4FA';
        ctx.fillRect(house.x + 15, houseBottom - house.height + 20, 20, 20);
        ctx.fillRect(house.x + house.width - 35, houseBottom - house.height + 20, 20, 20);
      });

      // Draw grass with seasonal colors
      const grassGradient = ctx.createLinearGradient(0, groundY - 30, 0, groundY);
      const grassLight = hexToRgb(seasonConfig.grassColor[0]);
      const grassDark = hexToRgb(seasonConfig.grassColor[1]);
      // Darken grass at night
      grassGradient.addColorStop(0, lerpColor(grassLight, 'rgb(40, 60, 40)', nightAmount * 0.5));
      grassGradient.addColorStop(1, lerpColor(grassDark, 'rgb(30, 50, 30)', nightAmount * 0.5));
      ctx.fillStyle = grassGradient;
      ctx.fillRect(0, groundY - 30, canvasSize.width, 30);

      // Draw road
      const roadColor = nightAmount > 0.5 ? '#404040' : '#616161';
      ctx.fillStyle = roadColor;
      ctx.fillRect(0, groundY, canvasSize.width, GAME_CONFIG.GROUND_HEIGHT);
      // Road markings
      ctx.fillStyle = '#FFD54F';
      const markingOffset = (state.distance * 5) % 80;
      for (let i = -1; i < canvasSize.width / 80 + 1; i++) {
        ctx.fillRect(i * 80 - markingOffset, groundY + GAME_CONFIG.GROUND_HEIGHT / 2 - 3, 40, 6);
      }

      // Draw sidewalk
      ctx.fillStyle = nightAmount > 0.5 ? '#909090' : '#BDBDBD';
      ctx.fillRect(0, groundY - 5, canvasSize.width, 10);

      // Draw mailboxes
      state.mailboxes.forEach(box => {
        // Post
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(box.x + 10, box.y, 10, box.height);
        // Box
        ctx.fillStyle = box.hasDelivery ? '#4CAF50' : '#1565C0';
        ctx.fillRect(box.x, box.y, box.width, 25);
        // Flag
        ctx.fillStyle = box.hasDelivery ? '#4CAF50' : '#F44336';
        ctx.fillRect(box.x + box.width - 5, box.y + 5, 8, 15);
      });

      // Draw obstacles
      state.obstacles.forEach(obs => {
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
          default:
            ctx.fillStyle = '#757575';
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
      });

      // Draw mails
      ctx.fillStyle = '#FFF';
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

      // Draw player (Mailman)
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

      // Draw weather particles on top
      drawWeatherParticles(ctx, state, seasonConfig);

      // Draw storm overlay
      if (state.stormIntensity > 0.1) {
        const overlayAlpha = state.stormIntensity * 0.15;
        ctx.fillStyle = state.season === SEASONS.WINTER 
          ? `rgba(200, 220, 255, ${overlayAlpha})`
          : state.season === SEASONS.SUMMER
            ? `rgba(255, 220, 180, ${overlayAlpha})`
            : `rgba(100, 100, 120, ${overlayAlpha})`;
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      }

      // Draw effect particles
      state.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw season/time indicator
      ctx.fillStyle = `rgba(0, 0, 0, 0.5)`;
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
  }, [canvasSize, isPlaying, initGame, spawnGameObject, onGameOver, onScoreUpdate, addParticles]);

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
