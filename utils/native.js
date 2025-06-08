/**
 * 导航栏高度计算工具
 * 兼容不同基础库版本和设备
 */

// 缓存计算结果，避免重复计算
let cachedNavHeight = null;
let cachedBottomSafeArea = null;

/**
 * 检查 API 是否可用
 */
function checkApiSupport() {
  return {
    getWindowInfo: wx.canIUse('getWindowInfo'),
    getMenuButtonBoundingClientRect: wx.canIUse('getMenuButtonBoundingClientRect'),
    getSystemInfoSync: typeof wx.getSystemInfoSync === 'function',
  };
}

/**
 * 获取窗口信息（兼容新旧 API）
 */
function getWindowInfoCompat() {
  const apiSupport = checkApiSupport();

  try {
    // 优先使用新 API
    if (apiSupport.getWindowInfo) {
      return wx.getWindowInfo();
    }

    // 兼容旧版本使用 getSystemInfoSync
    if (apiSupport.getSystemInfoSync) {
      console.warn('使用旧版 API wx.getSystemInfoSync，建议升级基础库');
      const systemInfo = wx.getSystemInfoSync();

      // 提取窗口相关信息
      return {
        pixelRatio: systemInfo.pixelRatio,
        screenWidth: systemInfo.screenWidth,
        screenHeight: systemInfo.screenHeight,
        windowWidth: systemInfo.windowWidth,
        windowHeight: systemInfo.windowHeight,
        statusBarHeight: systemInfo.statusBarHeight,
        safeArea: systemInfo.safeArea,
        screenTop: systemInfo.screenTop || 0,
        platform: systemInfo.platform,
      };
    }

    throw new Error('无可用的系统信息获取 API');
  } catch (error) {
    console.error('获取窗口信息失败:', error);

    // 返回默认值
    return {
      pixelRatio: 2,
      screenWidth: 375,
      screenHeight: 667,
      windowWidth: 375,
      windowHeight: 667,
      statusBarHeight: 20,
      safeArea: {
        top: 20,
        left: 0,
        right: 375,
        bottom: 647,
        width: 375,
        height: 627,
      },
      screenTop: 0,
      platform: 'ios',
    };
  }
}

/**
 * 获取胶囊按钮信息（兼容处理）
 */
function getMenuButtonInfoCompat() {
  const apiSupport = checkApiSupport();

  if (!apiSupport.getMenuButtonBoundingClientRect) {
    console.warn('当前基础库版本不支持 getMenuButtonBoundingClientRect');
    // 返回默认胶囊尺寸
    return {
      width: 87,
      height: 32,
      top: 6,
      right: 374,
      bottom: 38,
      left: 287,
    };
  }

  try {
    const menuButton = wx.getMenuButtonBoundingClientRect();

    // 检查返回数据是否有效
    if (!menuButton || menuButton.top === 0 || !menuButton.height) {
      console.warn('getMenuButtonBoundingClientRect 返回无效数据，使用默认值');

      // 根据不同平台返回不同的默认值
      const windowInfo = getWindowInfoCompat();
      const isAndroid = windowInfo.platform === 'android';

      return {
        width: 87,
        height: 32,
        top: isAndroid ? 8 : 6,
        right: windowInfo.screenWidth - 7,
        bottom: isAndroid ? 40 : 38,
        left: windowInfo.screenWidth - 94,
      };
    }

    return menuButton;
  } catch (error) {
    console.error('获取胶囊按钮信息失败:', error);

    // 返回默认值
    const windowInfo = getWindowInfoCompat();
    return {
      width: 87,
      height: 32,
      top: 6,
      right: windowInfo.screenWidth - 7,
      bottom: 38,
      left: windowInfo.screenWidth - 94,
    };
  }
}

/**
 * 获取导航栏相关高度
 * @returns {Object} 导航栏信息
 */
export function getNavHeight() {
  // 如果已有缓存且在合理时间内，直接返回
  if (cachedNavHeight && Date.now() - cachedNavHeight.timestamp < 5000) {
    return cachedNavHeight.data;
  }

  try {
    const windowInfo = getWindowInfoCompat();
    const menuButton = getMenuButtonInfoCompat();

    // 获取状态栏高度，并确保有默认值
    const statusBarHeight =
      windowInfo.statusBarHeight ||
      windowInfo.safeArea?.top ||
      (windowInfo.platform === 'android' ? 24 : 20);

    // 计算导航栏高度
    // 标准公式：(胶囊top - 状态栏高度) * 2 + 胶囊高度
    let navBarHeight;

    if (menuButton && menuButton.top > 0 && menuButton.height > 0) {
      navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height;
    } else {
      // 如果胶囊信息无效，使用平台默认值
      navBarHeight = windowInfo.platform === 'android' ? 48 : 44;
    }

    const result = {
      statusBarHeight,
      navBarHeight,
      totalHeight: statusBarHeight + navBarHeight,
      menuButtonRight: windowInfo.screenWidth - (menuButton?.right || windowInfo.screenWidth - 7),
      menuButtonHeight: menuButton?.height || 32,
      menuButtonWidth: menuButton?.width || 87,
      menuButtonTop: menuButton?.top || statusBarHeight + 6,

      // 额外的调试信息
      platform: windowInfo.platform,
      screenWidth: windowInfo.screenWidth,

      // 标记数据来源
      dataSource: {
        windowInfo: windowInfo.statusBarHeight ? 'getWindowInfo' : 'getSystemInfoSync',
        menuButton: menuButton?.top > 0 ? 'getMenuButtonBoundingClientRect' : 'default',
      },
    };

    // 缓存结果
    cachedNavHeight = {
      data: result,
      timestamp: Date.now(),
    };

    // 输出调试信息（仅在开发环境）
    if (global.__DEV__) {
      console.log('导航栏高度计算结果:', result);
    }

    return result;
  } catch (error) {
    console.error('导航栏计算失败，启用备用方案:', error);

    // 完全兜底的默认值
    const fallbackResult = {
      statusBarHeight: 20,
      navBarHeight: 44,
      totalHeight: 64,
      menuButtonRight: 7,
      menuButtonHeight: 32,
      menuButtonWidth: 87,
      menuButtonTop: 26,
      platform: 'ios',
      screenWidth: 375,
      dataSource: {
        windowInfo: 'fallback',
        menuButton: 'fallback',
      },
    };

    // 缓存兜底结果
    cachedNavHeight = {
      data: fallbackResult,
      timestamp: Date.now(),
    };

    return fallbackResult;
  }
}

/**
 * 判断是否为需要适配底部安全区域的设备
 * @returns {boolean} 是否需要适配
 */
function isBottomSafeAreaDevice() {
  try {
    const windowInfo = getWindowInfoCompat();
    const safeArea = windowInfo.safeArea;

    if (!safeArea) {
      return false;
    }

    // 通过屏幕高度和安全区域底部坐标判断
    return windowInfo.screenHeight !== safeArea.bottom;
  } catch (error) {
    return false;
  }
}

/**
 * 获取设备型号信息（用于底部安全区域判断）
 */
function getDeviceModel() {
  try {
    // 优先使用新 API
    if (wx.canIUse('getDeviceInfo')) {
      return wx.getDeviceInfo();
    }

    // 兜底使用旧 API
    if (typeof wx.getSystemInfoSync === 'function') {
      const systemInfo = wx.getSystemInfoSync();
      return {
        brand: systemInfo.brand,
        model: systemInfo.model,
        platform: systemInfo.platform,
        system: systemInfo.system,
      };
    }

    return null;
  } catch (error) {
    console.error('获取设备信息失败:', error);
    return null;
  }
}

/**
 * 获取底部安全区域高度
 * @returns {Object} 底部安全区域信息
 */
export function getBottomSafeAreaHeight() {
  // 如果已有缓存，直接返回
  if (cachedBottomSafeArea && Date.now() - cachedBottomSafeArea.timestamp < 10000) {
    return cachedBottomSafeArea.data;
  }

  try {
    const windowInfo = getWindowInfoCompat();
    const safeArea = windowInfo.safeArea;
    const deviceInfo = getDeviceModel();

    let bottomSafeAreaHeight = 0;
    let needsAdaptation = false;
    let detectionMethod = 'none';

    // 方法1: 通过安全区域计算（推荐）
    if (safeArea && windowInfo.screenHeight && safeArea.bottom) {
      bottomSafeAreaHeight = windowInfo.screenHeight - safeArea.bottom;
      needsAdaptation = bottomSafeAreaHeight > 0;
      detectionMethod = 'safeArea';
    }

    // 方法2: 设备型号判断（兜底）
    if (!needsAdaptation && deviceInfo) {
      const model = deviceInfo.model || '';
      const isIPhoneX = /iPhone\s*X|iPhone\s*1[1-9]|iPhone\s*SE\s*\(3rd|iPhone\s*1[2-5]/i.test(
        model,
      );

      if (isIPhoneX && deviceInfo.platform === 'ios') {
        // iPhone X 系列设备的标准底部安全区域高度
        bottomSafeAreaHeight = 34;
        needsAdaptation = true;
        detectionMethod = 'deviceModel';
      }
    }

    // 验证结果合理性
    if (bottomSafeAreaHeight < 0 || bottomSafeAreaHeight > 60) {
      console.warn(`底部安全区域高度异常: ${bottomSafeAreaHeight}px，重置为0`);
      bottomSafeAreaHeight = 0;
      needsAdaptation = false;
      detectionMethod = 'fallback';
    }

    const result = {
      height: bottomSafeAreaHeight,
      needsAdaptation,
      detectionMethod,
      deviceInfo: deviceInfo
        ? {
            model: deviceInfo.model,
            platform: deviceInfo.platform,
            brand: deviceInfo.brand,
          }
        : null,
      safeAreaSupported: !!safeArea,

      // CSS 方案支持检测
      cssSupported: windowInfo.platform === 'ios', // iOS 设备通常支持 CSS 方案
    };

    // 缓存结果
    cachedBottomSafeArea = {
      data: result,
      timestamp: Date.now(),
    };

    // 开发环境输出调试信息
    if (global.__DEV__) {
      console.log('底部安全区域检测结果:', result);
    }

    return result;
  } catch (error) {
    console.error('底部安全区域计算失败:', error);

    // 完全兜底
    const fallbackResult = {
      height: 0,
      needsAdaptation: false,
      detectionMethod: 'error',
      deviceInfo: null,
      safeAreaSupported: false,
      cssSupported: false,
      error: error.message,
    };

    cachedBottomSafeArea = {
      data: fallbackResult,
      timestamp: Date.now(),
    };

    return fallbackResult;
  }
}

/**
 * 简化版本：仅返回高度数值（向后兼容）
 * @returns {number} 底部安全区域高度
 */
export function getBottomSafeAreaHeightValue() {
  const result = getBottomSafeAreaHeight();
  return typeof result === 'object' ? result.height : result;
}

/**
 * 清除缓存（在屏幕方向改变等情况下调用）
 */
export function clearNavCache() {
  cachedNavHeight = null;
  cachedBottomSafeArea = null;
}

/**
 * 监听屏幕方向变化，清除缓存
 */
if (wx.onWindowResize && wx.canIUse('onWindowResize')) {
  wx.onWindowResize(() => {
    console.log('屏幕尺寸变化，清除导航栏高度缓存');
    clearNavCache();
  });
}
