import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Trophy, ArrowRight, Gamepad2, Star, Zap } from 'lucide-react';

const StartScreen = ({ onStart, highScore }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(true);
    
    const handleKeyPress = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onStart]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-top via-sky-bottom to-grass">
        {/* Animated Clouds */}
        <div className="absolute top-16 left-10 w-32 h-16 bg-card/80 rounded-full animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-24 right-20 w-40 h-20 bg-card/70 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-32 left-1/3 w-24 h-12 bg-card/60 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        
        {/* Sun */}
        <div className="absolute top-12 right-16 w-24 h-24 bg-secondary rounded-full shadow-glow-accent animate-pulse-soft" />
        
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-grass-dark to-grass" />
        
        {/* Road */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-road-dark">
          <div className="absolute top-1/2 left-0 right-0 h-2 flex gap-8">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="w-16 h-full bg-secondary/70" />
            ))}
          </div>
        </div>
        
        {/* Decorative Houses */}
        <div className="absolute bottom-32 left-10">
          <div className="w-20 h-24 bg-accent/80 rounded-t-lg relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[32px] border-b-destructive/70" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-10 bg-secondary-foreground/50" />
          </div>
        </div>
        <div className="absolute bottom-32 right-16">
          <div className="w-24 h-28 bg-primary/60 rounded-t-lg relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[48px] border-l-transparent border-r-[48px] border-r-transparent border-b-[40px] border-b-primary/80" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-12 bg-secondary-foreground/50" />
          </div>
        </div>
        
        {/* Animated Mailman Character */}
        <div className="absolute bottom-20 left-1/4 animate-float" style={{ animationDelay: '0.5s' }}>
          <div className="relative">
            {/* Body */}
            <div className="w-12 h-16 bg-primary rounded-t-xl relative">
              {/* Head */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 bg-amber-200 rounded-full">
                {/* Hat */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-primary rounded-full" />
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-4 bg-primary rounded-t-lg" />
              </div>
              {/* Mail Bag */}
              <div className="absolute top-2 -right-4 w-8 h-10 bg-secondary rounded-lg rotate-12">
                <Mail className="w-4 h-4 text-secondary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
            {/* Legs */}
            <div className="flex gap-1">
              <div className="w-5 h-8 bg-foreground/80 rounded-b-lg" />
              <div className="w-5 h-8 bg-foreground/80 rounded-b-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`relative z-10 text-center px-4 transition-all duration-700 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Game Title */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Mail className="w-10 h-10 text-accent animate-wiggle" />
            <h1 className="font-fredoka text-6xl sm:text-7xl lg:text-8xl text-foreground text-shadow-game">
              Mail<span className="text-primary">Sprint</span>
            </h1>
            <Mail className="w-10 h-10 text-accent animate-wiggle" style={{ animationDelay: '0.25s' }} />
          </div>
          <p className="font-nunito text-lg sm:text-xl text-muted-foreground">
            Deliver mail, dodge obstacles, score big!
          </p>
        </div>

        {/* High Score Display */}
        {highScore > 0 && (
          <div className="flex items-center justify-center gap-2 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Trophy className="w-6 h-6 text-secondary" />
            <span className="font-fredoka text-2xl text-secondary">
              Best: {highScore.toLocaleString()}
            </span>
          </div>
        )}

        {/* Play Button */}
        <Button
          variant="game"
          size="xl"
          onClick={onStart}
          className="mb-6 animate-bounce-in min-w-[200px]"
          style={{ animationDelay: '0.3s' }}
        >
          <Gamepad2 className="w-6 h-6" />
          Play Now
          <ArrowRight className="w-6 h-6" />
        </Button>

        {/* Quick Instructions Toggle */}
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-muted-foreground hover:text-foreground transition-colors font-nunito text-sm underline underline-offset-4"
        >
          {showInstructions ? 'Hide' : 'Show'} Controls
        </button>

        {/* Instructions Card */}
        {showInstructions && (
          <Card className="mt-6 max-w-lg mx-auto bg-card/95 backdrop-blur-sm border-2 border-primary/20 animate-slide-up max-h-[60vh] overflow-y-auto">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-fredoka text-xl text-foreground mb-4 flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-secondary" />
                How to Play
                <Zap className="w-5 h-5 text-secondary" />
              </h3>
              <div className="space-y-3 text-left mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="font-fredoka text-primary">↑</span>
                  </div>
                  <div>
                    <p className="font-nunito font-semibold text-foreground">Jump</p>
                    <p className="text-sm text-muted-foreground">Space/W/↑ (hold for high, tap for short)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="font-fredoka text-blue-500">←→</span>
                  </div>
                  <div>
                    <p className="font-nunito font-semibold text-foreground">Move Left/Right</p>
                    <p className="text-sm text-muted-foreground">A/D or ←/→ to position yourself</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-nunito font-semibold text-foreground">Throw Mail</p>
                    <p className="text-sm text-muted-foreground">Press E or click/tap</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-nunito font-semibold text-foreground">Score Points</p>
                    <p className="text-sm text-muted-foreground">Land mail in mailboxes!</p>
                  </div>
                </div>
              </div>
              
              {/* Power-ups Section */}
              <h4 className="font-fredoka text-lg text-foreground mb-3 flex items-center gap-2 border-t border-border pt-4">
                <span>⚡</span> Power-Ups
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-orange-500/20 rounded-lg p-2">
                  <div className="text-lg">🔥</div>
                  <p className="font-semibold text-foreground">Rapid Fire</p>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-2">
                  <div className="text-lg">➡️</div>
                  <p className="font-semibold text-foreground">Straight Shot</p>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-2">
                  <div className="text-lg">↔️</div>
                  <p className="font-semibold text-foreground">Double Shot</p>
                </div>
                <div className="bg-green-500/20 rounded-lg p-2">
                  <div className="text-lg">⚡</div>
                  <p className="font-semibold text-foreground">Speed Boost</p>
                </div>
                <div className="bg-cyan-500/20 rounded-lg p-2">
                  <div className="text-lg">🐌</div>
                  <p className="font-semibold text-foreground">Slow Motion</p>
                </div>
                <div className="bg-yellow-500/20 rounded-lg p-2">
                  <div className="text-lg">🦘</div>
                  <p className="font-semibold text-foreground">Super Jump</p>
                </div>
                <div className="bg-pink-500/20 rounded-lg p-2">
                  <div className="text-lg">🛡️</div>
                  <p className="font-semibold text-foreground">Invincible</p>
                </div>
                <div className="bg-amber-500/20 rounded-lg p-2">
                  <div className="text-lg">💥</div>
                  <p className="font-semibold text-foreground">Knockback</p>
                </div>
                <div className="bg-blue-600/20 rounded-lg p-2">
                  <div className="text-lg">🦸</div>
                  <p className="font-semibold text-foreground">Superman</p>
                </div>
              </div>
              
              {/* Tips */}
              <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                <p>💚 Collect hearts to heal • 🍀 Touch leprechauns for bonus points!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Keyboard hint */}
        <p className="mt-8 text-muted-foreground/60 text-sm font-nunito animate-pulse-soft">
          Press SPACE to start
        </p>
      </div>
    </div>
  );
};

export default StartScreen;
