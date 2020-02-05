module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },
    caption: { type: "string", defaultsTo: "" },
    captionIsEdited: { type: "boolean" },
    commentsDisabled: { type: "boolean", defaultsTo: false },
    location: { type: "json" },
    sidecarChildren: { type: "json" },

    // references
    ownerId: {
      collection: "user",
      via: "postId"
    },
    commentsId: {
      collection: "postcomments",
      via: "postId"
    },
    likeId: {
      collection: "postlikes",
      via: "postId"
    },
    savedId: {
      collection: "savepost",
      via: "postId"
    }
  }
};
