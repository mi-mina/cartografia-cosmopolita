// The Application object creates a rectangular display area, an HTML canvas element
const app = new PIXI.Application(800, 600, { backgroundColor: 0x1099bb });
console.log("app", app);

// You can also add the width and the height in the options object with other properties
// {
//   width: 256,         // default: 800
//   height: 256,        // default: 600
//   antialias: true,    // default: false
//   transparent: false, // default: false
//   resolution: 1       // default: 1
// }

// antialias smoothes the edges of fonts and graphic primitives.
// resolution makes it easier to work with displays of varying resolutions and pixel densities.
// Usually keep the resolution at 1

console.log("renderer width", app.renderer.view.width);

// This is the canvas element
// view is a getter function of the app object to get the canvas element
const view = app.view;
console.log("view", view);

// We need to append the canvas to the document
document.body.append(view);

// To change the canvas size after it is set
// app.renderer.autoResize = true;
// app.renderer.resize(200, 200);

// To make the canvas fill the entire window
// app.renderer.view.style.position = "absolute";
// app.renderer.view.style.display = "block";
// app.renderer.autoResize = true;
// app.renderer.resize(window.innerWidth, window.innerHeight);

// Don't forget <style>* {padding: 0; margin: 0}</style>

// Create a new pixi sprite from an image
// Sprites are special image objects, images you can control with code

// There are 3 main ways to create Sprites
// - From a single image file.
// - From a sub-image on a tileset, a single, big image that includes all the images you'll need.
// - From a texture atlas (A JSON file that defines the size and position of an image on a tileset.)

const bunny = new PIXI.Sprite.fromImage("/assets/bunny.png");

// center the sprite's anchor point
bunny.anchor.set(0.5);

// move the sprite to the center of the screen
bunny.x = app.screen.width / 2;
bunny.y = app.screen.height / 2;

// The stage is a PIXI special object, a container, like an empty box

// Whatever you put inside the stage will be rendered on the canvas.
app.stage.addChild(bunny);

// Listen for animate update
app.ticker.add(function(delta) {
  // just for fun, let's rotate mr rabbit a little
  // delta is 1 if running at 100% performance
  // creates frame-independent transformation
  bunny.rotation += 0.1 * delta;
});
