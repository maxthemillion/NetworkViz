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
      title: "Modularity",
      date: {},
      select: {}
    };
  },

  watch: {
    currentDate: function() {
      this.updateCursorPosition(this.currentDate);
    },
    data: function() {
      this.clear();
      this.setUp(this.readModularity);
      this.drawLine();
      // this.drawAxis();
    }
  },

  methods: {
    clear: function() {
      d3.select("#s-chart-area")
        .selectAll("*")
        .remove();
    },

    setUp: function(dataFunc) {
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

      this.chartData = dataFunc(this.data, this);
      const domainMax = d3.max(this.chartData, d => d.value);
      const domainMin = d3.min(this.chartData, d => Math.min(d.value, 0));

      d3.select("#s-chart-wrapper").attr("height", this.height);

      this.select.chart = d3
        .select("#s-chart-area")
        .append("g")
        .attr("transform", "translate(0,0)");

      this.x = d3
        .scaleTime()
        .range([
          0,
          d3
            .select("#s-chart-area")
            .node()
            .getBoundingClientRect().width
        ])
        .domain([this.date.min, this.date.max]);

      this.y = d3
        .scaleLinear()
        .range([
          d3
            .select("#s-chart-area")
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
            .select("#s-chart-area")
            .node()
            .getBoundingClientRect().height
        );
    },

    drawAxis: function() {
      this.select.chart
        .append("g")
        .attr("transform", "translate(0," + this.height + ")")
        .attr("class", "axis")
        .attr("class", "xaxis")
        .call(
          d3
            .axisBottom(this.x)
            .ticks(d3.timeMonth.every(6))
            .tickFormat(d3.timeFormat("%d %B %y"))
        );

      this.select.chart
        .append("g")
        .attr("transform", "translate(0,0)")
        .attr("class", "axis")
        .attr("class", "yaxis")
        .call(
          d3
            .axisLeft(this.y)
            .tickValues([
              d3.min(this.chartData, d => d.value),
              d3.max(this.chartData, d => d.value)
            ])
        );

      this.select.chart.selectAll(".domain").remove();
      this.select.chart.selectAll(".xaxis .tick").remove();
      this.select.chart.selectAll(".tick line").remove();
      this.select.chart.selectAll(".tick text").attr("x", -6);
    },

    readModularity: function() {
      const modularityData = [];
      const keys = Object.keys(this.data.modularity).sort();

      for (let i = 0; i < keys.length; ++i) {
        modularityData.push({
          key: moment(keys[i]).format("YYYY-WW"),
          value: +this.data.modularity[keys[i]]
        });
      }

      return modularityData;
    },
    calcNumLinks: function() {
      // const cDate = moment(this.date.min);
      const linkCount = d3
        .nest()
        .key(function(d) {
          return moment(d.timestamp).format("YYYY-WW");
        })
        .rollup(function(values) {
          return d3.sum(values, function() {
            return 1;
          });
        })
        .entries(this.data.links)
        .sort(function(a, b) {
          return d3.ascending(a.key, b.key);
        });
      return linkCount;
    },
    updateCursorPosition: function(currentDate) {
      d3.selectAll("#s-chart-cursor").attr("x", this.x(currentDate) + "px");
    }
  },
  mounted() {
    this.setUp(this.readModularity);
    this.drawLine();
    // this.drawAxis();
  }
};
