(function (TomatoJS, $, undefined)
{

TomatoJS.DialogTrigger = function()
{
  this.dialogText = "";
  this.dialogImage = "core/tomato1.png";
  this.dialogSide = "left";
  this.dialogVisible = false;
}

TomatoJS.DialogTrigger.prototype.Initialize = function()
{
}

TomatoJS.DialogTrigger.prototype.Uninitialize = function()
{
}

TomatoJS.DialogTrigger.prototype.OnCollide = function(obj)
{
  if (obj.GetComponent("PlayerController") && !this.dialogVisible)
  {
    this.dialogVisible = true;
    TomatoJS.Core.GetSystem("Game").AddDialog(this.dialogSide, this.dialogText, this.dialogImage);
  }
}

} (window.TomatoJS = window.TomatoJS || {}, jQuery));