import React from 'react';
import { ArrowUp, Mail } from 'lucide-react';

const MobileControls = ({ onJump, onThrow }) => {
  const handleJumpStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onJump();
  };

  const handleThrowStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onThrow();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none md:hidden">
      <div className="flex justify-between items-end p-4 pb-8">
        {/* Jump Button - Bottom Left */}
        <button
          onTouchStart={handleJumpStart}
          onMouseDown={handleJumpStart}
          className="pointer-events-auto w-20 h-20 rounded-full bg-primary/80 backdrop-blur-sm border-4 border-primary-foreground/30 shadow-glow-primary flex items-center justify-center active:scale-95 active:bg-primary transition-transform"
          aria-label="Jump"
        >
          <ArrowUp className="w-10 h-10 text-primary-foreground" />
        </button>

        {/* Throw Button - Bottom Right */}
        <button
          onTouchStart={handleThrowStart}
          onMouseDown={handleThrowStart}
          className="pointer-events-auto w-20 h-20 rounded-full bg-accent/80 backdrop-blur-sm border-4 border-accent-foreground/30 shadow-glow-accent flex items-center justify-center active:scale-95 active:bg-accent transition-transform"
          aria-label="Throw Mail"
        >
          <Mail className="w-10 h-10 text-accent-foreground" />
        </button>
      </div>
    </div>
  );
};

export default MobileControls;
