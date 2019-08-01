<template>
  <div id="app">
    <Opener @user-select = 'generateNet'/>
    <Dataviz v-bind:selected='selected' v-bind:data='data' />
  </div>
</template>

<script>
import * as d3 from "d3";
import * as moment from "moment"
import './styles/global.css'
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
      selected: '' 
    };
  },
  mounted() {
    // eslint-disable-next-line
    console.log("App loaded");
  },
  methods: {
    fetchData: async function() {
      const dataName = './viz_' + this.selected + '.json';
      const _this = this
      this.data = await d3.json(
        dataName, 
        function(data){
          data = _this.parseDateStrings(data);
          data = _this.castIntegers(data);
          return data;
        })
        // eslint-disable-next-line
        console.log('Message from #App: data loaded!')
    },

    parseDateStrings: function(data) {
      data.links.forEach(function (d) {
        d.timestamp = moment(d.timestamp);
      });
    return data;
    },

    castIntegers: function(data) {
      data.nodes.forEach(function (d) {
        d.id = +d.id;
      });
      data.links.forEach(function (d) {
        d.source = +d.source;
        d.target = +d.target;
      });
      return data;
    },

    generateNet: function(d){
      this.selected = d;
      this.fetchData();
      // eslint-disable-next-line
      console.log('Message from #App: user selection received! ' + this.selected);
    }
  }
};
</script>
