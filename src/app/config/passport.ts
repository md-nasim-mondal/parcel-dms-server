/* eslint-disable @typescript-eslint/no-explicit-any */
import bcryptjs from "bcryptjs";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { IsActive, Role } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { envVars } from "./env";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
      try {
        const userIsExist = await User.findOne({ email });

        // if (!userIsExist) {
        //     return done(null, false, { message: "User does not exist" })
        // }

        if (!userIsExist) {
          return done("User does not exist");
        }
        if (
          userIsExist.isActive === IsActive.BLOCKED ||
          userIsExist.isActive === IsActive.INACTIVE
        ) {
          return done(`User is ${userIsExist?.isActive}`);
        }
        if (userIsExist.isDeleted) {
          return done("User is deleted");
        }

        if (!userIsExist.isVerified) {
          return done("User is not verified!!");
        }

        const isGoogleAuthenticated = userIsExist.auths.some(
          (providerObjects) => providerObjects.provider == "google"
        );

        if (isGoogleAuthenticated && !userIsExist.password) {
          return done(null, false, {
            message:
              "You have authenticated through Google. So if you want to login with credentials, then at first login with google and set a password for your Gmail and then you can login with email and password.",
          });
        }

        // if (isGoogleAuthenticated) {
        //     return done("You have authenticated through Google. So if you want to login with credentials, then at first login with google and set a password for your Gmail and then you can login with email and password.")
        // }

        const isPasswordMatched = await bcryptjs.compare(
          password as string,
          userIsExist.password as string
        );

        if (!isPasswordMatched) {
          return done(null, false, { message: "Password does not match" });
        }

        return done(null, userIsExist);
      } catch (error) {
        console.log(error);
        done(error);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackURL: envVars.GOOGLE_CALLBACK_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0].value;

        if (!email) {
          return done(null, false, { message: "No email found!" });
        }

        let userIsExist = await User.findOne({ email });

        if (userIsExist && !userIsExist.isVerified) {
          // throw new AppError(httpStatus.BAD_REQUEST, "User is not verified")
          // done("User is not verified")
          return done(null, false, { message: "User is not verified" });
        }

        if (
          userIsExist &&
          (userIsExist.isActive === IsActive.BLOCKED ||
            userIsExist.isActive === IsActive.INACTIVE)
        ) {
          // throw new AppError(httpStatus.BAD_REQUEST, `User is ${userIsExist.isActive}`)
          done(`User is ${userIsExist.isActive}`);
        }

        if (userIsExist && userIsExist.isDeleted) {
          return done(null, false, { message: "User is deleted" });
          // done("User is deleted")
        }

        if (!userIsExist) {
          userIsExist = await User.create({
            email,
            name: profile.displayName,
            picture: profile.photos?.[0].value,
            role: Role.SENDER,
            isVerified: true,
            auths: [
              {
                provider: "google",
                providerId: profile.id,
              },
            ],
          });
        }

        return done(null, userIsExist);
      } catch (error) {
        console.log("Google Strategy Error", error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.log(error);
    done(error);
  }
});
