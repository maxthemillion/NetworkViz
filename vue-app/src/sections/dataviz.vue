<template>
  <div id="content-wrapper">
    <div id="inner-content-wrapper">
      <div id="main-board">
        <svg id="graph"  class='remove-on-load'/>
        <div id='slider-wrapper' class='remove-on-load'></div>
      </div>
      <div id="sub-board">
        <div id="chart-wrapper" class='remove-on-load'></div>
        <div id="legend" class='remove-on-load'></div>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import * as moment from "moment";
import Network from "../js/network.js";
import Slider from "../js/slider.js";
import * as cs from "../js/charts.js";

export default {
  name: "Dataviz",
  props: {
    selected: String,
    data: {}
  },
  data: function() {
    return {};
  },
  watch: {
    data: function() {
      this.generateNet();
    }
  },
  methods: {
    generateNet: function() {
      console.log(this.selected !== "");
      if (this.selected !== "") {
        d3
          .selectAll(".remove-on-load")
          .selectAll("*")
          .remove();
        const opts = {
          svg: d3.select("#graph"),
          linkType: "all",
          showGroupColor: false,
          showLinkColor: false,
          minDate: moment(Object.keys(this.data.groups).sort()[0]),
          maxDate: moment(
            Math.max.apply(
              Math,
              this.data.links.map(function(o) {
                return moment(o.timestamp);
              })
            )
          ),
          width: document.querySelector("#graph").clientWidth,
          height: document.querySelector("#graph").clientHeight,
          discreteInterval: "week"
        };
        const net = new Network(this.data, opts);
        const slider = new Slider(net, d3.select("#slider-wrapper"));
        new cs.ModularityChart(this.data, opts, d3.select("#chart-wrapper"));
        //new cs.NodeChart(this.data, opts, d3.select("#chart-wrapper"));
        //new cs.LinkChart(this.data, opts, d3.select("#chart-wrapper"));
      }
    }
  },
  mounted() {
    console.log("Message from #dataviz: app loaded");
  }
};
</script>


<style lang="css" scoped>
h1 {
  color: grey;
}

#content-wrapper {
  background-color: #e5e5e5;
  height: 100vh;
  min-width: 100vw;
  position: relative;
}

#inner-content-wrapper {
  position: relative;
  top: 2%;
  left: 2%;
  height: 98%;
  width: 96%;
}

#main-board {
  background-color: #ffffff;
  width: 66%;
  height: 90%;
  position: relative;
  display: inline-block;
  min-width: 300px;
  float: left;
}

#graph {
  width: 100%;
  height: 100%;
}

#sub-board {
  background-color: #ffffff;
  height: 90%;
  width: 32%;
  position: relative;
  left: 2px;
  display: inline-block;
}

#legend {
  background-color: #ffffff;
  position: relative;
  width: 25%;
  height: 33%;
}

.linkPolygon {
  opacity: 0.3;
  stroke-width: 1px;
}

#slider-wrapper {
  width: 100%;
  margin: 0.5em 0;
}
</style>

<style lang='css'>
.slider {
  position: relative;
  margin-bottom: 20px;
  width: 100%;
  margin: 0 auto;
  height: 30px;
}

.slider-text {
  position: absolute;
}

.slider-tray {
  position: absolute;
  width: 100%;
  height: 2px;
  border: solid 1px rgb(160, 160, 160);
  border-top-color: #aaa;
  border-radius: 4px;
  background-color: #8c8d9c;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
}

.slider-handle {
  position: absolute;
}

.slider-handle-icon {
  width: 14px;
  height: 14px;
  border: solid 1px #aaa;
  position: absolute;
  border-radius: 10px;
  background-color: #6200ee;
  box-shadow: 0 0 10px 5px rgba(98, 0, 238, 0.507);
  top: -7px;
  left: -7px;
}

.axis {
  color: grey;
  font-size: 0.8em;
}

.axis line {
  stroke: grey;
}

.axis path {
  stroke: grey;
}

.chartLine {
    stroke: grey;
    stroke-width: 1px;
    opacity: 0.5;
    fill: transparent;
}

#chart-wrapper{
  margin-top: 10px;
}

.s-chart-wrapper{
    height: 100px;
    margin-bottom: 40px;
    display: flex;
    align-items: flex-end;
    position:relative;
}

.s-chart-wrapper-centering{
    display: flex;
    width: 90%;
    height: 100%;
    align-items: center;
    margin: 0 auto;
}

.s-chart-area{
    display: block; 
    width:100%;
    height: 70%;
    margin: 0 auto;
}

.s-chart-cursor{
    width: 1px;
    fill: deepskyblue;
    position: absolute;
    opacity: 1;
}

.s-chart-title{
    left:5%;
    color: grey;
    position:relative;
}


</style>
