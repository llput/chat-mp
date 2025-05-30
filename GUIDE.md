# 微信小程序开发规范详解

## 目录

1. [代码结构规范](#代码结构规范)
2. [命名规范](#命名规范)
3. [WXML 视图层规范](#wxml视图层规范)
4. [API 调用规范](#api调用规范)
5. [数据绑定规范](#数据绑定规范)
6. [性能优化规范](#性能优化规范)
7. [代码质量规范](#代码质量规范)
8. [最佳实践](#最佳实践)

---

## 代码结构规范

### 页面文件结构

**规则**: 页面文件应遵循一致的结构：导入 -> 常量 -> Page 定义 -> 数据 -> 生命周期函数 -> 事件处理函数

**说明**: 良好的文件结构可以提高代码可读性和维护性。Page 对象内的属性应遵循特定顺序，方便团队成员快速定位代码位置。

**正确示例**:

```javascript
// 导入部分
import request from '../utils/request';
import { formatTime } from '../utils/util';
import { API_URL } from '../config/api';

// 常量定义
const DEFAULT_LIMIT = 10;
const PAGE_TITLE = '首页';

// Page对象定义，按规范顺序排列属性
Page({
  // 数据定义
  data: {
    list: [],
    loading: false,
    page: 1,
    hasMore: true,
  },

  // 生命周期函数，按执行顺序排列
  onLoad(options) {
    this.fetchData(options.id);
  },

  onShow() {
    wx.setNavigationBarTitle({
      title: PAGE_TITLE,
    });
  },

  onReady() {
    // 页面首次渲染完成后执行
  },

  onHide() {
    // 页面隐藏时执行
  },

  onUnload() {
    // 清理定时器等资源
    if (this.timer) {
      clearTimeout(this.timer);
    }
  },

  onPullDownRefresh() {
    this.refreshData();
  },

  onReachBottom() {
    this.loadMoreData();
  },

  // 事件处理函数
  handleItemTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
    });
  },

  // 业务方法
  async fetchData(id) {
    try {
      this.setData({ loading: true });
      const result = await request.get(`/api/items/${id}`);
      this.setData({
        list: result.data,
        loading: false,
      });
    } catch (err) {
      wx.showToast({
        title: '数据加载失败',
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },
});
```

### 导入顺序规则

**规则**: 导入应按照以下顺序：第三方库 -> 工具函数 -> 配置 -> 服务 -> 组件

**说明**: 统一的导入顺序使代码更加整洁，遵循从外到内、从通用到特定的原则。

**正确示例**:

```javascript
// 第三方库
import regeneratorRuntime from 'regenerator-runtime';
import dayjs from '@/lib/dayjs';

// 工具函数
import { debounce, throttle } from '../utils/performance';
import { formatPrice, formatDate } from '../utils/formatter';

// 配置
import { API_ENDPOINTS, APP_CONFIG } from '../config/index';

// 服务
import userService from '../services/userService';
import paymentService from '../services/paymentService';

// 组件
import Dialog from '../components/dialog/dialog';
```

### 组件文件结构

**规则**: 组件文件应遵循一致的结构

**说明**: 与页面文件类似，组件文件也应该有清晰的属性顺序，遵循先声明后使用的原则。

**正确示例**:

```javascript
Component({
  // 组件的对外属性
  properties: {
    title: {
      type: String,
      value: '',
    },
    showIcon: {
      type: Boolean,
      value: false,
    },
  },

  // 组件选项
  options: {
    styleIsolation: 'isolated',
    multipleSlots: true,
  },

  // 组件外部样式类
  externalClasses: ['custom-class'],

  // 组件的内部数据
  data: {
    active: false,
  },

  // 组件生命周期
  lifetimes: {
    attached() {
      this.init();
    },
    detached() {
      // 资源清理
    },
  },

  // 组件所在页面的生命周期
  pageLifetimes: {
    show() {
      // 页面被展示时执行
    },
    hide() {
      // 页面被隐藏时执行
    },
  },

  // 数据监听器
  observers: {
    title: function (title) {
      this.updateTitle(title);
    },
  },

  // 组件方法
  methods: {
    init() {
      // 初始化逻辑
    },

    handleTap() {
      this.setData({
        active: !this.data.active,
      });

      this.triggerEvent('tap', {
        active: this.data.active,
      });
    },
  },
});
```

---

## 命名规范

### 变量命名规范

**规则**: 变量命名应使用驼峰式(camelCase)

**说明**: 遵循 JavaScript 社区的通用命名规范，变量名应描述其用途，且首字母小写。

**正确示例**:

```javascript
const userName = 'John';
let pageIndex = 1;
let isLoading = false;
```

**错误示例**:

```javascript
const UserName = 'John'; // 首字母大写，不符合变量命名规范
let page_index = 1; // 使用下划线分隔，不符合驼峰命名
let loading = false; // 名称不够描述性
```

### 常量命名规范

**规则**: 常量应使用全大写下划线分隔(UPPER_SNAKE_CASE)

**说明**: 常量值在程序运行期间不应更改，使用全大写命名可以清晰地将其与变量区分开。

**正确示例**:

```javascript
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;
```

**错误示例**:

```javascript
const apiBaseUrl = 'https://api.example.com'; // 应使用全大写
const maxRetryCount = 3; // 应使用全大写
```

### 异步函数命名规范

**规则**: 异步函数应使用 async 前缀或 fetch/load/get 等动词开头

**说明**: 通过命名立即表明函数是异步的，方便使用者了解函数的执行特性。

**正确示例**:

```javascript
async function fetchUserInfo() {
  /* ... */
}
async function loadPageData() {
  /* ... */
}
async function getUserProfile() {
  /* ... */
}
async function asyncUpdateStatus() {
  /* ... */
}
```

**错误示例**:

```javascript
async function userInfo() {
  /* ... */
} // 缺少适当前缀
async function pageData() {
  /* ... */
} // 缺少适当前缀
async function update() {
  /* ... */
} // 不明确是异步操作
```

### 事件处理函数命名规范

**规则**: 事件处理函数应使用 handle/on 前缀

**说明**: 清晰地表明函数是用于处理事件的，并暗示该函数会被其他函数或组件调用。

**正确示例**:

```javascript
function handleSubmit(e) {
  /* ... */
}
function onTapButton(e) {
  /* ... */
}
function handleImageLoad(e) {
  /* ... */
}
```

**错误示例**:

```javascript
function submit(e) {
  /* ... */
} // 缺少handle/on前缀
function tapButton(e) {
  /* ... */
} // 缺少handle/on前缀
function imageLoad(e) {
  /* ... */
} // 缺少handle/on前缀
```

### 自定义事件命名规范

**规则**: 自定义事件名应使用 kebab-case

**说明**: 视图层使用 kebab-case 命名事件与 HTML 规范保持一致，提高代码的可读性。

**正确示例**:

```javascript
// 在组件中触发事件
this.triggerEvent('item-tap', { id: 123 });
this.triggerEvent('load-more', { page: 2 });
this.triggerEvent('value-change', { value: newValue });
```

**错误示例**:

```javascript
// 错误的事件命名
this.triggerEvent('itemTap', { id: 123 }); // 应使用kebab-case
this.triggerEvent('LoadMore', { page: 2 }); // 首字母大写且使用驼峰
```

### 视图层类名命名规范

**规则**: WXML 中的 class 名应使用 kebab-case

**说明**: 与 HTML 标准保持一致，使用连字符分隔单词，全部小写。

**正确示例**:

```html
<view class="user-card">
  <view class="user-avatar-container">
    <image class="user-avatar" src="{{avatarUrl}}"></image>
  </view>
  <view class="user-info">
    <text class="user-name">{{userName}}</text>
    <text class="user-description">{{description}}</text>
  </view>
</view>
```

**错误示例**:

```html
<view class="userCard">
  <!-- 应使用user-card -->
  <view class="avatarContainer">
    <!-- 应使用avatar-container -->
    <image class="userAvatar" src="{{avatarUrl}}"></image>
    <!-- 应使用user-avatar -->
  </view>
</view>
```

---

## WXML 视图层规范

### 必须指定 wx:key

**规则**: 使用 wx:for 时必须指定 wx:key 以提高性能

**说明**: wx:key 帮助微信小程序框架跟踪哪些项目改变，有助于提高列表渲染性能和重用 DOM 元素。

**正确示例**:

```html
<view wx:for="{{list}}" wx:key="id"> {{item.name}} </view>

<!-- 当列表项本身是字符串或数字时 -->
<view wx:for="{{simpleList}}" wx:key="*this"> {{item}} </view>
```

**错误示例**:

```html
<view wx:for="{{list}}"> {{item.name}} </view>
```

### 避免 wx:if 与 wx:for 同用

**规则**: wx:if 与 wx:for 不应用于同一元素

**说明**: 当 wx:if 和 wx:for 同时存在时，wx:for 优先级高，这可能导致不必要的遍历过程浪费性能。

**正确示例**:

```html
<!-- 使用block包装wx:for，在内部元素使用wx:if -->
<block wx:for="{{list}}" wx:key="id">
  <view wx:if="{{item.visible}}"> {{item.name}} </view>
</block>

<!-- 或预先过滤数据 -->
<view wx:for="{{filteredList}}" wx:key="id"> {{item.name}} </view>
```

**错误示例**:

```html
<view wx:for="{{list}}" wx:if="{{item.visible}}" wx:key="id"> {{item.name}} </view>
```

### 使用 wx:for-item 自定义变量名

**规则**: 当嵌套使用 wx:for 时应自定义 item 名称

**说明**: 嵌套循环中，内外层默认都使用 item 作为迭代变量，容易引起混淆和错误。

**正确示例**:

```html
<view wx:for="{{departments}}" wx:for-item="department" wx:key="id">
  <view>部门：{{department.name}}</view>
  <view wx:for="{{department.employees}}" wx:for-item="employee" wx:key="id">
    员工：{{employee.name}}
  </view>
</view>
```

**错误示例**:

```html
<view wx:for="{{departments}}" wx:key="id">
  <view>部门：{{item.name}}</view>
  <view wx:for="{{item.employees}}" wx:key="id">
    <!-- 内层的item会覆盖外层的item，可能导致错误 -->
    员工：{{item.name}}
  </view>
</view>
```

### 使用 wx:for-index 自定义索引名

**规则**: 当嵌套使用 wx:for 时应自定义 index 名称

**说明**: 类似于 item 问题，嵌套循环中的索引也应当自定义命名，避免命名冲突。

**正确示例**:

```html
<view wx:for="{{list}}" wx:for-index="outerIndex" wx:key="id">
  <view wx:for="{{item.subItems}}" wx:for-index="innerIndex" wx:key="id">
    外层索引：{{outerIndex}}，内层索引：{{innerIndex}}
  </view>
</view>
```

**错误示例**:

```html
<view wx:for="{{list}}" wx:key="id">
  <view wx:for="{{item.subItems}}" wx:key="id">
    <!-- index会被内层循环覆盖 -->
    外层索引：{{index}}，内层索引：{{index}}
  </view>
</view>
```

### 避免滥用 scroll-view

**规则**: 不要在 scroll-view 中嵌套 scroll-view

**说明**: 嵌套使用 scroll-view 会导致滚动行为异常和性能问题。

**正确示例**:

```html
<!-- 分离不同方向的scroll-view -->
<scroll-view scroll-y class="vertical-scroll">
  <view class="content">
    <!-- 内容 -->
  </view>
</scroll-view>

<scroll-view scroll-x class="horizontal-scroll">
  <view class="content">
    <!-- 内容 -->
  </view>
</scroll-view>
```

**错误示例**:

```html
<scroll-view scroll-y class="vertical-scroll">
  <view class="content">
    <scroll-view scroll-x class="horizontal-scroll">
      <!-- 内容 -->
    </scroll-view>
  </view>
</scroll-view>
```

### 推荐使用 catchtap 代替 bindtap

**规则**: 事件冒泡可能导致意外行为，推荐使用 catchtap

**说明**: catchtap 会阻止事件冒泡，避免父元素也响应点击事件，防止多次触发或触发不应响应的事件。

**正确示例**:

```html
<view class="outer">
  <view class="inner" catchtap="handleInnerTap"> 点击内部 </view>
</view>
```

**错误示例**:

```html
<view class="outer" bindtap="handleOuterTap">
  <view class="inner" bindtap="handleInnerTap">
    <!-- 点击内部会同时触发handleInnerTap和handleOuterTap -->
    点击内部
  </view>
</view>
```

### 图片使用懒加载

**规则**: 图片应使用懒加载提高性能

**说明**: 懒加载可以减少初始加载时间，提高页面打开速度，特别是对于有多张图片的长列表页面。

**正确示例**:

```html
<image lazy-load="{{true}}" src="{{imageUrl}}" mode="aspectFill"></image>
```

**错误示例**:

```html
<image src="{{imageUrl}}" mode="aspectFill"></image>
```

### 按钮使用 type 和 size

**规则**: 按钮应指定类型和大小

**说明**: 明确指定按钮类型和大小，可以提高 UI 一致性和用户体验。

**正确示例**:

```html
<button type="primary" size="mini" bindtap="handleSubmit">提交</button>
<button type="default" size="mini" bindtap="handleCancel">取消</button>
```

**错误示例**:

```html
<button bindtap="handleSubmit">提交</button>
```

### 表单项添加 placeholder

**规则**: 输入框应添加 placeholder

**说明**: placeholder 提示用户应输入的内容类型，提高表单的可用性。

**正确示例**:

```html
<input placeholder="请输入用户名" value="{{username}}" />
<textarea placeholder="请输入留言内容" value="{{message}}"></textarea>
```

**错误示例**:

```html
<input value="{{username}}" /> <textarea value="{{message}}"></textarea>
```

### 使用 slot 增强组件可定制性

**规则**: 复杂组件应提供 slot 插槽

**说明**: 插槽可以增强组件的灵活性和复用性，允许父组件注入自定义内容。

**正确示例**:

```html
<!-- 组件定义 -->
<view class="card">
  <view class="card-header">
    <slot name="header"></slot>
  </view>
  <view class="card-content">
    <slot></slot>
  </view>
  <view class="card-footer">
    <slot name="footer"></slot>
  </view>
</view>

<!-- 组件使用 -->
<my-card>
  <view slot="header">自定义标题</view>
  <view>主要内容</view>
  <view slot="footer">自定义底部</view>
</my-card>
```

### 条件渲染使用 block

**规则**: 多元素条件渲染应使用 block

**说明**: block 是一个不会渲染的容器，可以用于包裹多个元素进行统一条件渲染，避免额外嵌套。

**正确示例**:

```html
<block wx:if="{{isLoggedIn}}">
  <view class="welcome">欢迎回来，{{username}}</view>
  <view class="last-login">上次登录：{{lastLoginTime}}</view>
</block>
<block wx:else>
  <view class="login-tip">请先登录</view>
  <button bindtap="handleLogin">登录</button>
</block>
```

**错误示例**:

```html
<view wx:if="{{isLoggedIn}}" class="welcome">欢迎回来，{{username}}</view>
<view wx:if="{{isLoggedIn}}" class="last-login">上次登录：{{lastLoginTime}}</view>
<view wx:if="{{!isLoggedIn}}" class="login-tip">请先登录</view>
<button wx:if="{{!isLoggedIn}}" bindtap="handleLogin">登录</button>
```

### 空状态处理

**规则**: 列表应处理空状态

**说明**: 良好的空状态处理可以提升用户体验，明确告知用户当前无数据的情况。

**正确示例**:

```html
<block wx:if="{{list.length > 0}}">
  <view wx:for="{{list}}" wx:key="id" class="list-item"> {{item.name}} </view>
</block>
<view wx:else class="empty-state">
  <image src="/images/empty.png" mode="heightFix" class="empty-image"></image>
  <text class="empty-text">暂无数据</text>
</view>
```

**错误示例**:

```html
<view wx:for="{{list}}" wx:key="id" class="list-item"> {{item.name}} </view>
<!-- 当list为空时，界面上什么都不显示，用户体验不佳 -->
```

### 使用 hover-class

**规则**: 可点击元素应有点击反馈

**说明**: 点击反馈可以提供良好的用户交互体验，让用户知道元素是可点击的。

**正确示例**:

```html
<view hover-class="hover-class" hover-stay-time="100" catchtap="handleTap"> 点击我 </view>

<!-- 在WXSS中定义hover-class样式 -->
<!--
.hover-class {
  opacity: 0.8;
  background-color: #f0f0f0;
}
-->
```

**错误示例**:

```html
<view catchtap="handleTap"> 点击我 </view>
<!-- 缺少视觉反馈 -->
```

### 使用 wxs 优化

**规则**: 复杂表达式应使用 wxs

**说明**: WXS 可以在视图层直接运行，减少逻辑层和视图层的通信，优化性能。

**正确示例**:

```html
<!-- wxs文件 format.wxs -->
<!--
module.exports = {
  formatPrice: function(price) {
    return '¥' + price.toFixed(2);
  },
  formatDate: function(timestamp) {
    var date = getDate(timestamp);
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  }
};
-->

<!-- 页面中使用 -->
<wxs src="../../utils/format.wxs" module="format" />

<view class="price">{{format.formatPrice(product.price)}}</view>
<view class="date">{{format.formatDate(order.createTime)}}</view>
```

**错误示例**:

```html
<!-- 在WXML中使用复杂表达式 -->
<view class="price">¥{{product.price.toFixed(2)}}</view>
<view class="date"
  >{{order.createTime.getFullYear()}}-{{order.createTime.getMonth() +
  1}}-{{order.createTime.getDate()}}</view
>
```

---

## API 调用规范

### 微信小程序 API 调用方式

**规则**: 推荐使用 Promise 封装的 API 调用方式

**说明**: Promise 风格的 API 调用可以简化异步代码，避免回调地狱，提高代码可读性。

**正确示例**:

```javascript
// 使用Promise封装
import { wxPromise } from '../utils/wx-promise';

// 调用方式
async function fetchData() {
  try {
    const res = await wxPromise.request({
      url: 'https://api.example.com/data',
      method: 'GET',
    });

    // 处理成功结果
    return res.data;
  } catch (err) {
    // 错误处理
    wx.showToast({
      title: '请求失败',
      icon: 'none',
    });
  }
}
```

**错误示例**:

```javascript
// 回调式API调用
function fetchData() {
  wx.request({
    url: 'https://api.example.com/data',
    method: 'GET',
    success: function (res) {
      // 处理成功结果
    },
    fail: function (err) {
      // 错误处理
    },
  });
}
```

### API 调用错误处理

**规则**: wx.api 调用应包含完整的错误处理

**说明**: 完整的错误处理可以提高应用的稳定性和用户体验，及时处理异常情况。

**正确示例**:

```javascript
wx.request({
  url: 'https://api.example.com/data',
  success: function (res) {
    // 处理成功响应
  },
  fail: function (err) {
    // 错误处理
    console.error('请求失败:', err);
    wx.showToast({
      title: '网络错误，请重试',
      icon: 'none',
    });
  },
  complete: function () {
    // 无论成功失败都会执行
    wx.hideLoading();
  },
});
```

**错误示例**:

```javascript
wx.request({
  url: 'https://api.example.com/data',
  success: function (res) {
    // 处理成功响应
  },
  // 缺少fail回调
});
```

### 防止重复页面跳转

**规则**: 页面跳转前应防止重复点击

**说明**: 快速多次点击可能导致重复跳转，引起页面栈异常或重复加载资源。

**正确示例**:

```javascript
Page({
  data: {
    isNavigating: false,
  },

  navigateToDetail(e) {
    // 防止重复点击
    if (this.data.isNavigating) return;

    const { id } = e.currentTarget.dataset;

    this.setData({ isNavigating: true });

    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
      complete: () => {
        // 导航完成后重置状态
        setTimeout(() => {
          this.setData({ isNavigating: false });
        }, 500);
      },
    });
  },
});
```

**错误示例**:

```javascript
Page({
  navigateToDetail(e) {
    const { id } = e.currentTarget.dataset;

    // 没有防止重复点击的机制
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
    });
  },
});
```

### 全局对象访问规范

**规则**: 访问全局 app 实例应使用 getApp()而非直接引用

**说明**: 使用 getApp()可以确保在正确的生命周期中访问全局实例，避免在实例未初始化时引发错误。

**正确示例**:

```javascript
// 获取全局数据
function getUserInfo() {
  const app = getApp();
  return app.globalData.userInfo;
}

// 更新全局数据
function updateUserInfo(userInfo) {
  const app = getApp();
  app.globalData.userInfo = userInfo;
}
```

**错误示例**:

```javascript
// 直接引用app对象，可能在app未初始化完成时出错
function getUserInfo() {
  return app.globalData.userInfo;
}
```

### 使用 selectiveQuery 代替选择器

**规则**: 推荐使用组件内置的选择器查询

**说明**: 在组件中使用内置选择器可以确保查询限定在组件作用域内，避免全局选择可能带来的问题。

**正确示例**:

```javascript
Component({
  methods: {
    getElementSize() {
      // 在组件内使用
      const query = this.createSelectorQuery();
      query.select('.my-class').boundingClientRect();
      query.exec(function (res) {
        console.log(res[0].width, res[0].height);
      });
    },
  },
});

// 在页面中指定组件上下文
Page({
  getComponentSize() {
    const query = wx.createSelectorQuery().in(this);
    query.select('.component-class').boundingClientRect();
    query.exec(function (res) {
      console.log(res[0].width, res[0].height);
    });
  },
});
```

**错误示例**:

```javascript
Component({
  methods: {
    getElementSize() {
      // 不限定组件作用域的选择器查询
      const query = wx.createSelectorQuery();
      query.select('.my-class').boundingClientRect();
      query.exec(function (res) {
        // 可能选择到页面上其他组件的同名元素
        console.log(res[0].width, res[0].height);
      });
    },
  },
});
```

## API 调用规范（续）

### 页面路由参数解析

**规则**: 页面参数应进行安全解析

**说明**: 安全地解析页面参数，为参数提供默认值可以避免因参数缺失而导致的错误。

**正确示例**:

```javascript
Page({
  onLoad(options) {
    // 使用ES6解构并提供默认值
    const { id = '', type = 'default', page = '1' } = options || {};

    // 将字符串类型的数字转换为实际数字类型
    const pageNum = parseInt(page, 10);

    // 使用处理后的安全参数
    this.loadData(id, type, pageNum);
  },
});
```

**错误示例**:

```javascript
Page({
  onLoad(options) {
    // 直接使用可能不存在的参数
    const id = options.id;
    const type = options.type;

    // 如果id不存在，可能导致程序错误
    this.loadData(id, type);
  },
});
```

---

## 数据绑定规范

### 数据绑定使用 setData 规范

**规则**: setData 应当合并调用而非频繁单独调用

**说明**: 频繁调用 setData 会导致多次重新渲染，影响性能。应尽可能合并多个状态更新为一个 setData 调用。

**正确示例**:

```javascript
// 合并多个数据更新
this.setData({
  loading: false,
  list: newList,
  hasMore: newList.length === PAGE_SIZE,
  currentPage: this.data.currentPage + 1,
});
```

**错误示例**:

```javascript
// 多次独立调用setData
this.setData({ loading: false });
this.setData({ list: newList });
this.setData({ hasMore: newList.length === PAGE_SIZE });
this.setData({ currentPage: this.data.currentPage + 1 });
```

### 避免在循环中使用 setData

**规则**: 循环中不应调用 setData

**说明**: 在循环中调用 setData 会导致频繁的 UI 更新，严重影响性能。

**正确示例**:

```javascript
handleItemsUpdate(items) {
  // 先在循环中处理数据
  const updatedList = this.data.list.slice();

  for (let i = 0; i < items.length; i++) {
    const index = updatedList.findIndex(item => item.id === items[i].id);
    if (index >= 0) {
      updatedList[index] = { ...updatedList[index], ...items[i] };
    }
  }

  // 一次性更新
  this.setData({ list: updatedList });
}
```

**错误示例**:

```javascript
handleItemsUpdate(items) {
  for (let i = 0; i < items.length; i++) {
    const index = this.data.list.findIndex(item => item.id === items[i].id);
    if (index >= 0) {
      // 循环中调用setData，影响性能
      const key = `list[${index}]`;
      this.setData({
        [key]: { ...this.data.list[index], ...items[i] }
      });
    }
  }
}
```

### 数据路径访问规范

**规则**: 使用数据路径表达式访问嵌套数据

**说明**: 直接通过数据路径更新嵌套数据，可以避免创建整个对象副本，提高性能。

**正确示例**:

```javascript
// 直接更新嵌套属性
this.setData({
  'userInfo.name': 'New Name',
  'userInfo.age': 25,
  'settings.theme': 'dark',
});
```

**错误示例**:

```javascript
// 创建整个对象的副本来更新嵌套属性
const userInfo = { ...this.data.userInfo };
userInfo.name = 'New Name';
userInfo.age = 25;

const settings = { ...this.data.settings };
settings.theme = 'dark';

this.setData({
  userInfo: userInfo,
  settings: settings,
});
```

### 请求防抖

**规则**: 用户输入相关的请求应使用防抖

**说明**: 在用户输入过程中应用防抖机制，避免频繁发送请求，浪费网络资源和服务器资源。

**正确示例**:

```javascript
import { debounce } from '../../utils/debounce';

Page({
  data: {
    keyword: '',
  },

  onLoad() {
    // 创建防抖搜索函数
    this.debouncedSearch = debounce(this.search, 300);
  },

  onInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });

    // 使用防抖处理搜索请求
    this.debouncedSearch(keyword);
  },

  search(keyword) {
    if (!keyword) return;

    // 发送搜索请求
    wx.request({
      url: 'https://api.example.com/search',
      data: { keyword },
      success: res => {
        this.setData({ searchResults: res.data.results });
      },
    });
  },
});
```

**错误示例**:

```javascript
Page({
  data: {
    keyword: '',
  },

  onInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });

    // 每次输入都立即发送请求，没有防抖
    this.search(keyword);
  },

  search(keyword) {
    if (!keyword) return;

    wx.request({
      url: 'https://api.example.com/search',
      data: { keyword },
      success: res => {
        this.setData({ searchResults: res.data.results });
      },
    });
  },
});
```

---

## 性能优化规范

### 组件样式隔离

**规则**: 组件应使用样式隔离

**说明**: 样式隔离可以防止组件样式被外部环境影响，也防止组件样式影响到页面其他元素。

**正确示例**:

```javascript
Component({
  options: {
    // 启用样式隔离
    styleIsolation: 'isolated',
    // 如需使用全局样式，可以设置：
    // addGlobalClass: true
  },

  // 组件其他属性...
});
```

**错误示例**:

```javascript
Component({
  // 未指定样式隔离选项，可能导致样式冲突
  // 组件其他属性...
});
```

### wxs 性能优化

**规则**: 使用 wxs 处理频繁更新的视图逻辑

**说明**: WXS 执行在视图层，可以避免频繁的逻辑层和视图层通信，提高性能。

**正确示例**:

```html
<!-- price-format.wxs -->
<!--
module.exports = {
  format: function(price) {
    if (typeof price !== 'number') {
      return '0.00';
    }
    return price.toFixed(2);
  }
}
-->

<!-- 页面中使用 -->
<wxs src="../../utils/price-format.wxs" module="priceFormat" />

<view wx:for="{{products}}" wx:key="id" class="product">
  <view class="price">¥{{priceFormat.format(item.price)}}</view>
</view>
```

**错误示例**:

```html
<!-- 在逻辑层处理格式化逻辑 -->
<!--
Page({
  data: {
    formattedPrices: []
  },
  updatePrices: function(prices) {
    const formattedPrices = prices.map(price => price.toFixed(2));
    this.setData({ formattedPrices });
  }
})
-->

<!-- 页面中使用 -->
<view wx:for="{{products}}" wx:key="id" class="product">
  <view class="price">¥{{formattedPrices[index]}}</view>
</view>
```

### 避免频繁创建新对象

**规则**: setData 时避免频繁创建新对象

**说明**: 在定时器等频繁执行的场景中，频繁创建新对象会增加内存压力和 GC 频率，影响性能。

**正确示例**:

```javascript
Page({
  data: {
    timer: 0,
    progress: {
      value: 0,
      color: 'blue',
    },
  },

  startTimer() {
    this.timerInterval = setInterval(() => {
      // 只更新必要的字段，而不是整个对象
      this.setData({
        'progress.value': this.data.progress.value + 1,
      });

      if (this.data.progress.value >= 100) {
        clearInterval(this.timerInterval);
      }
    }, 100);
  },
});
```

**错误示例**:

```javascript
Page({
  data: {
    timer: 0,
    progress: {
      value: 0,
      color: 'blue',
    },
  },

  startTimer() {
    this.timerInterval = setInterval(() => {
      // 每次都创建完整的新对象
      this.setData({
        progress: {
          value: this.data.progress.value + 1,
          color: this.data.progress.color,
        },
      });

      if (this.data.progress.value >= 100) {
        clearInterval(this.timerInterval);
      }
    }, 100);
  },
});
```

### 优化条件渲染

**规则**: 长列表条件渲染优化

**说明**: 在视图层进行条件过滤会导致不必要的性能消耗，应在数据层面提前过滤。

**正确示例**:

```javascript
Page({
  data: {
    // 提前过滤数据
    visibleItems: []
  },

  onLoad() {
    this.fetchData();
  },

  fetchData() {
    // 假设从API获取了原始数据
    const originalList = [...];

    // 在数据层面进行过滤
    const visibleItems = originalList.filter(item => item.visible);

    this.setData({ visibleItems });
  }
});
```

```html
<!-- 直接渲染已过滤的数据 -->
<view wx:for="{{visibleItems}}" wx:key="id" class="item"> {{item.name}} </view>
```

**错误示例**:

```javascript
Page({
  data: {
    items: []
  },

  onLoad() {
    this.fetchData();
  },

  fetchData() {
    // 直接设置原始数据
    this.setData({ items: [...] });
  }
});
```

```html
<!-- 在视图层进行过滤 -->
<view wx:for="{{items}}" wx:key="id" wx:if="{{item.visible}}" class="item"> {{item.name}} </view>
```

### 优化滚动区域

**规则**: 长列表应使用优化的滚动区域

**说明**: 为滚动区域添加优化配置，可以提高长列表的滚动性能和用户体验。

**正确示例**:

```html
<scroll-view
  scroll-y
  scroll-with-animation
  enable-back-to-top
  scroll-anchoring
  enhanced="{{true}}"
  bounces="{{false}}"
  show-scrollbar="{{false}}"
  bindscrolltolower="onLoadMore"
>
  <view wx:for="{{list}}" wx:key="id" class="item"> {{item.name}} </view>
</scroll-view>
```

**错误示例**:

```html
<scroll-view scroll-y>
  <view wx:for="{{list}}" wx:key="id" class="item"> {{item.name}} </view>
</scroll-view>
```

### 图片资源优化

**规则**: 图片资源应使用 CDN 或云存储路径

**说明**: 使用 CDN 或云存储可以减小小程序包体积，加快加载速度，同时能够动态更新图片而不需要重新发布小程序。

**正确示例**:

```html
<!-- 使用CDN路径 -->
<image src="https://cdn.example.com/images/logo.png"></image>

<!-- 使用云存储路径 -->
<image src="cloud://test-env.7465-test-env/images/banner.jpg"></image>
```

**错误示例**:

```html
<!-- 使用本地图片路径，会增加小程序包体积 -->
<image src="/images/logo.png"></image>
```

### 页面生命周期销毁资源

**规则**: 页面销毁时应清理定时器和事件监听

**说明**: 未清理的定时器和事件监听会导致内存泄漏或意外行为。

**正确示例**:

```javascript
Page({
  data: {
    refreshInterval: null,
    eventHandler: null,
  },

  onLoad() {
    // 设置定时器
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 60000);

    // 添加事件监听
    this.eventHandler = function (res) {
      console.log('Event received:', res);
    };
    wx.onLocationChange(this.eventHandler);
  },

  onUnload() {
    // 清理定时器
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // 移除事件监听
    if (this.eventHandler) {
      wx.offLocationChange(this.eventHandler);
    }
  },
});
```

**错误示例**:

```javascript
Page({
  onLoad() {
    // 设置定时器但未在onUnload中清理
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 60000);

    // 添加事件监听但未移除
    wx.onLocationChange(function (res) {
      console.log('Event received:', res);
    });
  },

  // 缺少onUnload函数清理资源
});
```

---

## 代码质量规范

### 函数长度限制

**规则**: 函数不应超过 50 行，超过时考虑拆分

**说明**: 保持函数简短可以提高代码可读性和可维护性，使函数职责单一明确。

**正确示例**:

```javascript
// 主函数，调用多个职责单一的子函数
function processOrder(order) {
  validateOrder(order);
  calculateTotal(order);
  applyDiscount(order);
  return formatOrderResponse(order);
}

// 拆分的子函数，各自负责单一功能
function validateOrder(order) {
  // 验证逻辑...
}

function calculateTotal(order) {
  // 计算总价逻辑...
}

function applyDiscount(order) {
  // 应用折扣逻辑...
}

function formatOrderResponse(order) {
  // 格式化返回数据...
}
```

**错误示例**:

```javascript
// 单个过长的函数，职责不明确
function processOrder(order) {
  // 验证部分
  if (!order.items || !order.items.length) {
    throw new Error('订单不能为空');
  }

  if (!order.userId) {
    throw new Error('用户ID不能为空');
  }

  // 计算总价部分
  let total = 0;
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    total += item.price * item.quantity;
  }

  // 折扣计算部分
  let discount = 0;
  if (total > 100) {
    discount = total * 0.1;
  } else if (total > 50) {
    discount = total * 0.05;
  }

  // 更多逻辑...（函数继续延伸）

  // 返回格式化数据
  return {
    orderId: order.id,
    total: total - discount,
    discount: discount,
    // 更多字段...
  };
}
```

### 条件判断简化

**规则**: 复杂条件判断应提取为命名良好的变量或函数

**说明**: 通过提取条件判断为有意义的变量名，可以提高代码可读性和自解释性。

**正确示例**:

```javascript
function canUserAccess(user, resource) {
  // 提取复杂条件为有意义的变量
  const isAuthenticated = user && user.token && user.status === 'active';
  const hasPermission = user.permissions.includes(resource.type);
  const isResourceAvailable =
    resource.status === 'published' ||
    (resource.status === 'limited' && resource.allowedUsers.includes(user.id));

  return isAuthenticated && hasPermission && isResourceAvailable;
}
```

**错误示例**:

```javascript
function canUserAccess(user, resource) {
  // 复杂的内联条件判断，难以阅读和理解
  if (
    user &&
    user.token &&
    user.status === 'active' &&
    user.permissions.includes(resource.type) &&
    (resource.status === 'published' ||
      (resource.status === 'limited' && resource.allowedUsers.includes(user.id)))
  ) {
    return true;
  }
  return false;
}
```

### 防止 this 丢失

**规则**: 回调函数中防止 this 指向丢失

**说明**: 在 JavaScript 中，函数内的 this 指向取决于调用方式，在回调函数中 this 可能不再指向组件实例。

**正确示例**:

```javascript
// 方法1：使用箭头函数
fetchData() {
  wx.request({
    url: 'https://api.example.com/data',
    success: (res) => {
      // 箭头函数不绑定自己的this，会捕获上下文中的this
      this.setData({ list: res.data });
    }
  });
}

// 方法2：提前保存this引用
fetchData() {
  const that = this;
  wx.request({
    url: 'https://api.example.com/data',
    success: function(res) {
      // 使用保存的that引用
      that.setData({ list: res.data });
    }
  });
}

// 方法3：使用bind
fetchData() {
  wx.request({
    url: 'https://api.example.com/data',
    success: function(res) {
      this.setData({ list: res.data });
    }.bind(this)
  });
}
```

**错误示例**:

```javascript
fetchData() {
  wx.request({
    url: 'https://api.example.com/data',
    success: function(res) {
      // 在普通函数中，this不再指向组件实例，会导致错误
      this.setData({ list: res.data });
    }
  });
}
```

### 禁止 console 语句

**规则**: 生产代码中不应有 console 语句

**说明**: 生产环境中的 console 语句可能暴露敏感信息，影响性能，应该在发布前移除或条件包装。

**正确示例**:

```javascript
// 方法1：使用环境变量条件判断
function logDebug(message) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(message);
  }
}

// 方法2：使用日志工具库，可在生产环境禁用
const logger = {
  debug: function (message) {
    if (__DEV__) {
      console.log('[DEBUG]', message);
    }
  },
  error: function (message) {
    // 错误可能需要在生产环境也记录
    console.error('[ERROR]', message);
    // 可以发送到错误监控服务
  },
};

logger.debug('这是调试信息');
```

**错误示例**:

```javascript
// 直接使用console语句
function processData(data) {
  console.log('Processing data:', data); // 生产环境不应该有这句

  // 处理逻辑...

  console.log('Data processed'); // 生产环境不应该有这句
}
```

### 使用 ES6 解构

**规则**: 鼓励使用 ES6 解构简化代码

**说明**: ES6 解构可以使代码更简洁，减少重复引用，提高可读性。

**正确示例**:

```javascript
// 对象解构
const { name, age, address } = user;

// 数组解构
const [first, second, ...rest] = items;

// 函数参数解构
function processUser({ name, age, isVIP = false }) {
  // 使用解构的参数
}

// 嵌套解构
const {
  company: { name: companyName, address: companyAddress },
} = userData;
```

**错误示例**:

```javascript
// 不使用解构，代码冗长
const name = user.name;
const age = user.age;
const address = user.address;

// 不使用数组解构
const first = items[0];
const second = items[1];
const rest = items.slice(2);
```

### 推荐使用模板字符串

**规则**: 字符串拼接应使用模板字符串

**说明**: 模板字符串提供更清晰、更易读的字符串插值方式。

**正确示例**:

```javascript
const name = 'Alice';
const greeting = `Hello ${name}!`;

const item = { id: 123, name: 'Product' };
const url = `/pages/detail/detail?id=${item.id}&name=${encodeURIComponent(item.name)}`;

// 多行字符串
const html = `
  <view class="container">
    <text>${title}</text>
    <text>${content}</text>
  </view>
`;
```

**错误示例**:

```javascript
const name = 'Alice';
const greeting = 'Hello ' + name + '!';

const item = { id: 123, name: 'Product' };
const url = '/pages/detail/detail?id=' + item.id + '&name=' + encodeURIComponent(item.name);
```

---

## 最佳实践

以下是一些整合了上述规则的微信小程序开发最佳实践示例。

### 页面示例

```javascript
// 导入部分 - 按照规定顺序
import regeneratorRuntime from 'regenerator-runtime';
import { wxPromise } from '../../utils/wx-promise';
import { debounce, throttle } from '../../utils/performance';
import { API_URL, PAGE_SIZE } from '../../config/constants';
import userService from '../../services/userService';

// 常量定义
const DEFAULT_TIMEOUT = 5000;
const REFRESH_INTERVAL = 60000;

Page({
  // 数据
  data: {
    list: [],
    loading: false,
    pageNum: 1,
    hasMore: true,
    keyword: '',
    isNavigating: false,
    error: null,
  },

  // 生命周期函数
  onLoad(options) {
    // 安全解析参数
    const { id = '', type = 'all' } = options || {};
    this.pageId = id;
    this.pageType = type;

    // 初始化防抖函数
    this.debouncedSearch = debounce(this.search, 300);

    // 加载初始数据
    this.loadData();

    // 设置刷新定时器
    this.refreshTimer = setInterval(() => {
      this.refreshData();
    }, REFRESH_INTERVAL);
  },

  onShow() {
    // 页面显示时的逻辑
  },

  onHide() {
    // 页面隐藏时的逻辑
  },

  onUnload() {
    // 清理资源
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  },

  onPullDownRefresh() {
    this.refreshData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreData();
    }
  },

  // 事件处理函数
  handleItemTap(e) {
    if (this.data.isNavigating) return;

    const { id } = e.currentTarget.dataset;
    this.setData({ isNavigating: true });

    wxPromise
      .navigateTo({
        url: `/pages/detail/detail?id=${id}`,
      })
      .catch(err => {
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none',
        });
      })
      .finally(() => {
        setTimeout(() => {
          this.setData({ isNavigating: false });
        }, 500);
      });
  },

  handleSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    this.debouncedSearch(keyword);
  },

  // 业务方法
  async loadData() {
    try {
      this.setData({ loading: true, error: null });

      const res = await wxPromise.request({
        url: `${API_URL}/api/items`,
        data: {
          type: this.pageType,
          page: 1,
          size: PAGE_SIZE,
        },
        timeout: DEFAULT_TIMEOUT,
      });

      this.setData({
        list: res.data.items,
        pageNum: 1,
        hasMore: res.data.items.length === PAGE_SIZE,
        loading: false,
      });
    } catch (err) {
      this.setData({
        error: '数据加载失败，请重试',
        loading: false,
      });
    }
  },

  async loadMoreData() {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });

      const nextPage = this.data.pageNum + 1;
      const res = await wxPromise.request({
        url: `${API_URL}/api/items`,
        data: {
          type: this.pageType,
          page: nextPage,
          size: PAGE_SIZE,
        },
      });

      // 合并数据
      const newList = [...this.data.list, ...res.data.items];

      this.setData({
        list: newList,
        pageNum: nextPage,
        hasMore: res.data.items.length === PAGE_SIZE,
        loading: false,
      });
    } catch (err) {
      this.setData({
        error: '加载更多数据失败',
        loading: false,
      });
    }
  },

  async refreshData() {
    return this.loadData();
  },

  async search(keyword) {
    if (!keyword) {
      return this.loadData();
    }

    try {
      this.setData({ loading: true, error: null });

      const res = await wxPromise.request({
        url: `${API_URL}/api/search`,
        data: { keyword },
      });

      this.setData({
        list: res.data.items,
        hasMore: false,
        loading: false,
      });
    } catch (err) {
      this.setData({
        error: '搜索失败，请重试',
        loading: false,
      });
    }
  },
});
```

### 组件示例

```javascript
Component({
  properties: {
    title: {
      type: String,
      value: '',
    },
    items: {
      type: Array,
      value: [],
    },
    loading: {
      type: Boolean,
      value: false,
    },
  },

  options: {
    styleIsolation: 'isolated',
    multipleSlots: true,
  },

  externalClasses: ['custom-class'],

  data: {
    active: false,
    currentIndex: 0,
  },

  lifetimes: {
    attached() {
      this.init();
    },
    detached() {
      // 清理工作
      if (this.observer) {
        this.observer.disconnect();
      }
    },
  },

  pageLifetimes: {
    show() {
      if (this.data.needRefresh) {
        this.refresh();
      }
    },
  },
  observers: {
    items: function (items) {
      if (items.length > 0) {
        this.processItems(items);
      }
    },
  },

  methods: {
    init() {
      // 初始化逻辑
      const query = this.createSelectorQuery();
      query.select('.component-root').boundingClientRect();
      query.exec(res => {
        if (res && res[0]) {
          this.setData({ componentSize: res[0] });
        }
      });
    },

    processItems(items) {
      // 数据处理逻辑
      const processedItems = items.map(item => ({
        ...item,
        displayName: item.name || '未命名项',
        statusClass: this.getStatusClass(item.status),
      }));

      this.setData({
        processedItems: processedItems,
      });
    },

    getStatusClass(status) {
      // 返回不同状态对应的样式类名
      const statusMap = {
        active: 'status-active',
        pending: 'status-pending',
        completed: 'status-completed',
        failed: 'status-failed',
      };

      return statusMap[status] || 'status-default';
    },

    handleItemTap(e) {
      const { index } = e.currentTarget.dataset;
      this.setData({ currentIndex: index });

      const item = this.data.processedItems[index];
      this.triggerEvent('item-tap', { item });
    },

    refresh() {
      this.setData({ needRefresh: false });
      this.triggerEvent('refresh');
    },
  },
});
```

### WXML 和 WXSS 示例

#### WXML 页面示例

```html
<!-- 页面WXML -->
<view class="container">
  <!-- 搜索区域 -->
  <view class="search-area">
    <input
      placeholder="请输入搜索关键词"
      value="{{keyword}}"
      bindinput="handleSearchInput"
      class="search-input"
    />
    <view class="search-btn" catchtap="handleSearch">搜索</view>
  </view>

  <!-- 使用wxs处理格式化 -->
  <wxs src="../../utils/formatter.wxs" module="fmt" />

  <!-- 列表内容，处理空状态 -->
  <block wx:if="{{list.length > 0}}">
    <view class="list-container">
      <view
        wx:for="{{list}}"
        wx:key="id"
        class="list-item"
        hover-class="item-hover"
        hover-stay-time="100"
        catchtap="handleItemTap"
        data-id="{{item.id}}"
      >
        <image class="item-image" src="{{item.imageUrl}}" mode="aspectFill" lazy-load="{{true}}" />
        <view class="item-content">
          <view class="item-title">{{item.title}}</view>
          <view class="item-desc">{{item.description}}</view>
          <view class="item-price">{{fmt.formatPrice(item.price)}}</view>
        </view>
      </view>
    </view>

    <!-- 加载更多状态 -->
    <view class="loading-more" wx:if="{{loading}}">
      <view class="loading-icon"></view>
      <text>加载中...</text>
    </view>

    <view class="no-more" wx:if="{{!hasMore && !loading}}"> 已加载全部内容 </view>
  </block>

  <!-- 空状态展示 -->
  <view wx:else class="empty-state">
    <image class="empty-image" src="https://cdn.example.com/images/empty.png" mode="heightFix" />
    <text class="empty-text">{{error || '暂无数据'}}</text>
    <button wx:if="{{error}}" type="primary" size="mini" catchtap="loadData" class="retry-btn">
      重新加载
    </button>
  </view>
</view>
```

#### WXSS 样式示例

```css
/* 页面样式 */
.container {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f6f6f6;
}

/* 搜索区域 */
.search-area {
  display: flex;
  margin-bottom: 20rpx;
  background-color: #fff;
  padding: 16rpx;
  border-radius: 8rpx;
}

.search-input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  border: 1rpx solid #eee;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.search-btn {
  width: 120rpx;
  height: 72rpx;
  margin-left: 16rpx;
  background-color: #07c160;
  color: #fff;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

/* 列表样式 */
.list-container {
  background-color: #fff;
  border-radius: 8rpx;
  overflow: hidden;
}

.list-item {
  display: flex;
  padding: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.item-hover {
  background-color: #f9f9f9;
}

.item-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  background-color: #eee;
}

.item-content {
  flex: 1;
  margin-left: 20rpx;
  overflow: hidden;
}

.item-title {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 8rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.item-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-price {
  font-size: 32rpx;
  color: #ff5500;
  font-weight: bold;
}

/* 加载状态 */
.loading-more,
.no-more {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 26rpx;
}

.loading-icon {
  display: inline-block;
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #666;
  border-radius: 50%;
  margin-right: 10rpx;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-state {
  padding: 100rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 30rpx;
}

.retry-btn {
  font-size: 26rpx;
}
```

### 组件 WXML 和 WXSS 示例

#### 组件 WXML 示例

```html
<!-- 组件WXML -->
<view class="component-root custom-class">
  <!-- 标题区域，使用命名插槽 -->
  <view class="header">
    <view class="title">{{title}}</view>
    <slot name="header-right"></slot>
  </view>

  <!-- 加载状态 -->
  <view class="loading-mask" wx:if="{{loading}}">
    <view class="loading-icon"></view>
    <text class="loading-text">加载中...</text>
  </view>

  <!-- 内容区域 -->
  <view class="content">
    <block wx:if="{{processedItems && processedItems.length > 0}}">
      <view
        wx:for="{{processedItems}}"
        wx:key="id"
        class="item {{currentIndex === index ? 'item-active' : ''}}"
        hover-class="item-hover"
        hover-stay-time="100"
        catchtap="handleItemTap"
        data-index="{{index}}"
      >
        <!-- 状态标识 -->
        <view class="status-badge {{item.statusClass}}"></view>

        <!-- 项目内容 -->
        <view class="item-main">
          <view class="item-name">{{item.displayName}}</view>
          <view class="item-meta">{{item.meta || ''}}</view>
        </view>

        <!-- 使用命名插槽允许自定义项目右侧内容 -->
        <slot name="item-right" data="{{item}}"></slot>
      </view>
    </block>

    <!-- 空状态 -->
    <view wx:else class="empty">
      <slot name="empty">
        <view class="empty-default">暂无数据</view>
      </slot>
    </view>
  </view>

  <!-- 底部区域 -->
  <view class="footer">
    <slot name="footer"></slot>
  </view>
</view>
```

#### 组件 WXSS 示例

```css
/* 组件样式 */
.component-root {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

/* 标题区域 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.title {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
}

/* 内容区域 */
.content {
  min-height: 100rpx;
}

/* 项目样式 */
.item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  position: relative;
  border-bottom: 1rpx solid #f5f5f5;
}

.item:last-child {
  border-bottom: none;
}

.item-hover {
  background-color: #f9f9f9;
}

.item-active {
  background-color: #f0f8ff;
}

.status-badge {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.status-active {
  background-color: #07c160;
}

.status-pending {
  background-color: #faa307;
}

.status-completed {
  background-color: #0077ff;
}

.status-failed {
  background-color: #ff3b30;
}

.status-default {
  background-color: #999;
}

.item-main {
  flex: 1;
  overflow: hidden;
}

.item-name {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 8rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.item-meta {
  font-size: 24rpx;
  color: #999;
}

/* 加载状态 */
.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-icon {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #f3f3f3;
  border-top: 6rpx solid #07c160;
  border-radius: 50%;
  margin-bottom: 20rpx;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty {
  padding: 60rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-default {
  font-size: 28rpx;
  color: #999;
}

/* 底部区域 */
.footer {
  padding: 24rpx;
  border-top: 1rpx solid #f5f5f5;
}
```

### 工具函数示例

#### Promise 封装工具

```javascript
// utils/wx-promise.js

/**
 * 将wx原生API转换为Promise形式
 * @param {Function} fn 微信API方法
 * @returns {Function} Promise化的API方法
 */
const promisify = fn => {
  return (options = {}) => {
    return new Promise((resolve, reject) => {
      fn({
        ...options,
        success: res => {
          resolve(res);
        },
        fail: err => {
          reject(err);
        },
      });
    });
  };
};

// 常用API Promise化
const wxPromise = {
  request: promisify(wx.request),
  navigateTo: promisify(wx.navigateTo),
  redirectTo: promisify(wx.redirectTo),
  switchTab: promisify(wx.switchTab),
  reLaunch: promisify(wx.reLaunch),
  showToast: promisify(wx.showToast),
  showLoading: promisify(wx.showLoading),
  showModal: promisify(wx.showModal),
  login: promisify(wx.login),
  getUserInfo: promisify(wx.getUserInfo),
  getImageInfo: promisify(wx.getImageInfo),
  getSystemInfo: promisify(wx.getSystemInfo),
  getLocation: promisify(wx.getLocation),
  uploadFile: promisify(wx.uploadFile),
  downloadFile: promisify(wx.downloadFile),
  setStorage: promisify(wx.setStorage),
  getStorage: promisify(wx.getStorage),
  removeStorage: promisify(wx.removeStorage),
  clearStorage: promisify(wx.clearStorage),
  getStorageInfo: promisify(wx.getStorageInfo),
  chooseImage: promisify(wx.chooseImage),
  chooseVideo: promisify(wx.chooseVideo),
  chooseLocation: promisify(wx.chooseLocation),
  openLocation: promisify(wx.openLocation),
  saveImageToPhotosAlbum: promisify(wx.saveImageToPhotosAlbum),
  previewImage: promisify(wx.previewImage),
  connectSocket: promisify(wx.connectSocket),
  closeSocket: promisify(wx.closeSocket),
  makePhoneCall: promisify(wx.makePhoneCall),
  scanCode: promisify(wx.scanCode),
  requestPayment: promisify(wx.requestPayment),
  authorize: promisify(wx.authorize),
  openSetting: promisify(wx.openSetting),
  getSetting: promisify(wx.getSetting),
  checkSession: promisify(wx.checkSession),
  getShareInfo: promisify(wx.getShareInfo),
  startPullDownRefresh: promisify(wx.startPullDownRefresh),
  stopPullDownRefresh: promisify(wx.stopPullDownRefresh),
  setClipboardData: promisify(wx.setClipboardData),
  getClipboardData: promisify(wx.getClipboardData),
  addPhoneContact: promisify(wx.addPhoneContact),
  getFileInfo: promisify(wx.getFileInfo),
  saveFile: promisify(wx.saveFile),
  removeFile: promisify(wx.removeFile),
  getWeRunData: promisify(wx.getWeRunData),
  canvasToTempFilePath: promisify(wx.canvasToTempFilePath),
};

export { wxPromise, promisify };
```

#### 防抖节流工具

```javascript
// utils/performance.js

/**
 * 防抖函数
 * @param {Function} fn 需要防抖的函数
 * @param {Number} delay 延迟时间，单位毫秒
 * @returns {Function} 防抖处理后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null;

  return function (...args) {
    const context = this;

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      fn.apply(context, args);
      timer = null;
    }, delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn 需要节流的函数
 * @param {Number} threshold 阈值，单位毫秒
 * @returns {Function} 节流处理后的函数
 */
export function throttle(fn, threshold = 300) {
  let last = 0;
  let timer = null;

  return function (...args) {
    const context = this;
    const now = Date.now();

    if (now - last >= threshold) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      last = now;
      fn.apply(context, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        fn.apply(context, args);
        timer = null;
      }, threshold - (now - last));
    }
  };
}

/**
 * 防抖和节流结合
 * 连续触发时使用节流，停止触发时使用防抖
 * @param {Function} fn 处理函数
 * @param {Number} delay 防抖延迟
 * @param {Number} threshold 节流阈值
 * @returns {Function} 处理后的函数
 */
export function throttleAndDebounce(fn, delay = 300, threshold = 300) {
  let timer = null;
  let last = 0;

  return function (...args) {
    const context = this;
    const now = Date.now();

    if (now - last >= threshold) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      last = now;
      fn.apply(context, args);
    } else {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        last = Date.now();
        fn.apply(context, args);
        timer = null;
      }, delay);
    }
  };
}
```

#### 格式化工具（WXS）

```javascript
// utils/formatter.wxs

/**
 * 格式化价格
 * @param {Number} price 价格
 * @param {String} prefix 前缀，默认为¥
 * @returns {String} 格式化后的价格字符串
 */
function formatPrice(price, prefix) {
  if (typeof price !== 'number') {
    return (prefix || '¥') + '0.00';
  }

  return (prefix || '¥') + price.toFixed(2);
}

/**
 * 格式化日期时间
 * @param {Number} timestamp 时间戳
 * @param {String} format 格式化模式，默认为yyyy-MM-dd
 * @returns {String} 格式化后的日期时间字符串
 */
function formatDateTime(timestamp, format) {
  if (!timestamp) {
    return '';
  }

  var date = getDate(timestamp);
  format = format || 'yyyy-MM-dd';

  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hour = date.getHours();
  var minute = date.getMinutes();
  var second = date.getSeconds();

  // 补零函数
  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  return format
    .replace('yyyy', year)
    .replace('MM', pad(month))
    .replace('dd', pad(day))
    .replace('HH', pad(hour))
    .replace('mm', pad(minute))
    .replace('ss', pad(second));
}

/**
 * 格式化文件大小
 * @param {Number} size 文件大小（字节）
 * @returns {String} 格式化后的文件大小
 */
function formatFileSize(size) {
  if (typeof size !== 'number' || size < 0) {
    return '0 B';
  }

  var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  var i = 0;

  while (size >= 1024 && i < units.length - 1) {
    size = size / 1024;
    i++;
  }

  return size.toFixed(2) + ' ' + units[i];
}

/**
 * 格式化数量
 * @param {Number} num 数量
 * @returns {String} 格式化后的数量
 */
function formatNumber(num) {
  if (typeof num !== 'number') {
    return '0';
  }

  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  } else {
    return num.toString();
  }
}

/**
 * 文本截断
 * @param {String} str 原始文本
 * @param {Number} maxLength 最大长度
 * @param {String} suffix 后缀
 * @returns {String} 截断后的文本
 */
function truncate(str, maxLength, suffix) {
  if (!str) {
    return '';
  }

  maxLength = maxLength || 10;
  suffix = suffix || '...';

  if (str.length <= maxLength) {
    return str;
  }

  return str.substring(0, maxLength) + suffix;
}

// 导出工具函数
module.exports = {
  formatPrice: formatPrice,
  formatDateTime: formatDateTime,
  formatFileSize: formatFileSize,
  formatNumber: formatNumber,
  truncate: truncate,
};
```

## 项目结构示例

以下是一个符合规范的微信小程序项目目录结构示例：

```
my-mini-program/
├── .cursorrules                // Cursor规则文件
├── project.config.json         // 项目配置文件
├── miniprogram/                // 小程序源代码
│   ├── app.js                  // 应用入口
│   ├── app.json                // 应用配置
│   ├── app.wxss                // 应用全局样式
│   ├── sitemap.json            // 小程序索引配置
│   ├── utils/                  // 工具库
│   │   ├── wx-promise.js       // Promise封装
│   │   ├── performance.js      // 性能优化工具
│   │   ├── formatter.wxs       // 格式化工具(WXS)
│   │   ├── validator.js        // 数据验证工具
│   │   └── logger.js           // 日志工具
│   ├── config/                 // 配置文件
│   │   ├── index.js            // 配置入口
│   │   ├── api.js              // API配置
│   │   └── constants.js        // 常量定义
│   ├── services/               // 服务层
│   │   ├── http.js             // 网络请求服务
│   │   ├── user-service.js     // 用户相关服务
│   │   └── order-service.js    // 订单相关服务
│   ├── components/             // 组件
│   │   ├── card/               // 卡片组件
│   │   │   ├── card.js         // 组件逻辑
│   │   │   ├── card.json       // 组件配置
│   │   │   ├── card.wxml       // 组件模板
│   │   │   └── card.wxss       // 组件样式
│   │   └── tab-bar/            // 底部标签栏
│   │       ├── tab-bar.js
│   │       ├── tab-bar.json
│   │       ├── tab-bar.wxml
│   │       └── tab-bar.wxss
│   ├── pages/                  // 页面
│   │   ├── index/              // 首页
│   │   │   ├── index.js        // 页面逻辑
│   │   │   ├── index.json      // 页面配置
│   │   │   ├── index.wxml      // 页面模板
│   │   │   └── index.wxss      // 页面样式
│   │   ├── detail/             // 详情页
│   │   ├── user/               // 用户页
│   │   └── cart/               // 购物车页
│   └── images/                 // 本地图片资源
├── cloudfunctions/             // 云函数
└── README.md                   // 项目说明文档
```

## 总结

本规范从以下几个方面详细阐述了微信小程序开发的最佳实践：

1. **代码结构规范**：明确了页面、组件文件的结构和属性顺序，使代码更加清晰易读。

2. **命名规范**：统一了变量、常量、函数和 CSS 类的命名规则，提高代码的一致性和可读性。

3. **WXML 视图层规范**：规范了 wx:for、wx:if 等指令的使用方式，以及处理空状态、图片懒加载等视图层最佳实践。

4. **API 调用规范**：推荐使用 Promise 封装微信 API，统一处理错误，防止重复页面跳转等问题。

5. **数据绑定规范**：优化 setData 的使用方式，避免频繁调用或在循环中调用，使用数据路径表达式更新嵌套数据。

6. **性能优化规范**：通过组件样式隔离、WXS 优化、避免频繁创建新对象等措施提升性能。

7. **代码质量规范**：限制函数长度，简化条件判断，防止 this 丢失，鼓励使用 ES6 特性等，提高代码质量。

遵循这些规范可以帮助开发团队更高效地协作，提高代码质量，为用户提供更好的小程序体验。同时，这些规范也需要结合团队实际情况进行适当调整和完善，形成适合自己团队的开发规范。

---

**附录：常用工具函数**

本文档提供了一系列实用的工具函数，包括：

1. Promise 化的微信 API 封装
2. 防抖和节流函数
3. WXS 格式化工具

这些工具函数可以直接复制到项目中使用，有助于提高开发效率和代码质量。
