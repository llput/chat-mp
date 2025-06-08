// pages/index/index.js
import { StreamProcessor, APIError } from '../../utils/stream/stream';
import { createErrorObject } from '../../utils/stream/errors';
import reportEvent from '../../utils/report-event';
import { EVENT_TYPES } from '../../utils/config';

const app = getApp();

Page({
  data: {
    messages: [],
    inputText: '',
    isLoading: false,
    currentMessageId: null,
    currentRequestId: null,
  },

  onLoad() {
    console.log('聊天页面加载');
    this.initChat();
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

    // 上报发送消息事件
    reportEvent(EVENT_TYPES.USER_SEND_MESSAGE, {
      message_length: inputText.length,
      timestamp: Date.now(),
    });

    try {
      await this.callDeepSeekAPI(inputText.trim(), assistantMessage.id);
    } catch (error) {
      console.error('发送消息失败:', error);
      this.handleChatError(error, assistantMessage.id);
    }
  },

  // 调用DeepSeek API
  async callDeepSeekAPI(userInput, messageId) {
    const messages = this.buildMessagesHistory(userInput);
    const requestId = `req_${Date.now()}`;

    this.setData({
      currentRequestId: requestId,
    });

    try {
      // 使用wx.request发起请求
      const requestTask = wx.request({
        url: 'https://api.deepseek.com/chat/completions',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer -', // 替换为实际的API Key
        },
        data: {
          model: 'deepseek-chat',
          messages: messages,
          stream: true, // 启用流式响应
          max_tokens: 2000,
          temperature: 0.7,
        },
        enableChunked: true, // 启用分块传输
        responseType: 'text',
        success: res => {
          if (res.statusCode === 200) {
            this.handleStreamResponse(res.data, messageId, requestId);
          } else {
            throw createErrorObject(res.statusCode, null, { response: res });
          }
        },
        fail: error => {
          throw createErrorObject('NETWORK_ERROR', error);
        },
      });

      // 保存请求任务，用于取消
      this.currentRequestTask = requestTask;
    } catch (error) {
      console.error('API调用失败:', error);
      throw error;
    }
  },

  // 处理流式响应
  handleStreamResponse(responseData, messageId, requestId) {
    try {
      // 创建流处理器
      const streamProcessor = new StreamProcessor();

      // 模拟流式数据处理
      const lines = responseData.split('\n');
      let accumulatedContent = '';

      lines.forEach(line => {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            this.handleStreamComplete(messageId, accumulatedContent);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';

            if (content) {
              accumulatedContent += content;
              this.updateMessageContent(messageId, accumulatedContent);
            }
          } catch (parseError) {
            console.warn('解析SSE数据失败:', parseError, data);
          }
        }
      });

      // 如果没有检测到流结束标记，手动完成
      if (!responseData.includes('[DONE]')) {
        setTimeout(() => {
          this.handleStreamComplete(messageId, accumulatedContent);
        }, 100);
      }
    } catch (error) {
      console.error('处理流式响应失败:', error);
      this.handleChatError(error, messageId);
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
      currentRequestId: null,
    });

    // 上报生成完成事件
    reportEvent(EVENT_TYPES.GENERATION_COMPLETE, {
      content_length: finalContent.length,
      timestamp: Date.now(),
    });
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
      .slice(-20) // 最多取最近20条消息（10轮对话）
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
      currentRequestId: null,
    });

    // 显示错误提示
    wx.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 3000,
    });

    // 上报错误事件
    reportEvent(EVENT_TYPES.SEND_MESSAGE_ERROR, {
      error_code: error.code || 'UNKNOWN',
      error_message: errorMessage,
      timestamp: Date.now(),
    });
  },

  // 取消当前请求
  cancelCurrentRequest() {
    if (this.currentRequestTask) {
      this.currentRequestTask.abort();
      this.currentRequestTask = null;
    }

    if (this.data.currentMessageId) {
      this.handleChatError({ message: '用户取消了请求' }, this.data.currentMessageId);
    }

    reportEvent(EVENT_TYPES.USER_CANCEL_GENERATION, {
      timestamp: Date.now(),
    });
  },

  // 重新生成回答
  onRegenerateMessage(e) {
    const messageId = e.currentTarget.dataset.messageId;
    const messageIndex = this.data.messages.findIndex(msg => msg.id == messageId);

    if (messageIndex > 0) {
      const userMessage = this.data.messages[messageIndex - 1];
      if (userMessage && userMessage.role === 'user') {
        // 移除当前的助手回复
        const newMessages = this.data.messages.slice(0, messageIndex);
        this.setData({ messages: newMessages });

        // 重新发送请求
        this.callDeepSeekAPI(userMessage.content, Date.now());
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
          reportEvent(EVENT_TYPES.NEW_CHAT_CREATED, {
            timestamp: Date.now(),
          });
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

        reportEvent(EVENT_TYPES.MESSAGE_COPY_SUCCESS, {
          content_length: content.length,
          timestamp: Date.now(),
        });
      },
      fail: error => {
        wx.showToast({
          title: '复制失败',
          icon: 'none',
          duration: 2000,
        });

        reportEvent(EVENT_TYPES.MESSAGE_COPY_FAILED, {
          error: error.errMsg,
          timestamp: Date.now(),
        });
      },
    });
  },

  // 自动滚动到底部
  scrollToBottom() {
    if (this.data.messages.length > 0) {
      const lastMessage = this.data.messages[this.data.messages.length - 1];
      this.setData({
        scrollIntoView: `msg-${lastMessage.id}`,
      });
    }
  },

  // 页面显示时滚动到底部
  onShow() {
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  },

  // 页面卸载时清理
  onUnload() {
    this.cancelCurrentRequest();
  },
});
