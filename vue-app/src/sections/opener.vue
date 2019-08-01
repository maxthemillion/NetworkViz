<template>
    <div id='opener'>
        <div id='title-wrapper'> 
        <div id='main-title'>
            <h1>Explore GitHub Communication Networks!</h1>
        </div> 
        <div id='sub-title'>Choose a project:</div>
        <div id='selector-wrapper'>
            <select id='selector'>
            </select>
        </div>
        </div>
        <div id='caret'></div>
    </div>
</template>


<script>
import * as d3 from "d3";
const transitionDuration = 1000;
const projectNames = ['OneDrive', 'waffleio', 'getnikola', 'Tribler', 'BobPalmer', 'novus', 'rathena', 'gatsbyjs'];

export default {
  name: "Opener",
  props: {},
  methods: {
    showSubtitle: function() {
      d3
        .select("#sub-title")
        .transition()
        .duration(transitionDuration)
        .style("opacity", 1);
    },
    addOptions: function(){
        d3.select('#selector')
            .selectAll('option')
            .data(projectNames)
            .enter()
            .append('option')
            .attr('value', (d) => d)
            .text((d) => d);
    },
    showOptions: function(){
        d3.select('#selector')
            .transition()
            .delay(transitionDuration)
            .duration(transitionDuration)
            .style('opacity', 1)
    }
  },
  computed: {},
  mounted() {
      this.showSubtitle();
      this.addOptions();
      this.showOptions();
  }
};
</script>

<style scoped>
h1 {
    margin-top: 0px;
}

#opener {
    width: 100vw;
    height: 100vh;
    background-color: #6200EE;
    position: relative;
    top:0;
    left:0;
}

#title-wrapper{
    position:relative;
    left: 20vw;
    top: 33vh;
    width:66%;
}

#sub-title{
    opacity:0;
    position: relative;
    display: inline-block;
    margin-right: 1em;
    margin-bottom: 1em;
}

#main-title {
    text-shadow: 1px 1px #5a5a5a;
    position: relative;
  }

#selector-wrapper{
    display: inline-block;
}

#selector{
    opacity:0;
    position: relative;
    color: rgb(255, 255, 255);
    background-color: rgb(104, 62, 255);
    font-size: 1em; 
    border-color: #6200EE;
    border-radius:6px;
    display: inline;
    height:2em;
    padding:0 20px;
}

#caret {
    border-left: solid 50px transparent; 
    border-right: solid 50px transparent; 
    border-top: solid 50px #fff;
    filter: drop-shadow(0 0 10px #fff);
    height: 0; 
    width: 0; 
    position: absolute;
    left: 50%;
    bottom: 10%;
    margin-left: -50px;
  }

</style>


