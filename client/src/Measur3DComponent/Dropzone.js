import React from "react";
import axios from "axios";
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
      (acceptedFile[0].type != "application/json" && acceptedFile[0].type != "application/city+json") ||
      // eslint-disable-next-line
      acceptedFile[0] == undefined ||
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
          cm_uid: acceptedFile[0].name.split(".")[0],
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
                IMPORT NEW FILE
                <GetAppRoundedIcon />
              </div>
            );
          }}
        </Dropzone>
      </div>
    );
  }
}

export default BasicDropzone;

/*
{!isDragActive && "IMPORT FILE"}
{isDragActive && "DROP FILE"}
*/
