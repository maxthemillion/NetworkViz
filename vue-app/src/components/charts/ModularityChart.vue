<script>
import Linechart from "./LineChart.vue";
import * as moment from "moment";

export default {
  name: "ModularityChart",
  mixins: [Linechart],
  data() {
    return {
      dataFunc: this.readModularity,
      title: "Modularity"
    };
  },
  methods: {
    readModularity: function() {
      const modularityData = [];
      const keys = Object.keys(this.data.modularity).sort();

      for (let i = 0; i < keys.length; ++i) {
        modularityData.push({
          key: moment(keys[i]).format("YYYY-WW"),
          value: +this.data.modularity[keys[i]]
        });
      }

      return modularityData;
    }
  },
  mounted() {}
};
</script>
