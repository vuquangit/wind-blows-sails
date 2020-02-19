module.exports = {
  addUserBlocked: async (req, res) => {
    const ownerId = req.body.ownerId || undefined;
    const userIdBlocked = req.body.userIdBlocked || undefined;

    if (!ownerId)
      return res
        .status(400)
        .json({ message: "Add blocked failed. Owner ID is request." });

    if (!userIdBlocked)
      return res
        .status(400)
        .json({ message: "Add blocked failed. User ID blocked is request" });

    const userValid = await User.findOne({
      id: ownerId
    }).catch(err => {
      res.serverError(err);
    });

    if (userValid === undefined)
      return res
        .status(400)
        .json({ message: "Add blocked failed. Owner ID not found." });
    else {
      const userBlockValid = await User.findOne({
        id: userIdBlocked
      }).catch(err => {
        res.serverError(err);
      });

      if (userBlockValid === undefined)
        return res.status(400).json({
          message: "Add blocked failed. User ID blocked is not found."
        });

      const userIdFound = await Blocked.findOne({
        userIdBlocked: userIdBlocked
      }).catch(err => {
        res.serverError(err);
      });

      if (userIdFound !== undefined)
        return res.status(400).json({
          message: "Add blocked failed. User ID blocked adready added."
        });
      else {
        await Blocked.create({
          ownerId: ownerId,
          userIdBlocked: userIdBlocked
        }).catch(err => {
          res.serverError(err);
        });
        return res.status(201).send({ message: "User is blocked." });
      }
    }
  },
  unblock: async (req, res) => {
    const ownerId = req.body.ownerId || undefined;
    const userIdBlocked = req.body.userIdBlocked || undefined;

    if (!ownerId)
      return res
        .status(400)
        .json({ message: "Unblock failed. Owner ID is request." });

    if (!userIdBlocked)
      return res
        .status(400)
        .json({ message: "Unblock failed. User ID unblock is request" });

    const _unblock = await Blocked.destroyOne({
      ownerId: ownerId,
      userIdBlocked: userIdBlocked
    });
    if (_unblock) {
      return res.status(200).send({ message: "Unblock successfully" });
    } else
      return res.status(400).send({
        message: "Unblock failed. The database does not have a blocked..."
      });
  },
  blocked: async (req, res) => {
    const id = req.body.id || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    if (!id) return res.status(400).json({ message: "Owner ID is request." });

    const blockedList = await User.findOne({
      where: { id: id },
      select: ["id"]
    }).populate("blockedId", {
      select: ["id", "userIdBlocked"],
      skip: (page - 1) * limit,
      limit: limit,
      sort: "createdAt ASC"
    });

    if (!blockedList) {
      return res.send({ message: "id not found" });
    } else {
      if (blockedList.blockedId.length > 0) {
        const fetchUserInfo = async users => {
          const data = users.map(async (item, idx) => {
            return await User.findOne({
              where: { id: item.userIdBlocked },
              select: [
                "id",
                "fullName",
                "isNew",
                "isPrivate",
                "profilePictureUrl",
                "username",
                "isVerified"
              ]
            });
          });

          return Promise.all(data);
        };

        fetchUserInfo(blockedList.blockedId).then(data => {
          blockedList.blockedId = data;

          return res.status(200).send(blockedList);
        });
      } else {
        return res.status(200).send(blockedList);
      }
    }
  }
};
