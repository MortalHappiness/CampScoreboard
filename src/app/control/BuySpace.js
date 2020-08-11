import React, { useState, useEffect, useRef, useCallback } from "react";

import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import FormHelperText from "@material-ui/core/FormHelperText";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import NativeSelect from "@material-ui/core/NativeSelect";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import Divider from "@material-ui/core/Divider";

import Loading from "../Loading";

// ========================================

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(4),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  errorMsg: {
    textAlign: "center",
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  dialogTitle: {
    textAlign: "center",
  },
}));

export default function BuySpace({ spaceNum, disabled }) {
  const classes = useStyles();
  const [players, setPlayers] = useState(null);

  // Fetch players ids and names
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/players");
      setPlayers(await res.json());
    };

    fetchData();
  }, []);

  // ========================================

  // Handle input fields
  const [state, setState] = React.useState({
    team: "",
  });

  const handleChange = (e) => {
    const name = e.target.name;
    setState({
      ...state,
      [name]: e.target.value,
    });
  };

  // ========================================
  // Dialog control (Success dialog)
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const handleDialogClose = () => {
    setDialogIsOpen(false);
  };

  // ========================================

  // Handle submit
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  // set isMounted to false when we unmount the component
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSending) return;
      setIsSending(true);
      try {
        const res = await fetch("/api/buy", {
          method: "PUT",
          body: JSON.stringify({
            playerId: Number(state.team),
            spaceNum,
          }),
          headers: {
            "content-type": "application/json",
          },
        });
        if (res.ok) {
          setDialogIsOpen(true);
        } else {
          let json;
          try {
            json = await res.json();
          } catch (e) {
            throw new Error("Invalid format");
          }
          throw new Error(json.message);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        if (isMounted.current) setIsSending(false);
        setState({ ...state, moneyChange: "" });
      }
    },
    [isSending, spaceNum, state]
  );

  // ========================================

  return players ? (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Typography component="h1" variant="h5">
          Buy This Space
        </Typography>
        <form className={classes.form} onSubmit={handleSubmit}>
          <FormControl
            className={classes.formControl}
            margin="normal"
            required
            fullWidth
            disabled={disabled}
            error={Boolean(error)}
          >
            <InputLabel htmlFor="team">Team</InputLabel>
            <NativeSelect
              value={state.team}
              onChange={handleChange}
              inputProps={{
                name: "team",
                id: "team",
              }}
            >
              <option aria-label="None" value="" />
              {players.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </NativeSelect>
          </FormControl>
          <FormHelperText error={Boolean(error)} className={classes.errorMsg}>
            {error}
          </FormHelperText>
          <Button
            type="submit"
            disabled={disabled || isSending}
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
          >
            Enter
          </Button>
        </form>
      </div>
      <Dialog
        aria-label="dialog"
        open={dialogIsOpen}
        fullWidth
        maxWidth="xs"
        onClose={handleDialogClose}
      >
        <DialogTitle className={classes.dialogTitle}>
          <b>Success!</b>
        </DialogTitle>
        <Divider />
        <DialogActions>
          <Button
            autoFocus
            fullWidth
            onClick={handleDialogClose}
            color="primary"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  ) : (
    <Loading />
  );
}
