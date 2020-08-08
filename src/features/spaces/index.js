import React, { useState } from "react";
import { useSelector } from "react-redux";

import {
  makeStyles,
  withStyles,
  createMuiTheme,
} from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Avatar from "@material-ui/core/Avatar";

import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";

import Rating from "@material-ui/lab/Rating";
import StarsIcon from "@material-ui/icons/Stars";
import SportsEsportsIcon from "@material-ui/icons/SportsEsports";

import { selectSpaceNums, selectSpaceByNum } from "./spaceSlice";

// ========================================

const theme = createMuiTheme({
  spacing: 4,
});

const useStyles = makeStyles({
  root: {
    width: "100%",
    height: "100%",
    padding: 15,
    backgroundColor: "#e0e0e0",
  },
  container: {
    maxHeight: "calc(100%)",
    overflow: "scroll",
  },
  tablehead: {
    backgroundColor: "black",
    "& > *": {
      color: "white",
    },
  },
  num: {
    backgroundColor: "#ab1010",
    color: "white",
  },
  dialogTitle: {
    padding: theme.spacing(3),
  },
  closeButton: {
    position: "absolute",
    padding: theme.spacing(3),
    right: 0,
    top: 0,
  },
  dialogContent: {
    padding: theme.spacing(3),
  },
});

const rowColor = {
  Go: "#49d849",
  chance: "#e856dc",
  fate: "#d05a5a",
  prison: "#aaa",
  event: "#43d2ea",
  store: "rgb(195, 195, 65)",
  game: "rgb(199, 159, 81)",
  building: {
    1: "rgb(255, 108, 108)",
    2: "#ff9c02",
    3: "#ffff00",
    4: "#a7f742",
    5: "#42d4f7",
    6: "#ab42f7",
  },
  "special-building": "#ff00a2",
};

const GameRating = withStyles({
  iconFilled: {
    color: "#0eed0c",
  },
})(Rating);

// ========================================

const spaceDetail = (space) => {
  const {
    type,
    ownedBy,
    level,
    suite,
    shouldDouble,
    costs,
    taxes,
    multiple,
    highestScore,
  } = space;

  let levelComponent;
  let owner;
  let backgroundColor = rowColor[type];
  let dialogContent = {};

  switch (type) {
    case "building":
      levelComponent = <Rating max={3} value={level} readOnly />;
      owner = ownedBy || "N/A";
      backgroundColor = rowColor["building"][suite];
      dialogContent = {
        種類: "房產格",
        系列: suite,
        目前等級: level,
        擁有者: owner,
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
      break;
    case "special-building":
      levelComponent = (
        <Rating
          size="large"
          max={1}
          value={ownedBy ? 1 : 0}
          icon={<StarsIcon fontSize="inherit" />}
          readOnly
        />
      );
      owner = ownedBy || "N/A";
      dialogContent = {
        種類: "特殊房產格",
        擁有者: owner,
        購買價格: costs[0],
        目前租金: multiple * taxes[0],
        擁有棟數: multiple,
        單棟租金: taxes[0],
        租金計算: "(擁有棟數) x (單棟租金)",
      };
      break;
    case "game":
      levelComponent = (
        <GameRating
          size="large"
          max={1}
          value={ownedBy ? 1 : 0}
          icon={<SportsEsportsIcon fontSize="inherit" />}
          readOnly
        />
      );
      owner = ownedBy || "N/A";
      dialogContent = {
        種類: "遊戲格",
        擁有者: owner,
        價值: costs[0],
        目前最高分: highestScore,
      };
      break;
    case "Go":
      dialogContent = {
        種類: "Go格",
        目前經過獲得金錢: costs[0],
      };
      break;
    case "chance":
      dialogContent = {
        種類: "機會",
      };
      break;
    case "fate":
      dialogContent = {
        種類: "命運",
      };
      break;
    case "prison":
      dialogContent = {
        種類: "監獄",
      };
      break;
    case "event":
      dialogContent = {
        種類: "事件格",
      };
      break;
    case "store":
      dialogContent = {
        種類: "商店",
      };
      break;
    default:
      console.error(`Invalid space type: ${type}`);
      break;
  }

  return { levelComponent, owner, backgroundColor, dialogContent };
};

function Row({ num }) {
  const classes = useStyles();

  // Dialog control
  const [isOpen, setIsOpen] = useState(false);
  const handleClickOpen = () => {
    setIsOpen(true);
  };
  const handleClose = () => {
    setIsOpen(false);
  };

  // Space extra attributes
  const space = useSelector((state) => selectSpaceByNum(state, num));
  const { name } = space;
  const { levelComponent, owner, backgroundColor, dialogContent } = spaceDetail(
    space
  );

  return (
    <>
      <TableRow key={num} style={{ backgroundColor }} onClick={handleClickOpen}>
        <TableCell align="center" padding="none">
          <Avatar className={classes.num}>{num}</Avatar>
        </TableCell>
        <TableCell align="center" padding="none">
          {name}
        </TableCell>
        <TableCell align="center" padding="none">
          {owner}
        </TableCell>
        <TableCell align="center" padding="none">
          {levelComponent}
        </TableCell>
      </TableRow>
      <Dialog
        aria-label="dialog"
        open={isOpen}
        fullWidth
        maxWidth="xs"
        onClose={handleClose}
      >
        <DialogTitle className={classes.dialogTitle}>
          <b>{name}</b>
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className={classes.dialogContent}>
          {Object.entries(dialogContent).map(([key, value]) => (
            <div key={key}>
              <b>{key}: </b>
              {value}
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function SpacesList() {
  const classes = useStyles();
  const spaceNums = useSelector(selectSpaceNums);

  return (
    <Paper className={classes.root}>
      <TableContainer className={classes.container}>
        <Table size="small" aria-label="table">
          <TableHead>
            <TableRow className={classes.tablehead}>
              <TableCell align="center" padding="none"></TableCell>
              <TableCell align="center" padding="none">
                Name
              </TableCell>
              <TableCell align="center" padding="none">
                Owner
              </TableCell>
              <TableCell align="center" padding="none">
                Level
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {spaceNums.map((num) => (
              <Row key={num} num={num} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}