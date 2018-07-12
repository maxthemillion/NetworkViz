
/* global d3, moment, minor */


!(function () {
    "use strict"
//#### parameters Start ####
<<<<<<< HEAD
//
//        'OneDrive',
//        'waffleio',
//        'getnikola',
//        'Tribler',
//        'BobPalmer',
//        'novus',
//        'rathena',
//        'gatsbyjs'
//

    var project_name = "novus"
    
    var filtered = false
    
    var dataName 
    if (filtered){
        dataName = "data/filtered/viz_" + project_name + ".json"
    } else {
        dataName = "data/viz_" + project_name + ".json"
    }

//show all or selected link types ("All", "Quote", "Mention", "first_reply")
=======
    //var dataName = "data_d3_d3.json";
    //var dataName = "data_Homebrew_brew.json"
    var dataName = "data/viz_OneDrive_16727251.json"
    
//show all or selected link types ("All", "Quote", "Mention")
>>>>>>> 186945e988ecbbed1b546ed295e4886f36f03f36
    var linkTypeSelected = "All"


//set the time interval (in days) over which links are being considered
//*caution:* changes in linkInterval will make a recalculation 
//of groups in the network neccessary
    var linkInterval = 30

//set the discrete slider intervals to prevent immediate recalculation ("day" "week", "month")
    var sliderInterval = "week"

//switch colors on and off
    var showGroupColor = true
    var showLinkColor = false

//set node properties
    var minNodeRadius = 4
    var maxNodeRadius = 30
    var minLinkWidth = 1
    var maxLinkWidth = 10

//set repulsion strength (<0)
    var chargeStrength = -80

//set collision parameters
    var nodePadding = 20
    var collideStrength = 0.7
    var collideIterations = 10

//set window size
    var width, height

    var linkedByIndex = {}

//supplementary charts height
    var elementHeight = 150
    var elementTitleHeight = 30
    var elementSpacing = 40

//#### parameters end ###
    var chartWidth, chartHeight
    var margin
    var wrapper = d3.select("body").append("div").attr("class", "content-wrapper")
    var svg = wrapper.append("svg").attr("id", "graph")
    var chartLayer = svg.append("g").attr("class", "chartLayer")
    var maxDate
    var minDate

    var highlightLocked = false
    var highlightActive = false

    var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

// prototype function to move SVG elements to front
    d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
            this.parentNode.appendChild(this)
        })
    }


    function main() {
        setSize()

        d3.json(dataName, function (myNetwork) {
            var data = myNetwork
            data = parseDateStrings(data)
            data = castIntegers(data)

            drawTitle(data.info)
            drawInfoBox(data.info)
            drawChart(data)
            drawSupplementaryCharts(data)
        })

    }

    function setSize() {
        width = document.querySelector("#graph").clientWidth
        height = document.querySelector("#graph").clientHeight

        margin = {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        }

        chartWidth = width - (margin.left + margin.right)
        chartHeight = height - (margin.top + margin.bottom)

        svg
                .attr("width", width)
                .attr("height", height)

        chartLayer
                .attr("width", chartWidth)
                .attr("height", chartHeight)
                .attr("transform", "translate(" + [margin.left, margin.top] + ")")
    }

    function filterAndConsolidate(links, date, linkType)  {
        var dateSelected = moment(date);
        var minDate = moment(dateSelected).subtract(linkInterval, "days");
        //filter for date
        var linksFiltered = links.filter(function (d) {
            return d.timestamp.isSameOrBefore(dateSelected) && d.timestamp.isSameOrAfter(minDate);
        });

        //filter for type
        linksFiltered = linksFiltered.filter(function (d) {
            if (linkType === "All") {
                return true;
            } else {
                return d.rel_type === linkType;
            }
        });
        return consolidate(linksFiltered);
    }

    function filterNodes(nodes, links) {
        var linkedNodes = {}

        links.forEach(function (d) {
            if ((typeof d.source) === 'object') {
                linkedNodes[d.source.id] = 1
                linkedNodes[d.target.id] = 1
            } else {
                linkedNodes[d.source] = 1
                linkedNodes[d.target] = 1
            }
        })

        var filteredNodes = nodes.filter(function (d) {
            return linkedNodes[d.id] === 1
        })

        var nodeIds = Object.keys(linkedNodes)
        nodeIds.forEach(function (d) {
            var res = nodes.find(x => x.id === +d)
            if (res === undefined) {
                console.log("node missing " + d)
            }
        })

        return filteredNodes
    }

    function parseDateStrings(data) {

        data.links.forEach(function (d) {
            d.timestamp = moment(d.timestamp);
        })
        return data;
    }

    function castIntegers(data) {
        data.nodes.forEach(function (d) {
            d.id = +d.id
        })
        data.links.forEach(function (d) {
            d.source = +d.source
            d.target = +d.target
        })
        return data
    }

    function isConnected(a, b) {
        return linkedByIndex[a.id + "," + b.id] === 1 || linkedByIndex[b.id + "," + a.id] === 1
    }

    function setInitialPosition(nodes) {
        nodes.forEach(function (d) {
            d.x = width / 2 + (Math.random() * 100 - 50);
            d.y = height / 2 + (Math.random() * 100 - 50);
        });
    }

    function calculateNodeWeight(node, link) {
        node.forEach(function (d) {
            d.weight = link.filter(function (l) {
                return l.source === d.id || l.target === d.id
            }).length
        })
    }

    function updateLinkedByIndex(linksSelection) {
        linkedByIndex = {}
        linksSelection.forEach(function (d) {
            if ((typeof d.source) === 'object') {
                linkedByIndex[d.source.id + "," + d.target.id] = 1
            } else {
                linkedByIndex[d.source + "," + d.target] = 1
            }
        })
    }

    function consolidate(links) {

        var linkMap = d3.nest()
                .key(function (d) {
                    return d.rel_type;
                })
                .key(function (d) {
                    return d.source;
                })
                .key(function (d) {
                    return d.target;
                })
                .rollup(function (values) {
                    return d3.sum(values, function (d) {
                        return 1;
                    })
                })
                .object(links);
        var typeKeys = Object.keys(linkMap);
        var resArray = [];
        for (var i = 0; i < typeKeys.length; ++i) {

            var currentTypeData = linkMap[typeKeys[i]];
            var sourceKeys = Object.keys(currentTypeData);
            for (var j = 0; j < sourceKeys.length; ++j) {

                var currentSourceData = currentTypeData[sourceKeys[j]];
                var targetKeys = Object.keys(currentSourceData);
                for (var k = 0; k < targetKeys.length; ++k) {
                    var weight = currentSourceData[targetKeys[k]];
                    resArray.push({
                        "source": +sourceKeys[j],
                        "target": +targetKeys[k],
                        "weight": +weight,
                        "rel_type": typeKeys[i],
                        "link_id": sourceKeys[j] + "-" + targetKeys[k]
                    });
                }
            }
        }
        return resArray;
    }

    function filterGroups(allGroups, date) {
        //var dstring = date.format("YYYY-MM-DD")
        var dstring = date.format("YYYY-MM-DD")
        var res = allGroups[dstring]

        if (res === undefined) {
            dstring = moment(date).add(1, "day").format("YYYY-MM-DD")
            res = allGroups[dstring]
        }

        if (res === undefined) {
            dstring = moment(date).subtract(1, "day").format("YYYY-MM-DD")
            res = allGroups[dstring]
        }


        return res
    }

<<<<<<< HEAD
    function assignGroups(nodes, groups) {

        if (groups !== undefined) {
            var node_ids = Object.keys(groups)

            node_ids.forEach(function (d) {
                var _d = +d
                var nextNode = nodes.find(x => x.id === _d)
                if (nextNode !== undefined) {
                    nextNode.group = groups[d]
                } else {
                    console.log("node not found. id: " + d)
                }
            })
        }
        return nodes
=======
    function assignGroups(nodes, links, groups) {

            if (groups !== undefined) {
                var node_ids = Object.keys(groups)

                node_ids.forEach(function (d) {
                    var _d = +d
                    var nextNode = nodes.find(x => x.id === _d)
                    if (nextNode !== undefined) {
                        nextNode.group = groups[d]
                    } else {
                        console.log("node not found. id: " + d)
                    }
                })
            }
            return nodes
>>>>>>> 186945e988ecbbed1b546ed295e4886f36f03f36
    }

    function drawTitle(info) {
        var titleString = "Communication network for " + info[0].owner + " " + info[0].repo
        var titleData = [titleString]

        var title = d3.select("#title")
                .selectAll("text")
                .data(titleData)
                .enter()
                .append("h1")

        title
                .text(function (d) {
                    return d;
                })
                .attr("x", "20%")
                .attr("y", "66%")
    }

    function drawChart(data) {
        var nodesSelection, linksSelection

        /* initialize data variables
         * allLinksRaw:     holds links in raw format (unaggregated with weight equal to 1)
         * allGroups:       holds group information supplied with the data    
         * allNodes:        holds all nodes supplied with the data
         */

        var allLinksRaw = data.links
        var allGroups = data.groups
<<<<<<< HEAD
=======

        /* minDate = moment(Math.min.apply(Math, allLinksRaw.map(function (o) {
         return o.timestamp
         }))).add(linkInterval, "days") */

        minDate = moment(Object.keys(allGroups).sort()[0])

        var oldDate = moment(minDate);
        
        oldDate.startOf(sliderInterval);
        var offset = minDate.diff(oldDate, 'days');
        
        maxDate = moment(Math.max.apply(Math, allLinksRaw.map(function (o) {
            return o.timestamp;
        })));

        var links = filterAndConsolidate(allLinksRaw, minDate, linkTypeSelected)
>>>>>>> 186945e988ecbbed1b546ed295e4886f36f03f36
        var allNodes = data.nodes
        setInitialPosition(allNodes);

        /* Initialize d3 scale variables
         * 
         */

        var nodeRadiusScale = d3.scaleLinear()
                .domain([1, 200])
                .range([minNodeRadius, maxNodeRadius])

        var linkWeightScale = d3.scaleLinear()
                .domain([1, 100])
                .range([minLinkWidth, maxLinkWidth])

        var linkColorScale = d3.scaleOrdinal(d3.schemeCategory10)
        var linkColor = function (d) {
            return showLinkColor ? linkColorScale(d) : "grey"
        }

        var groupColorScale = d3.scaleOrdinal(d3.schemeCategory20)
        var groupColor = function (d) {
            return showGroupColor ? groupColorScale(d) : "grey"
        }

        /* initialize date variables:
         * 
         * minDate: set to the earliest date occurence in the data
         * oldDate: (date currently selected) set to the beginning of the slider
         *          interval which covers the minimum Date
         * offset:  difference in days between minDate and oldDate
         * maxDate: set to the last date occurence in the data
         * 
         */

        minDate = moment(Object.keys(allGroups).sort()[0])
        var oldDate = moment(minDate);
        oldDate.startOf(sliderInterval);
        var offset = minDate.diff(oldDate, 'days');
        maxDate = moment(Math.max.apply(Math, allLinksRaw.map(function (o) {
            return o.timestamp;
        })));

        /* select required data for the first period
         * 
         * links:   holds all links which fall into the first period and which
         *          are of the selected link type.
         * 
         * nodes:   holds all nodes, which are connected via links in the first 
         *          period
         * 
         * groups:  holds group information to all currently connected nodes
         * 
         */

        var links = filterAndConsolidate(allLinksRaw, minDate, linkTypeSelected)

        updateLinkedByIndex(links)
        calculateNodeWeight(allNodes, links)

        var nodes = filterNodes(allNodes, links)

        var groups = filterGroups(allGroups, minDate)
        nodes = assignGroups(nodes, groups)

        /* Initialize d3.simulation
         * 
         * simulation: 
         *   force link:       
         *   force collide:
         *   force charge:
         *   force center:
         *   force y:
         *   force x:
         * 
         * link: svg elements created from link data links
         *   
         */


        var simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function (d) {
                    return d.id;
                }))
                .force("collide", d3.forceCollide(function (d) {
                    return d.r + nodePadding
                }).strength(collideStrength).iterations(collideIterations))
                .force("charge", d3.forceManyBody().strength(chargeStrength))
                .force("center", d3.forceCenter(chartWidth / 2, chartHeight / 2))
                .force("y", d3.forceY(chartWidth / 2))
                .force("x", d3.forceX(chartHeight / 2))

        var link = svg
                .selectAll("line")
                .data(links)
                .enter()
                .append("line")
                .attr("class", "link")
                .style("stroke", function (d) {
                    return linkColor(d.rel_type)
                })
                .style("stroke-width", function (d) {
                    return linkWeightScale(d.weight)
                })

        var node = svg.selectAll("circle")
                .data(nodes)
                .enter()
                .append("circle")
                .attr("class", "node")
                .attr("r", function (d) {
                    return nodeRadiusScale(d.weight)
                })
                .style("fill", function (d) {
                    return groupColor(d.group)
                })

        /* define simulation steps
         * 
         */


        var ticked = function () {
            link
                    .attr("x1", function (d) {
                        return d.source.x
                    })
                    .attr("y1", function (d) {
                        return d.source.y
                    })
                    .attr("x2", function (d) {
                        return d.target.x
                    })
                    .attr("y2", function (d) {
                        return d.target.y
                    });
            node
                    .attr("cx", function (d) {
                        return d.x
                    })
                    .attr("cy", function (d) {
                        return d.y
                    });
        }


        /* Initialize the time slider element
         * 
         * 
         */

        var sliderWidth = width;
        var sliderScale = d3.scaleLinear()
                .domain([minDate, maxDate])
                .range([0, sliderWidth])
                .clamp(true)

        var dispatch = d3.dispatch("sliderChange", "sliderEnd") // define dispatch events

        wrapper
                .append("div")
                .attr("class", "slider")

        var slider = d3.select(".slider")
                .style("width", sliderWidth - margin.left + "px")
                .style("height", "30px")
                .style("margin-left", margin.left + "px")

        var sliderTray = slider.append("div")
                .attr("class", "slider-tray")

        var sliderAxisContainer = sliderTray.append("div")
                .attr("class", "slider-text")

        var sliderHandle = slider.append("div")
                .attr("class", "slider-handle")

        sliderHandle.append("div")
                .attr("class", "slider-handle-icon")

        slider.call(d3.drag()
                .on("drag", function () {
                    dispatch.call("sliderChange")
                })
                .on("end", function () {
                    dispatch.call("sliderEnd")
                }))

        var sliderTimeScale = d3.scaleTime()
                .range([0, sliderWidth - margin.left])
                .domain([minDate, maxDate])

        sliderAxisContainer
                .append("svg")
                .attr("width", sliderWidth)
                .attr("heigt", 20)
                .append("g")
                .attr("class", "axis-main")
                .attr("id", "main")
                .attr("transform", "translate(0, 8)")
                .call(d3.axisBottom(sliderTimeScale).tickFormat(d3.timeFormat("%m-%y")))
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-35)");

        dispatch.on("sliderChange", function () {

            var value = sliderScale.invert(d3.mouse(sliderTray.node())[0])

            sliderHandle.style("left", sliderScale(value) + "px")

            d3.selectAll(".s-chart-cursor")
                    .attr("x", sliderScale(value) + "px")

            value = Math.round(value);
<<<<<<< HEAD

            var newDate = moment(value).startOf(sliderInterval).add(offset, 'days');

            if (!newDate.isSame(oldDate)) {
                // do something in case the date has been changed

=======
            
            var newDate = moment(value).startOf(sliderInterval).add(offset, 'days');

            if (!newDate.isSame(oldDate)) {
>>>>>>> 186945e988ecbbed1b546ed295e4886f36f03f36
                oldDate = moment(newDate)

                linksSelection = filterAndConsolidate(allLinksRaw, newDate, linkTypeSelected);
                updateLinkedByIndex(linksSelection)

                nodesSelection = filterNodes(allNodes, linksSelection);
                calculateNodeWeight(nodesSelection, linksSelection)
                
                var groups = filterGroups(allGroups, oldDate)
                nodesSelection = assignGroups(nodesSelection, groups)

                //node enter update exit
                node = svg.selectAll(".node")
                        .data(nodesSelection, function (d) {
                            return d.id
                        })

                //Node enter update exit
                node.exit()
                        .remove()

                node = node.enter()
                        .append("circle")
                        .attr("class", "node")
                        .merge(node)
                        .attr("r", function (d) {
                            return nodeRadiusScale(d.weight);
                        })
                        .style("fill", function (d) {
                            return groupColor(d.group)
                        })

                //Link enter update exit
                link = svg.selectAll(".link")
                        .data(linksSelection, function (d) {
                            return d.link_id
                        })

                link.exit()
                        .remove();
                link = link.enter()
                        .append("line")
                        .attr("class", "link")
                        .merge(link)
                        .style("stroke", function (d) {
                            return linkColor(d.rel_type)
                        })
                        .style("stroke-width", function (d) {
                            return linkWeightScale(d.weight)
                        })


                var n = d3.selectAll(".link").size()

                node.each(function () {
                    d3.select(this).moveToFront()
                });

                simulation.nodes(nodesSelection)
                simulation.force("link").links(linksSelection)
                simulation.alpha(1).restart()
            }

        })
                .on("sliderEnd", function () {

                    highlight(node, link)
                })


        highlight(node, link)

        simulation
                .nodes(nodes)
                .on("tick", ticked)

        simulation.force("link")
                .links(links);
        simulation
                .force("charge", d3.forceManyBody().strength(chargeStrength))

    }


    function highlight(node, link) {

        function activate(d, hoverNode) {
            if (!highlightLocked) {
                highlightActive = true

                node.classed("node-active", function (o) {
                    var isActive = isConnected(d, o) ? true : false;
                    return isActive;
                });
                node.classed("node-passive", function (o) {
                    var isPassive = isConnected(d, o) ? false : true;
                    return isPassive;
                })

                link.classed("link-active", function (o) {
                    return o.source === d || o.target === d ? true : false;
                });
                link.classed("link-passive", function (o) {
                    return o.source === d || o.target === d ? false : true;
                })

                d3.select(hoverNode).classed("node-active", true);
                d3.select(hoverNode).classed("node-passive", false);
            }
        }

        function passivate() {
            if (!highlightLocked) {
                highlightActive = false

                node.classed("node-active", false);
                node.classed("node-passive", false)
                link.classed("link-active", false);
                link.classed("link-passive", false);
            }
        }

        node
                .on("mouseover", function (d) {
                    activate(d, this)
                    tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                    tooltip.html(
                            "id: " + d.name + "<br/>" + 
                            "weight: " + d.weight + "<br/>" +
                            "group: " + d.group)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px")
                })
                .on("mouseout", function (d) {
                    passivate()
                    tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                })
                .on("mouseup", function (d) {
                    if (!highlightLocked) {
                        highlightLocked = true
                    } else {
                        highlightLocked = false
                        passivate()
                    }
                })
    }

    function drawSupplementaryCharts(data) {

// calculate number of nodes in network per time frame
        function calcNumNodes() {
            var cDate = moment(minDate)
            var numNodesData = []

            while (cDate.isSameOrBefore(maxDate)) {
                var linkSelection = filterAndConsolidate(data.links, cDate, linkTypeSelected)
                var nodeSelection = filterNodes(data.nodes, linkSelection)
                numNodesData.push({"date": moment(cDate), "num": nodeSelection.length})
                cDate.add(1, sliderInterval)
            }

            return numNodesData
        }

        function calcNumLinks() {
            var cDate = moment(minDate)
            var numLinksData = []

            while (cDate.isSameOrBefore(maxDate)) {
                var linkSelection = filterAndConsolidate(data.links, cDate, "All")
                numLinksData.push({"date": moment(cDate), "num": linkSelection.length})
                cDate.add(1, sliderInterval)
            }

            return numLinksData
        }

        function calcNumGroups() {

            function getUnique(value, index, self) {
                return self.indexOf(value) === index;
            }

            var cDate = moment(minDate)
            var numGroupsData = []

            while (cDate.isSameOrBefore(maxDate)) {
                var groupSelection = filterGroups(data.groups, cDate)
                var count = 0
                if (groupSelection !== undefined) {
                    var keys = Object.values(groupSelection)
                    var unique = keys.filter(getUnique)
                    count = unique.length
                }

                numGroupsData.push({"date": moment(cDate), "num": count})
                cDate.add(1, sliderInterval)
            }
            return numGroupsData
        }

        function readModularity() {
            var modularityData = []

            var keys = Object.keys(data.modularity).sort()
            var cDate = moment(minDate)

            for (var i = 0; i < keys.length; ++i) {
                modularityData.push({"date": moment(keys[i]), "num": +data.modularity[keys[i]]})
            }

            return modularityData
        }

// gridlines in x axis function
        function make_x_gridlines(x) {
            return d3.axisBottom(x).ticks()
        }

// gridlines in y axis function
        function make_y_gridlines(y) {
            return d3.axisLeft(y)
                    .ticks(5)
        }

        function generateElement(dataFunc, title) {
            // set the ranges
            var elemData = dataFunc()
            var domain_max = d3.max(elemData, function (d) {
                return d.num
            })

            var domain_min = d3.min(elemData, function (d) {
                return Math.min(d.num, 0)
            })

            var x = d3.scaleTime().range([0, chartWidth]).domain([minDate, maxDate])
            var y = d3.scaleLinear().range([elementHeight, 0]).domain([domain_min, domain_max])

            var valueline = d3.line()
                    .x(function (d) {
                        return x(d.date);
                    })
                    .y(function (d) {
                        return y(d.num);
                    })

            var sChartWrapper = wrapper.append("svg")
                    .attr("class", "s-chart-wrapper")
                    .attr("width", chartWidth)
                    .attr("height", elementHeight + elementTitleHeight);

            var sChartTitle = sChartWrapper
                    .append("svg")
                    .attr("class", "s-chart-title")
                    .attr("width", chartWidth)
                    .attr("height", elementTitleHeight)
                    .append("text")
                    .attr("x", 0)
                    .attr("y", elementTitleHeight / 2)
                    .attr("text-anchor", "left")
                    .text(title)

            var sChart = sChartWrapper
                    .append("svg")
                    .attr("width", chartWidth)
                    .attr("height", elementHeight)
                    .attr("class", "s-chart")
                    .append("g")
                    .attr("transform", "translate(0," + elementTitleHeight + ")")

            // add the Y gridlines
            sChart.append("g")
                    .attr("class", "grid")
                    .call(make_y_gridlines(y)
                            .tickSize(-width + margin.left)
                            .tickFormat(""))

            sChart.append("path")
                    .attr("class", "chartLine")
                    .attr("d", valueline(elemData));

            sChart.append("g")
                    .attr("transform", "translate(0," + elementHeight + ")")
                    .attr("class", "axis")
                    .call(d3.axisBottom(x));

            sChart.append("g")
                    .attr("transform", "translate(0,0)")
                    .attr("class", "axis")
                    .call(d3.axisLeft(y))

            sChart.append("rect")
                    .attr("class", "s-chart-cursor")
                    .style("height", elementHeight)
        }

        generateElement(calcNumNodes, "Number of Nodes")
        generateElement(calcNumLinks, "Number of Links")
        generateElement(calcNumGroups, "Number of Groups")
        generateElement(readModularity, "Modularity")

    }

    function drawInfoBox(info) {
        var infoData = [
            "Project: " + info[0].owner + " " + info[0].repo,
            info[0].no_comments + " comments ",
            info[0].total_nodes + " nodes",
            info[0].size_core + " core members",
            info[0].total_links + " links",
            "intervals: " + sliderInterval,
            "moving timeframe length: " + 30 + " days"]


        var infoText = d3.select("#infobox")
                .selectAll("text")
                .data(infoData)
                .enter()
                .append("p")
                .attr("class", "infobox-text")

        infoText
                .text(function (d) {
                    return d;
                })
                .attr("x", "20%")
                .attr("y", "66%")
    }

    main()

}());