module.exports = {
  createUser: async (userParams, isRequestPassword) => {
    // console.log(userParams);

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
    // If something completely unexpected happened, the error will be thrown as-is.

    return newUser;
  }
};
