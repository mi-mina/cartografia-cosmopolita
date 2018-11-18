const app = new PIXI.Application(800, 600, { backgroundColor: 0x1099bb });
const view = app.view;

document.body.appendChild(view);

const container = new PIXI.Container();

app.stage.addChild(container);

const texture = new PIXI.Texture.fromImage("/assets/bunny.png");

for (var i = 0; i < 25; i++) {
  const bunny = new PIXI.Sprite(texture);
  const columnWidth = app.screen.width / 35;
  bunny.anchor.set(0.5);
  bunny.x = columnWidth * i;
  bunny.y = 0;
  // bunny.x = (i % 5) * 40;
  // bunny.y = Math.floor(i / 5) * 40;
  container.addChild(bunny);
}

// Center the container on the screen
container.x = (app.screen.width - container.width) / 2;
container.y = (app.screen.height - container.height) / 2;
