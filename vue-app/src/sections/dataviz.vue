<template>
  <div id="content-wrapper">
    <div id="inner-content-wrapper">
      <div id="main-board">
        <svg id="graph"  class='remove-on-load'/>
      </div>
      <div id="sub-board">
        <div id="chart-wrapper" class='remove-on-load'>
           <ModularityChart v-if='net.initialized' :data='data' :opts='opts' :currentDate='currentDate' />
        </div>
        <div id="legend" class='remove-on-load'></div>
      </div>
      <div id='slider-wrapper'>
          <Slider v-if='net.initialized' :network='net' v-on:dateSelect='setDate'/>
        </div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import * as moment from "moment";
import Network from "../js/network.js";
import Slider from '../components/ui/slider.vue'
import ModularityChart from '../components/charts/InfoCharts.vue'
import LinksChart from '../components/charts/InfoCharts.vue'
import * as cs from "../js/charts.js";

export default {
  name: "Dataviz",
  components: {
    Slider,
    ModularityChart
  },
  props: {
    selected: String,
    data: {}
  },
  data: function() {
    return {
      net: Object,
      opts: {},
      currentDate: {},
    };
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
        this.opts = {
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
        this.net = new Network(this.data, this.opts);
      }
    },
    setDate: function(d) {
      this.currentDate = d
    }
  },
  mounted() {
    console.log("Message from #dataviz: app loaded");
  }
};
</script>


<style lang="css" scoped>

#content-wrapper {
  height: 85vh;
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
  height: 90%;
  width: 34%;
  position: relative;
  left: 2px;
  display: inline-block;
}

#legend {
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
  margin: 1.5em 0;
}
</style>

<style lang='css'>

.nodeCircle{
  stroke: white;
  stroke-width: 1px;
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

#chart-wrapper{
  margin-top: 10px;
}

</style>
