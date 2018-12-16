const elem = document.body; // Make the body go full screen.
d3.select("body").on("click", () => {
  requestFullScreen(elem);
});

const width = document.body.clientWidth;
const height = Math.floor(width / 1.777777777778);

const sevillaCenterCoord = [-5.994, 37.393];
const worldCoordinates = {
  americano: americaWorldCoordinates,
  africano: africaWorldCoordinates,
  asiatico: asiaWorldCoordinates,
  oceanico: oceaniaWorldCoordinates,
  "europeo-mediterraneo": europaWorldCoordinates
};
// "Cototipos" Coordinates /////////////////////////////////
const pointsToDrawTitle = 8000;
const titleCoordShuffled = d3.shuffle(titleCoord);
const titleCoordReduced = titleCoordShuffled.slice(0, pointsToDrawTitle);

// //////////////////////////////////////////////////////////
// Colors ///////////////////////////////////////////////////
// //////////////////////////////////////////////////////////
const title1Color = "#bfbfb1";
const title2Color = "#757563";
const offWhite = "#d8d8d8";
const originColors = {
  "europeo-mediterraneo": [
    "#0070d7",
    "#0090ea",
    "#00aeff",
    "#007fff",
    "#0065ff",
    "#049aff",
    "#0051ec",
    "#0086ff",
    "#0035d7",
    "#003aad"
  ],
  africano: [
    "#c40000",
    "#e20000",
    "#a70000",
    "#ff0000",
    "#ff7868",
    "#ff3000",
    "#fa0000",
    "#e20000",
    "#ff4a00",
    "#d20000"
  ],
  asiatico: [
    "#fd5a00",
    "#f64600",
    "#ff7000",
    "#e83500",
    "#ff8800",
    "#cf3600",
    "#dd6300",
    "#ffa500",
    "#ffc900",
    "#e95500"
  ],
  americano: [
    "#e634ac",
    "#d9209d",
    "#ff56f9",
    "#a80067",
    "#c00070",
    "#f34ab9",
    "#ed005d",
    "#ff66cc",
    "#ff0068",
    "#ff7eff"
  ],
  oceanico: [
    "#9fae00",
    "#236500",
    "#62d100",
    "#487f00",
    "#909500",
    "#68a900",
    "#c1ff00",
    "#276b00",
    "#cbe600",
    "#5f9d00"
  ]
};

// //////////////////////////////////////////////////////////
// Geographic functions /////////////////////////////////////
// //////////////////////////////////////////////////////////

// geographic scales ////////////////////////////////////////
const worldScaleMollweide = width / 1.5 / Math.PI;
const sevillaScale = width * 170;

// Geographic projections ///////////////////////////////////
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
  .center(sevillaCenterCoord);

// Path generators //////////////////////////////////////////
const worldPath = d3.geoPath().projection(worldProjection);
const sevillaPath = d3.geoPath().projection(sevillaProjection);

// //////////////////////////////////////////////////////////
// Setup containers /////////////////////////////////////////
// //////////////////////////////////////////////////////////

// SVG
const svg = d3
  .select("#svgContainer")
  .append("svg")
  .attr("id", "chartSVG")
  .attr("width", width)
  .attr("height", height);

const svgContainer = svg.append("g");

// Author Name
svgContainer
  .append("text")
  .attr("id", "authorName")
  .attr("x", width / 2)
  .attr("y", height / 2 + 60)
  .attr("dy", "0.35em")
  .attr("text-anchor", "middle")
  .style("font-family", "Roboto")
  .style("font-weight", "300")
  .style("font-size", "1.8em")
  .style("fill", title1Color)
  .text("");

// District Name
svgContainer
  .append("text")
  .attr("id", "title1")
  .attr("x", width / 2)
  .attr("y", height - 40)
  .attr("text-anchor", "middle")
  .style("font-family", "Lobster")
  .style("font-size", "1.3em")
  .style("font-style", "italic")
  .style("fill", title1Color)
  .text("");

// Total specimens
svgContainer
  .append("text")
  .attr("id", "title2")
  .attr("x", width / 2)
  .attr("y", height - 20)
  .attr("text-anchor", "middle")
  .style("font-family", "Roboto")
  .style("font-size", "1em")
  .style("fill", title2Color)
  .text("");

// Canvas
const canvas = d3
  .select("#canvasContainer")
  .append("canvas")
  .attr("id", "canvas")
  .attr("width", width)
  .attr("height", height);

const context = canvas.node().getContext("2d");

// To fix blurry circles:
// https://stackoverflow.com/questions/48961797/canvas-circle-looks-blurry
// and https://github.com/nbremer/datasketches/blob/gh-pages/april/code/nadieh/canvas/js/main.js
const devicePixelRatio = window.devicePixelRatio || 1;
const backingStoreRatio =
  context.webkitBackingStorePixelRatio ||
  context.mozBackingStorePixelRatio ||
  context.msBackingStorePixelRatio ||
  context.oBackingStorePixelRatio ||
  context.backingStorePixelRatio ||
  1;
const ratio = devicePixelRatio / backingStoreRatio;

// Upscale the canvas if the two ratios don't match
if (devicePixelRatio !== backingStoreRatio) {
  canvas.node().width = width * ratio;
  canvas.node().height = height * ratio;
  canvas.node().style.width = width + "px";
  canvas.node().style.height = height + "px";
  // now scale the context to counter
  // the fact that we've manually scaled our canvas element
  context.scale(ratio, ratio);
}

// Create an in memory only element of type 'custom'
const detachedContainer = document.createElement("custom");

// Create a d3 selection for the detached container. It won't be attached to the DOM.
const customContainer = d3.select(detachedContainer);

// //////////////////////////////////////////////////////////
// Load data ////////////////////////////////////////////////
// //////////////////////////////////////////////////////////

d3.queue()
  .defer(d3.csv, "/data/garden/garden-atlas-reduced.csv", d => {
    d.longSevilla = +d.long;
    d.latSevilla = +d.lat;
    return d;
  })
  .defer(d3.csv, "/data/garden/totals.csv", d => {
    d["numero_plantas"] = +d["numero_plantas"];
    return d;
  })
  .defer(d3.csv, "/data/garden/paises_ISO3_origin.csv", d => {
    d.UN = +d.UN;
    return d;
  })
  .defer(d3.json, "/data/maps/world-100m-topo.json")
  .await(drawMap);

function drawMap(error, specimensData, totals, origins, world) {
  if (error) throw error;
  console.log("specimensData", specimensData);

  // //////////////////////////////////////////////////////////
  // Geographic DATA //////////////////////////////////////////
  // //////////////////////////////////////////////////////////

  const originsMap = {};
  origins.forEach(origen => {
    const id = origen.UN;
    originsMap[id] = origen["origin"];
  });

  // Add origin name to country geometries
  world.objects.countries.geometries.map(country => {
    const countryId = Number(country.id);
    country.origin = originsMap[countryId];
  });

  // //////////////////////////////////////////////////////////
  // Specimens DATA ///////////////////////////////////////////
  // //////////////////////////////////////////////////////////

  // Assign a random color, positioned in Sevilla
  specimensData.forEach(obj => {
    const id = getRandomInt(0, 9);
    obj.color = originColors[obj.origin][id];
    obj.positioned = "sevilla";
  });

  const total = totals
    .map(obj => obj.numero_plantas)
    .reduce((a, b) => Number(a) + Number(b));

  const districtTotals = {};
  d3.nest()
    .key(d => d.distrito)
    .entries(totals)
    .forEach(dist => {
      districtTotals[dist.key] = dist.values
        .map(d => d["numero_plantas"])
        .reduce((a, b) => a + b);
    });

  const originTotals = {};
  d3.nest()
    .key(d => d.origen)
    .entries(totals)
    .forEach(dist => {
      originTotals[dist.key] = dist.values
        .map(d => d["numero_plantas"])
        .reduce((a, b) => a + b);
    });

  // Specimens per origin
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

  // Add world coordinates to specimens
  allWorldSpecimens.forEach(specimens => {
    specimens.forEach((specimen, i) => {
      const originWorldCoordinates = worldCoordinates[specimen.origin];
      specimen.longWorld = originWorldCoordinates[i][0];
      specimen.latWorld = originWorldCoordinates[i][1];
    });
  });

  // Specimens by district and zone
  const distritosNames = getUniqueCategory(specimensData, "DISTRITO");
  const batchesNames = [
    "Casco Antiguo",
    "Real Alcázar",
    "Macarena",
    "San Pablo - Santa Justa",
    "Nervión",
    "María Luisa",
    "Sur",
    "Los Remedios",
    "Triana",
    "Norte",
    "Este - Alcosa - Torreblanca",
    "Cerro - Amate",
    "Bellavista - La Palmera"
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

  // Specimens to draw the title
  const specimensToTitle = d3
    .shuffle(
      specimensData.filter(specimen => {
        return (
          specimen["park_zona"] !== "Real Alcázar" &&
          specimen["park_zona"] !== "María Luisa"
        );
      })
    )
    .slice(0, titleCoordReduced.length);

  specimensToTitle.forEach((specimen, i) => {
    specimen.coordXTitle = titleCoordReduced[i].x * width;
    specimen.coordYTitle = titleCoordReduced[i].y * height;
  });

  // //////////////////////////////////////////////////////////
  // Draw Functions ///////////////////////////////////////////
  // //////////////////////////////////////////////////////////

  function drawCreditsTitle() {
    svgContainer
      .selectAll(".titlePoints")
      .data(specimensToTitle)
      .enter()
      .append("circle")
      .attr("class", "titlePoints")
      .attr("cx", d => sevillaProjection([d.longSevilla, d.latSevilla])[0])
      .attr("cy", d => sevillaProjection([d.longSevilla, d.latSevilla])[1])
      .attr("r", 1)
      .style("fill", "#ffffff")
      .transition()
      .duration(4000)
      .delay(3000)
      .style("fill", d => d.color)
      .transition()
      .duration(1500)
      .delay((d, i) => i * 2)
      .attr("cx", d => d.coordXTitle)
      .attr("cy", d => d.coordYTitle)
      .on("start", function(d, i) {
        if (i === pointsToDrawTitle - 1) drawCreditsName();
        d3.select(this).attr("r", 3);
      })
      .on("end", function() {
        d3.select(this).attr("r", 0.7);
      })
      .transition()
      .duration(6000)
      .style("fill", "#ffffff")
      .call(endall, () => {
        drawRectFade("out", start);
      });
  }

  function drawCreditsName() {
    d3.select("#authorName")
      .style("opacity", 0)
      .transition()
      .duration(1500)
      .delay(1000)
      .text("Esperanza Moreno Cruz")
      .style("opacity", 1);
  }

  function drawRectFade(
    direction,
    callback = () => {
      console.log("callback");
    }
  ) {
    svgContainer
      .append("rect")
      .attr("class", "blackRect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#00000")
      .attr("fill-opacity", () => {
        if (direction === "in") return 1;
        else if (direction === "out") return 0;
      })
      .transition()
      .ease(d3.easeLinear)
      .duration(1500)
      .attr("fill-opacity", () => {
        if (direction === "in") return 0;
        else if (direction === "out") return 1;
      })
      .on("end", () => {
        svgContainer.select(".blackRect").remove();
        callback();
      });
  }

  const drawSpecimentsToCanvas = (specimens, sevillaIsColoured) => {
    const dataBinding = customContainer
      .selectAll(".specimen")
      .data(specimens, d => d.FID);

    // Update
    dataBinding
      .attr("fillStyle", d => {
        if (d.positioned === "sevilla" && !sevillaIsColoured) return offWhite;
        else return d.color;
      })
      .attr("cx", d => {
        if (d.positioned === "sevilla")
          return sevillaProjection([d.longSevilla, d.latSevilla])[0];
        else if (d.positioned === "world")
          return worldProjection([d.longWorld, d.latWorld])[0];
      })
      .attr("cy", d => {
        if (d.positioned === "sevilla")
          return sevillaProjection([d.longSevilla, d.latSevilla])[1];
        else if (d.positioned === "world")
          return worldProjection([d.longWorld, d.latWorld])[1];
      });

    // New elements
    dataBinding
      .enter()
      .append("custom")
      .attr("class", "specimen")
      .attr("cx", d => {
        if (d.positioned === "sevilla")
          return sevillaProjection([d.longSevilla, d.latSevilla])[0];
        else if (d.positioned === "world")
          return worldProjection([d.longWorld, d.latWorld])[0];
      })
      .attr("cy", d => {
        if (d.positioned === "sevilla")
          return sevillaProjection([d.longSevilla, d.latSevilla])[1];
        else if (d.positioned === "world")
          return worldProjection([d.longWorld, d.latWorld])[1];
      })
      .attr("r", 1)
      .attr("fillStyle", d => {
        if (d.positioned === "sevilla" && !sevillaIsColoured) return offWhite;
        else return d.color;
      });

    dataBinding.exit().remove();

    drawCanvas();
  };

  function drawCanvas() {
    cleanCanvas();

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

  function cleanCanvas() {
    context.fillStyle = "#000";
    context.rect(0, 0, canvas.attr("width"), canvas.attr("height"));
    context.fill();
  }

  // const durationMoveToWorld = 100;
  const durationMoveToWorld = 10000;
  // const delayMoveToWorld = 400;
  const delayMoveToWorld = 4000;
  function moveSpecimensToWorld(data, className, callback) {
    svgContainer
      .selectAll("." + className)
      .data(data)
      .enter()
      .append("circle")
      .attr("class", className)
      .attr("cx", d => sevillaProjection([d.longSevilla, d.latSevilla])[0])
      .attr("cy", d => sevillaProjection([d.longSevilla, d.latSevilla])[1])
      .attr("r", 1)
      .style("fill", d => d.color)
      .transition()
      // .ease(d3.easeLinear)
      .duration(durationMoveToWorld)
      .delay(delayMoveToWorld)
      .attr("cx", d => {
        return worldProjection([d.longWorld, d.latWorld])[0];
      })
      .attr("cy", d => {
        return worldProjection([d.longWorld, d.latWorld])[1];
      })
      .call(endall, () => {
        data.forEach(specimen => (specimen.positioned = "world"));
        setTimeout(() => {
          drawRectFade("out", callback);
        }, 1000);
      });
  }

  // //////////////////////////////////////////////////////////
  // DRAW /////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////
  let counter = 0;

  const waitTostart = 5000;
  setTimeout(drawCreditsTitle, waitTostart);

  function start() {
    svgContainer.selectAll(".titlePoints").remove();
    svgContainer.selectAll("#authorName").remove();
    // Draw Sevilla all points in their color
    drawSpecimentsToCanvas(specimensData, true);
    d3.select("#title1").text("Sevilla cosmopolita");
    d3.select("#title2").text(`${total.toLocaleString()} especímenes`);
    drawRectFade("in");
    setTimeout(() => {
      drawRectFade("out", drawAsiaSpecimens);
    }, 7000);
  }

  function drawAsiaSpecimens() {
    cleanCanvas();
    moveSpecimensToWorld(asiaSpecimens, "asiaSpecimens", drawEuropaSpecimens);
    d3.select("#title1").text("Sevilla asiática");
    d3.select("#title2").text(
      `${originTotals["asiatico"].toLocaleString()} especímenes`
    );
    drawRectFade("in");
  }

  function drawEuropaSpecimens() {
    d3.selectAll(".asiaSpecimens").remove();
    moveSpecimensToWorld(
      europaSpecimens,
      "europaSpecimens",
      drawAmericaSpecimens
    );
    d3.select("#title1").text("Sevilla europeo-mediterránea");
    d3.select("#title2").text(
      `${originTotals["europeo-mediterraneo"].toLocaleString()} especímenes`
    );
    drawRectFade("in");
  }

  function drawAmericaSpecimens() {
    d3.selectAll(".europaSpecimens").remove();
    moveSpecimensToWorld(
      americaSpecimens,
      "americaSpecimens",
      drawOceaniaSpecimens
    );
    d3.select("#title1").text("Sevilla americana");
    d3.select("#title2").text(
      `${originTotals["americano"].toLocaleString()} especímenes`
    );
    drawRectFade("in");
  }

  function drawOceaniaSpecimens() {
    d3.selectAll(".americaSpecimens").remove();
    moveSpecimensToWorld(
      oceaniaSpecimens,
      "oceaniaSpecimens",
      drawAfricaSpecimens
    );
    d3.select("#title1").text("Sevilla oceánica");
    d3.select("#title2").text(
      `${originTotals["oceanico"].toLocaleString()} especímenes`
    );
    drawRectFade("in");
  }

  function drawAfricaSpecimens() {
    d3.selectAll(".oceaniaSpecimens").remove();
    moveSpecimensToWorld(africaSpecimens, "africaSpecimens", drawWorld);
    d3.select("#title1").text("Sevilla africana");
    d3.select("#title2").text(
      `${originTotals["africano"].toLocaleString()} especímenes`
    );
    drawRectFade("in");
  }

  function drawWorld() {
    d3.selectAll(".africaSpecimens").remove();
    drawSpecimentsToCanvas(specimensData);
    d3.select("#title1").text("Sevilla cosmopolita");
    d3.select("#title2").text(`${total.toLocaleString()} especímenes`);
    drawRectFade("in");
    setTimeout(moveBatch, 3000);
  }

  function moveBatch() {
    cleanCanvas();

    if (counter < batchesNames.length) {
      const dataStay = getDataStay(batchesNames, distritos, counter);
      const dataMove = distritos[batchesNames[counter]];

      d3.select("#title1").text(batchesNames[counter]);
      d3.select("#title2").text(
        `${districtTotals[batchesNames[counter]].toLocaleString()} especímenes`
      );

      drawSpecimentsToCanvas(dataStay);

      svgContainer
        .selectAll(".specimenMoved")
        .data(dataMove)
        .enter()
        .append("circle")
        .attr("class", "specimenMoved")
        .attr("cx", d => worldProjection([d.longWorld, d.latWorld])[0])
        .attr("cy", d => worldProjection([d.longWorld, d.latWorld])[1])
        .attr("r", 1)
        .attr("fill", d => d.color)
        .transition()
        .ease(d3.easeLinear)
        .duration(2000)
        .delay((d, i) => i * 3)
        .attr("cx", d => sevillaProjection([d.longSevilla, d.latSevilla])[0])
        .attr("cy", d => sevillaProjection([d.longSevilla, d.latSevilla])[1])
        .on("start", function() {
          d3.select(this).attr("r", 2.5);
        })
        .on("end", function() {
          d3.select(this)
            .attr("r", 3.5)
            .style("fill", "#ffffff");
        })
        .transition()
        .duration(500)
        .attr("r", 1)
        .call(endall, () => {
          dataMove.forEach(specimen => {
            specimen.positioned = "sevilla";
          });
          svgContainer.selectAll(".specimenMoved").remove();
          drawSpecimentsToCanvas(dataStay.concat(dataMove));
          d3.select("#title1").text("");
          d3.select("#title2").text("");
          moveBatch();
        });

      counter++;
    } else {
      drawSpecimentsToCanvas(specimensData);
      d3.select("#title1").text("Sevilla cosmopolita");
      d3.select("#title2").text(`${total.toLocaleString()} especímenes`);
      setTimeout(() => {
        d3.select("#title1").remove();
        d3.select("#title2").remove();

        cleanCanvas();
      }, 4000);
    }
  }
}

function getDataStay(batchesNames, distritos, counter) {
  let dataStay = [];
  const distritosStay = batchesNames.filter((name, i) => {
    return i !== counter;
  });
  distritosStay.forEach(name => {
    dataStay = dataStay.concat(distritos[name]);
  });
  return dataStay;
}

function requestFullScreen(element) {
  // Supports most browsers and their versions.
  var requestMethod =
    element.requestFullScreen ||
    element.webkitRequestFullScreen ||
    element.mozRequestFullScreen ||
    element.msRequestFullScreen;
  if (requestMethod) {
    // Native full screen.
    requestMethod.call(element);
  } else if (typeof window.ActiveXObject !== "undefined") {
    // Older IE.
    var wscript = new ActiveXObject("WScript.Shell");
    if (wscript !== null) {
      wscript.SendKeys("{F11}");
    }
  }
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
  return Math.floor(d3.randomBates(2)() * (max - min + 1)) + min;
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
