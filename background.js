// 监听插件图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 打开新标签页显示 JSON 查看器
  chrome.tabs.create({
    url: chrome.runtime.getURL('viewer/viewer.html')
  });
});
