/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var Emailaddresses = require("machinepack-emailaddresses");

module.exports = {
  login: async (req, res) => {
    const email = req.body.email || undefined;
    const username = req.body.username || undefined;
    const password = req.body.password || undefined;

    // if (!(!!email && !!username)) {
    //   return res.status(401).send({
    //     message: "Email or username required"
    //   });
    // }

    if (!username) {
      if (!email) {
        return res.status(401).send({
          message: "Email or username required"
        });
      }
    }

    if (!password) {
      return res.status(401).send({
        message: "Password required"
      });
    }

    let userFound = undefined;
    const selectDefault = [
      "id",
      "bio",
      "fullName",
      "email",
      "gender",
      "isNew",
      "isPrivate",
      "profilePictureUrl",
      "profilePictureUrlHd",
      "username",
      "website",
      "isVerified",
      "password",
      "isUnpublished",
      "phoneNumber"
    ];

    if (email !== undefined) {
      userFound = await User.findOne({
        where: { email: email },
        select: selectDefault
      });
    }

    if (userFound === undefined && username === undefined) {
      return res.status(401).send({
        message:
          "The email you entered doesn't belong to an account. Please check your email and try again."
      });
    } else if (username !== undefined) {
      userFound = await User.findOne({
        where: { username: username },
        select: selectDefault
      });

      if (userFound === undefined) {
        return res.status(401).send({
          message:
            "The username you entered doesn't belong to an account. Please check your username and try again."
        });
      }
    }

    // User.validatePassword(password, userFound, (err, valid) => {
    //   if (err) {
    //     console.log(err);
    //     res.status(403);
    //   } else if (!valid) {
    //     console.log("check pass", valid);
    //     res.status(401).send({
    //       message: "Invalid Credentials"
    //     });
    //   }
    // });

    const passValid = await bcrypt.compare(password, userFound.password);

    if (!passValid) {
      return res.status(401).send({
        message:
          "Sorry, your password was incorrect. Please double-check your password."
      });
    }

    // count follow, media of user
    const counts = await UserService.counts(userFound.id);

    // if no errors were thrown, then grant them a new token
    // set these config vars in config/local.js, or preferably in config/env/production.js as an environment variable
    var token = jwt.sign({ user: userFound.id }, process.env.JWT_SECRET, {
      expiresIn: 3600
    });
    // set a cookie on the client side that they can't modify unless they sign out (just for web apps)
    res.cookie("sailsjwt", token, {
      signed: true,
      // domain: '.yourdomain.com', // always use this in production to whitelist your domain
      maxAge: 3600
    });

    res.status(200).send({ user: { ...userFound, counts }, token: token });
  },
  signup: async (req, res) => {
    const userParams = {
      email: req.body.email || undefined,
      username: req.body.username || null,
      fullName: req.body.fullName || null,
      password: req.body.password || null,
      phoneNumber: req.body.phoneNumber || null,
      profilePictureUrl: req.body.profilePictureUrl || "",
      profilePictureUrlHd: req.body.profilePictureUrlHd || "",
      emailVerified: false,
      isNew: true,
      isVerified: false
    };

    if (_.isUndefined(req.param("email"))) {
      return res.status(401).send({ message: "An email address is required." });
    }

    if (_.isUndefined(req.param("password"))) {
      return res.status(401).send({ message: "A password is required." });
    }

    if (req.param("password").length < 8) {
      return res
        .status(401)
        .send({ message: "Password must be at least 8 characters." });
    }

    Emailaddresses.validate({
      string: req.param("email")
    }).exec({
      error: function(err) {
        return res.serverError(err);
      },
      invalid: function() {
        return res
          .status(401)
          .send({ message: "Doesn't look like an email address." });
      },
      success: async function() {
        // check email
        const emailFound = await User.findOne({
          where: { email: userParams.email }
        });
        if (emailFound !== undefined) {
          return res.status(401).send({ message: "Email already exists." });
        }

        // check username
        const usernameFound = await User.findOne({
          where: { username: userParams.username }
        });
        if (usernameFound !== undefined) {
          return res.status(401).send({ message: "username already exists." });
        }

        // Create new user
        user = await AuthService.createUser(userParams, true);

        // Default counts of user
        const counts = {
          followedBy: 0,
          follows: 0,
          media: 0
        };

        // after creating a user record, log them in at the same time by issuing their first jwt token and setting a cookie
        var token = jwt.sign({ user: user.id }, process.env.JWT_SECRET, {
          expiresIn: 3600
        });
        res.cookie("sailsjwt", token, {
          signed: true,
          // domain: '.yourdomain.com', // always use this in production to whitelist your domain
          maxAge: 3600
        });

        return res.status(201).send({ user: { ...user, counts }, token });
      }
    });
  },
  currentUser: async function(req, res) {
    const email = req.body.email;

    if (!email) {
      return res.status(401).send({
        message: "Email required"
      });
    }

    const userFound = await User.findOne({
      where: {
        email: email
      },
      select: [
        "id",
        "bio",
        "fullName",
        "email",
        "gender",
        "isNew",
        "isPrivate",
        "profilePictureUrl",
        "profilePictureUrlHd",
        "username",
        "website",
        "isVerified",
        "isUnpublished",
        "phoneNumber"
      ]
    }).catch(err => res.serverError(err));

    // Create new user
    if (userFound === undefined) {
      const userParams = {
        email: email,
        fullName: req.body.fullName || "",
        username: req.body.username || undefined,
        emailVerified: req.body.emailVerified || false,
        phoneNumber: req.body.phoneNumber || "",
        profilePictureUrl: req.body.profilePictureUrl || "",
        profilePictureUrlHd: req.body.profilePictureUrlHd || "",
        isPrivate: false,
        website: "",
        isNew: true,
        isVerified: false
      };

      newUser = await AuthService.createUser(userParams, false);
      var token = jwt.sign({ user: newUser.id }, process.env.JWT_SECRET, {
        expiresIn: 3600
      });
      // set a cookie on the client side that they can't modify unless they sign out (just for web apps)
      res.cookie("sailsjwt", token, {
        signed: true,
        maxAge: 3600
      });

      return res.status(200).send({ user: newUser, token });
    } else {
      // counts of user
      const counts = await UserService.counts(userFound.id);

      // Token user
      var token = jwt.sign({ user: userFound.id }, process.env.JWT_SECRET, {
        expiresIn: 3600
      });
      // set a cookie on the client side that they can't modify unless they sign out (just for web apps)
      res.cookie("sailsjwt", token, {
        signed: true,
        maxAge: 3600
      });

      return res.status(200).send({ user: { ...userFound, counts }, token });
    }
  },

  logout: function(req, res) {
    res.clearCookie("sailsjwt");
    res.user = null;
    return res.ok();
  }
};
