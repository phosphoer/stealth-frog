(function (TomatoJS, $, undefined)
{

TomatoJS.FrogCage = function(parent)
{
  this.parent = parent;
  this.collected = false;
}

TomatoJS.FrogCage.prototype.OnCollide = function(obj)
{
  if (obj.GetComponent("PlayerController") && !this.collected)
  {
    ++TomatoJS.Core.GetSystem("Game").numFrogsSaved;
    this.parent.GetComponent("AudioEmitter").PlayBank("Pickup");
    this.parent.Destroy();
    this.collected = true;
  }
}

TomatoJS.FrogCage.prototype.Initialize = function()
{
}

TomatoJS.FrogCage.prototype.Uninitialize = function()
{
}

} (window.TomatoJS = window.TomatoJS || {}, jQuery));