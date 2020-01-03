/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  login: function(req, res) {
    var email = req.body.email;
    var password = req.body.password;

    if (!email || !password) {
      return res.status(401).send({
        message: "Email and password required"
      });
    }

    User.findOneByEmail(email, (err, user) => {
      if (!user) {
        return res.json(401, {
          message: "Invalid username or password"
        });
      }

      User.validatePassword(password, user, (err, valid) => {
        if (err) {
          return res.status(403);
        }
        if (!valid) {
          return res.status(401).send({
            message: "Invalid Credentials"
          });
        }
      });

      // var jwtToken = createAuthToken(user);
      // res.status(200).json({ user: user, token: jwtToken });

      res.status(200).json({
        user: user
      });
    });
  },
  signup: async function(req, res) {
    var userParams = {
      email: req.body.email,
      username: req.body.username,
      fullName: req.body.fullName,
      password: req.body.password,
      isNew: true
    };

    console.log(userParams);
    // return userParams;

    if (!userParams.email || !userParams.password) {
      return res.status(401).send({
        message: "Email and password required"
      });
    }

    var newUser = await User.create(userParams)
      // Uniqueness constraint violation
      .intercept("E_UNIQUE", err => {
        return "emailAlreadyInUse";
      })
      // Some other kind of usage / validation error
      .intercept(
        {
          name: "UsageError"
        },
        err => {
          return "invalid: " + err;
        }
      )
      .fetch();
    // If something completely unexpected happened, the error will be thrown as-is.

    return res.status(201).send(newUser);
  },
  currentUser: async function(req, res) {
    var values = req.allParams();

    console.log(values);

    if (!values.email) {
      return res.status(401).send({
        message: "Email required"
      });
    }

    var data = await User.find({
      where: {
        email: values.email
      },
      select: ["bio", "fullName", "username"]
    });

    // console.log(data.length);
    // if (data.length) {
    // }

    return res.send(data);
  }
};
