module.exports = {
  posts: async (req, res) => {
    const id = req.query.id;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    const postFound = await User.findOne({
      where: { id: id },
      select: ["id"]
    }).populate("savedId", {
      skip: (page - 1) * limit,
      limit: limit,
      sort: "createdAt DESC"
    });

    // return res.status(200).send(postFound);

    const totalItem = await User.findOne({
      where: { id: id }
    })
      .populate("savedId")
      .then(user => {
        if (user) return user.savedId.length;
        else return 0;
      });

    return res.send({ data: postFound.savedId, totalItem: totalItem });
  }
};
