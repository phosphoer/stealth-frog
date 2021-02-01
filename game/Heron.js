function CreateSpline(object)
{
  object.zdepth = 1;
  object.fillShape = false;
  object.strokeWidth = 2;
  object.strokeColor = "#646464";
  object.fillColor = "#646464"
  object.alpha = 1.0;
}

function TransformTentacle(t_list, x, y, angle)
{
  for (var i = 0; i < t_list.length; ++i)
  {
    var obj_x = t_list[i][0];
    var obj_y = t_list[i][1];
    t_list[i][0] = Math.floor(((obj_x * Math.cos(angle)) - (obj_y * Math.sin(angle))) + x);
    t_list[i][1] = Math.floor(((obj_y * Math.cos(angle)) + (obj_x * Math.sin(angle))) + y);
  }
}

function CreateTentacles(object)
{
  for (var i = 0; i < object.num_tentacles; ++i)
  {
    //create a game object and a spline
    var go = TomatoJS.Core.CreateGameObject();
    go.AddComponent("RenderableSpline");
    go.Initialize();
    var spline = go.GetComponent("RenderableSpline");
    CreateSpline(spline);
    object.tentacles.push(go);
  }
}

function DestroyTentacles(object)
{
  for (var i = 0; i < object.tentacles.length; ++i)
  {
    object.tentacles[i].Destroy();
  }
}

function clerp(a,b,t)
{
  return a + (b - a) * t * t * t;
}

function exp_lerp(a,b,t)
{
  return (b - a) * Math.pow(2,10 * (t - 1.0)) + a
}

function offScreen(spline)
{
  var camera = TomatoJS.Core.GetSystem("Graphics").camera;
  if (spline.commited === false) return false;

  if ((spline.x - camera.x + spline.scaledWidth) * TomatoJS.CoreScale < 0)
    return true;
  if ((spline.y - camera.y + spline.scaledHeight) * TomatoJS.CoreScale < 0)
    return true;
  if ((spline.x - camera.x - spline.scaledWidth) * TomatoJS.CoreScale > TomatoJS.Core.canvas.width)
    return true;
  if ((spline.y - camera.y - spline.scaledHeight) * TomatoJS.CoreScale > TomatoJS.Core.canvas.height)
    return true;

  return false;
}

function UpdateTentacles(object, dt)
{
  object.phase += dt * 2;
  for (var i = 0; i < object.tentacles.length; ++i)
  {
    if (offScreen(object.tentacles[i].GetComponent("RenderableSpline")) === true) continue;

    var points = [];
    for (var j = 0; j < 4; ++j)
    {
      var dont_kill_x = 1.0;
      if (j == 0)
      {
        dont_kill_x = 0.0;
      }
      points.push([dont_kill_x * object.tentacle_scale * (Math.sin(0.25*j * (2*Math.PI) + object.phase + (i/object.num_tentacles * 2 * Math.PI)) * 2), object.tentacle_scale * j]);
    }

    TransformTentacle(points, object.parent.x, object.parent.y, (i / object.num_tentacles) * (2 * Math.PI));

    //adjust tentacle for movement
    points[points.length - 1][0] -= Math.floor(object.moveDirections[object.currentView] * (object.tentacle_scale));

    //adjust tentacles for the player death
    if (object.killTimer != 0)
    {
      //last point
      var how_dead_is_player = object.killTimer / object.killTime;

      points[points.length - 1][0] = Math.floor(exp_lerp(points[points.length - 1][0], object.currentTarget.x, how_dead_is_player));
      points[points.length - 1][1] = Math.floor(exp_lerp(points[points.length - 1][1], object.currentTarget.y, how_dead_is_player));

      //second to last point
      how_dead_is_player *= 0.1;
      xdist = (points[points.length - 2][0] - object.parent.x) * 2.5;
      ydist = (points[points.length - 2][1] - object.parent.y) * 2.5;
      points[points.length - 2][0] = Math.floor(exp_lerp(points[points.length - 2][0] + xdist, object.currentTarget.x, how_dead_is_player));
      points[points.length - 2][1] = Math.floor(exp_lerp(points[points.length - 2][1] + ydist, object.currentTarget.y, how_dead_is_player));
    }

    object.tentacles[i].GetComponent("RenderableSpline").points = points;
    object.tentacles[i].GetComponent("RenderableSpline").CommitPoints();
  }
}

(function (TomatoJS, $, undefined)
{

TomatoJS.Heron = function(parent)
{
  this.parent = parent;
  this.viewAngle = 0;
  this.viewFOV = 0.8;
  this.viewRange = 130;
  this.moveSpeed = 10;
  this.currentView = 0;
  this.viewOffset = [0, -1];
  this.viewTimer = 0;
  this.killTimer = 0;
  this.killTime = 2.5;
  this.isVladiusKiller = false;

  this.moveDirections = [1, 0, 0, -1, 0, 0];
  this.viewAngles = [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 2 * Math.PI / 3, Math.PI / 3];
  this.viewDurations = [3, 3, 3, 3, 3, 3];

  //tentacle list
  this.tentacles = [];
  this.phase = 0.0;
  this.num_tentacles = 6;
  this.tentacle_scale = 8;
}

TomatoJS.Heron.prototype.Initialize = function()
{
  TomatoJS.Core.AddEventListener("OnFrameBegin", this);

  CreateTentacles(this);
}

TomatoJS.Heron.prototype.Uninitialize = function()
{
  TomatoJS.Core.RemoveEventListener("OnFrameBegin", this);

  DestroyTentacles(this);
}

TomatoJS.Heron.prototype.OnFrameBegin = function(dt)
{
  if (TomatoJS.Core.editorEnabled)
    return;

  // Angle light
  var light = this.parent.GetComponent("Light");
  light.angle = this.viewAngle;
  light.arc = this.viewFOV;
  light.radius = this.viewRange;
  light.offsetX = this.viewOffset[0];
  light.offsetY = this.viewOffset[1];

  // Don't do normal heron behavior if we kill vlad
  if (this.isVladiusKiller)
  {
    return;
  }

  // Timer
  this.viewTimer += dt;

  // Change view
  var animator = this.parent.GetComponent("Animatable");
  if (this.viewTimer >= this.viewDurations[this.currentView] && this.killTimer == 0)
  {
    this.viewTimer = 0;
    ++this.currentView;
    if (this.currentView >= this.viewAngles.length)
      this.currentView = 0;

    animator.AnimateComponent("Heron", "viewAngle", null, this.viewAngles[this.currentView], 0.5, true);
  }

  // Move
  this.parent.x += this.moveDirections[this.currentView] * this.moveSpeed * dt;

  // Look for players
  var collider = this.parent.GetComponent("TileCollider");
  var nearby = collider.GetCollidersInRadius(this.viewRange);
  for (var i in nearby)
  {
    var player = nearby[i].parent.GetComponent("PlayerController");
    if (player)
    {
      var distance = this.parent.DistanceTo(player.parent);
      if (distance <= this.viewRange)
      {
        this.currentTarget = player.parent;
        var tileSystem = TomatoJS.Core.GetSystem("TileSystem");
        var canSee = tileSystem.InLineOfSight(collider.GetTileMap(), this.parent.x + this.viewOffset[0], this.parent.y + this.viewOffset[1],
                                              player.parent.x, player.parent.y, this.viewAngle, this.viewFOV)
        if (canSee)
        {
          this.killTimer += dt;
          this.viewAngle = Math.atan2(this.currentTarget.y - (this.parent.y + this.viewOffset[1]), this.currentTarget.x - (this.parent.x + this.viewOffset[0]));
        }
        else
        {
          this.killTimer = 0;
        }
      }
    }
  }

  UpdateTentacles(this,dt);

  // Kill player
  if (this.killTimer >= this.killTime && this.currentTarget)
  {
    TomatoJS.Core.DispatchEvent("OnPlayerDeath");
    this.killTimer = 0;
    this.currentTarget = null;
  }
}

} (window.TomatoJS = window.TomatoJS || {}, jQuery));