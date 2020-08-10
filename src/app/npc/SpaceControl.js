import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import Typography from "@material-ui/core/Typography";

import { selectSpaceByNum } from "../../features/spaces/spaceSlice";
import { selectSessionSpaces } from "../../features/session/sessionSlice";
import NoPermission from "../NoPermission";

// ========================================

export default function SpaceControl() {
  const spaceId = Number(useParams().spaceId);
  const spaces = useSelector(selectSessionSpaces);

  const space = useSelector((state) => selectSpaceByNum(state, spaceId));

  if (!spaces.includes(spaceId)) {
    return <NoPermission />;
  }

  return space ? (
    <div style={{ marginTop: "20px" }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Space Control {spaceId}
      </Typography>
    </div>
  ) : (
    <div style={{ marginTop: "20px" }}>
      <Typography variant="h5" component="h2" gutterBottom>
        No Such Space
      </Typography>
    </div>
  );
}
