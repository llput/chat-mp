import { API_URLS } from './config';

const TOKEN_KEY = 'access_token';
const EXPIRES_KEY = 'token_expires_at';
const AUTH_STATUS_KEY = 'auth_status';
const USER_INFO_KEY = 'user_info';
const OPEN_ID_KEY = 'open_id'; // New constant for openId storage
const REFRESH_THRESHOLD = 300; // 5 minutes

class AuthManager {
  static get isAuthorized() {
    return wx.getStorageSync(AUTH_STATUS_KEY) || false;
  }

  static get userInfo() {
    return wx.getStorageSync(USER_INFO_KEY) || null;
  }

  static get openId() {
    return wx.getStorageSync(OPEN_ID_KEY) || null;
  }

  static setAuthData(accessToken, expiresIn, userInfo, openId) {
    const expiresAt = Date.now() + expiresIn * 1000;
    wx.setStorageSync(TOKEN_KEY, accessToken);
    wx.setStorageSync(EXPIRES_KEY, expiresAt);
    wx.setStorageSync(AUTH_STATUS_KEY, true);

    if (userInfo) {
      // Store openId in both userInfo and separate storage
      const updatedUserInfo = {
        ...userInfo,
        openId,
      };
      wx.setStorageSync(USER_INFO_KEY, updatedUserInfo);
      wx.setStorageSync(OPEN_ID_KEY, openId);

      // Update app.globalData
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.userInfo = updatedUserInfo;
      }
    }
  }

  static getToken() {
    return wx.getStorageSync(TOKEN_KEY);
  }

  static isTokenExpired() {
    const expiresAt = wx.getStorageSync(EXPIRES_KEY);
    if (!expiresAt) return true;
    return Date.now() + REFRESH_THRESHOLD * 1000 >= expiresAt;
  }

  static clearAuth() {
    wx.removeStorageSync(TOKEN_KEY);
    wx.removeStorageSync(EXPIRES_KEY);
    wx.removeStorageSync(AUTH_STATUS_KEY);
    wx.removeStorageSync(USER_INFO_KEY);
    wx.removeStorageSync(OPEN_ID_KEY);

    // Clear app.globalData.userInfo
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.userInfo = null;
    }
  }

  static async login(userInfo) {
    try {
      const loginResult = await wx.login();

      const res = await wx.pro.request({
        // url: 'https://tc.tencentdi.com/llm-internet-access-prod/auth/login',
        url: API_URLS.AUTH_LOGIN,
        method: 'POST',
        data: {
          code: loginResult.code,
          avatarUrl: userInfo.avatarUrl,
          nickName: userInfo.nickName,
          gender: userInfo.gender,
          channel: 'mini_program',
        },
      });

      console.log('Login response:', res.data);

      if (Number(res.data.code) === 200) {
        const { accessToken, expiresIn, openId } = res.data.data;
        this.setAuthData(accessToken, expiresIn, userInfo, openId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  static async refreshToken() {
    const oldToken = this.getToken();
    if (!oldToken) {
      throw new Error('No token to refresh');
    }

    try {
      const res = await wx.pro.request({
        url: 'https://tc.tencentdi.com/llm-internet-access-prod/auth/refresh-token',
        method: 'POST',
        header: {
          Authorization: `Bearer ${oldToken}`,
        },
      });

      if (res.data.code === 0) {
        const { accessToken, expiresIn } = res.data.data;
        // Preserve the existing openId when refreshing token
        const currentUserInfo = this.userInfo;
        const currentOpenId = this.openId;
        this.setAuthData(accessToken, expiresIn, currentUserInfo, currentOpenId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Refresh token failed:', error);
      return false;
    }
  }

  static async checkAuthStatus() {
    const isAuth = this.isAuthorized;
    const token = this.getToken();
    const { userInfo } = this;
    const { openId } = this;

    if (!isAuth || !token || !userInfo || !openId) {
      return {
        isAuthorized: false,
        userInfo: null,
      };
    }

    if (this.isTokenExpired()) {
      const refreshSuccess = await this.refreshToken();
      if (!refreshSuccess) {
        this.clearAuth();
        return {
          isAuthorized: false,
          userInfo: null,
        };
      }
    }

    return {
      isAuthorized: true,
      userInfo,
    };
  }
}

export default AuthManager;
