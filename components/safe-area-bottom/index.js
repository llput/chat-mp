// components/safe-area-bottom/index.js
import { getBottomSafeAreaHeight, getBottomSafeAreaHeightValue } from '../../utils/native';

Component({
  properties: {
    // 是否使用安全区域
    useSafeArea: {
      type: Boolean,
      value: true,
    },
    // 自定义附加高度
    customHeight: {
      type: Number,
      value: 0,
    },
    // 背景色
    backgroundColor: {
      type: String,
      value: 'transparent',
    },
    // 适配方案：'js' | 'css' | 'auto'
    adaptationMethod: {
      type: String,
      value: 'auto', // auto 会自动选择最佳方案
    },
    // 是否显示调试信息
    showDebugInfo: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    safeAreaHeight: 0,
    actualMethod: 'none', // 实际使用的适配方案
    debugInfo: null,
    hasError: false,
  },

  lifetimes: {
    attached() {
      this.initSafeAreaHeight();
    },
  },

  methods: {
    /**
     * 初始化底部安全区域高度
     */
    initSafeAreaHeight() {
      try {
        const safeAreaInfo = getBottomSafeAreaHeight();
        let finalHeight = 0;
        let actualMethod = 'none';

        // 根据指定的适配方案选择处理方式
        switch (this.properties.adaptationMethod) {
          case 'js':
            // 强制使用 JS 方案
            finalHeight = this.calculateJSHeight(safeAreaInfo);
            actualMethod = 'js';
            break;

          case 'css':
            // 使用 CSS 方案（组件高度为0，通过CSS处理）
            finalHeight = this.properties.customHeight;
            actualMethod = 'css';
            break;

          case 'auto':
          default:
            // 自动选择最佳方案
            if (safeAreaInfo.cssSupported && !this.properties.customHeight) {
              // iOS 设备且无自定义高度时优先使用 CSS 方案
              finalHeight = 0;
              actualMethod = 'css';
            } else {
              // 其他情况使用 JS 方案
              finalHeight = this.calculateJSHeight(safeAreaInfo);
              actualMethod = 'js';
            }
            break;
        }

        this.setData({
          safeAreaHeight: finalHeight,
          actualMethod,
          debugInfo: global.__DEV__ ? safeAreaInfo : null,
          hasError: false,
        });

        // 触发初始化完成事件
        this.triggerEvent('init', {
          height: finalHeight,
          method: actualMethod,
          safeAreaInfo,
        });

        // 开发环境输出日志
        if (global.__DEV__) {
          console.log('[safe-area-bottom] 初始化完成:', {
            finalHeight,
            actualMethod,
            safeAreaInfo,
            properties: this.properties,
          });
        }
      } catch (error) {
        console.error('[safe-area-bottom] 初始化失败:', error);
        this.handleError(error);
      }
    },

    /**
     * 计算 JS 方案的高度
     */
    calculateJSHeight(safeAreaInfo) {
      if (!this.properties.useSafeArea) {
        return this.properties.customHeight;
      }

      const safeAreaHeight = safeAreaInfo.height || 0;
      return safeAreaHeight + this.properties.customHeight;
    },

    /**
     * 处理错误
     */
    handleError(error) {
      this.setData({
        safeAreaHeight: this.properties.customHeight,
        actualMethod: 'fallback',
        hasError: true,
        debugInfo: global.__DEV__ ? { error: error.message } : null,
      });

      this.triggerEvent('error', {
        error: error.message,
        fallbackHeight: this.properties.customHeight,
      });
    },

    /**
     * 获取当前配置信息（供外部调用）
     */
    getSafeAreaInfo() {
      return {
        height: this.data.safeAreaHeight,
        method: this.data.actualMethod,
        hasError: this.data.hasError,
        debugInfo: this.data.debugInfo,
      };
    },

    /**
     * 手动刷新（在屏幕方向改变等情况下调用）
     */
    refresh() {
      this.initSafeAreaHeight();
    },
  },
});
