// app.js
import AuthManager from './utils/auth-manager';
import { showWeakNetworkTip } from './utils/network-debug-utils';
import { promisifyAll } from 'miniprogram-api-promise';
import { getBottomSafeAreaHeight } from './utils/native';
import reportEvent from './utils/report-event';
import { EVENT_TYPES } from './utils/config';
const wxp = {};

// 将微信小程序的 API Promise 化
promisifyAll(wx, wxp);
wx.pro = wxp;

App({
  globalData: {
    bottomSafeAreaHeight: 0,
    safeAreaBottom: 0,
  },

  // 引入`towxml3.0`解析方法
  towxml: require('/towxml/index'),

  // eslint-disable-next-line object-shorthand
  convertMarkdown: function (md) {
    if (!md) return '';
    try {
      if (!this.towxml) {
        console.error('Towxml 未初始化');
        return md;
      }

      return this.towxml(md, 'markdown', {
        theme: 'light', // 或 'dark'
        events: {
          tap: e => {
            // 处理链接点击等事件
            console.log('--tap', e);
            console.log('e', e.currentTarget?.dataset?.data?.type);
            console.log('e', e.currentTarget?.dataset?.data?.children[0]?.text);
          },
        },
      });
    } catch (error) {
      console.error('Markdown转换出错:', error);
      return md; // 出错时返回原始内容
    }
  },
});
