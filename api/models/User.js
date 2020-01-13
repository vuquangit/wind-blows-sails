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

    isUnpublished: {
      type: "string"
    },

    emailVerified: {
      type: "boolean",
      defaultsTo: false
    },

    // Add a reference to Follower model
    following: {
      collection: "user",
      via: "follower",
      dominant: true
    },

    // Add a reference to Following model
    follower: {
      collection: "user",
      via: "following"
    },

    // Add a reference to Blocked model
    blockedId: {
      collection: "blocked",
      via: "ownerId"
    },

    // Add a reference to Post model
    postId: {
      collection: "posts",
      via: "ownerId"
    },

    // Add a reference to Saved model
    savedId: {
      collection: "savepost",
      via: "ownerId"
    }
  },
  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ["password"]);
  },
  beforeCreate: function(attributes, next) {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return next(err);
      }
      bcrypt.hash(attributes.password, salt, (err, hash) => {
        if (err) {
          return next(err);
        }
        attributes.password = hash;
        next();
      });
    });
  },
  validatePassword: function(password, user, cb) {
    bcrypt.compare(password, user.password, function(err, match) {
      if (err) cb(err, false);

      if (match) {
        cb(null, true);
      } else {
        cb(err, false);
      }
    });
  },
  getRoles: function(userId) {
    User.findOne(userId)
      .populate("roles")
      .then(user => {
        console.log(user.roles);
        return user.roles;
      });
  }
};
