const width = document.body.clientWidth - 20;
const height = width / 1.7778;

// Setup PIXI //////////////////////////////////
let app = new PIXI.Application(width, height, {
  backgroundColor: 0x000000,
  antialias: true
});
let view = app.view;
document.getElementById("chart").append(view);

view.id = "canvas";

let stage = app.stage;

let graphics = new PIXI.Graphics();
stage.addChild(graphics);

let circleTexture = new PIXI.Texture.fromImage("/img/circle.png");

// Colors ///////////////////////////////////////////////////
const pointTransparency = "ff"; // "80"; //50%
const shadeTransparency = "60"; // "80"; //50%
const originColors = {
  americano: 0x34ad59,
  africano: 0xf4b342,
  asiatico: 0xd52dac,
  oceanico: 0x6b6ecf,
  "europeo-mediterraneo": 0x17becf
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

Promise.all([
  d3.csv("/data/garden/gardenAtlas.csv"),
  d3.csv("/data/garden/paises_ISO3_origin.csv"),
  d3.json("data/maps/barrios-topo.json"),
  d3.json("data/maps/world-100m-topo.json")
]).then(([specimens, origins, barrios, world]) => {
  console.log("world", world);

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
    const origin = originGeometry[0].origin;
    graphics.beginFill(0x000000, 1);
    graphics.lineStyle(1, originColors[origin], 1);
    worldPath(topojson.merge(world, originGeometry));
    graphics.endFill();
  };

  const drawSpecimens = origin => {
    const originName = origin[0].origin.split("/")[0];
    //Draw each circle
    origin.forEach((d, i) => {
      const dot = new PIXI.Sprite(circleTexture);
      const color = originColors[originName];
      const coordX = sevillaProjection([+d.long, +d.lat])[0];
      const coordY = sevillaProjection([+d.long, +d.lat])[1];

      dot.tint = color;
      dot.BLEND_MODES = PIXI.BLEND_MODES.MULTIPLY;
      dot.anchor.x = 0.5;
      dot.anchor.y = 0.5;
      dot.position.x = coordX;
      dot.position.y = coordY;
      dot.scale.x = dot.scale.y = 0.2;
      dot.alpha = 0.8;

      //Add to the container
      stage.addChild(dot);
    });
  };

  // Draw //////////////

  // black background for downloaded png images
  graphics.beginFill(0x000000, 1);
  graphics.drawRect(0, 0, width, height);
  graphics.endFill();

  drawContinentsBorders(africaGeometries);
  drawContinentsBorders(asiaGeometries);
  drawContinentsBorders(americaGeometries);
  drawContinentsBorders(europaGeometries);
  drawContinentsBorders(oceaniaGeometries);

  worldSpecimens.forEach(origin => drawSpecimens(origin));

  // Download PNG image
  const dwn = document.getElementById("downloadImage");
  dwn.onclick = function() {
    app.renderer.extract.canvas(stage).toBlob(function(b) {
      var a = document.createElement("a");
      document.body.append(a);
      a.download = "puntos.png";
      a.href = URL.createObjectURL(b);
      a.click();
      a.remove();
    }, "image/png");
  };
});
