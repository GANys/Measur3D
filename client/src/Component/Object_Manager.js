import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

import { EventEmitter } from "./events";

function createData(name, calories, fat, carbs, protein) {
  return { name, calories, fat, carbs, protein };
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9),
];

class Object_Manager extends React.Component {
  constructor() {
    super();

    this.buildInfoDiv = this.buildInfoDiv.bind(this);

    EventEmitter.subscribe("buildInfoDiv", eventData => this.buildInfoDiv(eventData));
  }

  buildInfoDiv = (data) => {
    console.log(data.name);

    /*
    $("#attributeTable").find("tr:gt(0)").remove();
    $("#cityObjId").text("");

    //fill table
    $("#cityObjId").text(cityObj);
    //fill table with id
    $('#attributeTable').append("<tr>" +
      "<td>id</td>" +
      "<td>" + cityObj + "</td>" +
      "</tr>")

    //fill table with attributes
    for (var key in json.CityObjects[cityObj].attributes) {
      $('#attributeTable').append("<tr>" +
        "<td>" + key + "</td>" +
        "<td>" + json.CityObjects[cityObj].attributes[key] + "</td>" +
        "</tr>")
    }

    //display attributeBox
    $("#attributeBox").show();
    */
  };

  render() {

    return (
      <TableContainer component={Paper}>
      <Table className="test" aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Attribute</TableCell>
            <TableCell align="right">Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell align="right">{row.attribute}</TableCell>
              <TableCell align="right">{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    );
  }
}

export default Object_Manager;
