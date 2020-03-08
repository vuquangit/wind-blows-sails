module.exports = {
  addBlock: async (req, res) => {
    const viewerId = req.body.viewerId || undefined;
    const ownerId = req.body.ownerId || undefined;

    if (!viewerId) {
      return res
        .status(400)
        .json({ message: "Add blocked failed: viewer ID is request." });
    }

    if (!ownerId) {
      return res
        .status(400)
        .json({ message: "Add blocked failed. User ID block is request" });
    }

    const viewerFound = await User.findOne({
      id: viewerId
    }).catch(err => {
      res.serverError(err);
    });

    if (viewerFound === undefined) {
      return res
        .status(400)
        .json({ message: "Add blocked failed. viewer ID not found." });
    }

    const userBlockFound = await User.findOne({
      id: ownerId
    }).catch(err => {
      res.serverError(err);
    });

    if (userBlockFound === undefined) {
      return res.status(400).json({
        message: "Add blocked failed. User ID block is not found."
      });
    }

    const userIdFound = await Blocked.findOne({
      blockId: ownerId
    }).catch(err => {
      res.serverError(err);
    });

    if (userIdFound) {
      return res.status(400).json({
        message: "Add blocked failed. User ID blocked adready added."
      });
    } else {
      await Blocked.create({
        ownerId: viewerId,
        blockId: ownerId
      }).catch(err => {
        res.serverError(err);
      });

      return res.status(201).send({ message: "User is blocked." });
    }
  },

  unblock: async (req, res) => {
    const viewerId = req.body.viewerId || undefined;
    const ownerId = req.body.ownerId || undefined;

    if (!viewerId) {
      return res
        .status(400)
        .json({ message: "Unblock failed: Owner ID is request." });
    }

    if (!ownerId) {
      return res
        .status(400)
        .json({ message: "Unblock failed: User ID unblock is request" });
    }

    const viewerFound = await User.findOne({
      where: { id: viewerId }
    }).populate("blockedId", {
      where: { blockId: ownerId }
    });

    if (!viewerFound) {
      return res
        .status(400)
        .send({ message: "Unblock failed: User id not found." });
    }

    if (viewerFound.blockedId.length === 0) {
      return res
        .status(400)
        .send({ message: "Unblock failed: block id not found." });
    }

    const blockedBurned = await Blocked.destroyOne({
      id: _.get(viewerFound, "blockedId[0].id", "")
    });

    if (blockedBurned) {
      return res.status(200).send({ message: "Unblock successfully" });
    } else {
      return res.status(400).send({
        message: "Unblock failed. The database does not have a blocked..."
      });
    }
  },

  blocks: async (req, res) => {
    const id = req.query.id || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    if (!id) {
      return res.status(400).json({ message: "Owner ID is request." });
    }

    const blockedList = await User.findOne({
      where: { id: id },
      select: ["id"]
    }).populate("blockedId", {
      select: ["id", "blockId"],
      skip: (page - 1) * limit,
      limit: limit,
      sort: "createdAt ASC"
    });

    if (!blockedList) {
      return res.status(400).send({ message: "id not found" });
    }

    const blockedId = await Promise.all(
      blockedList.blockedId.map(
        async item =>
          await User.findOne({
            where: { id: item.blockId },
            select: [
              "id",
              "fullName",
              "isNew",
              "isPrivate",
              "profilePictureUrl",
              "profilePicturePublicId",
              "username",
              "isVerified"
            ]
          })
      )
    );

    return res
      .status(200)
      .send(_.omit({ ...blockedList, blocks: blockedId }, ["blockedId"]));
  }
};
