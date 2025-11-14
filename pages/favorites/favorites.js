const { getImageUrl, CDN } = require('../../config/cdn.js');

Page({
  data: {
    favorites: [],
    showDetailModal: false,
    currentItem: null,
    loading: true,
    page: 1,
    hasMore: true,
    // 快速复制功能的状态管理
    extractedPrompt: '',    // 存储提取的完整提示词
    showQuickCopy: false,   // 控制闪电按钮的显示/隐藏
    promptExtracted: false,  // 标记提示词提取状态
    // 新增：模型类型和名称映射
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

  // 新增: 日期转换辅助方法
  convertToDate(input) {
    try {
      // 如果是时间戳或数字字符串
      if (!isNaN(input)) {
        return new Date(Number(input));
      }
      
      // 如果是日期字符串,转换格式
      if (typeof input === 'string') {
        // 将 "yyyy-MM-dd HH:mm:ss" 转换为 "yyyy/MM/dd HH:mm:ss"
        return new Date(input.replace(/-/g, '/'));
      }
      
      return new Date(input);
    } catch (e) {
      console.error('日期转换错误:', e);
      return new Date();
    }
  },

  onLoad() {
    this.loadFavorites();
    
    // 启用分享菜单
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      favorites: [],
      hasMore: true
    }, () => {
      this.loadFavorites();
      wx.stopPullDownRefresh();
    });
  },

  // 🔄 新增：加载更多收藏
  loadMore() {
    console.log('🔄 触发加载更多收藏');
    if (this.data.hasMore && !this.data.loading) {
      this.loadFavorites();
    }
  },

  // 加载收藏数据
  loadFavorites() {
    if (!this.data.hasMore || (this.data.loading && this.data.page > 1)) return;

    // 🔑 修复：参考历史页面，只在第一次加载时显示loading状态
    const isFirstLoad = this.data.page === 1;
    this.setData({ loading: isFirstLoad });

    const app = getApp();
    const openid = app.globalData.openid;

    if (!openid) {
      wx.showToast({
        title: '登录状态异常',
        icon: 'none'
      });
      this.setData({ loading: false });
      return;
    }

    wx.request({
      url: 'https://www.duyueai.com/my_favorites',
      method: 'GET',
      data: {
        openid: openid,
        page: this.data.page,
        limit: 20  // 🔑 修复：每页限制20条
      },
      success: (res) => {
        if (res.data.code === 0 && Array.isArray(res.data.data)) {
          // 🔍 调试：打印收藏API返回的原始数据结构
          if (res.data.data.length > 0) {
            console.log('📚 收藏API返回的第一条数据结构:', res.data.data[0]);
            console.log('📚 关键字段检查:', {
              id: res.data.data[0].id,
              prompt_id: res.data.data[0].prompt_id,
              share_id: res.data.data[0].share_id,
              content: res.data.data[0].content?.substring(0, 50) + '...'
            });
          }
          
          // 🚀 优化：先快速显示内容，再在后台关联历史记录
          console.log('🚀 先快速显示收藏内容...');
          this.processFavoritesWithoutHistory(res.data.data);

          // 🔄 然后在后台异步获取历史记录并更新share_id
          console.log('🔄 后台开始获取历史记录...');
          this.associateWithHistoryAsync(res.data.data);
        } else {
          wx.showToast({
            title: res.data.msg || '加载失败',
            icon: 'none'
          });
          this.setData({
            loading: false,
            hasMore: false
          });
          wx.hideLoading();
        }
      },
      fail: (err) => {
        console.error('加载收藏失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        this.setData({ loading: false });
        wx.hideLoading();
      }
    });
  },

  // 显示详情弹窗 - 集成智能提示词检测
  showDetail(e) {
    const { index } = e.currentTarget.dataset;
    const currentItem = this.data.favorites[index];
    
    // 智能提示词分析：尝试从内容中提取可复用的提示词
    const extractedPrompt = this.extractPromptFromContent(currentItem.optimizedPrompt);
    const hasExtractedPrompt = extractedPrompt.length > 0;
    
    // 为分享功能添加索引信息
    currentItem.index = index;
    
    // 状态同步更新：一次性设置所有相关状态
    this.setData({
      showDetailModal: true,
      currentItem: currentItem,
      extractedPrompt: extractedPrompt,
      showQuickCopy: hasExtractedPrompt,
      promptExtracted: hasExtractedPrompt
    });
    
    // 开发调试信息
    if (hasExtractedPrompt) {
      console.log('收藏内容中检测到可提取的提示词，长度:', extractedPrompt.length);
    }
  },

  // 富文本格式化的核心引擎 - 将原始文本转换为结构化数据
  formatResult(rawResult) {
    // 防御性编程：确保输入有效性
    if (!rawResult || rawResult.trim() === '') {
      return { sections: [] };
    }

    // 预处理：将文本分解为可处理的行
    const lines = rawResult.split('\n');
    const formattedResult = { sections: [] };
    let currentSection = { title: '', content: [], level: 0 };
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLanguage = '';

    // 逐行分析和分类处理
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

      // 标题识别：使用正则表达式匹配Markdown标题语法
      const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        // 当发现新标题时，先保存当前累积的内容
        if (currentSection.content.length > 0 || currentSection.title) {
          formattedResult.sections.push({...currentSection});
        }

        // 创建新的内容区块，level表示标题层级
        currentSection = {
          title: headerMatch[2],
          content: [],
          level: headerMatch[1].length, // #的数量决定层级
          type: 'header'
        };
        return;
      }

      // 分割线识别：连续的横线、星号或下划线
      if (trimmedLine.match(/^[-*_]{3,}$/)) {
        currentSection.content.push({
          type: 'divider',
          text: ''
        });
        return;
      }

      // 引用块识别：以>开头的行
      if (trimmedLine.startsWith('>')) {
        const quoteText = trimmedLine.substring(1).trim();
        currentSection.content.push({
          type: 'quote',
          text: quoteText
        });
        return;
      }

      // 普通文本处理：应用行内格式解析
      if (trimmedLine) {
        currentSection.content.push({
          type: 'text',
          text: trimmedLine,
          formatted: this.parseInlineMarkdown(trimmedLine) // 解析加粗、斜体等
        });
      }
    });

    // 保存最后一个区块
    if (currentSection.content.length > 0 || currentSection.title) {
      formattedResult.sections.push(currentSection);
    }

    return formattedResult;
  },

  // 行内格式解析器 - 处理**加粗**和*斜体*等格式
  parseInlineMarkdown(text) {
    const segments = []; // 存储解析后的文本片段
    let current = '';     // 当前累积的普通文本
    let i = 0;           // 字符索引

    // 逐字符扫描和分析
    while (i < text.length) {
      // 加粗语法检测：**文本**
      if (text.substring(i, i + 2) === '**') {
        // 保存之前累积的普通文本
        if (current) {
          segments.push({ type: 'normal', text: current });
          current = '';
        }
        
        // 寻找匹配的结束标记
        let j = i + 2;
        let boldText = '';
        
        while (j < text.length - 1) {
          if (text.substring(j, j + 2) === '**') {
            segments.push({ type: 'bold', text: boldText });
            i = j + 2; // 跳过结束标记
            break;
          }
          boldText += text[j];
          j++;
        }
        
        // 如果没找到结束标记，按普通文本处理
        if (j >= text.length - 1) {
          current += text.substring(i, i + 2);
          i += 2;
        }
        continue;
      }
      
      // 斜体语法检测：*文本*（但不是列表项）
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
      
      // 普通字符累积
      current += text[i];
      i++;
    }
    
    // 处理剩余的普通文本
    if (current) {
      const hasSpecialMark = current.includes('*') && !current.includes('**');
      segments.push({ 
        type: hasSpecialMark ? 'special' : 'normal', 
        text: current 
      });
    }
    
    return segments;
  },

  // 智能提示词提取器 - 定位并提取可用的提示词部分
  extractPromptFromContent: function(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }
    
    // 寻找内容分界标记：###通常用来分隔提示词和说明文字
    const firstHashIndex = content.indexOf('###');
    
    if (firstHashIndex !== -1) {
      // 提取分界线之前的内容作为纯净提示词
      const extractedPrompt = content.substring(0, firstHashIndex).trim();
      
      // 质量检查：确保提取的内容足够实用
      if (extractedPrompt.length > 30) {
        console.log('✅ 收藏内容中成功提取提示词，长度:', extractedPrompt.length);
        return extractedPrompt;
      }
    }
    
    return '';
  },

  // 快速复制交互处理器
  handleQuickCopyPrompt: function() {
    if (!this.data.extractedPrompt) {
      wx.showToast({
        title: '提示词还未准备好',
        icon: 'none'
      });
      return;
    }
    
    // 调用微信小程序的剪贴板API
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

  // 取消收藏时使用全局方法
  async removeFavorite(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.favorites[index];

    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏这条内容吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await getApp().removeFavorite(item.id);
            
            // 从列表中移除
            const favorites = this.data.favorites.filter((_, i) => i !== index);
            this.setData({
              favorites,
              isEmpty: favorites.length === 0
            });

            // 如果当前显示的是被删除的项，则关闭弹窗
            if (this.data.currentItem && this.data.currentItem.id === item.id) {
              this.closeDetail();
            }
          } catch (err) {
            wx.showToast({
              title: err.message || '操作失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  closeDetail() {
    this.setData({
      showDetailModal: false,
      currentItem: null
    });
  },

  copyContent(e) {
    const { type } = e.currentTarget.dataset;
    const content = this.data.currentItem?.[type === 'original' ? 'originalPrompt' : 'optimizedPrompt'];
    
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
          title: '已全局复制',
          icon: 'success'
        });
      }
    });
  },

  goBack() {
    wx.navigateBack();
  },

  // 更新: formatDate方法现在接收Date对象作为参数
  formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) {
      console.error('无效的日期对象:', date);
      return '';
    }
    
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error('日期格式化错误:', e);
      return '';
    }
  },

  // 精确的模型检测方法 - 基于具体字段组合
  detectModelTypeAndName: function(content) {
    // 文生文模型检测 - 必须同时包含所有对应字段
    
    // 通用模型：需要同时包含这三个字段
    if (content.includes('应用技巧') && 
        content.includes('主要技巧') && 
        content.includes('辅助技巧')) {
      return { type: 'text', name: 'non-reasoning' };
    }
    
    // 推理模型：需要同时包含这两个字段
    if (content.includes('示例思维链') && 
        content.includes('验证机制')) {
      return { type: 'text', name: 'reasoning' };
    }
    
    // AI Agent模型：需要同时包含这两个字段
    if (content.includes('工具集定义') && 
        content.includes('约束条件')) {
      return { type: 'text', name: 'ai-agent' };
    }
    
    // 生图模型检测 - 必须同时包含所有对应字段
    
    // GPT Image生图：需要同时包含这三个字段
    if (content.includes('核心叙事元素优化') && 
        content.includes('主体细节优化') && 
        content.includes('环境细节优化')) {
      return { type: 'image', name: 'GPT Image' };
    }
    
    // FLUX生图：需要同时包含这三个字段
    if (content.includes('主体描述优化') && 
        content.includes('风格与媒介优化') && 
        content.includes('构图与视角优化')) {
      return { type: 'image', name: 'flux' };
    }
    
    // 即梦AI生图：需要同时包含这三个字段
    if (content.includes('主体要素分析') && 
        content.includes('场景要素分析') && 
        content.includes('风格要素分析')) {
      return { type: 'image', name: 'jimeng' };
    }
    
    // 生视频模型检测 - 必须同时包含所有对应字段
    
    // 可灵AI生视频：需要同时包含这三个字段
    if (content.includes('主体描述优化') && 
        content.includes('角色定义') && 
        content.includes('动作表现')) {
      return { type: 'video', name: 'keling' };
    }
    
    // 即梦AI生视频：需要同时包含这三个字段
    if (content.includes('人物特征') && 
        content.includes('姿态描述') && 
        content.includes('环境动态')) {
      return { type: 'video', name: 'jimengvideo' };
    }
    
    // Runway生视频：需要同时包含这三个字段
    if (content.includes('主体与动作优化') && 
        content.includes('背景元素') && 
        content.includes('镜头运动优化')) {
      return { type: 'video', name: 'runway' };
    }
    
    // 如果都没有匹配到，返回默认值
    return { type: 'text', name: 'non-reasoning' };
  },

  // 生成模型标签文本
  generateModelLabel: function(modelType, modelName, style) {
    const typeName = this.data.modelTypeNames[modelType] || '文生文';
    const modelDisplayName = this.data.modelNames[modelName] || '通用模型';
    const styleName = style || '默认';
    return `${typeName} - ${modelDisplayName} - ${styleName}`;
  },

  // 按需获取单条历史记录的share_id
  fetchSingleHistoryRecord(promptId, callback) {
    const app = getApp();
    const openid = app.globalData.openid;

    console.log(`🔍 按需获取单条历史记录，prompt_id: ${promptId}`);

    // 搜索所有历史记录，找到对应的记录
    const searchPages = (page) => {
      wx.request({
        url: 'https://www.duyueai.com/history',
        method: 'GET',
        data: {
          openid: openid,
          page: page,
          limit: 100
        },
        success: (res) => {
          if (res.data.code === 0 && Array.isArray(res.data.data)) {
            const records = res.data.data;

            // 查找匹配的记录
            const matched = records.find(r => r.prompt_id == promptId);
            if (matched) {
              console.log('✅ 找到历史记录:', {
                prompt_id: matched.prompt_id,
                share_id: matched.share_id
              });
              callback(matched.share_id);
              return;
            }

            // 如果当前页有100条记录，继续搜索下一页
            if (records.length === 100 && page < 10) { // 最多搜索10页
              searchPages(page + 1);
            } else {
              console.warn('⚠️ 未找到对应的历史记录');
              callback(null);
            }
          } else {
            callback(null);
          }
        },
        fail: () => {
          callback(null);
        }
      });
    };

    searchPages(1);
  },

  // 分享给朋友
  onShareAppMessage(options) {
    console.log('分享给朋友:', options);

    // 如果是通过自定义分享触发，获取分享的记录信息
    if (options.from === 'button' && options.target && options.target.dataset) {
      const { index } = options.target.dataset;
      const item = this.data.favorites[index];

      if (item.hasValidShareId && item.shareId) {
        const sharePath = `/pages/shared/shared?share_id=${item.shareId}&type=friend`;
        console.log('📤 收藏分享路径:', sharePath);

        // 构建新的分享标题：分享的灵感 - 用户提示词 - 模型场景（风格）
        const userPrompt = item.originalPrompt || item.input || '提示词';
        // 限制提示词长度，避免标题过长
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
      } else {
        console.warn('⚠️ 该收藏没有有效的share_id，无法分享');
        wx.showToast({
          title: '暂时无法分享此内容',
          icon: 'none'
        });

        // 返回默认分享
        return {
          title: '序话 - 我的收藏',
          path: '/pages/favorites/favorites',
          imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)
        };
      }
    }

    // 默认分享
    return {
      title: '序话 - 我的收藏',
      path: '/pages/favorites/favorites',
      imageUrl: '/assets/icons/share-image.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline(options) {
    console.log('分享到朋友圈:', options);

    // 如果是通过自定义分享触发
    if (options.from === 'button' && options.target && options.target.dataset) {
      const { index } = options.target.dataset;
      const item = this.data.favorites[index];

      if (item.hasValidShareId && item.shareId) {
        const shareQuery = `share_id=${item.shareId}&type=timeline`;
        console.log('📤 朋友圈分享路径:', shareQuery);

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
      } else {
        console.warn('⚠️ 该收藏没有有效的share_id，无法分享到朋友圈');
        // 朋友圈分享无法显示toast，只能返回默认分享
        return {
          title: '序话 - AI提示词点亮工具',
          query: 'from=timeline',
          imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)
        };
      }
    }

    // 默认分享
    return {
      title: '序话 - AI提示词点亮工具',
      query: 'from=timeline',
      imageUrl: '/assets/icons/share-image.png'
    };
  },

  // 🔄 异步关联历史记录（后台更新share_id）
  associateWithHistoryAsync(favoriteItems) {
    console.log('🔄 异步开始关联历史记录，收藏数量:', favoriteItems.length);

    // 获取用户的历史记录
    const app = getApp();
    const openid = app.globalData.openid;

    if (!openid) {
      console.warn('⚠️ 用户未登录，无法关联历史记录');
      return;
    }

    // 🚀 优化：只获取当前显示收藏所需的历史记录
    const favoriteIds = favoriteItems.map(item => item.id);
    const minFavoriteId = Math.min(...favoriteIds);
    const maxFavoriteId = Math.max(...favoriteIds);
    console.log('📊 当前页收藏ID范围:', { min: minFavoriteId, max: maxFavoriteId, count: favoriteIds.length });

    // 🎯 智能获取：根据收藏ID范围估算需要的历史记录页数
    this.fetchHistoryForSpecificFavorites(openid, favoriteIds, (allRecords) => {
      console.log('📋 智能获取到历史记录数量:', allRecords.length);

      // 为每个收藏项匹配历史记录
      const enrichedFavorites = this.matchFavoritesWithHistory(favoriteItems, allRecords);

      // 🔄 后台更新：更新标签和share_id，不重复渲染列表
      console.log('🔄 后台更新收藏标签和分享ID...');
      this.updateLabelsAndShareIds(enrichedFavorites);
    });
  },

  // 🔄 后台更新收藏列表中的标签和share_id
  updateLabelsAndShareIds(enrichedFavorites) {
    const currentFavorites = this.data.favorites;

    // 为每个enriched项找到对应的current项并更新标签和share_id
    const updatedFavorites = currentFavorites.map(currentItem => {
      const enrichedItem = enrichedFavorites.find(item => item.id === currentItem.id);

      if (enrichedItem && enrichedItem.has_history_match && enrichedItem.matched_history) {
        console.log(`✅ 后台更新收藏${currentItem.id}的标签和share_id`);

        const historyRecord = enrichedItem.matched_history;

        // 生成正确的模型标签（优先使用历史记录的数据）
        let modelLabel = null;

        // 最高优先级：使用后端返回的最新label字段
        if (historyRecord.label && historyRecord.label.trim()) {
          modelLabel = historyRecord.label.trim();
          console.log('🌟 使用历史记录的后端最新标签:', modelLabel);
        }
        // 次优先级：检查后端是否返回了用户标签
        else if (historyRecord.user_label && historyRecord.user_label.trim()) {
          modelLabel = historyRecord.user_label.trim();
          console.log('🌐 使用历史记录的后端同步标签:', modelLabel);
        }
        // 备选：使用历史记录的model_type、model_name和style组合
        else if (historyRecord.model_type && historyRecord.model_name) {
          const style = historyRecord.style || '默认';
          const typeName = this.data.modelTypeNames[historyRecord.model_type] || historyRecord.model_type;
          const modelDisplayName = this.data.modelNames[historyRecord.model_name] || historyRecord.model_name;
          modelLabel = `${typeName} - ${modelDisplayName} - ${style}`;
          console.log('🔥 使用历史记录的后端最新字段生成标签:', modelLabel);
        }

        // 如果还是没有标签，保持原有标签
        if (!modelLabel) {
          modelLabel = currentItem.modelLabel;
          console.log('⚠️ 保持原有标签:', modelLabel);
        }

        // 根据标签内容确定样式类和模型类型
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

        console.log(`📌 收藏${currentItem.id}更新后标签: "${modelLabel}", 样式类: ${labelClass}, 模型类型: ${modelType}`);

        return {
          ...currentItem,
          modelLabel: modelLabel,
          labelClass: labelClass,
          modelType: modelType,
          shareId: enrichedItem.matched_share_id,
          hasValidShareId: true,
          hasHistoryMatch: true
        };
      }

      return currentItem;
    });

    // 静默更新，用户无感知
    this.setData({ favorites: updatedFavorites });

    console.log('🎉 后台标签和share_id更新完成，分享功能已就绪');
  },

  // 🔄 后台更新收藏列表中的share_id（保留旧方法以防万一）
  updateShareIds(enrichedFavorites) {
    const currentFavorites = this.data.favorites;

    // 为每个enriched项找到对应的current项并更新share_id
    const updatedFavorites = currentFavorites.map(currentItem => {
      const enrichedItem = enrichedFavorites.find(item => item.id === currentItem.id);

      if (enrichedItem && enrichedItem.has_history_match) {
        console.log(`✅ 后台更新收藏${currentItem.id}的share_id:`, enrichedItem.matched_share_id);
        return {
          ...currentItem,
          shareId: enrichedItem.matched_share_id,
          hasValidShareId: true,
          hasHistoryMatch: true
        };
      }

      return currentItem;
    });

    // 静默更新，用户无感知
    this.setData({ favorites: updatedFavorites });

    console.log('🎉 后台share_id更新完成，分享功能已就绪');
  },

  // 🔑 关键方法：通过内容匹配历史记录获取分享ID
  associateWithHistory(favoriteItems) {
    console.log('🔗 开始关联历史记录，收藏数量:', favoriteItems.length);

    // 获取用户的历史记录
    const app = getApp();
    const openid = app.globalData.openid;

    if (!openid) {
      console.warn('⚠️ 用户未登录，无法关联历史记录');
      this.processFavoritesWithoutHistory(favoriteItems);
      return;
    }

    // 找出收藏中最小的ID，确定需要获取多少历史记录
    const favoriteIds = favoriteItems.map(item => item.id);
    const minFavoriteId = Math.min(...favoriteIds);
    console.log('📊 收藏ID范围:', { min: minFavoriteId, max: Math.max(...favoriteIds) });

    // 递归获取历史记录，直到覆盖所有收藏
    this.fetchHistoryUntilCovered(openid, favoriteIds, 1, [], (allRecords) => {
      console.log('📋 获取到足够的历史记录数量:', allRecords.length);

      // 为每个收藏项匹配历史记录
      const enrichedFavorites = this.matchFavoritesWithHistory(favoriteItems, allRecords);
      this.processFavoritesData(enrichedFavorites);
    });
  },

  // 🎯 新增：智能获取指定收藏所需的历史记录
  fetchHistoryForSpecificFavorites(openid, favoriteIds, callback) {
    const minId = Math.min(...favoriteIds);
    const maxId = Math.max(...favoriteIds);

    // 🧠 智能估算：根据ID范围估算需要获取多少页历史记录
    // 假设平均每页有50条记录，历史记录ID是递增的
    // 但为了安全起见，我们还是用渐进式获取，只是更智能地停止
    console.log(`🎯 智能获取策略：需要覆盖ID范围 ${minId} - ${maxId}`);

    this.fetchHistoryUntilCovered(openid, favoriteIds, 1, [], callback);
  },

  // 递归获取历史记录，直到覆盖所有收藏ID
  fetchHistoryUntilCovered(openid, favoriteIds, page, accumulated, callback) {
    wx.request({
      url: 'https://www.duyueai.com/history',
      method: 'GET',
      data: {
        openid: openid,
        page: page,
        limit: 50  // 每次获取50条
      },
      success: (res) => {
        if (res.data.code === 0 && Array.isArray(res.data.data)) {
          const records = res.data.data;
          const allRecords = accumulated.concat(records);

          console.log(`📋 第${page}页：获取${records.length}条记录，累计${allRecords.length}条`);

          // 显示当前页的prompt_id范围
          if (records.length > 0) {
            const currentPageIds = records.map(r => r.prompt_id);
            const minId = Math.min(...currentPageIds);
            const maxId = Math.max(...currentPageIds);
            console.log(`📊 第${page}页ID范围: ${minId} - ${maxId}`);

            // 🚀 智能优化：如果当前页的最大ID都小于最小收藏ID，说明已经超出范围，可以停止
            const minFavoriteId = Math.min(...favoriteIds);
            if (maxId < minFavoriteId) {
              console.log(`🛑 智能停止：历史记录ID(${maxId})已小于最小收藏ID(${minFavoriteId})，无需继续获取`);
              callback(allRecords);
              return;
            }
          }

          // 检查是否已覆盖所有收藏ID
          const coveredIds = new Set(allRecords.map(r => r.prompt_id));
          const uncoveredFavorites = favoriteIds.filter(id => !coveredIds.has(id));

          console.log('🔍 未覆盖的收藏ID:', uncoveredFavorites);
          console.log(`📈 当前覆盖率: ${favoriteIds.length - uncoveredFavorites.length}/${favoriteIds.length}`);

          // 如果还有未覆盖的收藏且当前页返回了数据，继续获取
          if (uncoveredFavorites.length > 0 && records.length > 0 && page < 50) {
            // 延迟100ms避免请求过快
            setTimeout(() => {
              this.fetchHistoryUntilCovered(openid, favoriteIds, page + 1, allRecords, callback);
            }, 100);
          } else {
            // 完成获取或已达到最大页数
            console.log(`✅ 历史记录获取完成，覆盖了${favoriteIds.length - uncoveredFavorites.length}/${favoriteIds.length}个收藏`);
            callback(allRecords);
          }
        } else {
          // 获取失败，返回已累积的记录
          callback(accumulated);
        }
      },
      fail: (err) => {
        console.error(`❌ 获取第${page}页历史记录失败:`, err);
        // 失败时返回已累积的记录
        callback(accumulated);
      }
    });
  },

  // 生成MD5格式的share_id
  generateShareId(content, id) {
    // 使用简单的哈希函数生成类似MD5的32位字符串
    const str = `${content}_${id}_${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    // 转换为32位十六进制字符串
    const hashStr = Math.abs(hash).toString(16);
    const padding = '0'.repeat(32 - hashStr.length);
    return (padding + hashStr).slice(-32);
  },

  // 🔍 优化后的匹配逻辑：直接使用收藏ID作为prompt_id
  matchFavoritesWithHistory(favoriteItems, historyRecords) {
    console.log('🔍 开始匹配收藏和历史记录 - 使用优化的直接ID匹配');
    console.log('🔍 收藏数量:', favoriteItems.length, '历史记录数量:', historyRecords.length);

    return favoriteItems.map(favItem => {
      console.log(`🔍 匹配收藏ID ${favItem.id} (直接作为prompt_id)`);

      // 🔑 关键优化：直接使用收藏ID作为prompt_id进行匹配
      const matchedHistory = historyRecords.find(historyItem =>
        historyItem.prompt_id == favItem.id
      );

      if (matchedHistory) {
        console.log('✅ ID直接匹配成功:', {
          收藏ID: favItem.id,
          历史promptId: matchedHistory.prompt_id,
          历史shareId: matchedHistory.share_id
        });

        // 将历史记录的关键字段合并到收藏项
        return {
          ...favItem,
          matched_prompt_id: matchedHistory.prompt_id,
          matched_share_id: matchedHistory.share_id,
          matched_history: matchedHistory,
          has_history_match: true
        };
      } else {
        console.warn('⚠️ 收藏ID未找到对应历史记录:', favItem.id);

        return {
          ...favItem,
          has_history_match: false
        };
      }
    });
  },

  // 🔄 处理匹配后的收藏数据
  processFavoritesData(enrichedFavorites) {
    console.log('🔄 处理匹配后的收藏数据');

    const newFavorites = enrichedFavorites.map(item => {
      const date = this.convertToDate(item.created_at);

      // 生成模型标签（参考历史记录页面的逻辑）
      let modelLabel = null;

      // 如果有匹配的历史记录，优先使用其数据
      if (item.has_history_match && item.matched_history) {
        const historyRecord = item.matched_history;
        console.log('🔍 收藏记录匹配到历史记录:', {
          收藏ID: item.id,
          历史记录字段: {
            label: historyRecord.label,
            user_label: historyRecord.user_label,
            model_type: historyRecord.model_type,
            model_name: historyRecord.model_name,
            style: historyRecord.style
          }
        });

        // 最高优先级：使用后端返回的最新label字段
        if (historyRecord.label && historyRecord.label.trim()) {
          modelLabel = historyRecord.label.trim();
          console.log('🌟 使用历史记录的后端最新标签:', modelLabel);
        }
        // 次优先级：检查后端是否返回了用户标签
        else if (historyRecord.user_label && historyRecord.user_label.trim()) {
          modelLabel = historyRecord.user_label.trim();
          console.log('🌐 使用历史记录的后端同步标签:', modelLabel);
        }
        // 备选：使用历史记录的model_type、model_name和style组合
        else if (historyRecord.model_type && historyRecord.model_name) {
          const style = historyRecord.style || '默认';
          const typeName = this.data.modelTypeNames[historyRecord.model_type] || historyRecord.model_type;
          const modelDisplayName = this.data.modelNames[historyRecord.model_name] || historyRecord.model_name;
          modelLabel = `${typeName} - ${modelDisplayName} - ${style}`;
          console.log('🔥 使用历史记录的后端最新字段生成标签:', modelLabel, '(style:', style, ')');
        }
        else {
          console.log('⚠️ 历史记录缺少必要字段，无法生成标签');
        }
      }
      else {
        console.log('⚠️ 收藏记录未匹配到历史记录或历史记录为空:', {
          收藏ID: item.id,
          has_history_match: item.has_history_match,
          matched_history存在: !!item.matched_history
        });
      }

      // 如果没有匹配的历史记录或没有获取到标签，使用收藏数据本身
      if (!modelLabel) {
        console.log('🔄 使用收藏数据本身生成标签:', {
          收藏ID: item.id,
          收藏数据字段: {
            label: item.label,
            model_type: item.model_type,
            model_name: item.model_name,
            style: item.style
          }
        });

        // 优先使用收藏数据的label字段
        if (item.label && item.label.trim()) {
          modelLabel = item.label.trim();
          console.log('📚 使用收藏数据的label字段:', modelLabel);
        }
        // 备选：使用收藏数据的字段组合
        else {
          let modelType = item.model_type;
          let modelName = item.model_name;
          let style = item.style || '默认';

          console.log('🔧 收藏数据字段详情:', {
            原始model_type: item.model_type,
            原始model_name: item.model_name,
            原始style: item.style,
            处理后style: style
          });

          if (!modelType || !modelName) {
            const detected = this.detectModelTypeAndName(item.response);
            modelType = item.model_type || detected.type;
            modelName = item.model_name || detected.name;
            console.log('🔍 关键词检测结果:', detected);
          }

          const typeName = this.data.modelTypeNames[modelType] || '文生文';
          const modelDisplayName = this.data.modelNames[modelName] || '通用模型';
          modelLabel = `${typeName} - ${modelDisplayName} - ${style}`;
          console.log('🔧 使用收藏数据的字段组合生成标签:', modelLabel, '(最终style:', style, ')');
        }
      }

      // 根据标签内容确定样式类和模型类型（复用分享页面逻辑）
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
      console.log(`📌 收藏记录${item.id}的最终标签: "${modelLabel}", 样式类: ${labelClass}, 模型类型: ${modelType}`);

      // 🔑 优化：由于收藏ID等于历史prompt_id，直接使用
      let shareId, promptId;
      if (item.has_history_match) {
        // 匹配成功：使用历史记录的share_id（最佳方案）
        shareId = item.matched_share_id;
        promptId = item.matched_prompt_id; // 等于收藏ID
      } else {
        // 未匹配：没有有效的share_id
        shareId = null;  // 明确标记为null
        promptId = item.id; // 收藏ID就是prompt_id
      }

      return {
        id: item.id,  // 保留收藏记录的ID
        promptId: promptId,  // 历史记录的prompt_id
        shareId: shareId,  // 优先使用历史记录的share_id，否则为null
        favoriteId: item.id,  // 明确保存收藏ID
        hasValidShareId: !!shareId && shareId.length > 20,  // 只有真正的MD5格式share_id才有效
        hasHistoryMatch: item.has_history_match,  // 标记是否匹配到历史
        originalPrompt: item.content,
        optimizedPrompt: item.response,
        formattedResult: this.formatResult(item.response),
        timestamp: date.getTime(),
        formattedDate: this.formatDate(date),
        modelLabel: modelLabel,
        labelClass: labelClass,  // 样式类字段
        modelType: modelType     // 模型类型字段
      };
    });

    // 更新全局收藏状态缓存
    getApp().updateFavoriteCache([...this.data.favorites, ...newFavorites]);

    this.setData({
      favorites: [...this.data.favorites, ...newFavorites],
      loading: false,
      page: this.data.page + 1,
      hasMore: newFavorites.length === 20,  // 🔑 修复：只有返回满20条才可能有更多
      isEmpty: this.data.page === 1 && newFavorites.length === 0
    });

    // 🔑 参考历史页面：隐藏任何可能的loading提示
    wx.hideLoading();
  },

  // 🔄 处理无历史记录匹配的情况
  processFavoritesWithoutHistory(favoriteItems) {
    console.log('🔄 处理无历史记录匹配的收藏数据');

    const newFavorites = favoriteItems.map(item => {
      const date = this.convertToDate(item.created_at);

      // 生成模型标签（与processFavoritesData一致的逻辑）
      let modelLabel = null;

      // 优先使用收藏数据的label字段
      if (item.label && item.label.trim()) {
        modelLabel = item.label.trim();
        console.log('📚 使用收藏数据的label字段:', modelLabel);
      }
      // 备选：使用收藏数据的字段组合
      else {
        let modelType = item.model_type;
        let modelName = item.model_name;
        let style = item.style || '默认';

        if (!modelType || !modelName) {
          const detected = this.detectModelTypeAndName(item.response);
          modelType = item.model_type || detected.type;
          modelName = item.model_name || detected.name;
        }

        const typeName = this.data.modelTypeNames[modelType] || '文生文';
        const modelDisplayName = this.data.modelNames[modelName] || '通用模型';
        modelLabel = `${typeName} - ${modelDisplayName} - ${style}`;
        console.log('🔧 使用收藏数据的字段组合生成标签:', modelLabel);
      }

      // 根据标签内容确定样式类和模型类型（复用分享页面逻辑）
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
      console.log(`📌 收藏记录${item.id}(无历史匹配)的最终标签: "${modelLabel}", 样式类: ${labelClass}, 模型类型: ${modelType}`);

      return {
        id: item.id,
        promptId: item.id,  // 收藏ID就是prompt_id
        shareId: item.id,   // 直接使用收藏ID作为share_id
        favoriteId: item.id,
        hasValidShareId: true,
        hasHistoryMatch: false,
        originalPrompt: item.content,
        optimizedPrompt: item.response,
        formattedResult: this.formatResult(item.response),
        timestamp: date.getTime(),
        formattedDate: this.formatDate(date),
        modelLabel: modelLabel,
        labelClass: labelClass,  // 样式类字段
        modelType: modelType     // 模型类型字段
      };
    });

    // 更新状态
    getApp().updateFavoriteCache([...this.data.favorites, ...newFavorites]);

    this.setData({
      favorites: [...this.data.favorites, ...newFavorites],
      loading: false,
      page: this.data.page + 1,
      hasMore: newFavorites.length === 20,  // 🔑 修复：只有返回满20条才可能有更多
      isEmpty: this.data.page === 1 && newFavorites.length === 0
    });

    // 🔑 参考历史页面：隐藏任何可能的loading提示
    wx.hideLoading();
  },

  // 阻止事件冒泡的方法
  stopPropagation(e) {
    console.log("分享按钮点击");
    e.stopPropagation && e.stopPropagation();
    return false;
  }
});