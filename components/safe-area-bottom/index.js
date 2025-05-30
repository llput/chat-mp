// components/safe-area-bottom/index.js
import { getBottomSafeAreaHeight } from '../../utils/native';

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
  },

  data: {
    safeAreaHeight: 0,
  },

  lifetimes: {
    attached() {
      const app = getApp();
      let safeAreaHeight = app.globalData.bottomSafeAreaHeight || 0;

      // 如果全局数据不可用，尝试直接计算
      if (!safeAreaHeight) {
        safeAreaHeight = getBottomSafeAreaHeight();
      }

      // 最终高度 = 安全区域 + 自定义高度
      const finalHeight = this.properties.useSafeArea
        ? safeAreaHeight + this.properties.customHeight
        : this.properties.customHeight;

      this.setData({
        safeAreaHeight: finalHeight,
      });
    },
  },
});
