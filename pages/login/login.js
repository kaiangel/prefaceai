const { CDN, getImageUrl } = require('../../config/cdn.js');

// pages/login/login.js
Page({
  data: {
    loading: false,
    error: '',
    // 添加 CDN 图片 URL
    logoUrl: getImageUrl(CDN.IMAGES.LOGO)
  },

  onLoad(options) {
    // 检查是否已登录
    if (getApp().globalData.isLoggedIn) {
      wx.reLaunch({  // 使用 reLaunch 而不是 navigateBack
        url: '/pages/index/index'
      });
    }
  },

  async handleLogin() {
    if (this.data.loading) return;
      
    this.setData({
      loading: true,
      error: ''
    });

    try {
      // 登录
      await getApp().doLogin();
      
      // 登录成功后立即检查会员状态
      try {
        await getApp().checkProStatus(true); // 强制检查
      } catch (err) {
        console.error('检查会员状态失败:', err);
        // 继续执行，不阻止跳转
      }
        
      // 登录成功后重启到首页
      wx.reLaunch({
        url: '/pages/index/index'
      });
        
    } catch (err) {
      this.setData({
        error: err.message || '登录失败，请重试'
      });
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  handleImageError(e) {
    console.error('图片加载失败:', e);
    wx.showToast({
      title: '图片加载失败，请检查网络',
      icon: 'none'
    });
  },

  // 处理跳过登录
  handleSkip() {
    // 设置游客模式标识
    getApp().globalData.isGuestMode = true;
    getApp().globalData.isLoggedIn = false;
    
    // 跳转到首页，允许游客浏览
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 处理返回
  handleBack() {
    // 获取页面栈
    const pages = getCurrentPages();
    
    if (pages.length > 1) {
      // 如果有上一页，则返回
      wx.navigateBack({
        delta: 1
      });
    } else {
      // 如果没有上一页（直接打开登录页），则跳转到首页
      wx.reLaunch({
        url: '/pages/index/index'
      });
    }
  }
});