import React, { forwardRef } from "react";
import MaterialTable from "material-table";

import { EventEmitter } from "./events";

import axios from "axios";

import AddBox from "@material-ui/icons/AddBox";
import ArrowUpward from "@material-ui/icons/ArrowUpward";
import Check from "@material-ui/icons/Check";
import ChevronLeft from "@material-ui/icons/ChevronLeft";
import ChevronRight from "@material-ui/icons/ChevronRight";
import Clear from "@material-ui/icons/Clear";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import Edit from "@material-ui/icons/Edit";
import FilterList from "@material-ui/icons/FilterList";
import FirstPage from "@material-ui/icons/FirstPage";
import LastPage from "@material-ui/icons/LastPage";
import Remove from "@material-ui/icons/Remove";
import SaveAlt from "@material-ui/icons/SaveAlt";
import Search from "@material-ui/icons/Search";
import ViewColumn from "@material-ui/icons/ViewColumn";

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

    this.addAttribute = this.addAttribute.bind(this)
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
    tableTitle: "Object attributes"
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

  updateTitle = title => {
    this.setState({
      tableTitle: title
    });
  };

  addAttribute = async newData => {
    await axios.post("http://localhost:3001/api/updateBuildingAttribute", {
      key: newData.key,
      value: newData.value,
      jsonName: this.state.tableTitle
    });
  };

  updateAttribute = async (newData, oldData) => {
    await axios.post("http://localhost:3001/api/updateBuildingAttribute", {
      old_key: oldData.key,
      key: newData.key,
      value: newData.value,
      jsonName: this.state.tableTitle
    });
  };

  deleteAttribute = async oldData => {
    await axios.post("http://localhost:3001/api/updateBuildingAttribute", {
      key: oldData.key,
      value: '',
      jsonName: this.state.tableTitle
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
        title={this.state.tableTitle}
        icons={tableIcons}
        columns={this.state.columns}
        data={this.state.data}
        editable={{
          onRowAdd: newData =>
            new Promise(resolve => {
              if (!isAllowed(newData.key) || !isAllowed(newData.value)) {
                console.log('Inputs are invalid. Please refer to doc.')
                throw 'Error on inputs.';
              }
              this.addAttribute(newData);
              setTimeout(() => {
                resolve();
                this.setState(prevState => {
                  const data = [...prevState.data];
                  data.push(newData);
                  return { ...prevState, data };
                });
              }, 250);
            }),
          onRowUpdate: (newData, oldData) =>
            new Promise(resolve => {
              if (!isAllowed(newData.key) || !isAllowed(newData.value)) {
                console.log('Inputs are invalid. Please refer to doc.')
                throw 'Error on inputs.';
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
              }, 250);
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
              }, 250);
            })
        }}
      />
    );
  }
}

function isAllowed(string) {
  var RegEx = /^[a-z0-9_]+$/i;
  return RegEx.test(string);
}

export default BasicMaterialTable;
