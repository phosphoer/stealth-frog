(function (TomatoJS, $, undefined)
{

TomatoJS.LevelGoal = function(parent)
{
  this.parent = parent;
}

TomatoJS.LevelGoal.prototype.OnCollide = function(obj)
{
  if (obj.GetComponent("PlayerController"))
  {
    var game = TomatoJS.Core.GetSystem("Game");
    game.TryLevelWin();
  }
}

TomatoJS.LevelGoal.prototype.Initialize = function()
{
}

TomatoJS.LevelGoal.prototype.Uninitialize = function()
{
}

} (window.TomatoJS = window.TomatoJS || {}, jQuery));