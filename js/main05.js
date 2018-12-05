const width = document.body.clientWidth;
const height = width / 1.7778;
// const sevillaGeomCenter = [-5.95864006569, 37.37354470255];
const sevillaCenter = [-5.994, 37.393];
const sevillaRadius = 0.1;
const steps = 25;

function calculateEquallySteppedRadius(radius, step) {
  const radii = [];
  for (let i = 0; i <= step; i++) {
    radii.push((radius / step) * i);
  }
  return radii.reverse();
}
const radii = calculateEquallySteppedRadius(sevillaRadius, steps);

const americaShuffled = d3.shuffle(americaDestPoints);
const africaShuffled = d3.shuffle(africaDestPoints);
const asiaShuffled = d3.shuffle(asiaDestPoints);
const oceaniaShuffled = d3.shuffle(oceaniaDestPoints);
const europaShuffled = d3.shuffle(europaDestPoints);
const destPoints = {
  americano: americaShuffled,
  africano: africaShuffled,
  asiatico: asiaShuffled,
  oceanico: oceaniaShuffled,
  "europeo-mediterraneo": europaShuffled
};

const destPointsJSON = JSON.stringify(destPoints);
console.log("destPoints", destPoints);

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
  specimensData.forEach(obj => (obj.positioned = "sevilla"));
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

  const allOriginGeometries = [
    africaGeometries,
    americaGeometries,
    asiaGeometries,
    europaGeometries,
    oceaniaGeometries
  ];

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
    console.log("calling drawSpecimentsToCustom");
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
      .attr("r", 1)
      .attr("fillStyle", d => {
        if (d.positioned === "sevilla") return originColors[d.origin] + "ff";
        else if (d.positioned === "world") return originColors[d.origin] + "80";
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

  // Continent shades
  // allOriginGeometries.forEach(originGeometry => {
  //   const origin = originGeometry[0].origin;
  //   drawContinentsShade(originGeometry, originColors[origin]);
  // });

  drawSpecimentsToCustom(specimensData);

  // drawSevillaBarrios();

  // Calculate distances to center so that the respective annulus are equal area

  // const radii = calcSteppedDistCenter(sevillaRadius, steps);

  // var radiiJSON = JSON.stringify(radii);
  // console.log("radiiJSON", radiiJSON);

  let counter = 0;
  setTimeout(moveBatch, 8000);

  function moveBatch() {
    console.log("counter", counter);

    if (counter <= steps) {
      const dataStay = specimensData.filter(specimen => {
        const originPoint = [+specimen.long, +specimen.lat];
        return (
          calcDistTwoPoints(originPoint, sevillaCenter) > radii[counter] ||
          calcDistTwoPoints(originPoint, sevillaCenter) < radii[counter + 1]
        );
      });

      const dataMove = specimensData.filter(specimen => {
        const originPoint = [+specimen.long, +specimen.lat];
        return (
          calcDistTwoPoints(originPoint, sevillaCenter) <= radii[counter] &&
          calcDistTwoPoints(originPoint, sevillaCenter) >= radii[counter + 1]
        );
      });
      console.log("dataMove", dataMove);

      drawSpecimentsToCustom(dataStay);
      counter++;
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
        .ease(d3.easeLinear)
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
        })
        .style("fill-opacity", 0.5)
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
