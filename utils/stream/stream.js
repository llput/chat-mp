// 流处理模块
// 提供统一的SSE流式响应处理能力

import { TextEncoder, TextDecoder } from './text-encoding.js';
import { createErrorObject } from './errors.js';

/**
 * 行解码器 - 用于将流数据按行解析
 */
export class LineDecoder {
  static NEWLINE_CHARS = new Set(['\n', '\r']);
  static NEWLINE_REGEXP = /\r\n|[\n\r]/g;

  constructor() {
    this.buffer = [];
    this.trailingCR = false;
    this.textDecoder = null;
  }

  /**
   * 解码数据块中的行
   * @param {Uint8Array|ArrayBuffer|string} chunk - 数据块
   * @returns {string[]} - 解析出的完整行
   */
  decode(chunk) {
    let text = this.decodeText(chunk);

    if (this.trailingCR) {
      text = '\r' + text;
      this.trailingCR = false;
    }

    if (text.endsWith('\r')) {
      this.trailingCR = true;
      text = text.slice(0, -1);
    }

    if (!text) {
      return [];
    }

    const trailingNewline = LineDecoder.NEWLINE_CHARS.has(text[text.length - 1] || '');
    let lines = text.split(LineDecoder.NEWLINE_REGEXP);

    if (trailingNewline) {
      lines.pop();
    }

    if (lines.length === 1 && !trailingNewline) {
      this.buffer.push(lines[0]);
      return [];
    }

    if (this.buffer.length > 0) {
      lines = [this.buffer.join('') + lines[0], ...lines.slice(1)];
      this.buffer = [];
    }

    if (!trailingNewline) {
      this.buffer = [lines.pop() || ''];
    }

    return lines;
  }

  /**
   * 将字节数据解码为文本
   * @param {Uint8Array|ArrayBuffer|string} bytes - 字节数据
   * @returns {string} - 解码后的文本
   */
  decodeText(bytes) {
    if (bytes == null) return '';
    if (typeof bytes === 'string') return bytes;

    // 首先尝试使用原生 Buffer（Node.js 环境）
    if (typeof Buffer !== 'undefined') {
      if (bytes instanceof Buffer) {
        return bytes.toString();
      }

      if (bytes instanceof Uint8Array) {
        return Buffer.from(bytes).toString();
      }

      throw new Error(`非预期的非Uint8Array类型数据流(${bytes.constructor.name})，请报告此错误`);
    }

    // 检查全局 TextDecoder（浏览器环境）
    const g = typeof global !== 'undefined' ? global : self;
    if (typeof g.TextDecoder !== 'undefined') {
      if (bytes instanceof Uint8Array || bytes instanceof ArrayBuffer) {
        this.textDecoder ||= new g.TextDecoder('utf8');
        return this.textDecoder.decode(bytes);
      }

      throw new Error(
        `非预期的非Uint8Array/ArrayBuffer类型数据(${bytes.constructor.name})，请报告此错误`,
      );
    }

    // 使用导入的 TextDecoder polyfill（小程序等环境）
    if (TextDecoder) {
      if (bytes instanceof Uint8Array || bytes instanceof ArrayBuffer) {
        this.textDecoder ||= new TextDecoder('utf8');
        return this.textDecoder.decode(bytes);
      }

      throw new Error(
        `非预期的非Uint8Array/ArrayBuffer类型数据(${bytes.constructor.name})，请报告此错误`,
      );
    }

    throw new Error(`环境中未找到Buffer或TextDecoder，请报告此错误`);
  }

  /**
   * 处理缓冲区中的剩余数据
   * @returns {string[]} - 缓冲区中的数据行
   */
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

/**
 * SSE解码器 - 用于解析SSE格式消息
 */
class SSEDecoder {
  constructor() {
    this.event = null;
    this.data = [];
    this.chunks = [];
  }

  /**
   * 解码一行SSE数据
   * @param {string} line - 单行SSE数据
   * @returns {Object|null} - 解析的SSE消息对象或null
   */
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

    let [fieldname, , value] = partition(line, ':');
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
}

/**
 * 将字符串分割为前缀、分隔符和后缀三部分
 * @param {string} str - 要分割的字符串
 * @param {string} delimiter - 分隔符
 * @returns {Array} - [前缀, 分隔符, 后缀]
 */
function partition(str, delimiter) {
  const index = str.indexOf(delimiter);

  if (index !== -1) {
    return [str.substring(0, index), delimiter, str.substring(index + delimiter.length)];
  }

  return [str, '', ''];
}

/**
 * 将ReadableStream转换为异步可迭代对象
 * @param {ReadableStream} stream - 可读流
 * @returns {AsyncIterable} - 异步可迭代对象
 */
export function readableStreamAsyncIterable(stream) {
  if (stream[Symbol.asyncIterator]) return stream;

  const reader = stream.getReader();

  return {
    async next() {
      try {
        const result = await reader.read();
        if (result?.done) reader.releaseLock();
        return result;
      } catch (e) {
        reader.releaseLock();
        throw e;
      }
    },

    async return() {
      const cancelPromise = reader.cancel();
      reader.releaseLock();
      await cancelPromise;
      return { done: true, value: undefined };
    },

    [Symbol.asyncIterator]() {
      return this;
    },
  };
}

/**
 * 查找二进制数据中双换行符的索引
 * @param {Uint8Array} buffer - 二进制数据缓冲区
 * @returns {number} - 双换行符后的索引，如果未找到则返回-1
 */
function findDoubleNewlineIndex(buffer) {
  const newline = 0x0a; // \n
  const carriage = 0x0d; // \r

  for (let i = 0; i < buffer.length - 2; i++) {
    if (buffer[i] === newline && buffer[i + 1] === newline) {
      // \n\n
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === carriage) {
      // \r\r
      return i + 2;
    }
    if (
      buffer[i] === carriage &&
      buffer[i + 1] === newline &&
      i + 3 < buffer.length &&
      buffer[i + 2] === carriage &&
      buffer[i + 3] === newline
    ) {
      // \r\n\r\n
      return i + 4;
    }
  }

  return -1;
}

/**
 * 处理SSE流块
 * @param {AsyncIterable} iterator - 异步迭代器
 */
async function* iterSSEChunks(iterator) {
  let data = new Uint8Array();

  for await (const chunk of iterator) {
    if (chunk == null) {
      continue;
    }

    const binaryChunk =
      chunk instanceof ArrayBuffer
        ? new Uint8Array(chunk)
        : typeof chunk === 'string'
        ? new TextEncoder().encode(chunk)
        : chunk;

    let newData = new Uint8Array(data.length + binaryChunk.length);
    newData.set(data);
    newData.set(binaryChunk, data.length);
    data = newData;

    let patternIndex;
    while ((patternIndex = findDoubleNewlineIndex(data)) !== -1) {
      yield data.slice(0, patternIndex);
      data = data.slice(patternIndex);
    }
  }

  if (data.length > 0) {
    yield data;
  }
}

/**
 * 迭代SSE消息
 * @param {Response} response - Fetch API响应对象
 * @param {Object} controller - 中止控制器
 * @returns {AsyncGenerator} - 异步生成器，产生SSE消息
 */
export async function* _iterSSEMessages(response, controller) {
  if (!response.body) {
    controller.abort();
    throw new Error('尝试处理无body的响应');
  }

  const sseDecoder = new SSEDecoder();
  const lineDecoder = new LineDecoder();

  const iter = readableStreamAsyncIterable(response.body);
  for await (const sseChunk of iterSSEChunks(iter)) {
    for (const line of lineDecoder.decode(sseChunk)) {
      const sse = sseDecoder.decode(line);
      if (sse) yield sse;
    }
  }

  for (const line of lineDecoder.flush()) {
    const sse = sseDecoder.decode(line);
    if (sse) yield sse;
  }
}

/**
 * Stream类 - 提供流式数据处理能力
 */
export class Stream {
  /**
   * 创建Stream实例
   * @param {Function} iterator - 迭代器函数
   * @param {Object} controller - 控制器对象
   */
  constructor(iterator, controller) {
    this.iterator = iterator;
    this.controller = controller;
  }

  /**
   * 根据SSE响应创建Stream实例
   * @param {Response} response - Fetch API响应对象
   * @param {Object} options - 配置选项
   * @param {AbortSignal} options.signal - 中止信号
   * @param {AbortController} options.controller - 中止控制器
   * @returns {Stream} - Stream实例
   */
  static fromSSEResponse(response, { signal, controller }) {
    let consumed = false;

    async function* iterator() {
      if (consumed) {
        throw new Error('不能迭代已消费的流，请使用`.tee()`分割流');
      }
      consumed = true;
      let done = false;

      try {
        for await (const sse of _iterSSEMessages(response, controller)) {
          if (done) continue;

          if (sse.data.startsWith('[DONE]')) {
            done = true;
            continue;
          }

          if (sse.event === null) {
            let data;

            try {
              data = JSON.parse(sse.data);
            } catch (e) {
              console.error(`无法解析消息为JSON:`, sse.data);
              console.error(`来自数据块:`, sse.raw);
              throw e;
            }

            if (data) {
              if (data.error) {
                throw createErrorObject(
                  'BUSINESS_ERROR',
                  new Error(data.error.message || JSON.stringify(data.error)),
                );
              } else if (data.err) {
                throw createErrorObject(
                  'BUSINESS_ERROR',
                  new Error(data.err.message || JSON.stringify(data.err)),
                );
              }
            }

            yield data;
          } else {
            let data;
            try {
              data = JSON.parse(sse.data);
            } catch (e) {
              console.error(`无法解析消息为JSON:`, sse.data);
              console.error(`来自数据块:`, sse.raw);
              throw e;
            }

            if (sse.event == 'error') {
              throw createErrorObject(
                'BUSINESS_ERROR',
                new Error(data.error?.message || data.message || JSON.stringify(data)),
              );
            }
            yield { event: sse.event, data: data };
          }
        }
        done = true;
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        throw e;
      } finally {
        if (!done && controller && typeof controller.abort === 'function') {
          controller.abort();
        }
      }
    }

    return new Stream(iterator, controller);
  }

  /**
   * 从SSE响应创建带关键词过滤的Stream
   * @param {Response} response - Fetch API响应对象
   * @param {Object} options - 配置选项
   * @param {Object} keywords - 要过滤的关键词
   * @param {Object} replacements - 替换内容
   * @returns {Stream} - 过滤后的Stream实例
   */
  static fromSSEResponseWithKeywordFilter(
    response,
    { signal, controller },
    keywords,
    replacements,
  ) {
    const originalStream = this.fromSSEResponse(response, {
      signal,
      controller,
    });

    return new Stream(async function* () {
      for await (const chunk of originalStream) {
        if (chunk.data && typeof chunk.data === 'string') {
          let filteredData = chunk.data;
          for (const [keyword, replacement] of Object.entries(replacements)) {
            const regex = new RegExp(keyword, 'gi');
            filteredData = filteredData.replace(regex, replacement);
          }
          yield { ...chunk, data: filteredData };
        } else {
          yield chunk;
        }
      }
    }, controller);
  }

  /**
   * 从可读流创建Stream实例
   * @param {ReadableStream} readableStream - 可读流
   * @param {Object} controller - 控制器对象
   * @returns {Stream} - Stream实例
   */
  static fromReadableStream(readableStream, controller) {
    let consumed = false;

    async function* iterLines() {
      const lineDecoder = new LineDecoder();
      const iter = readableStreamAsyncIterable(readableStream);

      for await (const chunk of iter) {
        for (const line of lineDecoder.decode(chunk)) {
          yield line;
        }
      }

      for (const line of lineDecoder.flush()) {
        yield line;
      }
    }

    async function* iterator() {
      if (consumed) {
        throw new Error('不能迭代已消费的流，请使用`.tee()`分割流');
      }
      consumed = true;
      let done = false;

      try {
        for await (const line of iterLines()) {
          if (done) continue;
          if (line) yield JSON.parse(line);
        }
        done = true;
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        throw e;
      } finally {
        if (!done) controller.abort();
      }
    }

    return new Stream(iterator, controller);
  }

  /**
   * 异步迭代器协议实现
   */
  [Symbol.asyncIterator]() {
    return this.iterator();
  }

  /**
   * 将流分割为两个独立流
   * @returns {Array} - 两个独立的Stream实例
   */
  tee() {
    const left = [];
    const right = [];
    const iterator = this.iterator();

    const teeIterator = queue => {
      return {
        next: () => {
          if (queue.length === 0) {
            const result = iterator.next();
            left.push(result);
            right.push(result);
          }
          return queue.shift();
        },
      };
    };

    return [
      new Stream(() => teeIterator(left), this.controller),
      new Stream(() => teeIterator(right), this.controller),
    ];
  }

  /**
   * 将Stream转换为可读流
   * @returns {ReadableStream} - 可读流
   */
  toReadableStream() {
    const self = this;
    let iter;
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start() {
        iter = self[Symbol.asyncIterator]();
      },
      async pull(ctrl) {
        try {
          const { value, done } = await iter.next();
          if (done) return ctrl.close();

          const bytes = encoder.encode(JSON.stringify(value) + '\n');
          ctrl.enqueue(bytes);
        } catch (err) {
          ctrl.error(err);
        }
      },
      async cancel() {
        await iter.return?.();
      },
    });
  }
}
