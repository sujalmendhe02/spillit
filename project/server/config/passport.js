import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'http://localhost:5000/api/auth/google/callback', // The URL where Google sends the callback
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ email: profile.emails[0].value });
                if (!user) {
                    user = new User({
                        email: profile.emails[0].value,
                        username: profile.displayName, // Customize as needed
                    });
                    await user.save();
                }
                return done(null, user);
            } catch (error) {
                return done(error, false);
            }
        }
    )
);

// Serialize user information
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user information
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});
