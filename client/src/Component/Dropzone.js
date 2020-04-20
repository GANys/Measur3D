import React from "react";
import Dropzone from "react-dropzone";

class BasicDropzone extends React.Component {
  constructor() {
    super();

    this.onDrop = this.onDrop.bind(this);
  }

  onDrop = acceptedFile => {
    if (
      // eslint-disable-next-line
      acceptedFile[0] == undefined ||
      // eslint-disable-next-line
      acceptedFile[0].type != "application/json"
    ) {
      this.props.showError("Une erreur est survenue !");
    } else {
      this.props.showSuccess("Ca marche !");
    }
  };

  render() {
    return (
      <div className="dropzone">
        <Dropzone onDrop={this.onDrop} accept="application/json">
          {({ getRootProps, getInputProps, isDragActive, isDragReject }) => {
            return (
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                {!isDragActive && "Drop JSON file or click to browse."}
                {isDragActive && !isDragReject && "Drop JSON file here."}
              </div>
            );
          }}
        </Dropzone>
      </div>
    );
  }
}

export default BasicDropzone;
