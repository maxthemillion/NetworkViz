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
      title: "No of Links"
    };
  },
  methods: {
    readNoLinks: function() {
      const noLinks = [];
      const keys = Object.keys(this.data.no_links).sort();

      for (let i = 0; i < keys.length; ++i) {
        noLinks.push({
          key: moment(keys[i]).format("YYYY-WW"),
          value: +this.data.no_links[keys[i]]
        });
      }

      return noLinks;
    }
  },
  mounted() {}
};
</script>
