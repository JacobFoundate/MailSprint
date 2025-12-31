import React, { useState, useCallback } from 'react';
import StartScreen from '@/components/game/StartScreen';
import GameCanvas from '@/components/game/GameCanvas';
import GameOverScreen from '@/components/game/GameOverScreen';
import GameHUD from '@/components/game/GameHUD';

const GamePage = () => {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'paused', 'gameover'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('mailmanHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [deliveries, setDeliveries] = useState(0);
  const [distance, setDistance] = useState(0);

  const handleStartGame = useCallback(() => {
    setScore(0);
    setDeliveries(0);
    setDistance(0);
    setGameState('playing');
  }, []);

  const handleGameOver = useCallback((finalScore, finalDeliveries, finalDistance) => {
    setScore(finalScore);
    setDeliveries(finalDeliveries);
    setDistance(finalDistance);
    
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('mailmanHighScore', finalScore.toString());
    }
    
    setGameState('gameover');
  }, [highScore]);

  const handlePause = useCallback(() => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  }, []);

  const handleScoreUpdate = useCallback((newScore, newDeliveries, newDistance) => {
    setScore(newScore);
    setDeliveries(newDeliveries);
    setDistance(newDistance);
  }, []);

  return (
    <div className="game-container relative w-full h-screen overflow-hidden bg-background">
      {/* Game Canvas - Always rendered but visibility controlled */}
      <div className={`absolute inset-0 ${gameState === 'start' ? 'pointer-events-none' : ''}`}>
        {gameState !== 'start' && (
          <>
            <GameHUD
              score={score}
              deliveries={deliveries}
              distance={distance}
              isPaused={gameState === 'paused'}
              onPause={handlePause}
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
