module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },

    text: {
      type: "string"
    },

    read: {
      type: "boolean",
      defaultsTo: false
    },

    typeNotification: {
      type: "number",
      required: true
    },

    postId: {
      model: "posts"
    },

    commentsId: {
      model: "postComments"
    },

    senderId: {
      model: "user",
      required: true
    },

    receiverId: {
      model: "user",
      required: true
    }
  }
};
