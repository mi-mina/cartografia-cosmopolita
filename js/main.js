const width = 1000;
const height = 600;
const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const worldScale = (width - 1) / 2 / Math.PI;
console.log("worldScale", worldScale);

const worldProjection = d3
  .geoMollweide()
  .scale(worldScale)
  .translate([width / 2, height / 2]);

const sevillaProjection = d3
  .geoMercator()
  .scale(150000)
  .translate([width / 2, height / 2])
  .center([-5.990824922, 37.383448573000003]);

const worldPath = d3.geoPath().projection(worldProjection);
const sevillaPath = d3.geoPath().projection(sevillaProjection);

Promise.all([
  d3.csv("/data/garden/gardenAtlas.csv"),
  d3.json("data/maps/barrios-topo.json"),
  d3.json("data/maps/world-50m-topo.json")
]).then(([plantas, barrios, world]) => {
  // Do your stuff. Content of both files is now available in stations and svg
  console.log("plantas", plantas);
  console.log("barrios", barrios);
  console.log("world", world);

  svg
    .append("path")
    .datum(topojson.feature(world, world.objects.countries))
    .attr("d", worldPath)
    .style("fill", "none")
    .style("stroke", "black");

  svg
    .append("path")
    .datum(topojson.feature(barrios, barrios.objects.Barrios))
    .attr("d", sevillaPath)
    .style("fill", "none")
    .style("stroke", "red");

  const selection = plantas.slice(0, 100000);
  console.log("selection", selection);

  // svg
  //   .selectAll("circle")
  //   .data(selection)
  //   .enter()
  //   .append("circle")
  //   .attr("cx", d => sevillaProjection([+d.long, +d.lat])[0])
  //   .attr("cy", d => sevillaProjection([+d.long, +d.lat])[1])
  //   .attr("r", "2px")
  //   .attr("fill", "green");
});
