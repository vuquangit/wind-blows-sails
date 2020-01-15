module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },

    // Add a reference to User model
    ownerId: {
      collection: "user",
      via: "blockedId"
    }
  }
};
