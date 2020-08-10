import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";

import { selectSpaceByNum } from "../../features/spaces/spaceSlice";
import { selectSessionSpaces } from "../../features/session/sessionSlice";
import NoPermission from "../NoPermission";

import MoneyControl from "../admin/MoneyControl";

// ========================================

const WrappedTypography = ({ text }) => (
  <div style={{ marginTop: "20px" }}>
    <Typography variant="h5" component="h2" gutterBottom>
      {text}
    </Typography>
  </div>
);

// ========================================

export default function SpaceControl() {
  const spaceId = Number(useParams().spaceId);
  const spaces = useSelector(selectSessionSpaces);

  const space = useSelector((state) => selectSpaceByNum(state, spaceId));

  if (!space) {
    return <WrappedTypography text="No Such Space" />;
  }
  if (!spaces.includes(spaceId)) {
    return <NoPermission />;
  }

  // ========================================

  let component;
  const { type, name } = space;
  switch (type) {
    case "building":
      // TODO
      break;
    case "special-building":
      // TODO
      break;
    case "game":
      // TODO
      break;
    case "Go":
      // TODO
      break;
    case "chance":
      component = <MoneyControl />;
      break;
    case "fate":
      component = <MoneyControl />;
      break;
    case "see-prison":
      break;
    case "go-prison":
      break;
    case "event":
      // TODO
      break;
    case "store":
      component = <MoneyControl />;
      break;
    default:
      console.error(`Invalid space type: ${type}`);
      break;
  }

  // ========================================

  return (
    <div>
      <WrappedTypography text={name} />
      <Divider />
      {component}
    </div>
  );
}
