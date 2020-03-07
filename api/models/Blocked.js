module.exports = {
  attributes: {
    id: { type: "number", columnName: "_id" },
    blockId: { type: "string", required: true },

    // Add a reference to User model
    ownerId: {
      model: "user"
    }
  }
};
