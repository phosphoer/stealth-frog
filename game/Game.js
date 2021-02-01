(function (TomatoJS, $, undefined)
{

TomatoJS.Game = function()
{
  this.numFrogsSaved = 0;
  this.numFireflies = 0;
  this.totalFrogsSaved = 0;
  this.totalFireflies = 0;

  this.restartTime = 3;
  this.restartTimer = 0;
  this.restarting = false;
  this.inOverworld = false;

  this.currentLevel = "";

  this.nextScreenTimer = 0;
  this.currentSplash = 0;
  this.splashes =
  [
    "TeamLogo.json",
    "TomatoLogo.json"
  ];

  this.inMenu = false;

  if (localStorage["save"])
    this.saveData = JSON.parse(localStorage["save"]);
  else
    this.saveData = {};
}

TomatoJS.Game.prototype.Initialize = function()
{
  TomatoJS.Core.AddEventListener("OnPlayerDeath", this);
  TomatoJS.Core.AddEventListener("OnKeyDown", this);
  TomatoJS.Core.AddEventListener("OnMouseDown", this);

  TomatoJS.Core.GetSystem("UISystem").AddStyleSheet("menu.css");
  TomatoJS.Core.GetSystem("UISystem").AddStyleSheet("hud.css");
  TomatoJS.Core.GetSystem("UISystem").AddStyleSheet("dialog.css");
  TomatoJS.Core.GetSystem("UISystem").AddStyleSheet("overworld.css");
  TomatoJS.Core.GetSystem("UISystem").AddStyleSheet("pause.css");

  this.Splash();
}

TomatoJS.Game.prototype.Uninitialize = function()
{
  TomatoJS.Core.RemoveEventListener("OnPlayerDeath", this);
  TomatoJS.Core.RemoveEventListener("OnKeyDown", this);
  TomatoJS.Core.RemoveEventListener("OnMouseDown", this);
}

TomatoJS.Game.prototype.OnKeyDown = function(keyCode)
{
  if (this.nextScreenTimer > 0)
    this.nextScreenTimer = 0.01;

  // Remove dialogs
  if (this.dialogUIleft)
    this.RemoveDialog("left");
  else if (this.dialogUIright)
    this.RemoveDialog("right");

  // Pause
  if (keyCode == TomatoJS.Core.input.P || keyCode == TomatoJS.Core.input.ESCAPE && !this.paused)
  {
    if (!this.inMenu && !this.inOverworld)
      this.Pause();
  }
}

TomatoJS.Game.prototype.OnMouseDown = function(event)
{
  if (this.nextScreenTimer > 0)
    this.nextScreenTimer = 0.01;

  // Remove dialogs
  if (this.dialogUIleft)
    this.RemoveDialog("left");
  else if (this.dialogUIright)
    this.RemoveDialog("right");
}

TomatoJS.Game.prototype.Update = function(dt)
{
  // Display next splash screen
  if (this.nextScreenTimer > 0)
  {
    this.nextScreenTimer -= dt;

    if (this.nextScreenTimer <= 0)
    {
      ++this.currentSplash;
      if (this.currentSplash >= this.splashes.length)
        this.MainMenu();
      else
        this.Splash();
    }
  }

  // Restart game
  if (this.restarting)
  {
    this.restartTimer += dt;
    if (this.restartTimer > this.restartTime)
    {
      this.Restart();
    }
  }

  // Update HUD
  if (this.inOverworld)
  {
    this.totalFrogsSaved = 0;
    this.totalFireflies = 0;
    for (var i in this.saveData)
    {
      this.totalFrogsSaved += this.saveData[i].numFrogsSaved;
      this.totalFireflies += this.saveData[i].numFireflies;
    }

    $("#FireflyCounter").text(this.totalFireflies);
    $("#CageCounter").text(this.totalFrogsSaved);
  }
  else
  {
    $("#FireflyCounter").text(this.numFireflies);
    $("#CageCounter").text(this.numFrogsSaved);
  }
}

TomatoJS.Game.prototype.OnPlayerDeath = function()
{
  this.restartTimer = 0;
  this.restarting = true;
}

TomatoJS.Game.prototype.TryLevelWin = function()
{
  // Store data
  if (!this.saveData[this.currentLevel])
    this.saveData[this.currentLevel] = {};
  var levelInfo = this.saveData[this.currentLevel];

  if (!levelInfo.numFrogsSaved || this.numFrogsSaved > levelInfo.numFrogsSaved)
    levelInfo.numFrogsSaved = this.numFrogsSaved;

  if (!levelInfo.numFireflies || this.numFireflies > levelInfo.numFireflies)
    levelInfo.numFireflies = this.numFireflies;

  levelInfo.beaten = true;

  localStorage["save"] = JSON.stringify(this.saveData);

  this.Overworld();
}

TomatoJS.Game.prototype.Restart = function()
{
  if (TomatoJS.Core.GetSystem("Lighting"))
    TomatoJS.Core.GetSystem("Lighting").ambientLevel = 0.5;
  TomatoJS.Core.GetSystem("Graphics").clearColor = [20, 20, 20];
  TomatoJS.Core.DestroyAllGameObjectsNow();

  this.restarting = false;
  this.inOverworld = false;

  // Store data
  if (!this.saveData[this.currentLevel])
    this.saveData[this.currentLevel] = {};
  var levelInfo = this.saveData[this.currentLevel];

  if (!levelInfo.numFrogsSaved)
    levelInfo.numFrogsSaved = 0;

  if (!levelInfo.numFireflies)
    levelInfo.numFireflies = 0;

  // Reload level
  TomatoJS.Core.GetSystem("TileSystem").LoadLevelFromFile(this.currentLevel);

  // Add horizon
  TomatoJS.Core.LoadGameObject("Horizon.json");

  // Reset counters
  this.numFrogsSaved = 0;
  this.numFireflies = 0;

  if (this.overworldUI)
  {
    var that = this;
    setTimeout(function()
    {
      that.overworldUI.Remove();
      that.overworldUI = null;
    }, 3000);
  }

  if (!localStorage["save"])
    this.AddDialog("left", "Welcome to Stealth Frog! Click and hold to jump.", "firefly.png");
}

TomatoJS.Game.prototype.AddDialog = function(side, text, imageURL)
{
  var uiSys = TomatoJS.Core.GetSystem("UISystem");
  this["dialogUI" + side] = uiSys.LoadUIPage("dialog.json");
  var dialog = this["dialogUI" + side];
  uiSys.AddChildToRoot(dialog);

  dialog.html.css(side, "5%");
  dialog.html.css("bottom", "5%");
  dialog.html.find(".UIText").text(text);

  if (imageURL)
    dialog.html.find("img").attr("src", TomatoJS.Core.configData["imagePath"] + imageURL);
}

TomatoJS.Game.prototype.RemoveDialog = function(side)
{
  this["dialogUI" + side].Remove();
  this["dialogUI" + side] = undefined;
}

TomatoJS.Game.prototype.Splash = function()
{
  if (TomatoJS.Core.GetSystem("Lighting"))
    TomatoJS.Core.GetSystem("Lighting").ambientLevel = 1.0;
  TomatoJS.Core.GetSystem("Graphics").clearColor = [250, 250, 250];
  TomatoJS.Core.DestroyAllGameObjectsNow();

  var logo = TomatoJS.Core.LoadGameObject(this.splashes[this.currentSplash]);
  logo.x = TomatoJS.Core.configData["canvasSize"][0] / 2;
  logo.y = TomatoJS.Core.configData["canvasSize"][1] / 2;
  var render = logo.GetComponent("Renderable");

  if (render.animations)
    this.nextScreenTimer = TomatoJS.Core.resourceManager.GetAnimation(render.animations[render.currentAnimation]).duration;
  else
    this.nextScreenTimer = 3;
}

TomatoJS.Game.prototype.Overworld = function()
{
  if (TomatoJS.Core.GetSystem("Lighting"))
    TomatoJS.Core.GetSystem("Lighting").ambientLevel = 0.8;
  TomatoJS.Core.DestroyAllGameObjectsNow();

  TomatoJS.Core.GetSystem("TileSystem").LoadLevelFromFile("overworld.lvl");
  TomatoJS.Core.LoadGameObject("Horizon.json");

  if (this.inMenu)
  {
    TomatoJS.Core.audio.StopSound("Title");
    TomatoJS.Core.audio.PlaySound("Track2", true, 0.2);
    this.mainMenuUI.Remove();
  }
  this.inMenu = false;
  this.inOverworld = true;

  this.overworldUI = TomatoJS.Core.GetSystem("UISystem").LoadUIPage("level-info.uipage");
  TomatoJS.Core.GetSystem("UISystem").AddChildToRoot(this.overworldUI);

  // Add HUD
  if (!this.hudUI)
  {
    var uiSys = TomatoJS.Core.GetSystem("UISystem");
    this.hudUI = uiSys.LoadUIPage("hud.json");
    uiSys.AddChildToRoot(this.hudUI);
  }
}

TomatoJS.Game.prototype.Pause = function()
{
  // Create ui
  var uiSys = TomatoJS.Core.GetSystem("UISystem");
  this.pauseUI = uiSys.LoadUIPage("pause.json");
  uiSys.AddChildToRoot(this.pauseUI);

  this.paused = true;

  var that = this;
  uiSys.AddEventListener("click", "#PauseMenuContinue", function()
  {
    that.paused = false;
    that.pauseUI.Remove();
  });
  uiSys.AddEventListener("click", "#PauseMenuRestart", function()
  {
    that.paused = false;
    that.pauseUI.Remove();
    that.Restart();
  });
  uiSys.AddEventListener("click", "#PauseMenuExit", function()
  {
    that.paused = false;
    that.pauseUI.Remove();
    that.hudUI.Remove();
    TomatoJS.Core.audio.StopSound("Track2");
    that.MainMenu();
  });
}

TomatoJS.Game.prototype.MainMenu = function()
{
  if (TomatoJS.Core.GetSystem("Lighting"))
    TomatoJS.Core.GetSystem("Lighting").ambientLevel = 0.5;
  TomatoJS.Core.DestroyAllGameObjectsNow();

  TomatoJS.Core.GetSystem("Graphics").camera.x = 0;
  TomatoJS.Core.GetSystem("Graphics").camera.y = 0;

  // Play music
  if (!this.inMenu)
    TomatoJS.Core.audio.PlaySound("Title", true);

  this.inMenu = true;

  // Add horizon and main menu level
  TomatoJS.Core.GetSystem("TileSystem").LoadLevelFromFile("main-menu.lvl");
  TomatoJS.Core.LoadGameObject("Horizon.json");

  // Create ui
  var uiSys = TomatoJS.Core.GetSystem("UISystem");
  this.mainMenuUI = uiSys.LoadUIPage("main-screen.json");
  uiSys.AddChildToRoot(this.mainMenuUI);

  // Handle menu clicks
  var that = this;
  uiSys.AddEventListener("click touchstart", "#OptionStart", function()
  {
    delete localStorage["save"];
    that.saveData = {};
    that.Overworld();
  });
  uiSys.AddEventListener("click touchstart", "#OptionContinue", function()
  {
    that.Overworld();
  });
  uiSys.AddEventListener("click touchstart", "#OptionCredits", function()
  {
    that.Credits();
  });
}

TomatoJS.Game.prototype.Credits = function()
{
  // Create ui
  this.mainMenuUI.Remove();
  var uiSys = TomatoJS.Core.GetSystem("UISystem");
  this.creditsUI = uiSys.LoadUIPage("credits.json");
  uiSys.AddChildToRoot(this.creditsUI);

  // Handle click
  var that = this;
  uiSys.AddEventListener("click touchstart", "#Credits", function()
  {
    that.creditsUI.Remove();
    that.MainMenu();
  });
}

} (window.TomatoJS = window.TomatoJS || {}, jQuery));