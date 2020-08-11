import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";

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

import { selectSpaceByNum } from "../../features/spaces/spaceSlice";

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
    justifyContent: "space-between",
  },
  dialogTitle: {
    textAlign: "center",
  },
}));

const UpgradeButton = ({ spaceNum, shouldPay, text, disabled, setError }) => {
  const classes = useStyles();

  const level = useSelector((state) => selectSpaceByNum(state, spaceNum).level);

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
      const res = await fetch("/api/upgrade", {
        method: "PUT",
        body: JSON.stringify({ spaceNum, shouldPay }),
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
    }
  }, [isSending, setError, shouldPay, spaceNum]);

  return (
    <>
      <Button
        disabled={disabled || isSending || level === 3}
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

export default function UpgradeSpace({ spaceNum, disabled }) {
  const classes = useStyles();
  const [error, setError] = useState(null);

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Typography component="h1" variant="h5">
          Upgrade This Space
        </Typography>
      </div>
      <div className={classes.buttonContainer}>
        <UpgradeButton
          spaceNum={spaceNum}
          shouldPay={true}
          text="付費升級"
          disabled={disabled}
          setError={setError}
        />
        <UpgradeButton
          spaceNum={spaceNum}
          shouldPay={false}
          text="免費升級"
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
