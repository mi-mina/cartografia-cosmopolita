const width = 1400;
const height = 800;

// const projection = d3
//   .geoMercator()
//   .scale(5500)
//   .translate([width / 2, height / 2 + 4000])
//   .rotate([2, 0, 0]);
//   .precision(0.1);

const origins = {
  Americano: "#34ad59",
  Africano: "#f4b342",
  "Oriental/Asiático": "#d52dac",
  Oceanía: "#6b6ecf",
  "Europeo/Mediterráneo": "#17becf"
};
const transparency = "80"; //50%

const projection = d3
  .geoCylindricalStereographic()
  // .scale(238)
  .scale(500000)
  // .translate([width / 2, height / 2 + 60])
  .translate([width / 2, height / 2])
  // .rotate([-11, 0, 0])
  // .rotate([7, 0, 0])
  .precision(0.1);

projection.center([-5.990684461, 37.383627226000002]);

const path = d3.geoPath().projection(projection);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id", "chart");

function type(d) {
  d.lat = +d.lat;
  d.long = +d.long;
  return d;
}

d3.queue()
  .defer(d3.csv, "data-plants/plants.csv", type) // Se puede añadir una función type
  .defer(d3.json, "data-maps/Barrios-topo.json")
  .defer(d3.json, "data-maps/gadm28_adm0_1_topo.json")
  .await(function(error, data, sevilla, mundo) {
    if (error) throw error;

    const plants = data; // .slice(0, 100000);
    console.log("plants", plants);

    const geometries = sevilla.objects.Barrios.geometries;
    geometries.forEach(function(e) {
      e.id = +e.id;
      return e;
    });

    console.log("data", data);
    console.log("sevilla", sevilla);

    const barrios = topojson.feature(sevilla, sevilla.objects.Barrios).features;

    const geometriesMundo = topojson.feature(mundo, mundo.objects.gadm28_adm0)
      .features;
    const mapContainer = svg.append("g").attr("id", "map");
    mapContainer
      .selectAll(".countries")
      .data(geometriesMundo)
      .enter()
      .append("path")
      .attr("class", "countries")
      .attr("d", path)
      .style("stroke", "grey")
      .style("stroke-width", 0.5)
      .style("fill", (d, i) => {
        return d.properties.ISO === "ATA" ? "transparent" : "white";
      });

    console.log("barrios", barrios);

    // svg
    //   .append("rect")
    //   .attr("width", width)
    //   .attr("height", height)
    //   .style("fill", "white");

    svg
      .selectAll(".barrios")
      .data(barrios)
      .enter()
      .append("path")
      .attr("class", "barrios")
      .attr("d", path)
      .style("stroke", "grey")
      .style("fill", "none");

    const bubbles = svg
      .selectAll(".bubbles")
      .data(plants)
      .enter()
      .append("g")
      .attr("class", "bubbles");

    bubbles
      // .selectAll(".circle")
      .append("circle")
      .attr("class", "circle")
      .attr("cx", d => projection([d.long, d.lat])[0])
      .attr("cy", d => projection([d.long, d.lat])[1])
      .attr("r", d => 1)
      .style("fill", d => origins[d.origin] + transparency);

    // bubbles
    //   .append("text")
    //   .attr("x", d => projection([d.long, d.lat])[0])
    //   .attr("y", d => projection([d.long, d.lat])[1])
    //   .attr("dy", "0.35em")
    //   .style("text-anchor", "middle")
    //   .style("font-size", "20px")
    //   .style("fill", "white")
    //   .text(d => d.value);

    // bubbles
    //   .append("text")
    //   .attr("x", d => projection([d.long, d.lat])[0])
    //   .attr(
    //     "y",
    //     d =>
    //       projection([d.long, d.lat])[1] +
    //       1.5 * Math.sqrt(Math.abs(d.value) / Math.PI) +
    //       15
    //   )
    //   .attr("dy", "0.35em")
    //   .style("text-anchor", "middle")
    //   .style("font-size", "18px")
    //   .style("fill", "black")
    //   .style("font-family", "Arial")
    //   .text(d => d.name);

    d3.select("#downloadImage").on("click", function() {
      saveSvgAsPng(d3.select("#chart").node(), "emissions.png", {
        scale: 2
      });
    });
  });
