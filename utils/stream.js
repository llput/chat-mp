// stream.js
import { TextDecoder, TextEncoder } from './text-encoding';
import { STREAM_EVENT_TYPES } from './config';
import reportEvent from './report-event';

export class APIError extends Error {
  constructor(status, error, message, headers) {
    super(APIError.makeMessage(status, error, message));
    this.status = status;
    this.headers = headers;
    this.error = error;
  }

  static makeMessage(status, error, message) {
    // eslint-disable-next-line no-nested-ternary
    const msg = error?.message
      ? typeof error.message === 'string'
        ? error.message
        : JSON.stringify(error.message)
      : error
      ? JSON.stringify(error)
      : message;

    if (status && msg) return `${status} ${msg}`;
    if (status) return `${status} status code (no body)`;
    if (msg) return msg;
    return '(no status code or body)';
  }
}

// 添加一个安全的字符串处理函数
const safeDecodeString = (str, options = {}) => {
  if (!str) return '';

  try {
    // 首先尝试直接返回原始字符串
    if (/^[\u0000-\u007f]*$/.test(str)) {
      return str;
    }

    // 如果包含非ASCII字符，使用 TextEncoder/TextDecoder
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder('utf-8', { fatal: false });

    // 将字符串转换为 UTF-8 编码的字节数组 再解码回字符串
    const bytes = textEncoder.encode(str);
    return textDecoder.decode(bytes);
  } catch (error) {
    console.error('String decode error:', {
      error,
      originalString: str,
      stringLength: str.length,
      // 记录前20个字符的编码值，用于调试
      sampleChars: Array.from(str.slice(0, 20)).map(c => c.charCodeAt(0)),
    });

    // 上报字符串解码错误
    reportEvent(STREAM_EVENT_TYPES.STREAM_DECODE_ERROR, {
      error_msg: error.message || '',
      string_length: str?.length || 0,
      user_id: options.userId || '',
      session: options.session || '',
      request_id: options.requestId || '',
      message_id: options.messageId || '',
    });

    // 如果处理失败，返回原始字符串
    return str;
  }
};

// 添加 URL 验证函数
const isValidUrl = url => {
  try {
    // 检查是否是完整的 URL
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  } catch (e) {
    return false;
  }
};

const decodeBuffer = (chunk, options = {}) => {
  try {
    // 如果已经是字符串，尝试安全解码
    if (typeof chunk === 'string') {
      return safeDecodeString(chunk);
    }

    // 判断是否是 ArrayBuffer 或 TypedArray
    if (chunk instanceof ArrayBuffer || ArrayBuffer.isView(chunk)) {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const uint8Array = new Uint8Array(chunk instanceof ArrayBuffer ? chunk : chunk.buffer);

      return decoder.decode(uint8Array);
    }

    // 处理其他意外的数据类型，上报意外数据类型
    console.warn('Unexpected chunk type:', typeof chunk);
    reportEvent(STREAM_EVENT_TYPES.STREAM_DECODE_ERROR, {
      error_type: 'unexpected_chunk_type',
      chunk_type: typeof chunk,
      chunk_constructor: chunk?.constructor?.name || 'unknown',
      user_id: options.userId || '',
      session: options.session || '',
      request_id: options.requestId || '',
      message_id: options.messageId || '',
    });

    // 获取应用实例，用于日志上报
    const app = getApp();
    if (app?.globalData?.logManager) {
      app.warn('意外的数据类型', {
        chunk_type: typeof chunk,
        chunk_constructor: chunk?.constructor?.name || 'unknown',
      });
    }

    return String(chunk);
  } catch (error) {
    console.error('Buffer decode error:', {
      error,
      chunkType: typeof chunk,
      isArrayBuffer: chunk instanceof ArrayBuffer,
      isTypedArray: ArrayBuffer.isView(chunk),
      chunkLength: chunk?.length || chunk?.byteLength,
    });

    // 上报缓冲区解码错误，增加用户会话信息
    reportEvent(STREAM_EVENT_TYPES.STREAM_DECODE_ERROR, {
      error_msg: error.message || '',
      chunk_type: typeof chunk,
      is_array_buffer: chunk instanceof ArrayBuffer,
      is_typed_array: ArrayBuffer.isView(chunk),
      chunk_length: chunk?.length || chunk?.byteLength || 0,
      user_id: options.userId || '',
      session: options.session || '',
      request_id: options.requestId || '',
      message_id: options.messageId || '',
    });

    // 获取应用实例，用于日志上报
    const app = getApp();
    if (app?.globalData?.logManager) {
      app.error('缓冲区解码错误', {
        error_msg: error.message,
        chunk_type: typeof chunk,
      });
    }

    // 失败时返回可读的错误提示
    return '[解码错误]';
  }
};

export class StreamProcessor {
  constructor() {
    this.decoder = new SSEDecoder();
    this.lineDecoder = new LineDecoder();
    this.isProcessing = false;
    this.isClosed = false;
    this.startTime = Date.now();
    this.firstChunkTime = null;
    this.chunksReceived = 0;

    // 超时监控相关属性
    this.lastChunkTime = null;
    this.chunkTimeoutTimer = null;
    this.CHUNK_TIMEOUT = 5000; // 5秒超时阈值

    this.options = {};
  }

  startTimeoutMonitor(onError, options) {
    // 清除现有的计时器
    if (this.chunkTimeoutTimer) {
      clearTimeout(this.chunkTimeoutTimer);
      this.chunkTimeoutTimer = null;
    }

    // 如果已关闭流，则不启动监控
    if (this.isClosed) return;

    // 设置新的超时检测定时器
    this.chunkTimeoutTimer = setTimeout(() => {
      const now = Date.now();

      // 检查自上次接收数据以来是否已超时
      if (this.lastChunkTime && now - this.lastChunkTime >= this.CHUNK_TIMEOUT) {
        // 上报超时事件
        reportEvent(STREAM_EVENT_TYPES.STREAM_TIMEOUT, {
          timeout_duration_ms: this.CHUNK_TIMEOUT,
          actual_delay_ms: now - this.lastChunkTime,
          chunks_received: this.chunksReceived,
          total_duration_ms: now - this.startTime,
          session: options.session || '',
          model: options.model || '',
          user_id: options.userId || '',
          message_id: options.messageId || '',
          request_id: options.requestId || '',
          user_question: options.userQuestion || '',
          timestamp: now,
        });

        // 记录日志
        const app = getApp();
        if (app?.globalData?.logManager) {
          app.warn('流数据接收超时', {
            timeout_ms: this.CHUNK_TIMEOUT,
            elapsed_ms: now - this.lastChunkTime,
            chunks_received: this.chunksReceived,
            session: options.session || '',
            user_question: options.userQuestion || '',
            request_id: options.requestId || '',
          });
        }

        // 注意：我们不主动关闭流，只上报异常
        // 可能是暂时的网络问题，后续流数据可能会恢复
      }

      // 继续监控，除非已关闭
      if (!this.isClosed) {
        this.startTimeoutMonitor(onError, options);
      }
    }, this.CHUNK_TIMEOUT);
  }

  processChunk(chunk, onData, onError, options = {}) {
    if (this.isClosed) {
      return;
    }

    // 保存或更新 options
    this.options = { ...this.options, ...options };

    // 更新 LineDecoder 的上下文
    this.lineDecoder.setContext(this.options);

    // 增加计数
    // eslint-disable-next-line no-plusplus
    this.chunksReceived++;
    this.lastChunkTime = Date.now();

    // 记录第一个数据块的时间
    if (!this.firstChunkTime) {
      this.firstChunkTime = Date.now();

      // 首次收到数据后启动超时监控
      this.startTimeoutMonitor(onError, options);

      // 上报第一个数据块接收
      reportEvent(STREAM_EVENT_TYPES.STREAM_FIRST_CHUNK, {
        ttfb: this.firstChunkTime - this.startTime,
        session: options.session || '',
        model: options.model || '',
        user_id: options.userId || '',
        message_id: options.messageId || '',
        request_id: options.requestId || '',
        user_question: options.userQuestion || '',
      });

      // 获取应用实例，用于日志上报
      const app = getApp();
      if (app?.globalData?.logManager) {
        app.log('首次接收流数据', {
          ttfb: this.firstChunkTime - this.startTime,
          session: options.session || '',
          request_id: options.requestId || '',
          user_question: options.userQuestion || '',
        });
      }
    }

    try {
      this.isProcessing = true;
      const text = decodeBuffer(chunk, this.options);

      const lines = this.lineDecoder.decode(text);

      for (const line of lines) {
        const sse = this.decoder.decode(line);

        if (sse) {
          // 处理流结束标记
          if (sse.data.startsWith('[DONE]')) {
            this.isClosed = true;

            // 清除超时监控
            if (this.chunkTimeoutTimer) {
              clearTimeout(this.chunkTimeoutTimer);
              this.chunkTimeoutTimer = null;
            }

            // 上报流处理完成
            reportEvent(STREAM_EVENT_TYPES.STREAM_CLOSED, {
              chunks_received: this.chunksReceived,
              total_duration: Date.now() - this.startTime,
              generation_duration: this.firstChunkTime ? Date.now() - this.firstChunkTime : 0,
              session: options.session || '',
              model: options.model || '',
              user_id: options.userId || '',
              message_id: options.messageId || '',
            });

            onData({ done: true });
            return;
          }

          try {
            // 解析 SSE 数据
            const sseData = JSON.parse(sse?.data);
            // console.log('sseData', sseData);
            // 处理 increment 事件
            if (sseData?.increment) {
              onData({
                type: 'increment',
                data: {
                  increment: sseData?.increment,
                  requestId: sseData?.id,
                },
              });
            }

            // 后台通过 data.evnet.name 来区分不同的类型
            // business、queryExpand,recall,rank,quote,summary
            const sseEventName = sseData?.event?.name;

            // 处理事件类型消息
            if (sseData.event) {
              try {
                // Plugin 事件处理，不能用 Plugin 类型判断，
                if (
                  sseEventName === 'recall' ||
                  sseEventName === 'rank' ||
                  sseEventName === 'quote' ||
                  sseEventName === 'business'
                ) {
                  const pluginData = sseData;
                  this.handlePluginEvent(pluginData, onData, options, sseData);
                  continue;
                }

                // 其他事件处理
                const eventData = JSON.parse(sse.data);
                onData({
                  event: sse.event,
                  data: eventData,
                  pluginName: sseEventName,
                  rawData: sseData,
                });
                continue;
              } catch (e) {
                // 上报事件解析错误
                reportEvent(STREAM_EVENT_TYPES.STREAM_PARSE_ERROR, {
                  error_msg: e.message || '',
                  event_name: sseEventName || '',
                  session: options.session || '',
                  user_id: options.userId || '',
                });

                onData({
                  event: sse.event,
                  data: sse.data,
                  pluginName: sseEventName,
                  rawData: sseData,
                });
                continue;
              }
            }

            // 处理普通数据消息
            if (sse.event === null) {
              try {
                const data = JSON.parse(sse.data);

                // 3. 添加 stop 信号的检查
                if (
                  sseData?.choices?.[0]?.finish_reason === 'stop' ||
                  sseData?.choices?.[0]?.finish_msg === 'eos_token stop'
                ) {
                  this.isClosed = true;

                  // 清除超时监控
                  if (this.chunkTimeoutTimer) {
                    clearTimeout(this.chunkTimeoutTimer);
                    this.chunkTimeoutTimer = null;
                  }

                  // 上报流处理完成
                  reportEvent(STREAM_EVENT_TYPES.STREAM_CLOSED, {
                    reason: 'stop_signal',
                    chunks_received: this.chunksReceived,
                    total_duration: Date.now() - this.startTime,
                    generation_duration: this.firstChunkTime ? Date.now() - this.firstChunkTime : 0,
                    session: options.session || '',
                    model: options.model || '',
                    user_id: options.userId || '',
                    message_id: options.messageId || '',
                  });

                  onData({ done: true });
                  return;
                }

                // 错误检查
                if (data?.error) {
                  // 上报API错误
                  reportEvent(STREAM_EVENT_TYPES.STREAM_PROCESSING_ERROR, {
                    error_type: 'api_error',
                    error_msg: JSON.stringify(data.error),
                    session: options.session || '',
                    model: options.model || '',
                    user_id: options.userId || '',
                    message_id: options.messageId || '',
                  });

                  onError(new APIError(undefined, data.error, undefined, undefined));
                  return;
                }
                if (data?.err) {
                  // 上报API错误
                  reportEvent(STREAM_EVENT_TYPES.STREAM_PROCESSING_ERROR, {
                    error_type: 'api_err',
                    error_msg: JSON.stringify(data.err),
                    session: options.session || '',
                    model: options.model || '',
                    user_id: options.userId || '',
                    message_id: options.messageId || '',
                  });

                  onError(new APIError(undefined, data.err, undefined, undefined));
                  return;
                }

                // 处理 model 信息
                if (data.model) {
                  onData({ data: { model: data.model } });
                }

                // 处理选择内容
                if (data.choices?.length > 0) {
                  this.handleChoices(data.choices, onData, options, sseData);
                } else {
                  onData({ data });
                }
              } catch (e) {
                console.error('Could not parse message into JSON:', sse.data);
                console.error('From chunk:', sse.raw);

                // 上报JSON解析错误
                reportEvent(STREAM_EVENT_TYPES.STREAM_PARSE_ERROR, {
                  error_msg: e.message || '',
                  data_sample: sse.data?.substring(0, 100) || '',
                  session: options.session || '',
                  user_id: options.userId || '',
                });

                // 获取应用实例，用于日志上报
                const app = getApp();
                if (app?.globalData?.logManager) {
                  app.error('JSON解析错误', {
                    error_msg: e.message || '',
                    data_sample: sse.data?.substring(0, 100) || '',
                  });
                }

                onError(e);
                return;
              }
            }
          } catch (e) {
            console.error('Error processing SSE data:', e);

            // 上报SSE处理错误
            reportEvent(STREAM_EVENT_TYPES.STREAM_PROCESSING_ERROR, {
              error_type: 'sse_processing',
              error_msg: e.message || '',
              session: options.session || '',
              model: options.model || '',
              user_id: options.userId || '',
              message_id: options.messageId || '',
            });

            onError(e);
          }
        }
      }
    } catch (e) {
      console.error('Stream processing error:', e);

      // 上报流处理错误
      reportEvent(STREAM_EVENT_TYPES.STREAM_PROCESSING_ERROR, {
        error_type: 'stream_processing',
        error_msg: e.message || '',
        session: options.session || '',
        model: options.model || '',
        user_id: options.userId || '',
        message_id: options.messageId || '',
      });

      // 获取应用实例，用于日志上报
      const app = getApp();
      if (app?.globalData?.logManager) {
        app.error('流处理错误', {
          error_msg: e.message || '',
          session: options.session || '',
        });
      }

      onError(e);
    } finally {
      this.isProcessing = false;
    }
  }

  handlePluginEvent(pluginData, onData, options = {}, sseData = {}) {
    // 获取插件名称
    const pluginName = pluginData?.event?.name || '';

    // 先检查是否为业务类型事件，并尝试获取会话信息
    let sessionValue = options.session || '';

    // 对于 business 类型的插件，先尝试提取 session 信息
    if (pluginName === 'business' && pluginData?.event?.state === 1) {
      try {
        const businessData = JSON.parse(pluginData?.event?.content?.message);
        // 使用业务数据中的 session 更新 sessionValue
        if (businessData && businessData.session) {
          sessionValue = businessData.session;
          // 保存到类成员变量中，以便后续使用
          this.businessSession = businessData.session;
        }
      } catch (error) {
        console.error('Error parsing business data:', error);
      }
    } else if (pluginName === 'business' && this.businessSession) {
      // 如果是同一个 business 插件的其他状态，复用之前保存的 session
      sessionValue = this.businessSession;
    }

    // 上报插件事件
    reportEvent(STREAM_EVENT_TYPES.STREAM_PLUGIN_EVENT, {
      plugin_name: pluginName,
      plugin_state: pluginData?.event?.state,
      session: sessionValue,
      user_id: options.userId || '',
      message_id: options.messageId || '',
    });

    if (
      pluginData?.event?.name === 'recall' ||
      pluginData?.event?.name === 'rank' ||
      pluginData?.event?.name === 'quote' ||
      pluginData?.event?.name === 'queryExpand'
    ) {
      onData({
        data: null,
        status: pluginData?.event?.state,
        type: pluginData.event?.type,
        message: pluginData.event?.content?.message,
        pluginName: pluginName,
        searchState: pluginData?.event?.state === 2 ? 'end' : 'searching',
        rawData: sseData,
      });
    }

    // 处理引用状态
    if (pluginData?.event?.name === 'quote' && pluginData?.event?.state === 2) {
      onData({
        data: null,
        status: pluginData?.event?.state,
        type: pluginData.event?.type,
        message: pluginData.event?.content?.message,
        pluginName: pluginName,
        searchState: 'end',
        rawData: sseData,
      });
      return;
    }

    // 处理会话 Meta 信息
    if (pluginData?.event?.name === 'business' && pluginData?.event?.state === 1) {
      try {
        const businessData = JSON.parse(pluginData?.event?.content?.message);
        onData({
          data: {
            intentName: businessData.intentName,
            intentProduct: businessData.intentName,
            sessionName: businessData.sessionName,
            session: businessData.session,
          },
          status: pluginData?.event?.state,
          type: pluginData.event?.name,
          message: pluginData.event?.content?.message,
          pluginName: pluginName,
          rawData: sseData,
        });
      } catch (error) {
        console.error('Error parsing business data:', error);
        // 上报解析错误
        reportEvent(STREAM_EVENT_TYPES.STREAM_PARSE_ERROR, {
          error_type: 'business_data',
          error_msg: error.message || '',
          session: options.session || '',
          user_id: options.userId || '',
        });
      }
    }
  }

  handleChoices(choices, onData, options = {}, sseData = {}) {
    for (const choice of choices) {
      if (choice.delta?.reasoning_content) {
        onData({
          data: { choices: [{ delta: { reasoning_content: choice.delta.reasoning_content } }] },
          rawData: sseData,
        });
      }

      if (choice.delta?.content) {
        onData({
          data: { choices: [{ delta: { content: choice.delta.content } }] },
          rawData: sseData,
        });
      }

      if (choice.delta?.output_sources?.ref_docs) {
        const articles = choice.delta.output_sources.ref_docs.map(doc => {
          try {
            // 使用安全的解码函数处理标题
            return {
              index: doc.index,
              publish_time: doc.publish_time,
              title: safeDecodeString(doc.title),
              url: doc.url,
            };
          } catch (error) {
            console.error('Reference processing error:', error, doc);

            // 上报引用处理错误
            reportEvent(STREAM_EVENT_TYPES.STREAM_PROCESSING_ERROR, {
              error_type: 'reference_processing',
              error_msg: error.message || '',
              session: options.session || '',
              user_id: options.userId || '',
            });

            // 发生错误时保留原始标题
            return {
              index: doc.index,
              publish_time: doc.publish_time,
              title: doc.title || '[标题处理错误]',
              url: doc.url,
            };
          }
        });

        // 上报引用接收
        reportEvent(STREAM_EVENT_TYPES.STREAM_REFERENCES_RECEIVED, {
          references_count: articles.length,
          session: options.session || '',
          user_id: options.userId || '',
          message_id: options.messageId || '',
        });

        console.log('articles', articles);

        onData({ data: { articles: articles }, rawData: sseData });
      }
    }
  }

  close() {
    if (!this.isClosed) {
      this.isClosed = true;
      this.lineDecoder.flush();

      // 清除超时监控定时器
      if (this.chunkTimeoutTimer) {
        clearTimeout(this.chunkTimeoutTimer);
        this.chunkTimeoutTimer = null;
      }

      // 上报流关闭
      reportEvent(STREAM_EVENT_TYPES.STREAM_CLOSED, {
        reason: 'manual_close',
        chunks_received: this.chunksReceived,
        total_duration: Date.now() - this.startTime,
        generation_duration: this.firstChunkTime ? Date.now() - this.firstChunkTime : 0,
        session: this.options.session || '',
        model: this.options.model || '',
        user_id: this.options.userId || '',
        message_id: this.options.messageId || '',
      });
    }
  }

  isActive() {
    return this.isProcessing && !this.isClosed;
  }
}

class SSEDecoder {
  constructor() {
    this.event = null;
    this.data = [];
    this.chunks = [];
    this.rawData = [];
  }

  decode(line) {
    if (line.endsWith('\r')) {
      line = line.substring(0, line.length - 1);
    }

    if (!line) {
      if (!this.event && !this.data.length) return null;

      const sse = {
        event: this.event,
        data: this.data.join('\n'),
        raw: this.chunks,
      };

      this.event = null;
      this.data = [];
      this.chunks = [];

      return sse;
    }

    this.chunks.push(line);

    if (line.startsWith(':')) {
      return null;
    }

    const [fieldname, , valueRaw] = this.partition(line, ':');
    let value = valueRaw;
    if (value.startsWith(' ')) {
      value = value.substring(1);
    }

    if (fieldname === 'event') {
      this.event = value;
    } else if (fieldname === 'data') {
      this.data.push(value);
    }

    return null;
  }

  partition(str, delimiter) {
    const index = str.indexOf(delimiter);
    if (index !== -1) {
      return [str.substring(0, index), delimiter, str.substring(index + delimiter.length)];
    }
    return [str, '', ''];
  }
}

class LineDecoder {
  constructor() {
    this.buffer = [];
    this.trailingCR = false;
    this.context = {}; // 添加上下文存储
  }

  // 添加设置上下文的方法
  setContext(context) {
    this.context = context || {};
  }

  decode(chunk) {
    let text = decodeBuffer(chunk, this.context);

    if (this.trailingCR) {
      text = `\r${text}`;
      this.trailingCR = false;
    }
    if (text.endsWith('\r')) {
      this.trailingCR = true;
      text = text.slice(0, -1);
    }

    if (!text) {
      return [];
    }

    const lines = text.split(/\r\n|[\n\r]/);
    const trailingNewline = /[\n\r]/.test(text[text.length - 1] || '');

    if (lines.length === 1 && !trailingNewline) {
      this.buffer.push(lines[0]);
      return [];
    }

    if (this.buffer.length > 0) {
      lines[0] = this.buffer.join('') + lines[0];
      this.buffer = [];
    }

    if (!trailingNewline) {
      this.buffer = [lines.pop() || ''];
    }

    return lines;
  }

  flush() {
    if (!this.buffer.length && !this.trailingCR) {
      return [];
    }

    const lines = [this.buffer.join('')];
    this.buffer = [];
    this.trailingCR = false;
    return lines;
  }
}
