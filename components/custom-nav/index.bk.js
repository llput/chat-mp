import { getNavHeight, getStatusBarHeight, getNavContentHeight } from '../../utils/native';

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
  },

  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
  },

  data: {
    statusBarHeight: 0,
    navContentHeight: 0, // 导航内容区高度
    height: 0, // 总高度 = 状态栏 + 导航内容区
    isDropdownOpen: false,
    menuButtonWidth: 87, // 默认胶囊按钮宽度
    menuButtonHeight: 32, // 默认胶囊按钮高度
  },

  lifetimes: {
    attached() {
      const { statusBarHeight, navBarHeight, totalHeight, menuButtonRight, menuButtonHeight } =
        getNavHeight();

      this.setData({
        statusBarHeight,
        navBarHeight,
        totalHeight,
        // 胶囊相关间距
        menuRight: menuButtonRight,
        menuHeight: menuButtonHeight,
      });

      // 兼容性布局参数传递
      this.triggerEvent('layout', {
        statusBarHeight,
        navBarHeight,
        totalHeight,
      });
    },
  },

  methods: {
    // 修改返回按钮处理方法
    // handleBack() {
    //   if (this.properties.pageType === 'recents') {
    //     // 如果是在 recents 页面，返回到首页
    //     wx.switchTab({
    //       url: '/pages/index/index',
    //     });
    //   } else {
    //     // 触发返回事件，让父组件处理返回逻辑
    //     this.triggerEvent('back');
    //   }
    // },

    toggleDropdown() {
      this.setData({
        isDropdownOpen: !this.data.isDropdownOpen,
      });
    },

    // 新增：隐藏下拉菜单方法
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
        // 触发返回事件，让父组件处理返回逻辑
        this.triggerEvent('left-icon-tap');
      }
    },

    onRightIconTap() {
      this.triggerEvent('right-icon-tap');
    },

    onTitleTap() {
      this.triggerEvent('title-tap');
    },

    // 在页面点击时关闭下拉菜单
    onPageClick() {
      if (this.data.isDropdownOpen) {
        this.setData({
          isDropdownOpen: false,
        });
      }
    },

    handleAvatarError() {
      // 处理头像加载失败的情况
      this.setData({
        avatarUrl: '/assets/images/default-avatar.png',
      });
    },
  },
});
