/* =========================================================
   ENGINE CORE v0.1
   Shared foundation for 2D and 3D games.
   Contains: Game Loop, Entity System, Input, Scene Manager
   ========================================================= */

// ---------- 1. INPUT MANAGER ----------
class Input {
  constructor() {
    this.keys = {};        // currently held keys
    this.justPressed = {}; // true only on the frame key was first pressed

    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) this.justPressed[e.code] = true;
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  wasPressed(code) {
    return !!this.justPressed[code];
  }

  // call this at the END of every frame to clear "just pressed" state
  clearFrame() {
    this.justPressed = {};
  }
}

// ---------- 2. ENTITY (base class for anything in the game) ----------
class Entity {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.vx = 0; // velocity x
    this.vy = 0; // velocity y
    this.width = 32;
    this.height = 32;
    this.alive = true;
  }

  update(dt, engine) {
    // override in subclasses
  }

  draw(ctx) {
    // override in subclasses — default: draw a box so you always see SOMETHING
    ctx.fillStyle = '#4af';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  // simple AABB collision check against another entity
  collidesWith(other) {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }
}

// ---------- 3. SCENE (a collection of entities + its own update/draw logic) ----------
class Scene {
  constructor(name) {
    this.name = name;
    this.entities = [];
  }

  add(entity) {
    this.entities.push(entity);
    return entity;
  }

  remove(entity) {
    entity.alive = false;
  }

  update(dt, engine) {
    for (const e of this.entities) {
      if (e.alive) e.update(dt, engine);
    }
    // cleanup dead entities
    this.entities = this.entities.filter(e => e.alive);
  }

  draw(ctx) {
    for (const e of this.entities) {
      e.draw(ctx);
    }
  }
}

// ---------- 4. ENGINE (the game loop that ties everything together) ----------
class Engine {
  constructor(canvasId, width = 800, height = 600) {
    this.canvas = document.getElementById(canvasId);
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    this.input = new Input();
    this.scenes = {};
    this.currentScene = null;

    this.lastTime = 0;
    this.running = false;
  }

  addScene(scene) {
    this.scenes[scene.name] = scene;
    if (!this.currentScene) this.currentScene = scene;
  }

  switchScene(name) {
    if (this.scenes[name]) this.currentScene = this.scenes[name];
    else console.error(`Scene "${name}" not found`);
  }

  start() {
    this.running = true;
    requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
  }

  loop(timestamp) {
    if (!this.running) return;

    const dt = (timestamp - this.lastTime) / 1000; // delta time in seconds
    this.lastTime = timestamp;

    // clear screen
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // update + draw current scene
    if (this.currentScene) {
      this.currentScene.update(dt, this);
      this.currentScene.draw(this.ctx);
    }

    this.input.clearFrame();

    requestAnimationFrame((t) => this.loop(t));
  }
}

/* =========================================================
   USAGE EXAMPLE — a controllable box (proves the pipeline works)
   Delete this section once you're building your own game.
   ========================================================= */

class Player extends Entity {
  constructor(x, y) {
    super(x, y);
    this.width = 40;
    this.height = 40;
    this.speed = 200; // pixels per second
  }

  update(dt, engine) {
    const input = engine.input;
    this.vx = 0;
    this.vy = 0;

    if (input.isDown('ArrowLeft'))  this.vx = -this.speed;
    if (input.isDown('ArrowRight')) this.vx = this.speed;
    if (input.isDown('ArrowUp'))    this.vy = -this.speed;
    if (input.isDown('ArrowDown'))  this.vy = this.speed;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // keep on screen
    this.x = Math.max(0, Math.min(engine.canvas.width - this.width, this.x));
    this.y = Math.max(0, Math.min(engine.canvas.height - this.height, this.y));
  }

  draw(ctx) {
    ctx.fillStyle = '#4af';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// boot the engine
const engine = new Engine('gameCanvas', 800, 600);

const mainScene = new Scene('main');
const player = new Player(380, 280);
mainScene.add(player);

engine.addScene(mainScene);
engine.start();

