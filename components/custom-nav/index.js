import { getNavHeight } from '../../utils/native';

/**
 * 判断是否为开发环境
 */
function isDevEnv() {
  return global.__DEV__;
}

Component({
  properties: {
    title: {
      type: String,
      value: 'Lily金融助手',
    },
    pageType: {
      type: String,
      value: 'index', // 'index' 或 'recents'
    },
    showDropdown: {
      type: Boolean,
      value: false,
    },
    showBack: {
      type: Boolean,
      value: false,
    },
    // 新增：是否显示调试信息
    showDebugInfo: {
      type: Boolean,
      value: false,
    },
    backgroundColor: {
      type: String,
      value: '#faf9f5',
    },
  },

  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
  },

  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    totalHeight: 0,
    isDropdownOpen: false,
    menuButtonWidth: 87,
    menuButtonHeight: 32,
    menuRight: 7,

    // 新增：错误状态和调试信息
    hasError: false,
    debugInfo: null,
  },

  lifetimes: {
    attached() {
      this.initNavHeight();
    },

    // 组件显示时重新检查（处理某些边缘情况）
    ready() {
      // 延迟一点重新检查，确保页面完全加载
      setTimeout(() => {
        this.recheckNavHeight();
      }, 100);
    },
  },

  methods: {
    /**
     * 初始化导航栏高度
     */
    initNavHeight() {
      try {
        const navInfo = getNavHeight();

        this.setData({
          statusBarHeight: navInfo.statusBarHeight,
          navBarHeight: navInfo.navBarHeight,
          totalHeight: navInfo.totalHeight,
          menuRight: navInfo.menuButtonRight,
          menuHeight: navInfo.menuButtonHeight,
          menuButtonWidth: navInfo.menuButtonWidth,
          hasError: false,
          debugInfo: isDevEnv() ? navInfo : null, // 开发环境保存调试信息
        });

        // 触发布局事件，传递完整的导航栏信息
        this.triggerEvent('layout', {
          statusBarHeight: navInfo.statusBarHeight,
          navBarHeight: navInfo.navBarHeight,
          totalHeight: navInfo.totalHeight,
          platform: navInfo.platform,
          dataSource: navInfo.dataSource,
        });

        // 开发环境输出日志
        if (isDevEnv()) {
          console.log('[custom-nav] 导航栏初始化完成:', navInfo);
        }
      } catch (error) {
        console.error('[custom-nav] 导航栏初始化失败:', error);
        this.handleNavHeightError(error);
      }
    },

    /**
     * 重新检查导航栏高度（处理异步加载情况）
     */
    recheckNavHeight() {
      try {
        const navInfo = getNavHeight();

        // 检查是否与当前数据有较大差异
        const currentTotal = this.data.totalHeight;
        const newTotal = navInfo.totalHeight;

        if (Math.abs(currentTotal - newTotal) > 5) {
          console.log('[custom-nav] 检测到导航栏高度变化，更新数据');
          this.setData({
            statusBarHeight: navInfo.statusBarHeight,
            navBarHeight: navInfo.navBarHeight,
            totalHeight: navInfo.totalHeight,
            menuRight: navInfo.menuButtonRight,
            menuHeight: navInfo.menuButtonHeight,
            hasError: false,
          });

          // 重新触发布局事件
          this.triggerEvent('layout', {
            statusBarHeight: navInfo.statusBarHeight,
            navBarHeight: navInfo.navBarHeight,
            totalHeight: navInfo.totalHeight,
            platform: navInfo.platform,
            dataSource: navInfo.dataSource,
          });
        }
      } catch (error) {
        console.error('[custom-nav] 重新检查导航栏高度失败:', error);
      }
    },

    /**
     * 处理导航栏高度获取错误
     */
    handleNavHeightError(error) {
      // 设置错误状态和默认值
      this.setData({
        statusBarHeight: 20,
        navBarHeight: 44,
        totalHeight: 64,
        menuRight: 7,
        menuHeight: 32,
        hasError: true,
      });

      // 触发错误事件
      this.triggerEvent('error', {
        type: 'nav_height_error',
        error: error.message || '导航栏高度计算失败',
        fallbackUsed: true,
      });

      // 在开发环境显示错误提示
      if (isDevEnv()) {
        wx.showToast({
          title: '导航栏高度计算异常',
          icon: 'none',
          duration: 2000,
        });
      }
    },

    toggleDropdown() {
      this.setData({
        isDropdownOpen: !this.data.isDropdownOpen,
      });
    },

    hideDropdown() {
      this.setData({
        isDropdownOpen: false,
      });
    },

    navigateToHistory(e) {
      this.hideDropdown();
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      });
    },

    onLeftIconTap() {
      if (this.properties.pageType === 'recents') {
        wx.switchTab({
          url: '/pages/index/index',
        });
      } else {
        this.triggerEvent('left-icon-tap');
      }
    },

    onRightIconTap() {
      this.triggerEvent('right-icon-tap');
    },

    onTitleTap() {
      this.triggerEvent('title-tap');
    },

    onPageClick() {
      if (this.data.isDropdownOpen) {
        this.setData({
          isDropdownOpen: false,
        });
      }
    },

    handleAvatarError() {
      this.setData({
        avatarUrl: '/assets/images/default-avatar.png',
      });
    },

    /**
     * 获取当前导航栏信息（供外部调用）
     */
    getNavInfo() {
      return {
        statusBarHeight: this.data.statusBarHeight,
        navBarHeight: this.data.navBarHeight,
        totalHeight: this.data.totalHeight,
        hasError: this.data.hasError,
        debugInfo: this.data.debugInfo,
      };
    },

    /**
     * 切换调试信息显示
     */
    toggleDebugInfo() {
      this.triggerEvent('debug-toggle');
    },

    /**
     * 手动刷新导航栏高度（供外部调用）
     */
    refreshNavHeight() {
      this.initNavHeight();
    },
  },
});
