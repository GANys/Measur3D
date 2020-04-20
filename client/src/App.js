import React, { Component } from "react";

import SplitPane from "react-split-pane";

import Sidebar from "./Component/Sidebar";
import Chart from "./Component/Chart";
import ThreeScene from "./Component/ThreeScene";
import Modal from "./Component/Modal";
import Dropzone from "./Component/Dropzone";
import Alert from "@material-ui/lab/Alert";
import Collapse from '@material-ui/core/Collapse';

import Container from "@material-ui/core/container";
import { makeStyles } from "@material-ui/core/styles";
import HomeRoundedIcon from "@material-ui/icons/HomeRounded";
import SettingsRoundedIcon from "@material-ui/icons/SettingsRounded";
import GitHubIcon from "@material-ui/icons/GitHub";

// eslint-disable-next-line
import styles from "./App.css";

const items = [
  "divider",
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
    this.showError = this.showError.bind();
    this.showModal = this.showModal.bind();
    this.useStyles = this.useStyles.bind();
  }

  state = {
    show: false,
    modal: ["", ""],
    errorMessage: "",
    successMessage: "",
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
          </Collapse>
        </div>
        <React.Fragment>
          <SplitPane split="vertical" minSize={200} defaultSize="15%">
            <div className="sidebar">
              <SplitPane split="horizontal">
                <Dropzone
                  showError={this.showError}
                  showSuccess={this.showSuccess}
                />
                <Sidebar
                  items={items}
                  depthStep={12}
                  depth={0}
                  showModal={this.showModal}
                />
              </SplitPane>
            </div>
            <SplitPane
              split="horizontal"
              minSize={200}
              defaultSize="20%"
              primary="second"
            >
              <ThreeScene />
              <Chart onClick={this.showError} />
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
