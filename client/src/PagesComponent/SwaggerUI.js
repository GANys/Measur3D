import React, { Component } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

class Documentation extends Component {
  render() {
    return <SwaggerUI url="http://localhost:3001/api-docs" />;
  }
}

export default Documentation;
