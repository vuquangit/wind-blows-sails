module.exports = {
  saved: async (req, res) => {
    const userId = req.body.id;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    const postFound = await User.findOne({
      where: { id: userId },
      select: ["id"]
    }).populate("savedId", {
      skip: (page - 1) * limit,
      limit: limit,
      sort: "createdAt DESC"
    });

    return res.send(postFound);
  }
};
