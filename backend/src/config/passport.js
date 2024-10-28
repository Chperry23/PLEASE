const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');
const config = require('./config');

console.log('Initializing Google OAuth Strategy with callback URL:', config.auth.google.callbackURL);

passport.use(
  new GoogleStrategy(
    {
      clientID: config.auth.google.clientID,
      clientSecret: config.auth.google.clientSecret,
      callbackURL: config.auth.google.callbackURL,
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth callback for profile:', profile.id);
        
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          console.log('Existing user found:', user._id);
          return done(null, user);
        }

        // Check if user exists with email
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          console.log('User found by email, updating with Google ID');
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value
        });

        await user.save();
        console.log('New user created:', user._id);
        return done(null, user);
      } catch (error) {
        console.error('Error in Google Strategy:', error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user._id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('Deserialized user:', user?._id);
    done(null, user);
  } catch (error) {
    console.error('Deserialization error:', error);
    done(error, null);
  }
});

module.exports = passport;
