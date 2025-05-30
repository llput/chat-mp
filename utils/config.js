/**
 * 应用配置文件
 * 集中管理所有API和环境配置
 */

// 当前环境配置
const ENV_TYPE = 'development'; // 可选值: 'development', 'testing', 'production'

// 环境基础URL配置
const ENV_BASE_URLS = {
  development: 'https://tc.tencentdi.com',
  testing: 'https://tc.tencentdi.com',
  production: 'https://tc.tencentdi.com',
};

// 环境API路径前缀配置
const API_PATH_PREFIX = {
  development: '/llm-internet-access',
  testing: '/llm-internet-access',
  production: '/llm-internet-access-prod',
};

// 获取当前环境的基础URL和API前缀
const BASE_URL = ENV_BASE_URLS[ENV_TYPE];
const CURRENT_API_PREFIX = API_PATH_PREFIX[ENV_TYPE];

// API路径相对部分配置（不包含环境前缀）
const API_RELATIVE_PATHS = {
  // 聊天机器人相关
  CHATBOT: '/chain/chatbot/completions',
  CHATBOT_FEEDBACK: '/chain/chatbot/feedback.do',
  CHATBOT_GUESS_QUESTIONS: '/chain/chatbot/guessQuestions.do',
  CHATBOT_SESSION_DIALOGS: '/chain/chatbot/usersession/sessionDialogs.do',
  CHATBOT_SESSION_LIST: '/chain/chatbot/usersession/list.do',
  CHATBOT_USER_INTERRUPT: '/chain/chatbot/userInterrupt.do',

  CHATBOT_RESUME_DIALOG: '/chain/chatbot/resumeDialog.do',
  CHATBOT_MINIGRAM_QUESTIONS: '/chain/chatbot/minigramQuestions.do',
  CHATBOT_SHARE_DIALOGS: '/chain/chatbot/usersession/shareDialogs.do',

  AUTH_LOGIN: '/auth/login',
  CHATBOT_SUBSCRIBE_POLISH: '/chain/chatbot/subscribe/polish',
  CHATBOT_SUBSCRIBE_LIST: '/chain/chatbot/subscribe/list',
  CHATBOT_SUBSCRIBE_ADD: '/chain/chatbot/subscribe/add',
  CHATBOT_SUBSCRIBE_DETAIL: '/chain/chatbot/subscribe/detail',
  CHATBOT_SUBSCRIBE_UPDATE: '/chain/chatbot/subscribe/update',
  CHATBOT_SUBSCRIBE_DELETE: '/chain/chatbot/subscribe/delete',
  CHATBOT_SUBSCRIBE_PUSH_STATE_UPDATE: '/chain/chatbot/subscribe/pushStatusUpdate',
  CHATBOT_SUBSCRIBE_READ_STATE_UPDATE: '/chain/chatbot/subscribe/readStatusUpdate',
  CHATBOT_GENERATE_IMAGE: '/chain/chatbot/minigram/generateImage',
};

// API路径配置（包含环境前缀）
const API_PATHS = {};

// 完整API URL配置
const API_URLS = {};

// 动态生成API路径和完整URL
Object.keys(API_RELATIVE_PATHS).forEach(key => {
  API_PATHS[key] = `${CURRENT_API_PREFIX}${API_RELATIVE_PATHS[key]}`;
  API_URLS[key] = `${BASE_URL}${API_PATHS[key]}`;
});

// 模型配置
const MODELS = {
  DEFAULT: 'LILY',
  AVAILABLE: ['LILY', 'gpt-4o', 'claude-3-5-sonnet-20240620', 'moonshot-v1-32k'],
  DISPLAY_NAMES: {
    LILY: 'LILY',
    'gpt-4o': 'gpt4o',
    'claude-3-5-sonnet-20240620': 'claude3.5',
    'moonshot-v1-32k': 'kimi',
  },
};

// 请求配置
const REQUEST_CONFIG = {
  TIMEOUT: 300000, // 5分钟
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    'Accept-Charset': 'utf-8',
  },
};

// 上报事件类型
const EVENT_TYPES = {
  PAGE_LOADED: 'page_loaded',
  PAGE_SHOWN: 'page_shown',
  PAGE_UNLOADED: 'page_unloaded',
  PAGE_HIDDEN: 'page_hidden',
  USER_LOGIN_SUCCESS: 'user_login_success',
  USER_LOGIN_FAILED: 'user_login_failed',
  USER_SEND_MESSAGE: 'user_send_message',
  GENERATION_COMPLETE: 'generation_complete',
  USER_CANCEL_GENERATION: 'user_cancel_generation',
  REQUEST_START: 'request_start',
  REQUEST_FAILED: 'request_failed',
  FIRST_CHUNK_RECEIVED: 'first_chunk_received',
  GUESS_QUESTIONS_REQUEST: 'guess_questions_request',
  GUESS_QUESTIONS_SUCCESS: 'guess_questions_success',
  GUESS_QUESTIONS_FAILED: 'guess_questions_failed',
  GUESS_QUESTION_CLICKED: 'guess_question_clicked',
  REASONING_MODE_TOGGLED: 'reasoning_mode_toggled',
  RAG_MODE_TOGGLED: 'rag_mode_toggled',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  SESSION_SHARED_MESSAGE: 'session_shared_message',
  SESSION_SHARED_TIMELINE: 'session_shared_timeline',
  NEW_CHAT_CREATED: 'new_chat_created',
  HISTORY_LOADING_STARTED: 'history_loading_started',
  HISTORY_LOADING_SUCCESS: 'history_loading_success',
  HISTORY_LOADING_FAILED: 'history_loading_failed',
  AUTH_FAILED: 'auth_failed',
  CREATE_ASSISTANT_MESSAGE: 'create_assistant_message',
  SEND_MESSAGE_ERROR: 'send_message_error',
  REQUEST_NETWORK_ERROR: 'request_network_error',
  PLUGIN_STATUS_UPDATE: 'plugin_status_update',
  MODEL_INFO: 'model_info',
  REFERENCES_RECEIVED: 'references_received',
  STREAM_PROCESSING_ERROR: 'stream_processing_error',
  RETRY_REQUEST_FAILED: 'retry_request_failed',
  CHAT_REQUEST_FAILED: 'chat_request_failed',
  REGENERATE_REQUESTED: 'regenerate_requested',
  FEEDBACK_LIKE_CLICKED: 'feedback_like_clicked',
  FEEDBACK_DISLIKE_CLICKED: 'feedback_dislike_clicked',
  FEEDBACK_OPTION_TOGGLED: 'feedback_option_toggled',
  FEEDBACK_DETAIL_INPUT: 'feedback_detail_input',
  FEEDBACK_INPUT_FOCUSED: 'feedback_input_focused',
  FEEDBACK_INPUT_BLURRED: 'feedback_input_blurred',
  FEEDBACK_MODAL_CLOSED: 'feedback_modal_closed',
  FEEDBACK_MODAL_SHOWN: 'feedback_modal_shown',

  // 复制相关埋点类型
  MESSAGE_COPY_CLICKED: 'message_copy_clicked',
  MESSAGE_COPY_SUCCESS: 'message_copy_success',
  MESSAGE_COPY_FAILED: 'message_copy_failed',
  EXCERPT_COPY_INITIATED: 'excerpt_copy_initiated',
  EXCERPT_COPY_MODAL_CLOSED: 'excerpt_copy_modal_closed',
  REFERENCE_COPY_CLICKED: 'reference_copy_clicked',
  REFERENCE_COPY_SUCCESS: 'reference_copy_success',
  REFERENCE_COPY_FAILED: 'reference_copy_failed',

  // 重试相关埋点类型
  REGENERATE_VALIDATION_FAILED: 'regenerate_validation_failed',
  REGENERATE_STARTED: 'regenerate_started',
  REGENERATE_FAILED: 'regenerate_failed',

  // 历史记录相关埋点类型
  DROPDOWN_TOGGLED: 'dropdown_toggled',
  HISTORY_NAVIGATION_CLICKED: 'history_navigation_clicked',

  // 历史记录页面相关埋点类型
  HISTORY_PAGE_LOADED: 'history_page_loaded',
  HISTORY_PAGE_SHOWN: 'history_page_shown',
  HISTORY_PAGE_HIDDEN: 'history_page_hidden',
  HISTORY_PAGE_UNLOADED: 'history_page_unloaded',
  HISTORY_SESSIONS_FETCH_STARTED: 'history_sessions_fetch_started',
  HISTORY_SESSIONS_FETCH_SUCCESS: 'history_sessions_fetch_success',
  HISTORY_SESSIONS_FETCH_FAILED: 'history_sessions_fetch_failed',
  HISTORY_SESSION_CLICKED: 'history_session_clicked',
  HISTORY_SESSION_NAVIGATION_FAILED: 'history_session_navigation_failed',

  REFERENCES_TOGGLED: 'references_toggled',
  REASONING_TOGGLED: 'reasoning_toggled',

  // network error
  APP_LAUNCHED: 'app_launched',
  NETWORK_STATUS_CHANGED: 'network_status_changed',
  NETWORK_DISCONNECTED: 'network_disconnected',
  NETWORK_RECONNECTED: 'network_reconnected',
  WEAK_NETWORK_STATUS_CHANGED: 'weak_network_status_changed',
  ENTERED_WEAK_NETWORK: 'entered_weak_network',
  LEFT_WEAK_NETWORK: 'left_weak_network',
  WEAK_NETWORK_DETECTION_UNSUPPORTED: 'weak_network_detection_unsupported',
  INITIAL_NETWORK_STATUS: 'initial_network_status',
  AUTH_CHECK_FAILED: 'auth_check_failed',
  LOGIN_STARTED: 'login_started',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGIN_ERROR: 'login_error',
  APP_HIDDEN: 'app_hidden',
  APP_SHOWN: 'app_shown',
  UPDATE_CHECK_STARTED: 'update_check_started',
  UPDATE_CHECK_RESULT: 'update_check_result',
  UPDATE_PACKAGE_READY: 'update_package_ready',
  UPDATE_PACKAGE_FAILED: 'update_package_failed',
  UPDATE_RESTART_CONFIRMED: 'update_restart_confirmed',
  UPDATE_FAILED_ACKNOWLEDGED: 'update_failed_acknowledged',
};

const STREAM_EVENT_TYPES = {
  STREAM_CHUNK_RECEIVED: 'stream_chunk_received',
  STREAM_PROCESSING_ERROR: 'stream_processing_error',
  STREAM_PLUGIN_EVENT: 'stream_plugin_event',
  STREAM_PARSE_ERROR: 'stream_parse_error',
  STREAM_DECODE_ERROR: 'stream_decode_error',
  STREAM_CLOSED: 'stream_closed',
  STREAM_FIRST_CHUNK: 'stream_first_chunk',
  STREAM_REFERENCES_RECEIVED: 'stream_references_received',
  UNEXPECTED_CHUNK_TYPE: 'unexpected_chunk_type',
  STREAM_TIMEOUT: 'stream_timeout',
};

// 反馈选项配置
const FEEDBACK_OPTIONS = {
  LIKE: [
    { text: '准确有效', selected: false },
    { text: '内容全面', selected: false },
    { text: '分析有理有据', selected: false },
  ],
  DISLIKE: [
    { text: 'UI问题', selected: false },
    { text: '不喜欢这种风格', selected: false },
    { text: '不完全正确', selected: false },
    { text: '没有完全按照指令', selected: false },
    { text: '角标引用有误', selected: false },
    { text: '内容重复输出', selected: false },
    { text: '生成格式错乱', selected: false },
    { text: '其它', selected: false },
  ],
};

// 导出所有配置
export {
  ENV_TYPE,
  BASE_URL,
  API_PATH_PREFIX,
  CURRENT_API_PREFIX,
  API_RELATIVE_PATHS,
  API_PATHS,
  API_URLS,
  MODELS,
  REQUEST_CONFIG,
  EVENT_TYPES,
  FEEDBACK_OPTIONS,
  STREAM_EVENT_TYPES,
};

// 默认导出
export default {
  ENV_TYPE,
  BASE_URL,
  API_PATH_PREFIX,
  CURRENT_API_PREFIX,
  API_RELATIVE_PATHS,
  API_PATHS,
  API_URLS,
  MODELS,
  REQUEST_CONFIG,
  EVENT_TYPES,
  FEEDBACK_OPTIONS,
  STREAM_EVENT_TYPES,

  // 辅助方法
  getEnvBaseUrl: env => ENV_BASE_URLS[env] || ENV_BASE_URLS.production,
  getApiPrefix: env => API_PATH_PREFIX[env] || API_PATH_PREFIX.production,
  getFullUrl: (apiPath, env = ENV_TYPE) => {
    const baseUrl = ENV_BASE_URLS[env] || ENV_BASE_URLS.production;
    const prefix = API_PATH_PREFIX[env] || API_PATH_PREFIX.production;

    // 检查传入的apiPath是否已经包含前缀
    if (
      apiPath.startsWith('/llm-internet-access') ||
      apiPath.startsWith('/llm-internet-access-prod')
    ) {
      return `${baseUrl}${apiPath}`;
    }

    // 添加适当的前缀
    return `${baseUrl}${prefix}${apiPath}`;
  },
  isProduction: () => ENV_TYPE === 'production',
  isDevelopment: () => ENV_TYPE === 'development',
  isTesting: () => ENV_TYPE === 'testing',
};
