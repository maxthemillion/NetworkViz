importScripts("//cdnjs.cloudflare.com/ajax/libs/d3/4.2.3/d3.js");

onmessage = function (event) {

  let nodes = event.data.nodes
  let links = event.data.links
  let center = event.data.center

  let forceProperties = event.data.forceProperties
  let chartWidth = event.data.chartWidth
  let chartHeight = event.data.chartHeight

  // define simulation
  simulation = d3.forceSimulation()
    .force('y',
      d3.forceX(chartWidth / 2).strength(0.4))
    .force('x',
      d3.forceY(chartHeight / 2).strength(0.6))
    .force('charge', d3.forceManyBody().strength(forceProperties.chargeStrength))
    .force('link',
      d3.forceLink().id(
        function (d) {
          return d.id;
        }))
    .force(
      'collide',
      d3.forceCollide(function (d) {
        return d.r + forceProperties.nodePadding;
      })
        .strength(forceProperties.collideStrength)
        .iterations(forceProperties.collideIterations));

  
  simulation.nodes(nodes);
  simulation.force('link').links(links);


  simulation.alphaMin(0.01);
  simulation.stop();

  for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
    simulation.tick();
  }

  postMessage({ nodes: nodes, links: links });

};