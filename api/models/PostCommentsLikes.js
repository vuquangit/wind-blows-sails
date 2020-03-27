module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },
    likedAt: { type: "number", autoCreatedAt: true },

    // Add a reference to PostComments
    postCommentsId: {
      model: "postcomments"
    },

    // Add a reference to User
    ownerId: {
      model: "user"
    }
  }
};
