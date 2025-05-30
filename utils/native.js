export function getNavHeight() {
  try {
    const windowInfo = wx.getWindowInfo();
    const menuButton = wx.getMenuButtonBoundingClientRect();

    // 安全获取状态栏高度
    const statusBarHeight = windowInfo.statusBarHeight || windowInfo.safeArea?.top || 20;

    // 动态计算导航栏高度
    const navBarHeight = menuButton
      ? (menuButton.top - statusBarHeight) * 2 + menuButton.height
      : windowInfo.platform === 'android'
      ? 48
      : 44;

    return {
      statusBarHeight,
      navBarHeight,
      totalHeight: statusBarHeight + navBarHeight,
      menuButtonRight: windowInfo.screenWidth - menuButton.right,
      menuButtonHeight: menuButton.height,
    };
  } catch (e) {
    console.error('导航栏计算失败，启用备用方案:', e);
    return {
      statusBarHeight: 20,
      navBarHeight: 44,
      totalHeight: 64,
      menuButtonRight: 7,
      menuButtonHeight: 32,
    };
  }
}

// 获取底部安全区域高度
export function getBottomSafeAreaHeight() {
  try {
    const windowInfo = wx.getWindowInfo();
    const safeArea = windowInfo.safeArea;

    if (!safeArea) {
      return 0;
    }

    // 计算底部安全区域高度
    const bottomSafeArea = windowInfo.screenHeight - safeArea.bottom;
    return bottomSafeArea;
  } catch (e) {
    console.error('底部安全区域计算失败:', e);
    // 默认返回一个安全值
    return 20;
  }
}
