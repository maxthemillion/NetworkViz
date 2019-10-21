import * as d3 from "d3";
import * as moment from "moment";
import Filter from "./filter.js";

class TimeSeriesChart {
  constructor(data, opts, elem) {
    this.width = opts.width;
    this.height = 80;
    this.titleHeight = 0;
    this.data = data;
    this.minDate = opts.minDate;
    this.maxDate = opts.maxDate;
    this.elem = elem;

    this.x;
    this.y;
  }

  draw(dataFunc) {
    const chartData = dataFunc(this.data, this);
    const domainMax = d3.max(chartData, d => d.num);
    const domainMin = d3.min(chartData, d => Math.min(d.num, 0));

    this.elem
      .append("div")
      .attr("class", "s-chart-title")
      .data([this.title])
      .text(d => d);

    const sChartWrapper = this.elem
      .append("div")
      .attr("class", "s-chart-wrapper")
      .attr("height", this.height);

    const sChart = sChartWrapper
      .append("div")
      .attr("class", "s-chart-wrapper-centering")
      .append("svg")
      .attr("class", "s-chart-area")
      .append("g")
      .attr("transform", "translate(0," + this.titleHeight + ")");

    this.x = d3
      .scaleTime()
      .range([
        0,
        d3
          .select(".s-chart-area")
          .node()
          .getBoundingClientRect().width
      ])
      .domain([this.minDate, this.maxDate]);

    this.y = d3
      .scaleLinear()
      .range([
        d3
          .select(".s-chart-area")
          .node()
          .getBoundingClientRect().height,
        0
      ])
      .domain([domainMin, domainMax]);

    const _this = this;
    const valueline = d3
      .line()
      .x(d => _this.x(d.date))
      .y(d => _this.y(d.num));

    sChart
      .append("path")
      .attr("class", "chartLine")
      .attr("d", valueline(chartData));

    sChart
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

    sChart
      .append("g")
      .attr("transform", "translate(0,0)")
      .attr("class", "axis")
      .attr("class", "yaxis")
      .call(
        d3
          .axisLeft(this.y)
          .tickValues([
            d3.min(chartData, d => d.num),
            d3.max(chartData, d => d.num)
          ])
      );

    sChart.selectAll(".domain").remove();
    sChart.selectAll(".xaxis .tick").remove();
    sChart.selectAll(".tick line").remove();
    sChart.selectAll(".tick text").attr("x", -6);

    d3.selectAll(".s-chart-area")
      .append("rect")
      .attr("class", "s-chart-cursor")
      .style(
        "height",
        d3
          .select(".s-chart-area")
          .node()
          .getBoundingClientRect().height
      );
  }
}

export class ModularityChart extends TimeSeriesChart {
  constructor(data, opts, elem) {
    super(data, opts, elem);
    this.title = "Modularity";

    this.draw(this.readModularity);
  }

  readModularity(data) {
    const modularityData = [];
    const keys = Object.keys(data.modularity).sort();

    for (let i = 0; i < keys.length; ++i) {
      modularityData.push({
        date: moment(keys[i]),
        num: +data.modularity[keys[i]]
      });
    }

    return modularityData;
  }
}

export class NodeChart extends TimeSeriesChart {
  constructor(data, opts, elem) {
    super(data, opts, elem);
    this.filter = new Filter(opts.showLinkColor);
    this.discreteInterval = opts.discreteInterval;
    this.title = "No. Nodes";

    this.draw(this.calcNumNodes);
  }

  calcNumNodes(data, _this) {
    const cDate = moment(_this.minDate);
    const numNodesData = [];

    while (cDate.isSameOrBefore(_this.maxDate)) {
      const linkSelection = _this.filter.filterLinks(cDate, "all", data.links);
      const nodeSelection = _this.filter.filterNodes(data.nodes, linkSelection);
      numNodesData.push({ date: moment(cDate), num: nodeSelection.length });
      cDate.add(1, _this.discreteInterval);
    }
    return numNodesData;
  }
}

export class LinkChart extends TimeSeriesChart {
  constructor(data, opts, elem) {
    super(data, opts, elem);
    this.filter = new Filter(opts.showLinkColor);
    this.discreteInterval = opts.discreteInterval;
    this.title = "No. Links";

    this.draw(this.calcNumLinks);
  }

  calcNumLinks(data, _this) {
    const cDate = moment(_this.minDate);
    const numLinksData = [];
    debugger;
    const newData = d3
      .nest()
      .key(function(d) {
        return moment(d.timestamp).format("YYYY-WW");
      })
      .rollup(function(values) {
        return d3.sum(values, function(d) {
          return d.weight;
        });
      })
      .entries(data.links);

    while (cDate.isSameOrBefore(_this.maxDate)) {
      const linkSelection = _this.filter.filterLinks(cDate, "all", data.links);
      numLinksData.push({ date: moment(cDate), num: linkSelection.length }); // TODO: return cumulative weight of all nodes instead of no. links
      cDate.add(1, _this.discreteInterval);
    }

    return numLinksData;
  }
}
