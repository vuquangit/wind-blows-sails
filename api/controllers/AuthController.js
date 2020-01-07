/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  login: async (req, res) => {
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
  signup: async (req, res) => {
    const userParams = {
      email: req.body.email,
      username: req.body.username || "",
      fullName: req.body.fullName || "",
      password: req.body.password || null,
      isNew: true,
      isVerified: false
    };

    newUser = AuthService.createUser(userParams, true);

    return res.status(201).send(newUser);
  },
  currentUser: async function(req, res) {
    // var values = req.allParams();
    const email = req.body.email;

    // console.log(values);

    if (!email) {
      return res.status(401).send({
        message: "Email required"
      });
    }

    var data = await User.find({
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

    console.log("lenght: ", data.length);
    if (!data.length) {
      const userParams = {
        email: req.body.email,
        fullName: req.body.fullName || "",
        isNew: true,
        isVerified: false
      };

      newUser = AuthService.createUser(userParams, false);

      return res.send(newUser);
    } else return res.send(data);
  }
};
