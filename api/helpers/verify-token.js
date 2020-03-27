var jwt = require("jsonwebtoken");

module.exports = {
  friendlyName: "Verify JWT",
  description: "Verify a JWT token.",
  inputs: {
    req: {
      type: "ref",
      friendlyName: "Request",
      description: "A reference to the request object (req).",
      required: true
    },
    res: {
      type: "ref",
      friendlyName: "Response",
      description: "A reference to the response object (res).",
      required: true
    }
  },
  exits: {
    invalid: {
      description: "Invalid token or no authentication present."
    }
  },

  fn: async (inputs, exits) => {
    var req = inputs.req;
    var res = inputs.res;

    // // first check for a cookie (web client)
    // if (req.signedCookies.sailsjwt) {
    //   // if there is something, attempt to parse it as a JWT token
    //   return jwt.verify(
    //     req.signedCookies.sailsjwt,
    //     sails.config.jwtSecret,
    //     async (err, payload) => {
    //       // if there's an error verifying the token (e.g. it's invalid or expired), no go
    //       if (err || !payload.user) {return exits.invalid();}
    //       // otherwise try to look up that user
    //       var user = await User.findOne(payload.user);
    //       // if the user can't be found, no go
    //       if (!user) {return exits.invalid();}
    //       // otherwise save the user object on the request (i.e. "log in") and continue
    //       req.user = user;
    //       return exits.success(user);
    //     }
    //   );
    // }

    // check for a JWT token in the header
    const authorization = req.header("authorization");
    // console.log(authorization, "authorization");

    if (authorization) {
      const token = authorization.split("Bearer ")[1];
      if (!token) {
        return res.status(401).send({ message: "token user not found" });
        // throw "invalid";
      }

      // if there is something, attempt to parse it as a JWT token
      return jwt.verify(
        token,
        process.env.JWT_SECRET_ACCESS_TOKEN,
        async (err, payload) => {
          if (err || !payload.user) {
            return res.status(401).send({ message: err });
            // throw "invalid";
          }

          const user = await User.findOne(payload.user);
          if (!user) {
            return res.status(401).send({ message: "user not found" });
            // throw "invalid";
          }

          return exits.success();
        }
      );
    }

    // if neither a cookie nor auth header are present, then there was no attempt to authenticate
    return res.status(401).send({ message: "jwt verify: failed" });
    // throw "invalid";
  }
};
