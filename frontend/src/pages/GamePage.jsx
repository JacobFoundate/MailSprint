import React, { useState, useCallback, useEffect, useRef } from 'react';
import StartScreen from '@/components/game/StartScreen';
import GameCanvas from '@/components/game/GameCanvas';
import GameOverScreen from '@/components/game/GameOverScreen';
import GameHUD from '@/components/game/GameHUD';
import MobileControls from '@/components/game/MobileControls';
import soundManager from '@/utils/SoundManager';

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

  return (
    <div className={`game-container relative w-full h-screen overflow-hidden bg-background ${screenShake ? 'animate-shake' : ''}`}>
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
              isPlaying={gameState === 'playing'}
              onGameOver={handleGameOver}
              onScoreUpdate={handleScoreUpdate}
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
