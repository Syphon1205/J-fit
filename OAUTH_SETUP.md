# OAuth Configuration Setup Guide

Your J-Fit app now uses OAuth-only authentication (Google & Apple Sign-In). Follow these steps to get your app running on your phone.

## Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing one)
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **iOS** and fill in:
   - **Bundle ID**: `com.jfit.app`
   - **App Store ID**: (leave blank for now)
   - **Team ID**: (leave blank for now)
6. For Android, create another client ID selecting **Android**:
   - **Package name**: `com.jfit.app`
   - Get your **SHA-1 certificate fingerprint**
7. Copy your **Google Client ID** and update:
   - `src/services/oauth.ts` → Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`
   - `src/stores/authStore.ts` → Same client ID is used

## Step 2: Set Up Apple Sign-In

Apple Sign-In works automatically on iOS! No additional credentials needed for testing.

For production:
1. Go to [Apple Developer Program](https://developer.apple.com/)
2. Set up your App ID with Sign in with Apple capability
3. Configure Team ID in your Expo credentials

## Step 3: Update app.json with EAS Project ID

1. Create an account at [Expo.dev](https://expo.dev)
2. Create a new project there
3. Copy your **Project ID**
4. Update `app.json`:
   ```json
   "extra": {
     "eas": {
       "projectId": "YOUR_PROJECT_ID_HERE"
     }
   }
   ```

## Step 4: Build & Deploy to Your Device

### Option A: Using Expo Go (Quick Testing)
```bash
cd /Users/tannerdavidson/Desktop/J-fit
npx expo start
# Scan the QR code with your phone's camera
```

### Option B: Internal Distribution Build (Real Testing)
```bash
# Login to Expo (you may need to create an account)
npx eas login

# Build for iOS or Android
npx eas build --platform ios --profile preview
# or
npx eas build --platform android --profile preview

# Install on your device
npx eas build:list  # Get the build URL
```

## Step 5: Testing OAuth

1. When you open the app, you'll see Google and Apple login buttons
2. Google will open a browser for login
3. Apple will show the native dialog on iOS

## Important Notes

- **No Email Server**: You're not managing user emails anymore—OAuth providers handle that
- **No Signup Form**: Users only authenticate via Google/Apple
- **User Data**: Stored with provider ID (not password)
- **Security**: All auth handled by trusted OAuth providers

## Troubleshooting

**"Client ID not configured" error?**
- Update `src/services/oauth.ts` with your Google Client ID

**Build fails on iOS?**
- Make sure your Bundle ID matches Apple credentials: `com.jfit.app`

**Build fails on Android?**
- Ensure your SHA-1 fingerprint is registered in Google Cloud Console

**OAuth flow doesn't redirect back?**
- Verify your redirect URI is correct: `jfit://oauth`
- Check `app.json` has the correct `scheme: "jfit"`

## Next Steps

1. ✅ OAuth screens implemented
2. ✅ No email/password auth
3. 📱 Test on your phone with Expo Go or internal build
4. 🎯 Once working, prepare for App Store & Play Store submission
