const width = document.body.clientWidth;
const height = width / 1.7778;
const sevillaCenter = [-5.994, 37.393];

const destPoints = {
  americano: americaDestPoints,
  africano: africaDestPoints,
  asiatico: asiaDestPoints,
  oceanico: oceaniaDestPoints,
  "europeo-mediterraneo": europaDestPoints
};

const destPointsJSON = JSON.stringify(destPoints);
console.log("destPoints", destPoints);
console.log("destPointsJSON", destPointsJSON);

// //////////////////////////////////////////////////////////
// Colors ///////////////////////////////////////////////////
// //////////////////////////////////////////////////////////
const pointTransparency = "ff"; // "80"; //50%
const shadeTransparency = "40"; // "80"; //50%
const originColors = {
  americano: [
    "#779754",
    "#345b0c",
    "#4f5d3f",
    "#768367",
    "#397f3e",
    "#11502d",
    "#60a579",
    "#007c50",
    "#1e886e",
    "#0c5d4a"
  ],
  africano: [
    "#e28235",
    "#c98d1e",
    "#f5a544",
    "#b97702",
    "#be8200",
    "#cf6913",
    "#ff8c31",
    "#ef9c00",
    "#ee8f00",
    "#f5ae0f"
  ],
  asiatico: [
    "#de71c1",
    "#c4414c",
    "#ff6c91",
    "#a5196d",
    "#b0004a",
    "#ff5866",
    "#ff67c6",
    "#a00f90",
    "#d2006d",
    "#fb379b"
  ],
  oceanico: [
    "#67647d",
    "#947499",
    "#444169",
    "#a88cbf",
    "#8592cd",
    "#5466a1",
    "#9a68a3",
    "#4a3b7b",
    "#728ad9",
    "#b084d2"
  ],
  "europeo-mediterraneo": [
    "#007c97",
    "#47a0c9",
    "#2f4c5e",
    "#7c96ab",
    "#0093d6",
    "#6b9bc6",
    "#0077be",
    "#3e577b",
    "#728db9",
    "#6693d2"
  ]
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
  .translate([width / 2 - width * 0.106, height / 2 - height * 0.185])
  .center(sevillaCenter);

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

svgContainer
  .append("text")
  .attr("id", "title")
  .attr("x", width / 2)
  .attr("y", height - 50)
  .attr("text-anchor", "middle")
  .style("font-family", "Lobster")
  .style("font-size", "30px")
  .style("font-style", "italic")
  .style("fill", "#6f6f6f")
  .text("Sevilla");

// White circle
// svgContainer
//   .append("circle")
//   .attr("cx", sevillaProjection(sevillaCenter)[0])
//   .attr("cy", sevillaProjection(sevillaCenter)[1])
//   .attr("r", 5)
//   .style("fill", "white");

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
  .defer(d3.csv, "/data/garden/ReducESPE42k.csv")
  // .defer(d3.csv, "/data/garden/gardenAtlas-morfologia.csv")
  .defer(d3.csv, "/data/garden/paises_ISO3_origin.csv")
  .defer(d3.json, "/data/maps/barrios-topo.json")
  .defer(d3.json, "/data/maps/world-100m-topo.json")
  // .defer(d3.json, "/js/data/destPoints.json")
  .await(drawMap);

function drawMap(error, specimensData, origins, barrios, world) {
  if (error) throw error;
  console.log("specimensData", specimensData);
  // console.log("world", world);
  // console.log("destPoints", destPoints);
  specimensData.forEach(obj => {
    const id = getRandomInt(0, 9);
    obj.color = originColors[obj.origin][id];
    obj.positioned = "sevilla";
  });
  // specimensData = specimensData.filter((obj, i) => {
  //   return i % 5 === 0;
  // });
  // console.log("specimensData", specimensData);

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

  // const allOriginGeometries = [
  //   africaGeometries,
  //   americaGeometries,
  //   asiaGeometries,
  //   europaGeometries,
  //   oceaniaGeometries
  // ];

  // //////////////////////////////////////////////////////////
  // Specimens DATA ///////////////////////////////////////////
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
  // console.log("africaSpecimens", africaSpecimens);
  // console.log("americaSpecimens", americaSpecimens);
  // console.log("asiaSpecimens", asiaSpecimens);
  // console.log("europaSpecimens", europaSpecimens);
  // console.log("oceaniaSpecimens", oceaniaSpecimens);

  // Specimens by district and zone

  const distritosNames = getUniqueCategory(specimensData, "DISTRITO");
  console.log("distritosNames", distritosNames);

  const batchesNames = [
    "Casco Antiguo",
    "Real Alcázar",
    "Nervión",
    "San Pablo - Santa Justa",
    "Macarena",
    "Cerro - Amate",
    "María Luisa",
    "Sur",
    "Triana",
    "Los Remedios",
    "Bellavista - La Palmera",
    "Este - Alcosa - Torreblanca",
    "Norte"
  ];

  const distritos = {};
  batchesNames.forEach(distritoName => {
    if (distritosNames.indexOf(distritoName) !== -1) {
      distritos[distritoName] = filterByCategory(
        specimensData,
        "DISTRITO",
        distritoName
      );
    }
  });
  console.log("distritos", distritos);

  distritos["María Luisa"] = distritos.Sur.filter(
    obj => obj["park_zona"] === "María Luisa"
  );
  distritos.Sur = distritos.Sur.filter(
    obj => obj["park_zona"] !== "María Luisa"
  );

  distritos["Real Alcázar"] = distritos["Casco Antiguo"].filter(
    obj => obj["park_zona"] === "Real Alcázar"
  );
  distritos["Casco Antiguo"] = distritos["Casco Antiguo"].filter(
    obj => obj["park_zona"] !== "Real Alcázar"
  );

  console.log("distritos", distritos);

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
      .style("stroke", d => d.color);
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
      .attr("cx", d => {
        if (d.positioned === "sevilla")
          return sevillaProjection([+d.long, +d.lat])[0];
        else if (d.positioned === "world")
          return worldProjection([+d.long, +d.lat])[0];
      })
      .attr("cy", d => {
        if (d.positioned === "sevilla")
          return sevillaProjection([+d.long, +d.lat])[1];
        else if (d.positioned === "world")
          return worldProjection([+d.long, +d.lat])[1];
      })
      .attr("r", d => {
        if (d.positioned === "sevilla") return 0.5;
        else if (d.positioned === "world") return 0.75;
      })
      .attr("fillStyle", d => {
        if (d.positioned === "sevilla") return "#d8d8d8";
        //d.color + "ff";
        else if (d.positioned === "world") return d.color; // + "CC"; //"80";
      });

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

  // //////////////////////////////////////////////////////////
  // DRAW /////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////

  // Continent borders
  // allOriginGeometries.forEach(originGeometry => {
  //   drawContinentsBorders(originGeometry);
  // });

  drawSpecimentsToCustom(specimensData);

  let counter = 0;
  setTimeout(moveBatch, 4000);

  function moveBatch() {
    console.log("counter", counter);

    if (counter < batchesNames.length) {
      let dataStay = [];
      const distritosStay = batchesNames.filter((name, i) => {
        return i !== counter;
      });
      distritosStay.forEach(name => {
        dataStay = dataStay.concat(distritos[name]);
      });
      // console.log("dataStay", dataStay);

      const dataMove = distritos[batchesNames[counter]];
      // console.log("dataMove", dataMove);

      const title = batchesNames[counter];
      // console.log("title", title);

      svgContainer
        .select("#title")
        .transition()
        .duration(500)
        .style("fill", "black")
        .on("end", () => {
          svgContainer.select("#title").text(title);

          svgContainer
            .select("#title")
            .transition()
            .duration(500)
            .style("fill", "#6f6f6f");

          drawSpecimentsToCustom(dataStay);

          svgContainer
            .selectAll(".specimenMoved")
            .data(dataMove)
            .enter()
            .append("circle")
            .attr("class", "specimenMoved")
            .attr("cx", d => sevillaProjection([+d.long, +d.lat])[0])
            .attr("cy", d => sevillaProjection([+d.long, +d.lat])[1])
            .attr("r", 0.5)
            .attr("fill", "#d8d8d8")
            .transition()
            .duration(1500)
            .attr("fill", d => d.color)
            .attr("r", 0.75)
            .transition()
            .ease(d3.easeLinear)
            .duration(2000)
            .delay((d, i) => i * 5)
            .attr("cx", d => {
              const originDestPoints = destPoints[d.origin];
              const pointId = d.originId;
              return worldProjection(originDestPoints[pointId])[0];
            })
            .attr("cy", d => {
              const originDestPoints = destPoints[d.origin];
              const pointId = d.originId;
              return worldProjection(originDestPoints[pointId])[1];
            })
            .attr("r", 2)
            .transition()
            .duration(1500)
            .attr("r", 0.75)
            .call(endall, () => {
              dataMove.forEach(specimen => {
                const originDestPoints = destPoints[specimen.origin];
                const pointId = specimen.originId;
                specimen.long = originDestPoints[pointId][0];
                specimen.lat = originDestPoints[pointId][1];
                specimen.positioned = "world";
              });
              svgContainer.selectAll(".specimenMoved").remove();
              drawSpecimentsToCustom(dataStay.concat(dataMove));
              moveBatch();
            });
        });

      counter++;
    }
  }

  d3.select("#downloadImage").on("click", function() {
    saveSvgAsPng(d3.select("#chartSVG").node(), "puntos.png", {
      scale: 2,
      backgroundColor: "black"
    });
  });
}

function calcDistTwoPoints(a, b) {
  return Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
}

function calcSteppedDistCenter(radius, n) {
  const radii = [];
  for (let i = 0; i <= n; i++) {
    radii.push(radius * Math.sqrt(i / n));
  }
  return radii.reverse();
}

function endall(transition, callback) {
  if (typeof callback !== "function")
    throw new Error("Wrong callback in endall");
  if (transition.size() === 0) {
    console.log("transition.size()", transition.size());
    callback();
  }
  var n = 0;
  transition
    .each(function() {
      ++n;
    })
    .on("end", function() {
      if (!--n) callback.apply(this, arguments);
    });
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function filterByCategory(data, category, name) {
  return data.filter(obj => {
    return obj[category] === name;
  });
}

function getUniqueCategory(data, category) {
  return [...new Set(data.map(obj => obj[category]))];
}

function removeElementFromArray(array, index) {
  if (array[index]) {
    array.splice(index, 1);
  }
}
