module.exports = async function(req, res, next) {
  var greeting = await sails.helpers.formatWelcomeMessage("Bubba");
  sails.log(greeting);
  // => "Hello, Bubba!"
};
