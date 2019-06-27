// Trigger を登録
function registerTrigger(key, functionName) {
  var dt = new Date();
	// 1 分後に Trigger セット
  dt.setMinutes(dt.getMinutes() + 1);
  var triggerId = ScriptApp.newTrigger(functionName)
                           .timeBased()
                           .at(dt)
                           .create()
                           .getUniqueId();
	PropertiesService.getScriptProperties().setProperty(key, triggerId);
}

// Trigger の削除
function deleteTrigger(key) {
  var triggerId = PropertiesService.getScriptProperties().getProperty(key);
  
  if (!triggerId) return;
  
  ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getUniqueId() == triggerId;
  }).forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  PropertiesService.getScriptProperties().deleteProperty(key);
}
