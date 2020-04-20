import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

// eslint-disable-next-line
import styles from "./index.css"

ReactDOM.render(
  <App />,
  document.getElementById("root")
);

serviceWorker.unregister(); // Might be useful in order to perform actions in offline mode
