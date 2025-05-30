/**
 * 事件上报工具
 * 封装 wx.reportEvent，增加开发环境下的日志输出
 * 同时将相同数据通过app.log上报
 */

import config from './config';

/**
 * 封装的事件上报函数
 * 在开发和测试环境下会打印日志，所有环境下都会执行原始的上报功能
 * 同时，会通过app.log上报相同的数据
 *
 * @param {string} eventName - 事件名称，通常来自 EVENT_TYPES 或 STREAM_EVENT_TYPES
 * @param {object} data - 上报数据内容
 * @param {boolean} [forceLog=false] - 是否强制打印日志（即使在生产环境）
 * @returns {boolean} - 上报是否成功
 */
const reportEvent = (eventName, data = {}, forceLog = false) => {
  return;
  // try {
  //   // 添加环境信息到数据中
  //   const enrichedData = {
  //     ...data,
  //     env: config.ENV_TYPE,
  //     timestamp: data.timestamp || new Date().getTime(),
  //   };

  //   // 在开发环境、测试环境或强制日志模式下打印日志
  //   if (config.isDevelopment() || config.isTesting() || forceLog) {
  //     const envLabel = config.ENV_TYPE.toUpperCase();
  //     const envColor = config.isProduction()
  //       ? '#f44336' // 生产环境红色
  //       : config.isTesting()
  //         ? '#ff9800' // 测试环境橙色
  //         : '#4caf50'; // 开发环境绿色

  //     console.log(
  //       `%c[${envLabel}]%c 事件上报: %c${eventName}`,
  //       `color: ${envColor}; font-weight: bold`,
  //       `color: ${envColor}; font-weight: normal`,
  //       'color: #2196f3; font-weight: bold',
  //       enrichedData,
  //     );
  //   }

  //   // 获取应用实例，用于通过app.log上报
  //   const app = getApp();

  //   // 所有环境都执行原始上报
  //   wx.reportEvent(eventName, enrichedData);

  //   // 同时通过app.log上报相同的数据
  //   if (app) {
  //     // 确保数据结构清晰，添加事件名称到数据中
  //     const logData = {
  //       ...enrichedData,
  //       event_name: eventName,
  //     };

  //     // 通过app.log上报
  //     app.log(`事件上报: ${eventName}`, logData);
  //   }

  //   return true;
  // } catch (error) {
  //   // 上报过程中如果发生错误，记录到控制台
  //   console.error('事件上报失败:', eventName, error);

  //   // 在开发环境下提供更详细的错误信息
  //   if (config.isDevelopment() || config.isTesting()) {
  //     console.error('上报数据:', data);
  //     console.error('错误详情:', error.message);

  //     // 获取应用实例，用于日志上报（如果可用）
  //     const app = getApp();
  //     if (app?.globalData?.logManager) {
  //       app.error('事件上报错误', {
  //         event: eventName,
  //         error: error.message,
  //         data: JSON.stringify(data).substring(0, 100), // 限制长度
  //       });
  //     }
  //   }

  //   return false;
  // }
};

/**
 * 批量上报多个事件
 *
 * @param {Array<{name: string, data: object}>} events - 事件数组
 * @param {boolean} [forceLog=false] - 是否强制打印日志
 * @returns {Array<boolean>} - 每个事件的上报结果
 */
const reportEvents = (events = [], forceLog = false) => {
  return events.map(event => reportEvent(event.name, event.data, forceLog));
};

/**
 * 仅在开发环境打印事件日志，不进行实际上报
 * 用于调试和测试
 *
 * @param {string} eventName - 事件名称
 * @param {object} data - 事件数据
 */
const logEventOnly = (eventName, data = {}) => {
  if (config.isDevelopment() || config.isTesting()) {
    console.log(
      `%c[DEBUG LOG ONLY] 事件: %c${eventName}`,
      'color: #9c27b0; font-weight: bold',
      'color: #2196f3; font-weight: bold',
      data,
    );
  }
};

export default reportEvent;
export { reportEvent, reportEvents, logEventOnly };
