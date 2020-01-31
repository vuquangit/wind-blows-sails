module.exports = {
  relationship: async (ownerId, viewerId) => {
    if (!ownerId)
      return {
        message: "owner ID request"
      };

    if (!viewerId)
      return {
        message: "viewer ID request"
      };

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

    if (ownerId === viewerId) return relationshipDefault;

    const ownerFound = await User.findOne({
      where: { id: ownerId },
      select: ["id"]
    })
      .populate("blockedId", { where: { id: viewerId } })
      .populate("following", { where: { id: viewerId } });

    const viewerFound = await User.findOne({
      where: { id: viewerId },
      select: ["id"]
    })
      .populate("blockedId", { where: { id: ownerId } })
      .populate("following", { where: { id: ownerId } });

    // console.log("owner ID", ownerId);
    // console.log("viewer ID", viewerId);
    // console.log("ownerFound", ownerFound);
    // console.log("viewerFound", viewerFound);

    if (viewerFound === undefined || ownerFound === undefined)
      return relationshipDefault;

    const relationship = {
      blockedByViewer: {
        state:
          viewerFound.blockedId == undefined || viewerFound.blockedId.length
            ? "BLOCK_STATUS_UNBLOCKED"
            : "BLOCK_STATUS_BLOCKED",
        stable: true
      },
      hasBlockedViewer: {
        state:
          ownerId.blockedId === undefined || ownerId.blockedId.length
            ? "BLOCK_STATUS_UNBLOCKED"
            : "BLOCK_STATUS_BLOCKED",
        stable: true
      },
      followedByViewer: {
        state:
          viewerFound.following === undefined || !viewerFound.following.length
            ? "FOLLOW_STATUS_NOT_FOLLOWING"
            : "FOLLOW_STATUS_FOLLOWING",
        stable: true
      },
      followsViewer: {
        state:
          ownerFound.following === undefined || !ownerFound.following.length
            ? "FOLLOW_STATUS_NOT_FOLLOWING"
            : "FOLLOW_STATUS_FOLLOWING",
        stable: true
      }
    };

    return relationship;
  }
};
