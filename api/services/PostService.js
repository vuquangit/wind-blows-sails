module.exports = {
  post: async (postId, viewerId) => {
    const postFound = await Posts.findOne({
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
      .populate("commentsId");

    if (postFound === undefined) {
      return {};
    } else {
      // get realationship
      const ownerId = postFound.ownerId[0].id;
      const getRelationship = async () =>
        await FollowService.relationship(ownerId, viewerId);

      // data response
      const data = await getRelationship().then(relationship => {
        const postData = {
          id: postFound.id,
          caption: postFound.caption,
          captionIsEdited: postFound.captionIsEdited,
          commentsDisabled: postFound.commentsDisabled,
          location: postFound.location,
          postAt: postFound.createdAt,
          owner: postFound.ownerId[0],
          sidecarChildren: postFound.sidecarChildren,
          likedByViewer: _.find(postFound.likeId, o => o.userId === viewerId)
            ? true
            : false,
          savedByViewer: postFound.savedId.length > 0,
          numLikes: postFound.likeId.length,
          numComments: postFound.commentsId.length,
          relationship: relationship
        };

        return postData;
      });

      return data;
    }
  }
};
