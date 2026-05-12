/**
 * 时钟插件
 * 每分钟更新一次时间显示，通过气泡展示在宠物旁边
 */

var timerId = null;

function formatTime() {
  var now = new Date();
  var h = now.getHours();
  var m = now.getMinutes();
  return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
}

module.exports = {
  activate: function (dango) {
    // 首次激活时立即显示时间
    dango.ui.showBubble("现在是 " + formatTime(), 3000);

    // 每 60 秒更新一次
    timerId = setInterval(function () {
      dango.ui.showBubble("现在是 " + formatTime(), 3000);
    }, 60000);

    console.log("时钟插件已激活");
  },

  deactivate: function () {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    console.log("时钟插件已停用");
  },
};
