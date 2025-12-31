import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Mail, MapPin, RotateCcw, Share2, Star, Sparkles } from 'lucide-react';

const GameOverScreen = ({
  score,
  highScore,
  deliveries,
  distance,
  onRestart,
  isNewHighScore
}) => {
  const [animateIn, setAnimateIn] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setAnimateIn(true);
    if (isNewHighScore) {
      setShowConfetti(true);
    }
    
    const handleKeyPress = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRestart();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onRestart, isNewHighScore]);

  const handleShare = () => {
    const text = `I scored ${score.toLocaleString()} points in MailRun! Delivered ${deliveries} letters and ran ${distance}m. Can you beat my score?`;
    if (navigator.share) {
      navigator.share({
        title: 'MailRun Score',
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-foreground/50 backdrop-blur-sm z-50">
      {/* Confetti effect for new high score */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-sm animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#45B7D1', '#96CEB4'][i % 5],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 2 + 1}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <Card className={`max-w-md w-full mx-4 bg-card border-2 border-primary/20 shadow-elevated transition-all duration-500 ${animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <CardContent className="p-8 text-center">
          {/* Header */}
          {isNewHighScore ? (
            <div className="mb-6 animate-bounce-in">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-8 h-8 text-secondary animate-wiggle" />
                <h2 className="font-fredoka text-4xl text-secondary">New Record!</h2>
                <Sparkles className="w-8 h-8 text-secondary animate-wiggle" style={{ animationDelay: '0.2s' }} />
              </div>
              <p className="text-muted-foreground font-nunito">You beat your high score!</p>
            </div>
          ) : (
            <div className="mb-6">
              <h2 className="font-fredoka text-4xl text-foreground mb-2">Game Over</h2>
              <p className="text-muted-foreground font-nunito">Great run, mailman!</p>
            </div>
          )}

          {/* Score Display */}
          <div className="bg-muted rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className={`w-8 h-8 ${isNewHighScore ? 'text-secondary animate-wiggle' : 'text-secondary'}`} />
              <span className="font-fredoka text-5xl text-foreground">
                {score.toLocaleString()}
              </span>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-card rounded-xl p-3">
                <div className="flex items-center justify-center gap-2 text-primary mb-1">
                  <Mail className="w-5 h-5" />
                  <span className="font-fredoka text-2xl">{deliveries}</span>
                </div>
                <p className="text-xs text-muted-foreground font-nunito">Deliveries</p>
              </div>
              <div className="bg-card rounded-xl p-3">
                <div className="flex items-center justify-center gap-2 text-accent mb-1">
                  <MapPin className="w-5 h-5" />
                  <span className="font-fredoka text-2xl">{distance}m</span>
                </div>
                <p className="text-xs text-muted-foreground font-nunito">Distance</p>
              </div>
            </div>
          </div>

          {/* High Score */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-secondary" />
            <span className="font-nunito text-muted-foreground">
              Best: <span className="font-fredoka text-foreground">{highScore.toLocaleString()}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              variant="game"
              size="lg"
              onClick={onRestart}
              className="w-full"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </Button>
            
            <Button
              variant="gameSecondary"
              size="lg"
              onClick={handleShare}
              className="w-full"
            >
              <Share2 className="w-5 h-5" />
              Share Score
            </Button>
          </div>

          {/* Keyboard hint */}
          <p className="mt-6 text-muted-foreground/60 text-sm font-nunito animate-pulse-soft">
            Press SPACE to play again
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameOverScreen;
