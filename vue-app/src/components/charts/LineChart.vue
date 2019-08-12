<template>
  <div>
    <div id="s-chart-title" ref="chartTitle">{{ this.title }}</div>
    <div id="s-chart-wrapper" ref="chartWrapper">
      <div id="s-chart-wrapper-centering" ref="chartCentering">
        <svg id="s-chart-area" ref="chartArea"></svg>
      </div>
    </div>
  </div>
</template>

<script>
import ChartLogic from "../../js/linechart.js";

export default {
  name: "Linechart",
  extends: ChartLogic
};
</script>

<style scoped>
#s-chart-wrapper {
  height: 100px;
  margin-bottom: 40px;
  display: flex;
  align-items: flex-end;
  position: relative;
}

#s-chart-wrapper-centering {
  display: flex;
  width: 90%;
  height: 100%;
  align-items: center;
  margin: 0 auto;
}

#s-chart-area {
  display: block;
  width: 100%;
  height: 70%;
  margin: 0 auto;
  overflow: visible;
}
</style>

<style>
#s-chart-title {
  left: 5%;
  color: white;
  position: relative;
}

#chartLine {
  stroke: white;
  stroke-width: 1px;
  fill: transparent;
}

#s-chart-cursor {
  width: 1px;
  fill: deepskyblue;
  position: absolute;
  opacity: 1;
}
</style>
