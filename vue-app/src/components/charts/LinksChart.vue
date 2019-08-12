<script>
import Linechart from "./LineChart.vue";
import * as moment from "moment";
import * as d3 from "d3";

export default {
  name: "LinksChart",
  mixins: [Linechart],
  data() {
    return {
      dataFunc: this.calcNoLinks,
      title: "No of Links"
    };
  },
  methods: {
    calcNoLinks: function() {
      // const cDate = moment(this.date.min);
      const linkCount = d3
        .nest()
        .key(function(d) {
          return moment(d.timestamp).format("YYYY-WW");
        })
        .rollup(function(values) {
          return d3.sum(values, function() {
            return 1;
          });
        })
        .entries(this.data.links)
        .sort(function(a, b) {
          return d3.ascending(a.key, b.key);
        });
      return linkCount;
    }
  },
  mounted() {}
};
</script>
