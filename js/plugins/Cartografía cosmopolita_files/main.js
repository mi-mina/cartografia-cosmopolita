const width = document.body.clientWidth;
const height = width / 1.7778;
const pointTransparency = "ff"; // "80"; //50%
const shadeTransparency = "60"; // "80"; //50%
const originColors = {
  americano: "#34ad59",
  africano: "#f4b342",
  asiatico: "#d52dac",
  oceanico: "#6b6ecf",
  "europeo-mediterraneo": "#17becf"
};

// geographic scales
const worldScaleDymaxion = width / 6 / Math.PI;
const sevillaScale = width * 170;

// World proyection: Dymaxion
const worldProjection = d3
  .geoAirocean()
  .scale(worldScaleDymaxion)
  .translate([width / 2, height / 2]);

// Sevilla proyection
const sevillaProjection = d3
  .geoMercator()
  .scale(sevillaScale)
  .translate([width / 2, height / 2])
  .center([-5.95, 37.38]);

// Path generators
const worldPath = d3.geoPath().projection(worldProjection);
const sevillaPath = d3.geoPath().projection(sevillaProjection);

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("id", "chartSVG")
  .attr("width", width)
  .attr("height", height);

const graphContainer = svg.append("g");

Promise.all([
  d3.csv("/data/garden/gardenAtlas.csv"),
  d3.csv("/data/garden/paises_ISO3_origin.csv"),
  d3.json("data/maps/barrios-topo.json"),
  d3.json("data/maps/world-100m-topo.json")
]).then(([specimens, origins, barrios, world]) => {
  console.log("start");
  // console.log("specimens", specimens);

  const originsMap = {};
  origins.forEach(origen => {
    const id = Number(origen.UN);
    originsMap[id] = origen["origin"];
  });

  const africaGeometries = world.objects.countries.geometries.filter(
    country => {
      const countryId = Number(country.id);
      return originsMap[countryId] === "africano";
    }
  );
  const americaGeometries = world.objects.countries.geometries.filter(
    country => {
      const countryId = Number(country.id);
      return originsMap[countryId] === "americano";
    }
  );
  const asiaGeometries = world.objects.countries.geometries.filter(country => {
    const countryId = Number(country.id);
    return originsMap[countryId] === "asiatico";
  });
  const europaGeometries = world.objects.countries.geometries.filter(
    country => {
      const countryId = Number(country.id);
      return originsMap[countryId] === "europeo-mediterraneo";
    }
  );
  const oceaniaGeometries = world.objects.countries.geometries.filter(
    country => {
      const countryId = Number(country.id);
      return originsMap[countryId] === "oceanico";
    }
  );

  const originGeometries = [
    africaGeometries,
    americaGeometries,
    asiaGeometries,
    europaGeometries,
    oceaniaGeometries
  ];

  const africaSpecimens = specimens.filter(
    planta => planta.origin === "africano"
  );
  const americaSpecimens = specimens.filter(
    planta => planta.origin === "americano"
  );
  const asiaSpecimens = specimens.filter(
    planta => planta.origin === "asiatico"
  );
  const europaSpecimens = specimens.filter(
    planta => planta.origin === "europeo-mediterraneo"
  );
  const oceaniaSpecimens = specimens.filter(
    planta => planta.origin === "oceanico"
  );

  const worldSpecimens = [
    africaSpecimens,
    americaSpecimens,
    asiaSpecimens,
    europaSpecimens,
    oceaniaSpecimens
  ];

  worldSpecimens.sort((a, b) => b.length - a.length);

  // Draw functions //////////////////////////////

  const drawContinentsBorders = originGeometry => {
    graphContainer
      .append("path")
      .datum(topojson.merge(world, originGeometry))
      .attr("d", worldPath)
      .style("fill", "none")
      .style("stroke-width", "0.5px")
      .style("stroke", "#6b6ecf");
  };

  const drawContinentsShade = originGeometry => {
    graphContainer
      .append("path")
      .datum(topojson.merge(world, originGeometry))
      .attr("d", worldPath)
      .style("fill", "#6b6ecf" + shadeTransparency)
      .style("stroke", "none");
  };

  // Barrios Sevilla
  const drawSevillaBarrios = () => {
    graphContainer
      .append("path")
      .datum(topojson.feature(barrios, barrios.objects.Barrios))
      .attr("d", sevillaPath)
      .style("fill", "none")
      .style("stroke", "#333333");
  };

  const drawSpecimens = origin => {
    const originName = origin[0].origin.split("/")[0];
    graphContainer
      .selectAll("especimen" + originName)
      .data(origin)
      .enter()
      .append("circle")
      .attr("class", "especimen" + originName)
      .attr("cx", d => sevillaProjection([+d.long, +d.lat])[0])
      .attr("cy", d => sevillaProjection([+d.long, +d.lat])[1])
      .attr("r", "0.5px")
      .attr("fill", d => originColors[d.origin] + pointTransparency);
  };

  // World Testing
  // const geometriesWorld = topojson.feature(world, world.objects.countries)
  //   .features;
  // graphContainer
  //   .selectAll(".countries")
  //   .data(geometriesWorld)
  //   .enter()
  //   .append("path")
  //   .attr("class", "countries")
  //   .attr("id", d => d.id)
  //   .attr("d", worldPath)
  //   .style("fill", "none")
  //   .style("stroke-width", "0.5px")
  //   .style("stroke", "black");

  // DRAW ////////////////////////////////////

  originGeometries.forEach(originGeometry => {
    drawContinentsBorders(originGeometry);
  });
  originGeometries.forEach(originGeometry => {
    drawContinentsShade(originGeometry);
  });

  drawSevillaBarrios();
  // worldSpecimens.forEach(origin => {
  //   drawSpecimens(origin);
  // });
  // drawSpecimens(oceaniaSpecimens);

  console.log("end");

  d3.select("#downloadImage").on("click", function() {
    saveSvgAsPng(d3.select("#chartSVG").node(), "puntos.png", {
      scale: 2,
      backgroundColor: "black"
    });
  });
});
