module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },
    likedAt: { type: "number", autoCreatedAt: true },

    // Add a reference to User
    userId: {
      model: "user"
    },

    // Add a reference to Posts
    postId: {
      model: "posts"
    }
  }
};
