/**
 * isAuthenticated
 *
 * @module      :: Policy
 * @description :: Simple policy to require an authenticated user, or else redirect to login page
 *                 Looks for an Authorization header bearing a valid JWT token
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */

module.exports = async function(req, res, next) {
  // await sails.helpers.verifyToken.with({ req, res });
  // next();

  sails.helpers.verifyToken
    .with({
      req: req,
      res: res
    })
    .switch({
      error: function(err) {
        return res.serverError(err);
      },
      invalid: function(err) {
        return res.status(401).send({ message: err });
      },
      success: function() {
        return next();
      }
    });
};
