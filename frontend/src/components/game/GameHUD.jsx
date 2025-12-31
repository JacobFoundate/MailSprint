import React, { useRef, useState, useMemo } from 'react';
import { Mail, MapPin, Pause, Play, Heart, AlertTriangle, Check, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GameHUD = ({ score, deliveries, distance, isPaused, onPause, lives = 5, damageFlash = false, isMuted = false, onToggleMute }) => {
  const prevScoreRef = useRef(score);
  const prevLivesRef = useRef(lives);
  const prevDeliveriesRef = useRef(deliveries);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const [livesAnimating, setLivesAnimating] = useState(false);
  const [deliveryAnimating, setDeliveryAnimating] = useState(false);

  // Use useMemo to detect score changes without causing render loops
  useMemo(() => {
    if (score > prevScoreRef.current) {
      setScoreAnimating(true);
      const timer = setTimeout(() => setScoreAnimating(false), 400);
      prevScoreRef.current = score;
      return () => clearTimeout(timer);
    }
  }, [score]);

  // Detect lives changes for animation
  useMemo(() => {
    if (lives < prevLivesRef.current) {
      setLivesAnimating(true);
      const timer = setTimeout(() => setLivesAnimating(false), 600);
      prevLivesRef.current = lives;
      return () => clearTimeout(timer);
    }
    prevLivesRef.current = lives;
  }, [lives]);

  // Detect delivery changes for animation
  useMemo(() => {
    if (deliveries > prevDeliveriesRef.current) {
      setDeliveryAnimating(true);
      const timer = setTimeout(() => setDeliveryAnimating(false), 600);
      prevDeliveriesRef.current = deliveries;
      return () => clearTimeout(timer);
    }
  }, [deliveries]);

  return (
    <div className="absolute top-0 left-0 right-0 z-30 p-4">
      <div className="max-w-6xl mx-auto flex items-start justify-between">
        {/* Left Side - Score and Stats */}
        <div className="flex flex-col gap-3">
          {/* Score */}
          <div className={`bg-card/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-playful border border-border ${scoreAnimating ? 'animate-score-pop' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                <span className="font-fredoka text-xl text-secondary-foreground">★</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-nunito uppercase tracking-wide">Score</p>
                <p className="font-fredoka text-2xl text-foreground leading-none">
                  {score.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex gap-2">
            {/* Deliveries - with success animation */}
            <div className={`backdrop-blur-sm rounded-xl px-4 py-2 shadow-playful border-2 flex items-center gap-2 transition-all duration-200 ${deliveryAnimating ? 'bg-success/20 border-success scale-110' : 'bg-card/90 border-border'}`}>
              {deliveryAnimating ? (
                <Check className="w-5 h-5 text-success animate-bounce" />
              ) : (
                <Mail className="w-5 h-5 text-primary" />
              )}
              <span className={`font-fredoka text-lg transition-colors ${deliveryAnimating ? 'text-success' : 'text-foreground'}`}>{deliveries}</span>
              {deliveryAnimating && (
                <span className="text-xs text-success font-nunito font-bold animate-bounce">+100!</span>
              )}
            </div>

            {/* Distance */}
            <div className="bg-card/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-playful border border-border flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              <span className="font-fredoka text-lg text-foreground">{Math.floor(distance)}m</span>
            </div>
          </div>
        </div>

        {/* Right Side - Lives, Sound, and Pause */}
        <div className="flex items-center gap-3">
          {/* Lives - with damage animation */}
          <div className={`bg-card/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-playful border-2 flex items-center gap-0.5 transition-all duration-200 ${livesAnimating ? 'border-destructive bg-destructive/20 scale-110 animate-wiggle' : 'border-border'}`}>
            {livesAnimating && (
              <AlertTriangle className="w-4 h-4 text-destructive animate-pulse mr-1" />
            )}
            {[...Array(5)].map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 transition-all duration-300 ${
                  i < lives 
                    ? 'text-destructive fill-destructive' 
                    : 'text-muted-foreground/30 scale-75'
                } ${i === lives && livesAnimating ? 'animate-ping' : ''}`}
              />
            ))}
          </div>

          {/* Sound Toggle Button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={onToggleMute}
            className="h-12 w-12 rounded-xl"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>

          {/* Pause Button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={onPause}
            className="h-12 w-12 rounded-xl"
          >
            {isPaused ? (
              <Play className="w-5 h-5" />
            ) : (
              <Pause className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
