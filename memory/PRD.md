# MailSprint - Infinite Runner Game

## Overview
MailSprint is an infinite runner game where players control a mailman running down a suburban street. The goal is to throw mail into mailboxes while avoiding obstacles like dogs, pylons, fire hydrants, and trash cans.

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
  - Dogs (brown, animated legs) - plays bark sound
  - Traffic pylons (orange with white stripes)
  - Fire hydrants (red)
  - Trash cans (gray)

### Day/Night Cycle
- Full cycle every 2 minutes
- Smooth transition between day and night
- Sun during day, moon and stars at night
- House windows glow at night

### Seasons (Changes every 15 day/night cycles)
- **Spring**: Green grass, light blue sky, rain storms
- **Summer**: Lush green grass, bright sky, sandstorms
- **Fall**: Brown/orange grass, warm sky colors, maple leaves blowing
- **Winter**: Snow-covered grass, pale sky, snowstorms

### Weather Effects
- Random storms that start and stop
- Season-specific particles:
  - Spring: Rain drops
  - Summer: Sand particles blowing
  - Fall: Maple leaves floating down
  - Winter: Snowflakes drifting

### Sound System (Web Audio API - No external files)
- **Background Music**: Cheerful looping melody
- **Sound Effects**:
  - Mail throw (whoosh)
  - Mailbox delivery (chime)
  - Obstacle hit (thud)
  - Dog collision (bark)
  - Jump (sweep)
- **Mute Toggle**: Button in HUD

### UI Components
- **Start Screen**: Animated background with title, play button, and instructions
- **Game HUD**: Score, deliveries count, distance traveled, lives, sound toggle, pause button
- **Pause Screen**: Modal with resume button
- **Game Over Screen**: Final score, stats, high score, play again and share buttons
- **Season/Time Indicator**: Shows current season and day/night status

## Technical Stack
- **Frontend**: React.js with Tailwind CSS
- **Game Engine**: HTML5 Canvas with requestAnimationFrame
- **Audio**: Web Audio API (procedural sound generation)
- **UI Components**: Shadcn/ui with custom game variants
- **Fonts**: Fredoka (headings), Nunito (body text)
- **Animations**: CSS animations + Canvas rendering

## Controls
- **Desktop**: 
  - Jump: Space, W, or Arrow Up
  - Throw: E key or mouse click
  - Pause: Click pause button
  - Mute: Click sound button
- **Mobile**: 
  - Jump: Tap top half of screen
  - Throw: Tap bottom half of screen

## Data Storage
- High score saved to localStorage (`mailsprintHighScore`)
