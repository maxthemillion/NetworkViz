/* eslint-disable max-len */

/* global d3, moment */

class Network {
  constructor(data, opts) {
    this.links = data.links;
    this.groups = data.groups;
    this.nodes = data.nodes;

    this.data = data
    this.current = {}
    this.select = {}

    this.projectName = opts.project;
    this.svg = opts.svg;
    this.linkType = opts.linkType;

    this.filtered = false;
    this.highlightLocked = false;
    this.highlightActive = false;

    this.discreteInterval = 'week';

    this.nodeProperties = {
      'r_min': 6,
      'r_max': 100,
      'showColor': opts.showGroupColor,
    };

    this.linkProperties = {
      'width_min': 5,
      'width_max': 200,
      'showColor': opts.showLinkColor,
    };

    this.forceProperties = {
      'chargeStrength': -200,
      'nodePadding': 20,
      'collideStrength': 0.7,
      'collideIterations': 10,
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

    this.draw();
  }

  setSize() {
    this.clientWidth = document.querySelector('#graph').clientWidth;
    this.clientHeight = document.querySelector('#graph').clientHeight;
    this.margin = {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    };

    this.chartWidth = this.clientWidth - (this.margin.left + this.margin.right);
    this.chartHeight = this.clientHeight - (this.margin.top + this.margin.bottom);

    this.svg
        .attr('width', this.clientWidth)
        .attr('height', this.clientHeight);

    this.chartLayer
        .attr('width', this.chartWidth)
        .attr('height', this.chartHeight)
        .attr('transform', 'translate(' + [this.margin.left, this.margin.top] + ')');
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
      d.x = elem.clientWidth / 2 + (Math.random() * 100 - 50);
      d.y = elem.clientHeight / 2 + (Math.random() * 100 - 50);
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

    this.offset = this.minDate.diff(this.oldDate, 'days'); //negative
  }

  draw() {
  
    this.update(this.oldDate)
    //this.highlight(this.select.nodes, this.select.links);
  }

  update(newDate) {
    newDate = newDate.add(this.offset, 'days');
    this.current.links = this.f.filterLinks(newDate, this.linkType, this.data.links);
    this.updateLinkedByIndex(this.current.links);
    this.calculateNodeWeight(this.data.nodes, this.current.links);
    this.current.nodes = this.f.filterNodes(this.data.nodes, this.current.links);

    // define simulation
    this.simulation = d3.forceSimulation()
      .force('y',
        d3.forceX(this.chartWidth / 2).strength(0.4))
      .force('x',
        d3.forceY(this.chartHeight / 2).strength(0.6))
      .force("charge", d3.forceManyBody().strength(this.forceProperties.chargeStrength))
      .force('link',
        d3.forceLink().id(
          function (d) {
            return d.id;
          }))
      .force(
        'collide',
        d3.forceCollide(function (d) {
          return d.r + elem.forceProperties.nodePadding;
        })
          .strength(this.forceProperties.collideStrength)
          .iterations(this.forceProperties.collideIterations))
    
    this.simulation.alphaMin(0.01)
    this.simulation.stop()

    // link update
    this.select.linkPolygons = this.svg.selectAll('.linkPolygon')
      .data(this.current.links, function(d) {
        return d.link_id;
      });

    // link exit selection 
    this.select.linkPolygons.exit()
      .remove()

    // link enter selection
    this.select.linkPolygons.enter()
      .append('polygon')
      .attr('class', 'linkPolygon')

    // node update
    this.select.nodeCircles = this.svg.selectAll('.nodeCircle')
      .data(this.current.nodes, function(d) {
        return d.id;
      });

    // node exit selection
    this.select.nodeCircles.exit()
      .remove();

    // node enter selection
    const elem = this;
    this.select.nodeCircles.enter()
      .append('circle')
      .attr('class', 'nodeCircle')
      .merge(this.select.nodeCircles)
      .attr('r', function (d) {
        return elem.nodeRadiusScale(d.weight);
      })
      .style('fill', function (d) {
        return elem.getGroupColor(d.group);
      });

    this.simulation.nodes(this.current.nodes)
    this.simulation.force('link').links(this.current.links)
    
    function ticked() {
      d3.selectAll('.linkPolygon')
        .attr('points', function (d) {
          const points = [
            { 'x': d.source.x + elem.linkWeightScale(d.weight) / 2, 'y': d.source.y },
            { 'x': d.source.x - elem.linkWeightScale(d.weight) / 2, 'y': d.source.y },
            { 'x': d.target.x, 'y': d.target.y }];
  
          return points.map(
            function (d) {
              return [d.x, d.y].join(',');
            })
            .join(' ');
        });
  
      d3.selectAll('.nodeCircle')
        .attr('cx', function (d) {
          return d.x;
        })
        .attr('cy', function (d) {
          return d.y;
        });
    }

    this.simulation.on('tick', ticked)
    this.simulation.alpha(1).restart()
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

  highlight(node, link) {
    const elem = this;

    function activate(d, hoverNode) {
      if (!elem.highlightLocked) {
        elem.highlightActive = true;

        node.classed('node-active', function(o) {
          const isActive = elem.isConnected(d, o) ? true : false;
          return isActive;
        });

        node.classed('node-passive', function(o) {
          const isPassive = elem.isConnected(d, o) ? false : true;
          return isPassive;
        });

        link.classed('link-active', function(o) {
          return o.source === d || o.target === d ? true : false;
        });
        link.classed('link-passive', function(o) {
          return o.source === d || o.target === d ? false : true;
        });

        d3.select(hoverNode).classed('node-active', true);
        d3.select(hoverNode).classed('node-passive', false);
      }
    }

    function passivate() {
      if (!elem.highlightLocked) {
        elem.highlightActive = false;
        node.classed('node-active', false);
        node.classed('node-passive', false);
        link.classed('link-active', false);
        link.classed('link-passive', false);
      }
    }

    node.on('mouseover', function(d) {
      activate(d, this);
      tooltip.transition()
          .duration(200)
          .style('opacity', .9);
      tooltip.html(
          'id: ' + d.name + '<br/>' +
        'weight: ' + d.weight + '<br/>' +
        'group: ' + d.group)
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
    })
        .on('mouseout', function(d) {
          passivate();
          tooltip.transition()
              .duration(500)
              .style('opacity', 0);
        })
        .on('mouseup', function(d) {
          if (!highlightLocked) {
            highlightLocked = true;
          } else {
            highlightLocked = false;
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

    this.sliderTimeScale = d3.scaleTime()
        .range([0, this.width])
        .domain([this.minDate, this.maxDate]);

    this.sliderScale = d3.scaleLinear()
        .domain([this.minDate, this.maxDate])
        .range([0, this.width])
        .clamp(true);

    this.select = {};

    this.setStyle();
    this.dispatchEvents();
  }

  setStyle() {
    this.select.slider = d3.select('.slider')
        .style('width', this.sliderWidth + 'px')
        .style('height', '30px');
    //            .style("margin-left", margin.left + "px")
    this.select.sliderTray = this.select.slider.append('div')
        .attr('class', 'slider-tray');


    this.select.sliderHandle = this.select.slider.append('div')
        .attr('class', 'slider-handle');

    this.select.sliderAxisContainer = this.select.sliderTray.append('div')
        .attr('class', 'slider-text');

    this.select.sliderHandleIcon = this.select.sliderHandle.append('div')
        .attr('class', 'slider-handle-icon');

    this.select.sliderAxisContainer
        .append('svg')
        .attr('width', this.sliderWidth)
        .attr('heigt', 20)
        .append('g')
        .attr('class', 'axis-main')
        .attr('id', 'main')
        .attr('transform', 'translate(0, 8)')
        .call(
            d3.axisBottom(this.sliderTimeScale)
                .ticks(d3.timeMonth.every(6))
                .tickFormat(d3.timeFormat('%d %B %y')));
  }

  dispatchEvents() {
    this.dispatch = d3.dispatch('sliderChange', 'sliderEnd'); // define dispatch events

    const elem = this;
    this.select.slider.call(d3.drag()
        .on('drag', function() {
          elem.dispatch.call('sliderChange');
        })
        .on('end', function() {
          elem.dispatch.call('sliderEnd');
        }));

    this.dispatch
        .on('sliderChange', function() {
          let value = elem.sliderScale.invert(d3.mouse(elem.select.sliderTray.node())[0]);
          elem.select.sliderHandle.style('left', elem.sliderScale(value) + 'px');

          d3.selectAll('.s-chart-cursor')
              .attr('x', elem.sliderScale(value) + 'px');

          value = Math.round(value);

          const newDate = moment(value).startOf(elem.network.discreteInterval);
          if (!newDate.isSame(elem.oldDate)) {
            elem.oldDate = moment(newDate);
            elem.network.update(newDate);
          }

          d3.selectAll('.nodeCircle').each(function() {
            d3.select(this).moveToFront();
          });


          // TODO: where has this code part gone?
          // TODO: call update function on network!
          // TODO: do something in case the date has been changed!
        });
        // .on('sliderEnd', function() {
        //  elem.network.highlight(node, link);
        // });
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

class Title {
  constructor(info) {
    this.info = info[0];
    this.titleString = 'Communication network of project ' + this.info.owner + ' ' + this.info.repo;

    this.draw();
  }

  draw() {
    const title = d3.select('#title')
        .selectAll('text')
        .data([this.titleString])
        .enter()
        .append('h1');

    title.text(function(d) {
      return d;
    })
        .attr('x', '10%')
        .attr('y', '66%');

    const infoData =
      [this.info.owner + ' ' + this.repo + 'consists of ' +
        this.info.total_nodes + ' nodes with ' +
        this.info.total_links + ' links. ' +
        this.info.no_comments + ' comments have been analyzed.'];

    const infoText = d3.select('#infobox')
        .selectAll('text')
        .data(infoData)
        .enter()
        .append('p')
        .attr('class', 'infobox-text');

    infoText
        .text(function(d) {
          return d;
        })
        .attr('x', '20%')
        .attr('y', '66%');
  }
}

class Tooltip {
  constructor(element) {
    element
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
  }

  show() {
    this.style('opacity', 1);
  }

  hide() {
    this.style('opacity', 0);
  }
}

class InfoChart {
  constructor(opts) {
    this.elementHeight = 150;
    this.elementTitleHeight = 30;
    this.elementSpacing = 40;
  }

  draw(data) {
    // calculate number of nodes in network per time frame
    function calcNumNodes() {
      const cDate = moment(minDate);
      const numNodesData = [];

      while (cDate.isSameOrBefore(maxDate)) {
        const linkSelection = filterAndConsolidate(data.links, cDate, linkTypeSelected); // function is only defined inside class Network.
        const nodeSelection = filterNodes(data.nodes, linkSelection);
        numNodesData.push({'date': moment(cDate), 'num': nodeSelection.length});
        cDate.add(1, sliderInterval); // TODO: sliderinterval only exists as discreteInterval within network class
      }

      return numNodesData;
    }

    function calcNumLinks() {
      const cDate = moment(minDate);
      const numLinksData = [];

      while (cDate.isSameOrBefore(maxDate)) {
        const linkSelection = filterAndConsolidate(data.links, cDate, 'All');
        numLinksData.push({'date': moment(cDate), 'num': linkSelection.length});
        cDate.add(1, sliderInterval);
      }

      return numLinksData;
    }

    function calcNumGroups() {
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

    function readModularity() {
      const modularityData = [];

      const keys = Object.keys(data.modularity).sort();

      for (let i = 0; i < keys.length; ++i) {
        modularityData.push({'date': moment(keys[i]), 'num': +data.modularity[keys[i]]});
      }

      return modularityData;
    }

    function generateElement(dataFunc, title) {
      // set the ranges
      const elemData = dataFunc();
      const domainMax = d3.max(elemData, function(d) {
        return d.num;
      });

      const domainMin = d3.min(elemData, function(d) {
        return Math.min(d.num, 0);
      });

      const x = d3.scaleTime()
          .range([0, chartWidth])
          .domain([minDate, maxDate]);

      const y = d3.scaleLinear()
          .range([elementHeight, 0])
          .domain([domainMin, domainMax]);

      const valueline = d3.line()
          .x(function(d) {
            return x(d.date);
          })
          .y(function(d) {
            return y(d.num);
          });

      const sChartWrapper = wrapper.append('svg')
          .attr('class', 's-chart-wrapper')
          .attr('width', chartWidth)
          .attr('height', elementHeight + elementTitleHeight);

      sChartWrapper.append('svg')
          .attr('class', 's-chart-title')
          .attr('width', chartWidth)
          .attr('height', elementTitleHeight)
          .append('text')
          .attr('x', 0)
          .attr('y', elementTitleHeight / 2)
          .attr('text-anchor', 'left')
          .text(title);

      const sChart = sChartWrapper
          .append('svg')
          .attr('width', chartWidth)
          .attr('height', elementHeight)
          .attr('class', 's-chart')
          .append('g')
          .attr('transform', 'translate(0,' + elementTitleHeight + ')');

      sChart.append('path')
          .attr('class', 'chartLine')
          .attr('d', valueline(elemData));

      sChart.append('g')
          .attr('transform', 'translate(0,' + elementHeight + ')')
          .attr('class', 'axis')
          .call(
              d3.axisBottom(x)
                  .ticks(d3.timeMonth.every(6))
                  .tickFormat(d3.timeFormat('%d %B %y')));

      sChart.append('g')
          .attr('transform', 'translate(0,0)')
          .attr('class', 'axis')
          .call(d3.axisLeft(y).ticks(5));

      sChart.append('rect')
          .attr('class', 's-chart-cursor')
          .style('height', elementHeight);
    }

    generateElement(calcNumNodes, 'No. of Nodes');
    generateElement(calcNumLinks, 'No. of Links');
    generateElement(calcNumGroups, 'No. of Groups');
    generateElement(readModularity, 'Modularity');
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
  // #### parameters Start ####
  //
  //        'OneDrive',
  //        'waffleio',
  //        'getnikola',
  //        'Tribler',
  //        'BobPalmer',
  //        'novus',
  //        'rathena',
  //        'gatsbyjs'
  //
  const projectName = 'rathena';
  const dataName = 'data/viz_' + projectName + '.json';
  const wrapper = d3.select('body').append('div').attr('class', 'content-wrapper');
  const svg = wrapper.append('svg').attr('id', 'graph');
  wrapper.append('div').attr('class', 'slider');

  d3.json(dataName, function(data) {
    data = parseDateStrings(data);
    data = castIntegers(data);

    const netOpts = {
      'svg': svg,
      'linkType': 'all',
      'showGroupColor': true,
      'showLinkColor': false,
    };

    const title = new Title(data.info);
    const net = new Network(data, netOpts);
    const slider = new Slider(net);
  });

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
})();


