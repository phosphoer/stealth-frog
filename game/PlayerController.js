(function (TomatoJS, $, undefined)
{

TomatoJS.PlayerController = function(parent)
{
  this.parent = parent;
  this.maxJumpPower = 600;
  this.jumpCharge = 0;
  this.isCharging = false;
  this.chargeMode = 0;
  this.fullChargeWaitTime = 0.3;
  this.fullChargeWaitTimer = 0;
  this.chargeSpeeds = [3, 0.5];
  this.jumpAngle = 0;
  this.air = 50;
  this.underWaterTimer = 0;
  this.underWater = false;
  this.lookDirection = 0;
  this.inJump = false;

  this.zdepth = 300;

  this.jumpBar = 0;
}

TomatoJS.PlayerController.prototype.Initialize = function()
{
  TomatoJS.Core.AddEventListener("OnFrameBegin", this);
  TomatoJS.Core.AddEventListener("OnMouseDown", this);
  TomatoJS.Core.AddEventListener("OnMouseUp", this);
  TomatoJS.Core.AddEventListener("OnPlayerDeath", this);

  TomatoJS.Core.GetSystem("Graphics").AddRenderable(this);

  var that = this;
  this.parent.GetComponent("ParticleEmitter").particleFunction = function(p)
  {
    var collider = that.parent.GetComponent("TileCollider");
    var tilemap = collider.GetTileMap();
    if (tilemap.GetTileInWorld(p.x, p.y, tilemap.ImageAttr) != 5)
    {
      p.speed = 0;
    }
  }
}

TomatoJS.PlayerController.prototype.Uninitialize = function()
{
  TomatoJS.Core.RemoveEventListener("OnFrameBegin", this);
  TomatoJS.Core.RemoveEventListener("OnMouseDown", this);
  TomatoJS.Core.RemoveEventListener("OnMouseUp", this);
  TomatoJS.Core.RemoveEventListener("OnPlayerDeath", this);

  TomatoJS.Core.GetSystem("Graphics").RemoveRenderable(this);
}

TomatoJS.PlayerController.prototype.OnMouseDown = function(event)
{
  if (TomatoJS.Core.editorEnabled)
    return;

  var collider = this.parent.GetComponent("TileCollider");
  var frogPhysics = this.parent.GetComponent("FrogPhysics");
  if (collider.grounded || this.underWater || frogPhysics.contactLocation != frogPhysics.ContactNone)
  {
    this.fullChargeWaitTimer = 0;
    this.jumpCharge = 0;
    this.chargeMode = 0;
    this.isCharging = true;

    if (this.jumpBar != 0)
    {
      this.jumpBar.Destroy();
      this.jumpBar = 0;
    }

    this.jumpBar = TomatoJS.Core.LoadGameObject("JumpBar.json");
    this.jumpBar.GetComponent("Renderable").GetAnimation("Jump States").paused = true;
    this.jumpBar.GetComponent("Renderable").zdepth = 400;
  }
}

TomatoJS.PlayerController.prototype.OnMouseUp = function(event)
{
  if (this.isCharging)
  {
    this.isCharging = false;
    this.Jump();

    this.jumpBar.Destroy();
    this.jumpBar = 0;
  }
}

TomatoJS.PlayerController.prototype.Draw = function(dt, context, camera)
{
  var collider = this.parent.GetComponent("TileCollider");

  // Draw air indicator
  if (this.underWaterTimer > 0)
  {
    context.fillStyle = "rgba(100, 100, 255, 0.8)";
    var rectStart = [(this.parent.x - camera.x - collider.width / 2) * TomatoJS.CoreScale, (this.parent.y - camera.y - collider.height) * TomatoJS.CoreScale];
    var rectSize = [collider.width * (1 - this.underWaterTimer / this.air) * TomatoJS.CoreScale, 5];
    context.fillRect(rectStart[0], rectStart[1], rectSize[0], rectSize[1]);
  }
}

TomatoJS.PlayerController.prototype.OnFrameBegin = function(dt)
{
  if (TomatoJS.Core.editorEnabled)
    return;

  // Get siblings
  var collider = this.parent.GetComponent("TileCollider");
  var body = this.parent.GetComponent("RigidBody");
  var frogPhysics = this.parent.GetComponent("FrogPhysics");
  var renderable = this.parent.GetComponent("Renderable");

  // Handle charge
  if (this.isCharging)
  {
    this.jumpCharge += this.chargeSpeeds[this.chargeMode] * dt;

    if (this.jumpCharge > 1 && this.chargeMode == 0)
    {
      this.jumpCharge = 1;
      this.fullChargeWaitTimer += dt;

      if (this.fullChargeWaitTimer >= this.fullChargeWaitTime)
      {
        ++this.chargeMode;
        this.jumpCharge = 0;
      }
    }

    if (this.jumpCharge > 1 && this.chargeMode == 1)
      this.jumpCharge = 1;

    //set the render information for the jump bar above the player
    if(this.jumpBar != 0)
    {
      this.jumpBar.x = this.parent.x + Math.cos(this.jumpAngle) * 10;
      this.jumpBar.y = this.parent.y + Math.sin(this.jumpAngle) * 10;

      var jRend = this.jumpBar.GetComponent("Renderable");

      jRend.SetFrame( Math.floor( this.jumpCharge * (jRend.GetAnimation("Jump States").frames.length - 1) ) );

      jRend.rotation = this.jumpAngle;
    }
  }

  // Stop on the ground
  if (collider.grounded && !this.jump)
  {
    this.inJump = false;
    if (this.lookDirection == 1)
    {
      renderable.currentAnimation = "Idle Right";
      collider.offsetX = 2;
    }
    else
    {
      renderable.currentAnimation = "Idle Left";
      collider.offsetX = -2;
    }
    body.velocityX = 0;
  }

  // Change animation while sliding
  if (frogPhysics.contactLocation == frogPhysics.ContactLeft)
  {
    this.inJump = false;
    renderable.currentAnimation = "Slide Right";
    collider.offsetX = 2;
  }
  else if (frogPhysics.contactLocation == frogPhysics.ContactRight)
  {
    this.inJump = false;
    renderable.currentAnimation = "Slide Left";
    collider.offsetX = -2;
  }
  else if (frogPhysics.contactLocation == frogPhysics.ContactAbove)
  {
    if (this.lookDirection == 1)
      renderable.currentAnimation = "Hang Right";
    else
      renderable.currentAnimation = "Hang Left";
  }
  else if (frogPhysics.contactLocation == frogPhysics.ContactNone && !this.inJump && !this.jumping)
  {
    if (this.lookDirection == 1)
      renderable.currentAnimation = "Idle Right";
    else
      renderable.currentAnimation = "Idle Left";
  }

  // Handle jumping
  if (this.jump)
  {
    if (this.underWater)
    {
      this.parent.GetComponent("AudioEmitter").PlayBank("Swim");
    }
    else
    {
      if (this.jumpCharge < 0.5)
        this.parent.GetComponent("AudioEmitter").PlayBank("Jump Low");
      else
        this.parent.GetComponent("AudioEmitter").PlayBank("Jump High");
    }

    body.velocityX = Math.cos(this.jumpAngle) * this.jumpCharge * this.maxJumpPower;
    body.velocityY = Math.sin(this.jumpAngle) * this.jumpCharge * this.maxJumpPower;
    this.jump = false;
    this.jumpCharge = 0;
    this.inJump = true;

    if (this.lookDirection == 1)
      this.parent.GetComponent("Renderable").currentAnimation = "Jump Right";
    else
      this.parent.GetComponent("Renderable").currentAnimation = "Jump Left";

    this.parent.GetComponent("Renderable").elapsedTime = 0;

  }

  // Handle water
  var tile = collider.GetTile(0, 0, TomatoJS.TileMap.prototype.ImageAttr);
  if (tile == 5)
  {
    // Make a splash
    if (!this.underWater)
    {
      var splash = TomatoJS.Core.LoadGameObject("Splash.json");
      splash.x = this.parent.x;
      splash.y = this.parent.y;

      this.parent.GetComponent("AudioEmitter").PlayBank("Splash");
    }

    // Enable bubbles
    this.parent.GetComponent("ParticleEmitter").spawningActive = true;

    // Enable under water light
    this.parent.GetComponent("Light").active = true;

    // Slow down under water
    body.velocityX *= 0.95;
    body.velocityY *= 0.90;
    body.velocityY -= body.gravity * dt * 0.8;
    this.underWaterTimer += dt;
    this.underWater = true;

    // Drown
    if (this.underWaterTimer >= this.air)
    {
      TomatoJS.Core.DispatchEvent("OnPlayerDeath");
    }
  }
  // Above water
  else
  {
    this.parent.GetComponent("ParticleEmitter").spawningActive = false;
    this.underWaterTimer = 0;
    this.underWater = false;

    // Disable under water light
    this.parent.GetComponent("Light").active = false;
  }

  // Aim jump
  var graphics = TomatoJS.Core.GetSystem("Graphics");
  var mouseX = TomatoJS.Core.input.mouseX + graphics.camera.x;
  var mouseY = TomatoJS.Core.input.mouseY + graphics.camera.y;
  var playerToMouseVec = [mouseX - this.parent.x, mouseY - this.parent.y];
  var playerDistToMouse = TomatoJS.Vec2Length(playerToMouseVec);
  if (playerDistToMouse > 100)
    playerDistToMouse = 100;
  this.jumpAngle = Math.atan2(mouseY - this.parent.y, mouseX - this.parent.x);

  if (this.jumpAngle > 0 && this.jumpAngle < Math.PI / 2 || this.jumpAngle < 0 && this.jumpAngle > -Math.PI / 2)
    this.lookDirection = 1;
  else
    this.lookDirection = -1;

  var graphics = TomatoJS.Core.GetSystem("Graphics");
  var camera = graphics.camera;
  var canvas = graphics.canvas;
  var screenWidth = TomatoJS.Core.configData["canvasSize"][0];
  var screenHeight = TomatoJS.Core.configData["canvasSize"][1];

  // Camera controls
  var center = [this.parent.x - screenWidth / 2, this.parent.y - screenHeight / 2];
  var dist = [center[0] - camera.x, center[1] - camera.y];
  if (Math.abs(dist[0]) > 20)
    camera.x += dist[0] * 0.1;

  if (Math.abs(dist[1]) > 20)
    camera.y += dist[1] * 0.1;
}

TomatoJS.PlayerController.prototype.OnPlayerDeath = function()
{
  this.parent.Destroy();
  var deadPlayer = TomatoJS.Core.LoadGameObject("PlayerDead.json");
  deadPlayer.x = this.parent.x;
  deadPlayer.y = this.parent.y;
  deadPlayer.GetComponent("Renderable").rotation = Math.random() * Math.PI * 2;
  deadPlayer.GetComponent("RigidBody").velocityY = -500;
}

TomatoJS.PlayerController.prototype.Jump = function()
{
  this.jump = true;
}

} (window.TomatoJS = window.TomatoJS || {}, jQuery));