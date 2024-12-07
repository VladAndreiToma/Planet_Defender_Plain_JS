class Planet{
    constructor(game){
        this.game = game;
        this.x = this.game.width * 0.5;
        this.y = this.game.height * 0.5;
        this.radius = 90;
        this.image = document.getElementById('planet');
    }
    draw( context ){
        context.drawImage( this.image , this.x - 100 , this.y - 100 );
        if( this.game.debug ){
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0. , Math.PI*2 );
            context.stroke();
        }
        //
    }
}

class Player{
    constructor( game ){
        this.game = game;
        this.x = this.game.width * 0.5;
        this.y = this.game.height * 0.5;
        this.radius=40;
        this.image = document.getElementById( 'player' );
        this.aim;
        this.angle = 0;
    }
    draw(context){
        context.save();
        context.translate( this.x , this.y );
        context.rotate( this.angle );
        context.drawImage( this.image ,-this.radius ,-this.radius );
        if( this.game.debug ){
            context.beginPath();
            context.arc( 0 , 0 , this.radius , 0 , Math.PI*2 );
            context.stroke();
        }
        context.restore(); // to change according to framing fps s
    }
    update(){
        this.aim = this.game.calculateAimingDirection( this.game.mouse , this.game.planet );
        this.x = this.game.planet.x + (this.game.planet.radius + this.radius)*this.aim[0];
        this.y = this.game.planet.y + (this.game.planet.radius + this.radius)*this.aim[1];
        this.angle = Math.atan2( -this.aim[3] , -this.aim[2] );
    }
    shoot(){
        const projectile = this.game.getProjectile();
        if( projectile ) projectile.start(this.x + this.radius * this.aim[0] ,
            this.y + this.radius * this.aim[1] , 
            this.aim[0] , this.aim[1]);
    }
}

// the projectile class -----
class Projectile{
    constructor( game ){
        this.game = game;
        this.x , this.y , this.radius = 5;
        this.speedX = 1 , this.speedY = 1;
        this.free = true;
        this.speedModifier = 5;
    }
    start( x , y , speedX , speedY ){
        this.free = false;
        this.x = x;
        this.y = y;
        this.speedX = speedX * this.speedModifier;
        this.speedY = speedY * this.speedModifier;
    }
    reset(){
        this.free = true;
    }
    draw( context ){
        if( !this.free ){
            context.save();
            context.beginPath();
            context.arc( this.x , this.y , this.radius , 0 , Math.PI * 2 );
            context.fillStyle = 'gold';
            context.fill();
            context.restore();
        }
    }
    update(){
        if( !this.free ){
            this.x += this.speedX;
            this.y += this.speedY; 
        }
        // if not in game area reset
        if( this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height ){
            this.reset();
        }
    }
}


class Enemy{
    constructor( game ){
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.radius = 40;
        this.width = this.radius * 2;
        this.height = this.radius * 2;
        this.speedX = 0;
        this.speedY = 0;
        this.angle = 0;
        this.free = true;
        this.collided = false;
    }
    start(){
        this.free = false;
        this.collided = false;
        this.frameY = Math.floor( Math.random() * 4 );
        this.frameX = 0;
        this.lives = this.maxLives;
        if( Math.random() < 0.5 ){
            this.x = Math.random() * this.game.width;
            this.y = Math.random() < -this.radius ? 0 : this.game.height + this.radius;
        }else{
            this.x = Math.random() < 0.5 ? -this.radius : this.game.width + this.radius;
            this.y = Math.random() * this.game.width;
        }
        const aim = this.game.calculateAimingDirection( this , this.game.planet );
        this.speedX = -1*aim[0];
        this.speedY = -1*aim[1];
        this.angle = Math.atan2( aim[3] , aim[2] ) + Math.PI * 0.5;
    }
    reset(){
        this.free = true;
    }
    hit( damage ){
        this.lives -= damage;
        if( this.lives >= 1 ) this.frameX++;
    }
    draw( context ){
        if( !this.free ){
            context.save();
            context.translate( this.x , this.y );
            context.rotate( this.angle );
            // so the enemy is "in focus"
            context.drawImage( this.image , this.frameX * this.width , this.frameY*this.height , this.width ,
                this.height , -this.radius , -this.radius , this.width , this.height
            );
            if( this.game.debug ){
                context.beginPath();
                context.arc( 0 , 0 , this.radius , 0 , Math.PI * 2 );
                context.stroke();
                context.fillText( this.lives , 0 , 0 );
            }
            context.restore();
        }
    }

    whatHappensOnCollision( focusObject ){
        focusObject.lives = 0;
        focusObject.speedX = 0;
        focusObject.speedY = 0;
    }

    update(){
        if( !this.free ){
            this.x += this.speedX;
            this.y += this.speedY;
            // enemy/planet collision
            if( this.game.checkCollision( this , this.game.planet ) && this.lives >= 1 ){
                this.whatHappensOnCollision( this );
                this.collided = true;
                this.game.lives--;
            }
            //enemy/player(rocket) collision
            if( this.game.checkCollision( this , this.game.player ) && this.lives >= 1 ){
                this.whatHappensOnCollision( this );
                this.collided = true;
                this.game.lives--;
            }
            //check collision enemy / projectile
            this.game.projectilePool.forEach( projectile => {
                if( !projectile.free && this.game.checkCollision( this , projectile )
                    && this.lives >= 1 ){
                    projectile.reset();
                    this.hit(1);
                }
            } );
            if( this.lives  < 1 && this.game.spriteUpdate )   this.frameX++;
            if( this.frameX > this.maxFrame ){ 
                this.reset();
                if( !this.collided )    this.game.score += this.maxLives;
            }
        }
    }
}

class Asteroid extends Enemy{
    constructor( game ){
        super(game);
        this.image = document.getElementById('asteroid');
        this.frameY = Math.floor(Math.random() * 4);
        this.frameX = 0;
        this.lives = 1;
        this.maxFrame = 7;
        this.maxLives = this.lives;
    }
}

class Lobstermorph extends Enemy{
    constructor( game ){
        super(game);
        this.image = document.getElementById('lobstermorph');
        this.frameY = Math.floor(Math.random() * 4);
        this.frameX = 0;
        this.lives = 8;
        this.maxFrame = 14;
        this.maxLives = this.lives;
    }
}

class Beetlemorph extends Enemy{
    constructor( game ){
        super( game );
        this.image = document.getElementById( 'beetlemorph' );
        this.frameY = Math.floor( Math.random() * 4 ); // 0-3 regions on y axis
        this.frameX = 0;
        this.lives = 1;
        this.maxFrame = 3;
        this.maxLives = this.lives;
    }
}

class Rhinomorph extends Enemy{
    constructor( game ){
        // i provide a context of the game
        // i want to overwrite it with special characteristics
        super(game);
        this.image = document.getElementById( 'rhinomorph' );
        this.frameX = 0;
        this.frameY = Math.floor( Math.random() * 4 ); // 0-3 regions on y axis
        this.lives = 4; // start from 0 -> 5d
        this.maxFrame = 5;
        this.maxLives = this.lives;
    }
}

class Game{
    constructor( canvas ){
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.planet = new Planet( this );
        this.player = new Player( this );
        
        this.lives = 3;
        
        this.mouse = {
            x: 0 , y: 0
        }
        this.debug = true;

        this.projectilePool = [];
        this.numberOfProjectiles = 30;
        this.createProjectilePool();

        this.enemyPool = [];
        this.numberOfEnemies = 20;
        this.createEnemyPool();

        this.enemyTimer = 0;
        this.enemyInterval = 1800;
        
        this.spriteUpdate = false;
        this.spriteTimer = 0;
        this.spriteInterval = 90;

        this.score = 0;
        this.winningScore = 200;

        this.gameOver = false;


        // making planet object listening to the event of mousemove
        window.addEventListener( 'mousemove' , (e) => {
            this.mouse.x = e.offsetX;
            this.mouse.y = e.offsetY;
         } );
        window.addEventListener('mousedown' , e => {
            this.mouse.x = e.offsetX;
            this.mouse.y = e.offsetY;
            this.player.shoot();
        });
        window.addEventListener( 'keyup' , e => {
            if( e.key === 'd' ) this.debug = !this.debug;
            else if( e.key === '1' ) this.player.shoot(); 
            console.log( this.debug );
        } );
    }
    render( context , deltaTime ){
        this.planet.draw( context );
        this.drawStatusText( context );
        this.player.draw( context );
        this.player.update();
        this.projectilePool.forEach( projectile =>{
            projectile.draw( context );
            projectile.update();
        });
        this.enemyPool.forEach( enemy => {
            enemy.draw( context );
            enemy.update();
        } );
        // periodically activate an enemy
        if( !this.gameOver ){
            if( this.enemyTimer < this.enemyInterval ){
                this.enemyTimer += deltaTime;
            }else{
               this.enemyTimer = 0;
               const enemy = this.getEnemy();
               if( enemy ){
                   enemy.start();
               }
           }
        }
        // periodically update sprites
        if( this.spriteTimer < this.spriteInterval ){
            this.spriteTimer += deltaTime;
            this.spriteUpdate = false;
        }else{
            this.spriteTimer = 0;
            this.spriteUpdate = true;
        }

        // the game WIN / LOSE condition

        if( this.score > this.winningScore || this.lives < 1 ){
            this.gameOver = true;
        }

        /*context.beginPath();
        context.moveTo( this.planet.x , this.planet.y );
     //   context.lineTo( this.mouse.x , this.mouse.y );
        context.stroke();*/
    }

    drawStatusText( context ){
        context.save();
        context.textAlign = 'left';
        context.font = "30px Impact";
        context.fillText( 'Score: ' + this.score , 20 , 30 );
        // making a simple life.bar
        for( let i = 0 ; i < this.lives ; i++ ){
            context.fillRect( 20 + 15*i , 60 , 15 , 30 );
        }
        if( this.gameOver ){
            context.textAlign = 'center';
            let message1 , message2;
            if( this.score >= this.winningScore ){
                //context.font = '100px Impact';
                message1 = "You Won!";
                message2 = "You made: " + this.score + " points";
            }else{
                message1 = 'You lose!';
                message2 = 'Try again!';   
            }
            context.font = '100px Impact';
            context.fillText( message1 , this.width*0.5 , 250 );
            context.font = '50px Impact';
            context.fillText( message2 , this.width*0.5 , 550 );
        }
    }

    calculateAimingDirection( a , b ){
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot( dx , dy );
        const aimOnX = dx / distance;
        const aimOnY = dy / distance;
        return [aimOnX , aimOnY , dx , dy ];
    }

    checkCollision( a , b ){
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot( dx , dy );
        const sumOfRadii = a.radius + b.radius;
        return distance < sumOfRadii;
    }

    createProjectilePool(){
        for( let i = 0 ; i < this.numberOfProjectiles ; i++ ){
            this.projectilePool.push( new Projectile( this ) );
        }
    }
    getProjectile(){
        for( let i = 0 ; i < this.projectilePool.length ; ++i ){
            if( this.projectilePool[i].free ){
                return this.projectilePool[i];
            }
        }
    }
    createEnemyPool(){
        for( let i = 0 ; i < this.numberOfEnemies ; i++ ){
            // create species randomly with a proportion of 1 to 3
            let randomSpeciesDecider = Math.random();
            //console.log('Random Decider:', randomSpeciesDecider);
            if (randomSpeciesDecider >= 0 && randomSpeciesDecider < 0.3) {
                //console.log('Creating Asteroid');
                this.enemyPool.push(new Asteroid(this));
            } else if ( randomSpeciesDecider >= 0.3 && randomSpeciesDecider < 0.4 ){
                this.enemyPool.push(new Rhinomorph( this ));
            } else if (randomSpeciesDecider >= 0.4 && randomSpeciesDecider < 0.7) {
                //console.log('Creating Lobstermorph');
                this.enemyPool.push(new Lobstermorph(this));
            } else if (randomSpeciesDecider >= 0.7) {
               // console.log('Creating Beetlemorph');
                this.enemyPool.push(new Beetlemorph(this));
            }
        }
    }
    getEnemy(){
        for( let i = 0 ; i < this.enemyPool.length ; i++ ){
            if( this.enemyPool[i].free )   return this.enemyPool[i];
        }
        return null;
    }
}

window.addEventListener( 'load' , function(){
    const canvas = document.getElementById( 'canvas1' );
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 800;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'white';
    ctx.font = '30px Helvetica';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const game = new Game( canvas );
    
    let lastTime = 0;
    
    function animate( timeStamp ){
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect( 0 , 0, canvas.width , canvas.height );
        game.render( ctx , deltaTime );
        requestAnimationFrame( animate );
        //console.log( deltaTime );
    }
    requestAnimationFrame( animate );


} );