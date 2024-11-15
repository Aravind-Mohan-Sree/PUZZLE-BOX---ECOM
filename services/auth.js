const passport = require("passport");
const userSchema = require("../model/userSchema");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const mailSender = require("../services/emailSender");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        // check the user details on the collection
        let user = await userSchema.findOne({ email: profile.email });
        let info = { newUser: false };

        if (!user && request.session.intendedAction === "signup") {
          // Create a new user
          user = new userSchema({
            name: profile.displayName,
            email: profile.email,
            googleID: profile.id,
            referralCode: request.session.referralCode,
          });
          // Save the new user
          await user.save();

          info = { newUser: true };

          // mail will be sent to the user using nodemailer
          mailSender.sendWelcomeMail(user.email, user.name);
        }
        done(null, user, info);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id); // Serialize the user ID
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userSchema.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
