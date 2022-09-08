import React from "react";
import MaterialTable from "material-table";
import tableIcons from "./MaterialTableIcons";

import { EventEmitter } from "./events";

import axios from "axios";

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
  faWater
} from "@fortawesome/free-solid-svg-icons";

class BasicMaterialTable extends React.Component {
  constructor() {
    super();

    this.addAttribute = this.addAttribute.bind(this);
    this.updateAttribute = this.updateAttribute.bind(this);
    this.deleteAttribute = this.deleteAttribute.bind(this);

    this.updateTable = this.updateTable.bind(this);
    this.updateTitle = this.updateTitle.bind(this);

    EventEmitter.subscribe("attObject", event => this.updateTable(event));
    EventEmitter.subscribe("attObjectTitle", event => this.updateTitle(event));
  }

  state = {
    columns: [
      { title: "Attribute", field: "key" },
      { title: "Value", field: "value" }
    ],
    data: [],
    tableTitle: "Object attributes",
    CityObjectType: null
  };

  deleteRows = () => {
    this.setState(prevState => {
      const data = [];
      return { ...prevState, data };
    });
  };

  updateTable = async newData => {
    // delete previous state
    this.deleteRows();

    var attributes = [];

    // update table with new attributes
    for (var x in newData) {
      var attribute = {};
      attribute["key"] = x;
      attribute["value"] = newData[x];

      // Dynamizer
      if (attribute["key"] === '+Dynamizer'){
        attribute["key"] = newData[x].attributeRef.split("./")[1]
        attribute["value"] = 'Not supported in the current stable version.';
      }

      attributes.push(attribute);
    }

    this.setState(prevState => {
      var data = [...prevState.data];
      data = data.concat(attributes);
      return { ...prevState, data };
    });
  };

  updateTitle = data => {
    if (data == null) {
      this.setState({
        tableTitle: "Object attributes",
        CityObjectType: null
      });
      return;
    }

    this.setState({
      tableTitle: data.title,
      CityObjectType: data.type
    });
  };

  addAttribute = async newData => {
    await axios.put("http://localhost:3001/measur3d/updateObjectAttribute", {
      key: newData.key,
      value: newData.value,
      uid: this.state.tableTitle,
      CityObjectType: this.state.CityObjectType
    });
  };

  updateAttribute = async (newData, oldData) => {
    await axios.put("http://localhost:3001/measur3d/updateObjectAttribute", {
      old_key: oldData.key,
      key: newData.key,
      value: newData.value,
      uid: this.state.tableTitle,
      CityObjectType: this.state.CityObjectType
    });
  };

  deleteAttribute = async oldData => {
    await axios.put("http://localhost:3001/measur3d/updateObjectAttribute", {
      key: oldData.key,
      value: "",
      uid: this.state.tableTitle,
      CityObjectType: this.state.CityObjectType
    });
  };

  render() {
    return (
      <MaterialTable
        options={{
          search: true,
          paging: false,
          draggable: false,
          sorting: false
          //maxBodyHeight: 200 As a reminder
        }}
        actions={[
          {
            icon: tableIcons.Delete,
            tooltip: "Delete object",
            position: "toolbar",
            onClick: async data => {
              let confirmDelete = window.confirm("Delete this object?");

              if (!confirmDelete) return;

              EventEmitter.dispatch("deleteObject", this.state.tableTitle);

              await axios.delete(
                "http://localhost:3001/measur3d/deleteObject",
                {
                  data: {
                    uid: this.state.tableTitle
                  }
                }
              );

              var action_button = document.querySelectorAll(
                "div > div > span > button"
              );

              action_button.forEach(function(button) {
                button.style.visibility = "hidden";
              });

              EventEmitter.dispatch(
                "attObjectTitle",
                ("Object attributes", null)
              );
              EventEmitter.dispatch("attObject", {});
            }
          }
        ]}
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="COClassIcon">{map[this.state.CityObjectType]}</div>
            {this.state.tableTitle}
          </div>
        }
        icons={tableIcons}
        columns={this.state.columns}
        data={this.state.data}
        editable={{
          onRowAdd: newData =>
            new Promise(resolve => {
              if (!isAllowed(newData.key) || !isAllowed(newData.value)) {
                EventEmitter.dispatch(
                  "error",
                  "Inputs are invalid. Please refer to doc."
                );
                throw new Error("Error on inputs.");
              }
              this.addAttribute(newData);
              setTimeout(() => {
                resolve();
                this.setState(prevState => {
                  const data = [...prevState.data];
                  data.push(newData);
                  return { ...prevState, data };
                });
              }, 500);
            }),
          onRowUpdate: (newData, oldData) =>
            new Promise(resolve => {
              if (!isAllowed(newData.key) || !isAllowed(newData.value)) {
                EventEmitter.dispatch(
                  "error",
                  "Inputs are invalid. Please refer to doc."
                );
                throw new Error("Error on inputs.");
              }
              this.updateAttribute(newData, oldData);
              setTimeout(() => {
                resolve();
                if (oldData) {
                  this.setState(prevState => {
                    const data = [...prevState.data];
                    data[data.indexOf(oldData)] = newData;
                    return { ...prevState, data };
                  });
                }
              }, 500);
            }),
          onRowDelete: oldData =>
            new Promise(resolve => {
              this.deleteAttribute(oldData);
              setTimeout(() => {
                resolve();
                this.setState(prevState => {
                  const data = [...prevState.data];
                  data.splice(data.indexOf(oldData), 1);
                  return { ...prevState, data };
                });
              }, 500);
            })
        }}
      />
    );
  }
}

var map = {}; // Mapping between CityObject Classes and their relative icons

map["Building"] = <FontAwesomeIcon icon={faBuilding} />;
map["BuildingPart"] = <FontAwesomeIcon icon={faBuilding} />;
map["BuildingInstallation"] = <FontAwesomeIcon icon={faBuilding} />;
map["Bridge"] = <FontAwesomeIcon icon={faArchway} />;
map["BridgePart"] = <FontAwesomeIcon icon={faArchway} />;
map["BridgeInstallation"] = <FontAwesomeIcon icon={faArchway} />;
map["BridgeConstructionElement"] = <FontAwesomeIcon icon={faArchway} />;
map["CityObjectGroup"] = <FontAwesomeIcon icon={faCubes} />;
map["CityFurniture"] = <FontAwesomeIcon icon={faStoreAlt} />;
map["GenericCityObject"] = <FontAwesomeIcon icon={faCube} />;
map["LandUse"] = <FontAwesomeIcon icon={faImage} />;
map["PlantCover"] = <FontAwesomeIcon icon={faLeaf} />;
map["Railway"] = <FontAwesomeIcon icon={faTrain} />;
map["Road"] = <FontAwesomeIcon icon={faCar} />;
map["TransportSquare"] = <FontAwesomeIcon icon={faCar} />;
map["SolitaryVegetationObject"] = <FontAwesomeIcon icon={faTree} />;
map["TINRelief"] = <FontAwesomeIcon icon={faMountain} />;
map["Tunnel"] = <FontAwesomeIcon icon={faDotCircle} />;
map["TunnelPart"] = <FontAwesomeIcon icon={faDotCircle} />;
map["TunnelInstallation"] = <FontAwesomeIcon icon={faDotCircle} />;
map["WaterBody"] = <FontAwesomeIcon icon={faWater} />;

function isAllowed(string) {
  // eslint-disable-next-line
  var RegEx = /^[\w]*([\,|\.])?[0-9]*$/i;
  return RegEx.test(string);
}

export default BasicMaterialTable;
