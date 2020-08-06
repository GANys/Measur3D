import React from "react";

class Chart extends React.Component {
  // initialize our state
  state = {
    data: []
  };

  // when component mounts, first thing it does is fetch all existing data in our db
  // then we incorporate a polling logic so that we can easily see if our db has
  // changed and implement those changes into our UI
  componentDidMount() { // MERN APP
    if (!this.state.intervalIsSet) {
      //let interval = setInterval(this.getDataFromDb, 1000);
      //this.setState({ intervalIsSet: interval });
    }
  }

  // never let a process live forever
  // always kill a process everytime we are done using it
  componentWillUnmount() {
    if (this.state.intervalIsSet) {
      clearInterval(this.state.intervalIsSet);
      this.setState({ intervalIsSet: null });
    }
  }


  // here is our UI
  // it is easy to understand their functions when you
  // see them render into our screen
  render() {
    return <div> This panel is left open for future tools. </div>;
  }
}

export default Chart;
