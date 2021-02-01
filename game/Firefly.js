(function (TomatoJS, $, undefined)
{

TomatoJS.Firefly = function()
{
  this.destPos = [0, 0];
  this.startPos = [0, 0];
  this.velocity = [0, 0];
  this.maxRadius = 10;
  this.speed = 0.8;
}

TomatoJS.Firefly.prototype.Initialize = function()
{
  TomatoJS.Core.AddEventListener("OnFrameBegin", this);

  this.startPos = [this.parent.x, this.parent.y];
  this.destPos = [this.parent.x, this.parent.y];
}

TomatoJS.Firefly.prototype.Uninitialize = function()
{
  TomatoJS.Core.RemoveEventListener("OnFrameBegin", this);
}

TomatoJS.Firefly.prototype.OnCollide = function(obj)
{
  if (obj.GetComponent("PlayerController"))
  {
    ++TomatoJS.Core.GetSystem("Game").numFireflies;
    this.parent.GetComponent("AudioEmitter").PlayBank("Pickup");
    this.parent.Destroy();
  }
}

TomatoJS.Firefly.prototype.OnFrameBegin = function(dt)
{
  var pos = [this.parent.x, this.parent.y];
  var dist = TomatoJS.Vec2DistancePoint(this.destPos, pos);
  if (dist < 1)
  {
    var dir = Math.random() * 2 * Math.PI;
    this.destPos = TomatoJS.Vec2Add(this.startPos, TomatoJS.Vec2Scale(TomatoJS.Vec2FromAngle(dir), this.maxRadius));
  }

  var delta = TomatoJS.Vec2Subtract(this.destPos, pos);
  TomatoJS.Vec2Normalize(delta);
  delta = TomatoJS.Vec2Scale(delta, this.speed);
  this.velocity = TomatoJS.Vec2Add(this.velocity, delta);
  this.velocity = TomatoJS.Vec2Scale(this.velocity, 0.98);
  this.parent.x += this.velocity[0] * dt;
  this.parent.y += this.velocity[1] * dt;

  //silly hack to draw a spline from the origin to the firefly
  // var splineComponent = this.parent.GetComponent("RenderableSpline");
  // splineComponent.zdepth = 50;
  // splineComponent.fillShape = true;
  // splineComponent.strokeWidth = 2;
  // splineComponent.fillColor = "#0076BF";
  // splineComponent.strokeColor = "#0070AC";
  // splineComponent.alpha = 0.5;
  // var s = [30,50];
  // var a = [s,[Math.floor(TomatoJS.Lerp(s[0],this.parent.x, 0.25)) - 15, Math.floor(TomatoJS.Lerp(s[1],this.parent.y, 0.25)) + 15],[Math.floor(TomatoJS.Lerp(s[0],this.parent.x, 0.75)) + 15, Math.floor(TomatoJS.Lerp(s[1],this.parent.y, 0.75)) - 15],[this.parent.x, this.parent.y]];
  // splineComponent.points = a;
  // splineComponent.CommitPoints();
}

} (window.TomatoJS = window.TomatoJS || {}, jQuery));