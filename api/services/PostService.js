module.exports = {
  post: async (postId, viewerId, cb) => {
    return await Posts.findOne({
      where: { id: postId }
    })
      .populate("ownerId", {
        select: [
          "id",
          "fullName",
          "isNew",
          "isPrivate",
          "profilePictureUrl",
          "username",
          "isUnpublished",
          "isVerified"
        ]
      })
      .populate("likeId")
      .populate("savedId", {
        where: {
          ownerId: viewerId
        }
      })
      .populate("commentsId")
      .exec((err, result) => {
        if (err) {
          cb(err);
        }

        if (!result) {
          cb({ message: "Post ID not found" });
        } else {
          // get realationship
          const ownerId = result.ownerId[0].id;
          const getRelationship = async () =>
            await FollowService.relationship(ownerId, viewerId);

          // data response
          getRelationship().then(relationship => {
            const { post } = {
              post: {
                id: result.id,
                caption: result.caption,
                captionIsEdited: result.captionIsEdited,
                commentsDisabled: result.commentsDisabled,
                postAt: result.createdAt,
                owner: result.ownerId[0],
                sidecarChildren: result.sidecarChildren,

                likedByViewer:
                  _.find(result.likeId, ["id", viewerId]) !== undefined,
                savedByViewer: result.savedId.length > 0,
                numLikes: result.likeId.length,
                numComments: result.commentsId.length,

                relationship: relationship
              }
            };

            const data = {
              post,
              owner: result.ownerId[0],
              relationship,
              likedByViewer:
                _.find(result.likeId, ["id", viewerId]) !== undefined,
              savedByViewer: result.savedId.length > 0
            };

            cb(null, data);
          });
        }
      });
  }
};
