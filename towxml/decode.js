const config = require('./config');

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    nodes: {
      type: Object,
      value: {},
    },
    // 添加最大宽度配置
    maxTooltipWidth: {
      type: Number,
      value: 400, // rpx 单位
    },
  },

  data: {
    currentTooltipId: '',
    tooltipItems: [], // 用于存储多个标题和链接
    tooltipStyle: '',
    tooltipPosition: 'bottom', // can be 'top', 'bottom', 'left', 'right'
  },

  lifetimes: {
    attached: function () {
      this._setupEvents();

      try {
        // 使用新的 wx.getWindowInfo API 替代废弃的 getSystemInfoSync
        const windowInfo = wx.getWindowInfo();
        this.windowInfo = {
          windowHeight: windowInfo.windowHeight,
          windowWidth: windowInfo.windowWidth,
        };

        // 计算 rpx 到 px 的转换比例
        this.rpxRatio = windowInfo.windowWidth / 750;

        // console.log('窗口信息获取成功:', this.windowInfo);
      } catch (error) {
        // console.error('获取窗口信息失败:', error);
        // 提供默认值以防获取失败
        this.windowInfo = {
          windowHeight: 600,
          windowWidth: 375,
        };
        this.rpxRatio = 0.5; // 默认转换比例
      }
    },

    detached: function () {
      // 组件销毁时的清理工作
    },
  },

  methods: {
    _setupEvents() {
      const _ts = this;
      config.events.forEach(item => {
        _ts['_' + item] = function (...arg) {
          if (global._events && typeof global._events[item] === 'function') {
            global._events[item](...arg);
          }
        };
      });
    },

    // rpx 转换为 px 的辅助函数
    rpxToPx(rpx) {
      return rpx * this.rpxRatio;
    },

    // 修复版的 calculateTooltipPosition 方法
    // calculateTooltipPosition(element, tooltipItems) {
    //   console.log('Calculating position for element:', element);

    //   // 防止undefined元素
    //   if (!element) {
    //     console.warn('Element is undefined, using default position');

    //     const style = `
    //       position: fixed;
    //       top: 88px;
    //       left: 50%;
    //       transform: translateX(-50%);
    //       width: 80vw;
    //       max-width: 80vw;
    //       z-index: 10000;
    //       height: auto !important;
    //     `;
    //     return Promise.resolve({ position: 'bottom', style: style.replace(/\s+/g, ' ').trim() });
    //   }

    //   return new Promise(resolve => {
    //     const query = wx.createSelectorQuery().in(this);
    //     query.select(`#${element}`).boundingClientRect();
    //     query.selectViewport().scrollOffset();

    //     query.exec(res => {
    //       console.log('Query result:', res && res[0] ? 'Element found' : 'Element not found');

    //       if (!res[0] || !res[1]) {
    //         console.warn('Element not found, using default position');
    //         // 如果找不到元素，使用一个默认的固定位置

    //         const style = `
    //           position: fixed;
    //           top: 100px;
    //           left: 50%;
    //           transform: translateX(-50%);
    //           width: 80vw;
    //           max-width: 80vw;
    //           z-index: 10000;
    //           height: auto !important;
    //         `;
    //         resolve({ position: 'bottom', style: style.replace(/\s+/g, ' ').trim() });
    //         return;
    //       }

    //       // 获取元素位置信息
    //       const elementRect = res[0];
    //       // 获取页面滚动信息
    //       const scrollInfo = res[1];

    //       // 获取viewport高度
    //       let viewportHeight;
    //       try {
    //         // 优先使用新的API
    //         if (wx.canIUse('getWindowInfo')) {
    //           viewportHeight = wx.getWindowInfo().windowHeight;
    //         } else {
    //           viewportHeight = this?.windowInfo?.windowHeight || 600;
    //         }
    //       } catch (error) {
    //         console.error('获取窗口高度失败:', error);
    //         viewportHeight = 600; // 默认值
    //       }

    //       // 计算元素底部到viewport底部的距离
    //       const distanceToBottom = viewportHeight - elementRect.bottom;

    //       // 定义安全距离
    //       const SAFE_DISTANCE = 240; // px

    //       // 估算tooltip高度 - 基于tooltipItems长度或使用默认值
    //       let estimatedTooltipHeight = 120; // 默认最小高度
    //       if (Array.isArray(tooltipItems)) {
    //         // 每个item估计高度为40px，加上padding和margins约20px
    //         estimatedTooltipHeight = Math.max(
    //           estimatedTooltipHeight,
    //           tooltipItems.length * 40 + 20,
    //         );
    //       }

    //       console.log('Estimated tooltip height:', estimatedTooltipHeight);

    //       let tooltipPosition, tooltipTop;

    //       // 如果距离底部小于安全距离，将tooltip显示在元素上方
    //       if (distanceToBottom < SAFE_DISTANCE) {
    //         console.log('Too close to bottom, showing tooltip above element');
    //         tooltipPosition = 'top';

    //         // 元素上方的位置，需要减去estimatedTooltipHeight
    //         tooltipTop = elementRect.top - estimatedTooltipHeight;

    //         // 如果tooltip顶部超出了屏幕，仍然显示在下方，但会提供滚动提示
    //         if (tooltipTop < 0) {
    //           console.log(
    //             'Not enough space on top either, showing tooltip below with scroll warning',
    //           );
    //           tooltipPosition = 'bottom';
    //           tooltipTop = elementRect.bottom + 10;
    //         }
    //       } else {
    //         // 正常显示在元素下方
    //         tooltipPosition = 'bottom';
    //         tooltipTop = elementRect.bottom + 10; // 元素底部位置加上10px间距
    //       }

    //       // 确保tooltipTop是有效数值
    //       if (isNaN(tooltipTop) || tooltipTop === undefined) {
    //         console.warn('Invalid tooltipTop value, using default');
    //         tooltipTop = elementRect.bottom + 10;
    //         tooltipPosition = 'bottom';
    //       }

    //       const style = `
    //         position: fixed;
    //         top: ${tooltipTop}px;
    //         left: 50%;
    //         transform: translateX(-50%);
    //         width: 80vw;
    //         max-width: 80vw;
    //         z-index: 10000;
    //         height: auto !important;
    //       `;

    //       resolve({
    //         position: tooltipPosition,
    //         style: style.replace(/\s+/g, ' ').trim(),
    //       });
    //     });
    //   });
    // },

    // 修复版的 calculateTooltipPosition 方法
    calculateTooltipPosition(element, tooltipItems) {
      console.log('Calculating position for element:', element);

      // 定义tooltip与元素之间的固定间距
      const TOOLTIP_GAP = 10; // px

      // 防止undefined元素
      if (!element) {
        console.warn('Element is undefined, using default position');

        const style = `
      position: fixed;
      top: 88px;
      left: 50%;
      transform: translateX(-50%);
      width: 80vw;
      max-width: 80vw;
      z-index: 10000;
      height: auto !important;
    `;
        return Promise.resolve({ position: 'bottom', style: style.replace(/\s+/g, ' ').trim() });
      }

      return new Promise(resolve => {
        const query = wx.createSelectorQuery().in(this);
        query.select(`#${element}`).boundingClientRect();
        query.selectViewport().scrollOffset();

        query.exec(res => {
          console.log('Query result:', res && res[0] ? 'Element found' : 'Element not found');

          if (!res[0] || !res[1]) {
            console.warn('Element not found, using default position');
            // 如果找不到元素，使用一个默认的固定位置

            const style = `
          position: fixed;
          top: 100px;
          left: 50%;
          transform: translateX(-50%);
          width: 80vw;
          max-width: 80vw;
          z-index: 10000;
          height: auto !important;
        `;
            resolve({ position: 'bottom', style: style.replace(/\s+/g, ' ').trim() });
            return;
          }

          // 获取元素位置信息
          const elementRect = res[0];
          // 获取页面滚动信息
          const scrollInfo = res[1];

          // 获取viewport高度
          let viewportHeight;
          try {
            // 优先使用新的API
            if (wx.canIUse('getWindowInfo')) {
              viewportHeight = wx.getWindowInfo().windowHeight;
            } else {
              viewportHeight = this?.windowInfo?.windowHeight || 600;
            }
          } catch (error) {
            console.error('获取窗口高度失败:', error);
            viewportHeight = 600; // 默认值
          }

          // 计算元素底部到viewport底部的距离
          const distanceToBottom = viewportHeight - elementRect.bottom;

          // 定义安全距离
          const SAFE_DISTANCE = 240; // px

          // 估算tooltip高度 - 基于tooltipItems长度或使用默认值
          let estimatedTooltipHeight = 120; // 默认最小高度
          if (Array.isArray(tooltipItems)) {
            // 增加每个项目的高度估算和额外padding
            const itemHeight = 45; // 每项的实际高度
            const extraPadding = 30; // 额外的padding和margin
            estimatedTooltipHeight = Math.max(
              estimatedTooltipHeight,
              tooltipItems.length * itemHeight + extraPadding,
            );
          }

          console.log('更精确估算的tooltip高度:', estimatedTooltipHeight);

          let tooltipPosition, tooltipTop;

          // 如果距离底部小于安全距离，将tooltip显示在元素上方
          if (distanceToBottom < SAFE_DISTANCE) {
            console.log('Too close to bottom, showing tooltip above element');
            tooltipPosition = 'top';

            // 元素上方的位置，需要减去estimatedTooltipHeight和固定间距
            tooltipTop = elementRect.top - estimatedTooltipHeight - TOOLTIP_GAP;

            // 添加调试日志
            console.log('上方显示计算值:', {
              elementTop: elementRect.top,
              estimatedHeight: estimatedTooltipHeight,
              gap: TOOLTIP_GAP,
              resultTop: tooltipTop,
            });

            // 如果tooltip顶部超出了屏幕，仍然显示在下方，但会提供滚动提示
            if (tooltipTop < 0) {
              console.log(
                'Not enough space on top either, showing tooltip below with scroll warning',
              );
              tooltipPosition = 'bottom';
              tooltipTop = elementRect.bottom + TOOLTIP_GAP;
            }
          } else {
            // 正常显示在元素下方
            tooltipPosition = 'bottom';
            tooltipTop = elementRect.bottom + TOOLTIP_GAP; // 使用定义的常量间距
          }

          // 确保tooltipTop是有效数值
          if (isNaN(tooltipTop) || tooltipTop === undefined) {
            console.warn('Invalid tooltipTop value, using default');
            tooltipTop = elementRect.bottom + TOOLTIP_GAP;
            tooltipPosition = 'bottom';
          }

          // 构建工具提示样式
          let style;
          if (tooltipPosition === 'top') {
            // 方案一：使用top属性（已修正计算）
            style = `
          position: fixed;
          top: ${tooltipTop}px;
          left: 50%;
          transform: translateX(-50%);
          width: 80vw;
          max-width: 80vw;
          z-index: 10000;
          height: auto !important;
        `;

            // 方案二（可选）：使用bottom属性相对于视口底部定位
            /*
        const distanceFromBottom = viewportHeight - elementRect.top + TOOLTIP_GAP;
        style = `
          position: fixed;
          bottom: ${distanceFromBottom}px;
          left: 50%;
          transform: translateX(-50%);
          width: 80vw;
          max-width: 80vw;
          z-index: 10000;
          height: auto !important;
        `;
        */
          } else {
            // 底部显示使用原来的样式
            style = `
          position: fixed;
          top: ${tooltipTop}px;
          left: 50%;
          transform: translateX(-50%);
          width: 80vw;
          max-width: 80vw;
          z-index: 10000;
          height: auto !important;
        `;
          }

          resolve({
            position: tooltipPosition,
            style: style.replace(/\s+/g, ' ').trim(),
          });
        });
      });
    },

    handleNavigatorTap(e) {
      const { navId, title, url } = e.currentTarget.dataset;

      // 开关效果：如果已经显示则隐藏
      if (this.data.currentTooltipId === navId) {
        this.hideTooltip();
        return;
      }

      // 解析元数据
      let tooltipItems;
      try {
        tooltipItems = this.parseDataRefs(title);
      } catch (error) {
        console.error('元数据解析错误:', error);
        tooltipItems = [];
      }

      // 确保至少有一个有效项
      if (tooltipItems.length === 0 && url) {
        tooltipItems.push({
          index: '1',
          link: url,
          title: '参考资料',
        });
      }

      // 计算位置并显示
      if (tooltipItems.length > 0) {
        this.calculateTooltipPosition(navId, tooltipItems).then(({ style, position }) => {
          this.setData({
            currentTooltipId: navId,
            tooltipItems: tooltipItems,
            tooltipStyle: style,
            tooltipPosition: position || 'bottom',
          });
        });
      }
    },

    // 输入端 - 解析链接元数据时
    parseDataRefs(inputStr) {
      // 确保输入不为空
      if (!inputStr) return [];

      // 调试日志
      console.log(
        '解析元数据:',
        inputStr.length > 40 ? `${inputStr.substring(0, 40)}...` : inputStr,
      );

      // 尝试URI解码和JSON解析
      try {
        // 先清理输入字符串，移除可能的引号包裹
        let cleanInput = inputStr;
        if (cleanInput.startsWith('"') && cleanInput.endsWith('"')) {
          cleanInput = cleanInput.substring(1, cleanInput.length - 1);
        }

        const decodedStr = decodeURIComponent(cleanInput);

        try {
          const data = JSON.parse(decodedStr);
          console.log('data', data);
          // 验证元数据格式 - 支持缩短的键名
          if (data && (data.refs || data.r) && Array.isArray(data.refs || data.r)) {
            // 使用refs或r字段（取决于格式）
            const refs = data.refs || data.r;

            // 转换为UI需要的格式
            const items = refs
              .filter(
                ref => ref && (ref.id !== undefined || ref.i !== undefined) && (ref.url || ref.u),
              )
              .map(ref => ({
                index: String(ref.id || ref.i),
                link: (ref.url || ref.u || '').replace(/#rd$/, ''), // 再次清理 #rd
                title: ref.title || ref.t || '',
                publishTime: ref.publishTime || ref.p || '',
              }));

            if (items.length > 0) {
              console.log('JSON解析成功，找到', items.length, '个引用项');
              return items;
            }
          }
        } catch (jsonError) {
          console.warn('JSON解析失败:', jsonError.message);
        }
      } catch (uriError) {
        console.warn('URI解码失败:', uriError.message);
      }

      // 回退方案：尝试从URL中提取直接链接
      if (inputStr.includes('http')) {
        const urlMatches = inputStr.match(/https?:\/\/[^\s"')]+/g) || [];
        if (urlMatches.length > 0) {
          // 从所有匹配的URL中找出第一个有效URL
          const validUrl = urlMatches[0].replace(/#rd$/, '');

          return [
            {
              index: '1',
              link: validUrl,
              title: '参考链接',
            },
          ];
        }
      }

      // 如果所有尝试都失败，返回空数组
      return [];
    },

    handleCopy(e) {
      const url = e.currentTarget.dataset.url;
      wx.setClipboardData({
        data: url,
        success: () => {
          wx.showToast({
            title: '复制链接成功',
            icon: 'success',
            duration: 2000,
          });
        },
        fail: () => {
          wx.showToast({
            title: '复制链接失败',
            icon: 'error',
            duration: 2000,
          });
        },
      });
    },

    handleMaskTap() {
      console.log('Mask tapped');
      this.hideTooltip();
    },

    handleMaskTouchMove() {
      console.log('Mask touched and moved');
      this.hideTooltip();
    },

    hideTooltip() {
      this.setData({
        currentTooltipId: '',
        tooltipItems: [],
        tooltipStyle: '',
        tooltipPosition: 'bottom',
      });
    },
  },
});
