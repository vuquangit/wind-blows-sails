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
    var email = req.body.email || undefined;
    var password = req.body.password || undefined;

    if (!email || !password) {
      return res.status(401).send({
        message: "Email and password required"
      });
    }

    const userFound = await User.findOne({
      where: { email: email },
      select: [
        "id",
        "bio",
        "fullName",
        "email",
        "isNew",
        "isPrivate",
        "profilePictureUrl",
        "profilePictureUrlHd",
        "username",
        "website",
        "isVerified",
        "password"
      ]
    }).catch(err => {
      return res.serverError(err);
    });

    if (userFound === undefined) {
      return res.status(401).json({
        message: "Invalid email"
      });
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

    if (!passValid)
      return res.status(401).send({ message: "Invalid Credentials" });

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

    res.status(200).json({ user: userFound, token: token });
  },
  signup: async (req, res) => {
    const userParams = {
      email: req.body.email || undefined,
      username: req.body.username || null,
      fullName: req.body.fullName || null,
      password: req.body.password || null,
      phoneNumber: req.body.phoneNumber || null,
      emailVerified: false,
      isNew: true,
      isVerified: false
    };

    if (_.isUndefined(req.param("email"))) {
      return res.badRequest("An email address is required.");
    }

    if (_.isUndefined(req.param("password"))) {
      return res.badRequest("A password is required.");
    }

    if (req.param("password").length < 8) {
      return res.badRequest("Password must be at least 8 characters.");
    }

    Emailaddresses.validate({
      string: req.param("email")
    }).exec({
      error: function(err) {
        return res.serverError(err);
      },
      invalid: function() {
        return res.badRequest("Doesn't look like an email address.");
      },
      success: async function() {
        const userFound = await User.findOne({ email: userParams.email });
        // console.log(userFound);
        if (userFound !== undefined) {
          return res.status(401).send({ message: "Email already exists." });
        }

        user = AuthService.createUser(userParams, true);

        // after creating a user record, log them in at the same time by issuing their first jwt token and setting a cookie
        var token = jwt.sign({ user: user.id }, process.env.JWT_SECRET, {
          expiresIn: 3600
        });
        res.cookie("sailsjwt", token, {
          signed: true,
          // domain: '.yourdomain.com', // always use this in production to whitelist your domain
          maxAge: 3600
        });

        return res.status(201).send({ user: userFound, token });
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
        "bio",
        "fullName",
        "username",
        "isNew",
        "isPrivate",
        "profilePictureUrl",
        "isVerified"
      ]
    }).catch(err => res.serverError(err));

    if (userFound === undefined) {
      const userParams = {
        email: email,
        fullName: req.body.fullName || "",
        emailVerified: req.body.emailVerified || false,
        phoneNumber: req.body.phoneNumber || null,
        isNew: true,
        isVerified: false
      };

      newUser = await AuthService.createUser(userParams, false);

      // console.log(newUser);
      return res.status(201).send(newUser);
    } else {
      // console.log("userFound: ", userFound);

      var token = jwt.sign({ user: userFound.id }, process.env.JWT_SECRET, {
        expiresIn: 3600
      });
      // set a cookie on the client side that they can't modify unless they sign out (just for web apps)
      res.cookie("sailsjwt", token, {
        signed: true,
        maxAge: 3600
      });

      return res.status(200).send({ user: userFound, token });
    }
  },

  logout: function(req, res) {
    res.clearCookie("sailsjwt");
    req.user = null;
    return res.ok();
  }
};
