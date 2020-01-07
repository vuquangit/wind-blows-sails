var bcrypt = require("bcryptjs");

module.exports = {
  attributes: {
    bio: {
      type: "string",
      defaultsTo: ""
    },

    fullName: {
      type: "string"
    },

    phoneNumber: {
      type: "string",
      allowNull: true
    },

    email: {
      type: "string",
      required: true,
      unique: true
    },

    id: {
      type: "number",
      columnName: "_id"
    },

    isNew: {
      type: "boolean",
      defaultsTo: true
    },

    isPrivate: {
      type: "boolean",
      defaultsTo: false
    },

    profilePictureUrl: {
      type: "string"
    },

    profilePictureUrlHd: {
      type: "string"
    },

    username: {
      type: "string",
      // required: true,
      unique: true
    },

    password: {
      type: "string"
      // required: true,
    },

    website: {
      type: "string",
      defaultsTo: ""
    },

    isVerified: {
      type: "boolean",
      defaultsTo: false
    },
    createdAt: {
      type: "number",
      autoCreatedAt: true
    },
    updatedAt: {
      type: "number",
      autoUpdatedAt: true
    },
    follower: {
      type: "json",
      columnType: "array",
      defaultsTo: ""
    },
    following: {
      type: "json",
      columnType: "array",
      defaultsTo: ""
    },
    blocked: {
      type: "json",
      columnType: "array",
      defaultsTo: ""
    }

    // ,toJSON: function() {
    //   var obj = this.toObject();
    //   delete obj.password;
    //   delete obj.updatedAt;
    //   delete obj.createdAt;
    //   return obj;
    // }
  },
  beforeCreate: function(attributes, next) {
    bcrypt.genSalt(10, function(err, salt) {
      if (err) return next(err);
      bcrypt.hash(attributes.password, salt, function(err, hash) {
        if (err) return next(err);
        attributes.password = hash;
        next();
      });
    });
  },
  validatePassword: function(password, user, cb) {
    bcrypt.compare(password, user.password, function(err, match) {
      if (err) cb(err);

      if (match) {
        cb(null, true);
      } else {
        cb(err);
      }
    });
  },
  getRoles: function(userId) {
    User.findOne(userId)
      .populate("roles")
      .then(function(user) {
        console.log(user.roles);
        return user.roles;
      });
  }
};
