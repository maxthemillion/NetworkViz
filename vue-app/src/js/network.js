/* eslint-disable max-len, no-unused-vars */
import * as d3 from 'd3';
import * as moment from 'moment';

d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};

export default class Network {
  constructor(data, opts, worker) {
    this.links = data.links;
    this.groups = data.groups;
    this.nodes = data.nodes;

    this.worker = worker;
    this.worker.register({message: 'simulate', func: this.simulate});

    this.data = data;
    this.current = {};
    this.select = {};

    this.projectName = opts.project;
    this.svg = opts.svg;
    this.linkType = opts.linkType;
    this.chartWidth = opts.width;
    this.chartHeight = opts.height;

    this.filtered = false;
    this.highlightLocked = false;
    this.highlightActive = false;

    this.discreteInterval = 'week';

    this.nodeProperties = {
      'r_min': 4,
      'r_max': 100,
      'showColor': opts.showGroupColor,
    };

    this.linkProperties = {
      'width_min': 2,
      'width_max': 50,
      'showColor': opts.showLinkColor,
    };

    this.forceProperties = {
      'chargeStrength': -250,
      'nodePadding': 20,
      'collideStrength': 0.7,
      'collideIterations': 3,
    };

    this.f = new Filter(this.linkProperties.showColor);

    this.linkedByIndex = {};

    this.appendChartLayer();
    this.setSize();
    this.setScales();

    const elem = this;
    this.getLinkColor = function(d) {
      return elem.linkProperties.showColor ? elem.linkColorScale(d) : 'grey';
    };

    this.getGroupColor = function(d) {
      return elem.nodeProperties.showColor ? elem.groupColorScale(d) : 'grey';
    };

    this.setDates();
    this.initNodePositions();

    this.update(this.oldDate);
  }

  simulate(event) {
    const nodes = event.nodes;
    const links = event.links;
    const forceProperties = event.forceProperties;
    const width = event.chart.width;
    const height = event.chart.height;

    // define simulation
    const simulation = d3.forceSimulation()
        .force('y',
            d3.forceX(width / 2).strength(0.4))
        .force('x',
            d3.forceY(height / 2).strength(0.6))
        .force('charge', d3.forceManyBody().strength(forceProperties.chargeStrength))
        .force('link',
            d3.forceLink().id(
                function(d) {
                  return d.id;
                }))
        .force(
            'collide',
            d3.forceCollide(function(d) {
              return d.r + forceProperties.nodePadding;
            })
                .strength(forceProperties.collideStrength)
                .iterations(forceProperties.collideIterations));
    simulation.alphaMin(0.01);
    simulation.stop();

    simulation.nodes(nodes);
    simulation.force('link').links(links);

    for (let i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
      simulation.tick();
    }

    return {nodes: nodes, links: links};
  };

  setSize() {
    this.svg
        .attr('width', this.chartWidth)
        .attr('height', this.chartHeight);

    this.chartLayer
        .attr('width', this.chartWidth)
        .attr('height', this.chartHeight)
        .attr('transform', ' translate(' + [0, 0] + ')');
  }

  setScales() {
    this.nodeRadiusScale = d3.scaleLinear()
        .domain([1, 200])
        .range([this.nodeProperties.r_min, this.nodeProperties.r_max]);

    this.linkWeightScale = d3.scaleLinear()
        .domain([1, 100])
        .range([this.linkProperties.width_min, this.linkProperties.width_max]);

    this.linkColorScale = d3.scaleOrdinal(d3.schemeCategory10);
    this.groupColorScale = d3.scaleOrdinal(d3.schemeBlues[9]);
  }

  appendChartLayer() {
    this.chartLayer = this.svg
        .append('g')
        .attr('class', 'chartLayer')
        .attr('transform', 'scale(2,2)');
  }

  initNodePositions() {
    const elem = this;
    this.nodes.forEach(function(d) {
      d.x = elem.chartWidth / 2 + (Math.random() * 100 - 50);
      d.y = elem.chartHeight / 2 + (Math.random() * 100 - 50);
    });
  }

  setDates() {
    /* initialize date variables:
     *
     * minDate: set to the earliest date occurence in the data
     * oldDate: (date currently selected) set to the beginning of the slider
     *          interval which covers the minimum Date
     * offset:  difference in days between minDate and oldDate
     * maxDate: set to the last date occurence in the data
     *
     */
    this.minDate = moment(Object.keys(this.groups).sort()[0]);
    this.maxDate = moment(
        Math.max.apply(
            Math,
            this.links.map(function(o) {
              return moment(o.timestamp);
            })
        )
    );
    this.oldDate = moment(this.minDate);
    this.oldDate.startOf(this.discreteInterval);

    this.offset = this.minDate.diff(this.oldDate, 'days'); // negative
  }

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
    this.select.linkPolygons = this.chartLayer.selectAll('.linkPolygon')
        .data(this.current.links, linkKey);

    // node update
    this.select.nodeCircles = this.chartLayer.selectAll('.nodeCircle')
        .data(this.current.nodes, nodeKey);

    // step 1: remove exit selections
    // node exit selection
    this.select.nodeCircles.exit()
        .transition()
        .duration(function(d) {
          return elem.select.nodeCircles.exit().size() === 0 ? 0 : transitionDuration;
        })
        .style('opacity', 0)
        .remove();

    // link exit selection
    this.select.linkPolygons.exit()
        .transition()
        .duration(function(d) {
          return elem.select.nodeCircles.exit().size() === 0 ? 0 : transitionDuration;
        })
        .style('opacity', 0)
        .remove();

    // step 2: change position of current and new elements
    this.select.linkPolygons.enter()
        .append('line')
        .attr('class', 'linkPolygon')
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)
        .style('stroke-width', function(d) {
          return elem.linkWeightScale(d.weight);
        })
        .style('opacity', 0)
        .merge(this.select.linkPolygons)
        .style('stroke', function(d) {
          return elem.getLinkColor(d.rel_type);
        })
        .transition()
        .duration(transitionDuration)
        .style('stroke-width', function(d) {
          return elem.linkWeightScale(d.weight);
        })
        .transition()
        .duration(transitionDuration)
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)
        .transition()
        .duration(transitionDuration)
        .style('opacity', 0.3);


    // node enter selection
    this.select.nodeCircles.enter()
        .append('circle')
        .attr('class', 'nodeCircle')
        .style('opacity', 0)
        .merge(this.select.nodeCircles)
        .each(function() {
          d3.select(this).moveToFront();
        })
        .transition()
        .duration(transitionDuration)
        .attr('r', function(d) {
          return elem.nodeRadiusScale(d.weight);
        })
        .style('fill', function(d) {
          return elem.getGroupColor(d.group);
        })
        .transition()
        .duration(transitionDuration)
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
        .transition()
        .duration(transitionDuration)
        .style('opacity', 1);

    this.highlight();
  }

  update(newDate) {
    newDate = newDate.add(this.offset, 'days');
    this.current.links = this.f.filterLinks(newDate, this.linkType, this.data.links);
    this.updateLinkedByIndex(this.current.links);
    this.calculateNodeWeight(this.data.nodes, this.current.links);
    this.current.nodes = this.f.filterNodes(this.data.nodes, this.current.links);
    this.current.groups = this.f.filterGroups(this.groups, newDate);
    this.current.nodes = this.reassignGroups(this.current.nodes, this.current.groups);

    const workerOpts = {
      nodes: this.current.nodes,
      links: this.current.links,
      forceProperties: this.forceProperties,
      chart: {width: this.chartWidth, height: this.chartHeight},
    };

    const event = this.simulate(workerOpts);
    this.current.nodes = event.nodes;
    this.current.links = event.links;
    this.draw();
  }

  isConnected(a, b) {
    return this.linkedByIndex[a.id + ',' + b.id] === 1 || this.linkedByIndex[b.id + ',' + a.id] === 1 || a.id === b.id;
  }

  calculateNodeWeight(node, link) {
    node.forEach(function(d) {
      d.weight = link.filter(function(l) {
        return l.source === d.id || l.target === d.id;
      }).length;
    });
  }

  updateLinkedByIndex(linksSelection) {
    this.linkedByIndex = {};
    const elem = this;
    linksSelection.forEach(function(d) {
      if ((typeof d.source) === 'object') {
        elem.linkedByIndex[d.source.id + ',' + d.target.id] = 1;
      } else {
        elem.linkedByIndex[d.source + ',' + d.target] = 1;
      }
    });
  }

  highlight() {
    const elem = this;

    function emphasize(d, hoverNode) {
      if (!elem.highlightLocked) {
        elem.highlightActive = true;

        d3.selectAll('.nodeCircle').classed('passive', function(o) {
          return elem.isConnected(d, o) ? false : true;
        });

        d3.selectAll('.linkPolygon').classed('passive', function(o) {
          return o.source === d || o.target === d ? false : true;
        });

        d3.selectAll('.passive')
            .transition()
            .duration(500)
            .style('opacity', 0.05);
      }
    }

    function equalize() {
      elem.highlightActive = false;

      d3.selectAll('.nodeCircle.passive')
          .transition()
          .duration(500)
          .style('opacity', 1);

      d3.selectAll('.linkPolygon.passive')
          .transition()
          .duration(500)
          .style('opacity', 0.3);

      d3.selectAll('.nodeCircle').classed('passive', false);
      d3.selectAll('.linkPolygon').classed('passive', false);
    }

    let tooltip;
    d3.selectAll('.nodeCircle')
        .on('mouseover', function(d) {
          emphasize(d, this);
          tooltip = new Tooltip(this, d);
        })
        .on('mouseout', function() {
          equalize();
          tooltip.hide();
        })

        .on('mouseup', function() {
          d3.selectAll('.nodeCircle,.focus')
              .attr('class', 'nodeCircle')
              .transition()
              .duration(500)
              .style('fill', 'white')
              .style('box-shadow', 'none');

          d3.select(this)
              .attr('class', 'nodeCircle focus')
              .transition()
              .duration(500)
              .style('fill', 'green')
              .style('box-shadow', '0 0 10px 5px rgba(255, 254, 254, 0.507');
        });
  }

  reassignGroups(nodes, groups) {
    if (groups !== undefined) {
      const nodeIDs = Object.keys(groups);

      nodeIDs.forEach(function(d) {
        const _d = +d;
        const nextNode = nodes.find((x) => x.id === _d);
        if (nextNode !== undefined) {
          nextNode.group = groups[d];
        } else {
          console.log('node not found. id: ' + d);
        }
      });
    }
    return nodes;
  }
}

class Slider {
  constructor(network) {
    this.network = network;

    this.width = this.network.chartWidth; // TODO: probably bad style. Create chart object instead? Or set global properties?
    this.minDate = this.network.minDate;
    this.maxDate = this.network.maxDate;

    this.select = {};
    this.select.slider = d3.select('.content-wrapper')
        .append('div')
        .attr('class', 'slider-wrapper')
        .append('div')
        .attr('class', 'slider');

    this.sliderTimeScale = d3.scaleTime()
        .range([0, d3.select('.slider').node().getBoundingClientRect().width])
        .domain([this.minDate, this.maxDate]);

    this.sliderScale = d3.scaleLinear()
        .domain([this.minDate, this.maxDate])
        .range([0, d3.select('.slider').node().getBoundingClientRect().width])
        .clamp(true);

    this.setStyle();
    this.dispatchEvents();
  }

  setStyle() {
    this.select.sliderAxisContainer = this.select.slider.append('div')
        .attr('class', 'slider-text'); // irritating class name

    this.select.sliderAxisContainer
        .append('svg')
        .attr('width', this.sliderWidth)
        .append('g')
        .attr('class', 'axis')
        .attr('id', 'main')
        .attr('transform', 'translate(0, 3)')
        .call(
            d3.axisBottom(this.sliderTimeScale)
                .ticks(d3.timeMonth.every(6))
                .tickFormat(d3.timeFormat('%b %y')));

    this.select.sliderTray = this.select.slider.append('div')
        .attr('class', 'slider-tray');

    this.select.sliderHandle = this.select.slider.append('div')
        .attr('class', 'slider-handle');

    this.select.sliderHandleIcon = this.select.sliderHandle.append('div')
        .attr('class', 'slider-handle-icon');
  }

  dispatchEvents() {
    this.dispatch = d3.dispatch('sliderChange', 'sliderEnd');

    const elem = this;
    this.select.slider.call(d3.drag()
        .on('drag', function() {
          elem.dispatch.call('sliderChange');
        })
        .on('end', function() {
          elem.dispatch.call('sliderChange');
          elem.dispatch.call('sliderEnd');
        }));

    this.dispatch
        .on('sliderChange', function() {
          const value = elem.sliderScale.invert(d3.mouse(elem.select.sliderTray.node())[0]);
          elem.select.sliderHandle.style('left', elem.sliderScale(value) + 'px');

          d3.selectAll('.s-chart-cursor')
              .attr('x', elem.sliderScale(value) + 'px'); // TODO: The object itself should be responsible for updating the position
        });

    this.dispatch
        .on('sliderEnd', function() {
          let value = elem.sliderScale.invert(d3.mouse(elem.select.sliderTray.node())[0]);
          value = Math.round(value);

          const newDate = moment(value).startOf(elem.network.discreteInterval);
          if (!newDate.isSame(elem.oldDate)) {
            elem.oldDate = moment(newDate);
            elem.network.update(newDate);
          }
        });
  }
}

class Filter {
  constructor(showLinkColor) {
    this.linkInterval = 30;
    this.showLinkColor = showLinkColor; // TODO: missplaced attribute. move to better fit.
  }

  filterNodes(nodes, links) {
    const linkedNodes = {};

    links.forEach(function(d) {
      if ((typeof d.source) === 'object') {
        linkedNodes[d.source.id] = 1;
        linkedNodes[d.target.id] = 1;
      } else {
        linkedNodes[d.source] = 1;
        linkedNodes[d.target] = 1;
      }
    });

    const filteredNodes = nodes.filter(function(d) {
      return linkedNodes[d.id] === 1;
    });

    const nodeIds = Object.keys(linkedNodes);
    nodeIds.forEach(function(d) {
      const res = nodes.find((x) => x.id === +d);
      if (res === undefined) {
        console.log('node missing ' + d);
      }
    });

    return filteredNodes;
  }

  filterLinks(date, type, links) {
    links = this._forDate(date, links);
    links = this._forType(type, links);
    links = this._consolidate(links);
    return links;
  }

  filterGroups(groups, date) {
    let dstring = date.format('YYYY-MM-DD');
    let res = groups[dstring];

    if (res === undefined) {
      dstring = moment(date).add(1, 'day').format('YYYY-MM-DD');
      res = groups[dstring];
    }

    if (res === undefined) {
      dstring = moment(date).subtract(1, 'day').format('YYYY-MM-DD');
      res = groups[dstring];
    }

    return res;
  }

  _forDate(date, links) {
    date = moment(date);
    const minDate = moment(date).subtract(this.linkInterval, 'days');
    links = links.filter(
        function(d) {
          return moment(d.timestamp).isSameOrBefore(date) && moment(d.timestamp).isSameOrAfter(minDate);
        }
    );
    return links;
  }

  _forType(linkType, links) {
    links = links.filter(function(d) {
      if (linkType === 'all') {
        return true;
      } else {
        return d.rel_type === linkType;
      }
    });

    return links;
  }

  _consolidate(links) {
    const elem = this;
    const linkMap = d3.nest()
        .key(function(d) {
          return elem.showLinkColor ? d.rel_type : 'grey';
        })
        .key(function(d) {
          return d.source;
        })
        .key(function(d) {
          return d.target;
        })
        .rollup(function(values) {
          return d3.sum(values, function(d) {
            return 1;
          });
        })
        .object(links);

    // TODO: There should be a much cleaner way to solve this...
    // probably i could flatten the object like this:
    // https://stackoverflow.com/questions/14270011/flatten-an-object-hierarchy-created-with-d3-js-nesting
    const typeKeys = Object.keys(linkMap);
    const resArray = [];
    for (let i = 0; i < typeKeys.length; ++i) {
      const currentTypeData = linkMap[typeKeys[i]];
      const sourceKeys = Object.keys(currentTypeData);
      for (let j = 0; j < sourceKeys.length; ++j) {
        const currentSourceData = currentTypeData[sourceKeys[j]];
        const targetKeys = Object.keys(currentSourceData);
        for (let k = 0; k < targetKeys.length; ++k) {
          const weight = currentSourceData[targetKeys[k]];
          resArray.push({
            'source': +sourceKeys[j],
            'target': +targetKeys[k],
            'weight': +weight,
            'rel_type': typeKeys[i],
            'link_id': sourceKeys[j] + '-' + targetKeys[k],
          });
        }
      }
    }
    return resArray;
  }
}

