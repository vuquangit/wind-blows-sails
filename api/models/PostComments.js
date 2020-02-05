module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },
    deleted: { type: "boolean", defaultsTo: false },
    didReportAsSpam: { type: "boolean", defaultsTo: false },
    isAuthorVerified: { type: "boolean", defaultsTo: false },
    text: { type: "string", defaultsTo: "" },

    //
    childComments: {
      collection: "postcomments"
    },

    // Add a reference to PostCommentsLikes
    postCommentsLikesId: {
      collection: "postcommentslikes",
      via: "postCommentsId"
    },

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
