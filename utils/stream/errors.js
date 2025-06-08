// 错误码与错误处理工具

/**
 * HTTP状态码映射
 * 将常见HTTP错误码映射为更友好的错误信息
 */
export const ERROR_CODES = {
  // 客户端错误 (4xx)
  400: { code: 'BAD_REQUEST', message: '请求参数错误' },
  401: { code: 'UNAUTHORIZED', message: '未授权访问' },
  403: { code: 'FORBIDDEN', message: '禁止访问' },
  404: { code: 'NOT_FOUND', message: '请求的资源不存在' },
  408: { code: 'REQUEST_TIMEOUT', message: '请求超时' },
  413: { code: 'CONTENT_TOO_LARGE', message: '请求内容过大' },
  429: { code: 'TOO_MANY_REQUESTS', message: '请求频率超限，请稍后再试' },

  // 服务器错误 (5xx)
  500: { code: 'SERVER_ERROR', message: '服务器内部错误' },
  502: { code: 'BAD_GATEWAY', message: '网关错误' },
  503: { code: 'SERVICE_UNAVAILABLE', message: '服务暂时不可用' },
  504: { code: 'GATEWAY_TIMEOUT', message: '网关超时' },
};

// 自定义错误类型
export const CUSTOM_ERRORS = {
  NETWORK_ERROR: { code: 'NETWORK_ERROR', message: '网络连接错误' },
  TIMEOUT_ERROR: { code: 'TIMEOUT_ERROR', message: '请求超时' },
  ABORT_ERROR: { code: 'ABORT_ERROR', message: '请求已取消' },
  PARSE_ERROR: { code: 'PARSE_ERROR', message: '响应解析错误' },
  UNKNOWN_ERROR: { code: 'UNKNOWN_ERROR', message: '未知错误' },
  BUSINESS_ERROR: { code: 'BUSINESS_ERROR', message: '业务处理失败' },
};

/**
 * 创建标准错误对象
 * @param {number|string} status - HTTP状态码或错误类型
 * @param {Error|null} originalError - 原始错误对象
 * @param {Object} details - 附加错误详情
 * @returns {Object} - 标准化的错误对象
 */
export function createErrorObject(status, originalError = null, details = {}) {
  // 处理HTTP状态码
  if (typeof status === 'number') {
    const errorInfo = ERROR_CODES[status] || {
      code: 'HTTP_ERROR',
      message: `HTTP错误: ${status}`,
    };

    return {
      status,
      code: errorInfo.code,
      message: errorInfo.message,
      details: {
        ...details,
        originalError: originalError?.message || originalError,
      },
    };
  }

  // 处理自定义错误类型
  if (typeof status === 'string') {
    const errorInfo = CUSTOM_ERRORS[status] || CUSTOM_ERRORS.UNKNOWN_ERROR;

    return {
      status: null,
      code: errorInfo.code,
      message: errorInfo.message,
      details: {
        ...details,
        originalError: originalError?.message || originalError,
      },
    };
  }

  // 默认未知错误
  return {
    status: null,
    code: CUSTOM_ERRORS.UNKNOWN_ERROR.code,
    message: CUSTOM_ERRORS.UNKNOWN_ERROR.message,
    details: {
      ...details,
      originalError: originalError?.message || originalError,
    },
  };
}

/**
 * 创建业务错误对象
 * @param {Object} response - API响应对象
 * @returns {Object} - 标准化的业务错误对象
 */
export function createBusinessErrorObject(response) {
  return {
    status: 200,
    code: CUSTOM_ERRORS.BUSINESS_ERROR.code,
    message: response.msg || CUSTOM_ERRORS.BUSINESS_ERROR.message,
    details: {
      // 直接使用原始响应中的所有字段
      ...response,
      // 确保businessCode字段存在
      businessCode: response.code,
    },
  };
}

/**
 * 判断响应是否包含业务错误
 * @param {Object} response - API响应对象
 * @returns {boolean} - 是否为业务错误
 */
export function isBusinessError(response) {
  if (!response) return false;

  const code = response.code;
  const isSuccess = response.suc && (code === '200' || code === 200);

  return !isSuccess;
}

/**
 * 判断错误是否应该重试
 * @param {Object} error - 错误对象
 * @returns {boolean} - 是否应该重试
 */
export function isRetryableError(error) {
  // 处理null或undefined
  if (!error) {
    return false;
  }

  // 重试的HTTP状态码: 429(频率限制)、502(网关错误)、503(服务不可用)、504(网关超时)
  const retryableStatusCodes = [429, 502, 503, 504];

  if (error.status && retryableStatusCodes.includes(error.status)) {
    return true;
  }

  // 网络错误通常是暂时性的，可以重试
  if (error.code === CUSTOM_ERRORS.NETWORK_ERROR.code) {
    return true;
  }

  return false;
}
