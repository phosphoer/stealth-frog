(function (TomatoJS, $, undefined)
{

TomatoJS.OverworldPlayer = function()
{
  this.currentLevel = 1;
  this.animating = false;
  this.animateTime = 1;
}

TomatoJS.OverworldPlayer.prototype.Initialize = function()
{
  TomatoJS.Core.AddEventListener("OnFrameBegin", this);
  TomatoJS.Core.AddEventListener("OnMouseDown", this);
}

TomatoJS.OverworldPlayer.prototype.Uninitialize = function()
{
  TomatoJS.Core.RemoveEventListener("OnFrameBegin", this);
  TomatoJS.Core.RemoveEventListener("OnMouseDown", this);
}

TomatoJS.OverworldPlayer.prototype.OnMouseDown = function(evt)
{
  if (TomatoJS.Core.editorEnabled)
    return;

  if (evt.canvasX > 2 * TomatoJS.Core.configData["canvasSize"][0] / 3)
  {
    this.AnimateToLevel(this.currentLevel + 1);
  }

  if (evt.canvasX < 1 * TomatoJS.Core.configData["canvasSize"][0] / 3)
  {
    this.AnimateToLevel(this.currentLevel - 1);
  }

  if (evt.canvasX > 1 * TomatoJS.Core.configData["canvasSize"][0] / 3 && evt.canvasX < 2 * TomatoJS.Core.configData["canvasSize"][0] / 3)
  {
    var levelObj = TomatoJS.Core.GetGameObjectByName("level" + this.currentLevel);
    var required = parseInt(levelObj.GetFlag("numFrogsRequired"));
    if (required && required > TomatoJS.Core.GetSystem("Game").totalFrogsSaved)
      return;

    TomatoJS.Core.GetSystem("Game").currentLevel = TomatoJS.Core.GetGameObjectByName("level" + this.currentLevel).GetFlag("levelFile");
    TomatoJS.Core.GetSystem("Game").Restart();
  }
}

TomatoJS.OverworldPlayer.prototype.AnimateToLevel = function(levelIndex)
{
  if (this.animating)
    return;

  var levelObj = TomatoJS.Core.GetGameObjectByName("level" + levelIndex);
  var currentLevelObj = TomatoJS.Core.GetGameObjectByName("level" + this.currentLevel);
  if (!levelObj)
    return;

  var game = TomatoJS.Core.GetSystem("Game");
  if (currentLevelObj.GetFlag("numFrogsRequired") && parseInt(currentLevelObj.GetFlag("numFrogsRequired")) > game.totalFrogsSaved && levelIndex > this.currentLevel)
    return;

  if (currentLevelObj.GetFlag("story") && !game.saveData[currentLevelObj.GetFlag("levelFile")].beaten && levelIndex > this.currentLevel)
    return;

  this.animating = true;
  this.currentLevel = levelIndex;
  var that = this;
  this.parent.GetComponent("Animatable").Animate("x", null, levelObj.x, this.animateTime, false);
  this.parent.GetComponent("Animatable").Animate("y", null, levelObj.y, this.animateTime, true, function()
  {
    that.animating = false;
  });
}

TomatoJS.OverworldPlayer.prototype.OnFrameBegin = function(dt)
{
  // Position level info
  if (!this.animating)
  {
    var game = TomatoJS.Core.GetSystem("Game");
    var graphics = TomatoJS.Core.GetSystem("Graphics");

    var level = TomatoJS.Core.GetGameObjectByName("level" + this.currentLevel);
    var levelInfo = game.saveData[level.GetFlag("levelFile")];
    var levelData = TomatoJS.Core.resourceManager.GetLevel(level.GetFlag("levelFile"));

    var levelFrogs = 0;
    var levelFireflies = 0;

    for (var i in levelData.objects)
    {
      var obj = levelData.objects[i];
      if (!obj.blueprint)
        continue;
      if (obj.blueprint.search("Firefly") >= 0)
        ++levelFireflies;
      else if (obj.blueprint.search("FrogCage") >= 0)
        ++levelFrogs;
    }

    $("#LevelInfoName").text(level.GetFlag("levelName"));
    $("#LevelInfoFrogs").text("Frogs: " + (levelInfo ? levelInfo.numFrogsSaved : 0) + " / " + levelFrogs);
    $("#LevelInfoFireflies").text("Fireflies: " + (levelInfo ? levelInfo.numFireflies : 0) + " / " + levelFireflies);

    if (level.GetFlag("numFrogsRequired") && parseInt(level.GetFlag("numFrogsRequired")) > game.totalFrogsSaved)
      $("#LevelInfoRequired").text("Required Frogs: " + level.GetFlag("numFrogsRequired"));
    else
      $("#LevelInfoRequired").text("");

    $("#LevelInfo").css("left", this.parent.x - graphics.camera.x - $("#LevelInfo").outerWidth() / 2);
    $("#LevelInfo").css("top", this.parent.y - graphics.camera.y - 60);
    $("#LevelInfo").css("display", "block");
  }
  else
  {
    $("#LevelInfo").css("display", "none");
  }

  if (TomatoJS.Core.editorEnabled)
    return;

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

} (window.TomatoJS = window.TomatoJS || {}, jQuery));