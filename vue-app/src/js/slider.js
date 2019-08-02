/* eslint-disable max-len */
import * as d3 from 'd3';
import * as moment from 'moment';

export default class Slider {
  constructor(network, elem) {
    this.network = network;

    this.width = this.network.chartWidth; // TODO: probably bad style. Create chart object instead? Or set global properties?
    this.height = '20';
    this.minDate = this.network.minDate;
    this.maxDate = this.network.maxDate;

    this.select = {};
    this.select.slider = elem
        .append('div')
        .attr('class', 'slider');

    this.sliderTimeScale = d3.scaleTime()
        .range([0, d3.select('.slider').node().getBoundingClientRect().width])
        .domain([this.minDate, this.maxDate]);

    this.sliderScale = d3.scaleLinear()
        .domain([this.minDate, this.maxDate])
        .range([0, d3.select('.slider').node().getBoundingClientRect().width])
        .clamp(true);

    debugger;

    this.setStyle();
    this.dispatchEvents();
  }

  setStyle() {
    this.select.sliderAxisContainer = this.select.slider.append('div')
        .attr('class', 'slider-text'); // irritating class name

    this.select.sliderAxisContainer
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height)
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
    const _d3 = d3;
    const _this = this;
    this.select.slider.call(d3.drag()
        .on('drag', function() {
          _this.dispatch.call('sliderChange');
        })
        .on('end', function() {
          _this.dispatch.call('sliderChange');
          _this.dispatch.call('sliderEnd');
        }));

    this.dispatch
        .on('sliderChange', function() {
          debugger;
          const value = _this.sliderScale.invert(_d3.mouse(_this.select.sliderTray.node())[0]);
          _this.select.sliderHandle.style('left', _this.sliderScale(value) + 'px');

          d3.selectAll('.s-chart-cursor')
              .attr('x', _this.sliderScale(value) + 'px'); // TODO: The object itself should be responsible for updating the position
        });

    this.dispatch
        .on('sliderEnd', function() {
          let value = _this.sliderScale.invert(_d3.mouse(_this.select.sliderTray.node())[0]);
          value = Math.round(value);

          const newDate = moment(value).startOf(_this.network.discreteInterval);
          if (!newDate.isSame(_this.oldDate)) {
            _this.oldDate = moment(newDate);
            _this.network.update(newDate);
          }
        });
  }
}


