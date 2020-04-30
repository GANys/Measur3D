import React from "react";
import Dropzone from "react-dropzone";

import GetAppRoundedIcon from '@material-ui/icons/GetAppRounded';

import { EventEmitter } from "./events";

class BasicDropzone extends React.Component {
  constructor() {
    super();

    this.onDrop = this.onDrop.bind(this);
  }

  onDrop = async acceptedFile => {
    //acceptedFile is a File Object
    if (
      // eslint-disable-next-line
      acceptedFile[0] == undefined ||
      // eslint-disable-next-line
      acceptedFile[0].type != "application/json" ||
      // eslint-disable-next-line
      acceptedFile[0] == null
    ) {
      EventEmitter.dispatch("error", "An error occured while loading file !");
    } else {
      EventEmitter.dispatch("info", "Loading JSON file ...");

      let reader = new FileReader();

      reader.readAsText(acceptedFile[0]);

      reader.onloadend = function() {
        EventEmitter.dispatch("uploadFile", {
          jsonName: acceptedFile[0].name.split(".")[0],
          content: JSON.parse(reader.result)
        });
      };
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
                <div>
                <GetAppRoundedIcon />
                </div>
                {!isDragActive && "Drop CityJSON file or click to browse."}
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
