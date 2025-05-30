// 确定JavaScript环境中的全局对象:
// - 在浏览器中，'self'指向window对象
// - 在Node.js中，可以使用'global'
// 这样使我们的模块无需修改就能在两种环境中工作
const g = typeof global !== 'undefined' ? global : self;

// 定义UTF-8编码的所有允许字符串表示
// 我们只支持UTF-8编码，但用户可能以这些不同格式指定它
// 这三个字符串都是同一种UTF-8编码的标准别名
const utf8Encodings = ['utf8', 'utf-8', 'unicode-1-1-utf-8'];

// TextEncoderPolyfill实现TextEncoder API，当原生实现不可用时使用
// 使用ES6类语法使构造函数和方法的组织更清晰
class TextEncoderPolyfill {
  constructor(encoding) {
    // 验证编码是未定义、null或支持的UTF-8格式之一
    // 这与TextEncoder规范保持兼容，该规范只要求支持UTF-8
    if (
      utf8Encodings.indexOf(encoding) < 0 &&
      typeof encoding !== 'undefined' &&
      encoding !== null
    ) {
      throw new RangeError('Invalid encoding type. Only utf-8 is supported');
    }
    // 始终设置为utf-8，因为这是我们唯一支持的编码
    // 这遵循TextEncoder规范，其中utf-8是唯一必需的编码
    this.encoding = 'utf-8';
  }

  // encode方法将JavaScript字符串转换为UTF-8编码的Uint8Array
  encode(str) {
    // 确保我们处理的是字符串，符合规范要求
    if (typeof str !== 'string') {
      throw new TypeError('passed argument must be of type string');
    }

    // 这是核心编码逻辑:
    // 1. encodeURIComponent将字符串转换为UTF-8百分比编码格式
    // 2. unescape将其转换为二进制字符串，每个字符代表一个字节
    // 这种方法避免了跨浏览器的字符编码问题
    const binstr = unescape(encodeURIComponent(str));

    // 创建一个精确大小的Uint8Array
    const arr = new Uint8Array(binstr.length);

    // 将二进制字符串的每个字符转换为其字符代码
    // 这些代码现在代表UTF-8字节值
    binstr.split('').forEach((char, i) => {
      arr[i] = char.charCodeAt(0);
    });

    // 返回包含UTF-8编码数据的Uint8Array
    return arr;
  }
}

// TextDecoderPolyfill实现TextDecoder API，当原生实现不可用时使用
class TextDecoderPolyfill {
  constructor(encoding, options) {
    // 与TextEncoder类似，验证编码是否与UTF-8兼容
    if (
      utf8Encodings.indexOf(encoding) < 0 &&
      typeof encoding !== 'undefined' &&
      encoding !== null
    ) {
      throw new RangeError('Invalid encoding type. Only utf-8 is supported');
    }

    // 根据TextDecoder规范设置属性
    this.encoding = 'utf-8';
    this.ignoreBOM = false; // BOM = 字节顺序标记，UTF-8不使用但规范要求

    // 处理fatal选项，它决定解码时的错误行为
    // 如果为true，解码错误应该抛出异常（尽管我们的实现没有完全处理这一点）
    this.fatal = typeof options !== 'undefined' && 'fatal' in options ? options.fatal : false;
    if (typeof this.fatal !== 'boolean') {
      throw new TypeError('fatal flag must be boolean');
    }
  }

  // decode方法使用UTF-8编码将类型化数组转换为字符串
  decode(view, options) {
    // 根据TextDecoder规范处理空输入
    if (typeof view === 'undefined') {
      return '';
    }

    // stream选项影响如何处理不完整序列
    // 如果为true，末尾的不完整序列会被记住，用于下一次decode调用
    // 我们的简单实现没有完全实现流处理行为
    const stream = typeof options !== 'undefined' && 'stream' in options ? options.stream : false;
    if (typeof stream !== 'boolean') {
      throw new TypeError('stream option must be boolean');
    }

    // 确保输入是ArrayBuffer视图（如Uint8Array、DataView等）
    if (!ArrayBuffer.isView(view)) {
      throw new TypeError('passed argument must be an array buffer view');
    } else {
      // 将视图转换为Uint8Array以确保一致访问
      // 这处理输入可能是不同类型视图的情况
      const arr = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);

      // 创建一个数组来保存字符
      const charArr = new Array(arr.length);

      // 将每个字节转换为其字符等价物
      arr.forEach((charcode, i) => {
        charArr[i] = String.fromCharCode(charcode);
      });

      // 我们编码过程的逆过程:
      // 1. 将字节连接成二进制字符串
      // 2. escape将二进制转换为百分比编码格式
      // 3. decodeURIComponent将百分比编码的UTF-8转换回JavaScript字符串
      return decodeURIComponent(escape(charArr.join('')));
    }
  }
}

// 如果环境中有原生TextEncoder/TextDecoder则使用
// 这通过在可能的情况下使用内置实现来确保最佳性能
// 只有在必要时才回退到我们的polyfill
const TextEncoder = typeof g.TextEncoder !== 'undefined' ? g.TextEncoder : TextEncoderPolyfill;
const TextDecoder = typeof g.TextDecoder !== 'undefined' ? g.TextDecoder : TextDecoderPolyfill;

// 使用ES6模块语法导出最终类
// 这取代了原始代码中的UMD模式，使其与
// 现代JavaScript模块系统(import/export)兼容
export { TextEncoder, TextDecoder };
