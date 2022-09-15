import React, { Component } from "react";
import axios from "axios";

import SplitPane from "react-split-pane";

import ThreeScene from "../Measur3DComponent/ThreeScene";
import Modal from "../Measur3DComponent/Modal";
import AttributesManager from "../Measur3DComponent/AttributesManager";
import Alert from "@material-ui/lab/Alert";
import Collapse from "@material-ui/core/Collapse";
import Container from "@material-ui/core/Container";

import { EventEmitter } from "../Measur3DComponent/events";

import logo_ugeom from "../images/logo_geomatics.png";
import logo_app from "../images/logo_app_white.png";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faBuilding,
  faArchway,
  faStoreAlt,
  faCubes,
  faCube,
  faImage,
  faLeaf,
  faTree,
  faMountain,
  faCar,
  faTrain,
  faDotCircle,
  faWater,
  faUndo
} from "@fortawesome/free-solid-svg-icons";

// eslint-disable-next-line
import styles from "./Measur3D.css";

class Measur3D extends Component {
  constructor() {
    super();

    this.showSuccess = this.showSuccess.bind();
    this.showInfo = this.showInfo.bind();
    this.showModal = this.showModal.bind();

    this.resetCamera = this.resetCamera.bind();

    this.showError = this.debounce(this.showError.bind(this), 3000);

    this.uploadFile = this.uploadFile.bind();

    EventEmitter.subscribe("error", event => this.showError(event));
    EventEmitter.subscribe("success", event => this.showSuccess(event));
    EventEmitter.subscribe("info", event => this.showInfo(event));

    EventEmitter.subscribe("showModal", event => this.showModal(event));
  }

  state = {
    show: false,
    modal_label: "",
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

  showModal = label => {

    // eslint-disable-next-line
    if (this.state.show == false) {
      this.setState({
        modal_label: label
      });
    }

    this.setState({
      show: !this.state.show
    });
  };

  uploadFile = file => {
    this.setState({ file: file });
  };

  resetCamera = () => {
    EventEmitter.dispatch("resetCamera", {});
  }

  render() {
    return (
      <Container>
        <React.Fragment>
            <div id="ThreeScene">
              <a href="http://geomatics.ulg.ac.be/home.php" rel="noopener">
                <img src={logo_ugeom} className="logo_ugeom" alt="logo_ugeom" />
              </a>
              <ThreeScene />
              <button className="resetCAmera" onClick={this.resetCamera}> <FontAwesomeIcon icon={faUndo} />Reset Camera</button>
            </div>
            <div id="bottomPane">
            <SplitPane split="vertical" minSize="50%" defaultSize="50%">
              <div id="AttributesManager">
                <AttributesManager />
              </div>
              <div>
                <img src={logo_app} class="logo_app" alt="Measur3D" />
              </div>
            </SplitPane>
            </div>
          <Modal
            onClose={this.showModal}
            show={this.state.show}
            onClickOutside={this.showModal}
          >
            {this.state.modal_label}
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

axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response.status === 429) {
      EventEmitter.dispatch("error", error.response.data);
    }
    return Promise.reject(error.message);
  }
);

export default Measur3D;
