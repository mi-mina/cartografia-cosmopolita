const width = document.body.clientWidth - 20;
const height = width / 1.7778; // 16:9

let animate;
let stopAnimation = false;

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
// Setup PIXI ///////////////////////////////////////////////
// //////////////////////////////////////////////////////////
let app = new PIXI.Application(width, height, {
  // backgroundColor: 0x000000,
  antialias: true
});
let view = app.view;
let renderer = app.renderer;
let stage = app.stage;

document.getElementById("chart").append(view);
view.id = "canvas";

let graphics = new PIXI.Graphics();
stage.addChild(graphics);

const generateCircleTexture = (renderer, radius, color) => {
  const gfx = new PIXI.Graphics();
  const texture = PIXI.RenderTexture.create(radius, radius);

  gfx.beginFill(color);
  gfx.drawCircle(radius / 2, radius / 2, radius);
  gfx.endFill();

  renderer.render(gfx, texture);

  return texture;
};

// let circleTexture = new PIXI.Texture.fromImage("/img/circle.png");
// Creating the texture with a graphics seems to be equaly performant
let circleTexture = generateCircleTexture(renderer, 2, 0xffffff);

// //////////////////////////////////////////////////////////
// Colors ///////////////////////////////////////////////////
// //////////////////////////////////////////////////////////
const pointTransparency = "ff"; // "80"; //50%
const shadeTransparency = "60";
const originColors = {
  americano: 0x34ad59,
  africano: 0xf4b342,
  asiatico: 0xd52dac,
  oceanico: 0x6b6ecf,
  "europeo-mediterraneo": 0x17becf
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
  .translate([width / 2 - width * 0.08, height / 2])
  .center([-5.95, 37.38]);

// Path generators //////////////////////////////////////////
const worldPath = d3
  .geoPath()
  .projection(worldProjection)
  .context(graphics);
const sevillaPath = d3
  .geoPath()
  .projection(sevillaProjection)
  .context(graphics);

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
  // console.log("world", world);

  const parkZones = [
    ...new Set(specimensData.map(specimen => specimen["park_zona"]))
  ];
  const districts = [
    ...new Set(specimensData.map(specimen => specimen["distrito"]))
  ].sort((a, b) => sortByStrings(a, b));

  // console.log("parkZones", parkZones);
  console.log("districts", districts);

  const specimensDataFiltered = specimensData
    .filter(specimen => {
      const district = specimen["distrito"];
      if (district !== "Sur" && district !== "Casco Antiguo") return true;
    })
    .sort((a, b) => sortByStrings(a, b, "distrito"));

  // const specimensDataFiltered = specimensData.filter(specimen => {
  //   const zone = specimen["park_zona"];
  //   if (zone === "CEIP Andalucía" || zone === "CEIP San José Obrero")
  //     return true;
  // });

  const specimensDataBatched = [];
  districts.forEach(district => {
    const specimensByDistrict = specimensDataFiltered.filter(
      specimen => specimen["distrito"] === district
    );
    if (specimensByDistrict.length !== 0)
      specimensDataBatched.push(specimensByDistrict);
  });
  // parkZones.forEach(zone => {
  //   const specimensByZone = specimensDataFiltered.filter(
  //     specimen => specimen["park_zona"] === zone
  //   );
  //   if (specimensByZone.length !== 0)
  //     specimensDataBatched.push(specimensByZone);
  // });
  console.log("specimensDataBatched", specimensDataBatched);

  const batches = specimensDataBatched.map((batch, i, array) => {
    let acc0 = 0;
    let acc1 = 0;
    for (let a = 0; a < i; a++) {
      acc0 = acc0 + array[a].length;
    }
    for (let a = 0; a < i + 1; a++) {
      acc1 = acc1 + array[a].length;
    }
    return [acc0, acc1 - 1];
  });
  console.log("batches", batches);

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

  const specimenSprites = specimensDataFiltered.map(({ long, lat, origin }) => {
    const dot = new PIXI.Sprite(circleTexture);
    const color = originColors[origin];
    const coordX = sevillaProjection([+long, +lat])[0];
    const coordY = sevillaProjection([+long, +lat])[1];

    dot.tint = color;
    dot.BLEND_MODES = PIXI.BLEND_MODES.MULTIPLY;
    dot.anchor.x = 0.5;
    dot.anchor.y = 0.5;
    dot.position.x = coordX;
    dot.position.y = coordY;
    dot.scale.x = dot.scale.y = 1;
    dot.alpha = 0.8;

    //Add to the container
    stage.addChild(dot);

    return dot;
  });

  console.log("specimenSprites", specimenSprites);

  const numStates = 2;
  const allStates = specimensDataFiltered.map(specimen => {
    const states = [];
    const specimenOrigin = specimen.origin;
    const longLat = originCentroids[specimenOrigin];
    const originCentroidX = worldProjection([+longLat.long, +longLat.lat])[0];
    const originCentroidY = worldProjection([+longLat.long, +longLat.lat])[1];
    const sevillaCentroidX = sevillaProjection([
      +specimen.long,
      +specimen.lat
    ])[0];
    const sevillaCentroidY = sevillaProjection([
      +specimen.long,
      +specimen.lat
    ])[1];

    states[0] = [[sevillaCentroidX, sevillaCentroidY]];
    states[1] = [[originCentroidX, originCentroidY]];

    return states;
  });
  console.log("allStates", allStates);

  // Draw //////////////

  // black background for downloaded png images
  // graphics.beginFill(0x000000, 1);
  // graphics.drawRect(0, 0, width, height);
  // graphics.endFill();

  // animate the changes between states over time
  const fps = 60;
  const tweenTime = 1;
  const tweenFrames = fps * tweenTime; // i.e. 120

  let state = 0;
  let frame = 0;
  let progress = 0;
  let batchId = 0;

  const animate = () => {
    // console.log("animate");
    // console.log("state", state);
    // console.log("frame", frame);
    // console.log("progress", progress);
    // console.log("batchId", batchId);

    // track circles and positions
    // let circle, c;
    let circle, c;
    let currPos;
    let nextPos;

    // track progress as proportion of frames completed
    frame = ++frame % tweenFrames; // From O to 119 then 0 again
    progress = frame / tweenFrames || 1e-6; // From 0 to 1

    // increment state counter once we've looped back around
    if (frame === 0) {
      state = ++state % (numStates - 1); //  % numStateshace que empiece de cero otra vez cuando sobre pasa 50 (numStates)
      // state = ++state % numStates; //  % numStateshace que empiece de cero otra vez cuando sobre pasa 50 (numStates)
    }

    if ((frame === 0) & (state === 0)) {
      batchId = ++batchId; // % batches.length; //  % numStateshace que empiece de cero otra vez cuando sobre pasa 50 (numStates)
    }

    // update scale and color of all circles by
    // interpolating current state and next state
    for (c = batches[batchId][0]; c < batches[batchId][1]; c++) {
      circle = specimenSprites[c];
      const circleStates = allStates[c];

      [currPos] = circleStates[state];
      [nextPos] = allStates[c][(state + 1) % numStates];
      // [nextPos] = circleStates[state + 1];

      x = currPos[0] + (nextPos[0] - currPos[0]) * progress;
      y = currPos[1] + (nextPos[1] - currPos[1]) * progress;

      circle.x = x;
      circle.y = y;
    }
    // cue up next frame then render the updates
    console.log("batchId", batchId);
    if (batchId < batches.length) requestAnimationFrame(animate);
    renderer.render(stage);
  };

  // animate();

  // //////////////////////////////////////////////////////////
  // Download PNG image ///////////////////////////////////////
  // //////////////////////////////////////////////////////////
  // const dwn = document.getElementById("downloadImage");
  // dwn.onclick = function() {
  //   app.renderer.extract.canvas(stage).toBlob(function(b) {
  //     var a = document.createElement("a");
  //     document.body.append(a);
  //     a.download = "puntos.png";
  //     a.href = URL.createObjectURL(b);
  //     a.click();
  //     a.remove();
  //   }, "image/png");
  // };
}

function sortByStrings(a, b, property) {
  if (a instanceof Object) {
    const stringA = a[property].toUpperCase();
    const stringB = b[property].toUpperCase();
    return stringA < stringB ? -1 : stringB < stringA ? 1 : 0;
  }
  if (a instanceof String) {
    const stringA = a.toUpperCase();
    const stringB = b.toUpperCase();
    return stringA < stringB ? -1 : stringB < stringA ? 1 : 0;
  }
}
