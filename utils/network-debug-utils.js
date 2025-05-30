// network-debug-utils.js
/**
 * 网络请求调试工具，用于监控弱网状态和提供详细的网络请求诊断信息
 */

// 全局弱网状态
let isWeakNetwork = false;

// 初始化网络监听
export function initNetworkMonitor() {
  // 监听常规网络状态变化
  wx.onNetworkStatusChange(function (res) {
    console.log('网络状态变化', res);

    if (!res.isConnected) {
      wx.showToast({
        title: '网络已断开',
        icon: 'none',
        duration: 2000,
      });
    }
  });

  // 监听弱网状态变化 (基础库 2.19.0+)
  if (wx.onNetworkWeakChange) {
    wx.onNetworkWeakChange(function (res) {
      console.log('弱网状态变化', res);
      isWeakNetwork = res.weakNet;

      if (res.weakNet) {
        showWeakNetworkTip();
      }
    });
  } else {
    console.warn('当前基础库版本过低，无法使用弱网检测功能');
  }
}

// 显示弱网提示
export function showWeakNetworkTip() {
  wx.showModal({
    title: '网络状况不佳',
    content: '当前网络信号较弱，可能影响正常使用。建议切换到更好的网络环境。',
    showCancel: false,
    confirmText: '我知道了',
  });
}

// 格式化打印 profile 信息
export function formatProfileInfo(profile) {
  if (!profile) return 'Profile信息不可用';

  // 计算关键时间段
  const dns = profile.domainLookUpEnd - profile.domainLookUpStart;
  const tcp = profile.connectEnd - profile.connectStart;
  const ssl = profile.SSLconnectionEnd - profile.SSLconnectionStart;
  const request = profile.requestEnd - profile.requestStart;
  const response = profile.responseEnd - profile.responseStart;
  const total = profile.responseEnd - profile.fetchStart;

  return `
-------- 网络请求性能分析 --------
总耗时: ${total}ms
DNS解析: ${dns}ms
TCP连接: ${tcp}ms
SSL握手: ${ssl}ms
请求发送: ${request}ms
响应接收: ${response}ms
RTT: ${profile.rtt}ms
网络类型: ${profile.estimate_nettype}
下行速度: ${profile.throughputKbps}kbps
目标IP: ${profile.peerIP}:${profile.port}
协议: ${profile.protocol}
复用连接: ${profile.socketReused ? '是' : '否'}
发送字节: ${profile.sendBytesCount}
接收字节: ${profile.receivedBytedCount}
--------------------------------
`;
}

// 检查是否超时或慢请求
export function checkSlowRequest(profile) {
  if (!profile) return false;

  // 定义一些阈值
  const DNS_THRESHOLD = 1000; // DNS解析超过1秒
  const TCP_THRESHOLD = 2000; // TCP连接超过2秒
  const SSL_THRESHOLD = 1500; // SSL握手超过1.5秒
  const RTT_THRESHOLD = 400; // RTT超过400ms (官方弱网判断标准之一)

  const dns = profile.domainLookUpEnd - profile.domainLookUpStart;
  const tcp = profile.connectEnd - profile.connectStart;
  const ssl = profile.SSLconnectionEnd - profile.SSLconnectionStart;

  const issues = [];

  if (dns > DNS_THRESHOLD) {
    issues.push(`DNS解析缓慢(${dns}ms)`);
  }

  if (tcp > TCP_THRESHOLD) {
    issues.push(`TCP连接缓慢(${tcp}ms)`);
  }

  if (ssl > SSL_THRESHOLD && profile.SSLconnectionStart > 0) {
    issues.push(`SSL握手缓慢(${ssl}ms)`);
  }

  if (profile.rtt > RTT_THRESHOLD) {
    issues.push(`RTT过高(${profile.rtt}ms)`);
  }

  return issues.length > 0 ? issues : false;
}

// 获取当前弱网状态
export function isWeakNetworkState() {
  return isWeakNetwork;
}
