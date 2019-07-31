<template>
  <div id="app">
    <!-- <HelloWorld msg="Welcome to Your Vue.js App" /> -->
    <Opener/>
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
    }
  }
};
</script>
