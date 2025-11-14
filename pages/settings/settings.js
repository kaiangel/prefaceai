// pages/settings/settings.js
Page({
  data: {
    notificationEnabled: false,
    cacheSize: '0 KB',
    isLoggedIn: false
  },

  onLoad() {
    // 加载通知设置状态
    this.loadNotificationSetting();
    // 计算缓存大小
    this.calculateCacheSize();
    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp();
    const token = wx.getStorageSync('token');
    this.setData({
      isLoggedIn: !!token && app.globalData.isLoggedIn
    });
  },

  goBack() {
    wx.navigateBack();
  },

  // 加载通知设置
  loadNotificationSetting() {
    try {
      const enabled = wx.getStorageSync('notificationEnabled');
      this.setData({
        notificationEnabled: enabled || false
      });
    } catch (e) {
      console.error('加载通知设置失败:', e);
    }
  },

  // 切换通知设置
  toggleNotification(e) {
    const enabled = e.detail.value;
    this.setData({ notificationEnabled: enabled });
    
    // 保存设置到本地存储
    wx.setStorage({
      key: 'notificationEnabled',
      data: enabled,
      fail: (error) => {
        console.error('保存通知设置失败:', error);
        // 还原开关状态
        this.setData({ notificationEnabled: !enabled });
        wx.showToast({
          title: '设置保存失败',
          icon: 'none'
        });
      }
    });
  },

  // 计算缓存大小
  calculateCacheSize() {
    wx.getStorageInfo({
      success: (res) => {
        // 转换缓存大小为合适的单位
        let size = res.currentSize;
        let unit = 'KB';
        
        if (size > 1024) {
          size = (size / 1024).toFixed(1);
          unit = 'MB';
        }
        
        this.setData({
          cacheSize: `${size} ${unit}`
        });
      },
      fail: (error) => {
        console.error('获取缓存信息失败:', error);
        this.setData({
          cacheSize: '获取失败'
        });
      }
    });
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            // 获取所有本地存储的 key
            wx.getStorageInfo({
              success: (res) => {
                // 需要保留的关键数据的 key
                const preserveKeys = ['token', 'userInfo'];
                
                // 遍历所有 key，删除非关键数据
                res.keys.forEach(key => {
                  if (!preserveKeys.includes(key)) {
                    wx.removeStorageSync(key);
                  }
                });
                
                // 重新计算缓存大小
                this.calculateCacheSize();
                
                wx.showToast({
                  title: '清除成功',
                  icon: 'success'
                });
                
                // 重新加载通知设置
                this.loadNotificationSetting();
              }
            });
          } catch (error) {
            console.error('清除缓存失败:', error);
            wx.showToast({
              title: '清除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 退出登录
  handleSignOut() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.logout(); // 调用 app.js 中的 logout 方法
          
          wx.reLaunch({
            url: '/pages/index/index'
          });
        }
      }
    });
  }
});