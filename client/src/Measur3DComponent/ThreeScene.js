import React, { Component } from "react";
import Switch from "react-switch";
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

    EventEmitter.subscribe("uploadFile", (event) => this.handleFile(event));
    this.handleFile = this.handleFile.bind(this);

    EventEmitter.subscribe("reloadScene", (event) => this.reloadScene(event));
    this.reloadScene = this.reloadScene.bind(this);

    EventEmitter.subscribe("loadScene", (event) => this.loadScene(event));
    this.loadScene = this.loadScene.bind(this);

    EventEmitter.subscribe("deleteObject", (event) => this.deleteObject(event));
    this.deleteObject = this.deleteObject.bind(this);

    this.clearScene = this.clearScene.bind(this);

    this.handleClick = this.handleClick.bind(this);

    this.switchObjSfc = this.switchObjSfc.bind(this);

    this.updateSelection = this.updateSelection.bind(this);

    this.state = {
      containerWidth: 0,
      containerHeight: 0,
      boolJSONload: false,
      cityModel: false,
      reload: true,
      isMounted: false,
      selectedObj: null,
      ObjSfc: true,
    };
  }

  componentDidMount() {
    window.addEventListener("resize", this.handleWindowResize);
    document
      .getElementById("ThreeScene")
      .addEventListener("click", this.handleClick);

    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    //ADD SCENE
    this.scene = new THREE.Scene();
    //ADD CAMERA
    this.camera = new THREE.PerspectiveCamera();

    //ADD RENDERER
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor("#B1E1FF");
    this.renderer.setSize(width, height);
    this.mount.appendChild(this.renderer.domElement);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // add raycaster and mouse (for clickable objects)
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    //add AmbientLight (light that is only there that there's a minimum of light and you can see color)
    //kind of the natural daylight
    var am_light = new THREE.AmbientLight(0x666666, 1.0); // soft white light
    this.scene.add(am_light);

    /*
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange
    const intensity = 1;
    const hemilight = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    this.scene.add(hemilight);
    */

    // Add directional light
    var spot_light = new THREE.SpotLight(0xdddddd);
    spot_light.position.set(84616, -1, 447422); // Can be problematic because scene is not normalised
    spot_light.target = this.scene;
    spot_light.castShadow = true;
    spot_light.intensity = 0.4;
    //this.spot_light.position.normalize();
    this.scene.add(spot_light);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.start();

    this.setState({
      isMounted: true,
      boolJSONload: false
    });
  }

  componentWillUnmount() {
    this.setState({
      isMounted: false,
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

  reloadScene = async (evt) => {
    this.setState({
      reload: !this.state.reload,
    });
  };

  handleWindowResize() {
    if (this.state.isMounted) {
      this.setState({
        containerWidth: ReactDOM.findDOMNode(this.mount).offsetWidth,
      });

      this.setState({
        containerHeight: ReactDOM.findDOMNode(this.mount).offsetHeight,
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
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  };

  handleFile = (file) => {
    this.setState({
      boolJSONload: true,
    });

    axios
      .post("http://localhost:3001/measur3d/uploadCityModel", {
        json: file.content,
        cm_uid: file.cm_uid,
      })
      .then((res) => {
        EventEmitter.dispatch("success", res.data.success);
        EventEmitter.dispatch("info", "Now loading it into the scene.");

        this.setState({
          boolJSONload: false,
          cityModel: true,
        });

        //load the cityObjects into the viewer
        this.loadScene(file.cm_uid);
      });
  };

  loadScene = (cm_uid) => {
    this.clearScene();

    this.setState({
      boolJSONload: true,
    });

    Functions.loadCityModel(this, cm_uid);

    EventEmitter.dispatch("cityModelLoaded", cm_uid);
  };

  clearScene = () => {
    // Be careful to not delete the light ... Speaking from experience
    var mesh = new THREE.Mesh();

    this.scene.children = this.scene.children.filter(
      (value) => value.type !== mesh.type
    );
  };

  handleClick = (evt) => {
    var action_button = document.querySelectorAll("div > div > span > button");

    // eslint-disable-next-line
    if (evt != undefined) {
      // eslint-disable-next-line
      if (evt.button != 0) return; // Only works if left mouse button is used
    }

    // eslint-disable-next-line
    if (evt == undefined) return;

    if (!this.state.cityModel) return;

    Functions.intersectMeshes(evt, this);

    action_button.forEach(function (button) {
      button.style.visibility = "visible";
    });
  };

  switchObjSfc = () => {
    this.setState({ ObjSfc: !this.state.ObjSfc });

    if (this.state.selectedObj == null) return;

    this.updateSelection();
  };

  updateSelection = (object) => {
    if (this.state.selectedObj != undefined) {
      if (this.state.ObjSfc) {
        this.state.selectedObj.object.material.color.setHex(Functions.ALLCOLOURS[this.state.selectedObj.object.CityObjectType]);
      } else {
        this.highlightFace(new THREE.Color(Functions.ALLCOLOURS[this.state.selectedObj.object.CityObjectType]), object);
      }
    }

    if (object != null) {
      this.setState({
        selectedObj: object,
      });

      if (this.state.ObjSfc) {
        this.state.selectedObj.object.material.color.setHex(0xffff00);
      } else {
        this.highlightFace(new THREE.Color('yellow'), object);
      }
    } else {
      this.setState({
        selectedObj: null,
      });
    }
  };

  highlightFace = (color, intersected) => {
    const {face} = intersected;
    const colorAttribute = intersected.object.geometry.getAttribute('color');

    colorAttribute.setXYZ(face.a, color.r, color.g, color.b);
    colorAttribute.setXYZ(face.b, color.r, color.g, color.b);
    colorAttribute.setXYZ(face.c, color.r, color.g, color.b);

    var offset = ( face.a % 2 == 0 ) ? 3 : - 3; // <======== CHANGED
    colorAttribute.setXYZ(face.a + offset, color.r, color.g, color.b);
    colorAttribute.setXYZ(face.b + offset, color.r, color.g, color.b);
    colorAttribute.setXYZ(face.c + offset, color.r, color.g, color.b);

    colorAttribute.needsUpdate = true;
};

  deleteObject = (uid) => {
    // Cleaning both Scene and ThreeScene objects -> Collisions seem to work oddly after it.
    this.setState({
      boolJSONload: true,
    });

    // Get mesh to be deleted
    var object = this.scene.children.filter((obj) => {
      return obj.uid === uid;
    });

    // Filter scene deleting objet and its children
    this.scene.children = this.scene.children.filter(
      (obj) => !object[0].childrenMeshes.concat(uid).includes(obj.uid)
    );

    this.renderer.render(this.scene, this.camera); // Cleaning for collisions.

    this.setState({
      boolJSONload: false,
    });
  };

  render() {
    return (
      <React.Fragment>
        <SwitchExample switchObjSfc={this.switchObjSfc} />
        <div
          ref={(mount) => {
            if (mount !== null) {
              this.mount = mount;
              if (!this.state.isMounted) {
                this.setState({
                  isMounted: true,
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

class SwitchExample extends Component {
  constructor() {
    super();
    this.state = { checked: false };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(checked) {
    this.setState({ checked });
  }

  render() {
    return (
      <label>
        <Switch
          width={136}
          uncheckedIcon={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                fontSize: "0.8rem",
              }}
            >
              Select object
            </div>
          }
          checkedIcon={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                fontSize: "0.8rem",
              }}
            >
              Select surface
            </div>
          }
          onChange={(e) => {
            this.handleChange(e);
            this.props.switchObjSfc(e);
          }}
          checked={this.state.checked}
        />
      </label>
    );
  }
}

export default ThreeScene;
