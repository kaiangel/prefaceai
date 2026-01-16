const DebugTools = require('./debug-tools.js');
// 从配置文件获取图片URL的帮助函数
const { getImageUrl, CDN } = require('../../config/cdn.js');

Page({
  data: {
    records: [],
    loading: false,
    page: 1,
    hasMore: true,
    searchText: '',
    showDetailModal: false,
    currentItem: null,
    // 新增：快速复制功能相关字段
    extractedPrompt: '', // 提取的完整提示词
    showQuickCopy: false, // 是否显示快速复制按钮
    promptExtracted: false, // 是否已提取完整提示词
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

  // 🔄 新增：微信分享功能
  onLoad() {
    this.loadRecords();
    
    // 启用分享菜单
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 提取图生文场景的主体对象描述
  extractSubjectDescription: function(result) {
    if (!result || typeof result !== 'string') {
      return '';
    }
    
    // 匹配 "【主体对象】" 或 "主体对象" 后面的 "画面主体是" 之后的内容
    const patterns = [
      /【主体对象】[\s\S]*?画面主体是\s*([^\n【]+)/,
      /主体对象[\s\S]*?画面主体是\s*([^\n【]+)/
    ];
    
    for (const pattern of patterns) {
      const match = result.match(pattern);
      if (match && match[1]) {
        let description = match[1].trim();
        // 限制长度，超过30字符用省略号
        if (description.length > 30) {
          description = description.substring(0, 30) + '......';
        }
        return description;
      }
    }
    
    return '';
  },

  // 分享给朋友
  onShareAppMessage(options) {
    console.log('📤 历史记录分享给朋友:', options);

    // 如果是通过自定义分享触发，获取分享的记录信息
    if (options.from === 'button' && options.target && options.target.dataset) {
      const { index } = options.target.dataset;
      const item = this.data.records[index];

      console.log('📤 分享的历史记录项:', {
        index: index,
        item_id: item?.id,
        item_shareId: item?.shareId,
        item_share_id: item?.share_id
      });

      // 使用share_id如果存在，否则使用prompt_id
      const shareId = item.shareId || item.id;
      const sharePath = `/pages/shared/shared?share_id=${shareId}&type=friend`;

      console.log('📤 历史记录分享路径:', sharePath);

      // 构建新的分享标题：分享的灵感 - 用户提示词 - 模型场景（风格）
      const userPrompt = item.input || item.originalPrompt || '提示词';
      const shortPrompt = userPrompt.length > 20 ? userPrompt.substring(0, 20) + '...' : userPrompt;

      // 解析模型标签，将风格用括号包裹
      const modelParts = item.modelLabel.split(' - ');
      let formattedModel = item.modelLabel;
      const [scene, model, style] = modelParts;
      if (modelParts.length >= 3) {
        // 格式：场景 - 模型 - 风格 -> 模型场景（风格）
        formattedModel = `${model}${scene}（${style}）`;
      }

      let shareTitle = `分享的灵感 - ${shortPrompt} - ${formattedModel}`;
      if(scene=="图生文"){
        // 尝试从结果中提取主体对象描述
        const subjectDesc = this.extractSubjectDescription(item.result);
        if (subjectDesc) {
          shareTitle = `分享的灵感 - 识图 - ${subjectDesc}`;
        } else {
          shareTitle = `分享的灵感 - 识图 - GPT Image生图`;
        }
      }
      return {
        title: shareTitle,
        path: sharePath,
        imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)
      };
    }
    
    // 默认分享到首页
    console.warn('⚠️ 历史记录触发默认分享（可能是右上角菜单分享）');
    return {
      title: '序话 - AI提示词点亮工具',
      path: '/pages/index/index',
      imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)
    };
  },

  // 分享到朋友圈
  onShareTimeline(options) {
    console.log('分享到朋友圈:', options);
    
    // 如果是通过自定义分享触发
    if (options.from === 'button' && options.target && options.target.dataset) {
      const { index } = options.target.dataset;
      const item = this.data.records[index];
      
      // 使用share_id如果存在，否则使用prompt_id
      const shareId = item.shareId || item.id;

      // 构建新的分享标题：分享的灵感 - 用户提示词 - 模型场景（风格）
      const userPrompt = item.input || item.originalPrompt || '提示词';
      const shortPrompt = userPrompt.length > 20 ? userPrompt.substring(0, 20) + '...' : userPrompt;

      // 解析模型标签，将风格用括号包裹
      const modelParts = item.modelLabel.split(' - ');
      let formattedModel = item.modelLabel;
      if (modelParts.length >= 3) {
        // 格式：场景 - 模型 - 风格 -> 模型场景（风格）
        const [scene, model, style] = modelParts;
        formattedModel = `${model}${scene}（${style}）`;
      }

      let shareTitle = `分享的灵感 - ${shortPrompt} - ${formattedModel}`;
      
      // 特殊处理图生文场景
      if (modelParts.length >= 3) {
        const [scene] = modelParts;
        if (scene === "图生文") {
          // 尝试从结果中提取主体对象描述
          const subjectDesc = this.extractSubjectDescription(item.result);
          if (subjectDesc) {
            shareTitle = `分享的灵感 - 识图 - ${subjectDesc}`;
          } else {
            shareTitle = `分享的灵感 - 识图 - GPT Image生图`;
          }
        }
      }

      return {
        title: shareTitle,
        query: `share_id=${shareId}&type=timeline`,
        imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)
      };
    }
    
    // 默认分享
    return {
      title: '序话 - AI提示词点亮工具',
      query: 'from=timeline',
      imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)
    };
  },

  // 分享指定记录
  shareRecord(e) {
    const { index, type } = e.currentTarget.dataset;
    const item = this.data.records[index];
    
    if (type === 'friend') {
      // 分享给朋友
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage']
      });
    } else if (type === 'timeline') {
      // 分享到朋友圈
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareTimeline']
      });
    }
  },


  onShow() {
    // 🔑 关键添加：设置TabBar选中状态
    this.setTabBarSelectedIndex(1);
    
    // 🔄 简化刷新逻辑：每次显示页面时正常刷新
    console.log('🔄 历史页面显示，加载最新数据');
    wx.removeStorageSync('needRefreshHistory'); // 清理标记
    
    // 🔑 关键修复：先重置状态，但loading设为false
    this.setData({
      records: [],
      page: 1,
      hasMore: true,
      loading: false // 重要：先设为false，让loadRecords可以执行
    });
    
    // 然后立即调用加载，loadRecords内部会设置loading: true
    this.loadRecords();
  },

  // 添加这个新方法到 pages/history/history.js
  setTabBarSelectedIndex(index) {
    if (typeof this.getTabBar === 'function') {
      const tabBar = this.getTabBar();
      if (tabBar) {
        console.log('设置历史记录TabBar状态，索引:', index);
        tabBar.setSelectedIndex(index);
      } else {
        console.warn('TabBar组件未找到');
      }
    }
  },

  // 早期的关键词检测逻辑（用于2025-08-19 13:00前的记录）
  detectModelTypeAndName: function(content) {
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

  // 生成模型标签
  generateModelLabel: function(modelType, modelName) {
    const typeName = this.data.modelTypeNames[modelType] || '文生文';
    const modelDisplayName = this.data.modelNames[modelName] || '通用模型';
    return `${typeName} - ${modelDisplayName}`;
  },

  // 判断是否为早期记录（2025-08-19 13:00前）
  isLegacyRecord: function(createdAt) {
    if (!createdAt) return false;
    
    // 解析时间字符串 "2025-08-19 15:01:39"，转换为iOS兼容格式
    const recordTime = new Date(createdAt.replace(/-/g, '/'));
    const cutoffTime = new Date('2025/08/19 13:00:00');
    
    return recordTime < cutoffTime;
  },

  goBack() {
    wx.navigateBack();
  },

  // 保留搜索相关方法
  onSearch(e) {
    this.setData({
      searchText: e.detail.value,
      records: [],
      page: 1,
      hasMore: true
    }, () => {
      this.loadRecords();
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

  // 快速复制提示词的处理方法
  handleQuickCopyPrompt: function() {
    if (!this.data.extractedPrompt) {
      wx.showToast({
        title: '提示词还未准备好',
        icon: 'none'
      });
      return;
    }
    
    // 去除 [图片描述] URL 格式的内容
    const imagePattern = /\[([^\]]+)\]\s+(https?:\/\/[^\s]+)/g;
    const cleanedPrompt = this.data.extractedPrompt.replace(imagePattern, '').trim();
    
    wx.setClipboardData({
      data: cleanedPrompt,
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

  // 解析原始提示词内容,支持图片格式: [图片描述] URL
  parseInputContent: function(input) {
    if (!input) return { hasImage: false, text: '', imageUrl: '', imageDesc: '' };
    
    // 匹配格式: [图片描述] URL
    const imagePattern = /\[([^\]]+)\]\s+(https?:\/\/[^\s]+)/;
    const match = input.match(imagePattern);
    
    if (match) {
      return {
        hasImage: true,
        imageDesc: match[1],
        imageUrl: match[2],
        text: input.replace(imagePattern, '').trim() // 移除图片部分后的剩余文本
      };
    }
    
    return {
      hasImage: false,
      text: input,
      imageUrl: '',
      imageDesc: ''
    };
  },

  // 显示详情弹窗
  showDetail(e) {
    const { index } = e.currentTarget.dataset;
    const currentItem = this.data.records[index];
    
    // 解析原始提示词中的图片
    const parsedInput = this.parseInputContent(currentItem.input);
    currentItem.parsedInput = parsedInput;
    
    // 尝试提取提示词（仅对生图/生视频类型的内容）
    const extractedPrompt = this.extractPromptFromContent(currentItem.result);
    const hasExtractedPrompt = extractedPrompt.length > 0;
    
    // 为分享功能添加索引信息
    currentItem.index = index;
    
    this.setData({
      showDetailModal: true,
      currentItem: currentItem,
      // 设置快速复制相关状态
      extractedPrompt: extractedPrompt,
      showQuickCopy: hasExtractedPrompt,
      promptExtracted: hasExtractedPrompt
    });
    
    if (hasExtractedPrompt) {
      console.log('历史记录中检测到可提取的提示词');
    }
    
    if (parsedInput.hasImage) {
      console.log('历史记录中检测到图片:', parsedInput.imageUrl);
    }
  },

  // 格式化结果方法（从index.js复制）
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

  // 解析行内Markdown语法（从index.js复制）
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

  // 关闭详情弹窗
  closeDetail() {
    this.setData({
      showDetailModal: false,
      currentItem: null
    });
  },

  // 复制内容
  copyContent(e) {
    const { type } = e.currentTarget.dataset;
    let content = this.data.currentItem?.[type === 'original' ? 'input' : 'result'];
    
    if (!content) {
      wx.showToast({
        title: '没有可复制的内容',
        icon: 'none'
      });
      return;
    }

    // 去除 [图片描述] URL 格式的内容
    const imagePattern = /\[([^\]]+)\]\s+(https?:\/\/[^\s]+)/g;
    content = content.replace(imagePattern, '').trim();

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

  // 完全重写的模型检测方法 - 基于具体字段组合

  loadRecords() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    // 获取openid
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

    // 调用历史记录接口
    wx.request({
      url: 'https://www.duyueai.com/history',
      method: 'GET',
      data: {
        openid: openid,
        page: this.data.page
      },
      success: (res) => {
        console.log('📋 历史记录API响应:', res.data);
        console.log('📋 请求参数:', { openid: openid, page: this.data.page });
        console.log('📋 响应状态:', res.statusCode, '数据数量:', res.data.data?.length || 0);
        
        if (res.data.code === 0 && Array.isArray(res.data.data)) {
          // 打印第一条记录的完整结构用于调试
          if (res.data.data.length > 0) {
            console.log('📝 第一条历史记录结构:', res.data.data[0]);
            console.log('📝 关键字段检查:', {
              prompt_id: res.data.data[0].prompt_id,
              share_id: res.data.data[0].share_id,
              created_at: res.data.data[0].created_at,
              model_type: res.data.data[0].model_type,
              model_name: res.data.data[0].model_name,
              label: res.data.data[0].label,
              user_label: res.data.data[0].user_label
            });
          }
          
          // 在 history.js 的 loadRecords 方法中修改 - 基于时间的双重逻辑
          const formattedRecords = res.data.data.map(record => {
            let modelLabel = null;
            const isLegacy = this.isLegacyRecord(record.created_at);
            
            console.log(`🕒 记录${record.prompt_id}时间: ${record.created_at}, 是否早期记录: ${isLegacy}`);
            
            // 🎯 最高优先级：使用后端返回的最新label字段（包含最准确的模型信息）
            if (record.label && record.label.trim()) {
              modelLabel = record.label.trim();
              console.log('🌟 使用后端最新标签:', modelLabel);
            }
            // 🎯 次优先级：检查后端是否返回了用户标签（跨端同步）
            else if (record.user_label && record.user_label.trim()) {
              modelLabel = record.user_label.trim();
              console.log('🌐 使用后端同步标签:', modelLabel);
            } 
            else if (isLegacy) {
              // 📜 早期记录：使用关键词检测逻辑
              console.log('📜 使用早期关键词检测逻辑');
              
              // 1. 优先使用后端提供的字段
              if (record.model_type && record.model_name) {
                modelLabel = this.generateModelLabel(record.model_type, record.model_name);
                console.log('🏷️ 后端字段生成标签:', modelLabel);
              } else {
                // 2. 通过内容检测模型类型
                const detected = this.detectModelTypeAndName(record.response);
                modelLabel = this.generateModelLabel(detected.type, detected.name);
                console.log('🔍 关键词检测生成标签:', modelLabel);
              }
            } else {
              // 🆕 新记录：优先使用后端字段，避免过时缓存
              console.log('🆕 使用新版映射链路逻辑');
              
              // 1. 最优先：使用后端提供的model_type和model_name字段（最准确）
              if (record.model_type && record.model_name) {
                const style = record.style || '默认';
                const typeName = this.data.modelTypeNames[record.model_type] || record.model_type;
                const modelDisplayName = this.data.modelNames[record.model_name] || record.model_name;
                modelLabel = `${typeName} - ${modelDisplayName} - ${style}`;
                console.log('🔥 后端最新字段生成标签:', modelLabel);
              }
              // 2. 备选：通过历史记录ID -> 会话ID -> 标签的完整链路
              else {
                const sessionId = app.getSessionIdByHistoryId(record.prompt_id);
                if (sessionId) {
                  modelLabel = app.getSessionLabel(sessionId);
                  if (modelLabel) {
                    console.log('🔗 完整链路获取标签:', record.prompt_id, '->', sessionId, '->', modelLabel);
                  }
                }
                
                // 3. 如果链路查找失败，尝试后端client_session字段
                if (!modelLabel && record.client_session) {
                  modelLabel = app.getSessionLabel(record.client_session);
                  if (modelLabel) {
                    console.log('🎯 通过后端会话ID获取标签:', record.client_session, '->', modelLabel);
                  }
                }
                
                // 4. 最后才尝试通过内容匹配获取标签（可能有过时缓存问题）
                if (!modelLabel && record.content) {
                  modelLabel = app.getLabelByContent(record.content);
                  if (modelLabel) {
                    console.log('🔍 通过内容匹配获取标签:', record.content.substring(0, 20) + '...', '->', modelLabel);
                  }
                }
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
              console.log('🔧 使用默认标签:', modelLabel, '对于记录:', record.prompt_id);
            }
            
            // 调试：打印最终的标签内容
            console.log(`📌 记录${record.prompt_id}的最终标签: "${modelLabel}"`);
            
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
            console.log(`   样式类: ${labelClass}, 模型类型: ${modelType}`);
            
            return {
              id: record.prompt_id,
              shareId: record.share_id || record.prompt_id,  // 使用share_id字段
              createTime: record.created_at.split(' ')[0],
              input: record.content,
              parsedInput: this.parseInputContent(record.content), // 解析图片内容
              result: record.response,
              formattedResult: this.formatResult(record.response),
              isFavorite: record.is_fav === 1,
              modelLabel: modelLabel,
              labelClass: labelClass,  // 新版样式类字段
              modelType: modelType     // 早期data-type属性
            };
          });

          // 🔑 关键修复：合并数据时去重，避免wx:key重复
          const existingIds = new Set(this.data.records.map(record => record.id));
          const newRecords = formattedRecords.filter(record => !existingIds.has(record.id));
          
          console.log(`📝 数据合并：已有${this.data.records.length}条，新增${newRecords.length}条，过滤重复${formattedRecords.length - newRecords.length}条`);
          
          this.setData({
            records: [...this.data.records, ...newRecords],
            page: this.data.page + 1,
            hasMore: formattedRecords.length > 0, // 如果返回空数组,说明没有更多数据
            loading: false
          });
          wx.hideLoading(); // 隐藏loading
        } else {
          // 处理错误情况
          wx.showToast({
            title: res.data.msg || '加载失败',
            icon: 'none'
          });
          this.setData({ 
            loading: false,
            hasMore: false 
          });
          wx.hideLoading(); // 隐藏loading
        }
      },
      fail: (err) => {
        console.error('获取历史记录失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        this.setData({ 
          loading: false,
          hasMore: false 
        });
        wx.hideLoading(); // 隐藏loading
      }
    });
  },

  loadMore() {
    this.loadRecords();
  },

  // 手动刷新历史记录
  forceRefresh() {
    console.log('🔄 用户手动刷新历史记录');
    wx.showLoading({ title: '载入中...' });
    
    // 🔑 关键修复：先重置状态，loading设为false
    this.setData({
      records: [],
      page: 1,
      hasMore: true,
      loading: false // 重要：先设为false，让loadRecords可以执行
    });
    
    // 然后立即调用加载，loadRecords内部会设置loading: true
    this.loadRecords();
  },

  copyResult(e) {
    const index = e.currentTarget.dataset.index;
    let result = this.data.records[index].result;
    
    // 去除 [图片描述] URL 格式的内容
    const imagePattern = /\[([^\]]+)\]\s+(https?:\/\/[^\s]+)/g;
    result = result.replace(imagePattern, '').trim();
    
    wx.setClipboardData({
      data: result,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  deleteRecord(e) {
    const index = e.currentTarget.dataset.index;
    
    wx.showModal({
      title: '确认删除',
      content: '是否删除该记录？',
      success: (res) => {
        if (res.confirm) {
          // TODO: 这里需要调用删除接口
          // 暂时只做UI上的删除
          const records = this.data.records;
          records.splice(index, 1);
          this.setData({ records });
          
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 添加收藏状态更新监听
  onFavoriteStateChange(promptId, isFavorite) {
    const records = this.data.records;
    const index = records.findIndex(item => item.id === promptId);
    
    if (index !== -1) {
      records[index].isFavorite = isFavorite;
      this.setData({ records });
    }
  },

  // 修改toggleFavorite方法
  async toggleFavorite(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.records[index];
    const app = getApp();
    
    try {
      if (item.isFavorite) {
        await app.removeFavorite(item.id);
      } else {
        await app.addFavorite(item.id);
      }
    } catch (err) {
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none'
      });
    }
  },

  // 新增：阻止事件冒泡的方法
  stopPropagation(e) {
    console.log("阻止分享按钮事件冒泡");
    e.stopPropagation && e.stopPropagation();
    return false;
  }
});