const width = document.body.clientWidth - 20;
const height = width / 1.7778;

// Setup PIXI //////////////////////////////////
const app = new PIXI.Application(width, height, {
  backgroundColor: 0x00ffff,
  antialias: true
});
const view = app.view;
document.getElementById("chart").append(view);

const stage = app.stage;
let graphics = new PIXI.Graphics();
console.log("graphics", graphics);

const circleTexture = new PIXI.Texture.fromImage("/img/circle.png");
console.log("circleTexture", circleTexture);

// Colors ///////////////////////////////////////////////////
const pointTransparency = "ff"; // "80"; //50%
const shadeTransparency = "60"; // "80"; //50%
const originColors = {
  americano: "#34ad59",
  africano: "#f4b342",
  asiatico: "#d52dac",
  oceanico: "#6b6ecf",
  "europeo-mediterraneo": "#17becf"
};

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

// const svg = d3
//   .select("#chart")
//   .append("svg")
//   .attr("id", "chartSVG")
//   .attr("width", width)
//   .attr("height", height);

// const graphContainer = svg.append("g");

Promise.all([
  d3.csv("/data/garden/gardenAtlas.csv"),
  d3.csv("/data/garden/paises_ISO3_origin.csv"),
  d3.json("data/maps/barrios-topo.json"),
  d3.json("data/maps/world-100m-topo.json")
]).then(([specimens, origins, barrios, world]) => {
  // console.log("specimens", specimens);

  const originsMap = {};
  origins.forEach(origen => {
    const id = Number(origen.UN);
    originsMap[id] = origen["origin"];
  });

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

  console.log("oceaniaGeometries", oceaniaGeometries);
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
  console.log("oceaniaSpecimens", oceaniaSpecimens);

  const worldSpecimens = [
    africaSpecimens,
    americaSpecimens,
    asiaSpecimens,
    europaSpecimens,
    oceaniaSpecimens
  ];

  worldSpecimens.sort((a, b) => b.length - a.length);

  const africaCentroid = {
    long: 24.3697,
    lat: -1.9326,
    origin: "africano",
    size: africaSpecimens.length
  };
  const americaCentroid = {
    long: -85.5911,
    lat: 13.9127,
    origin: "americano",
    size: americaSpecimens.length
  };
  const asiaCentroid = {
    long: 86.9311,
    lat: 40.6368,
    origin: "asiatico",
    size: asiaSpecimens.length
  };
  const europaCentroid = {
    long: 13.2472,
    lat: 46.909,
    origin: "europeo-mediterraneo",
    size: europaSpecimens.length
  };
  const oceaniaCentroid = {
    long: 134.1076,
    lat: -24.0026,
    origin: "oceanico",
    size: oceaniaSpecimens.length
  };
  const centroids = [
    africaCentroid,
    americaCentroid,
    asiaCentroid,
    europaCentroid,
    oceaniaCentroid
  ];

  // Draw functions //////////////////////////////
  // const drawContinentsBorders = originGeometry => {
  //   const origin = originGeometry[0].origin;
  //   graphContainer
  //     .append("path")
  //     .datum(topojson.merge(world, originGeometry))
  //     .attr("d", worldPath)
  //     .style("fill", "none")
  //     .style("stroke-width", "0.5px")
  //     .style("stroke", originColors[origin]);
  // };

  console.log(
    "topojson.merge(world, africaGeometries)",
    worldPath(topojson.merge(world, africaGeometries))
  );

  // set a fill and line style
  graphics.beginFill(0xff3300);
  graphics.lineStyle(4, 0xffd900, 1);

  // draw a shape
  graphics.moveTo(50, 50);
  graphics.lineTo(250, 50);
  graphics.lineTo(100, 100);
  graphics.lineTo(50, 50);
  graphics.endFill();

  // Land
  // graphics.beginFill(0xf7f7f7, 1);
  // graphics.lineStyle(1, 0xf4427d, 1);
  // worldPath(topojson.merge(world, africaGeometries));
  // graphics.endFill();

  // const drawContinentsShade = (originGeometry, color) => {
  //   graphContainer
  //     .append("path")
  //     .datum(topojson.merge(world, originGeometry))
  //     .attr("d", worldPath)
  //     .style("fill", color + shadeTransparency)
  //     .style("stroke", "none");
  // };
  // Barrios Sevilla
  // const drawSevillaBarrios = () => {
  //   graphContainer
  //     .append("path")
  //     .datum(topojson.feature(barrios, barrios.objects.Barrios))
  //     .attr("d", sevillaPath)
  //     .style("fill", "none")
  //     .style("stroke", "#333333");
  // };

  const drawSpecimens = origin => {
    const originName = origin[0].origin.split("/")[0];
    // graphContainer
    //   .selectAll(".specimen" + originName)
    //   .data(origin)
    //   .enter()
    //   .append("circle")
    //   .attr("class", "specimen" + originName)
    //   .attr("cx", d => sevillaProjection([+d.long, +d.lat])[0])
    //   .attr("cy", d => sevillaProjection([+d.long, +d.lat])[1])
    //   .attr("r", "0.5px")
    //   .attr("fill", d => originColors[d.origin] + pointTransparency);

    //Draw each circle
    origin.forEach((d, i) => {
      const dot = new PIXI.Sprite(circleTexture);
      const color = originColors[originName] + pointTransparency;
      const coordX = sevillaProjection([+d.long, +d.lat])[0];
      console.log("coordX", coordX);

      dot.tint = color;
      // dot.blendMode = PIXI.blendModes.MULTIPLY;
      dot.anchor.x = 0.5;
      dot.anchor.y = 0.5;
      dot.position.x = coordX;
      dot.position.y = sevillaProjection([+d.long, +d.lat])[1];
      // dot.scale.x = dot.scale.y = d.size;
      // dot.alpha = d.opacity;

      //Save the circle
      // dots[i] = dot;

      //Add to the container
      stage.addChild(dot);
    }); //forEach
  };

  //   const drawTotalsSpecimens = centroids => {
  //     graphContainer
  //       .selectAll(".totals")
  //       .data(centroids)
  //       .enter()
  //       .append("circle")
  //       .attr("class", d => "totals total" + d.origin)
  //       .attr("cx", d => worldProjection([+d.long, +d.lat])[0])
  //       .attr("cy", d => worldProjection([+d.long, +d.lat])[1])
  //       // .attr("r", d => Math.sqrt(d.size / Math.PI) + "px")
  //       .attr("r", 0)
  //       .attr("fill", d => originColors[d.origin] + shadeTransparency);
  //   };
  //   // World Testing
  //   // const geometriesWorld = topojson.feature(world, world.objects.countries)
  //   //   .features;
  //   // graphContainer
  //   //   .selectAll(".countries")
  //   //   .data(geometriesWorld)
  //   //   .enter()
  //   //   .append("path")
  //   //   .attr("class", "countries")
  //   //   .attr("id", d => d.id)
  //   //   .attr("d", worldPath)
  //   //   .style("fill", "none")
  //   //   .style("stroke-width", "0.5px")
  //   //   .style("stroke", "black");
  //   // DRAW ////////////////////////////////////
  //   // Continent shades
  //   // originGeometries.forEach(originGeometry => {
  //   //   const origin = originGeometry[0].origin;
  //   //   drawContinentsShade(originGeometry, originColors[origin]);
  //   // });
  //   // originGeometries.forEach(originGeometry => {
  //   //   const origin = originGeometry[0].origin;
  //   //   if (origin !== "asiatico") drawContinentsShade(originGeometry, "#444444");
  //   //   else drawContinentsShade(originGeometry, originColors[origin]);
  //   // });
  //   // Continent borders
  //   originGeometries.forEach(originGeometry => {
  //     drawContinentsBorders(originGeometry);
  //   });

  // Sevilla
  // drawSevillaBarrios();

  //   // Specimenn
  //   // worldSpecimens.forEach(origin => {
  //   //   drawSpecimens(origin);
  //   // });

  // drawSpecimens(europaSpecimens);
  // drawSpecimens(oceaniaSpecimens);
  // drawSpecimens(americaSpecimens);
  //   console.log("asiaSpecimens", asiaSpecimens);

  //   drawTotalsSpecimens(centroids);
  //   // setTimeout(movePoints, 4000);
  //   function movePoints() {
  //     graphContainer
  //       .selectAll(".specimen" + "oceanico")
  //       .transition()
  //       .duration(4000)
  //       .delay((d, i) => i * 10)
  //       .attr(
  //         "cx",
  //         d => worldProjection([oceaniaCentroid.long, oceaniaCentroid.lat])[0]
  //       )
  //       .attr(
  //         "cy",
  //         d => worldProjection([oceaniaCentroid.long, oceaniaCentroid.lat])[1]
  //       )
  //       .style("fill", "black")
  //       .on("end", d => {
  //         const actualRadio = d3.selectAll(".totaloceanico").attr("r");
  //         const actualArea = Math.PI * Math.pow(actualRadio, 2);
  //         const newRadio = Math.sqrt((actualArea + 1) / Math.PI);
  //         d3.selectAll(".totaloceanico").attr("r", newRadio);
  //       });
  //     graphContainer
  //       .selectAll(".specimen" + "americano")
  //       .transition()
  //       .duration(4000)
  //       .delay((d, i) => i * 10)
  //       .attr(
  //         "cx",
  //         d => worldProjection([americaCentroid.long, americaCentroid.lat])[0]
  //       )
  //       .attr(
  //         "cy",
  //         d => worldProjection([americaCentroid.long, americaCentroid.lat])[1]
  //       )
  //       .style("fill", "black")
  //       .on("end", d => {
  //         const actualRadio = d3.selectAll(".totalamericano").attr("r");
  //         const actualArea = Math.PI * Math.pow(actualRadio, 2);
  //         const newRadio = Math.sqrt((actualArea + 1) / Math.PI);
  //         d3.selectAll(".totalamericano").attr("r", newRadio);
  //       });
  //   }
  // d3.select("#downloadImage").on("click", function() {
  //   saveSvgAsPng(d3.select("#chartSVG").node(), "puntos.png", {
  //     scale: 2,
  //     backgroundColor: "black"
  //   });
  // });
});