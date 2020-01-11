module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },
    userIdBlocked: { type: "string" },

    // Add a reference to User model
    ownerId: {
      model: "user"
    }
  }
};
