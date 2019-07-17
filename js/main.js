
/* global d3, moment, minor */
class Network {
    constructor(opts) {
        this.data = opts.data
        this.project_name = opts.project
        this.filtered = false
        this.element = opts.element
        this.linkType = opts.linkType

        this.nodeProperties = {
            'r_min': 6,
            'r_max': 100,
            'showColor': opts.showGroupColor
        }
        
        this.linkProperties = {
            'width_min': 5,
            'width_max': 200,
            'showColor': opts.showLinkColor
        }

        this.forceProperties = {
            'chargeStrength': -200,
            'nodePadding': 20,
            'collideStrength': 0.7,
            'collideIterations': 10
        }

        this.nodeRadiusScale = d3.scaleLinear()
            .domain([1, 200])
            .range([minNodeRadius, maxNodeRadius])

        this.linkWeightScale = d3.scaleLinear()
            .domain([1, 100])
            .range([minLinkWidth, maxLinkWidth])

        this.linkColorScale = d3.scaleOrdinal(d3.schemeCategory10)

        this.minDate = moment(Object.keys(this.data.groups).sort()[0])
        this.maxDate = moment(
            Math.max.apply(
                Math,
                this.data.links.map(function (o) {
                    return o.timestamp;
                })
            )
        );

        var highlightLocked = false
        var highlightActive = false

        this.f = new Filter(this.data.links, this.data.nodes)
        
        this.linkedByIndex = {}
        this.setSize()
    }

    createChartLayer() {
        this.chartLayer = element
            .append("g")
            .attr("class", "chartLayer")
    }

    setSize() {
        this.width = document.querySelector("#graph").clientWidth
        this.height = document.querySelector("#graph").clientHeight
        this.margin = {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        }

        this.chartWidth = this.width - (this.margin.left + this.margin.right)
        this.chartHeight = this.height - (this.margin.top + this.margin.bottom)

        this.element
            .attr("width", this.width)
            .attr("height", this.height)

        this.chartLayer
            .attr("width", this.chartWidth)
            .attr("height", this.chartHeight)
            .attr("transform", "translate(" + [margin.left, margin.top] + ")")
    }

    draw() {
        var nodesSelection, linksSelection

        /* initialize data variables
         * allLinksRaw:     holds links in raw format (unaggregated with weight equal to 1)
         * allGroups:       holds group information supplied with the data    
         * allNodes:        holds all nodes supplied with the data
         */

        setInitialPosition(allNodes);

        var linkColor = function (d) {
            return this.linkProperties.showColor ? this.linkColorScale(d) : "grey"
        }

        var groupColor = function (d) {
            return this.nodeProperties.showColor ? this.groupColorScale(d) : "grey"
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


        var oldDate = moment(minDate);
        oldDate.startOf(sliderInterval);

        this.offset = minDate.diff(oldDate, 'days');

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
        
        var currentLinks = this.f.filterLinks(this.minDate, this.linkType)

        updateLinkedByIndex(currentLinks)
        calculateNodeWeight(this.data.nodes, currentLinks)

        var currentNodes = this.f.filterNodes(currentLinks)
        var currentGroups = this.f.filterGroups(allGroups, minDate)

        currentNodes = assignGroups(currentNodes, currentGroups) //Todo: is this required?

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

        this.simulation = d3.forceSimulation()
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

        var link = svg                      //link is a bad name for svg objects, what is better?
                .selectAll("polygon")
                .data(currentLinks)
                .enter()
                .append("polygon")
                .attr("class", "link")
                .style("fill", function (d) {
                    return linkColor(d.rel_type)
                })


        var node = svg.selectAll("circle")
                .data(currentNodes)
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
                .attr("points", function (d) {
                    var points = [
                        { 'x': d.source.x + this.linkWeightScale(d.weight) / 2, 'y': d.source.y },
                        { 'x': d.source.x - this.linkWeightScale(d.weight) / 2, 'y': d.source.y },
                        { 'x': d.target.x, 'y': d.target.y }]

                    return points.map(
                        function (d) { return [d.x, d.y].join(','); })
                        .join(" ")

                })

            node
                .attr("cx", function (d) {
                    return d.x
                })
                .attr("cy", function (d) {
                    return d.y
                });
        }

        /* Initialize the time slider element
         *  //TODO: put this to a separate class?
         * 
         */
        highlight(node, link)

        simulation
            .nodes(nodes)
            .on("tick", ticked)

        simulation.force("link")
            .links(links);
        simulation
            .force("charge", d3.forceManyBody().strength(chargeStrength))
    }

    update(newDate) {
        newDate = newDate.add(this.offset, 'days');

        var currentLinks = this.f.filterLinks(newDate, this.linkType);
        this.updateLinkedByIndex(currentLinks)

        var currentNodes = this.f.filterNodes(currentLinks);
        calculateNodeWeight(nodesSelection, linksSelection)

        var groups = this.f.filterGroups(newDate)
        currentNodes = assignGroups(currentNodes, groups)

        //node enter update exit
        node = svg.selectAll(".node")
            .data(currentNodes, function (d) {
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
                return this.nodeRadiusScale(d.weight);
            })
            .style("fill", function (d) {
                return this.groupColor(d.group)
            })

        //Link enter update exit
        link = svg.selectAll(".link")
            .data(currentLinks, function (d) {
                return d.link_id
            })

        link.exit()
            .remove();
        link = link.enter()
            .append("polygon")
            .attr("class", "link")
            .merge(link)
            .style("fill", function (d) {
                return this.linkColor(d.rel_type)
            })

        var n = d3.selectAll(".link").size() // required?

        node.each(function () {
            d3.select(this).moveToFront()
        });

        this.simulation.nodes(nodesSelection)
        this.simulation.force("link").links(linksSelection)
        this.simulation.alpha(1).restart()
    }

    isConnected(a, b) {
        return this.linkedByIndex[a.id + "," + b.id] === 1 || this.linkedByIndex[b.id + "," + a.id] === 1
    }

    setInitialPosition(nodes) {   //TODO: adjust parameters and argument calls
        nodes.forEach(function (d) {
            d.x = width / 2 + (Math.random() * 100 - 50);
            d.y = height / 2 + (Math.random() * 100 - 50);
        });
    }

    calculateNodeWeight(node, link) { //TODO: adjust parameters and argument calls
        node.forEach(function (d) {
            d.weight = link.filter(function (l) {
                return l.source === d.id || l.target === d.id
            }).length
        })
    }

    updateLinkedByIndex(linksSelection) { //TODO: adjust parameters and argument calls
        linkedByIndex = {}
        linksSelection.forEach(function (d) {
            if ((typeof d.source) === 'object') {
                linkedByIndex[d.source.id + "," + d.target.id] = 1
            } else {
                linkedByIndex[d.source + "," + d.target] = 1
            }
        })
    }

    highlight(node, link) {
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

        node.on("mouseover", function (d) {
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

    assignGroups(nodes, groups) {

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
    }
}

class Slider {
    constructor(network, opts){
        this.network = network

        this.width = opts.width
        this.minDate = opts.minDate
        this.maxDate = opts.maxDate

        this.sliderTimeScale = d3.scaleTime()
            .range([0, this.width])
            .domain([this.minDate, this.maxDate])
        
        this.scale = d3.scaleLinear()
            .domain([this.minDate, this.maxDate])
            .range([0, this.width])
            .clamp(true)

        this.select = {}

        this.setStyle()
        this.dispatchEvents()
    }

    setStyle(){
        this.select.slider = d3.select(".slider")
            .style("width", this.sliderWidth  + "px")
            .style("height", "30px")
//            .style("margin-left", margin.left + "px")
        this.select.sliderTray = this.select.slider.append("div")
            .attr("class", "slider-tray")


        this.select.sliderHandle = this.select.slider.append("div")
            .attr("class", "slider-handle")

        this.select.sliderAxisContainer = this.select.sliderTray.append("div")
            .attr("class", "slider-text")

        this.select.sliderHandleIcon = this.select.sliderHandle.append("div")
            .attr("class", "slider-handle-icon")

        this.select.sliderAxisContainer
            .append("svg")
            .attr("width", this.sliderWidth)
            .attr("heigt", 20)
            .append("g")
            .attr("class", "axis-main")
            .attr("id", "main")
            .attr("transform", "translate(0, 8)")
            .call(
                d3.axisBottom(this.sliderTimeScale)
                    .ticks(d3.timeMonth.every(6))
                    .tickFormat(d3.timeFormat("%d %B %y")))
    }

    dispatchEvents(){
        this.dispatch = d3.dispatch("sliderChange", "sliderEnd") // define dispatch events
        this.select.slider.call(d3.drag()
            .on("drag", function () {
                this.dispatch.call("sliderChange")
            })
            .on("end", function () {
                this.dispatch.call("sliderEnd")
            }))

        this.dispatch
            .on("sliderChange", function () {

                var value = this.sliderScale.invert(d3.mouse(sliderTray.node())[0])
                this.select.sliderHandle.style("left", this.sliderScale(value) + "px")

                d3.selectAll(".s-chart-cursor")
                    .attr("x", this.sliderScale(value) + "px")

                value = Math.round(value);

                var newDate = moment(value).startOf(sliderInterval)
                if (!newDate.isSame(this.oldDate)) {
                    this.oldDate = moment(newDate)
                    this.network.update(newDate)
                }

                // call update function on network


                // do something in case the date has been changed




            })
            .on("sliderEnd", function () {
                highlight(node, link)
            })
    }
}

class Filter{
    constructor(links, nodes){
        this.links = links
        this.nodes = nodes
    }

    filterNodes() {
        var linkedNodes = {}

        this.links.forEach(function (d) {
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

    filterLinks(date, type){
        this._forDate(date)
        this._forType(type)
        this._consolidate
        return this.links
    }

    filterGroups(allGroups, date) {
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

    _forDate(date) {
        date = moment(date);
        var minDate = moment(date).subtract(linkInterval, "days");
        this.links = this.links.filter(
            function (d) {
                return d.timestamp.isSameOrBefore(date) && d.timestamp.isSameOrAfter(minDate);
            }
        );
    }

    _forType(type) {
        this.links = this.links.filter(function (d) {
            if (type === "all") {
                return true;
            } else {
                return d.rel_type === linkType;
            }
        });
    }

    _consolidate() {
        var linkMap = d3.nest()
                .key(function (d) {
                    return showLinkColor ? d.rel_type : "grey"
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
                .object(this.links);
                
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
        this.links = resArray;
    }
}

class Title{
    constructor(info){ 
        this.info = info[0]
        this.titleString = "Communication network of project " + this.info.owner + " " + this.info.repo

        this.draw()
    }

    draw() {
        var title = d3.select("#title")
                .selectAll("text")
                .data([this.titleString])
                .enter()
                .append("h1")

        title.text(function (d) {return d;})
                .attr("x", "10%")
                .attr("y", "66%")

        var infoData = 
            [this.info.owner + " " + this.repo + "consists of " +
             this.info.total_nodes + " nodes with " +
             this.info.total_links + " links. " +
             this.info.no_comments + " comments have been analyzed."]

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
}

class Tooltip{
    constructor(element){
        element
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    }

    show(){
        this.style('opacity', 1)
    }

    hide(){
        this.style('opacity', 0)
    }
}


class InfoChart{
    constructor(opts){
        this.elementHeight = 150
        this.elementTitleHeight = 30
        this.elementSpacing = 40
    }

    draw(data) {
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

        function generateElement(dataFunc, title) {
            // set the ranges
            var elemData = dataFunc()
            var domainMax = d3.max(elemData, function (d) {
                return d.num
            })

            var domainMin = d3.min(elemData, function (d) {
                return Math.min(d.num, 0)
            })

            var x = d3.scaleTime()
                    .range([0, chartWidth])
                    .domain([minDate, maxDate])

            var y = d3.scaleLinear()
                    .range([elementHeight, 0])
                    .domain([domainMin, domainMax])

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

            sChartWrapper.append("svg")
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

            sChart.append("path")
                    .attr("class", "chartLine")
                    .attr("d", valueline(elemData))

            sChart.append("g")
                    .attr("transform", "translate(0," + elementHeight + ")")
                    .attr("class", "axis")
                    .call(
                        d3.axisBottom(x)
                        .ticks(d3.timeMonth.every(6))
                        .tickFormat(d3.timeFormat("%d %B %y")));

            sChart.append("g")
                    .attr("transform", "translate(0,0)")
                    .attr("class", "axis")
                    .call(d3.axisLeft(y).ticks(5))

            sChart.append("rect")
                    .attr("class", "s-chart-cursor")
                    .style("height", elementHeight)

        }

        generateElement(calcNumNodes, "No. of Nodes")
        generateElement(calcNumLinks, "No. of Links")
        generateElement(calcNumGroups, "No. of Groups")
        generateElement(readModularity, "Modularity")

    }
    
}

// prototype function to move SVG elements to front
d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this)
    })
}


!(function main() {

    //#### parameters Start ####
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
    var project_name = "rathena"
    var dataName = "data/viz_" + project_name + ".json"
    const wrapper = d3.select("body").append("div").attr("class", "content-wrapper")
    const svg = wrapper.append("svg").attr("id", "graph")
    const slider = wrapper.append("div").attr("class", "slider")

    d3.json(dataName, function (data) {

        data = parseDateStrings(data)
        data = castIntegers(data)

        var opts = {
            'data': data,
            'element': svg,
            'linkTypeSelected': 'all',
            'linkInterval': 30,
            'sliderInterval': 'week',
            'showGroupColor': true,
            'showLinkColor': true,
        }
        
        // const net = new Network(opts)
        const title = new Title(data.info)
        
    })

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

})();


