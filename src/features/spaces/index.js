import React from "react";
import { useSelector } from "react-redux";

import { makeStyles, withStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Avatar from "@material-ui/core/Avatar";

import Rating from "@material-ui/lab/Rating";
import StarsIcon from "@material-ui/icons/Stars";
import SportsEsportsIcon from "@material-ui/icons/SportsEsports";

import { selectSpaceNums, selectSpaceByNum } from "./spaceSlice";

// ========================================

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

function Row({ num }) {
  const classes = useStyles();

  const space = useSelector((state) => selectSpaceByNum(state, num));
  const { name, type, ownedBy, level, suite } = space;
  let levelComponent;
  let owner;

  let backgroundColor = rowColor[type];

  switch (type) {
    case "building":
      levelComponent = <Rating max={3} value={level} readOnly />;
      owner = ownedBy || "N/A";
      backgroundColor = rowColor["building"][suite];
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
      owner = ownedBy || "team 1";
      break;
    default:
      break;
  }

  return (
    <TableRow key={num} style={{ backgroundColor }}>
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
