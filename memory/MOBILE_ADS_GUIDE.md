# Mobile App Monetization Guide for MailSprint

## Overview
To publish MailSprint on mobile app stores (iOS App Store, Google Play Store) and monetize with ads, you'll need to wrap the web app in a native container and integrate an ad SDK.

---

## Option 1: Capacitor (Recommended)

Capacitor is the modern way to turn React web apps into native mobile apps.

### Step 1: Install Capacitor
```bash
cd /app/frontend
yarn add @capacitor/core @capacitor/cli
npx cap init MailSprint com.yourcompany.mailsprint
```

### Step 2: Add Mobile Platforms
```bash
yarn add @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

### Step 3: Install AdMob Plugin
```bash
yarn add @capacitor-community/admob
npx cap sync
```

### Step 4: Configure AdMob

**Create AdMob Account:**
1. Go to https://admob.google.com
2. Create an account
3. Add your app (Android and/or iOS)
4. Create Ad Units:
   - **Banner Ad**: Shows at bottom of screen during gameplay
   - **Interstitial Ad**: Full-screen ad between games
   - **Rewarded Video Ad**: Watch ad for extra life or bonus

**Get Ad Unit IDs** from AdMob dashboard for each ad type.

### Step 5: Implement Ads in React

Create `/app/frontend/src/utils/AdManager.js`:
```javascript
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

class AdManager {
  async initialize() {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
    });
  }

  // Banner ad at bottom of screen
  async showBanner() {
    await AdMob.showBanner({
      adId: 'ca-app-pub-XXXXX/YYYYY', // Your banner ad unit ID
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
    });
  }

  async hideBanner() {
    await AdMob.hideBanner();
  }

  // Interstitial (full-screen) ad - show between games
  async showInterstitial() {
    await AdMob.prepareInterstitial({
      adId: 'ca-app-pub-XXXXX/ZZZZZ', // Your interstitial ad unit ID
    });
    await AdMob.showInterstitial();
  }

  // Rewarded video ad - give player extra life
  async showRewardedAd() {
    return new Promise(async (resolve) => {
      AdMob.addListener('onRewardedVideoAdReward', (reward) => {
        resolve(reward); // Player watched the full ad
      });
      
      await AdMob.prepareRewardVideoAd({
        adId: 'ca-app-pub-XXXXX/WWWWW', // Your rewarded ad unit ID
      });
      await AdMob.showRewardVideoAd();
    });
  }
}

export default new AdManager();
```

### Step 6: Integrate Ads into Game

**In GameOverScreen.jsx** - Add "Watch Ad for Extra Life":
```javascript
import adManager from '@/utils/AdManager';

// Add a "Watch Ad" button
const handleWatchAd = async () => {
  const reward = await adManager.showRewardedAd();
  if (reward) {
    // Give player extra life and continue game
    onContinueWithExtraLife();
  }
};
```

**In GamePage.jsx** - Show interstitial after every 3 games:
```javascript
const [gamesPlayed, setGamesPlayed] = useState(0);

const handleGameOver = async () => {
  setGamesPlayed(prev => prev + 1);
  
  // Show interstitial every 3 games
  if (gamesPlayed > 0 && gamesPlayed % 3 === 0) {
    await adManager.showInterstitial();
  }
  
  // ... rest of game over logic
};
```

### Step 7: Build for Mobile
```bash
yarn build
npx cap sync
npx cap open android  # Opens Android Studio
npx cap open ios      # Opens Xcode (Mac only)
```

---

## Option 2: React Native (Alternative)

If you want a fully native app, rebuild with React Native + react-native-game-engine.

```bash
npx react-native init MailSprint
yarn add react-native-google-mobile-ads
```

---

## Ad Types & Best Practices

### 1. Banner Ads
- **Placement**: Bottom of screen during gameplay
- **Revenue**: Low per impression (~$0.10-0.50 CPM)
- **UX Impact**: Minimal, always visible

### 2. Interstitial Ads
- **Placement**: Between games, after game over
- **Revenue**: Medium ($1-5 CPM)
- **UX Impact**: Interrupts flow, use sparingly
- **Best Practice**: Show every 2-3 games, not every game

### 3. Rewarded Video Ads
- **Placement**: Optional - "Watch ad for reward"
- **Revenue**: Highest ($10-30 CPM)
- **UX Impact**: Player chooses to watch
- **Rewards to offer**:
  - Extra life (continue after game over)
  - 2x score multiplier for next game
  - Skip to next season

---

## Revenue Estimates

| Ad Type | CPM | Daily Active Users | Daily Revenue |
|---------|-----|-------------------|---------------|
| Banner | $0.30 | 1,000 | $0.30-1.00 |
| Interstitial | $3.00 | 1,000 | $3-10 |
| Rewarded | $15.00 | 1,000 | $5-15 |

**Total potential**: $10-30/day per 1,000 daily users

---

## App Store Submission

### Google Play Store
1. Create Google Play Developer account ($25 one-time fee)
2. Build signed APK/AAB in Android Studio
3. Create store listing with screenshots
4. Submit for review (usually 1-3 days)

### iOS App Store
1. Enroll in Apple Developer Program ($99/year)
2. Build in Xcode, archive and upload
3. Create App Store Connect listing
4. Submit for review (usually 1-7 days)

---

## Test Ad IDs (Use during development)

Google provides test ad IDs - use these during development:

```javascript
// Android Test IDs
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';
const TEST_REWARDED = 'ca-app-pub-3940256099942544/5224354917';

// iOS Test IDs
const TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716';
const TEST_INTERSTITIAL_IOS = 'ca-app-pub-3940256099942544/4411468910';
const TEST_REWARDED_IOS = 'ca-app-pub-3940256099942544/1712485313';
```

---

## Alternative Ad Networks

If AdMob doesn't work for you:
- **Unity Ads**: Great for games
- **Facebook Audience Network**: High fill rates
- **AppLovin**: Good rewarded video rates
- **ironSource**: Ad mediation platform

---

## Privacy & Compliance

1. Add Privacy Policy to your app
2. Implement GDPR consent dialog for EU users
3. Implement ATT (App Tracking Transparency) for iOS
4. Don't show ads to children under 13 (COPPA)
