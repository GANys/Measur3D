import React from "react";
import ReactDOM from "react-dom";
import AppRoute from "./PagesComponent/AppRoute";
import * as serviceWorker from "./PagesComponent/serviceWorker";

// eslint-disable-next-line
import styles from "./index.css"

ReactDOM.render(
  <AppRoute />,
  document.getElementById("root")
);

serviceWorker.unregister(); // Might be useful in order to perform actions in offline mode
