module.exports = {
  addFollowing: async (req, res) => {
    const id = req.body.id;
    const idFollowing = req.body.idFollowing;

    if (!id || !idFollowing) {
      return res.status(401).send({
        message: "id or id following request"
      });
    }

    const userFound = await User.find({
      where: { id: id },
      select: ["following"]
    });

    if (userFound.length === 0) {
      return res.send({
        message: "user id not found"
      });
    }

    const userFollowing = await User.find({
      where: { id: idFollowing }
    });

    if (userFollowing.length === 0) {
      return res.send({
        message: "user id will following not found"
      });
    }

    let strFollowing = userFound[0].following;

    let newFollowing = await (strFollowing
      .split(",")
      .find(x => x === idFollowing) === undefined
      ? strFollowing.concat(!!strFollowing ? "," : "").concat(idFollowing)
      : strFollowing);

    // Update
    const updatedUser = await User.update({ id: id })
      .set({
        following: newFollowing
      })
      .fetch();

    return res.send(updatedUser);
  },
  following: async (req, res) => {
    const id = req.body.id;

    if (!id) {
      return res.status(401).send({
        message: "id request"
      });
    }

    const userFound = await User.find({
      where: { id: id },
      select: ["following"]
    });

    if (userFound === undefined) {
      return res.notFound({
        message: "No members are found for this project!"
      });
    }

    // console.log(userFound);

    let strFollowing = userFound[0].following;
    let arrFollowing = !!strFollowing ? strFollowing.split(",") : [];
    const fetchUserInfo = async arrFollowing => {
      const result = arrFollowing.map(async item => {
        const itemUser = await User.find({
          where: { id: item },
          select: [
            "id",
            "bio",
            "fullName",
            "isNew",
            "isPrivate",
            "profilePictureUrl",
            "username",
            "isVerified"
          ]
        });

        // console.log(itemUser);

        // const itemRelationship =   await User.find({
        //   where: { id: id },
        //   select: ['following']
        // });

        if (itemUser !== undefined && itemUser.length > 0) {
          return {
            user: itemUser[0],
            relationship: {
              blockedByViewer: {
                state: "BLOCK_STATUS_UNBLOCKED",
                stable: true
              },
              hasBlockedViewer: {
                state: "BLOCK_STATUS_UNBLOCKED",
                stable: true
              },
              followedByViewer: {
                state: "FOLLOW_STATUS_FOLLOWING",
                stable: true
              },
              followsViewer: {
                state: null,
                stable: true
              }
            }
          };
        } else {
          return { id: item, message: "id not found" };
        }
      });

      return Promise.all(result);
    };

    fetchUserInfo(arrFollowing).then(a => res.json(a));
  }
};
