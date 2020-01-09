module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },
    caption: { type: "string", defaultsTo: "" },
    commentsDisabled: { type: "boolean", defaultsTo: false },
    isSidecar: { type: "boolean" },
    isVideo: { type: "boolean" },
    location: { type: "string", defaultsTo: "" },
    // numComments: { type: "number" },
    // numPreviewLikes: { type: "number" },
    // savedByViewer: { type: "boolean" },
    sidecarChildren: { type: "string" },
    src: { type: "string" },
    captionIsEdited: { type: "boolean" },

    // Add a reference to User
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
    }
  }
};
