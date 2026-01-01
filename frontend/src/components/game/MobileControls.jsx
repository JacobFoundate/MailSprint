import React from 'react';
import { ArrowUp, ArrowLeft, ArrowRight, Mail } from 'lucide-react';

const MobileControls = ({ onJump, onThrow, onJumpRelease, onMoveLeft, onMoveRight }) => {
  const handleJumpStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onJump();
  };

  const handleJumpEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onJumpRelease) onJumpRelease();
  };

  const handleThrowStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onThrow();
  };

  const handleMoveLeftStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMoveLeft) onMoveLeft(true);
  };

  const handleMoveLeftEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMoveLeft) onMoveLeft(false);
  };

  const handleMoveRightStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMoveRight) onMoveRight(true);
  };

  const handleMoveRightEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMoveRight) onMoveRight(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none md:hidden">
      <div className="flex justify-between items-end p-4 pb-8">
        {/* Left side controls - Movement */}
        <div className="flex flex-col gap-2">
          {/* Jump Button */}
          <button
            onTouchStart={handleJumpStart}
            onTouchEnd={handleJumpEnd}
            onMouseDown={handleJumpStart}
            onMouseUp={handleJumpEnd}
            className="pointer-events-auto w-16 h-16 rounded-full bg-primary/80 backdrop-blur-sm border-4 border-primary-foreground/30 shadow-glow-primary flex items-center justify-center active:scale-95 active:bg-primary transition-transform"
            aria-label="Jump"
          >
            <ArrowUp className="w-8 h-8 text-primary-foreground" />
          </button>
          
          {/* Left/Right Buttons */}
          <div className="flex gap-2">
            <button
              onTouchStart={handleMoveLeftStart}
              onTouchEnd={handleMoveLeftEnd}
              onMouseDown={handleMoveLeftStart}
              onMouseUp={handleMoveLeftEnd}
              className="pointer-events-auto w-14 h-14 rounded-full bg-blue-500/80 backdrop-blur-sm border-3 border-blue-200/30 flex items-center justify-center active:scale-95 active:bg-blue-600 transition-transform"
              aria-label="Move Left"
            >
              <ArrowLeft className="w-7 h-7 text-white" />
            </button>
            <button
              onTouchStart={handleMoveRightStart}
              onTouchEnd={handleMoveRightEnd}
              onMouseDown={handleMoveRightStart}
              onMouseUp={handleMoveRightEnd}
              className="pointer-events-auto w-14 h-14 rounded-full bg-blue-500/80 backdrop-blur-sm border-3 border-blue-200/30 flex items-center justify-center active:scale-95 active:bg-blue-600 transition-transform"
              aria-label="Move Right"
            >
              <ArrowRight className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>

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
