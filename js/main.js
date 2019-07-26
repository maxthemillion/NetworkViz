/* eslint-disable max-len */

/* global d3, moment */

class Network {
  constructor(data, opts) {
    this.links = data.links;
    this.groups = data.groups;
    this.nodes = data.nodes;

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
      'width_min': 1,
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
      return elem.linkProperties.showColor ? elem.linkColorScale(d) : 'white';
    };

    this.getGroupColor = function(d) {
      return elem.nodeProperties.showColor ? elem.groupColorScale(d) : 'grey';
    };

    this.setDates();
    this.initNodePositions();

    this.worker = new Worker('./js/worker.js');
    this.worker.onmessage = function(event) {
      elem.current.nodes = event.data.nodes;
      elem.current.links = event.data.links;
      elem.draw();
    };

    this.update(this.oldDate);
  }

  setSize() {
    this.svg
        .attr('width', this.chartWidth)
        .attr('height', this.chartHeight);

    this.chartLayer
        .attr('width', this.chartWidth)
        .attr('height', this.chartHeight)
        .attr('transform', 'translate(' + [0, 0] + ')');
  }

  setScales() {
    this.nodeRadiusScale = d3.scaleLinear()
        .domain([1, 200])
        .range([this.nodeProperties.r_min, this.nodeProperties.r_max]);

    this.linkWeightScale = d3.scaleLinear()
        .domain([1, 100])
        .range([this.linkProperties.width_min, this.linkProperties.width_max]);

    this.linkColorScale = d3.scaleOrdinal(d3.schemeCategory10);
    this.groupColorScale = d3.scaleOrdinal(d3.schemeCategory20);
  }

  appendChartLayer() {
    this.chartLayer = this.svg
        .append('g')
        .attr('class', 'chartLayer');
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
              return o.timestamp;
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
    this.select.linkPolygons = this.svg.selectAll('.linkPolygon')
        .data(this.current.links, linkKey);

    // node update
    this.select.nodeCircles = this.svg.selectAll('.nodeCircle')
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

    this.worker.postMessage({
      nodes: this.current.nodes,
      links: this.current.links,
      forceProperties: this.forceProperties,
      chart: {width: this.chartWidth, height: this.chartHeight},
    });
  }

  isConnected(a, b) {
    return this.linkedByIndex[a.id + ',' + b.id] === 1 || this.linkedByIndex[b.id + ',' + a.id] === 1;
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

    function activate(d, hoverNode) {
      if (!elem.highlightLocked) {
        elem.highlightActive = true;

        elem.select.nodeCircles.classed('node-active', function(o) {
          const isActive = elem.isConnected(d, o) ? true : false;
          return isActive;
        });

        elem.select.nodeCircles.classed('node-passive', function(o) {
          const isPassive = elem.isConnected(d, o) ? false : true;
          return isPassive;
        });

        elem.select.linkPolygons.classed('link-active', function(o) {
          return o.source === d || o.target === d ? true : false;
        });
        elem.select.linkPolygons.classed('link-passive', function(o) {
          return o.source === d || o.target === d ? false : true;
        });

        d3.select(hoverNode).classed('node-active', true);
        d3.select(hoverNode).classed('node-passive', false);
      }
    }

    function passivate() {
      if (!elem.highlightLocked) {
        elem.highlightActive = false;
        elem.select.nodeCircles.classed('node-active', false);
        elem.select.nodeCircles.classed('node-passive', false);
        elem.select.linkPolygons.classed('link-active', false);
        elem.select.linkPolygons.classed('link-passive', false);
      }
    }

    let tooltip;
    d3.selectAll('.nodeCircle')
        .on('mouseover', function(d) {
          activate(d, this);
          tooltip = new Tooltip(this, d);
        })
        .on('mouseout', function(d) {
          passivate();
          tooltip.hide();
        })

        .on('mouseup', function(d) {
          if (!elem.highlightLocked) {
            elem.highlightLocked = true;
          } else {
            elem.highlightLocked = false;
            passivate();
          }
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
          return d.timestamp.isSameOrBefore(date) && d.timestamp.isSameOrAfter(minDate);
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

class Tooltip {
  constructor(element, d) {
    const data = ['id: ' + d.name, 'group: ' + d.group];

    this.select = d3.select('#graph')
        .append('text')
        .attr('class', 'tooltip')
        .selectAll('tspan')
        .data(data)
        .enter()
        .append('tspan')
        .attr('x', parseFloat(element.getAttribute('cx')) - 20 + 'px')
        .attr('y', parseFloat(element.getAttribute('cy')) - 20 + 'px')
        .attr('dx', '0')
        .attr('dy', function(d, i) {
          return (1 * i - 1) + 'em';
        })
        .text((d) => d)
        .style('opacity', 0);

    this.show();
  }

  show() {
    this.select
        .transition('tooltip-show')
        .duration(200)
        .style('opacity', 0.9);
  }

  hide() {
    this.select
        .transition('tooltip-hide')
        .duration(200)
        .style('opacity', 0)
        .remove();
  }
}


class TimeSeriesChart {
  constructor(data, opts) {
    this.width = opts.width;
    this.height = 80;
    this.titleHeight = 0;
    this.data = data;
    this.minDate = opts.minDate;
    this.maxDate = opts.maxDate;
  }

  draw(dataFunc) {
    const chartData = dataFunc(this.data, this);
    const domainMax = d3.max(chartData, (d) => d.num);
    const domainMin = d3.min(chartData, (d) => Math.min(d.num, 0));

    const sChartWrapper = d3.select('.content-wrapper').append('div')
        .attr('class', 's-chart-wrapper')
        .attr('height', this.height);

    const sChart = sChartWrapper
        .append('div')
        .attr('class', 's-chart-wrapper-centering')
        .append('svg')
        .attr('class', 's-chart-area')
        .append('g')
        .attr('transform', 'translate(0,' + this.titleHeight + ')');

    sChartWrapper
        .append('div')
        .attr('class', 's-chart-title')
        .data([this.title])
        .text(d =>d);

    const x = d3.scaleTime()
        .range([0, d3.select('.s-chart-area').node().getBoundingClientRect().width])
        .domain([this.minDate, this.maxDate]);

    const y = d3.scaleLinear()
        .range([d3.select('.s-chart-area').node().getBoundingClientRect().height, 0])
        .domain([domainMin, domainMax]);

    const valueline = d3.line()
        .x((d) => x(d.date))
        .y((d) => y(d.num));

    sChart.append('path')
        .attr('class', 'chartLine')
        .attr('d', valueline(chartData));

    sChart.append('g')
        .attr('transform', 'translate(0,' + this.height + ')')
        .attr('class', 'axis')
        .attr('class', 'xaxis')
        .call(
            d3.axisBottom(x)
                .ticks(d3.timeMonth.every(6))
                .tickFormat(d3.timeFormat('%d %B %y')));

    sChart.append('g')
        .attr('transform', 'translate(0,0)')
        .attr('class', 'axis')
        .attr('class', 'yaxis')
        .call(d3.axisLeft(y).tickValues([d3.min(chartData, (d) => d.num), d3.max(chartData, (d) => d.num)]));

    sChart.selectAll('.domain').remove();
    sChart.selectAll('.xaxis .tick').remove();
    sChart.selectAll('.tick line').remove();
    sChart.selectAll('.tick text').attr('x', -6);

    d3.selectAll('.s-chart-area').append('rect')
        .attr('class', 's-chart-cursor')
        .style('height', d3.select('.s-chart-area').node().getBoundingClientRect().height);
  }
}

class ModularityChart extends TimeSeriesChart {
  constructor(data, opts) {
    super(data, opts);
    this.title = 'Modularity';

    this.draw(this.readModularity);
  }

  readModularity(data) {
    const modularityData = [];
    const keys = Object.keys(data.modularity).sort();

    for (let i = 0; i < keys.length; ++i) {
      modularityData.push({'date': moment(keys[i]), 'num': +data.modularity[keys[i]]});
    }

    return modularityData;
  }
}

class NodeChart extends TimeSeriesChart {
  constructor(data, opts) {
    super(data, opts);
    this.filter = new Filter(opts.showLinkColor)
    this.discreteInterval = opts.discreteInterval;
    this.title = 'No. Nodes'

    this.draw(this.calcNumNodes);
  }

  calcNumNodes(data, _this) {
    const cDate = moment(_this.minDate);
    const numNodesData = [];

    while (cDate.isSameOrBefore(_this.maxDate)) {
      const linkSelection = _this.filter.filterLinks(cDate, 'all', data.links);
      const nodeSelection = _this.filter.filterNodes(data.nodes, linkSelection);
      numNodesData.push({'date': moment(cDate), 'num': nodeSelection.length});
      cDate.add(1, _this.discreteInterval); 
    }
    return numNodesData;
  }
}

class LinkChart extends TimeSeriesChart {
  constructor(data, opts) {
    super(data, opts);
    this.filter = new Filter(opts.showLinkColor)
    this.discreteInterval = opts.discreteInterval;
    this.title = 'No. Links'

    this.draw(this.calcNumLinks);
  }

  calcNumLinks(data, _this) {
    const cDate = moment(_this.minDate);
    const numLinksData = [];

    while (cDate.isSameOrBefore(_this.maxDate)) {
      const linkSelection = _this.filter.filterLinks(cDate, 'all', data.links);
      numLinksData.push({'date': moment(cDate), 'num': linkSelection.length}); // TODO: return cumulative weight of all nodes instead of no. links
      cDate.add(1, _this.discreteInterval);
    }

    return numLinksData;
  }
}

class GroupChart extends TimeSeriesChart {
  constructor(data) {
    super(data);
    this.draw(calcNumGroups);
  }

  calcNumGroups(data) {
    function getUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    const cDate = moment(minDate);
    const numGroupsData = [];

    while (cDate.isSameOrBefore(maxDate)) {
      const groupSelection = filterGroups(this.groups, cDate);
      let count = 0;
      if (groupSelection !== undefined) {
        const keys = Object.values(groupSelection);
        const unique = keys.filter(getUnique);
        count = unique.length;
      }

      numGroupsData.push({'date': moment(cDate), 'num': count});
      cDate.add(1, sliderInterval);
    }
    return numGroupsData;
  }
}

// prototype function to move SVG elements to front
// TODO: move this to where it fits. not in global scope.
d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};


!(function main() {
  const projectNames = ['OneDrive', 'waffleio', 'getnikola', 'Tribler', 'BobPalmer', 'novus', 'rathena', 'gatsbyjs'];
  let selected;

  const dropdownChange = function() {
    selected = d3.select(this).property('value'),
    d3.selectAll('.content-wrapper').remove();

    generatePage(selected);
  };

  const dropdown = d3.select('#dropdown')
      .append('select')
      .attr('class', 'dropdown')
      .on('change', dropdownChange);

  dropdown.selectAll('option')
      .data(projectNames)
      .enter()
      .append('option')
      .attr('value', (d) => d)
      .text((d) => d);


  function generatePage(selected) {
    const dataName = 'data/viz_' + selected + '.json';

    const wrapper = d3.select('body').append('div').attr('class', 'content-wrapper');
    const svg = wrapper.append('svg').attr('id', 'graph');

    d3.json(dataName, function(data) {
      data = parseDateStrings(data);
      data = castIntegers(data);

      const opts = {
        'svg': svg,
        'linkType': 'all',
        'showGroupColor': true,
        'showLinkColor': false,
        'minDate': moment(Object.keys(data.groups).sort()[0]),
        'maxDate': moment(Math.max.apply(Math, data.links.map((o) => o.timestamp))),
        'width': document.querySelector('#graph').clientWidth,
        'height': document.querySelector('#graph').clientHeight,
        'discreteInterval': 'week',
      };

      const net = new Network(data, opts);
      new Slider(net);
      new ModularityChart(data, opts);
      new NodeChart(data, opts)
      new LinkChart(data, opts)
    });
  }

  function parseDateStrings(data) {
    data.links.forEach(function(d) {
      d.timestamp = moment(d.timestamp);
    });
    return data;
  }

  function castIntegers(data) {
    data.nodes.forEach(function(d) {
      d.id = +d.id;
    });
    data.links.forEach(function(d) {
      d.source = +d.source;
      d.target = +d.target;
    });
    return data;
  }

  selected = d3.select('.dropdown').property('value');
  generatePage(selected);
})();


