# MailRun - Infinite Runner Game

## Overview
MailRun is an infinite runner game where players control a mailman running down a suburban street. The goal is to throw mail into mailboxes while avoiding obstacles like dogs, pylons, fire hydrants, and trash cans.

## Game Features

### Core Mechanics
- **Infinite Runner**: Automatically scrolling gameplay that increases in speed over time
- **Jump**: Press Space, W, or ↑ to jump over obstacles
- **Throw Mail**: Press E or click/tap to throw mail envelopes at mailboxes
- **Collision System**: 3 lives with invincibility frames after getting hit

### Scoring System
- **Distance Points**: 1 point per unit of distance traveled
- **Delivery Bonus**: 100 points for successfully landing mail in a mailbox
- **High Score**: Persisted to localStorage for returning players

### Game Objects
- **Mailboxes**: Blue boxes with red flags - turn green when mail is delivered
- **Obstacles**:
  - Dogs (brown, animated legs)
  - Traffic pylons (orange with white stripes)
  - Fire hydrants (red)
  - Trash cans (gray)

### UI Components
- **Start Screen**: Animated background with title, play button, and instructions
- **Game HUD**: Score, deliveries count, distance traveled, lives, pause button
- **Pause Screen**: Modal with resume button
- **Game Over Screen**: Final score, stats, high score, play again and share buttons

## Technical Stack
- **Frontend**: React.js with Tailwind CSS
- **Game Engine**: HTML5 Canvas with requestAnimationFrame
- **UI Components**: Shadcn/ui with custom game variants
- **Fonts**: Fredoka (headings), Nunito (body text)
- **Animations**: CSS animations + Canvas rendering

## Design System
- **Primary Color**: Cheerful teal (#4ECDC4)
- **Secondary Color**: Sunny golden yellow
- **Accent Color**: Coral/salmon for CTAs
- **Background**: Animated sky gradient with clouds, sun, houses, and road

## Controls
- **Desktop**: 
  - Jump: Space, W, or Arrow Up
  - Throw: E key or mouse click
  - Pause: Click pause button
- **Mobile**: 
  - Jump: Tap top half of screen
  - Throw: Tap bottom half of screen

## Data Storage
- High score saved to localStorage (`mailmanHighScore`)

## Future Enhancements (Not Implemented)
- Power-ups (speed boost, multi-mail)
- Different mailman characters
- Day/night cycle
- Sound effects and music
- Leaderboards
