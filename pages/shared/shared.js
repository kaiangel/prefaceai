const { getImageUrl, CDN } = require('../../config/cdn.js');

Page({
  data: {
    sharedContent: null,
    loading: true,
    error: null,
    shareType: 'friend', // friend 或 timeline
    itemId: null,
    // 快速复制功能的状态管理
    extractedPrompt: '',    // 存储提取的完整提示词
    showQuickCopy: false,   // 控制闪电按钮的显示/隐藏
    promptExtracted: false,  // 标记提示词提取状态
    // 与历史页面一致的格式化相关数据
    modelTypeNames: {
      'text': '文生文',
      'image': '生图', 
      'video': '生视频'
    },
    modelNames: {
      'non-reasoning': '通用模型',
      'reasoning': '推理模型',
      'ai-agent': 'AI Agent',
      'GPT Image': 'GPT Image',
      'flux': 'FLUX',
      'jimeng': '即梦AI',
      'midjourney': 'Midjourney',
      'keling': '可灵AI',
      'jimengvideo': '即梦AI',
      'runway': 'Runway',
      'hunyuan': '腾讯混元'
    }
  },

  onLoad(options) {
    console.log('分享页面加载参数:', options);
    
    // 支持三种参数：share_id、fav_id（收藏ID）、id（兼容旧的记录ID）
    const shareId = options.share_id || options.id;
    const favId = options.fav_id;
    const { type } = options;
    
    if (favId) {
      // 处理收藏分享
      this.setData({
        itemId: favId,
        shareType: type || 'favorite',
        isFromFavorite: true
      });
      
      this.loadFavoriteContent(favId);
    } else if (shareId) {
      // 处理普通分享
      this.setData({
        itemId: shareId,
        shareType: type || 'friend',
        isFromFavorite: false
      });
      
      this.loadSharedContent(shareId);
    } else {
      // 如果没有ID参数，显示错误状态
      this.setData({
        loading: false,
        error: '分享链接无效'
      });
    }

    // 启用分享菜单
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 分享给朋友
  onShareAppMessage() {
    const item = this.data.sharedContent;
    if (item) {
      // 根据来源类型构建不同的分享路径
      let sharePath;
      if (this.data.isFromFavorite) {
        sharePath = `/pages/shared/shared?fav_id=${this.data.itemId}&type=favorite`;
      } else {
        sharePath = `/pages/shared/shared?share_id=${this.data.itemId}&type=friend`;
      }
      
      // 构建新的分享标题：分享的灵感 - 用户提示词 - 模型场景（风格）
      const userPrompt = item.originalPrompt || item.input || '提示词';
      const shortPrompt = userPrompt.length > 20 ? userPrompt.substring(0, 20) + '...' : userPrompt;

      // 解析模型标签，将风格用括号包裹
      const modelParts = item.modelLabel.split(' - ');
      let formattedModel = item.modelLabel;
      if (modelParts.length >= 3) {
        // 格式：场景 - 模型 - 风格 -> 模型场景（风格）
        const [scene, model, style] = modelParts;
        formattedModel = `${model}${scene}（${style}）`;
      }

      const shareTitle = `分享的灵感 - ${shortPrompt} - ${formattedModel}`;

      return {
        title: shareTitle,
        path: sharePath,
        imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)
      };
    }
    
    return {
      title: '序话 - AI提示词点亮工具',
      path: '/pages/index/index',
      imageUrl: '/assets/icons/share-image.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const item = this.data.sharedContent;
    if (item) {
      // 根据来源类型构建不同的查询参数
      let shareQuery;
      if (this.data.isFromFavorite) {
        shareQuery = `fav_id=${this.data.itemId}&type=favorite_timeline`;
      } else {
        shareQuery = `share_id=${this.data.itemId}&type=timeline`;
      }
      
      // 构建新的分享标题：分享的灵感 - 用户提示词 - 模型场景（风格）
      const userPrompt = item.originalPrompt || item.input || '提示词';
      const shortPrompt = userPrompt.length > 20 ? userPrompt.substring(0, 20) + '...' : userPrompt;

      // 解析模型标签，将风格用括号包裹
      const modelParts = item.modelLabel.split(' - ');
      let formattedModel = item.modelLabel;
      if (modelParts.length >= 3) {
        // 格式：场景 - 模型 - 风格 -> 模型场景（风格）
        const [scene, model, style] = modelParts;
        formattedModel = `${model}${scene}（${style}）`;
      }

      const shareTitle = `分享的灵感 - ${shortPrompt} - ${formattedModel}`;

      return {
        title: shareTitle,
        query: shareQuery,
        imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)
      };
    }
    
    return {
      title: '序话 - AI提示词点亮工具',
      query: 'from=shared',
      imageUrl: '/assets/icons/share-image.png'
    };
  },

  // 加载分享的内容 - 使用share_id接口
  loadSharedContent(shareId) {
    console.log('加载分享内容, share_id:', shareId);
    
    // 直接调用Ben提供的share_id接口
    this.loadFromShareApi(shareId);
  },

  // 加载收藏的内容 - 使用收藏ID
  loadFavoriteContent(favId) {
    console.log('加载收藏内容, fav_id:', favId);
    
    wx.request({
      url: 'https://www.duyueai.com/my_favorites',
      method: 'GET',
      data: {
        openid: getApp().globalData.openid,
        page: 1,
        limit: 1000  // 设置较大的限制，确保能找到目标收藏
      },
      success: (res) => {
        console.log('收藏API响应:', res.data);
        
        if (res.data.code === 0 && Array.isArray(res.data.data)) {
          // 查找指定的收藏记录
          const targetFavorite = res.data.data.find(item => item.id == favId);
          
          if (targetFavorite) {
            console.log('找到目标收藏记录:', targetFavorite);
            
            // 格式化收藏数据为标准格式
            const formattedItem = this.formatFavoriteRecord(targetFavorite);
            
            // 提取提示词并设置快速复制状态
            const extractedPrompt = this.extractPromptFromContent(formattedItem.result);
            const hasExtractedPrompt = extractedPrompt.length > 0;
            
            this.setData({
              sharedContent: formattedItem,
              loading: false,
              extractedPrompt: extractedPrompt,
              showQuickCopy: hasExtractedPrompt,
              promptExtracted: hasExtractedPrompt
            });
          } else {
            console.error('未找到指定的收藏记录:', favId);
            this.setData({
              loading: false,
              error: '收藏内容不存在或已被删除'
            });
          }
        } else {
          console.error('获取收藏失败:', res.data);
          this.setData({
            loading: false,
            error: res.data.msg || '获取收藏内容失败'
          });
        }
      },
      fail: (err) => {
        console.error('收藏API请求失败:', err);
        this.setData({
          loading: false,
          error: '网络错误，无法加载内容'
        });
      }
    });
  },

  // 使用share_id接口获取分享内容
  loadFromShareApi(shareId) {
    console.log('调用share_id接口获取内容:', shareId);
    
    wx.request({
      url: `https://www.duyueai.com/history/detail`,
      method: 'GET',
      data: {
        share_id: shareId
      },
      success: (res) => {
        console.log('share_id接口响应:', res.data);
        
        if (res.data.code === 0 && res.data.data) {
          const record = res.data.data;
          console.log('成功获取分享内容:', record);
          
          const formattedItem = this.formatHistoryRecord(record);
          
          // 提取提示词并设置快速复制状态
          const extractedPrompt = this.extractPromptFromContent(formattedItem.result);
          const hasExtractedPrompt = extractedPrompt.length > 0;
          
          this.setData({
            sharedContent: formattedItem,
            loading: false,
            extractedPrompt: extractedPrompt,
            showQuickCopy: hasExtractedPrompt,
            promptExtracted: hasExtractedPrompt
          });
        } else {
          console.error('获取分享内容失败:', res.data);
          // 如果share_id接口失败，尝试其他方式
          this.tryLoadFromUserHistory(shareId);
        }
      },
      fail: (err) => {
        console.error('share_id接口请求失败:', err);
        // 降级方案：尝试从用户历史记录中查找
        this.tryLoadFromUserHistory(shareId);
      }
    });
  },

  // 🔄 新增：从用户历史记录中查找
  tryLoadFromUserHistory(id) {
    const app = getApp();
    const openid = app.globalData.openid;
    
    if (openid) {
      console.log('用户已登录，从用户历史记录中查找:', openid);
      
      wx.request({
        url: 'https://www.duyueai.com/history',
        method: 'GET',
        data: {
          openid: openid,
          page: 1
        },
        success: (res) => {
          console.log('用户历史记录API响应:', res.data);
          
          if (res.data.code === 0 && Array.isArray(res.data.data)) {
            // 查找指定ID的记录
            const targetRecord = res.data.data.find(record => 
              record.prompt_id == id || record.prompt_id === id
            );
            
            if (targetRecord) {
              console.log('在用户历史中找到目标记录:', targetRecord);
              const formattedItem = this.formatHistoryRecord(targetRecord);
              this.setData({
                sharedContent: formattedItem,
                loading: false
              });
              return;
            }
          }
          
          // 在用户历史中没找到，尝试公共方式
          this.tryLoadSharedContentPublic(id);
        },
        fail: (err) => {
          console.error('获取用户历史失败:', err);
          this.tryLoadSharedContentPublic(id);
        }
      });
    } else {
      // 用户未登录，直接尝试公共方式
      console.log('用户未登录，直接尝试公共方式');
      this.tryLoadSharedContentPublic(id);
    }
  },

  // 🔄 新增：尝试公共方式访问分享内容
  tryLoadSharedContentPublic(id) {
    console.log('尝试公共方式访问分享内容, ID:', id);
    
    // 🔑 重要：考虑到现有API的限制，我们提供几种渐进式的访问方式
    
    // 方案1: 尝试使用特殊的公共openid标识
    console.log('尝试方案1: 特殊公共openid');
    wx.request({
      url: 'https://www.duyueai.com/history',
      method: 'GET', 
      data: {
        openid: 'PUBLIC_SHARED_ACCESS', // 特殊标识，后端可以识别为公共分享访问
        page: 1,
        prompt_id: id // 指定要获取的记录ID
      },
      success: (res) => {
        console.log('方案1 - 公共访问API响应:', res.data);
        
        if (res.data.code === 0 && Array.isArray(res.data.data)) {
          // 查找指定ID的记录
          const targetRecord = res.data.data.find(record => 
            record.prompt_id == id || record.prompt_id === id
          );
          
          if (targetRecord) {
            console.log('方案1成功 - 找到目标记录:', targetRecord);
            const formattedItem = this.formatHistoryRecord(targetRecord);
            this.setData({
              sharedContent: formattedItem,
              loading: false
            });
            return;
          }
        }
        
        // 方案1失败，尝试方案2
        this.tryLoadContentMinimal(id);
      },
      fail: (err) => {
        console.error('方案1失败:', err);
        this.tryLoadContentMinimal(id);
      }
    });
  },

  // 🔄 新增：最小化参数访问
  tryLoadContentMinimal(id) {
    console.log('尝试方案2: 最小化参数访问, ID:', id);
    
    // 方案2: 只传必要参数，让后端根据prompt_id返回内容
    wx.request({
      url: 'https://www.duyueai.com/history',
      method: 'GET',
      data: {
        prompt_id: id  // 只传ID，看看后端是否支持
      },
      success: (res) => {
        console.log('方案2 - 最小参数API响应:', res.data);
        
        if (res.data.code === 0) {
          let targetRecord = null;
          
          // 处理不同的返回格式
          if (Array.isArray(res.data.data) && res.data.data.length > 0) {
            targetRecord = res.data.data.find(record => 
              record.prompt_id == id || record.prompt_id === id
            ) || res.data.data[0];
          } else if (res.data.data && typeof res.data.data === 'object') {
            // 如果后端直接返回单个对象
            targetRecord = res.data.data;
          }
          
          if (targetRecord) {
            console.log('方案2成功 - 找到目标记录:', targetRecord);
            const formattedItem = this.formatHistoryRecord(targetRecord);
            this.setData({
              sharedContent: formattedItem,
              loading: false
            });
            return;
          }
        }
        
        // 方案2也失败，显示友好的错误信息
        this.showContentNotFound();
      },
      fail: (err) => {
        console.error('方案2失败:', err);
        this.showContentNotFound();
      }
    });
  },

  // 🔄 新增：格式化历史记录（完全复用历史页面逻辑）
  formatHistoryRecord(record) {
    console.log('格式化历史记录:', record);
    
    let modelLabel = null;
    const isLegacy = this.isLegacyRecord(record.created_at);
    
    console.log(`🕒 记录${record.prompt_id}时间: ${record.created_at}, 是否早期记录: ${isLegacy}`);
    
    // 🎯 最高优先级：使用后端返回的最新label字段
    if (record.label && record.label.trim()) {
      modelLabel = record.label.trim();
      console.log('🌟 使用后端最新标签:', modelLabel);
    }
    // 🎯 次优先级：检查后端是否返回了用户标签
    else if (record.user_label && record.user_label.trim()) {
      modelLabel = record.user_label.trim();
      console.log('🌐 使用后端同步标签:', modelLabel);
    } 
    else if (isLegacy) {
      // 📜 早期记录：使用关键词检测逻辑
      console.log('📜 使用早期关键词检测逻辑');
      
      // 1. 优先使用后端提供的字段
      if (record.model_type && record.model_name) {
        const typeName = this.data.modelTypeNames[record.model_type] || record.model_type;
        const modelDisplayName = this.data.modelNames[record.model_name] || record.model_name;
        modelLabel = `${typeName} - ${modelDisplayName}`;
        console.log('🏷️ 后端字段生成标签:', modelLabel);
      } else {
        // 2. 通过内容检测模型类型
        const detected = this.detectModelTypeAndName(record.response);
        const typeName = this.data.modelTypeNames[detected.type] || '文生文';
        const modelDisplayName = this.data.modelNames[detected.name] || '通用模型';
        modelLabel = `${typeName} - ${modelDisplayName}`;
        console.log('🔍 关键词检测生成标签:', modelLabel);
      }
    } else {
      // 🆕 新记录：使用新版映射链路逻辑
      console.log('🆕 使用新版映射链路逻辑');
      
      // 1. 最优先：使用后端提供的model_type和model_name字段
      if (record.model_type && record.model_name) {
        const style = record.style || '默认';
        const typeName = this.data.modelTypeNames[record.model_type] || record.model_type;
        const modelDisplayName = this.data.modelNames[record.model_name] || record.model_name;
        modelLabel = `${typeName} - ${modelDisplayName} - ${style}`;
        console.log('🔥 后端最新字段生成标签:', modelLabel);
      }
    }
    
    // 🔧 最终兜底：如果以上所有方法都失败，使用默认标签
    if (!modelLabel) {
      const modelType = record.model_type || 'text';
      const modelName = record.model_name || 'non-reasoning';
      const style = record.style || '默认';
      const typeName = this.data.modelTypeNames[modelType] || '文生文';
      const modelDisplayName = this.data.modelNames[modelName] || '通用模型';
      modelLabel = `${typeName} - ${modelDisplayName} - ${style}`;
      console.log('🔧 使用默认标签:', modelLabel, '对于记录:', record.prompt_id);
    }
    
    console.log(`📌 记录${record.prompt_id}的最终标签: "${modelLabel}"`);
    
    // 根据标签内容确定样式类和模型类型（复用历史页面逻辑）
    let labelClass = 'text-type'; // 默认文生文
    let modelType = 'text'; // 用于data-type属性
    
    if (modelLabel) {
      if (modelLabel.indexOf('生图') > -1) {
        labelClass = 'image-type';
        modelType = 'image';
      } else if (modelLabel.indexOf('生视频') > -1 || modelLabel.indexOf('视频生成') > -1) {
        labelClass = 'video-type';
        modelType = 'video';
      }
    }
    console.log(`   样式类: ${labelClass}, 模型类型: ${modelType}`);

    return {
      id: record.prompt_id,
      createTime: record.created_at ? record.created_at.split(' ')[0] : '',
      input: record.content || '',
      result: record.response || '',
      formattedResult: this.formatResult(record.response || ''),
      modelLabel: modelLabel,
      labelClass: labelClass,  // 新增：样式类字段
      modelType: modelType,    // 新增：模型类型字段
      isFavorite: false // 分享页面不显示收藏状态
    };
  },

  // 🔄 新增：显示内容未找到
  showContentNotFound() {
    // 测试模式：显示模拟数据
    if (this.isTestMode()) {
      console.log('测试模式：显示模拟分享数据');
      this.showMockSharedContent();
      return;
    }
    
    this.setData({
      loading: false,
      error: '分享的内容暂时无法访问，可能是链接已过期或内容已被删除'
    });
  },

  // 🔧 新增：判断是否为测试模式
  isTestMode() {
    // 可以通过URL参数或其他条件判断
    return this.data.itemId === 'test' || this.data.itemId === 'demo';
  },

  // 🔧 新增：显示模拟分享内容（用于测试）
  showMockSharedContent() {
    const mockContent = {
      id: 'test_001',
      createTime: '2025-01-09',
      input: '帮我写一个关于春天的诗',
      result: `### 春日诗韵

**春风送暖**
绿柳成荫花满枝，
暖阳高照鸟声啼。
最是一年春好处，
万物复苏正当时。

**诗韵解析**
- 春风：象征新的开始
- 绿柳：代表生机勃勃
- 暖阳：寓意希望与光明

> 春天不仅是自然的复苏，更是心灵

### 最终提示词
春日诗韵，绿柳成荫花满枝，暖阳高照鸟声啼。最是一年春好处，万物复苏正当时。春风象征新的开始，绿柳代表生机勃勃，暖阳寓意希望与光明。使用清新、温暖的语言风格，融入自然意象，表达春天的生机与美好。`,
      modelLabel: '文生文 - 推理模型 - 诗歌创作',
      labelClass: 'text-type',  // 添加样式类
      modelType: 'text',        // 添加模型类型
      formattedResult: null
    };
    
    // 格式化模拟内容
    mockContent.formattedResult = this.formatResult(mockContent.result);
    
    // 提取提示词并设置快速复制状态
    const extractedPrompt = this.extractPromptFromContent(mockContent.result);
    
    this.setData({
      sharedContent: mockContent,
      loading: false,
      error: null,
      extractedPrompt: extractedPrompt,
      showQuickCopy: true,  // 测试模式始终显示快速复制按钮
      promptExtracted: true
    });
    return;
  },

  // 生成模型标签（完全复用历史页面逻辑）
  generateModelLabel(record) {
    let modelLabel = null;
    
    // 🎯 最高优先级：使用后端返回的最新label字段
    if (record.label && record.label.trim()) {
      modelLabel = record.label.trim();
      console.log('🌟 使用后端最新标签:', modelLabel);
    }
    // 🎯 次优先级：检查后端是否返回了用户标签
    else if (record.user_label && record.user_label.trim()) {
      modelLabel = record.user_label.trim();
      console.log('🌐 使用后端同步标签:', modelLabel);
    } 
    else {
      // 🆕 使用新版映射链路逻辑
      console.log('🆕 使用新版映射链路逻辑');
      
      // 1. 最优先：使用后端提供的model_type和model_name字段
      if (record.model_type && record.model_name) {
        const style = record.style || '默认';
        const typeName = this.data.modelTypeNames[record.model_type] || record.model_type;
        const modelDisplayName = this.data.modelNames[record.model_name] || record.model_name;
        modelLabel = `${typeName} - ${modelDisplayName} - ${style}`;
        console.log('🔥 后端最新字段生成标签:', modelLabel);
      }
    }
    
    // 🔧 最终兜底：如果以上所有方法都失败，使用后端数据生成默认标签
    if (!modelLabel) {
      const modelType = record.model_type || 'text';
      const modelName = record.model_name || 'non-reasoning';
      const style = record.style || '默认';
      const typeName = this.data.modelTypeNames[modelType] || '文生文';
      const modelDisplayName = this.data.modelNames[modelName] || '通用模型';
      modelLabel = `${typeName} - ${modelDisplayName} - ${style}`;
      console.log('🔧 使用默认标签:', modelLabel);
    }
    
    return modelLabel;
  },

  // 🔄 新增：判断是否为早期记录（复用历史页面逻辑）
  isLegacyRecord(createdAt) {
    if (!createdAt) return false;
    
    // 解析时间字符串，转换为iOS兼容格式
    const recordTime = new Date(createdAt.replace(/-/g, '/'));
    const cutoffTime = new Date('2025/08/19 13:00:00');
    
    return recordTime < cutoffTime;
  },

  // 🔄 新增：早期记录的关键词检测逻辑（复用历史页面）
  detectModelTypeAndName(content) {
    if (!content || typeof content !== 'string') {
      return { type: 'text', name: 'non-reasoning' };
    }

    const text = content.toLowerCase();

    // 文生文模型检测
    if (text.includes('应用技巧') && text.includes('主要技巧') && text.includes('辅助技巧')) {
      return { type: 'text', name: 'non-reasoning' };
    }
    if (text.includes('示例思维链') && text.includes('验证机制')) {
      return { type: 'text', name: 'reasoning' };
    }
    if (text.includes('工具集定义') && text.includes('约束条件')) {
      return { type: 'text', name: 'ai-agent' };
    }

    // 生图模型检测
    if (text.includes('核心叙事元素优化') && text.includes('主体细节优化') && text.includes('环境细节优化')) {
      return { type: 'image', name: 'GPT Image' };
    }
    if (text.includes('主体描述优化') && text.includes('风格与媒介优化') && text.includes('构图与视角优化')) {
      return { type: 'image', name: 'flux' };
    }
    if (text.includes('主体要素分析') && text.includes('场景要素分析') && text.includes('风格要素分析')) {
      return { type: 'image', name: 'jimeng' };
    }

    // 生视频模型检测
    if (text.includes('主体描述优化') && text.includes('角色定义') && text.includes('动作表现')) {
      return { type: 'video', name: 'keling' };
    }
    if (text.includes('人物特征') && text.includes('姿态描述') && text.includes('环境动态')) {
      return { type: 'video', name: 'jimengvideo' };
    }
    if (text.includes('主体与动作优化') && text.includes('背景元素') && text.includes('镜头运动优化')) {
      return { type: 'video', name: 'runway' };
    }

    // 默认返回文生文通用模型
    return { type: 'text', name: 'non-reasoning' };
  },

  // 格式化结果方法（从history.js复制）
  formatResult(rawResult) {
    if (!rawResult || rawResult.trim() === '') {
      return { sections: [] };
    }

    const lines = rawResult.split('\n');
    const formattedResult = { sections: [] };
    let currentSection = { title: '', content: [], level: 0 };
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLanguage = '';

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // 处理代码块标记 ```
      if (trimmedLine.startsWith('```')) {
        if (!inCodeBlock) {
          // 开始代码块
          inCodeBlock = true;
          codeBlockContent = [];
          // 提取语言标签（如果有）
          codeBlockLanguage = trimmedLine.substring(3).trim();
          if (codeBlockLanguage) {
            // 如果有语言标签，将其作为一个特殊的标题
            if (currentSection.content.length > 0 || currentSection.title) {
              formattedResult.sections.push({...currentSection});
            }
            currentSection = {
              title: `[${codeBlockLanguage}]`,
              content: [],
              level: 3,
              type: 'code-block-header'
            };
          }
        } else {
          // 结束代码块，处理累积的内容
          inCodeBlock = false;

          // 处理代码块内的内容，继续解析Markdown格式
          codeBlockContent.forEach(codeLine => {
            const trimmedCodeLine = codeLine.trim();
            if (!trimmedCodeLine) return;

            // 检查是否是标题
            const codeHeaderMatch = trimmedCodeLine.match(/^(#{1,6})\s+(.+)$/);
            if (codeHeaderMatch) {
              // 保存当前section并创建新标题section
              if (currentSection.content.length > 0 || currentSection.title) {
                formattedResult.sections.push({...currentSection});
              }
              currentSection = {
                title: codeHeaderMatch[2],
                content: [],
                level: codeHeaderMatch[1].length,
                type: 'header'
              };
            } else if (trimmedCodeLine.match(/^[-*_]{3,}$/)) {
              // 处理分割线
              currentSection.content.push({
                type: 'divider',
                text: ''
              });
            } else if (trimmedCodeLine.startsWith('>')) {
              // 处理引用块
              const quoteText = trimmedCodeLine.substring(1).trim();
              currentSection.content.push({
                type: 'quote',
                text: quoteText
              });
            } else {
              // 处理普通文本
              currentSection.content.push({
                type: 'text',
                text: trimmedCodeLine,
                formatted: this.parseInlineMarkdown(trimmedCodeLine)
              });
            }
          });

          // 添加分割线标记代码块结束
          currentSection.content.push({
            type: 'divider',
            text: ''
          });
          codeBlockContent = [];
          codeBlockLanguage = '';
        }
        return; // 跳过```本身
      }

      // 如果在代码块中，收集内容但不立即处理
      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // 跳过空行
      if (!trimmedLine) {
        return;
      }

      // 处理标题 (# ## ###)
      const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        // 如果当前section有内容，先保存
        if (currentSection.content.length > 0 || currentSection.title) {
          formattedResult.sections.push({...currentSection});
        }

        // 开始新的section
        currentSection = {
          title: headerMatch[2],
          content: [],
          level: headerMatch[1].length,
          type: 'header'
        };
        return;
      }

      // 处理分割线
      if (trimmedLine.match(/^[-*_]{3,}$/)) {
        currentSection.content.push({
          type: 'divider',
          text: ''
        });
        return;
      }

      // 处理引用块
      if (trimmedLine.startsWith('>')) {
        const quoteText = trimmedLine.substring(1).trim();
        currentSection.content.push({
          type: 'quote',
          text: quoteText
        });
        return;
      }

      // 处理普通文本
      if (trimmedLine) {
        currentSection.content.push({
          type: 'text',
          text: trimmedLine,
          formatted: this.parseInlineMarkdown(trimmedLine)
        });
      }
    });

    // 保存最后一个section
    if (currentSection.content.length > 0 || currentSection.title) {
      formattedResult.sections.push(currentSection);
    }

    return formattedResult;
  },

  // 解析行内Markdown语法（从history.js复制）
  parseInlineMarkdown(text) {
    const segments = [];
    let current = '';
    let i = 0;
    
    while (i < text.length) {
      // 处理加粗 **text**
      if (text.substring(i, i + 2) === '**') {
        if (current) {
          segments.push({ type: 'normal', text: current });
          current = '';
        }
        
        let j = i + 2;
        let boldText = '';
        
        while (j < text.length - 1) {
          if (text.substring(j, j + 2) === '**') {
            segments.push({ type: 'bold', text: boldText });
            i = j + 2;
            break;
          }
          boldText += text[j];
          j++;
        }
        
        if (j >= text.length - 1) {
          current += text.substring(i, i + 2);
          i += 2;
        }
        continue;
      }
      
      // 处理斜体 *text*
      if (text[i] === '*' && text[i + 1] !== '*' && !text.trim().startsWith('*')) {
        if (current) {
          segments.push({ type: 'normal', text: current });
          current = '';
        }
        
        let j = i + 1;
        let italicText = '';
        
        while (j < text.length) {
          if (text[j] === '*' && text[j + 1] !== '*') {
            segments.push({ type: 'italic', text: italicText });
            i = j + 1;
            break;
          }
          italicText += text[j];
          j++;
        }
        
        if (j >= text.length) {
          current += text[i];
          i++;
        }
        continue;
      }
      
      current += text[i];
      i++;
    }
    
    if (current) {
      const hasSpecialMark = current.includes('*') && !current.includes('**');
      segments.push({ 
        type: hasSpecialMark ? 'special' : 'normal', 
        text: current 
      });
    }
    
    return segments;
  },

  // 复制内容
  copyContent(e) {
    const { type } = e.currentTarget.dataset;
    const content = this.data.sharedContent?.[type === 'original' ? 'input' : 'result'];
    
    if (!content) {
      wx.showToast({
        title: '没有可复制的内容',
        icon: 'none'
      });
      return;
    }

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  // 快速复制提示词的处理方法
  handleQuickCopyPrompt() {
    if (!this.data.extractedPrompt) {
      wx.showToast({
        title: '提示词还未准备好',
        icon: 'none'
      });
      return;
    }
    
    wx.setClipboardData({
      data: this.data.extractedPrompt,
      success: () => {
        wx.showToast({
          title: '提示词已复制',
          icon: 'success',
          duration: 2000
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'error'
        });
      }
    });
  },

 // 提取提示词的方法 - 查找第一个"###"之前的内容
  extractPromptFromContent: function(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }
    
    // 查找第一个"###"的位置
    const firstHashIndex = content.indexOf('###');
    
    if (firstHashIndex !== -1) {
      // 提取"###"之前的所有内容作为完整提示词
      const extractedPrompt = content.substring(0, firstHashIndex).trim();
      
      // 确保提取的内容有足够长度且不为空
      if (extractedPrompt.length > 30) {
        console.log('✅ 成功提取完整提示词，长度:', extractedPrompt.length);
        return extractedPrompt;
      }
    }
    
    return '';
  },

  // 返回首页
  goToHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 格式化收藏记录为标准显示格式
  formatFavoriteRecord(record) {
    console.log('格式化收藏记录:', record);
    
    // 检测模型类型和名称
    const modelInfo = this.detectModelTypeAndName(record.response);
    const modelLabel = this.generateModelLabel2(modelInfo.type, modelInfo.name);
    
    return {
      id: record.id,
      input: record.content,
      result: record.response,
      formattedResult: this.formatResult(record.response),
      modelLabel: modelLabel,
      createTime: record.created_at?.split(' ')[0] || '未知日期',
      isFavorite: true,  // 来自收藏的内容标记为已收藏
      isFromFavorite: true  // 标记来源
    };
  },

  // 生成模型标签（专门用于收藏）
  generateModelLabel2(modelType, modelName) {
    const typeName = this.data.modelTypeNames[modelType] || '文生文';
    const modelDisplayName = this.data.modelNames[modelName] || '通用模型';
    return `${typeName} - ${modelDisplayName}`;
  },

  // 重新加载
  retry() {
    if (this.data.itemId) {
      this.setData({
        loading: true,
        error: null
      });
      
      if (this.data.isFromFavorite) {
        this.loadFavoriteContent(this.data.itemId);
      } else {
        this.loadSharedContent(this.data.itemId);
      }
    }
  }
});