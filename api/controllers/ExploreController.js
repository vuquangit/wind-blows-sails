module.exports = {
  suggestions: async (req, res) => {
    const userId = req.query.userId || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    //#region check valid
    if (!userId) {
      return res.status(400).send({
        message: "id request"
      });
    }

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }
    //#endregion

    const userDB = await User.find({
      where: { id: { "!=": userId } },

      select: [
        "id",
        "fullName",
        "isNew",
        "isPrivate",
        "profilePictureUrl",
        "profilePicturePublicId",
        "username",
        "isVerified"
      ],
      sort: "createdAt ASC"
    });

    if (userDB) {
      const userFollowed = await User.findOne({
        id: userId
      })
        .populate("following", { select: ["id"] })
        .populate("blockedId");

      if (userFollowed && userFollowed.following) {
        // skip by blocked and user has following
        const blockeds =
          userFollowed.blockedId.length > 0
            ? userFollowed.blockedId.map(item => _.get(item, "blockId", ""))
            : [];

        const userSuggestion = await _.filter(
          userDB,
          item =>
            _.findIndex(userFollowed.following, f => f.id === item.id) === -1 &&
            _.indexOf(blockeds, item.id) === -1
        );

        // panigation
        const userSuggestionPanigation = await _.slice(
          userSuggestion,
          (page - 1) * limit,
          (page - 1) * limit + limit
        );

        // modify reponse data
        const data = await Promise.all(
          userSuggestionPanigation.map(async item => {
            const relationship = await FollowService.relationship(
              item.id,
              userId
            );

            return {
              user: {
                ...item,
                suggestionDescription: "New to The Wind Blows"
              },
              relationship: relationship
            };
          })
        );

        return res.status(200).send({ data, totalItem: userSuggestion.length });
      } else {
        res.status(200).send({ data: userDB, totalItem: userDB.length });
      }
    } else {
      res.status(400).send({ message: "user not found" });
    }
  },
  search: async (req, res) => {
    const value = req.query.value || undefined;
    const viewerId = req.query.viewerId || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    //#region check valid
    if (!value) {
      return res.status(400).send({
        message: "value search request"
      });
    }

    if (!viewerId) {
      return res.status(400).send({
        message: "viewer Id search request"
      });
    }

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }
    //#endregion

    const blocks = await Blocked.find({ blockId: viewerId }).populate(
      "ownerId",
      {
        select: ["id"]
      }
    );

    const hasBlockeds =
      blocks && blocks.length > 0
        ? blocks.map(item => _.get(item, "ownerId[0].id", ""))
        : [];

    const searchFound = await User.find({
      where: {
        or: [
          { username: { contains: value } },
          { fullName: { contains: value } }
        ]
      },
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
    });

    if (searchFound) {
      // skip blocked

      // const _searchFound = await searchFound.reduce(
      //   async (accPromise, item) => {
      //     const acc = await accPromise;
      //     if (_.indexOf(hasBlockeds, item.id) === -1) {
      //       return [...acc, item];
      //     } else return acc;
      //   },
      //   Promise.resolve([])
      // );

      const _searchFound = await _.filter(
        searchFound,
        item => _.indexOf(hasBlockeds, item.id) === -1
      );

      // panigation
      const searchPagination = await _searchFound.slice(
        (page - 1) * limit,
        (page - 1) * limit + limit
      );

      // add subtile
      const data = await Promise.all(
        searchPagination.map(async item => {
          const viewerFound = await User.findOne({
            id: viewerId
          })
            .populate("following", { where: { id: item.id } })
            .populate("blockedId");

          if (viewerFound) {
            const blockeds =
              viewerFound.blockedId.length > 0
                ? viewerFound.blockedId.map(item => _.get(item, "blockId", ""))
                : [];

            return {
              ...item,
              subTitle: `${item.fullName}${
                viewerFound.following.length > 0
                  ? _.indexOf(blockeds, item.id) === -1
                    ? " • Following"
                    : " • Blocked"
                  : ""
              }`
            };
          } else {
            return item;
          }
        })
      );

      return res.status(200).send({ data, totalItems: searchFound.length });
    } else {
      return res.status(200).send({ data: [], totalItems: 0 });
    }
  }
};
