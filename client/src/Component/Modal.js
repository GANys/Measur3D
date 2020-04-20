import React from "react";
import "./modal.css";
import PropTypes from "prop-types";
import onClickOutside from "react-onclickoutside";

class Modal extends React.Component {
  onClose = e => {
    this.props.onClose && this.props.onClose(e);
  };

  handleClickOutside = e => {
    this.props.onClose && this.props.onClose(e);
  };

  render() {
    if (!this.props.show) {
      return null;
    }

    var html;

    console.log(this.props.children[0]);

    switch (this.props.children[0]) {
      case "Home":
        html = html_home;
        break;
      case "Properties":
        html = html_properties;
        break;
      case "GitHub":
        html = html_github;
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

var html_home = "Home content";

var html_properties = "Properties content";

var html_github =
  '<p>Code is available on my <a href="https://github.com/GANys?tab=repositories" target="_blank">GitHub</a></p>';

export default onClickOutside(Modal);
