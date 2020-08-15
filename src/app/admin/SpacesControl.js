import React from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import NativeSelect from "@material-ui/core/NativeSelect";

import { selectSpaceNums } from "../../features/spaces/spaceSlice";

// ========================================

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));

export default function SpacesControl() {
  const classes = useStyles();
  const history = useHistory();

  const spaceNums = useSelector(selectSpaceNums);

  // ========================================

  // Handle input fields
  const [state, setState] = React.useState({
    space: "",
  });

  const handleChange = (e) => {
    const name = e.target.name;
    setState({
      ...state,
      [name]: e.target.value,
    });
  };

  // ========================================

  const handleSubmit = () => {
    history.push(`/npc/space-control/${state.space}`);
  };

  // ========================================

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Typography variant="h5" component="h1">
          Spaces Control
        </Typography>
        <form className={classes.form} onSubmit={handleSubmit}>
          <FormControl
            className={classes.formControl}
            margin="normal"
            required
            fullWidth
          >
            <InputLabel htmlFor="space">Space Num</InputLabel>
            <NativeSelect
              value={state.space}
              onChange={handleChange}
              inputProps={{
                name: "space",
                id: "space",
              }}
            >
              <option aria-label="None" value="" />
              {spaceNums.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </NativeSelect>
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
          >
            Enter
          </Button>
        </form>
      </div>
    </Container>
  );
}
