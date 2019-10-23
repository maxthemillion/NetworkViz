<template>
  <div id="wrapper">
    <svg id="graph">
      <g id="chartLayer" transform="translate(0,0)"></g>
    </svg>
  </div>
</template>

<script>
import * as d3 from "d3";
import Filter from "./../../js/filter.js";
import * as moment from "moment";

export default {
  name: "Network",
  props: {
    data: {},
    opts: {},
    currentDate: {},
    lastUpdated: {}
  },
  components: {},
  data() {
    return {
      linkedByIndex: {},

      current: {},
      select: {},

      date: {},

      projectName: this.opts.project,
      linkType: this.opts.linkType,

      highlightLocked: false,
      highlightActive: false,

      nodeProperties: {
        r_min: 2,
        r_max: 50,
        showColor: this.opts.showGroupColor
      },

      linkProperties: {
        width_min: 1,
        width_max: 30,
        showColor: this.opts.showLinkColor
      },

      forceProperties: {
        chargeStrength: -250,
        nodePadding: 20,
        collideStrength: 0.7,
        collideIterations: 3
      }
    };
  },
  methods: {
    simulate: function(event) {
      const simulation = d3
        .forceSimulation()
        .force("y", d3.forceX(this.chartWidth / 2).strength(0.4))
        .force("x", d3.forceY(this.chartHeight / 2).strength(0.6))
        .force(
          "charge",
          d3.forceManyBody().strength(this.forceProperties.chargeStrength)
        )
        .force(
          "link",
          d3.forceLink().id(function(d) {
            return d.id;
          })
        )
        .force(
          "collide",
          d3
            .forceCollide(d => {
              return d.r + this.forceProperties.nodePadding;
            })
            .strength(this.forceProperties.collideStrength)
            .iterations(this.forceProperties.collideIterations)
        );
      simulation.alphaMin(0.01);
      simulation.stop();

      simulation.nodes(event.nodes);
      simulation.force("link").links(event.links);

      for (
        let i = 0,
          n = Math.ceil(
            Math.log(simulation.alphaMin()) /
              Math.log(1 - simulation.alphaDecay())
          );
        i < n;
        ++i
      ) {
        simulation.tick();
      }
      return { nodes: event.nodes, links: event.links };
    },
    setScales() {
      this.nodeRadiusScale = d3
        .scaleLinear()
        .domain([1, 200])
        .range([this.nodeProperties.r_min, this.nodeProperties.r_max]);

      this.linkWeightScale = d3
        .scaleLinear()
        .domain([1, 100])
        .range([this.linkProperties.width_min, this.linkProperties.width_max]);

      this.linkColorScale = d3.scaleOrdinal(d3.schemeCategory10);
      this.groupColorScale = d3.scaleOrdinal(d3.schemeCategory10);
    },
    initZoom() {
      this.zoom = d3
        .zoom()
        .scaleExtent([1 / 2, 4])
        .on("zoom", zoomed);

      this.svg.call(this.zoom);

      const _this = this;
      function zoomed() {
        _this.select.chartLayer.attr("transform", d3.event.transform);
      }

      const gButtons = this.svg
        .append("g")
        .attr("id", "zoom_buttons")
        .attr("transform", "translate(8, 8)");

      const reset = gButtons
        .append("rect")
        .attr("width", "1em")
        .attr("height", "1em")
        .text("reset")
        .attr("fill", "grey");

      reset.on("click", function() {
        _this.svg
          .transition()
          .duration(750)
          .call(_this.zoom.transform, d3.zoomIdentity);
      });
    },
    initNodePositions() {
      const elem = this;
      this.data.nodes.forEach(function(d) {
        d.x = elem.chartWidth / 2 + (Math.random() * 100 - 50);
        d.y = elem.chartHeight / 2 + (Math.random() * 100 - 50);
      });
    },
    setDates() {
      /* initialize date variables:
       *
       * minDate: set to the earliest date occurence in the data
       * oldDate: (date currently selected) set to the beginning of the slider
       *          interval which covers the minimum Date
       * maxDate: set to the last date occurence in the data
       */
      this.date.min = this.opts.date.min;
      this.date.max = this.opts.date.max;

      this.oldDate = moment(this.date.min);
      this.oldDate.startOf("isoWeek");
    },
    draw() {
      const transitionDuration = 1000;
      const elem = this;

      function linkKey(d) {
        return d.link_id;
      }

      function nodeKey(d) {
        return d.id;
      }

      // link update
      this.select.linkPolygons = this.select.chartLayer
        .selectAll(".linkPolygon")
        .data(this.current.links, linkKey);

      // node update
      this.select.nodeCircles = this.select.chartLayer
        .selectAll(".nodeCircle")
        .data(this.current.nodes, nodeKey);

      // step 1: remove exit selections
      // node exit selection
      this.select.nodeCircles
        .exit()
        .transition()
        .duration(function(d) {
          return elem.select.nodeCircles.exit().size() === 0
            ? 0
            : transitionDuration;
        })
        .style("opacity", 0)
        .remove();

      // link exit selection
      this.select.linkPolygons
        .exit()
        .transition()
        .duration(function(d) {
          return elem.select.nodeCircles.exit().size() === 0
            ? 0
            : transitionDuration;
        })
        .style("opacity", 0)
        .remove();

      // step 2: change position of current and new elements
      this.select.linkPolygons
        .enter()
        .append("line")
        .attr("class", "linkPolygon")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .style("stroke-width", function(d) {
          return elem.linkWeightScale(d.weight);
        })
        .style("opacity", 0)
        .merge(this.select.linkPolygons)
        .style("stroke", function(d) {
          return elem.getLinkColor(d.rel_type);
        })
        .transition()
        .duration(transitionDuration)
        .style("stroke-width", function(d) {
          return elem.linkWeightScale(d.weight);
        })
        .transition()
        .duration(transitionDuration)
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .transition()
        .duration(transitionDuration)
        .style("opacity", 0.3);

      // node enter selection
      this.select.nodeCircles
        .enter()
        .append("circle")
        .attr("class", "nodeCircle")
        .style("opacity", 0)
        .merge(this.select.nodeCircles)
        .each(function() {
          d3.select(this).moveToFront();
        })
        .transition()
        .duration(transitionDuration)
        .attr("r", function(d) {
          return elem.nodeRadiusScale(d.weight);
        })
        .style("fill", function(d) {
          return elem.getGroupColor(d.group);
        })
        .transition()
        .duration(transitionDuration)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .transition()
        .duration(transitionDuration)
        .style("opacity", 1);

      this.highlight();
    },
    update(currentDate) {
      this.current.links = this.f.filterLinks(
        currentDate,
        this.data.links
      );
      this.updateLinkedByIndex(this.current.links);
      this.calculateNodeWeight(this.data.nodes, this.current.links);
      this.current.nodes = this.f.filterNodes(
        this.data.nodes,
        this.current.links
      );
      this.current.groups = this.f.filterGroups(this.data.groups, currentDate);
      this.current.nodes = this.reassignGroups(
        this.current.nodes,
        this.current.groups
      );

      const workerOpts = {
        nodes: this.current.nodes,
        links: this.current.links
      };

      const event = this.simulate(workerOpts);
      this.current.nodes = event.nodes;
      this.current.links = event.links;
      this.draw();
    },
    isConnected(a, b) {
      return (
        this.linkedByIndex[a.id + "," + b.id] === 1 ||
        this.linkedByIndex[b.id + "," + a.id] === 1 ||
        a.id === b.id
      );
    },
    calculateNodeWeight(node, link) {
      node.forEach(function(d) {
        d.weight = link.filter(function(l) {
          return l.source === d.id || l.target === d.id;
        }).length;
      });
    },
    updateLinkedByIndex(linksSelection) {
      this.linkedByIndex = {};
      const elem = this;
      linksSelection.forEach(function(d) {
        if (typeof d.source === "object") {
          elem.linkedByIndex[d.source.id + "," + d.target.id] = 1;
        } else {
          elem.linkedByIndex[d.source + "," + d.target] = 1;
        }
      });
    },
    highlight() {
      const elem = this;

      function emphasize(d, hoverNode) {
        if (!elem.highlightLocked) {
          elem.highlightActive = true;

          d3.selectAll(".nodeCircle").classed("passive", function(o) {
            return elem.isConnected(d, o) ? false : true;
          });

          d3.selectAll(".linkPolygon").classed("passive", function(o) {
            return o.source === d || o.target === d ? false : true;
          });

          d3.selectAll(".passive")
            .transition()
            .duration(500)
            .style("opacity", 0.05);
        }
      }

      function equalize() {
        elem.highlightActive = false;

        d3.selectAll(".nodeCircle.passive")
          .transition()
          .duration(500)
          .style("opacity", 1);

        d3.selectAll(".linkPolygon.passive")
          .transition()
          .duration(500)
          .style("opacity", 0.3);

        d3.selectAll(".nodeCircle").classed("passive", false);
        d3.selectAll(".linkPolygon").classed("passive", false);
      }

      let tooltip;
      d3.selectAll(".nodeCircle")
        .on("mouseover", function(d) {
          emphasize(d, this);
          tooltip = new Tooltip(this, d);
        })
        .on("mouseout", function() {
          equalize();
          tooltip.hide();
        })

        .on("mouseup", function() {
          d3.selectAll(".nodeCircle,.focus")
            .attr("class", "nodeCircle")
            .transition()
            .duration(500)
            .style("fill", "white")
            .style("box-shadow", "none");

          d3.select(this)
            .attr("class", "nodeCircle focus")
            .transition()
            .duration(500)
            .style("fill", "green")
            .style("box-shadow", "0 0 10px 5px rgba(255, 254, 254, 0.507");
        });
    },
    reassignGroups(nodes, groups) {
      if (groups !== undefined) {
        const nodeIDs = Object.keys(groups);

        nodeIDs.forEach(function(d) {
          const _d = +d;
          const nextNode = nodes.find(x => x.id === _d);
          if (nextNode !== undefined) {
            nextNode.group = groups[d];
          } else {
            console.log("node not found. id: " + d);
          }
        });
      }
      return nodes;
    },
    init() {
      this.svg = d3.select("#graph");
      this.chartWidth = document.querySelector("#graph").clientWidth;
      this.chartHeight = document.querySelector("#graph").clientHeight;
      this.f = new Filter(this.linkProperties.showColor);
      this.select.chartLayer = d3.select("#chartLayer");
    },
    getLinkColor: function(d) {
      return this.linkProperties.showColor ? this.linkColorScale(d) : "white";
    },
    getGroupColor: function(d) {
      return this.nodeProperties.showColor ? this.groupColorScale(d) : "white";
    }
  },
  watch: {
    lastUpdated: function() {
      this.update(this.currentDate);
    },
    data: function() {
      this.setDates();
      this.update(this.oldDate);
    }
  },
  computed: {},
  mounted() {
    this.init();
    this.initZoom();
    this.setScales();
    this.setDates();
    this.initNodePositions();
    this.update(this.oldDate);
  }
};
</script>

<style scoped>
.nodeCircle {
  stroke: white;
  stroke-width: 1px;
}

#wrapper {
  width: 100%;
  height: 100%;
}

#graph {
  width: 100%;
  height: 100%;
}
</style>
