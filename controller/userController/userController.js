const userSchema = require("../../model/userSchema");
const walletSchema = require("../../model/walletSchema");
const mailSender = require("../../services/emailSender");
const passport = require("passport");
const productSchema = require("../../model/productSchema");
const categorySchema = require("../../model/categorySchema");
const bcrypt = require("bcrypt");
const generateOtp = require("../../services/generateOtp");
const voucherCodes = require("voucher-code-generator");
require("../../services/auth");

// will redirect to user login page
const user = (req, res) => {
  res.redirect("/login");
};

// will render user login page if user session is not present
const login = async (req, res) => {
  try {
    // will delete OTP stored in session
    delete req.session.otp;

    if (req.session.user) {
      res.redirect("/home");
    } else {
      if (req.query.changePassword) {
        req.flash("alert", {
          message: "Password changed successfully!",
          color: "bg-success",
        });
      }

      if (req.query.logout) {
        req.flash("alert", {
          message: "Logout successful!",
          color: "bg-success",
        });
      }

      if (req.query.isBlocked) {
        req.flash("alert", {
          message: "You are blocked by the admin!",
          color: "bg-danger",
        });
      }

      const activeCategories = await productSchema
        .find({
          isActive: true,
          productCategory: {
            $in: await categorySchema.find({ isActive: true }).select("_id"),
          },
        })
        .populate("productCategory");

      const activeCategoryNames = Array.from(
        new Set(
          activeCategories.map(
            (product) => product.productCategory.categoryName
          )
        )
      ).sort((a, b) => a.localeCompare(b));

      res.render("user/login", {
        title: "User Login",
        alert: req.flash("alert"),
        user: req.session.user,
        activeCategoryNames,
        content: "",
      });
    }
  } catch (err) {
    console.error(`Error while rendering user login page ${err}`);
  }
};

// will send user login details to the server
const loginPost = async (req, res) => {
  try {
    const userDetails = await userSchema.findOne({ email: req.body.email });

    if (!userDetails || userDetails.isBlocked) {
      if (!userDetails) {
        res.json({ wrongEmail: true });
      } else {
        res.json({ isBlocked: true });
      }
    } else {
      const validPassword = await bcrypt.compare(
        req.body.password,
        userDetails.password
      );

      if (validPassword) {
        req.session.user = userDetails._id;

        res.json({ url: "/home?login=true" });
      } else {
        res.json({ wrongPassword: true });
      }
    }
  } catch (err) {
    res.json({ error: true });

    console.log("Error in user login post", err);
  }
};

// will render user signup page if user session is not present
const signup = async (req, res) => {
  try {
    if (req.session.user) {
      res.redirect("/home");
    } else {
      const activeCategories = await productSchema
        .find({
          isActive: true,
          productCategory: {
            $in: await categorySchema.find({ isActive: true }).select("_id"),
          },
        })
        .populate("productCategory");

      const activeCategoryNames = Array.from(
        new Set(
          activeCategories.map(
            (product) => product.productCategory.categoryName
          )
        )
      ).sort((a, b) => a.localeCompare(b));

      res.render("user/signup", {
        title: "User Signup",
        alert: req.flash("alert"),
        user: req.session.user,
        activeCategoryNames,
        content: "",
      });
    }
  } catch (err) {
    console.error(`Error while rendering user signup page ${err}`);
  }
};

// will send user signup details to the server
const signupPost = async (req, res) => {
  try {
    const userDetails = {
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      password: req.body.password,
      referralCode: req.body.referralCode,
    };

    req.session.name = userDetails.name;
    req.session.phone = userDetails.phone;
    req.session.email = userDetails.email;
    req.session.password = await bcrypt.hash(userDetails.password, 10);
    req.session.referralCode = userDetails.referralCode;

    // generates a random OTP and assigns to the variable
    const otp = generateOtp();

    req.session.otp = otp;

    // will store OTP send time in session
    req.session.otpSendTime = Date.now();

    // mail will be sent to the user using nodemailer
    mailSender.sendOtpMail(userDetails.email, otp);

    res.redirect("/otp");
  } catch (err) {
    console.error("Error in user signup post", err);
  }
};

// will check if the email already exist in database
const checkEmail = async (req, res) => {
  try {
    const emailExist = await userSchema.findOne({ email: req.body.email });

    if (emailExist) {
      res.json({ exist: true });
    } else {
      res.json({ exist: false });
    }
  } catch (err) {
    res.json({ error: true });

    console.error("Error while validating email", err);
  }
};

// will check if the referral code is valid or not
const checkReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.json({ success: true });
    }

    const referral = await userSchema.findOne({ referralCode });

    if (referral) {
      res.json({ success: true });
    } else {
      res.json({ failure: true });
    }
  } catch (err) {
    res.json({ error: true });

    console.error("Error while validating referral code", err);
  }
};

// will render OTP page if OTP remains in session
const otp = async (req, res) => {
  try {
    if (req.session.otp) {
      const activeCategories = await productSchema
        .find({
          isActive: true,
          productCategory: {
            $in: await categorySchema.find({ isActive: true }).select("_id"),
          },
        })
        .populate("productCategory");

      const activeCategoryNames = Array.from(
        new Set(
          activeCategories.map(
            (product) => product.productCategory.categoryName
          )
        )
      ).sort((a, b) => a.localeCompare(b));

      res.render("user/otp", {
        title: "Verify OTP",
        alert: req.flash("alert"),
        user: req.session.user,
        activeCategoryNames,
        content: "",
      });
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    console.error("Error on rendering user OTP page", err);
  }
};

// will delete OTP from the session if expired
const otpTimer = (req, res) => {
  try {
    const timeDifference =
      Number(req.query.currentTime) - req.session.otpSendTime;

    if (timeDifference >= req.query.expiryTime || req.query.time < 0) {
      delete req.session.otp;
      res.json({ timeDifference });
    } else {
      res.json({ timeDifference });
    }
  } catch (err) {
    res.json({ error: true });

    console.log("Error on OTP timer", err);
  }
};

// will check if the entered OTP is valid
const checkOtp = (req, res) => {
  try {
    if (req.session.otp) {
      if (req.session.otp === req.params.otp) {
        res.json({ valid: true });
      } else {
        res.json({ valid: false });
      }
    } else {
      res.json({ otpExpired: true });
    }
  } catch (err) {
    res.json({ error: true });

    console.error("Error while validating OTP", err);
  }
};

// will resend OTP if user opt to do so
const resendOtp = (req, res) => {
  try {
    // generates a random OTP and assigns to the variable
    const otp = generateOtp();

    req.session.otp = otp;

    // will store OTP send time in session
    req.session.otpSendTime = Date.now();

    // mail will be sent to the user using nodemailer
    mailSender.sendOtpMail(req.session.email, otp);

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });

    console.error("Error in resending OTP", err);
  }
};

// will redirect to home page and store user details in database
const otpPost = async (req, res) => {
  try {
    let uniqueReferralCode = false;
    let referralCodes;

    /* ------ will loop continuously until a unique code is being generated ----- */
    while (!uniqueReferralCode) {
      /* ---------- generate a referral code with specific options ---------- */
      referralCodes = voucherCodes.generate({
        length: 10,
        count: 1,
        charset: voucherCodes.charset("alphabetic").toUpperCase(),
        pattern: "##########",
      });

      const existingReferralCode = await userSchema.aggregate([
        {
          $match: { referralCode: referralCodes[0] },
        },
      ]);

      if (existingReferralCode.length === 0) {
        uniqueReferralCode = true;
      }
    }

    // will delete OTP stored in session
    delete req.session.otp;

    if (req.session.name) {
      await userSchema
        .create({
          name: req.session.name,
          phone: req.session.phone,
          email: req.session.email,
          password: req.session.password,
          referralCode: referralCodes[0],
        })
        .then(() => {
          console.log("User details saved into database");
        })
        .catch((err) => {
          console.log(err);
        });

      const userDetails = await userSchema.findOne({
        email: req.session.email,
      });

      // if there is a valid referral code, then a certain amount will be credited to both users wallet
      const signupReferralCode = req.session.referralCode;

      if (signupReferralCode) {
        const rewardAmount = 500;

        const referrer = await userSchema.findOne({
          referralCode: signupReferralCode,
        });

        const referrerWallet = await walletSchema.findOne({
          userID: referrer._id,
        });

        // creates wallet for referrer if not exist, else update wallet
        if (!referrerWallet) {
          await walletSchema.create({
            userID: referrer._id,
            balance: rewardAmount,
            transactions: [
              {
                reason: "Referral Reward",
                amount: rewardAmount,
                type: "credit",
                runningBalance: rewardAmount,
              },
            ],
          });
        } else {
          referrerWallet.balance += rewardAmount;
          referrerWallet.transactions.push({
            reason: "Referral Reward",
            amount: rewardAmount,
            type: "credit",
            runningBalance: referrerWallet.balance,
          });

          await referrerWallet.save();
        }

        // creates wallet for referred
        await walletSchema.create({
          userID: userDetails._id,
          balance: rewardAmount,
          transactions: [
            {
              reason: "Referral Reward",
              amount: rewardAmount,
              type: "credit",
              runningBalance: rewardAmount,
            },
          ],
        });
      }

      // mail will be sent to the user using nodemailer
      mailSender.sendWelcomeMail(userDetails.email, userDetails.name);

      delete req.session.name;
      delete req.session.phone;
      delete req.session.email;
      delete req.session.password;
      delete req.session.referralCode;

      // creating user session
      req.session.user = userDetails._id;

      res.redirect("/home?signup=true");
    } else {
      res.redirect("/change-password");
    }
  } catch (err) {
    console.log("Error in OTP post request", err);
  }
};

// google auth login
const googleLogin = (req, res) => {
  try {
    req.session.intendedAction = "login";

    passport.authenticate("google", {
      keepSessionInfo: true,
      scope: ["email", "profile"],
    })(req, res);
  } catch (err) {
    console.log(`Error on google authentication ${err}`);
  }
};

// google auth signup
const googleSignup = async (req, res) => {
  try {
    let uniqueReferralCode = false;
    let referralCodes;

    /* ------ will loop continuously until a unique code is being generated ----- */
    while (!uniqueReferralCode) {
      /* ---------- generate a referral code with specific options ---------- */
      referralCodes = voucherCodes.generate({
        length: 10,
        count: 1,
        charset: voucherCodes.charset("alphabetic").toUpperCase(),
        pattern: "##########",
      });

      const existingReferralCode = await userSchema.aggregate([
        {
          $match: { referralCode: referralCodes[0] },
        },
      ]);

      if (existingReferralCode.length === 0) {
        uniqueReferralCode = true;
      }
    }

    req.session.intendedAction = "signup";
    req.session.signupReferralCode = req.query.referralCode;
    req.session.referralCode = referralCodes[0];

    passport.authenticate("google", {
      keepSessionInfo: true,
      scope: ["email", "profile"],
    })(req, res);
  } catch (err) {
    console.log(`Error on google authentication ${err}`);
  }
};

// google auth callback from the auth service
const googleAuthCallback = (req, res, next) => {
  try {
    passport.authenticate(
      "google",
      { keepSessionInfo: true },
      async (err, user, info) => {
        if (err) {
          console.log(`Error on google auth callback: ${err}`);
          return next(err);
        }

        const existingUser = await userSchema.findOne({ email: user.email });
        const intendedAction = req.session.intendedAction;
        const signupReferralCode = req.session.signupReferralCode;
        delete req.session.intendedAction;
        delete req.session.signupReferralCode;
        delete req.session.referralCode;

        if (!existingUser && intendedAction === "login") {
          req.flash("alert", {
            message: "Account not exists. Try signup!",
            color: "bg-danger",
          });

          return res.redirect("/signup");
        }

        if (!info.newUser && intendedAction === "signup") {
          req.flash("alert", {
            message: "Account already exists. Try login!",
            color: "bg-danger",
          });

          return res.redirect("/login");
        }

        if (info.newUser && signupReferralCode) {
          const rewardAmount = 500;

          const referrer = await userSchema.findOne({
            referralCode: signupReferralCode,
          });

          const referrerWallet = await walletSchema.findOne({
            userID: referrer._id,
          });

          // creates wallet for referrer if not exist, else update wallet
          if (!referrerWallet) {
            await walletSchema.create({
              userID: referrer._id,
              balance: rewardAmount,
              transactions: [
                {
                  reason: "Referral Reward",
                  amount: rewardAmount,
                  type: "credit",
                  runningBalance: rewardAmount,
                },
              ],
            });
          } else {
            referrerWallet.balance += rewardAmount;
            referrerWallet.transactions.push({
              reason: "Referral Reward",
              amount: rewardAmount,
              type: "credit",
              runningBalance: referrerWallet.balance,
            });

            await referrerWallet.save();
          }

          // creates wallet for referred
          await walletSchema.create({
            userID: user._id,
            balance: rewardAmount,
            transactions: [
              {
                reason: "Referral Reward",
                amount: rewardAmount,
                type: "credit",
                runningBalance: rewardAmount,
              },
            ],
          });
        }

        if (!user) {
          return res.redirect("/login");
        }

        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }

          // Store the user ID in the session
          req.session.user = user._id;

          const redirectUrl =
            intendedAction === "signup"
              ? "/home?signup=true"
              : "/home?login=true";

          return res.redirect(redirectUrl);
        });
      }
    )(req, res, next);
  } catch (err) {
    console.log(`Error on google callback ${err}`);
  }
};

// will destroy the session and logout user
const logout = (req, res) => {
  try {
    delete req.session.user;

    res.redirect("/login?logout=true");
  } catch (err) {
    console.log("Error on user logout", err);
  }
};

const addUser = async (req, res) => {
  await userSchema.create({
    name: req.body.username,
    password: req.body.password,
  });
};

module.exports = {
  user,
  login,
  loginPost,
  signup,
  signupPost,
  checkEmail,
  checkReferralCode,
  otp,
  otpTimer,
  checkOtp,
  resendOtp,
  otpPost,
  googleLogin,
  googleSignup,
  googleAuthCallback,
  logout,
};
