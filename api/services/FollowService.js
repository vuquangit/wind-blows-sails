module.exports = {
  relationship: async (ownerId, viewerId) => {
    if (!ownerId)
      return {
        message: "owner ID request"
      };

    // if (!viewerId)
    //   return {
    //     message: "viewer ID request"
    //   };

    const relationshipDefault = {
      blockedByViewer: {
        state: "BLOCK_STATUS_UNBLOCKED",
        stable: true
      },
      hasBlockedViewer: {
        state: "BLOCK_STATUS_UNBLOCKED",
        stable: true
      },
      followedByViewer: {
        state: "FOLLOW_STATUS_NOT_FOLLOWING",
        stable: true
      },
      followsViewer: {
        state: "FOLLOW_STATUS_NOT_FOLLOWING",
        stable: true
      }
    };

    if (!viewerId || ownerId === viewerId) return relationshipDefault;

    const ownerFound = await User.findOne({
      where: { id: ownerId },
      select: ["id"]
    })
      .populate("blockedId", { where: { blockId: viewerId } })
      .populate("following", { where: { id: viewerId } })
      .populate("followingRequest", { where: { id: viewerId } });

    const viewerFound = await User.findOne({
      where: { id: viewerId },
      select: ["id"]
    })
      .populate("blockedId", { where: { blockId: ownerId } })
      .populate("following", { where: { id: ownerId } })
      .populate("followingRequest", { where: { id: ownerId } });

    console.log(ownerFound, viewerFound);

    if (viewerFound === undefined || ownerFound === undefined)
      return relationshipDefault;

    const relationship = {
      blockedByViewer: {
        state:
          viewerFound.blockedId !== undefined &&
          viewerFound.blockedId.length > 0
            ? "BLOCK_STATUS_BLOCKED"
            : "BLOCK_STATUS_UNBLOCKED",
        stable: true
      },
      hasBlockedViewer: {
        state:
          ownerFound.blockedId !== undefined && ownerFound.blockedId.length > 0
            ? "BLOCK_STATUS_BLOCKED"
            : "BLOCK_STATUS_UNBLOCKED",
        stable: true
      },
      followedByViewer: {
        state:
          viewerFound.following !== undefined &&
          viewerFound.following.length > 0
            ? "FOLLOW_STATUS_FOLLOWING"
            : viewerFound.followingRequest !== undefined &&
              viewerFound.followingRequest.length > 0
            ? "FOLLOW_STATUS_PRIVATE_REQUESTED"
            : "FOLLOW_STATUS_NOT_FOLLOWING",
        stable: true
      },
      followsViewer: {
        state:
          ownerFound.following !== undefined && ownerFound.following.length > 0
            ? "FOLLOW_STATUS_FOLLOWING"
            : ownerFound.followingRequest !== undefined &&
              ownerFound.followingRequest.length > 0
            ? "FOLLOW_STATUS_PRIVATE_REQUESTED"
            : "FOLLOW_STATUS_NOT_FOLLOWING",
        stable: true
      }
    };

    return relationship;
  }
};
