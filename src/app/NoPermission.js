import React from "react";
import Typography from "@material-ui/core/Typography";

export default function NoPermission() {
  return (
    <div style={{ marginTop: "20px" }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Permission Denied
      </Typography>
    </div>
  );
}
