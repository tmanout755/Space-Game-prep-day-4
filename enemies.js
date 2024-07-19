class EnemyGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene) {
    super(scene.physics.world, scene);
    this.createMultiple({
      key: 'enemy',
      frameQuantity: 20,
      active: false,
      visible: false,
      setXY: { x: -100, y: -100 }
    });
  }
}

// Hello my name is Thomas

function move(enemy, scene) {
  // Randomize the enemy's position at the top of the screen
  enemy.x = Phaser.Math.Between(0, scene.game.config.width);
  enemy.y = 0;

  // Set the enemy to be active and visible
  enemy.setActive(true);
  enemy.setVisible(true);

  // Randomize the enemy's movement direction
  const direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;

  // Set the enemy's velocity to move downwards with a slight random horizontal offset
  enemy.setVelocityY(100 + Phaser.Math.Between(-50, 50));
  enemy.setVelocityX(direction * Phaser.Math.Between(20, 50));
}

function checkEnemyOutOfBounds(enemyGroup, scene) {
  enemyGroup.children.iterate(function(enemy) {
    if (enemy.y > scene.game.config.height
       || enemy.x < 0
       || enemy.x > scene.game.config.width) {
      move(enemy, scene);
    }
  });
}