module.exports = {
  attributes: {
    caption: { type: "string", defaultsTo: "" },
    commentsDisabled: { type: "boolean", defaultsTo: false },
    id: { type: "number", columnName: "_id" },
    isSidecar: { type: "boolean" },
    isVideo: { type: "boolean" },
    location: { type: "string", defaultsTo: "" },
    numComments: { type: "number" },
    numPreviewLikes: { type: "number" },
    ownerId: { type: "string" },
    postedAt: { type: "number", autoCreatedAt: true },
    savedByViewer: { type: "boolean" },
    sidecarChildren: { type: "string" },
    src: { type: "string" },
    captionIsEdited: { type: "boolean" },
    isAd: { type: "boolean" },
    comments: { type: "string", defaultsTo: "{}" }
  }
};
