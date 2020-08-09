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

import { selectPlayerIds, selectPlayerById } from "./playerSlice";

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

// ========================================

function Row({ id, rank }) {
  const classes = useStyles();

  const player = useSelector((state) => selectPlayerById(state, id));
  const { name, money, score, occupation } = player;

  return (
    <TableRow>
      <TableCell align="center" padding="none">
        <Avatar className={classes.num}>{rank}</Avatar>
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
        <Table size="small" aria-label="table">
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
