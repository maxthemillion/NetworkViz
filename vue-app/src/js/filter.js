import * as d3 from "d3";
import * as moment from "moment";

export default class Filter {
  constructor(showLinkColor) {
    this.showLinkColor = showLinkColor; // TODO: missplaced attribute. move to better fit.
    this._d3 = d3;
  }

  filterNodes(nodes, links) {
    const linkedNodes = {};

    links.forEach(function(d) {
      if (typeof d.source === "object") {
        linkedNodes[d.source.id] = 1;
        linkedNodes[d.target.id] = 1;
      } else {
        linkedNodes[d.source] = 1;
        linkedNodes[d.target] = 1;
      }
    });

    const filteredNodes = nodes.filter(function(d) {
      return linkedNodes[d.id] === 1;
    });

    const nodeIds = Object.keys(linkedNodes);
    nodeIds.forEach(function(d) {
      const res = nodes.find(x => x.id === +d);
      if (res === undefined) {
        console.log("node missing " + d);
      }
    });

    return filteredNodes;
  }

  filterLinks(date, links) {
    links = this._forDate(date, links);
    links = this._consolidate(links);
    return links;
  }

  filterGroups(groups, date) {
    let dstring = date.format("YYYY-MM-DD");
    let res = groups[dstring];

    if (res === undefined) {
      dstring = moment(date)
        .add(1, "day")
        .format("YYYY-MM-DD");
      res = groups[dstring];
    }

    if (res === undefined) {
      dstring = moment(date)
        .subtract(1, "day")
        .format("YYYY-MM-DD");
      res = groups[dstring];
    }

    return res;
  }

  _forDate(date, links) {
    date = moment(date).startOf("isoWeek");

    links = d3
      .nest()
      .key(function(d) {
        return moment(d.timestamp)
          .startOf("isoWeek")
          .format("YYYY-MM-DD");
      })
      .map(links);

    return links["$" + date.format("YYYY-MM-DD")];
  }

  _consolidate(links) {
    const elem = this;
    const linkMap = d3
      .nest()
      .key(function(d) {
        return elem.showLinkColor ? d.rel_type : "grey";
      })
      .key(function(d) {
        return d.source;
      })
      .key(function(d) {
        return d.target;
      })
      .rollup(function(values) {
        return d3.sum(values, function() {
          return 1;
        });
      })
      .object(links);

    // TODO: There should be a much cleaner way to solve this...
    // probably i could flatten the object like this:
    // https://stackoverflow.com/questions/14270011/flatten-an-object-hierarchy-created-with-d3-js-nesting
    const typeKeys = Object.keys(linkMap);
    const resArray = [];
    for (let i = 0; i < typeKeys.length; ++i) {
      const currentTypeData = linkMap[typeKeys[i]];
      const sourceKeys = Object.keys(currentTypeData);
      for (let j = 0; j < sourceKeys.length; ++j) {
        const currentSourceData = currentTypeData[sourceKeys[j]];
        const targetKeys = Object.keys(currentSourceData);
        for (let k = 0; k < targetKeys.length; ++k) {
          const weight = currentSourceData[targetKeys[k]];
          resArray.push({
            source: +sourceKeys[j],
            target: +targetKeys[k],
            weight: +weight,
            rel_type: typeKeys[i],
            link_id: sourceKeys[j] + "-" + targetKeys[k]
          });
        }
      }
    }
    return resArray;
  }
}
