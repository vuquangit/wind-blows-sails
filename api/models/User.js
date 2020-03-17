var bcrypt = require("bcryptjs");

module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },
    bio: { type: "string", defaultsTo: "" },
    fullName: { type: "string" },
    phoneNumber: { type: "string", allowNull: true },
    email: { type: "string", required: true, unique: true },
    isNew: { type: "boolean", defaultsTo: true },
    isPrivate: { type: "boolean", defaultsTo: false },
    profilePictureUrl: { type: "string" },
    profilePicturePublicId: { type: "string" },
    username: { type: "string", required: true, unique: true },
    password: { type: "string" },
    website: { type: "string", defaultsTo: "" },
    isVerified: { type: "boolean", defaultsTo: false },
    isUnpublished: { type: "boolean", defaultsTo: false },
    emailVerified: { type: "boolean", defaultsTo: false },
    gender: { type: "string" },
    disabledAccount: { type: "boolean", defaultsTo: false },
    notificationToken: { type: "string" },
    isAuthorizationLogin: { type: "boolean", defaultsTo: false },
    resetPasswordToken: { type: "string" },
    resetPasswordExpires: { type: "number" },

    // direct follow
    following: {
      collection: "user",
      via: "follower",
      dominant: true
    },

    follower: {
      collection: "user",
      via: "following"
    },

    // follow request
    followingRequest: {
      collection: "user",
      via: "followerRequest",
      dominant: true
    },

    followerRequest: {
      collection: "user",
      via: "followingRequest"
    },

    //  Blocked model
    blockedId: {
      collection: "blocked",
      via: "ownerId"
    },

    //  Post model
    postId: {
      collection: "posts",
      via: "ownerId"
    },

    //  Saved model
    savedId: {
      collection: "savepost",
      via: "ownerId"
    },

    //  Comments Like model
    likeCommentsId: {
      collection: "postcommentslikes",
      via: "ownerId"
    },

    //  notifications model
    notifications: {
      collection: "notifications",
      via: "receiverId"
    }
  },
  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ["password"]);
  },
  beforeCreate: function(attributes, next) {
    if (attributes.password) {
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
    } else {
      next();
    }
  },
  beforeUpdate: function(attributes, next) {
    if (attributes.password) {
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
    } else {
      next();
    }
  },
  validatePassword: function(password, user, cb) {
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) {
        cb(err, false);
      }

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
