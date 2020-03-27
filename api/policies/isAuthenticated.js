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
  await sails.helpers.verifyToken.with({ req, res });
  next();

  // const result = await sails.helpers.verifyToken
  //   .with({
  //     req: req,
  //     res: res
  //   })
  //   .intercept("invalid", err => {
  //     // return 'badRequest';
  //     console.log("invalid error: ", err);
  //     return res.status(401).send({ message: err });
  //   })
  //   .catch(err => {
  //     console.log("cath error: ");
  //     return res.status(401).send({ message: err });
  //   });
};
