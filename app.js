const { CDN, getImageUrl } = require('./config/cdn.js');  // 确保路径正确

// 提取为外部工具函数
async function retryRequest(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    if (error.message?.includes('Lock wait timeout')) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// 将wx.request包装成Promise的工具函数
function wxRequest(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    });
  });
}

// 全局API请求封装，统一处理错误码
function apiRequest(options) {
  return new Promise((resolve, reject) => {
    const app = getApp();
    
    // 确保有openid
    const openid = app?.globalData?.openid || wx.getStorageSync('token');
    
    // 如果有data，添加openid
    if (options.data && openid) {
      options.data.openid = openid;
    }
    
    wx.request({
      ...options,
      success: (res) => {
        // 处理API返回的错误码
        if (res.data && typeof res.data === 'object') {
          const code = res.data.code;
          const msg = res.data.msg || res.data.message || '';
          
          // code不等于0时，表示出错
          if (code !== undefined && code !== null && code !== 0) {
            console.log('API返回错误码:', code, '消息:', msg);
            
            // 特殊处理：-1表示需要重新登录
            if (code === -1) {
              // 清除本地登录状态
              if (app) {
                app.globalData.isLoggedIn = false;
                app.globalData.openid = null;
              }
              wx.removeStorageSync('token');
              
              // 解码Unicode转义的消息
              let decodedMsg = msg;
              try {
                decodedMsg = msg.replace(/\\u[\dA-F]{4}/gi, (match) => {
                  return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
                });
              } catch (e) {
                console.error('消息解码失败:', e);
              }
              
              // 显示错误提示
              wx.showModal({
                title: '登录状态失效',
                content: decodedMsg || '请重新登录',
                confirmText: '去登录',
                cancelText: '取消',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    // 跳转到登录页
                    const pages = getCurrentPages();
                    const currentPage = pages[pages.length - 1];
                    if (currentPage.route !== 'pages/login/login') {
                      wx.navigateTo({
                        url: '/pages/login/login'
                      });
                    }
                  }
                }
              });
              
              reject(new Error(decodedMsg || '登录状态失效'));
              return;
            }
            
            // 其他错误码，直接显示错误信息
            if (msg) {
              wx.showToast({
                title: msg,
                icon: 'none',
                duration: 2000
              });
            }
            
            // 仍然返回数据，让调用方决定如何处理
            resolve(res);
          } else {
            // 正常响应
            resolve(res);
          }
        } else {
          // 没有标准的错误码格式，直接返回
          resolve(res);
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        reject(err);
      }
    });
  });
}

// 重写Page函数以添加全局分享功能
const originalPage = Page;
Page = function(options) {
  // 确保options存在
  options = options || {};
  
  // 如果页面没有定义自己的onShareAppMessage方法，添加默认配置
  if (!options.onShareAppMessage) {
    options.onShareAppMessage = function() {
      return {
        title: '序话 - 即刻成为AI高手',
        path: '/pages/index/index',
        imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)  // 使用CDN图片
      }
    }
  }
  
  // 调用原始的Page函数进行注册
  return originalPage(options);
};

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    isPro: false,
    remainingCount: 0,
    openid: null,
    lastCheckTime: 0, // 新增：上次检查时间
    favoriteMap: new Map(), // 用于缓存收藏状态
    lastGeneratedContent: null, // 存储最后生成的内容
    lastGeneratedTimestamp: 0,   // 最后生成的时间戳
    lastGeneratedLabel: null,   // 存储最后生成的标签
    historyLabels: {}, // 历史记录ID与标签的映射
    sessionLabels: {}, // 会话ID与标签的映射
    historySessionMapping: {}, // 历史记录ID与会话ID的映射
    contentLabels: {}, // 内容与标签的映射
    pendingGenerationId: null,  // 待完成的生成ID
    lastGenerationTime: 0,      // 最后生成时间
    isGenerationPending: false  // 是否有待完成的生成
  },

  // 导出全局API请求方法
  apiRequest: apiRequest,

  // 小程序启动时检查待完成的生成
  onLaunch: function() {
    this.checkPendingGeneration();
    this.loadHistoryLabels(); // 加载历史标签映射
   
  },
  // 强制用户重新登录
  compulsoryLogin(){
   const  flag =wx.getStorageSync('compulsoryLogin')
   if(!!flag)return
   this.logout()
   wx.setStorageSync('compulsoryLogin', true)
  },
  // 检查是否有待完成的生成任务
  checkPendingGeneration: function() {
    const pendingId = wx.getStorageSync('pendingGenerationId');
    const lastTime = wx.getStorageSync('lastGenerationTime');
    
    if (pendingId && lastTime) {
      const timeDiff = Date.now() - lastTime;
      // 如果生成时间在30分钟内，尝试恢复
      if (timeDiff < 30 * 60 * 1000) {
        console.log('检测到待完成的生成任务，准备恢复');
        this.resumeBackgroundGeneration(pendingId);
      } else {
        // 超时清理
        wx.removeStorageSync('pendingGenerationId');
        wx.removeStorageSync('lastGenerationTime');
      }
    }
  },

  // 添加记录生成内容的方法
  recordGeneration: function(content, label) {
    this.globalData.lastGeneratedContent = content;
    this.globalData.lastGeneratedTimestamp = Date.now();
    this.globalData.lastGeneratedLabel = label; // 记录标签
  },

  // 保存历史记录ID与标签的映射关系
  saveHistoryLabel: function(historyId, label) {
    if (!historyId || !label) return;
    
    // 保存到内存
    this.globalData.historyLabels[historyId] = label;
    
    // 持久化到本地存储
    try {
      wx.setStorageSync('historyLabels', this.globalData.historyLabels);
    } catch (e) {
      console.error('保存历史标签失败:', e);
    }
  },

  // 获取历史记录的标签
  getHistoryLabel: function(historyId) {
    // 先从内存中获取
    if (this.globalData.historyLabels[historyId]) {
      return this.globalData.historyLabels[historyId];
    }
    
    // 如果内存中没有，尝试从本地存储加载
    try {
      const labels = wx.getStorageSync('historyLabels') || {};
      this.globalData.historyLabels = labels;
      return labels[historyId] || null;
    } catch (e) {
      console.error('获取历史标签失败:', e);
      return null;
    }
  },

  // 保存会话ID与标签的映射关系
  saveSessionLabel: function(sessionId, label) {
    if (!sessionId || !label) return;
    
    // 初始化sessionLabels如果不存在
    if (!this.globalData.sessionLabels) {
      this.globalData.sessionLabels = {};
    }
    
    // 保存到内存
    this.globalData.sessionLabels[sessionId] = label;
    
    // 持久化到本地存储
    try {
      wx.setStorageSync('sessionLabels', this.globalData.sessionLabels);
      console.log('会话标签已保存:', sessionId, '->', label);
    } catch (e) {
      console.error('保存会话标签失败:', e);
    }
  },

  // 获取会话ID的标签
  getSessionLabel: function(sessionId) {
    // 先从内存中获取
    if (this.globalData.sessionLabels && this.globalData.sessionLabels[sessionId]) {
      return this.globalData.sessionLabels[sessionId];
    }
    
    // 如果内存中没有，尝试从本地存储加载
    try {
      const labels = wx.getStorageSync('sessionLabels') || {};
      if (!this.globalData.sessionLabels) {
        this.globalData.sessionLabels = {};
      }
      this.globalData.sessionLabels = { ...this.globalData.sessionLabels, ...labels };
      if (labels[sessionId]) {
        return labels[sessionId];
      }
    } catch (e) {
      console.error('获取会话标签失败:', e);
    }

    return null;
  },

  // 保存历史记录ID与会话ID的映射关系
  saveHistorySessionMapping: function(historyId, sessionId) {
    if (!historyId || !sessionId) return;
    
    // 初始化映射表如果不存在
    if (!this.globalData.historySessionMapping) {
      this.globalData.historySessionMapping = {};
    }
    
    // 保存到内存
    this.globalData.historySessionMapping[historyId] = sessionId;
    
    // 持久化到本地存储
    try {
      wx.setStorageSync('historySessionMapping', this.globalData.historySessionMapping);
      console.log('🔗 历史记录与会话映射已保存:', historyId, '->', sessionId);
    } catch (e) {
      console.error('保存历史记录会话映射失败:', e);
    }
  },

  // 通过历史记录ID获取会话ID
  getSessionIdByHistoryId: function(historyId) {
    // 先从内存中获取
    if (this.globalData.historySessionMapping && this.globalData.historySessionMapping[historyId]) {
      return this.globalData.historySessionMapping[historyId];
    }
    
    // 如果内存中没有，尝试从本地存储加载
    try {
      const mapping = wx.getStorageSync('historySessionMapping') || {};
      if (!this.globalData.historySessionMapping) {
        this.globalData.historySessionMapping = {};
      }
      this.globalData.historySessionMapping = { ...this.globalData.historySessionMapping, ...mapping };
      return mapping[historyId] || null;
    } catch (e) {
      console.error('获取历史记录会话映射失败:', e);
      return null;
    }
  },

  // 保存内容与标签的映射关系（用于历史记录匹配）
  saveContentLabel: function(content, label, sessionId) {
    if (!content || !label) return;
    
    // 使用content的hash作为键，避免内容过长
    const contentKey = this.hashCode(content);
    
    // 初始化映射表如果不存在
    if (!this.globalData.contentLabels) {
      this.globalData.contentLabels = {};
    }
    
    // 保存到内存
    this.globalData.contentLabels[contentKey] = {
      label: label,
      sessionId: sessionId,
      content: content.substring(0, 50), // 保存前50个字符用于调试
      timestamp: Date.now()
    };
    
    // 持久化到本地存储
    try {
      wx.setStorageSync('contentLabels', this.globalData.contentLabels);
      console.log('🔑 内容标签映射已保存:', contentKey, '->', label);
    } catch (e) {
      console.error('保存内容标签映射失败:', e);
    }
  },

  // 通过内容获取标签
  getLabelByContent: function(content) {
    if (!content) return null;
    
    const contentKey = this.hashCode(content);
    
    // 先从内存中获取
    if (this.globalData.contentLabels && this.globalData.contentLabels[contentKey]) {
      const mapping = this.globalData.contentLabels[contentKey];
      console.log('🔍 通过内容找到标签:', mapping.content, '->', mapping.label);
      return mapping.label;
    }
    
    // 如果内存中没有，尝试从本地存储加载
    try {
      const contentLabels = wx.getStorageSync('contentLabels') || {};
      if (!this.globalData.contentLabels) {
        this.globalData.contentLabels = {};
      }
      this.globalData.contentLabels = { ...this.globalData.contentLabels, ...contentLabels };
      
      if (contentLabels[contentKey]) {
        const mapping = contentLabels[contentKey];
        console.log('🔍 从存储中通过内容找到标签:', mapping.content, '->', mapping.label);
        return mapping.label;
      }
    } catch (e) {
      console.error('获取内容标签映射失败:', e);
    }
    
    return null;
  },

  // 简单的hash函数
  hashCode: function(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  },

  // 在小程序启动时加载标签映射
  // NOTE: YELLOW-002 已清理 — syncLabelToCloud / getLabelFromCloud 已删除
  // 原因: 后端 /labelSync 是半成品(POST 假成功/GET 永远 404),跨设备同步实际靠 /history 带的 style 字段
  // 详见 .team-brain/knowledge/KNOWN_ISSUES.md YELLOW-002
  loadHistoryLabels: function() {
    try {
      const historyLabels = wx.getStorageSync('historyLabels') || {};
      const sessionLabels = wx.getStorageSync('sessionLabels') || {};
      const historySessionMapping = wx.getStorageSync('historySessionMapping') || {};
      const contentLabels = wx.getStorageSync('contentLabels') || {};
      
      this.globalData.historyLabels = historyLabels;
      this.globalData.sessionLabels = sessionLabels;
      this.globalData.historySessionMapping = historySessionMapping;
      this.globalData.contentLabels = contentLabels;
      
      console.log('🏷️ 已加载映射数据 - 历史标签:', Object.keys(historyLabels).length, 
                  '会话标签:', Object.keys(sessionLabels).length, 
                  '历史-会话映射:', Object.keys(historySessionMapping).length,
                  '内容标签:', Object.keys(contentLabels).length);
    } catch (e) {
      console.error('加载标签失败:', e);
      this.globalData.historyLabels = {};
      this.globalData.sessionLabels = {};
      this.globalData.historySessionMapping = {};
      this.globalData.contentLabels = {};
    }
  },

  // 获取最近生成内容的ID
  getRecentGenerationId: function(callback) {
    // 如果没有最近生成的内容，直接返回
    if (!this.globalData.lastGeneratedContent) {
      callback(null);
      return;
    }
    
    // 如果生成时间超过5分钟，可能已过期
    const timeSinceGeneration = Date.now() - this.globalData.lastGeneratedTimestamp;
    if (timeSinceGeneration > 5 * 60 * 1000) {
      callback(null);
      return;
    }
    
    // 请求获取ID
    wx.request({
      url: 'https://www.duyueai.com/recent_generation',
      method: 'POST',
      data: {
        openid: this.globalData.openid,
        content: this.globalData.lastGeneratedContent.substring(0, 100) // 内容前100字符用于匹配
      },
      success: (res) => {
        if (res.data && res.data.id) {
          callback(res.data.id);
        } else {
          callback(null);
        }
      },
      fail: () => {
        callback(null);
      }
    });
  },

  // 优化checkProStatus方法
  async checkProStatus(forceCheck = false) {
    // 如果未登录直接返回
    if (!this.globalData.openid) {
      return Promise.reject(new Error('未登录'));
    }
    
    // 非强制检查且在缓存时间内，返回缓存状态
    const now = Date.now();
    if (!forceCheck && (now - this.globalData.lastCheckTime) < 5 * 60 * 1000) {
      return {
        is_pro: this.globalData.isPro,
        remaining_count: this.globalData.remainingCount
      };
    }

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://www.duyueai.com/userinfo',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            openid: this.globalData.openid
          },
          success: resolve,
          fail: reject
        });
      });

      if (res.data) {
        // 更新全局状态
        this.globalData.isPro = res.data.is_pro;
        this.globalData.remainingCount = res.data.remaining_count || 0;
        this.globalData.lastCheckTime = now;
        return res.data;
      }

      throw new Error('检查会员状态失败');
    } catch (error) {
      console.error('检查会员状态失败:', error);
      if (!forceCheck) {
        // 非强制检查时返回缓存状态
        return {
          is_pro: this.globalData.isPro,
          remaining_count: this.globalData.remainingCount
        };
      }
      throw error;
    }
  },

  onLaunch() {
    // 在启动时清除可能不一致的登录状态
    this.compulsoryLogin()

    try {
      const token = wx.getStorageSync('token');
      if (token) {
        this.globalData.isLoggedIn = true;
        this.globalData.openid = token;
        console.log('应用启动，恢复登录状态，openid:', token);
      } else {
        this.globalData.isLoggedIn = false;
        this.globalData.openid = null;
        console.log('应用启动，未检测到登录状态');
      }
    } catch (e) {
      console.error('检查登录状态失败:', e);
      // 清除可能损坏的状态
      wx.removeStorageSync('token');
      this.globalData.isLoggedIn = false;
      this.globalData.openid = null;
    }
    
    // 显示分享菜单
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.isLoggedIn = true;
      // 恢复openid
      this.globalData.openid = token;
    }
  },

  // 修改 app.js 中的 doLogin 方法，确保 openid 被正确存储
  async doLogin() {
    try {
      const loginRes = await wx.login();
      if (!loginRes.code) {
        throw new Error('获取code失败');
      }

      const sessionData = await retryRequest(async () => {
        const response = await new Promise((resolve, reject) => {
          wx.request({
            url: 'https://www.duyueai.com/code2session',
            method: 'POST',
            data: { code: loginRes.code },
            success: resolve,
            fail: reject
          });
        });

        // 处理500错误
        if (response.statusCode === 500) {
          throw new Error(response.data.error || '服务器错误');
        }

        if (!response.data.openid) {
          throw new Error('登录失败：' + (response.data.error || '未知错误'));
        }

        return response.data;
      });

      // 保存登录状态
      this.globalData.openid = sessionData.openid;
      this.globalData.isLoggedIn = true;
      wx.setStorageSync('token', sessionData.openid);
      console.log('登录成功, openid:', sessionData.openid);  // 添加详细日志

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      return sessionData;
    } catch (error) {
      console.error('登录失败:', error);
      wx.showModal({
        title: '登录失败',
        content: '服务器暂时繁忙，请稍后再试',
        showCancel: false
      });
      throw error;
    }
  },

  // 检查是否已收藏
  checkIsFavorite(promptId) {
    return this.globalData.favoriteMap.has(promptId);
  },

  // 修改 app.js 中的 addFavorite 方法 (约第272行)
  async addFavorite(promptId) {
    console.log('添加收藏, 原始promptId:', promptId);
    
    if (!this.globalData.openid) {
      throw new Error('未登录');
    }

    // 直接在这里处理ID格式化
    let validId = this.formatPromptId(promptId);
    
    // 如果无法格式化，尝试从历史获取
    if (!validId) {
      console.log('无法格式化ID，尝试获取历史记录');
      try {
        // 简单实现获取历史记录的逻辑
        const res = await new Promise((resolve, reject) => {
          wx.request({
            url: 'https://www.duyueai.com/history',
            method: 'GET',
            data: {
              openid: this.globalData.openid,
              page: 1,
              limit: 1
            },
            success: resolve,
            fail: reject
          });
        });
        
        if (res.statusCode === 200 && res.data.code === 0 && 
            Array.isArray(res.data.data) && res.data.data.length > 0) {
          const historyId = res.data.data[0].prompt_id;
          console.log('获取到历史记录ID:', historyId);
          validId = this.formatPromptId(historyId);
        }
      } catch (err) {
        console.error('获取历史记录失败:', err);
      }
    }
    
    // 仍然没有有效ID，返回错误
    if (!validId) {
      throw new Error('无法获取有效ID');
    }
    
    console.log('添加收藏使用ID:', validId, 'openid:', this.globalData.openid);

    // 发送收藏请求
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://www.duyueai.com/favorite',
          method: 'POST',
          data: {
            openid: this.globalData.openid,
            prompt_id: validId
          },
          header: {
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        });
      });

      console.log('收藏响应:', res);

      if (res.statusCode === 200 && res.data.code === 0) {
        this.globalData.favoriteMap.set(promptId, true);
        this.globalData.favoriteMap.set(validId, true);
        this.notifyFavoriteStateChange(promptId, true);
        return true;
      } else {
        throw new Error(res.data?.msg || '收藏失败');
      }
    } catch (err) {
      console.error('收藏失败:', err);
      throw err;
    }
  },

  // 在 app.js 文件中添加/修改方法 (约第340行)
  // 获取最新历史记录中的ID
  async getLatestPromptIdFromHistory() {
    if (!this.globalData.openid) {
      console.log('未登录，无法获取历史记录');
      return null;
    }
    
    try {
      console.log('正在获取最新历史记录...');
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://www.duyueai.com/history',
          method: 'GET',
          data: {
            openid: this.globalData.openid,
            page: 1, // 只获取第一页，即最新的记录
            limit: 1  // 只需要最新的一条
          },
          success: resolve,
          fail: reject
        });
      });
      
      console.log('历史记录响应:', res);
      
      if (res.statusCode === 200 && res.data.code === 0 && 
          Array.isArray(res.data.data) && res.data.data.length > 0) {
        // 获取最新记录的ID
        const latestId = res.data.data[0].prompt_id;
        console.log('获取到最新历史记录ID:', latestId);
        return latestId;
      }
      
      console.log('未找到有效的历史记录');
      return null;
    } catch (err) {
      console.error('获取历史记录失败:', err);
      return null;
    }
  },

  // 修改 app.js 中的 removeFavorite 方法 (约第320行)
  async removeFavorite(promptId) {
    console.log('取消收藏, 原始promptId:', promptId);
    
    if (!this.globalData.openid) {
      throw new Error('未登录');
    }

    // 直接处理ID格式化
    let validId = this.formatPromptId(promptId);
    
    // 如果无法格式化，尝试从历史获取
    if (!validId) {
      console.log('尝试从缓存中查找相关ID');
      
      // 查看是否有关联ID
      for (const [key, value] of this.globalData.favoriteMap.entries()) {
        if (key !== promptId && value === true) {
          const potentialId = this.formatPromptId(key);
          if (potentialId) {
            console.log('从缓存找到潜在ID:', potentialId);
            validId = potentialId;
            break;
          }
        }
      }
      
      // 仍然没有找到，尝试数字ID 1000+
      if (!validId) {
        validId = "1000"; // 使用一个安全的默认值
        console.log('使用默认ID:', validId);
      }
    }
    
    console.log('取消收藏使用ID:', validId, 'openid:', this.globalData.openid);

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://www.duyueai.com/unfavorite',
          method: 'POST',
          data: {
            openid: this.globalData.openid,
            prompt_id: validId
          },
          header: {
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        });
      });

      console.log('取消收藏响应:', res);

      if (res.statusCode === 200 && res.data.code === 0) {
        this.globalData.favoriteMap.delete(promptId);
        this.globalData.favoriteMap.delete(validId);
        this.notifyFavoriteStateChange(promptId, false);
        return true;
      } else {
        throw new Error(res.data?.msg || '取消收藏失败');
      }
    } catch (err) {
      console.error('取消收藏失败:', err);
      throw err;
    }
  },

  // 新增：带完整数据的收藏方法
  async addFavoriteWithData(promptId, favoriteData) {
    console.log('添加收藏（带数据）, ID:', promptId);
    
    // 首先尝试服务器端收藏
    try {
      if (this.globalData.openid) {
        // 尝试正常的服务器端收藏
        const result = await this.addFavorite(promptId);
        if (result) {
          console.log('服务器端收藏成功');
          return true;
        }
      }
    } catch (err) {
      console.log('服务器端收藏失败，尝试本地收藏:', err.message);
    }
    
    // 服务器端失败或未登录，使用本地收藏
    try {
      // 获取本地收藏列表
      let localFavorites = wx.getStorageSync('local_favorites') || [];
      
      // 检查是否已存在
      const existingIndex = localFavorites.findIndex(item => item.id === promptId);
      if (existingIndex > -1) {
        console.log('本地收藏已存在，更新数据');
        localFavorites[existingIndex] = favoriteData;
      } else {
        console.log('添加新的本地收藏');
        localFavorites.unshift(favoriteData);
      }
      
      // 限制本地收藏数量（最多100条）
      if (localFavorites.length > 100) {
        localFavorites = localFavorites.slice(0, 100);
      }
      
      // 保存到本地存储
      wx.setStorageSync('local_favorites', localFavorites);
      
      // 更新全局收藏状态
      this.globalData.favoriteMap.set(promptId, true);
      this.notifyFavoriteStateChange(promptId, true);
      
      console.log('本地收藏成功');
      return true;
    } catch (err) {
      console.error('本地收藏失败:', err);
      throw new Error('收藏失败，请稍后再试');
    }
  },

  // 通知收藏状态变化
  notifyFavoriteStateChange(promptId, isFavorite) {
    // 获取所有页面实例
    const pages = getCurrentPages();
    
    // 通知每个页面更新收藏状态
    pages.forEach(page => {
      if (typeof page.onFavoriteStateChange === 'function') {
        page.onFavoriteStateChange(promptId, isFavorite);
      }
    });
  },

  // 批量更新收藏状态缓存
  updateFavoriteCache(favorites) {
    this.globalData.favoriteMap.clear();
    favorites.forEach(item => {
      this.globalData.favoriteMap.set(item.id, true);
    });
  },

  logout() {
    console.log('执行退出登录');
    // 清除所有状态
    this.globalData.isLoggedIn = false;
    this.globalData.userInfo = null;
    this.globalData.openid = null;
    this.globalData.isPro = false;
    this.globalData.remainingCount = 0;
    
    wx.removeStorageSync('token');
    console.log('退出登录完成');
  },

  // 在 app.js 中添加或修改 formatPromptId 方法 (约第388行)
  formatPromptId: function(id) {
    // 如果ID为空，返回null
    if (id === null || id === undefined) {
      return null;
    }
    
    // 确保转换为字符串
    let idStr = String(id);
    console.log('格式化前ID:', idStr);
    
    // 尝试提取纯数字部分
    const numericMatches = idStr.match(/\d+/g);
    if (numericMatches && numericMatches.length > 0) {
      // 使用找到的第一组数字
      idStr = numericMatches[0];
      console.log('提取到的数字ID:', idStr);
      return idStr;
    } 
    
    // 如果没有提取到数字，返回null
    console.log('无法从ID中提取数字:', idStr);
    return null;
  },
});