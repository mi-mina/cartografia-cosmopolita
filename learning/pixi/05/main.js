// https://bl.ocks.org/rflow/55bc49a1b8f36df1e369124c53509bb9#index.html
// Block by Alastair Dant

// init Pixi for fullscreen rendering
const doc = document.body;
const docWidth = window.innerWidth;
const docHeight = window.innerHeight;
const aspectRatio = docHeight / docWidth;

const app = new PIXI.Application(docWidth, docHeight);

const { view, renderer } = app;

doc.style.margin = 0;
view.style.position = "absolute";

doc.appendChild(view);

// helper that generates a bitmap texture containing
// a circle of the required radius and color
const generateCircleTexture = (renderer, radius, color) => {
  const gfx = new PIXI.Graphics();
  const tileSize = radius * 3;
  const texture = PIXI.RenderTexture.create(tileSize, tileSize);

  gfx.beginFill(color);
  gfx.drawCircle(tileSize / 2, tileSize / 2, radius);
  gfx.endFill();

  renderer.render(gfx, texture);

  return texture;
};

// create a grid of circles based on screen dimensions
const stage = new PIXI.Container();

const colCount = 50;
const colWidth = docWidth / colCount;

const rowCount = parseInt(colCount * aspectRatio);
const rowHeight = docHeight / rowCount;

const circleCount = rowCount * colCount;

console.log(circleCount);

const maxRadius = Math.min(colWidth, rowHeight) / 3;
const tileCenter = {
  x: (maxRadius * 3) / 2,
  y: (maxRadius * 3) / 2
};

const circleTexture = generateCircleTexture(renderer, maxRadius, 0xffffff);

const centroids = Array.from(Array(circleCount)).map((d, i) => {
  const col = i % colCount;
  const row = parseInt(i / colCount);

  const x = col * colWidth + colWidth / 2;
  const y = row * rowHeight + rowHeight / 2;

  return { col, row, x, y };
});

const circles = centroids.map(({ x, y }) => {
  const circleSprite = new PIXI.Sprite(circleTexture);

  circleSprite.x = x;
  circleSprite.y = y;

  circleSprite.anchor.set(0.5);

  stage.addChild(circleSprite);

  return circleSprite;
});

const minScale = 1e-6;
const maxScale = 1;
const randomScale = () => minScale + (maxScale - minScale) * Math.random();

const palette = chroma.brewer.YlGnBu;
const paletteRGB = palette.map(c => chroma(c).rgb());
const randomColor = () =>
  paletteRGB[Math.floor(palette.length * Math.random())];

// create a series of animation states for each circle
const numStates = 50;
const allStates = circles.map((circle, c) => {
  const states = Array(numStates);

  for (var i = 0; i < numStates; i++) {
    states[i] = [randomScale(), randomColor()];
  }

  return states;
});

// animate the changes between states over time
const fps = 60;
const tweenTime = 2;
const tweenFrames = fps * tweenTime;

let state = 0,
  frame = 0,
  progress = 0;

const animate = () => {
  // track circles, states and scales
  let circle, c;

  let currScale, nextScale, scale;
  let currColor, nextColor, color;

  let r, g, b;

  // track progress as proportion of frames completed
  frame = ++frame % tweenFrames;
  progress = frame / tweenFrames || 1e-6;

  // increment state counter once we've looped back around
  if (frame === 0) {
    state = ++state % numStates;
  }

  // update scale and color of all circles by
  // interpolating current state and next state
  for (c = 0; c < circleCount; c++) {
    circle = circles[c];

    [currScale, currColor] = allStates[c][state];
    [nextScale, nextColor] = allStates[c][(state + 1) % numStates];

    r = currColor[0] + (nextColor[0] - currColor[0]) * progress;
    g = currColor[1] + (nextColor[1] - currColor[1]) * progress;
    b = currColor[2] + (nextColor[2] - currColor[2]) * progress;

    scale = currScale + (nextScale - currScale) * progress;
    color = (r << 16) + (g << 8) + b;

    circle.scale.set(scale);
    circle.tint = color;
  }

  // cue up next frame then render the updates
  requestAnimationFrame(animate);
  renderer.render(stage);
};

animate();
