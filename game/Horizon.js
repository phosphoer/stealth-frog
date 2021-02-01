(function (TomatoJS, $, undefined)
{

TomatoJS.Horizon = function()
{
  this.zdepth = -500;

  this.numHeightPoints = 30;
  this.horizonColors =
  [
    "rgb(80, 80, 100)",
    "rgb(100, 100, 200)"
  ];

  this.sunColors =
  [
    "rgba(250, 200, 50, 1)",
    "rgba(250, 250, 20, 0)"
  ];

  this.terrainColor = "rgb(82, 37, 12)";

  this.heightMap = [];
}

TomatoJS.Horizon.prototype.Initialize = function()
{
  TomatoJS.Core.GetSystem("Graphics").AddRenderable(this);

  for (var i = 0; i < this.numHeightPoints; ++i)
    this.heightMap.push(TomatoJS.Rand(0.7, 0.9));
}

TomatoJS.Horizon.prototype.Uninitialize = function()
{
  TomatoJS.Core.GetSystem("Graphics").RemoveRenderable(this);
}

TomatoJS.Horizon.prototype.Draw = function(dt, context, camera)
{
  if (!this.paused)
    this.elapsedTime += dt;

  // Create horizon gradient
  var gradient = context.createLinearGradient(0, 0, 0, TomatoJS.Core.canvas.height);
  for (var i in this.horizonColors)
    gradient.addColorStop(i, this.horizonColors[i]);

  // Draw horizon
  context.fillStyle = gradient;
  context.fillRect(0, 0, TomatoJS.Core.canvas.width, TomatoJS.Core.canvas.height);

  // Create sun gradient
  var midX = TomatoJS.Core.canvas.width / 2;
  var bottom = TomatoJS.Core.canvas.height * 3 / 4;
  var gradient = context.createRadialGradient(midX, bottom, 50, midX, bottom, 300);
  for (var i in this.sunColors)
    gradient.addColorStop(i, this.sunColors[i]);

  // Draw sun
  context.fillStyle = gradient;
  context.fillRect(0, 0, TomatoJS.Core.canvas.width, TomatoJS.Core.canvas.height);

  // Draw land
  context.fillStyle = this.terrainColor;
  context.beginPath();
  context.moveTo(0, TomatoJS.Core.canvas.height - 200 * this.heightMap[0]);
  for (var i = 1; i < this.heightMap.length; ++i)
  {
    var x = i * TomatoJS.Core.canvas.width / (this.heightMap.length - 1);
    context.lineTo(x, TomatoJS.Core.canvas.height - 200 * this.heightMap[i]);
  }
  context.lineTo(TomatoJS.Core.canvas.width, TomatoJS.Core.canvas.height);
  context.lineTo(0, TomatoJS.Core.canvas.height);
  context.fill();
  context.closePath();
}

} (window.TomatoJS = window.TomatoJS || {}, jQuery));