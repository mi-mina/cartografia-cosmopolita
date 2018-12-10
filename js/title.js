const elem = document.body; // Make the body go full screen.
d3.select("body").on("click", () => {
  requestFullScreen(elem);
});

const width = document.body.clientWidth;
const height = Math.floor(width / 1.777777777778);
const sevillaCenterCoord = [-5.994, 37.393];
const title1Color = "#bfbfb1";
const title2Color = "#757563";
const offWhite = "#d8d8d8";
const originColors = {
  "europeo-mediterraneo": [
    "#0096cc",
    "#82b7df",
    "#6fd4ff",
    "#4ca9ff",
    "#0090f6",
    "#049aff",
    "#007ce4",
    "#00afff",
    "#0061d2",
    "#003aad"
  ],
  africano: [
    "#e00000",
    "#ff4621",
    "#f20004",
    "#ff0017",
    "#ff6f2f",
    "#ff7345",
    "#db3b00",
    "#ff5330",
    "#ff9c67",
    "#ff0000"
  ],
  asiatico: [
    "#ef6700",
    "#e75700",
    "#f37a00",
    "#d94a00",
    "#f78f00",
    "#c14700",
    "#d16c00",
    "#faa900",
    "#ffca00",
    "#db6100"
  ],
  americano: [
    "#d152a2",
    "#c44594",
    "#a73576",
    "#b63986",
    "#ac006b",
    "#de63af",
    "#d70060",
    "#e97ac1",
    "#ff006c",
    "#ff8eff"
  ],
  oceanico: [
    "#a4ac00",
    "#7f8900",
    "#b4bd00",
    "#607a00",
    "#959241",
    "#c5cf00",
    "#ffff92",
    "#476600",
    "#d7e21c",
    "#4a6900"
  ]
};

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

// TITLE DATA //////////////////////////////////////////////////
console.log("titleCoord", titleCoord);
const titleCoordShuffled = d3.shuffle(titleCoord);
const titleCoordReduced = titleCoordShuffled.slice(0, 6000);

console.log("titleCoordReduced", titleCoordReduced);

// PLANT DATA //////////////////////////////////////////////////
console.log("plantCoord", plantCoord);
const plantCoordShuffled = d3.shuffle(plantCoord);
const plantCoordReduced = plantCoordShuffled.slice(0, 6000);

const svg = d3
  .select("#svgContainer")
  .append("svg")
  .attr("id", "chartSVG")
  .attr("width", width)
  .attr("height", height);

const svgContainer = svg.append("g");

d3.queue()
  .defer(d3.csv, "/data/garden/garden-atlas-reduced.csv", d => {
    d.longSevilla = +d.long;
    d.latSevilla = +d.lat;
    return d;
  })
  .await(drawMap);

function drawMap(error, specimensData, totals, origins, world) {
  if (error) throw error;
  console.log("specimensData", specimensData);

  // Assign a random color, positioned in Sevilla
  specimensData.forEach(obj => {
    const id = getRandomInt(0, 9);
    obj.color = originColors[obj.origin][id];
    obj.positioned = "sevilla";
  });

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
      .attr("r", 0.75)
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

  console.log("titleCoordReduced length", titleCoordReduced.length); // 6646
  const specimensToTitle = d3
    .shuffle(specimensData)
    .slice(0, titleCoordReduced.length);

  specimensToTitle.forEach((specimen, i) => {
    specimen.coordXTitle = titleCoordReduced[i].x * width;
    specimen.coordYTitle = titleCoordReduced[i].y * height;
    specimen.coordXPlant = plantCoordReduced[i].x * width;
    specimen.coordYPlant = plantCoordReduced[i].y * width;
  });
  console.log("specimensToTitle", specimensToTitle);

  drawSpecimentsToCanvas(specimensData);
  setTimeout(drawTitle, 2000);

  function drawTitle() {
    cleanCanvas();
    svgContainer
      .selectAll(".titlePoints")
      .data(specimensToTitle)
      .enter()
      .append("circle")
      .attr("class", "titlePoints")
      .attr("cx", d => sevillaProjection([d.longSevilla, d.latSevilla])[0])
      .attr("cy", d => sevillaProjection([d.longSevilla, d.latSevilla])[1])
      .attr("r", 0.5)
      .style("fill", "white")
      .transition()
      .duration(4000)
      .attr("cx", d => d.coordXPlant)
      .attr("cy", d => d.coordYPlant)
      .transition()
      .duration(4000)
      .delay(4000)
      .attr("cx", d => d.coordXTitle)
      .attr("cy", d => d.coordYTitle);
  }
}
function getRandomInt(min, max) {
  return Math.floor(d3.randomBates(2)() * (max - min + 1)) + min;
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
