<template>
    <div id='content-wrapper'>
        <div id='inner-content-wrapper'>
            <div id='main-board'><h1>{{this.selected}}</h1></div>
            <div id='sub-board'>
                <div id='chart-wrapper'></div>
                <div id='legend'></div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
  name: "Dataviz",
  props: {
    selected: String,
    data: Object  
  }
};
</script>


<style lang="css" scoped>
h1{
  color:grey;
}

#content-wrapper {
  background-color: #e5e5e5;
  height: 100vh;
  min-width: 100vw;
  position: relative;
}

#inner-content-wrapper {
    position: relative;
    top: 2%;
    left: 2%;
    height:98%;
    width:96%;
}

#main-board {
  background-color: #ffffff;
  width: 66%;
  height: 90%;
  position: relative;
  display: inline-block;
  min-width: 300px;
  float: left;
}

#sub-board {
  background-color: #ffffff;
  height: 90%;
  width:32%;
  position: relative;
  left:2px;
  display: inline-block;
}

#sub-chart-wrapper {
  position: relative;
  width: 100%;
  height: 66%;
}

#legend {
  background-color: #ffffff;
  position: relative;
  width: 25%;
  height: 33%;
}
</style>
