import React, { forwardRef } from "react";
import MaterialTable from "material-table";

import { EventEmitter } from "./events";

import axios from "axios";

import AddBox from "@material-ui/icons/AddBox";
import Check from "@material-ui/icons/Check";
import ChevronRight from "@material-ui/icons/ChevronRight";
import Clear from "@material-ui/icons/Clear";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import Edit from "@material-ui/icons/Edit";
import Remove from "@material-ui/icons/Remove";
import ViewColumn from "@material-ui/icons/ViewColumn";

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

const tableIcons = {
  Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
  Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
  Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
  DetailPanel: forwardRef((props, ref) => (
    <ChevronRight {...props} ref={ref} />
  )),
  Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
  ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
  ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
};

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
    CityObjectClass: null
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
        CityObjectClass: null
      });
      return;
    }

    this.setState({
      tableTitle: data.title,
      CityObjectClass: data.type
    });
  };

  addAttribute = async newData => {
    await axios.put("http://localhost:3001/measur3d/updateObjectAttribute", {
      key: newData.key,
      value: newData.value,
      jsonName: this.state.tableTitle,
      CityObjectClass: this.state.CityObjectClass
    });
  };

  updateAttribute = async (newData, oldData) => {
    await axios.put("http://localhost:3001/measur3d/updateObjectAttribute", {
      old_key: oldData.key,
      key: newData.key,
      value: newData.value,
      jsonName: this.state.tableTitle,
      CityObjectClass: this.state.CityObjectClass
    });
  };

  deleteAttribute = async oldData => {
    await axios.put("http://localhost:3001/measur3d/updateObjectAttribute", {
      key: oldData.key,
      value: "",
      jsonName: this.state.tableTitle,
      CityObjectClass: this.state.CityObjectClass
    });
  };

  render() {
    return (
      <MaterialTable
        options={{
          search: false,
          paging: false,
          draggable: false,
          sorting: false
        }}
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="COClassIcon">{map[this.state.CityObjectClass]}</div>
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
  var RegEx = /^[a-zA-Z0-9_]+$/i;
  return RegEx.test(string);
}

export default BasicMaterialTable;
