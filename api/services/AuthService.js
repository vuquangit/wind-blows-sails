var jwt = require("jsonwebtoken");

module.exports = {
  createUser: async (userParams, isRequestPassword) => {
    if (isRequestPassword) {
      if (!userParams.email || !userParams.password) {
        return res.status(401).send({
          message: "Email or password required"
        });
      }
    } else if (!userParams.email) {
      return res.status(401).send({
        message: "Email required"
      });
    }

    if (!!userParams.username) {
      const usernameFound = await User.findOne({
        username: userParams.username
      });

      if (usernameFound !== undefined) {
        return res
          .status(401)
          .send({ message: "Failed. The username already exists" });
      }
    }

    var newUser = await User.create(userParams)
      // Uniqueness constraint violation
      .intercept("E_UNIQUE", err => {
        return "Email or Username Already In Use: " + err;
      })
      // Some other kind of usage / validation error
      .intercept(
        {
          name: "Usage Error"
        },
        err => {
          return "invalid: " + err;
        }
      )
      .fetch();

    if (!userParams.username) {
      const _modifiedUser = await User.updateOne({ id: newUser.id }).set({
        username: newUser.id
      });

      return _modifiedUser;
    }

    return newUser;
  },
  generateRefreshToken: async user => {
    const refreshToken = await jwt.sign(
      { user: user },
      process.env.JWT_SECRET_REFRESH_TOKEN,
      {
        expiresIn: process.env.JWT_EXPIRES_REFRESH_TOKEN
      }
    );

    return refreshToken;
  },
  generateAccessToken: async user => {
    const token = await jwt.sign(
      { user: user },
      process.env.JWT_SECRET_ACCESS_TOKEN,
      {
        expiresIn: process.env.JWT_EXPIRES_ACCESS_TOKEN
      }
    );

    return token;
  },
  generateTokens: async user => {
    const refreshToken = await jwt.sign(
      { user: user },
      process.env.JWT_SECRET_REFRESH_TOKEN,
      {
        expiresIn: process.env.JWT_EXPIRES_REFRESH_TOKEN
      }
    );

    const token = await jwt.sign(
      { user: user },
      process.env.JWT_SECRET_ACCESS_TOKEN,
      {
        expiresIn: process.env.JWT_EXPIRES_ACCESS_TOKEN
      }
    );

    return {
      tokenType: "Bearer",
      refreshToken,
      token,
      expiredIn: process.env.JWT_EXPIRES_ACCESS_TOKEN
    };
  }
};
