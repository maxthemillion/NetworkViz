<template>
  <div id="app">
    <Opener @user-select = 'printResponse'/>
    <Dataviz/>
  </div>
</template>

<script>
import './styles/global.css'
import Opener from "./sections/opener.vue";
import Dataviz from "./sections/dataviz.vue";

export default {
  name: "app",
  components: {
    Opener,
    Dataviz
  },
  data: function() {
    return {
      loadData: []  
    };
  },
  mounted() {
    console.log("App loaded");
    this.fetchData();
  },
  methods: {
    async fetchData() {
      //let data = await d3.json("./tweets.json");
      //this.loadData = data;
    },
    printResponse(d){
      console.log(d)
    }
  }
};
</script>
