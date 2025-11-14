// custom-tab-bar/index.js
Component({
  data: {
    selected: 0, // 当前选中的tab索引
    color: "#999999", // 未选中时的颜色（灰色）
    selectedColor: "#3da58a", // 选中时的颜色（淡绿色）
    list: [
      {
        pagePath: "/pages/index/index",
        text: "序话",
        iconPath: "/assets/icons/spark.png",
        selectedIconPath: "/assets/icons/spark-active.png"
      },
      {
        pagePath: "/pages/history/history",
        text: "历史记录", 
        iconPath: "/assets/icons/history.png",
        selectedIconPath: "/assets/icons/history-active.png"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        iconPath: "/assets/icons/user.png", 
        selectedIconPath: "/assets/icons/user-active.png"
      }
    ]
  },

  // 组件生命周期：当组件附加到页面时执行
  attached() {
    // 获取当前页面路径，设置对应的选中状态
    this.updateTabBarIndex();
  },

  methods: {
    // 修正版：更新TabBar选中状态的方法
    updateTabBarIndex() {
      const pages = getCurrentPages();
      if (pages.length === 0) return;
      
      const currentPage = pages[pages.length - 1];
      const currentRoute = currentPage.route;
      
      console.log('当前页面路由:', currentRoute); // 调试用，可以删除
      
      // 根据当前页面路径确定选中的tab
      let selectedIndex = 0; // 默认选中首页
      
      // 精确匹配页面路径
      if (currentRoute === 'pages/index/index') {
        selectedIndex = 0;
      } else if (currentRoute === 'pages/history/history') {
        selectedIndex = 1;
      } else if (currentRoute === 'pages/profile/profile') {
        selectedIndex = 2;
      }
      
      console.log('设置TabBar选中索引:', selectedIndex); // 调试用，可以删除
      
      // 更新选中状态
      this.setData({
        selected: selectedIndex
      });
    },

    // 处理tab点击事件
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      const index = data.index;
      
      console.log('点击TabBar:', url, index); // 调试用，可以删除
      
      // 立即更新选中状态，提供即时的视觉反馈
      this.setData({
        selected: index
      });
      
      // 执行页面跳转
      wx.switchTab({ 
        url: url,
        success: () => {
          console.log('页面跳转成功:', url);
        },
        fail: (err) => {
          console.error('页面跳转失败:', err);
          // 如果跳转失败，恢复之前的选中状态
          this.updateTabBarIndex();
        }
      });
    },

    // 供外部页面调用的方法：直接设置选中状态
    setSelectedIndex(index) {
      this.setData({
        selected: index
      });
    }
  }
});