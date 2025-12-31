import React, { useRef, useEffect, useCallback, useState } from 'react';

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
  });
  
  const animationRef = useRef(null);
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
    };
  }, [canvasSize]);

  // Spawn obstacle or mailbox
  const spawnGameObject = useCallback(() => {
    const state = gameStateRef.current;
    const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;
    const spawnX = canvasSize.width + 100;

    if (Math.random() < GAME_CONFIG.MAILBOX_SPAWN_CHANCE) {
      // Spawn mailbox
      state.mailboxes.push({
        x: spawnX,
        y: groundY - 60,
        width: 30,
        height: 60,
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

  // Main game loop
  useEffect(() => {
    if (!canvasRef.current || canvasSize.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    initGame();

    const gameLoop = () => {
      if (!isPlaying) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const state = gameStateRef.current;
      const groundY = canvasSize.height - GAME_CONFIG.GROUND_HEIGHT;

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
            state.invincibleTimer = 120; // 2 seconds at 60fps
            addParticles(state.player.x + GAME_CONFIG.PLAYER_WIDTH / 2, state.player.y + GAME_CONFIG.PLAYER_HEIGHT / 2, '#FF6B6B', 15);
            
            if (state.lives <= 0) {
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
        mail.vy += 0.5; // gravity
        mail.rotation += 15;

        // Check mailbox collision
        for (let box of state.mailboxes) {
          if (
            !box.hasDelivery &&
            mail.x + 15 > box.x &&
            mail.x < box.x + box.width &&
            mail.y + 15 > box.y &&
            mail.y < box.y + box.height
          ) {
            box.hasDelivery = true;
            box.animating = true;
            state.deliveries++;
            state.score += GAME_CONFIG.DELIVERY_POINTS;
            addParticles(box.x + box.width / 2, box.y, '#4ECDC4', 20);
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

      // Update score callback - include lives for damage tracking
      onScoreUpdate(state.score, state.deliveries, Math.floor(state.distance), state.lives);

      // --- RENDERING ---
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

      // Draw sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(1, '#B0E0E6');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvasSize.width, groundY);

      // Draw sun
      ctx.fillStyle = '#FFD93D';
      ctx.beginPath();
      ctx.arc(canvasSize.width - 100, 80, 50, 0, Math.PI * 2);
      ctx.fill();

      // Draw clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      state.clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.width / 4, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw houses (background)
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
        // Window
        ctx.fillStyle = '#81D4FA';
        ctx.fillRect(house.x + 15, houseBottom - house.height + 20, 20, 20);
        ctx.fillRect(house.x + house.width - 35, houseBottom - house.height + 20, 20, 20);
      });

      // Draw grass
      const grassGradient = ctx.createLinearGradient(0, groundY - 30, 0, groundY);
      grassGradient.addColorStop(0, '#7CB342');
      grassGradient.addColorStop(1, '#558B2F');
      ctx.fillStyle = grassGradient;
      ctx.fillRect(0, groundY - 30, canvasSize.width, 30);

      // Draw road
      ctx.fillStyle = '#616161';
      ctx.fillRect(0, groundY, canvasSize.width, GAME_CONFIG.GROUND_HEIGHT);
      // Road markings
      ctx.fillStyle = '#FFD54F';
      const markingOffset = (state.distance * 5) % 80;
      for (let i = -1; i < canvasSize.width / 80 + 1; i++) {
        ctx.fillRect(i * 80 - markingOffset, groundY + GAME_CONFIG.GROUND_HEIGHT / 2 - 3, 40, 6);
      }

      // Draw sidewalk
      ctx.fillStyle = '#BDBDBD';
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
            // Dog body
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(obs.x, obs.y + 10, 40, 25);
            // Dog head
            ctx.beginPath();
            ctx.arc(obs.x + 45, obs.y + 15, 12, 0, Math.PI * 2);
            ctx.fill();
            // Dog legs (animated)
            const legOffset = Math.floor(obs.frame) * 5;
            ctx.fillRect(obs.x + 5, obs.y + 30, 8, 10 + legOffset);
            ctx.fillRect(obs.x + 25, obs.y + 30, 8, 10 - legOffset);
            // Eye
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
            // White stripes
            ctx.fillStyle = '#FFF';
            ctx.fillRect(obs.x + 5, obs.y + 20, obs.width - 10, 8);
            ctx.fillRect(obs.x + 3, obs.y + 35, obs.width - 6, 8);
            break;
          case 'hydrant':
            ctx.fillStyle = '#C62828';
            ctx.fillRect(obs.x + 5, obs.y, 20, obs.height);
            ctx.fillRect(obs.x, obs.y + 10, obs.width, 15);
            // Top
            ctx.beginPath();
            ctx.arc(obs.x + 15, obs.y, 10, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'trash':
            ctx.fillStyle = '#37474F';
            ctx.fillRect(obs.x, obs.y + 10, obs.width, obs.height - 10);
            // Lid
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
        // Envelope
        ctx.fillStyle = '#FFF';
        ctx.fillRect(-10, -7, 20, 14);
        ctx.strokeStyle = '#1565C0';
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -7, 20, 14);
        // Envelope flap
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
        // Legs
        ctx.fillStyle = '#1A237E';
        const legAnim = Math.sin(state.distance * 0.3) * (state.player.isOnGround ? 5 : 0);
        ctx.fillRect(px + 10, py + 50, 12, 20 + legAnim);
        ctx.fillRect(px + 28, py + 50, 12, 20 - legAnim);
        
        // Body
        ctx.fillStyle = '#1976D2';
        ctx.fillRect(px + 8, py + 25, 34, 30);
        
        // Mail bag
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(px + 38, py + 30, 15, 20);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(px + 41, py + 35, 9, 10);
        
        // Head
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath();
        ctx.arc(px + 25, py + 15, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Hat
        ctx.fillStyle = '#1976D2';
        ctx.fillRect(px + 8, py + 5, 34, 8);
        ctx.fillRect(px + 12, py - 5, 26, 12);
        
        // Face
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(px + 20, py + 13, 2, 0, Math.PI * 2);
        ctx.arc(px + 30, py + 13, 2, 0, Math.PI * 2);
        ctx.fill();
        // Smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + 25, py + 18, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        // Arm throwing animation
        const armAngle = state.lastMailThrow > Date.now() - 200 ? -0.5 : 0;
        ctx.save();
        ctx.translate(px + 40, py + 35);
        ctx.rotate(armAngle);
        ctx.fillStyle = '#FFCC80';
        ctx.fillRect(0, -5, 15, 10);
        ctx.restore();
      }

      // Draw particles
      state.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

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
