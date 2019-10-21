import * as d3 from "d3";
import * as moment from "moment";

export default {
  name: "Linechart",
  props: {
    currentDate: {},
    data: {},
    opts: {}
  },

  data() {
    return {
      title: "",
      date: {},
      select: {},
      dataFunc: Function
    };
  },
  watch: {
    currentDate: function() {
      this.updateCursorPosition(this.currentDate);
    },
    data: function() {
      this.clear();
      this.setUp();
      this.drawLine();
      this.drawAxis();
    }
  },

  methods: {
    clear: function() {
      d3.select(this.$refs.chartArea)
        .selectAll("*")
        .remove();
    },

    setUp: function() {
      this.height = 80;
      this.date = {
        min: moment(Object.keys(this.data.groups).sort()[0]),
        max: moment(
          Math.max.apply(
            Math,
            this.data.links.map(function(o) {
              return moment(o.timestamp);
            })
          )
        )
      };

      this.chartData = this.dataFunc();
      const domainMax = d3.max(this.chartData, d => d.value);
      const domainMin = d3.min(this.chartData, d => Math.min(d.value, 0));

      d3.select(this.$refs.chartWrapper).attr("height", this.height);

      this.select.chart = d3
        .select(this.$refs.chartArea)
        .append("g")
        .attr("transform", "translate(0,0)");

      this.x = d3
        .scaleTime()
        .range([
          0,
          d3
            .select(this.$refs.chartArea)
            .node()
            .getBoundingClientRect().width
        ])
        .domain([this.date.min, this.date.max]);

      this.y = d3
        .scaleLinear()
        .range([
          d3
            .select(this.$refs.chartArea)
            .node()
            .getBoundingClientRect().height,
          0
        ])
        .domain([domainMin, domainMax]);
    },

    drawLine: function() {
      const _this = this;
      const valueline = d3
        .line()
        .x(d => _this.x(moment(d.key, "YYYY-WW")))
        .y(d => _this.y(d.value));

      this.select.chart
        .append("path")
        .attr("id", "chartLine")
        .attr("d", valueline(this.chartData));

      this.select.chart
        .append("rect")
        .attr("id", "s-chart-cursor")
        .style(
          "height",
          d3
            .select(this.$refs.chartArea)
            .node()
            .getBoundingClientRect().height
        );

      this.select.label = this.select.chart.append("g").attr("id", "label");
      this.select.label.append("rect").attr("id", "label-background");
      this.select.label
        .append("text")
        .attr("y", 11)
        .attr("x", 5)
        .attr("id", "label-text")
        .text("test");
    },

    drawAxis: function() {
      this.select.chart
        .append("g")
        .attr("transform", "translate(0," + this.height + ")")
        .attr("class", "axis")
        .attr("class", "xaxis")
        .call(d3.axisBottom(this.x));

      this.select.chart
        .append("g")
        .attr("transform", "translate(0,0)")
        .attr("class", "axis")
        .attr("class", "yaxis")
        .call(
          d3
            .axisLeft(this.y)
            .ticks(2)
            .tickValues([
              d3.min(this.chartData, d => d.value),
              d3.max(this.chartData, d => d.value)
            ])
        );

      this.select.chart.selectAll(".domain").remove();
      this.select.chart.selectAll(".xaxis .tick").remove();
      this.select.chart.selectAll(".tick line").remove();
      this.select.chart.selectAll(".tick text").attr("x", -15);
    },

    updateCursorPosition: function(currentDate) {
      d3.selectAll("#s-chart-cursor").attr("x", this.x(currentDate) + "px");
      d3.selectAll("#label").attr(
        "transform",
        "translate(" + this.x(currentDate) + " 0)"
      );
    }
  },
  mounted() {
    this.setUp();
    this.drawLine();
    this.drawAxis();
  }
};
