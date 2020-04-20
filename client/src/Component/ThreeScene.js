import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as THREE from "three";

import { EventEmitter } from "./events";
import * as Functions from "./functions";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

class ThreeScene extends Component {
  constructor(props) {
    super();

    this.handleWindowResize = this.debounce(
      this.handleWindowResize.bind(this),
      100
    );

    EventEmitter.subscribe("uploadFile", event => this.handleFile(event));
    this.handleFile = this.handleFile.bind(this);

    this.state = {
      containerWidth: 0,
      containerHeight: 0
    };

    this._isMounted = false;

    // JSON variables
    this.boolJSONload = false //checks if jsondata is loaded
    this.meshes = [] //contains the meshes of the objects
    this.geoms = {} //contains the geometries of the objects
  }

  componentDidMount() {
    this._isMounted = true;
    window.addEventListener("resize", this.handleWindowResize);

    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    //ADD SCENE
    this.scene = new THREE.Scene();
    //ADD CAMERA
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 4;

    //ADD RENDERER
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor("#ffffff");
    this.renderer.setSize(width, height);
    this.mount.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    //ADD CUBE
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    var material = new THREE.MeshPhongMaterial({
      color: 0x555555,
      specular: 0x111,
      shininess: 50
    });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);

    var light1 = new THREE.PointLight(0xeb9234, 2, 0);
    light1.position.set(200, 100, 300);
    this.scene.add(light1);

    var light2 = new THREE.PointLight(0x3235ba, 1, 0);
    light2.position.set(-150, 150, 200);
    this.scene.add(light2);

    this.start();
  }

  componentWillUnmount() {
    this._isMounted = false;
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
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    this.renderScene();
    this.frameId = window.requestAnimationFrame(this.animate);

    this.controls.update();
  };

  renderScene = () => {
    this.renderer.render(this.scene, this.camera);
  };

  handleWindowResize() {
    if (this._isMounted) {
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
    var jsonName = file.jsonName;
    var json = file.content;

    //load the cityObjects into the viewer
    await Functions.loadCityObjects(json, jsonName, this.geoms, this.meshes, this.scene, this.camera, this.controls);

    //already render loaded objects
    this.renderer.render(this.scene, this.camera);
    console.log("JSON file '" + jsonName + "' loaded");
  };

  render() {
    return (
      <div
        style={{
          width: window.innerWidth * 0.8,
          height: window.innerHeight * 0.8
        }}
        ref={mount => {
          if (mount !== null) {
            this.mount = mount;
            if (!this._isMounted) {
              this._isMounted = true;
              this.handleWindowResize();
            }
          }
        }}
      />
    );
  }
}

export default ThreeScene;
