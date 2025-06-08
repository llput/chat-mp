// pages/index/index.js
import { LineDecoder, _iterSSEMessages } from '../../utils/stream/stream';
import { TextDecoder } from '../../utils/stream/text-encoding';
import { createErrorObject } from '../../utils/stream/errors';

const app = getApp();

Page({
  data: {
    messages: [],
    inputText: '',
    isLoading: false,
    currentMessageId: null,
    currentRequestTask: null,
    lineDecoder: null, // 添加LineDecoder实例
  },

  onLoad() {
    console.log('聊天页面加载');
    this.initChat();
    // 初始化LineDecoder
    this.data.lineDecoder = new LineDecoder();
  },

  // 初始化聊天
  initChat() {
    this.setData({
      messages: [
        {
          id: Date.now(),
          role: 'assistant',
          content: '你好！我是你的AI助手，有什么可以帮助你的吗？',
          timestamp: Date.now(),
        },
      ],
    });
  },

  // 输入框内容变化
  onInputChange(e) {
    this.setData({
      inputText: e.detail.value,
    });
  },

  // 发送消息
  async onSendMessage() {
    const { inputText, isLoading } = this.data;

    if (!inputText.trim() || isLoading) {
      return;
    }

    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    // 创建助手消息占位符
    const assistantMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    this.setData({
      messages: [...this.data.messages, userMessage, assistantMessage],
      inputText: '',
      isLoading: true,
      currentMessageId: assistantMessage.id,
    });

    try {
      await this.callStreamingAPI(inputText.trim(), assistantMessage.id);
    } catch (error) {
      console.error('发送消息失败:', error);
      this.handleChatError(error, assistantMessage.id);
    }
  },

  // 调用流式API
  async callStreamingAPI(userInput, messageId) {
    const messages = this.buildMessagesHistory(userInput);

    try {
      // 创建流式请求配置
      const requestConfig = {
        url: 'https://api.deepseek.com/chat/completions',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sk-af584c7d0bf642df8d6c466734c0875f',
        },
        data: {
          model: 'deepseek-chat',
          messages: messages,
          stream: true,
          max_tokens: 2000,
          temperature: 0.7,
        },
        enableChunked: true,
        timeout: 60000,
      };

      // 发起请求并处理流式响应
      await this.createStreamingRequest(requestConfig, messageId);
    } catch (error) {
      if (error.errMsg === 'request:fail abort') {
        console.log('请求被用户取消');
        return;
      }
      throw error;
    }
  },

  // 创建流式请求
  createStreamingRequest(config, messageId) {
    return new Promise((resolve, reject) => {
      // 使用持久的LineDecoder实例
      const lineDecoder = this.data.lineDecoder;
      let accumulatedContent = '';

      // 发起请求
      const requestTask = wx.request({
        ...config,
        success: res => {
          console.log('请求完成，状态码:', res.statusCode);
          if (res.statusCode !== 200) {
            reject(createErrorObject(res.statusCode, null, { response: res }));
            return;
          }

          // 处理缓冲区中的剩余数据
          const remainingLines = lineDecoder.flush();
          remainingLines.forEach(line => {
            if (line.trim()) {
              const sseMessage = this.parseSSELine(line);
              if (sseMessage) {
                const content = sseMessage.choices?.[0]?.delta?.content;
                if (content) {
                  accumulatedContent += content;
                  this.updateMessageContent(messageId, accumulatedContent);
                }
              }
            }
          });

          resolve();
        },
        fail: error => {
          console.error('请求失败:', error);
          if (error.errMsg === 'request:fail abort') {
            reject({ errMsg: 'request:fail abort' });
          } else {
            reject(createErrorObject('NETWORK_ERROR', error));
          }
        },
      });

      // 保存请求任务
      this.setData({
        currentRequestTask: requestTask,
      });

      // 监听分块数据接收
      requestTask.onChunkReceived(response => {
        try {
          console.log('接收到分块数据，大小:', response.data.byteLength);

          // 确保数据是 ArrayBuffer，然后转换为 Uint8Array
          const uint8Array = new Uint8Array(response.data);

          // 使用 utils/stream/stream.js 中的 LineDecoder 解析行
          const lines = lineDecoder.decode(uint8Array);

          console.log('解析出的行数:', lines.length);

          // 处理解析出的每一行
          lines.forEach(line => {
            console.log('处理行:', line);
            const sseMessage = this.parseSSELine(line);
            if (sseMessage) {
              const content = sseMessage.choices?.[0]?.delta?.content;

              if (content) {
                accumulatedContent += content;
                this.updateMessageContent(messageId, accumulatedContent);
              }

              // 检查是否完成
              if (
                sseMessage.choices?.[0]?.finish_reason ||
                (sseMessage.data && sseMessage.data === '[DONE]')
              ) {
                this.handleStreamComplete(messageId, accumulatedContent);
                resolve();
                return;
              }
            }
          });
        } catch (error) {
          console.error('处理分块数据失败:', error);
          reject(error);
        }
      });

      // 监听请求头接收
      requestTask.onHeadersReceived?.(headers => {
        console.log('接收到响应头:', headers);
      });
    });
  },

  // 解析SSE行数据 - 复用 utils/stream 的逻辑
  parseSSELine(line) {
    if (!line || line.trim() === '') {
      return null;
    }

    // 处理注释行
    if (line.startsWith(':')) {
      return null;
    }

    // 处理数据行
    if (line.startsWith('data: ')) {
      const data = line.slice(6);

      if (data === '[DONE]') {
        return { data: '[DONE]' };
      }

      try {
        const parsed = JSON.parse(data);

        // 检查是否有错误
        if (parsed.error) {
          throw createErrorObject(
            'BUSINESS_ERROR',
            new Error(parsed.error.message || JSON.stringify(parsed.error)),
          );
        }

        if (parsed.err) {
          throw createErrorObject(
            'BUSINESS_ERROR',
            new Error(parsed.err.message || JSON.stringify(parsed.err)),
          );
        }

        return parsed;
      } catch (parseError) {
        console.warn('解析SSE数据失败:', parseError, data);
        return null;
      }
    }

    return null;
  },

  // 创建模拟的ReadableStream用于复用utils/stream逻辑
  createMockReadableStream(chunks) {
    let chunkIndex = 0;

    return {
      getReader() {
        return {
          read() {
            return new Promise(resolve => {
              if (chunkIndex >= chunks.length) {
                resolve({ done: true, value: undefined });
              } else {
                const chunk = chunks[chunkIndex++];
                resolve({ done: false, value: chunk });
              }
            });
          },
          releaseLock() {
            // 释放锁的模拟实现
          },
          cancel() {
            return Promise.resolve();
          },
        };
      },
    };
  },

  // 使用Stream类处理数据（可选的高级用法）
  async processWithStreamClass(chunks, messageId) {
    try {
      // 创建模拟的Response对象
      const mockResponse = {
        body: this.createMockReadableStream(chunks),
        ok: true,
        status: 200,
      };

      // 创建模拟的控制器
      const mockController = {
        abort() {
          console.log('Stream aborted');
        },
      };

      // 使用 utils/stream 中的逻辑处理SSE消息
      let accumulatedContent = '';

      for await (const sse of _iterSSEMessages(mockResponse, mockController)) {
        if (sse.data && sse.data.startsWith('[DONE]')) {
          break;
        }

        if (sse.event === null) {
          let data;
          try {
            data = JSON.parse(sse.data);
          } catch (e) {
            console.error('无法解析消息为JSON:', sse.data);
            continue;
          }

          if (data) {
            if (data.error) {
              throw createErrorObject(
                'BUSINESS_ERROR',
                new Error(data.error.message || JSON.stringify(data.error)),
              );
            }

            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              accumulatedContent += content;
              this.updateMessageContent(messageId, accumulatedContent);
            }

            if (data.choices?.[0]?.finish_reason) {
              this.handleStreamComplete(messageId, accumulatedContent);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream处理失败:', error);
      throw error;
    }
  },

  // 更新消息内容
  updateMessageContent(messageId, content) {
    const messages = this.data.messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, content };
      }
      return msg;
    });

    this.setData({ messages });
  },

  // 处理流完成
  handleStreamComplete(messageId, finalContent) {
    const messages = this.data.messages.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          content: finalContent,
          isStreaming: false,
          timestamp: Date.now(),
        };
      }
      return msg;
    });

    this.setData({
      messages,
      isLoading: false,
      currentMessageId: null,
      currentRequestTask: null,
    });

    console.log('流式响应完成，最终内容长度:', finalContent.length);
  },

  // 构建消息历史
  buildMessagesHistory(currentInput) {
    const systemMessage = {
      role: 'system',
      content: 'You are a helpful assistant.',
    };

    // 获取最近的对话历史（最多10轮）
    const recentMessages = this.data.messages
      .filter(msg => !msg.isStreaming)
      .slice(-20)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

    // 添加当前用户输入
    const userMessage = {
      role: 'user',
      content: currentInput,
    };

    return [systemMessage, ...recentMessages, userMessage];
  },

  // 处理聊天错误
  handleChatError(error, messageId) {
    console.error('聊天错误:', error);

    const errorMessage = error.message || '发送消息失败，请重试';

    // 更新失败的消息
    const messages = this.data.messages.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          content: `❌ ${errorMessage}`,
          isStreaming: false,
          isError: true,
        };
      }
      return msg;
    });

    this.setData({
      messages,
      isLoading: false,
      currentMessageId: null,
      currentRequestTask: null,
    });

    // 显示错误提示
    wx.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 3000,
    });
  },

  // 取消当前请求
  cancelCurrentRequest() {
    const { currentRequestTask } = this.data;

    if (currentRequestTask) {
      currentRequestTask.abort();
      this.setData({
        currentRequestTask: null,
      });
    }

    if (this.data.currentMessageId) {
      this.handleChatError({ message: '用户取消了请求' }, this.data.currentMessageId);
    }
  },

  // 重新生成回答
  async onRegenerateMessage(e) {
    const messageId = e.currentTarget.dataset.messageId;
    const messageIndex = this.data.messages.findIndex(msg => msg.id == messageId);

    if (messageIndex > 0) {
      const userMessage = this.data.messages[messageIndex - 1];
      if (userMessage && userMessage.role === 'user') {
        // 移除当前的助手回复
        const newMessages = this.data.messages.slice(0, messageIndex);
        this.setData({
          messages: newMessages,
          isLoading: true,
        });

        // 创建新的助手消息
        const newAssistantMessage = {
          id: Date.now(),
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isStreaming: true,
        };

        this.setData({
          messages: [...newMessages, newAssistantMessage],
          currentMessageId: newAssistantMessage.id,
        });

        // 重新发送请求
        try {
          await this.callStreamingAPI(userMessage.content, newAssistantMessage.id);
        } catch (error) {
          this.handleChatError(error, newAssistantMessage.id);
        }
      }
    }
  },

  // 清空对话
  onClearChat() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有对话记录吗？',
      success: res => {
        if (res.confirm) {
          this.initChat();
        }
      },
    });
  },

  // 复制消息内容
  onCopyMessage(e) {
    const content = e.currentTarget.dataset.content;

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success',
          duration: 2000,
        });
      },
      fail: error => {
        wx.showToast({
          title: '复制失败',
          icon: 'none',
          duration: 2000,
        });
      },
    });
  },

  // 页面显示时滚动到底部
  onShow() {},

  // 页面卸载时清理
  onUnload() {
    this.cancelCurrentRequest();
  },
});
