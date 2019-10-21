import Vue from "vue";
import App from "./App.vue";
import VueWorker from "vue-worker";
import "typeface-aileron";
import * as d3 from "d3";

Vue.use(VueWorker);

Vue.config.productionTip = false;

d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};

new Vue({
  render: h => h(App)
}).$mount("#app");
