import React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";

export default function Loading() {
  return (
    <div style={{ marginTop: "20px" }}>
      <CircularProgress />
    </div>
  );
}
