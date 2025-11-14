// components/navigation-bar/navigation-bar.js
Component({
  properties: {
    fixed: {
      type: Boolean,
      value: true
    }
  },
 
  data: {
    statusBarHeight: 20, // 默认值
    navBarHeight: 64,    // 默认值
    menuButtonTop: 0,
    showDropdown: false,
    isLoggedIn: false
  },
 
  lifetimes: {
    attached() {
      // 使用新API获取窗口信息
      try {
        // 获取窗口信息
        const windowInfo = wx.getWindowInfo();
        // 获取菜单按钮位置信息
        const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
        
        // 计算导航栏高度
        const navBarHeight = (menuButtonInfo.top - windowInfo.statusBarHeight) * 2 + 
                           menuButtonInfo.height + windowInfo.statusBarHeight;

        this.setData({
          statusBarHeight: windowInfo.statusBarHeight,
          navBarHeight: navBarHeight,
          menuButtonTop: menuButtonInfo.top
        });
      } catch (error) {
        console.error('获取系统信息失败:', error);
        // 使用默认值,确保界面不会错乱
        this.setData({
          statusBarHeight: 20,
          navBarHeight: 64,
          menuButtonTop: 26
        });
      }

      // 检查初始登录状态
      this.checkLoginStatus();
    }
  },

  methods: {
    // 检查登录状态
    checkLoginStatus() {
      const app = getApp();
      const token = wx.getStorageSync('token');
      this.setData({
        isLoggedIn: !!token && app.globalData.isLoggedIn
      });
    },
    
    toggleDropdown() {
      this.checkLoginStatus();
      
      // 清除之前的定时器
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }

      const newState = !this.data.showDropdown;
      this.setData({
        showDropdown: newState
      });

      // 如果是打开状态，设置2.3秒后自动关闭
      if (newState) {
        this.timer = setTimeout(() => {
          this.setData({
            showDropdown: false
          });
          this.timer = null;
        }, 2300);
      }
    },
 
    closeDropdown() {
      this.setData({ showDropdown: false });
    },
    
    setDropdownState(show) {
      if (this.data.showDropdown !== show) {
        this.setData({ showDropdown: show });
      }
    },

    preventTouchMove() {
      return false;
    },
    
    // 统一的导航处理方法
    navigateToPage(url, type = 'navigateTo') {
      this.closeDropdown();
      wx[type]({ 
        url,
        fail: (error) => {
          console.error('页面导航失败:', error);
          wx.showToast({
            title: '导航失败',
            icon: 'none'
          });
        }
      });
    },

    navigateToProfile() {
      this.navigateToPage('/pages/profile/profile');
    },
 
    navigateToHistory() {
      this.navigateToPage('/pages/history/history');
    },

    onHistoryClick() {
      wx.navigateTo({
        url: '/pages/history/history'
      });
    },

    onProfileClick() {
      wx.switchTab({
        url: '/pages/profile/profile'
      });
    },

    handleLoginOrLogout() {
      if (this.data.isLoggedIn) {
        wx.showModal({
          title: '确认退出',
          content: '确定要退出登录吗？',
          success: (res) => {
            if (res.confirm) {
              getApp().logout();
              this.closeDropdown();
              // 重新加载首页
              wx.reLaunch({
                url: '/pages/index/index'
              });
            }
          }
        });
      } else {
        this.navigateToPage('/pages/login/login');
      }
    }
  }
});