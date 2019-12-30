<template>
  <div id="app">
    <Opener @userSelect="fetchData" />
    <Dataviz v-bind:selection="selection" v-bind:data="data" />
  </div>
</template>

<script>
import * as d3 from "d3";
import * as moment from "moment";
import "./styles/global.css";
import Opener from "./sections/opener.vue";
import Dataviz from "./sections/dataviz.vue";

export default {
  name: "app",
  components: {
    Opener,
    Dataviz
  },
  data: function() {
    return {
      data: {},
      selection: ""
    };
  },
  methods: {
    fetchData: async function(selection) {
      this.selection = selection;
      const dataName = "./viz_" + this.selection + ".json";
      const _this = this;
      this.data = await d3.json(dataName, function(d) {
        d = _this.parseDateStrings(d);
        _this.castIntegers(d);
      });
    },

    parseDateStrings: function(data) {
      data.links.forEach(function(d) {
        d.timestamp = moment(d.timestamp);
      });
      return data;
    },

    castIntegers: function(data) {
      data.nodes.forEach(function(d) {
        d.id = +d.id;
      });
      data.links.forEach(function(d) {
        d.source = +d.source;
        d.target = +d.target;
      });
      return data;
    }
  }
};
</script>
