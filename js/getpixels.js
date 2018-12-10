const width = document.body.clientWidth;
const height = Math.floor(width / 1.777777777778);

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

// context.font = "6em Lobster";
// context.fillStyle = "white";
// context.textAlign = "center";
// context.fillText("COROTIPOS", width / 2, height / 2);

window.onload = function() {
  function getColor(x, y) {
    return context.getImageData(x, y, 1, 1).data;
  }
  d3.select("img").attr("width", width);
  d3.select("img").attr("height", height);
  canvas.node().width = width;
  canvas.node().height = height;
  const img = document.getElementById("plant");
  console.log("img", img);
  context.drawImage(img, 0, 0, width, height);

  const pixels = [...Array(width * height)].map((pixel, i) => {
    const col = i % width;
    const row = parseInt(i / width);
    const r = getColor(col, row)[0];
    const g = getColor(col, row)[1];
    const b = getColor(col, row)[2];
    return { x: col, y: row, rgb: [r, g, b] };
  });
  console.log("pixels", pixels);

  const titlePixels = pixels
    .filter(pixel => pixel.rgb.every(d => d !== 0))
    .map(pixel => {
      return { x: pixel.x / width, y: pixel.y / height };
    });
  console.log("titlePixels", titlePixels);

  const titlePixelsJSON = JSON.stringify(titlePixels);
  console.log("titlePixelsJSON", titlePixelsJSON);

  console.log("width", width);
  console.log("height", height);
  console.log("color", getColor(483, 343));
};
