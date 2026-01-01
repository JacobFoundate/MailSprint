import React, { useState, useCallback, useEffect, useRef } from 'react';
import StartScreen from '@/components/game/StartScreen';
import GameCanvas from '@/components/game/GameCanvas';
import GameOverScreen from '@/components/game/GameOverScreen';
import GameHUD from '@/components/game/GameHUD';
import MobileControls from '@/components/game/MobileControls';
import soundManager from '@/utils/SoundManager';
import { RotateCcw } from 'lucide-react';

const GamePage = () => {
  const gameCanvasRef = useRef(null);
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'paused', 'gameover'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('mailsprintHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [deliveries, setDeliveries] = useState(0);
  const [distance, setDistance] = useState(0);
  const [lives, setLives] = useState(5);
  const [damageFlash, setDamageFlash] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  // Check for portrait mode on mobile
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.matchMedia('(max-width: 768px)').matches || 
                       window.matchMedia('(pointer: coarse)').matches;
      const isPortraitMode = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobile && isPortraitMode);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Initialize sound on first interaction
  useEffect(() => {
    const initSound = () => {
      soundManager.init();
      window.removeEventListener('click', initSound);
      window.removeEventListener('keydown', initSound);
    };
    window.addEventListener('click', initSound);
    window.addEventListener('keydown', initSound);
    return () => {
      window.removeEventListener('click', initSound);
      window.removeEventListener('keydown', initSound);
    };
  }, []);

  const handleStartGame = useCallback(() => {
    setScore(0);
    setDeliveries(0);
    setDistance(0);
    setLives(5); // Start with 5 lives
    setGameState('playing');
    soundManager.init();
    soundManager.startMusic();
  }, []);

  const handleGameOver = useCallback((finalScore, finalDeliveries, finalDistance) => {
    setScore(finalScore);
    setDeliveries(finalDeliveries);
    setDistance(finalDistance);
    soundManager.stopMusic();
    
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('mailsprintHighScore', finalScore.toString());
    }
    
    setGameState('gameover');
  }, [highScore]);

  const handlePause = useCallback(() => {
    setGameState(prev => {
      if (prev === 'playing') {
        soundManager.stopMusic();
        return 'paused';
      } else {
        soundManager.startMusic();
        return 'playing';
      }
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleScoreUpdate = useCallback((newScore, newDeliveries, newDistance, newLives) => {
    setScore(newScore);
    setDeliveries(newDeliveries);
    setDistance(newDistance);
    if (newLives !== undefined) {
      setLives(prev => {
        // Trigger damage effect when lives decrease
        if (newLives < prev) {
          setDamageFlash(true);
          setScreenShake(true);
          setTimeout(() => setDamageFlash(false), 300);
          setTimeout(() => setScreenShake(false), 500);
        }
        return newLives;
      });
    }
  }, []);

  // Mobile control handlers
  const handleMobileJump = useCallback(() => {
    if (gameCanvasRef.current && gameState === 'playing') {
      gameCanvasRef.current.jump();
    }
  }, [gameState]);

  const handleMobileJumpRelease = useCallback(() => {
    if (gameCanvasRef.current && gameState === 'playing') {
      gameCanvasRef.current.releaseJump();
    }
  }, [gameState]);

  const handleMobileThrow = useCallback(() => {
    if (gameCanvasRef.current && gameState === 'playing') {
      gameCanvasRef.current.throwMail();
    }
  }, [gameState]);

  const handleMobileMoveLeft = useCallback((active) => {
    if (gameCanvasRef.current && gameState === 'playing') {
      gameCanvasRef.current.moveLeft(active);
    }
  }, [gameState]);

  const handleMobileMoveRight = useCallback((active) => {
    if (gameCanvasRef.current && gameState === 'playing') {
      gameCanvasRef.current.moveRight(active);
    }
  }, [gameState]);

  return (
    <div className={`game-container relative w-full h-screen overflow-hidden bg-background ${screenShake ? 'animate-shake' : ''}`}>
      {/* Portrait Mode Warning for Mobile */}
      {isPortrait && (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-sky-600 z-[100] flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-sm">
            <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <RotateCcw className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h2 className="font-fredoka text-2xl text-gray-800 mb-3">Rotate Your Device</h2>
            <p className="text-gray-600 mb-4">
              MailSprint plays best in <strong>landscape mode</strong>! 
              Turn your phone sideways to see obstacles coming and enjoy the full experience.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span className="inline-block w-8 h-12 border-2 border-gray-400 rounded-md"></span>
              <span className="text-2xl">→</span>
              <span className="inline-block w-12 h-8 border-2 border-primary rounded-md bg-primary/10"></span>
            </div>
          </div>
        </div>
      )}

      {/* Damage Flash Overlay */}
      {damageFlash && (
        <div className="absolute inset-0 bg-destructive/30 z-50 pointer-events-none animate-pulse" />
      )}
      
      {/* Game Canvas - Always rendered but visibility controlled */}
      <div className={`absolute inset-0 ${gameState === 'start' ? 'pointer-events-none' : ''}`}>
        {gameState !== 'start' && (
          <>
            <GameHUD
              score={score}
              deliveries={deliveries}
              distance={distance}
              lives={lives}
              isPaused={gameState === 'paused'}
              onPause={handlePause}
              damageFlash={damageFlash}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
            <GameCanvas
              ref={gameCanvasRef}
              isPlaying={gameState === 'playing'}
              onGameOver={handleGameOver}
              onScoreUpdate={handleScoreUpdate}
            />
            {/* Mobile Controls - Only visible on touch devices */}
            <MobileControls
              onJump={handleMobileJump}
              onJumpRelease={handleMobileJumpRelease}
              onThrow={handleMobileThrow}
            />
          </>
        )}
      </div>

      {/* Overlay Screens */}
      {gameState === 'start' && (
        <StartScreen
          onStart={handleStartGame}
          highScore={highScore}
        />
      )}

      {gameState === 'gameover' && (
        <GameOverScreen
          score={score}
          highScore={highScore}
          deliveries={deliveries}
          distance={distance}
          onRestart={handleStartGame}
          isNewHighScore={score === highScore && score > 0}
        />
      )}

      {/* Pause Overlay */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-card rounded-3xl p-8 shadow-elevated text-center animate-bounce-in">
            <h2 className="font-fredoka text-4xl text-foreground mb-4">Paused</h2>
            <p className="text-muted-foreground mb-6">Press Space or click to continue</p>
            <button
              onClick={handlePause}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-fredoka text-lg hover:bg-primary/90 transition-colors shadow-glow-primary"
            >
              Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
