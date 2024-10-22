// backend/src/config/passport.js

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user'); // Adjust the path as necessary

const callbackURL = `${process.env.URI}/api/auth/google/callback`;
console.log(`Google OAuth Callback URL: ${callbackURL}`); // Verify the callback URL

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL, // Ensure this matches your Google Cloud Console
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth Strategy invoked');
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);

        // Check if user already exists with Google ID
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          console.log('User found by googleId');
          if (refreshToken && user.googleRefreshToken !== refreshToken) {
            user.googleRefreshToken = refreshToken;
            await user.save();
          }
          return done(null, user);
        }

        // Check if user exists by email
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          console.log('User found by email');
          user.googleId = profile.id;
          if (refreshToken) {
            user.googleRefreshToken = refreshToken;
          }
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          googleRefreshToken: refreshToken,
          subscriptionActive: true, // Assuming Free plan for Google sign-ins
          subscriptionTier: 'Free',
        });
        await user.save();
        done(null, user);
      } catch (error) {
        console.error('Error in Google Strategy:', error);
        done(error, null);
      }
    }
  )
);

// Serialize user into the sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the sessions
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
