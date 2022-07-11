import React from "react";

import { EventEmitter } from "./events";

import { Chart as ChartJS } from "chart.js/auto";
import { Line } from "react-chartjs-2";

import axios from "axios";

class Chart extends React.Component {
  constructor() {
    super(...arguments);
    this.primaryxAxis = { valueType: "DateTime", labelFormat: "yMd" };
    this.tooltip = { enable: true };

    EventEmitter.subscribe("resetChart", (event) => this.resetChart(event));
    EventEmitter.subscribe("updateChart", (event) => this.updateChart(event));
  }

  resetChart = () => {
    this.setState({
      labels: null,
      label: null,
      data: null,
    });
  }

  updateChart = (info) => {
    axios.get(info.url).then((dataset) => {
      var labels = [],
        data = [];

      for (const el in dataset.data) {
        labels.push(Date(dataset.data[el].time.instant));
        data.push(dataset.data[el].value.value);
      }

      this.setState({
        labels: labels,
        label: info.label,
        data: data,
      });
    });
  };

  state = {
    labels: null,
    label: null,
    data: null,
  };

  render() {
    return (
      <Line
        datasetIdKey="id"
        data={{
          labels: this.state.labels,
          datasets: [
            {
              id: 1,
              label: this.state.label,
              data: this.state.data,
            },
          ],
        }}
      />
    );
  }
}

export default Chart;
