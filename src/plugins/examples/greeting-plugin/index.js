/**
 * 打招呼插件
 * 宠物每隔 30~90 秒随机说一句话
 */

var timerId = null;

var greetings = [
  "你好呀~",
  "今天过得怎么样？",
  "记得喝水哦！",
  "休息一下吧~",
  "加油！",
  "摸摸头~",
  "嘿嘿~",
  "想吃团子了...",
  "天气真好！",
  "要开心哦！",
  "喵~",
  "困了... zzZ",
  "一起来玩吧！",
];

function randomGreeting() {
  var index = Math.floor(Math.random() * greetings.length);
  return greetings[index];
}

function scheduleNext(dango) {
  // 随机 30~90 秒
  var delay = 30000 + Math.floor(Math.random() * 60000);
  timerId = setTimeout(function () {
    dango.pet.say(randomGreeting(), 3000);
    scheduleNext(dango); // 递归调度下一次
  }, delay);
}

module.exports = {
  activate: function (dango) {
    // 首次激活时打个招呼
    dango.pet.say("打招呼插件启动啦！", 2000);
    scheduleNext(dango);
    console.log("打招呼插件已激活");
  },

  deactivate: function () {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    console.log("打招呼插件已停用");
  },
};
