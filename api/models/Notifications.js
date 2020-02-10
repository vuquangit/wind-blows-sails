module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },

    message: {
      type: "string"
    },

    read: {
      type: "boolean",
      defaultsTo: false
    },

    senderId: {
      model: "user"
    },

    receiverId: {
      model: "user"
    }
  }
};
