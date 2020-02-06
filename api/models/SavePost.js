module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },

    //
    postId: {
      model: "posts"
    },

    // Add a reference to User model
    ownerId: {
      model: "user"
    }
  }
};
