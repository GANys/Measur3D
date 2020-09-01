import React, { Component } from "react";
import axios from "axios";

import SplitPane from "react-split-pane";

import Sidebar from "./Component/Sidebar";
import Chart from "./Component/Chart";
import ThreeScene from "./Component/ThreeScene";
import Modal from "./Component/Modal";
import Dropzone from "./Component/Dropzone";
import Table from "./Component/Attributes_Manager";
import Alert from "@material-ui/lab/Alert";
import Collapse from "@material-ui/core/Collapse";
import Container from "@material-ui/core/Container";

import CityPicker from "./Component/CityPicker";

import { makeStyles } from "@material-ui/core/styles";
import HomeRoundedIcon from "@material-ui/icons/HomeRounded";
import LocationCityRoundedIcon from "@material-ui/icons/LocationCityRounded";
import SettingsRoundedIcon from "@material-ui/icons/SettingsRounded";
import GitHubIcon from "@material-ui/icons/GitHub";

import { EventEmitter } from "./Component/events";

import logo_ugeom from "./logo_geomatics.png";
import logo_app from "./logo_app_white.png";

// eslint-disable-next-line
import styles from "./App.css";

const items = [
  "divider",
  { name: "home", label: "Home", content: "modal_home", Icon: HomeRoundedIcon },
  { name: "models", label: "City Models", content: "modal_models", Icon: LocationCityRoundedIcon },
  {
    name: "github",
    label: "GitHub",
    content: "modal_github",
    Icon: GitHubIcon
  },
  "divider",
  {
    name: "export",
    label: "Export model",
    content: "modal_export",
    Icon: SettingsRoundedIcon
  }
];

class App extends Component {
  constructor() {
    super();

    this.showSuccess = this.showSuccess.bind();
    this.showInfo = this.showInfo.bind();
    this.showModal = this.showModal.bind();

    this.showError = this.debounce(this.showError.bind(this), 3000);

    this.useStyles = this.useStyles.bind();

    this.uploadFile = this.uploadFile.bind();

    EventEmitter.subscribe("error", event => this.showError(event));
    EventEmitter.subscribe("success", event => this.showSuccess(event));
    EventEmitter.subscribe("info", event => this.showInfo(event));
  }

  state = {
    show: false,
    modal: ["", ""],
    errorMessage: "",
    successMessage: "",
    infoMessage: "",
    showingAlert: false
  };

  debounce = (func, delay) => {
    let debounceTimer;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  };

  showError = err => {
    this.setState({
      errorMessage: err,
      showingAlert: true
    });

    setTimeout(() => {
      this.setState({
        showingAlert: false
      });
    }, 3000);
  };

  showSuccess = msg => {
    this.setState({
      successMessage: msg,
      showingAlert: true
    });

    setTimeout(() => {
      this.setState({
        showingAlert: false
      });
    }, 3000);
  };

  showInfo = msg => {
    this.setState({
      infoMessage: msg,
      showingAlert: true
    });

    setTimeout(() => {
      this.setState({
        showingAlert: false
      });
    }, 3000);
  };

  showModal = (label, content) => {
    // eslint-disable-next-line
    if (this.state.show == false) {
      this.setState({
        modal: [label, content]
      });
    }

    this.setState({
      show: !this.state.show
    });
  };

  useStyles = makeStyles(theme => ({
    root: {
      width: "100%",
      "& > * + *": {
        marginTop: theme.spacing(2)
      }
    }
  }));

  uploadFile = file => {
    this.setState({ file: file });
  };

  render() {
    return (
      <Container>
        <React.Fragment>
          <SplitPane split="vertical">
            <SplitPane split="horizontal">
              <img src={logo_app} className="logo_app" alt="logo_app" />
              <SplitPane split="horizontal">
                <Dropzone />
                <SplitPane split="horizontal">
                  <Sidebar items={items} showModal={this.showModal} />
                  <div className="AttributeManager">
                    <Table />
                  </div>
                </SplitPane>
              </SplitPane>
            </SplitPane>
            <SplitPane split="horizontal" primary="second">
              <div id="ThreeScene">
                <a href="http://geomatics.ulg.ac.be/home.php" rel="noopener">
                  <img
                    src={logo_ugeom}
                    className="logo_ugeom"
                    alt="logo_ugeom"
                  />
                </a>
                <ThreeScene />
              </div>
              <SplitPane split="vertical">
                <Chart />
                <Chart />
              </SplitPane>
            </SplitPane>
          </SplitPane>
          <Modal
            onClose={this.showModal}
            show={this.state.show}
            onClickOutside={this.showModal}
          >
            {this.state.modal}
          </Modal>
        </React.Fragment>
        <Collapse in={this.state.showingAlert}>
          {this.state.errorMessage && this.state.showingAlert ? (
            <Alert className="Alert" severity="error">
              {this.state.errorMessage}
            </Alert>
          ) : null}
          {this.state.successMessage && this.state.showingAlert ? (
            <Alert className="Alert" severity="success">
              {this.state.successMessage}
            </Alert>
          ) : null}
          {this.state.infoMessage && this.state.showingAlert ? (
            <Alert className="Alert" severity="info">
              {this.state.infoMessage}
            </Alert>
          ) : null}
        </Collapse>
      </Container>
    );
  }
}

axios.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response.status === 429) {
        EventEmitter.dispatch("error", error.response.data);
    }
    return Promise.reject(error.message);
});

export default App;
