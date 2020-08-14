import React from "react";
import { useSelector } from "react-redux";

import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Avatar from "@material-ui/core/Avatar";

import { selectPlayerIds, selectPlayerById } from "./playerSlice";

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
    backgroundColor: "#5d5757",
    "& > *": {
      color: "white",
    },
  },
  tablerow: {
    backgroundColor: "white",
  },
  rank: {
    padding: "8px 0 8px 3px",
  },
  rank1: {
    backgroundColor: "#ffca00",
    color: "white",
    fontWeight: "bold",
  },
  rank2: {
    backgroundColor: "#b5b4b4",
    color: "white",
    fontWeight: "bold",
  },
  rank3: {
    backgroundColor: "#cc5700",
    color: "white",
    fontWeight: "bold",
  },
  rankOther: {
    backgroundColor: "#f99090",
    color: "white",
    fontWeight: "bold",
  },
});

// ========================================

function Row({ id, rank }) {
  const classes = useStyles();

  const player = useSelector((state) => selectPlayerById(state, id));
  const { name, money, score, occupation } = player;

  let avatarClassName;
  switch (rank) {
    case 1:
      avatarClassName = classes.rank1;
      break;
    case 2:
      avatarClassName = classes.rank2;
      break;
    case 3:
      avatarClassName = classes.rank3;
      break;
    default:
      avatarClassName = classes.rankOther;
  }

  return (
    <TableRow className={classes.tablerow}>
      <TableCell align="center" padding="none" className={classes.rank}>
        <Avatar className={avatarClassName}>{rank}</Avatar>
      </TableCell>
      <TableCell align="center" padding="none">
        {name}
      </TableCell>
      <TableCell align="center" padding="none">
        {occupation || "N/A"}
      </TableCell>
      <TableCell align="center" padding="none">
        {money}
      </TableCell>
      <TableCell align="center" padding="none">
        {score}
      </TableCell>
    </TableRow>
  );
}

export default function SpacesList() {
  const classes = useStyles();
  const playerIds = useSelector(selectPlayerIds);

  return (
    <Paper className={classes.root}>
      <TableContainer className={classes.container}>
        <Table aria-label="table">
          <TableHead>
            <TableRow className={classes.tablehead}>
              <TableCell align="center" padding="none"></TableCell>
              <TableCell align="center" padding="none">
                <b>名稱</b>
              </TableCell>
              <TableCell align="center" padding="none">
                <b>職業</b>
              </TableCell>
              <TableCell align="center" padding="none">
                <b>金錢</b>
              </TableCell>
              <TableCell align="center" padding="none">
                <b>分數</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {playerIds.map((id, index) => (
              <Row key={id} id={id} rank={index + 1} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
