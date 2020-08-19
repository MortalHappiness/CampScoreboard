import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";

import { selectSpaceByNum } from "../../features/spaces/spaceSlice";
import {
  selectSessionName,
  selectSessionSpaces,
} from "../../features/session/sessionSlice";
import NoPermission from "../NoPermission";

import MoneyControl from "../control/MoneyControl";
import UpdateHighestScore from "../control/UpdateHighestScore";
import ChangeOwner from "../control/ChangeOwner";
import RobCard from "../control/RobCard";
import GiveGoMoney from "../control/GiveGoMoney";
import BuySpace from "../control/BuySpace";
import UpgradeSpace from "../control/UpgradeSpace";
import TaxSomeone from "../control/TaxSomeone";
import TriggerEvent from "../control/TriggerEvent";
import DestroySpace from "../control/DestroySpace";

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

  const userName = useSelector(selectSessionName);

  const spaceId = Number(useParams().spaceId);
  const spaces = useSelector(selectSessionSpaces);

  const space = useSelector((state) => selectSpaceByNum(state, spaceId));

  if (!space) {
    return <WrappedTypography text="No Such Space" />;
  }
  if (userName !== "admin" && !spaces.includes(spaceId)) {
    return <NoPermission />;
  }

  // ========================================

  let component, information;
  const {
    type,
    name,
    num,
    ownedBy,
    costs,
    taxes,
    level,
    suite,
    highestScore,
    multiple,
    shouldDouble,
  } = space;

  switch (type) {
    case "building":
      // TODO
      information = {
        種類: "房產格",
        系列: suite,
        目前等級: level,
        擁有者: ownedBy || "N/A",
        目前租金:
          level && (shouldDouble ? 2 * taxes[level - 1] : taxes[level - 1]),
        租金加倍: String(shouldDouble),
        購買價格: costs[0],
        "1星升2星價格": costs[1],
        "2星升3星價格": costs[2],
        "1星租金": taxes[0],
        "2星租金": taxes[1],
        "3星租金": taxes[2],
      };
      component = (
        <>
          <Information data={information} />
          <Divider />
          <BuySpace spaceNum={num} disabled={Boolean(ownedBy)} />
          <Divider />
          <UpgradeSpace spaceNum={num} disabled={!Boolean(ownedBy)} />
          <Divider />
          <TaxSomeone spaceNum={num} disabled={!Boolean(ownedBy)} />
          <Divider />
          {/*
          <ChangeOwner spaceNum={num} disabled={true} />
          <Divider />
          */}
          <RobCard spaceNum={num} disabled={!Boolean(ownedBy)} />
          <Divider />
          <DestroySpace spaceNum={num} disabled={!Boolean(ownedBy)} />
        </>
      );
      break;
    case "special-building":
      // TODO
      information = {
        種類: "特殊房產格",
        擁有者: ownedBy || "N/A",
        購買價格: costs[0],
        目前租金: multiple * taxes[0],
        擁有棟數: multiple,
        單棟租金: taxes[0],
        租金計算: "(擁有棟數) x (單棟租金)",
      };
      component = (
        <>
          <Information data={information} />
          <Divider />
          <BuySpace spaceNum={num} disabled={Boolean(ownedBy)} />
          <Divider />
          <TaxSomeone spaceNum={num} disabled={!Boolean(ownedBy)} />
          <Divider />
          {/*
          <ChangeOwner spaceNum={num} disabled={true} />
          <Divider />
          */}
          <RobCard spaceNum={num} disabled={!Boolean(ownedBy)} />
          <Divider />
          <DestroySpace spaceNum={num} disabled={!Boolean(ownedBy)} />
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
          <Divider />
          <TriggerEvent />
        </>
      );
      break;
    case "see-prison":
      component = (
        <>
          <div className={classes.section}>
            <b>種類: </b>探監
          </div>
          <Divider />
          <GiveGoMoney />
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
      component = (
        <>
          <div className={classes.section}>
            <b>種類: </b>事件格
            <Divider />
            <TriggerEvent />
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
