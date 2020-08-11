import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";

import { selectSpaceByNum } from "../../features/spaces/spaceSlice";
import { selectSessionSpaces } from "../../features/session/sessionSlice";
import NoPermission from "../NoPermission";

import MoneyControl from "../control/MoneyControl";
import UpdateHighestScore from "../control/UpdateHighestScore";
import ChangeOwner from "../control/ChangeOwner";
import GiveGoMoney from "../control/GiveGoMoney";

// ========================================

const useStyles = makeStyles({
  section: {
    margin: 15,
  },
});

// ========================================

const WrappedTypography = ({ text }) => (
  <div style={{ marginTop: "20px" }}>
    <Typography variant="h5" component="h2" gutterBottom>
      {text}
    </Typography>
  </div>
);

const Information = ({ data }) => {
  const classes = useStyles();
  return (
    <div className={classes.section}>
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <b>{key}: </b>
          {value}
        </div>
      ))}
    </div>
  );
};

// ========================================

export default function SpaceControl() {
  const classes = useStyles();

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

  let component, information;
  const { type, name, num, ownedBy, costs, taxes, level, highestScore } = space;

  switch (type) {
    case "building":
      // TODO
      component = (
        <>
          <div className={classes.section}>
            <b>種類: </b>房產格
          </div>
        </>
      );
      break;
    case "special-building":
      // TODO
      component = (
        <>
          <div className={classes.section}>
            <b>種類: </b>特殊房產格
          </div>
        </>
      );
      break;
    case "game":
      information = {
        種類: "遊戲格",
        擁有者: ownedBy || "N/A",
        價值: costs[0],
        目前最高分: highestScore,
      };
      component = (
        <>
          <Information data={information} />
          <Divider />
          <UpdateHighestScore spaceNum={num} />
          <Divider />
          <ChangeOwner spaceNum={num} />
          <Divider />
          <MoneyControl />
        </>
      );
      break;
    case "Go":
      information = {
        種類: "Go格",
        目前經過獲得金錢: costs[level],
      };
      component = (
        <>
          <Information data={information} />
          <Divider />
          <GiveGoMoney />
        </>
      );
      break;
    case "chance":
      component = (
        <>
          <div className={classes.section}>
            <b>種類: </b>機會
          </div>
          <Divider />
          <MoneyControl />
        </>
      );
      break;
    case "fate":
      component = (
        <>
          <div className={classes.section}>
            <b>種類: </b>命運
          </div>
          <Divider />
          <MoneyControl />
        </>
      );
      break;
    case "see-prison":
      component = (
        <>
          <div className={classes.section}>
            <b>種類: </b>探監
          </div>
        </>
      );
      break;
    case "go-prison":
      component = (
        <>
          <div className={classes.section}>
            <b>種類: </b>入獄
          </div>
        </>
      );
      break;
    case "event":
      // TODO
      component = (
        <>
          <div className={classes.section}>
            <b>種類: </b>事件格
          </div>
        </>
      );
      break;
    case "store":
      component = (
        <>
          <div className={classes.section}>
            <b>種類: </b>商店
          </div>
          <Divider />
          <MoneyControl />
        </>
      );
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
