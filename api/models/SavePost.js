module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },

    //
    postId: {
      collection: "posts",
      via: "savedId"
    },

    // Add a reference to User model
    ownerId: {
      model: "user"
    }
  }
};
