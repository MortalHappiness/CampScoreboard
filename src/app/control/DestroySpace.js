import React, { useState, useEffect, useRef, useCallback } from "react";

import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import FormHelperText from "@material-ui/core/FormHelperText";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import Divider from "@material-ui/core/Divider";

// ========================================

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(4),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  errorMsg: {
    textAlign: "center",
  },
  button: {
    width: "45%",
    margin: theme.spacing(3, 0, 2),
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
  },
  dialogTitle: {
    textAlign: "center",
  },
}));

const DestroyButton = ({ spaceNum, text, disabled, setError }) => {
  const classes = useStyles();

  // ========================================
  // Dialog control (Success dialog)
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const handleDialogClose = () => {
    setDialogIsOpen(false);
  };

  // ========================================

  const [isSending, setIsSending] = useState(false);
  const isMounted = useRef(true);

  // set isMounted to false when we unmount the component
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const sendRequest = useCallback(async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/destroy", {
        method: "PUT",
        body: JSON.stringify({ spaceNum }),
        headers: {
          "content-type": "application/json",
        },
      });
      if (res.ok) {
        setDialogIsOpen(true);
      } else {
        throw new Error("Invalid format");
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (isMounted.current) setIsSending(false);
    }
  }, [isSending, setError, spaceNum]);

  return (
    <>
      <Button
        disabled={disabled || isSending}
        variant="contained"
        color="primary"
        className={classes.button}
        onClick={sendRequest}
      >
        {text}
      </Button>
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
    </>
  );
};

export default function DestroySpace({ spaceNum, disabled }) {
  const classes = useStyles();
  const [error, setError] = useState(null);

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Typography component="h1" variant="h5">
          Destroy This Space
        </Typography>
      </div>
      <div className={classes.buttonContainer}>
        <DestroyButton
          spaceNum={spaceNum}
          text="Destroy"
          disabled={disabled}
          setError={setError}
        />
      </div>
      <FormHelperText error={Boolean(error)} className={classes.errorMsg}>
        {error}
      </FormHelperText>
    </Container>
  );
}
