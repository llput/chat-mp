// 文本编码工具
// 提供跨平台的TextEncoder/TextDecoder实现

// 确定全局对象，在浏览器中是 self 或 window，在 Node.js 中是 global
// 这种处理确保代码在不同环境中都能正确获取全局对象
const g = typeof global !== 'undefined' ? global : self;
let textEncoding;

// 优先使用原生实现，这样可以获得更好的性能和标准兼容性
// 仅在不支持原生实现的环境中使用 polyfill
if (typeof g.TextEncoder !== 'undefined' && typeof g.TextDecoder !== 'undefined') {
  // 直接引用原生实现，避免重复实现带来的性能开销
  textEncoding = {
    TextEncoder: g.TextEncoder,
    TextDecoder: g.TextDecoder,
  };
} else {
  // 定义支持的 UTF-8 编码名称数组
  // 这是为了兼容不同形式的 UTF-8 编码名称，增强用户体验
  const utf8Encodings = ['utf8', 'utf-8', 'unicode-1-1-utf-8'];

  // TextEncoder 实现 - 将字符串转换为 UTF-8 编码的字节数组
  class TextEncoder {
    constructor(encoding) {
      // 验证编码类型，确保只支持 UTF-8
      // 这是因为完整实现所有编码类型工作量大且复杂，而 UTF-8 覆盖了绝大多数使用场景
      if (
        utf8Encodings.indexOf(encoding) < 0 &&
        typeof encoding !== 'undefined' &&
        encoding !== null
      ) {
        throw new RangeError('Invalid encoding type. Only utf-8 is supported');
      }
      // 固定编码为 UTF-8，符合 W3C 标准默认行为
      this.encoding = 'utf-8';
    }

    encode(str) {
      // 类型检查，确保输入为字符串
      // 这是为了提供清晰的错误信息，而不是让代码在后续处理中产生难以追踪的错误
      if (typeof str !== 'string') {
        throw new TypeError('passed argument must be of type string');
      }

      // 使用 encodeURIComponent 和 unescape 组合来实现 UTF-8 编码
      // encodeURIComponent 将非 ASCII 字符转换为 %XX 格式的 UTF-8 表示
      // unescape 将 %XX 格式转回原始字节，这是一种巧妙的 JS 环境中实现 UTF-8 编码的方法
      const binstr = unescape(encodeURIComponent(str));

      // 创建 Uint8Array 存储结果，长度与字符串相同
      // 使用 TypedArray 确保字节表示的一致性和与原生实现的兼容性
      const arr = new Uint8Array(binstr.length);

      // 将每个字符转换为其 UTF-8 字节表示
      // 使用 forEach 提高代码可读性，在现代 JS 引擎中性能差异不大
      binstr.split('').forEach((char, i) => {
        arr[i] = char.charCodeAt(0);
      });
      return arr;
    }
  }

  // TextDecoder 实现 - 将 UTF-8 编码的字节数组转换回字符串
  class TextDecoder {
    constructor(encoding, options) {
      // 同样验证编码类型，确保只支持 UTF-8
      // 保持与 TextEncoder 相同的编码限制，保证 API 的一致性
      if (
        utf8Encodings.indexOf(encoding) < 0 &&
        typeof encoding !== 'undefined' &&
        encoding !== null
      ) {
        throw new RangeError('Invalid encoding type. Only utf-8 is supported');
      }

      // 设置默认编码为 UTF-8
      this.encoding = 'utf-8';

      // 默认 ignoreBOM 为 false，符合 W3C 标准
      this.ignoreBOM = false;

      // 处理 fatal 选项，确定错误处理模式
      // fatal 为 true 时，解码错误会抛出异常；为 false 时会使用替代字符
      this.fatal = typeof options !== 'undefined' && 'fatal' in options ? options.fatal : false;

      // 验证 fatal 是布尔值，提供清晰的错误信息
      if (typeof this.fatal !== 'boolean') {
        throw new TypeError('fatal flag must be boolean');
      }
    }

    decode(view, options) {
      // 处理 undefined 输入，返回空字符串
      // 这与原生 TextDecoder 行为一致，提高 API 兼容性
      if (typeof view === 'undefined') {
        return '';
      }

      // 处理 stream 选项，虽然目前实现并未真正支持流处理
      // 保留此参数是为了与标准 API 兼容，便于未来扩展
      const stream = typeof options !== 'undefined' && 'stream' in options ? options.stream : false;

      // 验证 stream 是布尔值
      if (typeof stream !== 'boolean') {
        throw new TypeError('stream option must be boolean');
      }

      // 验证输入是 ArrayBuffer 视图（如 Uint8Array, DataView 等）
      // 这是为了确保输入符合标准要求，并能够正确访问二进制数据
      if (!ArrayBuffer.isView(view)) {
        throw new TypeError('passed argument must be an array buffer view');
      } else {
        // 创建 Uint8Array 确保统一处理所有类型的 ArrayBuffer 视图
        // 这允许接受任何 ArrayBuffer 视图类型，增加灵活性
        const arr = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);

        // 创建字符数组用于构建结果字符串
        const charArr = new Array(arr.length);

        // 将每个字节转换为字符
        // 这个过程是 encode 的逆过程，将 UTF-8 字节转回字符
        arr.forEach((charcode, i) => {
          charArr[i] = String.fromCharCode(charcode);
        });

        // 使用 escape 和 decodeURIComponent 组合来解码 UTF-8
        // 这种方法巧妙地利用了 JS 内置函数实现 UTF-8 解码，避免手动实现复杂的解码算法
        return decodeURIComponent(escape(charArr.join('')));
      }
    }
  }

  // 设置导出对象
  textEncoding = { TextEncoder, TextDecoder };
}

// 使用命名导出，允许单独导入 TextEncoder 或 TextDecoder
// 符合 ES6 模块的最佳实践，使用方式更灵活
export const { TextEncoder, TextDecoder } = textEncoding;

// 同时提供默认导出，兼容更多导入风格
// 这样既可以使用 import { TextEncoder } 也可以使用 import TextEncoding from ...
export default { TextEncoder, TextDecoder };
