<script>
import Linechart from "./LineChart.vue";
import * as moment from "moment";
import * as d3 from "d3";

export default {
  name: "LinksChart",
  mixins: [Linechart],
  data() {
    return {
      dataFunc: this.readNoLinks,
      formatLabel: this.formatL,
      title: "No of Links"
    };
  },
  methods: {
    readNoLinks: function() {
      const noLinks = [];
      const keys = Object.keys(this.data.no_links).sort();

      for (let i = 0; i < keys.length; ++i) {
        noLinks.push({
          key: moment(keys[i]).startOf('isoWeek').format("YYYY-MM-DD"),
          value: +this.data.no_links[keys[i]]
        });
      }

      return noLinks;
    },
    formatL: function(value) {
      const formatted = value
      return formatted
    }
  },
  mounted() {}
};
</script>
