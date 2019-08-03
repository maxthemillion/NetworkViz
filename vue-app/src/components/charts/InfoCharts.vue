<template>
    <div>
        <div id='s-chart-title'>{{this.title}}</div>
        <div id='s-chart-wrapper'>
            <div id='s-chart-wrapper-centering'>
                <svg id='s-chart-area'></svg>
            </div>
        </div>
    </div>
</template>

<script>
import * as d3 from "d3";
import * as moment from "moment";

export default {
    name: "ModularityChart",
    props: {
        currentDate: {},
        data: {},
        opts: {},
    },

    data(){
        return {
            title: 'Modularity'
        }
    },

    watch:{
        currentDate: function(){this.updateCursorPosition(this.currentDate)}
    },

    methods:{
        setUp: function(dataFunc){
            this.width = this.opts.width;
            this.height = 80;
            this.titleHeight = 0;
            this.minDate = this.opts.minDate;
            this.maxDate = this.opts.maxDate;

            this.select = {}

            this.chartData = dataFunc(this.data, this);
            const domainMax = d3.max(this.chartData, (d) => d.num);
            const domainMin = d3.min(this.chartData, (d) => Math.min(d.num, 0));

            d3.select('#s-chart-wrapper')
                .attr('height', this.height);

            this.select.chart = d3.select('#s-chart-area')
                .append('g')
                .attr('transform', 'translate(0,' + this.titleHeight + ')');

            this.x = d3.scaleTime()
                .range([0, d3.select('#s-chart-area').node().getBoundingClientRect().width])
                .domain([this.minDate, this.maxDate]);

            this.y = d3.scaleLinear()
                .range([d3.select('#s-chart-area').node().getBoundingClientRect().height, 0])
                .domain([domainMin, domainMax]);
        },

        drawLine: function(){
            const _this = this
            const valueline = d3.line()
                .x((d) => _this.x(d.date))
                .y((d) => _this.y(d.num));

            this.select.chart.append('path')
                .attr('id', 'chartLine')
                .attr('d', valueline(this.chartData));
        },

        drawAxis: function() {
            this.select.chart.append('g')
                .attr('transform', 'translate(0,' + this.height + ')')
                .attr('class', 'axis')
                .attr('class', 'xaxis')
                .call(
                    d3.axisBottom(this.x)
                        .ticks(d3.timeMonth.every(6))
                        .tickFormat(d3.timeFormat('%d %B %y')));

            this.select.chart.append('g')
                .attr('transform', 'translate(0,0)')
                .attr('class', 'axis')
                .attr('class', 'yaxis')
                .call(d3.axisLeft(this.y).tickValues([d3.min(this.chartData, (d) => d.num), d3.max(this.chartData, (d) => d.num)]));

            this.select.chart.selectAll('.domain').remove();
            this.select.chart.selectAll('.xaxis .tick').remove();
            this.select.chart.selectAll('.tick line').remove();
            this.select.chart.selectAll('.tick text').attr('x', -6);

            d3.selectAll('#s-chart-area').append('rect')
                .attr('id', 's-chart-cursor')
                .style('height', d3.select('#s-chart-area').node().getBoundingClientRect().height);
            },
        
        readModularity: function(){
            const modularityData = [];
            const keys = Object.keys(this.data.modularity).sort();

            for (let i = 0; i < keys.length; ++i) {
                modularityData.push({ 'date': moment(keys[i]), 'num': +this.data.modularity[keys[i]] });
            }

            return modularityData;
        },
        
        updateCursorPosition: function(currentDate){
            d3.selectAll('#s-chart-cursor')
                    .attr('x', this.x(currentDate) + 'px'); 
        },
    },
    mounted() {
        this.setUp(this.readModularity)
        this.drawLine()
        this.drawAxis()    
    }
}

</script>

<style scoped>
#s-chart-wrapper{
    height: 100px;
    margin-bottom: 40px;
    display: flex;
    align-items: flex-end;
    position:relative;
}

#s-chart-wrapper-centering{
    display: flex;
    width: 90%;
    height: 100%;
    align-items: center;
    margin: 0 auto;
}

#s-chart-area{
    display: block; 
    width:100%;
    height: 70%;
    margin: 0 auto;
}

</style>

<style>

#s-chart-title{
    left:5%;
    color: grey;
    position:relative;
}

#chartLine {
    stroke: grey;
    stroke-width: 1px;
    opacity: 0.5;
    fill: transparent;
}

#s-chart-cursor{
    width: 1px;
    fill: deepskyblue;
    position: absolute;
    opacity: 1;
}
</style>

