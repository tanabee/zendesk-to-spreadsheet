var KEY = 'TRIGGER';

// Trigger を登録
function registerTrigger(functionName) {
  var dt = new Date();
	// 1 分後に Trigger セット
  dt.setMinutes(dt.getMinutes() + 1);
  var triggerId = ScriptApp.newTrigger(functionName)
                           .timeBased()
                           .at(dt)
                           .create()
                           .getUniqueId();
	PropertiesService.getScriptProperties().setProperty(KEY, triggerId);
}

// Trigger の削除
function deleteTrigger() {
  var triggerId = PropertiesService.getScriptProperties().getProperty(KEY);
  
  if (!triggerId) return;
  
  ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getUniqueId() == triggerId;
  }).forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  PropertiesService.getScriptProperties().deleteProperty(KEY);
}
