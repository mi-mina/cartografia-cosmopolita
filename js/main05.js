const width = document.body.clientWidth;
const height = width / 1.7778;

const originCentroids = {
  africano: {
    long: 24.3697,
    lat: -1.9326
  },
  americano: {
    long: -85.5911,
    lat: 13.9127
  },
  asiatico: {
    long: 86.9311,
    lat: 40.6368
  },
  "europeo-mediterraneo": {
    long: 13.2472,
    lat: 46.909
  },
  oceanico: {
    long: 134.1076,
    lat: -24.0026
  }
};

// //////////////////////////////////////////////////////////
// Colors ///////////////////////////////////////////////////
// //////////////////////////////////////////////////////////
const pointTransparency = "ff"; // "80"; //50%
const shadeTransparency = "40"; // "80"; //50%
const originColors = {
  americano: "#34ad59",
  africano: "#f4b342",
  asiatico: "#d52dac",
  oceanico: "#6b6ecf",
  "europeo-mediterraneo": "#17becf"
};

// //////////////////////////////////////////////////////////
// Geographic functions /////////////////////////////////////
// //////////////////////////////////////////////////////////

// geographic scales ////////////////////////////////////////
const worldScaleMollweide = width / 1.5 / Math.PI;
const worldScaleCilindrical = width / Math.PI;
const sevillaScale = width * 170;

// Geographic projections ///////////////////////////////////

// World proyection: geoCylindricalEqualArea
// const worldProjection = d3
//   .geoCylindricalEqualArea()
//   .scale(worldScaleCilindrical)
//   .translate([width / 2 - width * 0.06, height / 2 + height * 0.08])
//   .rotate([-10, 0, 0]);

// World proyection: Mollweide
const worldProjection = d3
  .geoMollweide()
  .scale(worldScaleMollweide)
  .translate([width / 2 - width * 0.06, height / 2 + height * 0.08])
  .rotate([-10, 0, 0]);

// Sevilla proyection
const sevillaProjection = d3
  .geoMercator()
  .scale(sevillaScale)
  .translate([width / 2 - width * 0.08, height / 2])
  .center([-5.95, 37.38]);

// Path generators //////////////////////////////////////////
const worldPath = d3.geoPath().projection(worldProjection);
const sevillaPath = d3.geoPath().projection(sevillaProjection);

// //////////////////////////////////////////////////////////
// Setup containers /////////////////////////////////////////
// //////////////////////////////////////////////////////////

const svg = d3
  .select("#svgContainer")
  .append("svg")
  .attr("id", "chartSVG")
  .attr("width", width)
  .attr("height", height);

const svgContainer = svg.append("g");

const canvas = d3
  .select("#canvasContainer")
  .append("canvas")
  .attr("width", width)
  .attr("height", height);

const context = canvas.node().getContext("2d");

// Create an in memory only element of type 'custom'
const detachedContainer = document.createElement("custom");

// Create a d3 selection for the detached container. It won't be attached to the DOM.
const customContainer = d3.select(detachedContainer);

// //////////////////////////////////////////////////////////
// Load data ////////////////////////////////////////////////
// //////////////////////////////////////////////////////////

d3.queue()
  .defer(d3.csv, "/data/garden/gardenAtlas-morfologia.csv")
  .defer(d3.csv, "/data/garden/paises_ISO3_origin.csv")
  .defer(d3.json, "/data/maps/barrios-topo.json")
  .defer(d3.json, "/data/maps/world-100m-topo.json")
  .await(drawMap);

function drawMap(error, specimensData, origins, barrios, world) {
  if (error) throw error;
  console.log("specimensData", specimensData);
  console.log("world", world);
  specimensData = specimensData.filter((obj, i) => {
    return i % 4 === 0;
  });
  console.log("specimensData", specimensData);

  // //////////////////////////////////////////////////////////
  // Geographic DATA //////////////////////////////////////////
  // //////////////////////////////////////////////////////////

  const originsMap = {};
  origins.forEach(origen => {
    const id = Number(origen.UN);
    originsMap[id] = origen["origin"];
  });

  // Add origin name to geometries
  world.objects.countries.geometries.map(country => {
    const countryId = Number(country.id);
    country.origin = originsMap[countryId];
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

  const allOriginGeometries = [
    africaGeometries,
    americaGeometries,
    asiaGeometries,
    europaGeometries,
    oceaniaGeometries
  ];

  // const calculalteDestPoints = originGeoJson => {
  //   const bbox = worldPath.bounds(originGeoJson);
  //   const x1 = Math.floor(bbox[0][0]);
  //   const y1 = Math.floor(bbox[0][1]);
  //   const x2 = Math.floor(bbox[1][0]);
  //   const y2 = Math.floor(bbox[1][1]);
  //   const width = x2 - x1;
  //   const height = y2 - y1;
  //   const step = 1;

  //   const initialPoints = [];

  //   for (let x = x1; x < width + x1; x += step) {
  //     for (let y = y1; y < height + y1; y += step) {
  //       initialPoints.push([x, y]);
  //     }
  //   }
  //   console.log("initialPoints", initialPoints);
  //   const destPoints = initialPoints.filter(point => {
  //     const x = point[0];
  //     const y = point[1];
  //     const invert = worldProjection.invert([x, y]);
  //     const long = invert[0];
  //     const lat = invert[1];

  //     return d3.geoContains(originGeoJson, [long, lat]);
  //   });
  //   return destPoints;
  // };

  // const geojson = topojson.merge(world, oceaniaGeometries);
  // const destPoints = calculalteDestPoints(geojson);
  // const proyectedPoints = [];
  // destPoints.forEach(point => {
  //   proyectedPoints.push(worldProjection.invert(point));
  // });
  // console.log("destPoints", destPoints);
  // console.log("proyectedPoints", proyectedPoints);

  // var myJSON1 = JSON.stringify(destPoints);
  // var myJSON2 = JSON.stringify(proyectedPoints);

  // console.log(myJSON1);
  // console.log(myJSON2);

  // console.log("oceaniaDestPoints", oceaniaDestPoints);

  // const destPointsFiltered = americaDestPoints.filter((point, i) => {
  //   return i % 762 !== 0;
  // });
  // var myJSON3 = JSON.stringify(destPointsFiltered);
  // console.log(myJSON3);

  // console.log("destPointsFiltered", destPointsFiltered);
  // const fillOpacity = 0.5;

  // svgContainer
  //   .selectAll(".destPoints")
  //   .data(americaDestPoints)
  //   .enter()
  //   .append("circle")
  //   .attr("class", d => d)
  //   .attr("cx", d => worldProjection(d)[0])
  //   .attr("cy", d => worldProjection(d)[1])
  //   .attr("r", 1)
  //   .style("fill", originColors["americano"]);
  // .style("fill-opacity", fillOpacity);

  // svgContainer
  //   .selectAll(".destPoints")
  //   .data(africaDestPoints)
  //   .enter()
  //   .append("circle")
  //   .attr("class", d => d)
  //   .attr("cx", d => worldProjection(d)[0])
  //   .attr("cy", d => worldProjection(d)[1])
  //   .attr("r", 0.5)
  //   .style("fill", originColors["africano"])
  //   .style("fill-opacity", fillOpacity);

  // svgContainer
  //   .selectAll(".destPoints")
  //   .data(d3.shuffle(oceaniaDestPoints))
  //   .enter()
  //   .append("circle")
  //   .attr("class", d => d)
  //   .attr("cx", d => worldProjection(d)[0])
  //   .attr("cy", d => worldProjection(d)[1])
  //   .attr("r", 0.5)
  //   .style("fill", originColors["oceanico"]);
  // .style("fill-opacity", fillOpacity);

  // //////////////////////////////////////////////////////////
  // Specimens DATA ////////////////////////////////////
  // //////////////////////////////////////////////////////////

  // Assign ids per origin to match with destPoints arrays
  const africaSpecimens = specimensData.filter(
    specimen => specimen.origin === "africano"
  );
  const americaSpecimens = specimensData.filter(
    specimen => specimen.origin === "americano"
  );
  const asiaSpecimens = specimensData.filter(
    specimen => specimen.origin === "asiatico"
  );
  const europaSpecimens = specimensData.filter(
    specimen => specimen.origin === "europeo-mediterraneo"
  );
  const oceaniaSpecimens = specimensData.filter(
    specimen => specimen.origin === "oceanico"
  );

  const allWorldSpecimens = [
    africaSpecimens,
    americaSpecimens,
    asiaSpecimens,
    europaSpecimens,
    oceaniaSpecimens
  ];

  allWorldSpecimens.forEach(originSpecimens => {
    originSpecimens.forEach((obj, i) => {
      obj.originId = i;
    });
  });
  console.log("africaSpecimens", africaSpecimens);
  // console.log("americaSpecimens", americaSpecimens);
  // console.log("asiaSpecimens", asiaSpecimens);
  // console.log("europaSpecimens", europaSpecimens);
  console.log("oceaniaSpecimens", oceaniaSpecimens);

  // Shuffle destPoints //////////////////////////////////////
  africaDestinationPoints = d3.shuffle(africaDestPoints);
  oceaniaDestinationPoints = d3.shuffle(oceaniaDestPoints);
  americaDestinationPoints = d3.shuffle(americaDestPoints);
  europaDestinationPoints = d3.shuffle(europaDestPoints);
  asiaDestinationPoints = d3.shuffle(asiaDestPoints);

  const destPoints = {
    americano: americaDestinationPoints,
    africano: africaDestinationPoints,
    asiatico: asiaDestinationPoints,
    oceanico: oceaniaDestinationPoints,
    "europeo-mediterraneo": europaDestinationPoints
  };

  // Batches //////////////////////////////////////////////////
  const batches = [
    { name: "Bellavista - La Palmera" },
    { name: "Casco Antiguo" },
    { name: "Real Alcázar" },
    { name: "Cerro - Amate" },
    { name: "Bellavista - La Palmera" },
    { name: "Bellavista - La Palmera" },
    { name: "Bellavista - La Palmera" }
  ];

  // //////////////////////////////////////////////////////////
  // Draw Functions ///////////////////////////////////////////
  // //////////////////////////////////////////////////////////

  // Origin continents ////////////////////////////////////////
  const drawContinentsBorders = originGeometry => {
    const origin = originGeometry[0].origin;
    svgContainer
      .append("path")
      .datum(topojson.merge(world, originGeometry))
      .attr("d", worldPath)
      .style("fill", "none")
      .style("stroke-width", "1px")
      .style("stroke", originColors[origin]);
  };

  const drawContinentsShade = (originGeometry, color) => {
    svgContainer
      .append("path")
      .datum(topojson.merge(world, originGeometry))
      .attr("d", worldPath)
      .style("fill", color + shadeTransparency)
      .style("stroke", "none");
  };

  // Sevilla //////////////////////////////////////////////////
  const drawSevillaBarrios = () => {
    svgContainer
      .append("path")
      .datum(topojson.feature(barrios, barrios.objects.Barrios))
      .attr("d", sevillaPath)
      .style("fill", "none")
      .style("stroke-width", "3px")
      .style("stroke", "white");
  };

  // Speciments - points //////////////////////////////////////
  const drawSpecimens = origin => {
    const originName = origin[0].origin.split("/")[0];
    svgContainer
      .selectAll(".specimen" + originName)
      .data(origin)
      .enter()
      .append("circle")
      .attr("class", "specimen" + originName)
      .attr("cx", d => sevillaProjection([+d.long, +d.lat])[0])
      .attr("cy", d => sevillaProjection([+d.long, +d.lat])[1])
      .attr("r", "1px")
      .attr("fill", d => originColors[d.origin] + pointTransparency);
  };

  const drawSpecimentsToCustom = specimens => {
    const dataBinding = customContainer
      .selectAll(".specimen")
      .data(specimens, d => d.FID);

    // Update

    // New elements
    dataBinding
      .enter()
      .append("custom")
      .attr("class", "specimen")
      .attr("cx", d => sevillaProjection([+d.long, +d.lat])[0])
      .attr("cy", d => sevillaProjection([+d.long, +d.lat])[1])
      .attr("r", 1)
      .attr("fillStyle", d => originColors[d.origin] + pointTransparency);

    dataBinding.exit().remove();

    drawCanvas();
  };

  function drawCanvas() {
    context.fillStyle = "#000";
    context.rect(0, 0, canvas.attr("width"), canvas.attr("height"));
    context.fill();

    var elements = customContainer.selectAll(".specimen");
    elements.each((d, i, nodes) => {
      const node = d3.select(nodes[i]);

      context.beginPath();
      context.fillStyle = node.attr("fillStyle");
      context.arc(
        node.attr("cx"),
        node.attr("cy"),
        node.attr("r"),
        0,
        Math.PI * 2
      );
      context.fill();
      context.closePath();
    });
  }

  // World Testing
  // const geometriesWorld = topojson.feature(world, world.objects.countries)
  //   .features;
  // svgConntainer
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

  // //////////////////////////////////////////////////////////
  // DRAW /////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////

  // Continent borders
  // allOriginGeometries.forEach(originGeometry => {
  //   drawContinentsBorders(originGeometry);
  // });

  // allOriginGeometries.forEach(originGeometry => {
  //   const origin = originGeometry[0].origin;
  //   console.log("originGeometry", originGeometry);
  //   drawContinentsShade(originGeometry, originColors[origin]);
  // });

  // drawSpecimentsToCustom(specimensData);

  // drawSevillaBarrios();

  // Parameters to calculate the batchs based on the distance to the center of Sevilla
  const extentLong = d3.extent(specimensData, d => d.long);
  const extentLat = d3.extent(specimensData, d => d.lat);
  const sevillaCenter = [
    (Number(extentLong[0]) + Number(extentLong[1])) / 2,
    (Number(extentLat[0]) + Number(extentLat[1])) / 2
  ];
  const longWidth = Math.abs(Number(extentLong[1]) - Number(extentLong[0]));
  const latHeight = Math.abs(Number(extentLat[1]) - Number(extentLat[0]));
  const sevillaRadius = d3.max([longWidth, latHeight]);

  console.log("longWidth", longWidth);
  console.log("latHeight", latHeight);
  console.log("sevillaRadius", sevillaRadius);
  console.log("sevillaCenter", sevillaCenter);

  const dataStay = specimensData.filter(specimen => +specimen.lat > 37.38);
  const dataMove = specimensData.filter(specimen => +specimen.lat <= 37.38);
  console.log("dataMove", dataMove);
  // setTimeout(moveFirstBatch, 4000);

  function moveFirstBatch() {
    drawSpecimentsToCustom(dataStay);

    svgContainer
      .selectAll(".specimenMoved")
      .data(dataMove)
      .enter()
      .append("circle")
      .attr("class", "specimenMoved")
      .attr("cx", d => sevillaProjection([+d.long, +d.lat])[0])
      .attr("cy", d => sevillaProjection([+d.long, +d.lat])[1])
      .attr("r", 1)
      .attr("fill", d => originColors[d.origin] + pointTransparency)
      .transition()
      .duration(4000)
      .delay((d, i) => i * 10)
      .attr("cx", d => {
        const originDestPoints = destPoints[d.origin];
        const pointId = d.originId;
        return worldProjection(originDestPoints[pointId])[0];
      })
      .attr("cy", d => {
        const originDestPoints = destPoints[d.origin];
        const pointId = d.originId;
        return worldProjection(originDestPoints[pointId])[1];
      });
    // .style("fill", "black");
  }

  d3.select("#downloadImage").on("click", function() {
    saveSvgAsPng(d3.select("#chartSVG").node(), "puntos.png", {
      scale: 2,
      backgroundColor: "black"
    });
  });
}
