/**
 * 防抖函数
 * @param {Function} fn 需要防抖的函数
 * @param {number} delay 延迟时间，单位毫秒
 * @return {Function} 防抖处理后的函数
 */
// 在工具文件中
function debounce(fn, delay = 300, debugName = '') {
  let timer = null;
  let lastCallTime = 0;

  function debounced(...args) {
    const now = Date.now();
    console.log(`[Debounce:${debugName}] 函数被调用，距上次调用: ${now - lastCallTime}ms`);
    lastCallTime = now;

    if (timer) {
      console.log(`[Debounce:${debugName}] 清除现有计时器`);
      clearTimeout(timer);
    }

    console.log(`[Debounce:${debugName}] 设置新计时器，延迟: ${delay}ms`);
    timer = setTimeout(() => {
      console.log(`[Debounce:${debugName}] 执行实际函数`);
      fn.apply(this, args);
      timer = null;
    }, delay);
  }

  debounced.cancel = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      console.log(`[Debounce:${debugName}] 计时器被取消`);
    }
  };

  return debounced;
}

function throttleAndDebounce(fn, throttleInterval = 1500, debounceDelay = 1500) {
  let throttleTimer = null;
  let debounceTimer = null;
  let lastExecTime = 0;

  function throttledAndDebounced(...args) {
    const now = Date.now();

    // 清除现有的防抖计时器
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // 设置新的防抖计时器，确保最后一次调用后也会执行
    debounceTimer = setTimeout(() => {
      fn.apply(this, args);
    }, debounceDelay);

    // 节流逻辑：如果距离上次执行超过间隔时间，立即执行
    if (now - lastExecTime >= throttleInterval) {
      if (throttleTimer) {
        clearTimeout(throttleTimer);
        throttleTimer = null;
      }

      lastExecTime = now;
      fn.apply(this, args);
    }
  }

  // Add cancel method
  throttledAndDebounced.cancel = function () {
    if (throttleTimer) {
      clearTimeout(throttleTimer);
      throttleTimer = null;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  return throttledAndDebounced;
}

/**
 * 节流函数
 * @param {Function} fn 需要节流的函数
 * @param {number} interval 间隔时间，单位毫秒
 * @return {Function} 节流处理后的函数
 */
function throttle(fn, interval = 300) {
  let lastTime = 0;

  return function (...args) {
    const now = Date.now();

    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

module.exports = {
  debounce,
  throttle,
  throttleAndDebounce,
};
