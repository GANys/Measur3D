import React, { Component } from "react";
import ReactDOM from "react-dom";
import SwaggerUI from "swagger-ui-react"

import "swagger-ui-react/swagger-ui.css"

class Documentation extends Component {
  // initialize our state
  state = {
    data: []
  };

  componentDidMount() { // MERN APP
    if (!this.state.intervalIsSet) {
      //let interval = setInterval(this.getDataFromDb, 1000);
      //this.setState({ intervalIsSet: interval });
    }
  }

  componentWillUnmount() {
    if (this.state.intervalIsSet) {
      //clearInterval(this.state.intervalIsSet);
      //this.setState({ intervalIsSet: null });
    }
  }

  render() {
    return <SwaggerUI url="https://petstore.swagger.io/v2/swagger.json" />;
  }
}

export default Documentation;
