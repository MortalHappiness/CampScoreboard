import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import Typography from "@material-ui/core/Typography";

import { selectSpaceByNum } from "../../features/spaces/spaceSlice";

// ========================================

export default function SpaceControl() {
  const { spaceId } = useParams();

  const space = useSelector((state) => selectSpaceByNum(state, spaceId));

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
