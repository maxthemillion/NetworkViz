<template>
  <div id="opener">
    <div id="title-wrapper">
      <div id="main-title">
        <h1>Explore GitHub Communication Networks!</h1>
      </div>
      <div id="sub-title">Choose a project:</div>
      <div id="selector-wrapper">
        <select id="selector"> </select>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
const transitionDuration = 1000;
const projectNames = [
  "",
  "OneDrive",
  "waffleio",
  "getnikola",
  "Tribler",
  "BobPalmer",
  "novus",
  "rathena",
  "gatsbyjs"
];

export default {
  name: "Opener",
  props: {},
  data: function() {
    return {
      selection: ""
    };
  },
  methods: {
    showSubtitle: function() {
      d3.select("#sub-title")
        .transition()
        .duration(transitionDuration)
        .style("opacity", 1);
    },
    addOptions: function() {
      d3.select("#selector").on("change", this.dropdownChange);

      d3.select("#selector")
        .selectAll("option")
        .data(projectNames)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);
    },
    showOptions: function() {
      d3.select("#selector")
        .transition()
        .delay(transitionDuration)
        .duration(transitionDuration);
    },
    dropdownChange: function() {
      this.selection = d3.select("#selector").property("value");

      this.$emit("userSelect", this.selection);
    }
  },
  computed: {},
  mounted() {
    this.showSubtitle();
    this.addOptions();
    this.showOptions();
  }
};
</script>

<style scoped>
h1 {
  font-weight: lighter;
  margin-top: 0px;
  margin-bottom: 0.2em;
}

#opener {
  width: 100vw;
  min-height: 15vh;
  position: relative;
  top: 0;
  left: 0;
}

#title-wrapper {
  position: relative;
  left: 7.5%;
  top: 20px;
  width: 80%;
}

#sub-title {
  opacity: 0;
  position: relative;
  display: inline-block;
  margin-right: 1em;
  margin-bottom: 1em;
}

#main-title {
  position: relative;
}

#selector-wrapper {
  display: inline-block;
}

#selector {
  opacity: 0.8;
  position: relative;
  color: deepskyblue;
  background-color: #12111d;
  font-size: 1em;
  border-color: deepskyblue;
  border-radius: 5px;
  display: inline-block;
  height: 2em;
  padding: 0 20px;
  cursor: pointer;
}

#selector:hover {
  opacity: 1;
}
</style>
