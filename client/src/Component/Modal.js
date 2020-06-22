import React from "react";
import "./modal.css";
import axios from "axios";
import PropTypes from "prop-types";
import onClickOutside from "react-onclickoutside";

class Modal extends React.Component {
  constructor() {
    super();

    this.exportCityModels = this.exportCityModels.bind();
  }
  onClose = e => {
    this.props.onClose && this.props.onClose(e);
  };

  handleClickOutside = e => {
    this.props.onClose && this.props.onClose(e);
  };

  exportCityModels = async e => {
    // Need to loop
    await axios
      .get("http://localhost:3001/measur3d/getAllCityModels")
      .then(async responseCities => {
        for (var citymodel in responseCities.data) {
          var hiddenElement = document.createElement("a");
          hiddenElement.href =
            "data:application/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(responseCities.data[citymodel]));
          hiddenElement.target = "_blank";
          hiddenElement.download = "citymodel.json";
          hiddenElement.click();
        }
      });
  };

  render() {
    if (!this.props.show) {
      return null;
    }

    var html;

    switch (this.props.children[0]) {
      case "Home":
        html = html_home;
        break;
      case "GitHub":
        html = html_github;
        break;
      case "Export model":
        this.exportCityModels();
        html = html_export;
        break;
      default:
        html = "";
        break;
    }

    return (
      <div className="modal" id="modal">
        <h2 className="modal_title">{this.props.children[0]}</h2>
        <div className="modal_content">
          {React.createElement("div", {
            dangerouslySetInnerHTML: { __html: html }
          })}
        </div>
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
  show: PropTypes.bool.isRequired
};

var html_home =
  "Measur3D is a light and compact for urban model management. <br><br> It is developped by the Geomatics Unit at the University of Liège.";

var html_github =
  '<center><p>Code is available on <a href="https://github.com/GANys?tab=repositories" target="_blank">GitHub</a></p> <br> Reporting issues is strongly encouraged.</center>';

var html_export = "Exporting model";

export default onClickOutside(Modal);
