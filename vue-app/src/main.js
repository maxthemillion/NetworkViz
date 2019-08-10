import Vue from 'vue';
import App from './App.vue';
import VueWorker from 'vue-worker';
import 'typeface-aileron';

Vue.use(VueWorker);

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
