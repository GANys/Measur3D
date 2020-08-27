import React, { forwardRef } from "react";
import MaterialTable from "material-table";

import axios from "axios";

import AddBox from "@material-ui/icons/AddBox";
import Check from "@material-ui/icons/Check";
import ChevronRight from "@material-ui/icons/ChevronRight";
import Clear from "@material-ui/icons/Clear";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import Remove from "@material-ui/icons/Remove";
import ViewColumn from "@material-ui/icons/ViewColumn";

import LocationCityRoundedIcon from "@material-ui/icons/LocationCityRounded";
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
  ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
};

class BasicMaterialTable extends React.Component {
  async componentDidMount() {
    await axios
      .get("http://localhost:3001/measur3d/getCityModelsList")
      .then(async responseList => {
        console.log(responseList);

        this.setState({
          data: responseList.data
        });
      });
  }

  state = {
    columns: [
      { title: "Name", field: "name" },
      { title: "Number of elements", field: "nbr_el" },
      { title: "File Size", field: "filesize" }
    ],
    data: [],
    tableTitle: "City Models"
  };

  deleteRows = () => {
    this.setState(prevState => {
      const data = [];
      return { ...prevState, data };
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
            <div className="CityPickerIcon">{<LocationCityRoundedIcon />}</div>
            {this.state.tableTitle}
          </div>
        }
        icons={tableIcons}
        columns={this.state.columns}
        data={this.state.data}
        editable={{
          onRowUpdate: (newData, oldData) => console.log(newData), // HERE
          onRowDelete: oldData =>
            new Promise(resolve => {
              // Delete City Model in DB
              axios.delete(
                "http://localhost:3001/measur3d/deleteNamedCityModel",
                {
                  data: {
                    name: oldData.name
                  }
                }
              );

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

export default BasicMaterialTable;
