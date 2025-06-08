import { getNavHeight } from '../../utils/native';

// eslint-disable-next-line no-undef
const app = getApp();

// eslint-disable-next-line no-undef
Page({
  data: {
    totalHeight: 0,
  },

  onLoad() {
    console.log('onLoad');
    this.setData({
      totalHeight: getNavHeight().totalHeight,
    });
  },

  goSafeAreaTest() {
    wx.navigateTo({
      url: '/pages/safe-area-test/index',
    });
  },
});
