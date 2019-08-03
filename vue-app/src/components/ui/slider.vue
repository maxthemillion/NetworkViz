<template>
    <div class='slider'>
        <div class='slider-text'></div>
        <div class='slider-tray'></div>
        <div class='slider-handle'>
            <div class='slider-handle-icon'></div>
        </div>
    </div>
</template>

<script>
import * as d3 from "d3";
import * as moment from "moment";

export default {
    name: 'Slider',
    props: {
        network: Object,
    },
    watch: {
        network: function(){this.generate()}
    },
    methods:{
        generate: function() {
            this.setUp();
            this.setStyle();
            this.dispatchEvents();
        },
        setUp: function() { 
            this.width = this.network.chartWidth; // TODO: probably bad style. Create chart object instead? Or set global properties?
            this.height = '50';
            this.date = {
                min: this.network.date.min, 
                max: this.network.date.max
            };

            this.select = {};
            this.select.slider = d3.select('.slider')

            this.sliderTimeScale = d3.scaleTime() // TODO: do I really need 2 scales here?
                .domain([this.date.min, this.date.max])
                .range([0, this.select.slider.node().getBoundingClientRect().width])

            this.sliderScale = d3.scaleLinear()
                .domain([this.date.min, this.date.max])
                .range([0, this.select.slider.node().getBoundingClientRect().width])
                .clamp(true);
        },
        setStyle : function() {
            this.select.sliderAxisContainer = d3.select('.slider-text'); // irritating class name

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

            this.select.sliderTray = d3.select('.slider-tray');

            this.select.sliderHandle = d3.select('.slider-handle');
        },
        dispatchEvents: function() {
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
                const date = _this.sliderScale.invert(_d3.mouse(_this.select.sliderTray.node())[0]);
                _this.$emit('dateSelect', moment(date))
                _this.updateHandlePosition(date)
                });

            this.dispatch
                .on('sliderEnd', function() {
                let value = _this.sliderScale.invert(_d3.mouse(_this.select.sliderTray.node())[0]);
                value = Math.round(value);

                const newDate = moment(value).startOf(_this.network.discreteInterval);
                if (!newDate.isSame(_this.oldDate)) {
                    _this.updateHandlePosition(newDate)
                    _this.$emit('dateSelect', moment(newDate))
                    _this.oldDate = moment(newDate);
                    _this.network.update(newDate);
                }
                });
        },
        updateHandlePosition: function(date){
            this.select.sliderHandle.style('left', this.sliderScale(date) + 'px');
        }
    },
    mounted(){
        this.generate();
    }
}
</script>

<style>

.slider {
  position: relative;
  margin-bottom: 20px;
  width: 100%;
  margin: 0 auto;
  height: 30px;
}

.slider-text {
  position: absolute;
}

.slider-tray {
  position: absolute;
  width: 100%;
  height: 2px;
  border: solid 1px rgb(160, 160, 160);
  border-top-color: #aaa;
  border-radius: 4px;
  background-color: #8c8d9c;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
}

.slider-handle {
  position: absolute;
}

.slider-handle-icon {
  width: 14px;
  height: 14px;
  border: solid 1px #aaa;
  position: absolute;
  border-radius: 10px;
  background-color: #6200ee;
  box-shadow: 0 0 10px 5px rgba(98, 0, 238, 0.507);
  top: -7px;
  left: -7px;
}
</style>
