(function (TomatoJS, $, undefined)
{

TomatoJS.FrogPhysics = function()
{
  //STATICS, DO NOT MODIFY!
  this.ContactNone = 0;
  this.ContactAbove = 1;
  this.ContactRight = 2;
  this.ContactBelow = 3;
  this.ContactLeft = 4;

  //serializeable variables
  this.slideVelocityFriction = 1;
  this.ceilingGripTime = 0;

  //other variables
  this.contactLocation = this.ContactNone;
  this.elapsedGripTime = 0;
  this.cCheckOffset = .5;
}

TomatoJS.FrogPhysics.prototype.Initialize = function()
{
  TomatoJS.Core.AddEventListener("OnFrameBegin", this);

  //if elapsed time is less than grip time, it will be incremented in the update function
  this.elapsedGripTime = this.ceilingGripTime + 1;

}

TomatoJS.FrogPhysics.prototype.Uninitialize = function()
{
  TomatoJS.Core.RemoveEventListener("OnFrameBegin", this);
}

TomatoJS.FrogPhysics.prototype.OnFrameBegin = function(dt)
{
  var tileColl = this.parent.GetComponent("TileCollider");
  var rBody = this.parent.GetComponent("RigidBody");
  var rTile = tileColl.GetTileInWorld(tileColl.width/2 + this.cCheckOffset, 0, TomatoJS.TileMap.prototype.CollisionAttr);
  var lTile = tileColl.GetTileInWorld(-(tileColl.width/2 + this.cCheckOffset), 0, TomatoJS.TileMap.prototype.CollisionAttr);
  var dTile = tileColl.GetTileInWorld(0, tileColl.height/2 + this.cCheckOffset, TomatoJS.TileMap.prototype.CollisionAttr);
  var uTile = tileColl.GetTileInWorld(0, -(tileColl.height/2 + this.cCheckOffset), TomatoJS.TileMap.prototype.CollisionAttr);

  TomatoJS.Core.GetSystem("Graphics").AddDebugBox(this.parent.x, this.parent.y - (tileColl.height/2 + this.cCheckOffset), 2, 2, "rgb(255, 0, 0)");

  //floor collision
  if(dTile == TomatoJS.TileMap.prototype.SolidTile)
  {
    this.contactLocation = this.ContactBelow;

    //**COPY PASTA FROM BELOW**
    //this way, floor collision trumps all other forms of collision, but if you
    //are in a 1 tall section and you jump, you may set the ceiling collision
    //timer, but it will be reset as soon as collision resolves and you are
    //contacting the floor again.
    rBody.gravityEnabled = true;
    if(this.elapsedGripTime != this.ceilingGripTime + 1)
      this.elapsedGripTime = this.ceilingGripTime + 1;
  }
  //ceiling collision
  else if(uTile == TomatoJS.TileMap.prototype.SolidTile)
  {
    this.contactLocation = this.ContactAbove;

    //we have been on this ceiling for elapsedGripTime amount of seconds
    if(this.elapsedGripTime < this.ceilingGripTime)
    {
      this.elapsedGripTime += dt;
      //disable gravity/stop movement
      rBody.velocityY += 0;
      rBody.gravityEnabled = false;
    }
    //we just hit this ceiling because elapsedGripTime is reset to it's 'default' value
    else if(this.elapsedGripTime == this.ceilingGripTime + 1)
    {
      this.elapsedGripTime = 0;
      //disable gravity/stop movement
      rBody.velocityY = 0;
      rBody.velocityX = 0.0;//THIS TOO
      rBody.gravityEnabled = false;
      this.parent.y -= 5;
    }
    else
    {
      rBody.gravityEnabled = true;
    }
    //else, we probably just finished the elapsedGripTime period and it's time
    //to fall off the wall do not do anything and it will be reset (below) this
    //way, we must lose contact with this ceiling before we can grip it again
  }
  else
  {
    //incase we just jumped off a wall
    if(this.elapsedGripTime != this.ceilingGripTime + 1)
    {
      this.elapsedGripTime = this.ceilingGripTime + 1;
      rBody.gravityEnabled = true;
    }

    //only slide down a wall if you are falling already
  //right wall collision
    if(rTile == TomatoJS.TileMap.prototype.SolidTile && rBody.velocityY >= 0.0)
    {
      if(this.contactLocation != this.ContactRight)
        rBody.velocityX = 0.0;
      rBody.velocityY *= this.slideVelocityFriction;
      this.contactLocation = this.ContactRight;
    }
  //left wall collision
    else if(lTile == TomatoJS.TileMap.prototype.SolidTile && rBody.velocityY >= 0.0)
    {
      if(this.contactLocation != this.ContactLeft)
        rBody.velocityX = 0.0;
      rBody.velocityY *= this.slideVelocityFriction;
      this.contactLocation = this.ContactLeft;
    }
  //in air right/not next to anything
    else
    {
      this.contactLocation = this.ContactNone;
    }
  }

}

} (window.TomatoJS = window.TomatoJS || {}, jQuery));