<template>
  <div class="slider">
    <div class="slider-text">
      <svg id="axis_container">
        <g id="main_axis"></g>
      </svg>
    </div>
    <div class="slider-tray"></div>
    <div class="slider-handle">
      <div class="slider-label">{{ this.currentDate }}</div>
      <div class="slider-handle-icon"></div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import * as moment from "moment";

export default {
  name: "Slider",
  props: {
    selected: {},
    opts: {}
  },
  data: function(){ return {
    currentDate: String
    }
  },
  watch: {
    selected: function() {
      this.generate();
    }
  },
  methods: {
    generate: function() {
      this.setUp();
      this.setStyle();
      this.dispatchEvents();
    },
    setUp: function() {
      this.height = "50";
      this.date = {
        min: this.opts.date.min,
        max: this.opts.date.max
      };

      this.select = {};
      this.select.slider = d3.select(".slider");

      this.sliderTimeScale = d3
        .scaleTime()
        .domain([this.date.min, this.date.max])
        .range([0, this.select.slider.node().getBoundingClientRect().width]);

      this.sliderScale = d3
        .scaleLinear()
        .domain([this.date.min, this.date.max])
        .range([0, this.select.slider.node().getBoundingClientRect().width])
        .clamp(true);
    },
    setStyle: function() {
      d3.select("#main_axis")
        .attr("transform", "translate(0, 3)")
        .call(
          d3
            .axisBottom(this.sliderTimeScale)
            .ticks(d3.timeMonth.every(3))
            .tickFormat(d3.timeFormat("%b %y"))
        );

      d3.selectAll("#main_axis .domain").remove();

      this.select.sliderTray = d3.select(".slider-tray");

      this.select.sliderHandle = d3.select(".slider-handle");
    },
    dispatchEvents: function() {
      this.dispatch = d3.dispatch("sliderChange", "sliderEnd");
      const _d3 = d3;
      const _this = this;
      this.select.slider.call(
        d3
          .drag()
          .on("drag", function() {
            _this.dispatch.call("sliderChange");
          })
          .on("end", function() {
            _this.dispatch.call("sliderChange");
            _this.dispatch.call("sliderEnd");
          })
      );

      this.dispatch.on("sliderChange", function() {
        const date = _this.sliderScale.invert(
          _d3.mouse(_this.select.sliderTray.node())[0]
        );
        _this.$emit("dateSelect", moment(date));
        _this.updateHandlePosition(date);
        _this.updateSliderLabel(date);
      });

      this.dispatch.on("sliderEnd", function() {
        let value = _this.sliderScale.invert(
          _d3.mouse(_this.select.sliderTray.node())[0]
        );
        value = Math.round(value);

        const newDate = moment(value).startOf("isoWeek");
        if (!newDate.isSame(_this.oldDate)) {
          _this.updateHandlePosition(newDate);
          _this.$emit("dateSelect", moment(newDate));
          _this.$emit("dateSelectEnd", moment());
          _this.oldDate = moment(newDate);
        }
      });
    },
    updateHandlePosition: function(date) {
      date = moment(date).startOf('isoWeek').format('x')
      this.select.sliderHandle.style("left", this.sliderScale(date) + "px");
    },
    updateSliderLabel: function(date){
      this.currentDate = moment(date).startOf('isoWeek').format('DD MMMM YYYY')
    }
  },
  mounted() {
    this.generate();
  }
};
</script>

<style>
#axis_container {
  width: 100%;
  height: 100%;
}

#main_axis {
  color: white;
}

.slider {
  position: relative;
  margin-bottom: 20px;
  width: 90%;
  margin: 0 auto;
  height: 30px;
  opacity: 1;
}

.slider-text {
  position: absolute;
  width: 100%;
  height: 100%;
}

.slider-tray {
  position: absolute;
  width: 100%;
  height: 2px;
  border-radius: 5px;
  background-color: white;
}

.slider-handle {
  position: absolute;
}

.slider-handle-icon {
  width: 14px;
  height: 14px;
  border: solid 1px white;
  position: absolute;
  border-radius: 10px;
  background-color: deepskyblue;
  top: -7px;
  left: -7px;
}

.slider-label{
    font-size: 11px;
    top: -25px;
    left: -20px;
    position: absolute;
    width: 100px;

}


</style>
