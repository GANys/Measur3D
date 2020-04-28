import React, { Component } from "react";

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

import { makeStyles } from "@material-ui/core/styles";
import HomeRoundedIcon from "@material-ui/icons/HomeRounded";
import SettingsRoundedIcon from "@material-ui/icons/SettingsRounded";
import GitHubIcon from "@material-ui/icons/GitHub";

import { EventEmitter } from "./Component/events";

import logo from "./logo-geomatics.png";

// eslint-disable-next-line
import styles from "./App.css";

const items = [
  { name: "home", label: "Home", content: "modal_home", Icon: HomeRoundedIcon },
  {
    name: "props",
    label: "Properties",
    content: "modal_properties",
    Icon: SettingsRoundedIcon
  },
  "divider",
  {
    name: "github",
    label: "GitHub",
    content: "modal_github",
    Icon: GitHubIcon
  }
];

class App extends Component {
  constructor() {
    super();

    this.showError = this.showError.bind();
    this.showSuccess = this.showSuccess.bind();
    this.showInfo = this.showInfo.bind();
    this.showModal = this.showModal.bind();
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
      console.log("Clicked on " + label + " " + content);

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
    const classes = this.useStyles;

    return (
      <Container>
        <div className={classes.root}>
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
        </div>
        <React.Fragment>
          <SplitPane
            split="vertical"
            minSize={200}
            maxSize={500}
            defaultSize="20%"
          >
            <div className="sidebar">
              <SplitPane split="horizontal">
                <img src={logo} className="logo" alt="Logo" />
                <SplitPane split="horizontal" minSize={100} defaultSize={100}>
                  <Dropzone minSize={100} defaultSize={100}/>
                  <SplitPane split="horizontal" minSize={150} defaultSize={150}>
                    <Sidebar items={items} showModal={this.showModal} />
                    <div className="AttributeManager">
                    <Table />
                    </div>
                  </SplitPane>
                </SplitPane>
              </SplitPane>
            </div>
            <SplitPane split="horizontal" defaultSize="25%" primary="second">
            <div id="ThreeScene">
              <ThreeScene />
              </div>
              <Chart />
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
      </Container>
    );
  }
}

export default App;
