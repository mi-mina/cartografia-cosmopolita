// //////////////////////////////////////////////////////////
// Calculate Destination points /////////////////////////////
// //////////////////////////////////////////////////////////

const calculalteDestPoints = originGeoJson => {
  const bbox = worldPath.bounds(originGeoJson);
  const x1 = Math.floor(bbox[0][0]);
  const y1 = Math.floor(bbox[0][1]);
  const x2 = Math.floor(bbox[1][0]);
  const y2 = Math.floor(bbox[1][1]);
  const width = x2 - x1;
  const height = y2 - y1;
  const step = 2;

  const initialPoints = [];

  for (let x = x1; x < width + x1; x += step) {
    for (let y = y1; y < height + y1; y += step) {
      initialPoints.push([x, y]);
    }
  }
  console.log("initialPoints", initialPoints);
  const destPoints = initialPoints.filter(point => {
    const x = point[0];
    const y = point[1];
    const invert = worldProjection.invert([x, y]);
    const long = invert[0];
    const lat = invert[1];

    return d3.geoContains(originGeoJson, [long, lat]);
  });
  return destPoints;
};

const geojson = topojson.merge(world, africaGeometries);
const destPoints = calculalteDestPoints(geojson);
const proyectedPoints = [];
destPoints.forEach(point => {
  proyectedPoints.push(worldProjection.invert(point));
});
console.log("destPoints", destPoints);
console.log("proyectedPoints", proyectedPoints);

var myJSON1 = JSON.stringify(proyectedPoints);
console.log(myJSON1);

const fillOpacity = 1;

const data = d3.shuffle(proyectedPoints).slice(0, 2228);
var myJSON2 = JSON.stringify(data);
console.log(myJSON2);

console.log("data", data);

svgContainer
  .selectAll(".destPoints")
  .data(data)
  .enter()
  .append("circle")
  .attr("class", d => d)
  .attr("cx", d => worldProjection(d)[0])
  .attr("cy", d => worldProjection(d)[1])
  .attr("r", 1)
  .style("fill", () => {
    const id = getRandomInt(0, 9);
    return originColors["africano"][id];
  })
  .style("fill-opacity", fillOpacity);

// //////////////////////////////////////////////////////////
// Parameters to calculate the batchs based on the distance to the center of Sevilla
// //////////////////////////////////////////////////////////

function calculateCenterRadius(data) {
  const extentLong = d3.extent(data, d => d.long);
  const extentLat = d3.extent(data, d => d.lat);
  const center = [
    (Number(extentLong[0]) + Number(extentLong[1])) / 2,
    (Number(extentLat[0]) + Number(extentLat[1])) / 2
  ];
  const radius = calcDistTwoPoints([extentLong[0], extentLat[0]], center);
  return {
    center,
    radius
  };
}

// //////////////////////////////////////////////////////////
// Origin centroids /////////////////////////////////////////
// //////////////////////////////////////////////////////////

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
// Stepped radii ////////////////////////////////////////////
// //////////////////////////////////////////////////////////

// Equally stepped //////////////////////////////////////////
function calculateEquallySteppedRadius(radius, step) {
  const radii = [];
  for (let i = 0; i <= step; i++) {
    radii.push((radius / step) * i);
  }
  return radii.reverse();
}

const originalRadii = [
  0.08629212601738274,
  0.08454867102501297,
  0.08276849963356757,
  0.08094918956412028,
  0.07908803987066493,
  0.0771820238791384,
  0.07522773138660965,
  0.07322129696387453,
  0.07115831004575578,
  0.0690337008139062,
  0.06684159339483102,
  0.06457511414667359,
  0.06222613700489474,
  0.059784938622097245,
  0.05723972087234475,
  0.05457593247064081,
  0.05177527561042965,
  0.04881419797591636,
  0.045661501109008254,
  0.042274335512506485,
  0.0385910119395692,
  0.0345168504069531,
  0.029892469311048622,
  0.02440709898795818,
  0.01725842520347655,
  0
];

// He colors transparency
// 100% — FF
// 95% — F2
// 90% — E6
// 85% — D9
// 80% — CC
// 75% — BF
// 70% — B3
// 65% — A6
// 60% — 99
// 55% — 8C
// 50% — 80
// 45% — 73
// 40% — 66
// 35% — 59
// 30% — 4D
// 25% — 40
// 20% — 33
// 15% — 26
// 10% — 1A
// 5% — 0D
// 0% — 00
