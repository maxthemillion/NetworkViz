<template>
  <div id="content-wrapper">
    <div id="inner-content-wrapper">
      <div id="main-board">
        <Network
          v-if="initialized"
          :data="data"
          :opts="opts"
          :currentDate="currentDate"
          :lastUpdated="lastUpdated"
        />
      </div>
      <div id="sub-board">
        <div id="chart-wrapper">
          <ModularityChart
            v-if="initialized"
            :data="data"
            :opts="opts"
            :currentDate="currentDate"
          />
          <LinksChart
            v-if="initialized"
            :data="data"
            :opts="opts"
            :currentDate="currentDate"
          />
        </div>
        <div id="legend" class="remove-on-load"></div>
      </div>
      <div id="slider-wrapper">
        <Slider
          v-if="initialized"
          :opts="opts"
          :selection="selection"
          v-on:dateSelect="setDate"
          v-on:dateSelectEnd="setEnd"
          :key="componentKey"
        />
      </div>
    </div>
  </div>
</template>

<script>
import * as moment from "moment";
import Network from "../components/charts/Network.vue";
import Slider from "../components/ui/slider.vue";
import ModularityChart from "../components/charts/ModularityChart.vue";
import LinksChart from "../components/charts/LinksChart.vue";

export default {
  name: "Dataviz",
  components: {
    Slider,
    ModularityChart,
    LinksChart,
    Network
  },
  props: {
    selection: String,
    data: {}
  },
  data: function() {
    return {
      currentDate: {},
      lastUpdated: {},
      initialized: false,
      reload: false,
      opts: {
        linkType: "all",
        showGroupColor: false,
        showLinkColor: false,
        date: {}
      },
      componentKey: 0
    };
  },
  watch: {
    data: function() {
      this.initialized = this.selection !== "";

      this.componentKey += 1;

      this.opts.date.min = moment(Object.keys(this.data.no_links).sort()[0]);
      this.opts.date.max = moment(
        Math.max.apply(
          Math,
          this.data.links.map(function(o) {
            return moment(o.timestamp);
          })
        )
      );
      this.reload = false;

      this.setDate(this.opts.date.min.startOf('isoWeek'))
    }
  },
  methods: {
    setDate: function(d) {
      this.currentDate = d.startOf('isoWeek');
    },
    setEnd: function(d) {
      this.lastUpdated = d;
    }
  },
  computed: {
    render: function() {
      return this.initialized && !this.reload;
    }
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
  min-height:400px;
  min-width:300px; 
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
}
</style>

<style lang="css">
#chart-wrapper{
  margin-top: 10px;
}
</style>
