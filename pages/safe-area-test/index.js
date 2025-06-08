// pages/safe-area-test/index.js
import { getBottomSafeAreaHeight, getNavHeight } from '../../utils/native';

Page({
  data: {
    safeAreaInfo: {},
    testMethods: [
      { id: 'auto', name: '自动选择', desc: '根据设备自动选择最佳方案' },
      { id: 'js', name: 'JS 方案', desc: '通过 JavaScript 动态计算高度' },
      { id: 'css', name: 'CSS 方案', desc: '使用 CSS env() 函数（推荐）' },
    ],
    currentMethod: 'auto',
    showDebug: true,
    testResults: {},
    totalHeight: 0,
  },

  onLoad() {
    this.setData({
      totalHeight: getNavHeight().totalHeight,
    });

    this.initTest();
  },

  /**
   * 初始化测试
   */
  initTest() {
    try {
      const safeAreaInfo = getBottomSafeAreaHeight();

      this.setData({
        safeAreaInfo,
      });

      // 测试所有方案
      this.testAllMethods();
    } catch (error) {
      console.error('初始化测试失败:', error);
      wx.showToast({
        title: '测试初始化失败',
        icon: 'none',
      });
    }
  },

  /**
   * 测试所有适配方案
   */
  testAllMethods() {
    const testResults = {};

    this.data.testMethods.forEach(method => {
      try {
        testResults[method.id] = {
          status: 'success',
          description: method.desc,
          supported: this.checkMethodSupport(method.id),
          recommendation: this.getMethodRecommendation(method.id),
        };
      } catch (error) {
        testResults[method.id] = {
          status: 'error',
          description: method.desc,
          error: error.message,
          supported: false,
          recommendation: '不推荐',
        };
      }
    });

    this.setData({ testResults });
  },

  /**
   * 检查方案支持情况
   */
  checkMethodSupport(methodId) {
    const { safeAreaInfo } = this.data;

    switch (methodId) {
      case 'js':
        return safeAreaInfo.safeAreaSupported || safeAreaInfo.detectionMethod === 'deviceModel';
      case 'css':
        return safeAreaInfo.cssSupported;
      case 'auto':
        return true; // 自动方案总是可用
      default:
        return false;
    }
  },

  /**
   * 获取方案推荐度
   */
  getMethodRecommendation(methodId) {
    const { safeAreaInfo } = this.data;

    if (!safeAreaInfo.needsAdaptation) {
      return '无需适配';
    }

    switch (methodId) {
      case 'css':
        return safeAreaInfo.cssSupported ? '强烈推荐' : '不支持';
      case 'js':
        return safeAreaInfo.safeAreaSupported ? '推荐' : '备用方案';
      case 'auto':
        return '推荐';
      default:
        return '未知';
    }
  },

  /**
   * 切换测试方案
   */
  switchMethod(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      currentMethod: method,
    });
  },

  /**
   * 切换调试信息显示
   */
  toggleDebug() {
    this.setData({
      showDebug: !this.data.showDebug,
    });
  },

  /**
   * 安全区域组件初始化事件
   */
  onSafeAreaInit(e) {
    console.log('安全区域组件初始化:', e.detail);
  },

  /**
   * 安全区域组件错误事件
   */
  onSafeAreaError(e) {
    console.error('安全区域组件错误:', e.detail);
    wx.showToast({
      title: '安全区域适配异常',
      icon: 'none',
    });
  },

  /**
   * 刷新测试
   */
  refreshTest() {
    this.initTest();
    wx.showToast({
      title: '测试已刷新',
      icon: 'success',
    });
  },

  /**
   * 复制测试结果
   */
  copyResults() {
    const results = {
      safeAreaInfo: this.data.safeAreaInfo,
      testResults: this.data.testResults,
      timestamp: new Date().toLocaleString(),
    };

    wx.setClipboardData({
      data: JSON.stringify(results, null, 2),
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success',
        });
      },
    });
  },

  /**
   * 返回
   */
  goBack() {
    wx.navigateBack();
  },
});
