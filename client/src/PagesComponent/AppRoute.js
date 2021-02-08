import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
//import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import MenuIcon from "@material-ui/icons/Menu";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";

import Measur3D from "./Measur3D";
import Documentation from "./SwaggerUI";
import Dropzone from "../Measur3DComponent/Dropzone";

import { EventEmitter } from "../Measur3DComponent/events";

import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

const styles = theme => ({
  // This group of buttons will be aligned to the right
  rightToolbar: {
    marginLeft: "auto",
    marginRight: -12
  }
})

// eslint-disable-next-line
import styles_css from "./AppRoute.css";

class AppRoute extends React.Component {
  constructor() {
    super();

    this.handleClick = this.handleClick.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.showModal = this.showModal.bind(this);
  }
  // initialize our state
  state = {
    anchorEl: null
  };

  // when component mounts, first thing it does is fetch all existing data in our db
  // then we incorporate a polling logic so that we can easily see if our db has
  // changed and implement those changes into our UI
  componentDidMount() {
    // MERN APP
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

  handleClick(event) {
    this.setState({ anchorEl: event.currentTarget });
  }

  handleClose() {
    this.setState({ anchorEl: null });
  }

  showModal(label) {
    EventEmitter.dispatch("showModal", {label: label});
  }

  // here is our UI
  // it is easy to understand their functions when you
  // see them render into our screen
  render() {
    const { classes } = this.props;

    return (
      <Router>
        <div id="NavBar">
          <AppBar>
            <Toolbar variant="dense">
              <MenuIcon
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={this.handleClick}
              />
              <Menu
                id="simple-menu"
                anchorEl={this.state.anchorEl}
                keepMounted
                open={Boolean(this.state.anchorEl)}
                onClose={this.handleClose}
              >
                <MenuItem onClick={this.handleClose}>
                  <Link to="/">Measur3D App</Link>
                </MenuItem>
                <MenuItem onClick={this.handleClose}>
                  <Link to="/api-docs">API Documentation</Link>
                </MenuItem>
              </Menu>
              <Dropzone />
              <div className={classes.rightToolbar}>
                <Button onClick={() => this.showModal('Models')}>Models</Button>
                <Button onClick={() => this.showModal('Export')}>Export</Button>
                <Button onClick={() => this.showModal('GitHub')}>GitHub</Button>
              </div>
            </Toolbar>
          </AppBar>
        </div>
        <div id="MPA">
          <Switch>
            <Route path="/api-docs">
              <Documentation />
            </Route>
            <Route path="/">
              <Measur3D />
            </Route>
          </Switch>
        </div>
      </Router>
    );
  }
}

export default withStyles(styles, { withTheme: true })(AppRoute);
