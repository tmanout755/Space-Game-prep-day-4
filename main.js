// Initialize Phaser
const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 800,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

let player;
let playerSpeed = 200;
let laserGroup;
let enemyGroup;
let emitter;
let score = 0;
let scoreText;
let lives = 3;
let livesText;
let gameOverText;
let laserSound;
let enemyDestroyedSound;
let playerDestroyedSound;

function preload() {
  this.load.image('player', 'assets/player.png');
  this.load.image('laser', 'assets/laser.png');
  this.load.image('enemy', 'assets/enemy.png');
  this.load.image('star', 'assets/star.png');
  this.load.atlas('explosion', 'assets/explosion.png', 'assets/explosion.json');
  this.load.audio('playerLaser', 'assets/sounds/laser_player.ogg');
  this.load.audio('playerDestroyed', 'assets/sounds/player_destroyed.ogg');
  this.load.audio('enemyDestroyed', 'assets/sounds/enemy_destroyed.ogg');
}

function create() {
  player = this.physics.add.sprite(300, 700, 'player');
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  laserGroup = new LaserGroup(this);
  enemyGroup = new EnemyGroup(this);

  // Loop to move each enemy
  enemyGroup.children.iterate(function(enemy) {
    move(enemy, this);
  }, this);

  // Add collision between lasers and enemies
  this.physics.add.overlap(enemyGroup, laserGroup, (enemy, laser) => {
    laserCollision(enemy, laser, this);
  });

  // Add score text
  scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

  // Add lives text
  livesText = this.add.text(16, 50, 'Lives: 3', { fontSize: '32px', fill: '#fff' });

  // Add collision between player and enemies
  this.physics.add.collider(player, enemyGroup, (player, enemy) => {
    playerEnemyCollision(player, enemy, this);
  }); 

  this.physics.add.collider(enemyGroup, laserGroup, (enemy, laser) => {
    laserCollision(enemy, laser, this);
  });

  emitter = this.add.particles(0, 0, 'explosion', {
       frame: ['red', 'yellow', 'green', 'blue', 'purple'],
       lifespan: 1000,
       speed: { min: 50, max: 100 },
       emitting: false
  });

  this.add.particles(0, 0, 'star', {
    x: { min: 0, max: 600 },
    frequency: 100,
    lifespan: 10000,
    speedY: { min: 100, max: 300 },
    scale: { min: 0.4, max: 0.6 },
    alpha: { min: 0.4, max: 0.6 },
    advance: 5000
  });

  laserSound = this.sound.add('playerLaser');
  enemyDestroyedSound = this.sound.add('enemyDestroyed');
  playerDestroyedSound = this.sound.add('playerDestroyed');
}

function update() {
  const cursors = this.input.keyboard.createCursorKeys();
  
  if (cursors.left.isDown) {
    player.setVelocityX(-playerSpeed);
  } else if (cursors.right.isDown) {
    player.setVelocityX(playerSpeed);
  } else {
    player.setVelocityX(0);
  }

  if (cursors.space.isDown && Phaser.Input.Keyboard.JustDown(cursors.space) && lives > 0) {
    fireLaser(laserGroup, player);
    laserSound.play();
  }

  checkLaserOutOfBounds(laserGroup, this);
  checkEnemyOutOfBounds(enemyGroup, this);
}

class LaserGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene) {
    super(scene.physics.world, scene);
    this.createMultiple({
      key: 'laser',
      frameQuantity: 20,
      active: false,
      visible: false,
      setXY: { x: -100, y: -100 }
    });
  }
}

function fireLaser(laserGroup, player) {
  let laser = laserGroup.getFirstDead(false, player.x, player.y);
  if (laser) {
    laser.setActive(true);
    laser.setVisible(true);
    laser.enableBody();
    laser.setVelocityY(-500);
  }
}

function checkLaserOutOfBounds(laserGroup, scene) {
  laserGroup.children.iterate(function(laser) {
    if (laser.y < 0 || laser.y > scene.game.config.height) {
      laser.setActive(false);
      laser.setVisible(false);
      laser.disableBody(true, true);
      laser.setVelocityY(0);
    }
  });
}

function laserCollision(enemy, laser, scene) {

  enemyDestroyedSound.play();
  emitter.explode(40, enemy.x, enemy.y);
  
  // Deactivate, hide, and disable the laser
  laser.setActive(false);
  laser.setVisible(false);
  laser.disableBody(true, true);

  // Reset the enemy's position
  move(enemy, scene);
  
  // Increase the score
  score += 1;
  scoreText.setText('Score: ' + score);
}

function playerEnemyCollision(player, enemy, scene) {
  playerDestroyedSound.play();
  
  // Move all enemies in the enemyGroup
  enemyGroup.children.iterate(function(enemy) {
    move(enemy, scene);
  });

  emitter.explode(40, player.x, player.y);
  emitter.explode(40, player.x, player.y);
  emitter.explode(40, player.x, player.y);

  // Decrease lives
  lives -= 1;
  livesText.setText('Lives: ' + lives);
  player.setVelocityY(0);

  if (lives <= 0) {
    // Game Over logic
    player.setActive(false);
    player.setVisible(false);
    player.disableBody(true, true);
    const gameOverText = scene.add.text(scene.game.config.width / 2, scene.game.config.height / 2, 'Game Over!', { fontSize: '64px', fill: '#f00' });
    gameOverText.setOrigin(0.5)
  }
  else {
    player.setPosition(300, 700)
  }
}