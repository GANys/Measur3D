import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as THREE from "three";
import axios from "axios";

import { EventEmitter } from "./events";
import * as Functions from "./functions";

import CircularProgress from "@material-ui/core/CircularProgress";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

class ThreeScene extends Component {
  constructor(props) {
    super();

    this.handleWindowResize = this.debounce(
      this.handleWindowResize.bind(this),
      100
    );

    this.element = React.createRef();

    EventEmitter.subscribe("uploadFile", event => this.handleFile(event));
    this.handleFile = this.handleFile.bind(this);

    this.handleClick = this.handleClick.bind(this);

    this.state = {
      containerWidth: 0,
      containerHeight: 0,
      boolJSONload: false,
      selectedItem: undefined,
      isMounted: false
    };

    // JSON variables
    this.meshes = []; //contains the meshes of the objects
    this.geoms = {}; //contains the geometries of the objects
  }

  componentDidMount() {
    window.addEventListener("resize", this.handleWindowResize);
    document
      .getElementById("ThreeScene")
      .addEventListener("mousedown", this.handleClick);

    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    //ADD SCENE
    this.scene = new THREE.Scene();
    //ADD CAMERA
    this.camera = new THREE.PerspectiveCamera(
      60, // Field of view
      width / height, // Aspect ratio
      0.001, // Near clipping pane
      10000 // Far clipping pane
    );
    this.camera.position.z = 2;

    //ADD RENDERER
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor("#363636");
    this.renderer.setSize(width, height);
    this.mount.appendChild(this.renderer.domElement);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // add raycaster and mouse (for clickable objects)
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.HIGHLIGHTED = null;

    //add AmbientLight (light that is only there that there's a minimum of light and you can see color)
    //kind of the natural daylight
    this.am_light = new THREE.AmbientLight(0xffffff, 0.7); // soft white light
    this.scene.add(this.am_light);

    //this.hemiLight = new THREE.HemisphereLight( 0x0000ff, 0x00ff00, 0.6 );
    //this.scene.add(this.hemilight);

    // Add directional light
    this.spot_light = new THREE.SpotLight(0xdddddd);
    this.spot_light.position.set(84616, -1, 447422);
    this.spot_light.target = this.scene;
    this.spot_light.castShadow = true;
    this.spot_light.intensity = 0.4;
    this.spot_light.position.normalize();
    this.scene.add(this.spot_light);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    Functions.loadCityObjects(this);

    this.setState({
      isMounted: true
    });

    this.start();
  }

  componentWillUnmount() {
    this.setState({
      isMounted: false
    });

    window.removeEventListener("resize", this.handleWindowResize);
    this.stop();
    this.mount.removeChild(this.renderer.domElement);
  }

  start = () => {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate);

      this.controls.update();
    }
  };

  stop = () => {
    cancelAnimationFrame(this.frameId);
  };

  animate = () => {
    this.renderScene();
    this.frameId = window.requestAnimationFrame(this.animate);

    this.controls.update();
  };

  renderScene = () => {
    this.renderer.render(this.scene, this.camera);
  };

  handleWindowResize() {
    if (this.state.isMounted) {
      this.setState({
        containerWidth: ReactDOM.findDOMNode(this.mount).offsetWidth
      });

      this.setState({
        containerHeight: ReactDOM.findDOMNode(this.mount).offsetHeight
      });

      this.camera.aspect =
        this.state.containerWidth / this.state.containerHeight;
      this.camera.updateProjectionMatrix();

      this.controls.update();

      this.renderer.setSize(
        this.state.containerWidth,
        this.state.containerHeight
      );
    }
  }

  debounce = (func, delay) => {
    let debounceTimer;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  };

  handleFile = async file => {
    await axios.post("http://localhost:3001/api/putCityModel", {
      json: file.content,
      jsonName: file.jsonName
    });

    console.log("After putCityModel " + Date.now());

    //window.location.reload() is the easiest way but not the better as it impose to reload the whole app.

    //load the cityObjects into the viewer
    await Functions.loadCityObjects(this);

    //already render loaded objects
    this.renderer.render(this.scene, this.camera);
    console.log("JSON file loaded");

    this.setState({
      boolJSONload: true
    });
  };

  handleClick = evt => {
    if (evt != undefined) {
      if (evt.button != 0) return; // Only works if left mouse button is used
    }
    Functions.getObjectAttributes(evt, this);
  };

  render() {
    return (
      <React.Fragment>
        <div
          ref={mount => {
            if (mount !== null) {
              this.mount = mount;
              if (!this.state.isMounted) {
                this.setState({
                  isMounted: true
                });
                this.handleWindowResize();
                this.handleClick();
              }
            }
          }}
        />
        {!this.state.boolJSONload ? <CircularProgress size={"4rem"} /> : null}
      </React.Fragment>
    );
  }
}

export default ThreeScene;
