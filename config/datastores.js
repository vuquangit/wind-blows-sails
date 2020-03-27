const dotenv = require("dotenv");
dotenv.config();

module.exports.datastores = {
  default: {
    adapter: "sails-mongo",
    url: process.env.DATABASE_URL
  }
};
