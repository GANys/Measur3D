import React from "react";
import "./modal.css";
import axios from "axios";
import PropTypes from "prop-types";
import onClickOutside from "react-onclickoutside";

import { EventEmitter } from "./events";

// Used in an HTML environment, not JS
// eslint-disable-next-line
import CityPicker from "./CityPicker";

class Modal extends React.Component {
  constructor() {
    super();

    this.exportCityModel = this.exportCityModel.bind();

    EventEmitter.subscribe("loadScene", (event) => {
      this.onClose(event);
      this.setState({ cm_uid: event });
    });
    EventEmitter.subscribe("showModal", (event) => this.showModal(event));
  }

  state = {
    label: "",
    cm_uid: "",
  };

  onClose = (e) => {
    this.props.onClose && this.props.onClose(e);
  };

  handleClickOutside = (e) => {
    this.props.onClose && this.props.onClose(e);
  };

  showModal = (e) => {
    this.setState({ label: e.label });
  };

  exportCityModel = async (e) => {
    await axios
      .get("http://localhost:3001/measur3d/getCityModel", {
        params: {
          cm_uid: this.state.cm_uid,
        },
      })
      .then(async (responseCity) => {
        var hiddenElement = document.createElement("a");
        hiddenElement.href =
          "data:application/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(responseCity.data));
        hiddenElement.target = "_blank";
        hiddenElement.download = "citymodel.city.json";
        hiddenElement.click();
      });
  };

  render() {
    if (!this.props.show) {
      return null;
    }

    var modal_content;

    switch (this.state.label) {
      case "Models":
        modal_content = <CityPicker />;
        break;
      case "GitHub":
        modal_content = React.createElement("div", {
          dangerouslySetInnerHTML: { __html: html_github },
        });
        break;
      case "Export":
        if (this.state.cm_uid !== "") {
          this.exportCityModel(CityPicker.cm_uid);
          modal_content = React.createElement("div", {
            dangerouslySetInnerHTML: { __html: html_export },
          });
        } else {
          modal_content = React.createElement("div", {
            dangerouslySetInnerHTML: { __html: html_export_no },
          });
        }
        break;
      default:
        modal_content = "";
        break;
    }

    return (
      <div className="modal" id="modal">
        <h2 className="modal_title">{this.state.label}</h2>
        <div className="modal_content">{modal_content}</div>
        <div className="modal_actions">
          <button className="toggle-button" onClick={this.onClose}>
            Ok
          </button>
        </div>
      </div>
    );
  }
}

Modal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onClickOutside: PropTypes.func.isRequired,
};

var html_github =
  '<center><p>Code is available on <a href="https://github.com/GANys?tab=repositories" target="_blank">GitHub</a></p> <br> Reporting issues is strongly encouraged.</center>';

var html_export_no = "<center>Error<br><br>There is no loaded model.</center>";

var html_export =
  "<center>Preparation of the CityModel<br><br>The download will start as soon as the model is ready.</center>";

export default onClickOutside(Modal);
