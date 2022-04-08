import React, { forwardRef } from "react";
import MaterialTable from "material-table";

import axios from "axios";

import { EventEmitter } from "./events";

import AddBox from "@material-ui/icons/AddBox";
import Check from "@material-ui/icons/Check";
import ChevronRight from "@material-ui/icons/ChevronRight";
import Clear from "@material-ui/icons/Clear";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import Remove from "@material-ui/icons/Remove";
import ViewColumn from "@material-ui/icons/ViewColumn";

import GetAppRoundedIcon from "@material-ui/icons/GetAppRounded";

const tableIcons = {
  Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
  Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
  Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
  DetailPanel: forwardRef((props, ref) => (
    <ChevronRight {...props} ref={ref} />
  )),
  Edit: forwardRef((props, ref) => <GetAppRoundedIcon {...props} ref={ref} />),
  ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
  ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />),
};

const actions = [
  {
    name: "load", // Added custom name property so we know which action to check for
    icon: () => <GetAppRoundedIcon />,
    tooltip: "Load City Model",
    onClick: (event, rowData) =>
      EventEmitter.dispatch("loadScene", rowData.cm_uid),
    disabled: false, // Set disabled to false by default for all actions
    position: "row",
  },
];

class BasicMaterialTable extends React.Component {
  async componentDidMount() {
    await axios
      .get(
        "http://localhost:3001/measur3d/getCityModelsList",
        { auth: { username: "ganys", password: "iamthedev" } }
      )
      .then(async (responseList) => {
        this.setState({
          data: responseList.data,
        });
      });
  }

  state = {
    columns: [
      { title: "UID", field: "cm_uid" },
      { title: "Number of elements", field: "nbr_el" },
      { title: "File Size in Database", field: "filesize" },
    ],
    data: [],
    tableTitle: "Available city models in the database",
  };

  deleteRows = () => {
    this.setState((prevState) => {
      const data = [];
      return { ...prevState, data };
    });
  };

  render() {
    return (
      <MaterialTable
        actions={actions}
        options={{
          search: false,
          paging: false,
          draggable: false,
          sorting: false,
          maxBodyHeight: 212, // 3 lines on my screen - sorry for selfishness
        }}
        title={this.state.tableTitle}
        icons={tableIcons}
        columns={this.state.columns}
        data={this.state.data}
        editable={{
          onRowDelete: (oldData) =>
            new Promise((resolve) => {
              // Delete City Model in DB
              axios.delete(
                "http://localhost:3001/measur3d/deleteCityModel",
                {
                  data: {
                    cm_uid: oldData.cm_uid,
                  },
                }
              );

              setTimeout(() => {
                resolve();
                this.setState((prevState) => {
                  const data = [...prevState.data];
                  data.splice(data.indexOf(oldData), 1);
                  return { ...prevState, data };
                });
              }, 500);
            }),
        }}
      />
    );
  }
}

export default BasicMaterialTable;
