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
      }).populate("following", { select: ["id"] });

      if (userFollowed && userFollowed.following) {
        const userSuggestion = await _.filter(
          userDB,
          o => _.findIndex(userFollowed.following, f => f.id === o.id) < 0
        );

        const userSuggestionPanigation = await _.slice(
          userSuggestion,
          (page - 1) * limit,
          (page - 1) * limit + limit
        );

        const getRelationships = async () => {
          const fetchRelationship = userSuggestionPanigation.map(
            async (item, idx) => {
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
            }
          );

          return Promise.all(fetchRelationship);
        };

        getRelationships().then(data => {
          return res
            .status(200)
            .send({ data, totalItem: userSuggestion.length });
        });
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
      ],
      skip: (page - 1) * limit,
      limit: limit
    });

    if (searchFound) {
      const getSubTitle = async () => {
        const fetchRelationship = searchFound.map(async (item, idx) => {
          const isFollowing = await User.findOne({
            id: viewerId
          }).populate("following", { where: { id: item.id } });

          if (isFollowing)
            return {
              ...item,
              subTitle: `${item.fullName}${
                isFollowing.following.length > 0 ? " • Following" : ""
              }`
            };
          else return item;
        });

        return Promise.all(fetchRelationship);
      };

      getSubTitle().then(async data => {
        const totalItems = await User.find({
          or: [
            { username: { contains: value } },
            { fullName: { contains: value } }
          ]
        });

        return res.status(200).send({ data, totalItems: totalItems.length });
      });
    } else {
      return res.status(200).send({ data: [], totalItems: 0 });
    }
  }
};
