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

    EventEmitter.subscribe("reloadScene", event => this.reloadScene(event));
    this.reloadScene = this.reloadScene.bind(this);

    EventEmitter.subscribe("loadScene", event => this.loadScene(event));
    this.loadScene = this.loadScene.bind(this);

    EventEmitter.subscribe("deleteObject", event => this.deleteObject(event));
    this.deleteObject = this.deleteObject.bind(this);

    this.clearScene = this.clearScene.bind(this);

    this.handleClick = this.handleClick.bind(this);

    this.state = {
      containerWidth: 0,
      containerHeight: 0,
      boolJSONload: false,
      cityModel: false,
      reload: true,
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
      0.01, // Near clipping pane
      10000 // Far clipping pane
    );
    this.camera.position.z = 2;

    //ADD RENDERER
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor("#000000");
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

    this.start();

    this.setState({
      isMounted: true,
      boolJSONload: false
    });
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

  reloadScene = async evt => {
    this.setState({
      reload: !this.state.reload
    });
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

  handleFile = file => {
    this.setState({
      boolJSONload: true
    });

    axios
      .post("http://localhost:3001/measur3d/uploadCityModel", {
        json: file.content,
        jsonName: file.jsonName
      })
      .then(res => {
        EventEmitter.dispatch("success", res.data.success);
        EventEmitter.dispatch("info", "Now loading it into the scene.");

        this.setState({
          boolJSONload: false,
          cityModel: true
        });

        //load the cityObjects into the viewer
        this.loadScene(file.jsonName);
      });
  };

  loadScene = cm_name => {
    this.clearScene();

    this.setState({
      boolJSONload: true
    });

    Functions.loadCityObjects(this, cm_name);

    EventEmitter.dispatch("cityModelLoaded", cm_name);
  };

  clearScene = () => {
    // Not be enough for collisions -> array.splice ?
    // Be careful to not delete the light ... Speaking from experience
    var mesh = new THREE.Mesh();

    this.scene.children = this.scene.children.filter(
      value => value.type !== mesh.type
    );

    this.renderer.render(this.scene, this.camera);
  };

  handleClick = evt => {
    var add_attribute_button = document.querySelector(
      "div.MuiToolbar-root.MuiToolbar-regular.MTableToolbar-root-75.MuiToolbar-gutters > div.MTableToolbar-actions-78"
    );
    // eslint-disable-next-line
    if (evt != undefined) {
      // eslint-disable-next-line
      if (evt.button != 0) return; // Only works if left mouse button is used
    }

    // eslint-disable-next-line
    if (evt == undefined) return;

    if (!this.state.cityModel) return;

    add_attribute_button.style.visibility = "visible";
    Functions.intersectMeshes(evt, this);
  };

  deleteObject = name => {
    // Cleaning both Scene and ThreeScene objects

    this.setState({
      boolJSONload: true
    });

    delete this.geoms[name];

    this.scene.children = this.scene.children.filter(
      value => value.name !== name
    );

    var index_mesh;

    for (var el in this.meshes) {
      // eslint-disable-next-line
      if (this.meshes[el].name == name) {
        index_mesh = el;
      }
    }

    for (var child in this.meshes[index_mesh].childrenMeshes) {
      for (var el in this.meshes) {
        // eslint-disable-next-line
        if (this.meshes[el].name == name) {
          index_mesh = el;
        }
      }

      if (this.meshes[index_mesh].childrenMeshes[child] != undefined) {
        this.deleteObject(this.meshes[index_mesh].childrenMeshes[child]);
      }
    }

    this.meshes.splice(index_mesh, 1);

    // Need to check this - HERE
    console.log(Object.keys(this.geoms).length)
    console.log(Object.keys(this.scene.children).length)
    console.log(this.meshes.length)

    this.setState({
      boolJSONload: false
    });
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
        {this.state.boolJSONload ? <CircularProgress size={"4rem"} /> : null}
      </React.Fragment>
    );
  }
}

export default ThreeScene;
