<script>
import Linechart from "./LineChart.vue";
import * as moment from "moment";

export default {
  name: "ModularityChart",
  mixins: [Linechart],
  data() {
    return {
      dataFunc: this.readModularity,
      formatLabel: this.formatL,
      title: "Modularity"
    };
  },
  methods: {
    readModularity: function() {
      const modularityData = [];
      const keys = Object.keys(this.data.modularity).sort();

      for (let i = 0; i < keys.length; ++i) {
        modularityData.push({
          key: moment(keys[i])
            .startOf("isoWeek")
            .format("YYYY-MM-DD"),
          value: +this.data.modularity[keys[i]]
        });
      }

      return modularityData;
    },

    formatL: function(value) {
      const formatted = value.toFixed(2);
      return formatted;
    }
  },
  mounted() {}
};
</script>
