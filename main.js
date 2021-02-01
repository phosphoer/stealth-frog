function main()
{
  // Create engine
  var engine = new TomatoJS.Engine();

  // Add systems
  engine.AddSystem("TileSystem");
  engine.AddSystem("Lighting");
  engine.AddSystem("Game");
  engine.AddSystem("Graphics");
  engine.AddSystem("UISystem");

  // Uncomment this to enable debug draw all the time
  // TomatoJS.Core.GetSystem("Graphics").debugDrawEnabled = true;

  // Start game
  engine.Start();
}