const { CDN, getImageUrl } = require('../../config/cdn.js');

Page({
  data: {
    isLoggedIn: false,
    hasUserInfo: false,
    userInfo: null,  // 初始化为null而不是空对象
    stats: {
      promptCount: 0,
      saveCount: 0
    },
    currentPlan: 'free',
    isEditingNickname: false,
    tempNickname: '',
    showServiceModal: false,
    showPolicyModal: false,
    justPaid: false, // 新增：标记是否刚完成支付
    policyType: '',
    lastModalType: '', // 新增：记录上次打开的类型
    statsLoading: false,
    app: getApp(), // 添加app引用到data中
    qrCodeUrl: getImageUrl(CDN.IMAGES.CUSTOMER_SERVICE_QR)
  },

  onLoad() {
    // onLoad时一定要检查状态
    this.checkLoginStatus();

    // 🔑 像收藏页面那样，直接获取收藏总数，不依赖登录状态判断
    this.loadFavoriteCount();

    // 启用分享菜单
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 🔄 新增：微信分享功能
  // 分享给朋友
  onShareAppMessage(options) {
    console.log('个人中心分享给朋友:', options);
    
    // 根据用户状态定制分享内容
    const userName = this.data.userInfo?.nickName || '微信用户';
    const isProUser = this.data.currentPlan === 'pro';
    
    return {
      title: `${userName}正在使用序话 - ${isProUser ? '专业版会员' : 'AI提示词点亮工具'}`,
      path: '/pages/index/index?from=profile_share',
      imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)
    };
  },

  // 分享到朋友圈
  onShareTimeline(options) {
    console.log('个人中心分享到朋友圈:', options);
    
    const isProUser = this.data.currentPlan === 'pro';
    
    return {
      title: `序话 - ${isProUser ? '专业版AI提示词工具' : 'AI提示词点亮工具'}`,
      query: 'from=profile_timeline',
      imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)
    };
  },

  onShow() {
    if (this.data.justPaid) {
      this.checkLoginStatus();
    }
    // 只在登录状态下加载统计数据
    if (this.data.isLoggedIn) {
      this.loadStats();
    }

    // 🔑 关键添加：设置TabBar选中状态
    this.setTabBarSelectedIndex(2);
  },

  // 添加这个新方法到 pages/profile/profile.js  
  setTabBarSelectedIndex(index) {
    if (typeof this.getTabBar === 'function') {
      const tabBar = this.getTabBar();
      if (tabBar) {
        console.log('设置个人中心TabBar状态，索引:', index);
        tabBar.setSelectedIndex(index);
      } else {
        console.warn('TabBar组件未找到');
      }
    }
  },

  showPrivacyPolicy() {
    console.log('显示隐私政策');
    this.setData({
      policyType: 'privacy',
      showPolicyModal: false
    }, () => {
      setTimeout(() => {
        this.setData({
          showPolicyModal: true
        });
      }, 50);
    });
  },

  showUserAgreement() {
    console.log('显示用户协议');
    this.setData({
      policyType: 'agreement',
      showPolicyModal: false
    }, () => {
      setTimeout(() => {
        this.setData({
          showPolicyModal: true
        });
      }, 50);
    });
  },

  onPolicyModalClose() {
    console.log('关闭弹窗');
    this.setData({
      showPolicyModal: false
    });
  },

  // 修改后的 onChooseAvatar 方法 - 上传头像到后端
  async onChooseAvatar(e) {
    console.log('选择头像:', e.detail);
    const { avatarUrl } = e.detail;
    
    // 立即显示选择的头像，提升用户体验
    this.setData({
      'userInfo.avatarUrl': avatarUrl,
      hasUserInfo: true
    });

    // 显示保存中的提示
    wx.showLoading({
      title: '头像上传中...',
      mask: true
    });

    try {
      // 上传头像到服务器获取URL
      const serverAvatarUrl = await this.uploadAvatarToServer(avatarUrl);
      
      // 更新用户信息到后端
      const app = getApp();
      const openid = app.globalData.openid;
      
      if (!openid) {
        throw new Error('用户未登录');
      }
      
      // 调用更新用户信息接口
      await this.updateUserInfo({
        openid: openid,
        headimgurl: serverAvatarUrl
      });
      
      // 更新为服务器返回的URL
      this.setData({
        'userInfo.avatarUrl': serverAvatarUrl
      });

      // 同步到全局状态
      if (!app.globalData.userInfo) {
        app.globalData.userInfo = {};
      }
      app.globalData.userInfo.avatarUrl = serverAvatarUrl;

      wx.hideLoading();
      wx.showToast({
        title: '头像设置成功',
        icon: 'success'
      });

    } catch (error) {
      wx.hideLoading();
      console.error('头像上传失败:', error);
      
      // 保存失败时恢复到默认头像
      const fallbackUrl = getImageUrl(CDN.IMAGES.DEFAULT_AVATAR);
      this.setData({
        'userInfo.avatarUrl': fallbackUrl
      });
      
      wx.showToast({
        title: '头像设置失败，请重试',
        icon: 'none'
      });
    }
  },

  // 新增方法：上传头像到服务器
  async uploadAvatarToServer(tempFilePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: 'https://www.duyueai.com/upload_image',
        filePath: tempFilePath,
        name: 'file',
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 0 && data.url) {
              console.log('头像上传成功，URL:', data.url);
              resolve(data.url);
            } else {
              reject(new Error(data.msg || '上传失败'));
            }
          } catch (e) {
            reject(new Error('解析服务器响应失败'));
          }
        },
        fail: (error) => {
          console.error('头像上传失败:', error);
          reject(error);
        }
      });
    });
  },

  // 新增方法：更新用户信息到后端
  async updateUserInfo(data) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://www.duyueai.com/update_user_info',
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: data,
        success: (res) => {
          if (res.data && res.data.code === 0) {
            console.log('用户信息更新成功:', res.data);
            resolve(res.data);
          } else {
            reject(new Error(res.data.msg || '更新失败'));
          }
        },
        fail: (error) => {
          console.error('用户信息更新失败:', error);
          reject(error);
        }
      });
    });
  },

  startEditNickname() {
    if (!this.data.isLoggedIn) return;
    
    this.setData({
      isEditingNickname: true,
      tempNickname: this.data.userInfo.nickName
    });
  },

  onNicknameInput(e) {
    this.setData({
      tempNickname: e.detail.value
    });
  },

  // 修改后的 saveNickname 方法 - 上传昵称到后端
  async saveNickname(e) {
    // 从临时存储获取昵称，确保按钮点击时也能正常工作
    const nickname = this.data.tempNickname.trim();
    if (!nickname) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      });
      return;
    }

    // 显示保存中的提示
    wx.showLoading({
      title: '昵称保存中...',
      mask: true
    });

    try {
      // 获取用户openid
      const app = getApp();
      const openid = app.globalData.openid;
      
      if (!openid) {
        throw new Error('用户未登录');
      }
      
      // 调用更新用户信息接口
      await this.updateUserInfo({
        openid: openid,
        nickname: nickname
      });
      
      // 立即更新UI显示
      this.setData({
        'userInfo.nickName': nickname,
        isEditingNickname: false,
        hasUserInfo: true
      });

      // 同步到全局状态
      if (!app.globalData.userInfo) {
        app.globalData.userInfo = {};
      }
      app.globalData.userInfo.nickName = nickname;

      wx.hideLoading();
      wx.showToast({
        title: '昵称设置成功',
        icon: 'success'
      });

    } catch (error) {
      wx.hideLoading();
      console.error('昵称保存失败:', error);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  },

  cancelEditNickname() {
    this.setData({
      isEditingNickname: false
    });
  },

  stopPropagation(e) {
    e.stopPropagation();
  },

  goBack() {
    wx.navigateBack();
  },

  // profile.js
  loadStats() {
    // 显示加载状态
    this.setData({ statsLoading: true });
    
    // 获取实时的剩余次数
    getApp().checkProStatus(true)  // true 表示强制刷新，不使用缓存
      .then(status => {
        // 获取收藏数
        const app = getApp();
        const openid = app.globalData.openid;
        
        // 🔄 修复：使用修复后的直接获取方法
        this.getFavoriteCountDirect(openid, (totalCount) => {
          this.setData({
            stats: {
              promptCount: status.remaining_count || 0,  // 保持原有点亮次数逻辑
              saveCount: totalCount || 0  // 使用真实的收藏总数
            },
            statsLoading: false
          });
        });
      })
      .catch(err => {
        console.error('获取剩余次数失败:', err);
        this.setData({
          stats: {
            promptCount: 0,
            saveCount: 0
          },
          statsLoading: false
        });
      });
  },

  // 修改后的 checkLoginStatus 方法 - 从后端获取用户信息
  async checkLoginStatus() {
    const app = getApp();
    const token = wx.getStorageSync('token');
    
    const isLoggedIn = !!token && app.globalData.isLoggedIn;

    if (isLoggedIn) {
      // 登录状态下，从后端获取用户信息
      const openid = app.globalData.openid;
      
      try {
        // 调用app.js中的用户信息接口获取最新信息
        const userInfoResponse = await app.checkProStatus(true);
        
        let userInfo = {
          avatarUrl: userInfoResponse.headimgurl || getImageUrl(CDN.IMAGES.DEFAULT_AVATAR),
          nickName: userInfoResponse.nickname || '微信用户'
        };
        
        console.log('从后端获取的用户信息:', userInfo);

        this.setData({
          isLoggedIn: true,
          hasUserInfo: !!userInfoResponse.nickname,
          userInfo: userInfo
        });

        // 同步到全局状态
        app.globalData.userInfo = userInfo;

        // 检查会员状态的现有逻辑保持不变
        this.setData({
          currentPlan: userInfoResponse.is_pro ? 'pro' : 'free',
          remainingCount: userInfoResponse.remaining_count || 0,
          justPaid: false,
          app: app
        });
        this.loadStats();
      } catch (err) {
        console.error('获取用户信息失败:', err);
        // 出错时使用默认值
        const userInfo = {
          avatarUrl: getImageUrl(CDN.IMAGES.DEFAULT_AVATAR),
          nickName: '微信用户'
        };
        
        this.setData({
          isLoggedIn: true,
          hasUserInfo: false,
          userInfo: userInfo,
          currentPlan: app.globalData.isPro ? 'pro' : 'free',
          remainingCount: app.globalData.remainingCount || 0,
          app: app
        });
      }
    } else {
      // 未登录时重置状态
      this.setData({
        isLoggedIn: false,
        hasUserInfo: false,
        userInfo: {
          avatarUrl: getImageUrl(CDN.IMAGES.DEFAULT_AVATAR),
          nickName: '未登录'
        },
        currentPlan: 'free',
        remainingCount: 0,
        app: app
      });
    }
  },

  // 修改选择方案逻辑
  async selectPlan(e) {
    const app = getApp();
    const plan = e.currentTarget.dataset.plan;
    
    // 如果已经是专业会员，不响应任何点击
    if (app.globalData.isPro) {
      return;
    }
    
    // 如果点击的是当前计划，不做响应
    if (plan === this.data.currentPlan && !app.globalData.isPro) {
      return;
    }
  
    if (plan === 'pro') {
      wx.showLoading({
        title: '检查会员状态...',
        mask: true
      });
  
      try {
        // 强制检查最新状态
        const status = await Promise.race([
          app.checkProStatus(true),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('请求超时')), 5000)
          )
        ]);
        
        wx.hideLoading();
        
        if (status.is_pro) {
          // 刷新页面状态
          this.setData({
            currentPlan: 'pro',
            app: app
          });
          wx.showToast({
            title: '你已是专业版会员',
            icon: 'none'
          });
          return;
        }
  
        wx.showModal({
          title: '升级到专业版',
          content: '用不了一杯柠檬茶的花费 即可获取168次顶级模型点亮～',
          success: (res) => {
            if (res.confirm) {
              this.handlePayment();
            }
          }
        });
      } catch (err) {
        wx.hideLoading();
        wx.showToast({
          title: err.message || '网络异常，请重试',
          icon: 'none'
        });
      }
    }
  },

  // 在 methods 中添加:
  handlePromptCountClick() {
    if(this.data.stats.promptCount > 0) return;
    
    wx.showModal({
      title: '升级到专业版',
      content: '用不了一杯柠檬茶的花费 即可获取168次顶级模型点亮～',
      success: (res) => {
        if (res.confirm) {
          this.handlePayment();
        }
      }
    });
  },

  handlePaymentSuccess: async function() {
    console.log('支付成功，更新状态');
    this.setData({ justPaid: true });
    
    try {
      const app = getApp();
      await app.checkProStatus(true); // 强制检查最新状态
      
      this.setData({
        currentPlan: 'pro',
        app: app  // 刷新app引用以触发视图更新
      });
      
      wx.showToast({
        title: '升级成功',
        icon: 'success'
      });
    } catch (err) {
      console.error('更新会员状态失败:', err);
      wx.showToast({
        title: '请稍后刷新查看会员状态',
        icon: 'none'
      });
    }
  },
  
  handlePayment() {
    wx.showLoading({
      title: '准备支付...',
      mask: true
    });
    
    wx.request({
      url: 'https://www.duyueai.com/order_prepay',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        openid: getApp().globalData.openid
      },
      success: (res) => {
        wx.hideLoading();
        console.log('预支付响应:', res.data);
        
        if (res.data && res.data.result) {
          wx.requestPayment({
            ...res.data.result,
            success: async (payRes) => {
              await this.handlePaymentSuccess();  // 修改这里，使用独立的处理方法
            },
            fail: (payErr) => {
              console.error('支付失败:', payErr);
              if (payErr.errMsg.indexOf('cancel') > -1) {
                wx.showToast({
                  title: '支付已取消',
                  icon: 'none'
                });
              } else {
                wx.showToast({
                  title: '支付失败，请重试',
                  icon: 'none'
                });
              }
            }
          });
        } else {
          console.error('预支付失败:', res.data);
          wx.showToast({
            title: res.data.error || '创建订单失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('请求失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  navigate(e) {
    const path = e.currentTarget.dataset.path;
    if (path === 'feedback') {
      this.setData({
        showServiceModal: true
      });
    } else {
      wx.navigateTo({
        url: `/pages/${path}/${path}`
      });
    }
  },
  
  closeServiceModal() {
    this.setData({
      showServiceModal: false
    });
  },

  navigateToFavorites() {
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    });
  },

  handleLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  showAbout() {
    wx.showModal({
      title: '关于',
      content: '序话让你从此告别"AI不好用"！',
      showCancel: false
    });
  },

  // 🔑 新增：专门用于profile页面的收藏总数载入（参考收藏页面逻辑）
  loadFavoriteCount() {
    const app = getApp();
    const openid = app.globalData.openid;

    if (!openid) {
      console.log('📊 profile页面：openid未准备好，跳过收藏数量获取');
      return;
    }

    console.log('📊 profile页面开始获取收藏总数...');

    // 🎯 像收藏页面那样直接调用API获取收藏总数
    this.getFavoriteCountDirect(openid, (totalCount) => {
      console.log('✅ profile页面获取到收藏总数:', totalCount);
      this.setData({
        'stats.saveCount': totalCount || 0
      });
    });
  },

  // 🔄 优化：获取收藏总数的直接方法
  getFavoriteCountDirect(openid, callback) {
    let totalCount = 0;
    let page = 1;
    const limit = 20; // 🔑 修复：使用正确的每页数量20条

    const fetchPage = () => {
      console.log(`📋 profile页面：获取第${page}页收藏数据...`);

      wx.request({
        url: 'https://www.duyueai.com/my_favorites',
        method: 'GET',
        data: {
          openid: openid,
          page: page,
          limit: limit
        },
        success: (res) => {
          if (res.data.code === 0 && Array.isArray(res.data.data)) {
            const pageCount = res.data.data.length;
            totalCount += pageCount;

            console.log(`📋 profile页面：第${page}页获取${pageCount}条，累计${totalCount}条`);

            // 🔑 修复：如果当前页有数据且等于limit，可能还有下一页
            if (pageCount === limit && pageCount > 0) {
              page++;
              console.log(`🔄 profile页面：第${page-1}页返回满${limit}条，继续获取第${page}页...`);
              // 延迟一下避免请求过快
              setTimeout(() => {
                fetchPage(); // 递归获取下一页
              }, 100);
            } else {
              // 没有更多数据了，返回总数
              console.log(`✅ profile页面：收藏总数获取完成，共${totalCount}条`);
              callback(totalCount);
            }
          } else {
            // API错误，返回当前已统计的数量
            console.warn('⚠️ profile页面：收藏API返回错误:', res.data);
            callback(totalCount);
          }
        },
        fail: (err) => {
          console.error('❌ profile页面：获取收藏数据失败:', err);
          callback(totalCount);
        }
      });
    };

    fetchPage();
  },

  // 🔄 修复：获取收藏总数（统一使用正确的逻辑）
  getFavoriteCount(openid, callback) {
    // 直接调用修复后的方法，保持接口一致性
    this.getFavoriteCountDirect(openid, callback);
  }
});