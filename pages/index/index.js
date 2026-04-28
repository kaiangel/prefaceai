// pages/index/index.js中添加状态常量
// 在文件顶部添加导入
const { CDN, getImageUrl } = require('../../config/cdn.js');

// 🔧 兼容性修复：微信小程序真机环境UTF-8解码工具函数
const utf8Decode = function(uint8Array) {
  try {
    if (uint8Array instanceof ArrayBuffer) {
      uint8Array = new Uint8Array(uint8Array);
    }
    
    // 直接实现UTF-8解码，避免依赖TextDecoder
    let result = '';
    let i = 0;
    
    while (i < uint8Array.length) {
      let byte1 = uint8Array[i];
      let codePoint;
      
      if (byte1 < 0x80) {
        // 单字节字符 (ASCII)
        codePoint = byte1;
        i++;
      } else if (byte1 < 0xE0) {
        // 双字节字符
        let byte2 = uint8Array[i + 1];
        codePoint = ((byte1 & 0x1F) << 6) | (byte2 & 0x3F);
        i += 2;
      } else if (byte1 < 0xF0) {
        // 三字节字符 (包括中文)
        let byte2 = uint8Array[i + 1];
        let byte3 = uint8Array[i + 2];
        codePoint = ((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F);
        i += 3;
      } else {
        // 四字节字符
        let byte2 = uint8Array[i + 1];
        let byte3 = uint8Array[i + 2];
        let byte4 = uint8Array[i + 3];
        codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3F) << 12) | ((byte3 & 0x3F) << 6) | (byte4 & 0x3F);
        i += 4;
      }
      
      result += String.fromCharCode(codePoint);
    }
    
    return result;
  } catch (error) {
    console.error('UTF8解码失败:', error);
    // 降级方案：使用最基础的转换
    return String.fromCharCode.apply(null, uint8Array);
  }
};
// console.log('🔧 已加载UTF8解码工具函数，支持微信小程序真机环境');
// 日志管理器
const LogManager = {
  // 记录已输出的日志，避免重复
  loggedMessages: new Set(),
  
  // 计数器，用于跟踪接收的数据块数量
  chunkCounter: 0,
  
  // 只输出一次的日志
  logOnce: function(message, data) {
    if (!this.loggedMessages.has(message)) {
      this.loggedMessages.add(message); // 修复了这里的bug，应该是add而不是has
      if (data !== undefined) {
        // console.log(message, data);
      } else {
        // console.log(message);
      }
      return true;
    }
    return false;
  },
  
  // 记录数据块接收情况 - 合理采样
  logChunk: function(text) {
    // 仅记录第1个、第5个、第10个及之后每10个数据块
    if (this.chunkCounter === 0 || 
        this.chunkCounter === 5 || 
        this.chunkCounter % 10 === 0) {
      
      
    }
    this.chunkCounter++;
  },
  
  // 清除日志状态 - 在每次开始新的生成时调用
  reset: function() {
    this.loggedMessages.clear();
    this.chunkCounter = 0;
    // console.log("开始新的生成...");
  },
  
  // 添加错误记录方法
  logError: function(context, error, data) {
    console.error(`[${context}] 错误:`, error, data ? data : '');
    // 可以添加错误上报逻辑
  }
};

const RESULT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error'
};

Page({
  data: {
    inputText: '',
    isGenerating: false,
    result: null,
    showResult: false,
    currentPromptId: null,
    currentShareId: null,  // 新增：保存share_id用于分享
    isFavorited: false,
    isLoggedIn: true,  // 新增：登录状态标记
    isSaving: false,  // 新增：保存记录状态    showScrollArrow: false,  // 控制是否显示向下箭头    originalResponse: '', // 保存原始返回内容
    
    // 新增打字效果相关变量
    bufferContent: '', // 缓冲区内容
    isTyping: false,   // 是否正在"打字"
    typingSpeed: 23,   // 打字速度（毫秒/字符）
    typingTimer: null, // 打字定时器
    showCursor: true,  // 是否显示光标
    fullContent: '',   // 完整文本内容
    streamEndSignal: false, // 流结束信号
    currentRequestTask: null, // 当前请求任务
    
    // 新增行缓冲区
    lineBuffer: '', // 用于存储跨数据块的行数据
    debugMode: false,  // 设置为true时会输出更多日志
    currentModelType: 'text', // 'text', 'image', 'video'
    currentModel: 'non-reasoning', // 默认选择推理模型
    keyboardActive: false,
    // 新增：输入框准备状态跟踪
    inputReady: true,  // 标记输入框是否已经完全准备好（避免焦点事件中的异步干扰）
    // 新增：更精确的输入状态控制
    isInputFocused: false,  // 跟踪输入框是否真正获得焦点
    shouldCaptureOutsideClicks: false,  // 控制是否应该捕获外部点击
    cursorPosition: -1, // 新增：光标位置，-1表示不设置
    // 新增：统一的完成检查状态
    completionCheckActive: false,
    lastDataTimestamp: 0,
    contentReceiveComplete: false,

    // 新增：更严格的生成状态管理
    generationSessionId: null,  // 每次生成的唯一ID
    isGenerationActive: false,  // 更严格的生成状态标记
    lastStateChangeTime: 0,     // 最后状态变更时间

    currentStyle: 'practical', // 新增：默认选择"有用"风格
    currentSelectionText: '', // ✅ 新增这个字段
    isCompletelyTerminated: false,  // 新增：完全终止标记

    styleOptions: [
      { id: 'practical', name: '有用', emoji: '📋', description: '（解决问题）' },
      { id: 'interesting', name: '有趣', emoji: '🎯', description: '（新意创作）' },
      { id: 'insightful', name: '有料', emoji: '🔍', description: '（深度分析）' }
    ],

    // 添加模型提示文本映射
    modelPlaceholders: {
      // 文生文模型
      'non-reasoning': "随意写下任何想法，即可一键将其转化为与AI沟通的显著增强版提示词！（例：我要发一封请假邮件 / 我想写个西餐厅的小红书种草文案 / 我想制定一个以周为单位的减肥计划 / 我要学习并吸收马斯克自传这本书的精髓...）",
      'reasoning': "推理模型擅长处理需要多步逻辑推断、因果分析和复杂信息整合的任务，尤其是长文本的深度理解、事实核查和矛盾检测等。例如：帮我总结这篇1万字的访谈稿，并指出其中可能的矛盾和不实之处 / 请分析这份法律文书，帮我找出关键条款和潜在风险 / 帮我对比两篇关于气候变化的报告，指出它们结论上的差异和依据",
      'ai-agent': "Agent擅长执行多步骤、跨工具协作和动态交互的复杂任务，适合自动化内容生成、代码分析、任务规划等场景。例如：帮我分析这个开源项目代码，生成一份详细的README文档 / 请帮我自动整理这批会议纪要，生成行动计划并安排日程提醒 / 帮我写一份市场调研报告，结合外部数据和内部资料，给出策略建议",
      
      // 生图模型
      'GPT Image': "DALL·E的生图模型擅长将抽象或复杂的文字描述转化成图像，适合创意概念可视化和风格模仿。例如：帮我生成一张蓝色神秘黑豹的数字艺术图，风格类似中世纪壁画 / 我要一张未来城市的科幻风景图，带有霓虹灯和飞行汽车 / 帮我做一张梦幻森林的插画，带有发光的蘑菇和精灵",
      'flux': "FLUX以高保真、细节丰富、照片级真实感著称，特别适合生成超写实人物肖像和自然场景。例如：帮我生成一张1536×1536分辨率的超写实人物肖像，皮肤质感自然细腻 / 我要一张高清的自然风光照片，包含晨雾和阳光穿透树林的效果 / 帮我做一张写实风格的宠物狗照片，毛发细节清晰",
      'jimeng': "即梦AI专注于高精度艺术与创意场景，擅长东方美学风格的图像生成。例如：帮我创建一幅水墨山水画风格的龙形意象 / 生成一张带有中国传统纹饰的现代化室内设计图 / 创建一个结合中国古典元素的未来科技场景",
      'lovart': "Lovart擅长将创意想法转化为完整的品牌视觉系统，适合需要从零构建品牌识别或快速迭代设计方案的场景。 作为设计AI智能体，它能智能调度多个AI模型完成复杂设计任务，提供批量生成和专业级编辑能力。例如：帮我为健康轻食品牌设计完整视觉识别，绿色调配手绘植物元素 / 我要为科技创业公司做赛博朋克风格的品牌方案，从logo到网站界面",
      'midjourney': "Midjourney擅长生成风格化、多样化且细节丰富的艺术图像，适合艺术创作和风格探索。例如：帮我做一张数字艺术风格的未来城市夜景，画面要有强烈的光影对比 / 我要一张赛博朋克风格的街头场景，充满霓虹灯和未来感 / 帮我生成一张奇幻风格的龙与骑士插画，色彩丰富且细节精致",
      
      // 生视频模型
      'keling': "可灵擅长建模复杂时空运动，支持高清视频，适合运动场景和多主体动态表现。例如：帮我生成一段高清滑雪运动视频，动作流畅自然 / 我要一段篮球比赛的精彩片段视频，运动员动作细腻 / 帮我做一段多人物街舞表演视频，场景丰富且动态协调",
      'jimengvideo': "即梦AI擅长创新视频体验，特别适合艺术风格短视频和风景转场。例如：帮我生成一段水墨风格的山水动态视频 / 创作一个中国传统文化元素的数字艺术短片 / 制作一段具有东方美学风格的四季变换场景",
      'lovartvideo': "Lovart擅长将文字描述转化为完整的视频故事体验，适合快速制作营销视频、产品演示和品牌动画。 它能从单个提示自动生成故事板、角色设计、场景布局和背景音乐，集成Kling AI、Suno AI等顶级模型，支持多种视频风格。例如：帮我制作一个35秒的香水品牌广告，包含背景音乐和配音旁白 / 我要为智能家居产品做6帧故事板的宣传视频，展示产品核心功能",
      'runway': "Runway擅长保持角色和场景高度一致性，支持多视角切换，适合影视级别创作和连贯动作表现。例如：帮我生成一个角色在不同场景下连贯动作的视频，保持人物外观一致 / 我要一段短片，展示同一角色在城市和森林两种环境中的活动 / 帮我做一段多镜头切换的动作戏，保证人物动作流畅且连贯",
      'wanxiang': "通义万相擅长将复杂描述转化为高质动态视频，特别在中文特效生成和电影级运镜方面表现突出，适合专业视频制作和创意生成。例如：帮我生成一段水墨风格的‘新年快乐’文字动效视频，墨汁在宣纸上自然晕染 / 我要一个摩托车手穿越爆炸场景的电影级动作视频，包含慢镜头和特写切换 / 帮我做一段汉服美女在古典园林中翩翩起舞的唯美视频，配合传统音乐节拍",
      'Sora2': "Sora2擅长电影级视听同步创作和真实物理模拟，支持10秒1080p生成（GPT Pro会员20秒），适合需要精准音画协同和复杂物理互动的专业内容制作。例：帮我生成一个女性在雨夜东京街头行走的视频，包含靴子踩水声、远处交通声和霓虹灯电流声 / 一段猫跳舞的片段，围巾随动作自然飘动，地板反射真实 / 做一个篮球投篮不中的视频，球从篮板真实反弹而非消失",
    },

    modelTypeNames: {
      'text': '文生文',     // ✅ 与标签页显示的文字保持一致
      'image': '生图', 
      'video': '生视频'
    },
    modelNames: {
      'non-reasoning': '通用模型',   // ✅ 与卡片显示的文字一致
      'reasoning': '推理模型',
      'ai-agent': 'AI Agent', // 新增AI Agent模型
      'GPT Image': 'DALL·E',
      'flux': 'FLUX',
      'jimeng': '即梦AI',
      'lovart': 'Lovart',
      'midjourney': 'Midjourney',
      'keling': '可灵AI',
      'jimengvideo': '即梦AI',
      'lovartvideo': 'Lovart',
      'runway': 'Runway',
      'wanxiang': '通义万相',
      'Sora2': 'Sora2', // Sora2模型
    },
    // 添加模型图标映射
    modelIcons: {
      'reasoning': getImageUrl(CDN.IMAGES.MODEL_REASONING),
      'non-reasoning': getImageUrl(CDN.IMAGES.MODEL_NON_REASONING),
      'ai-agent': getImageUrl(CDN.IMAGES.MODEL_AI_AGENT), // AI Agent logo
      'GPT Image': getImageUrl(CDN.IMAGES.MODEL_GPT_Image), // 修改这一行
      'flux': getImageUrl(CDN.IMAGES.MODEL_FLUX),
      'jimeng': getImageUrl(CDN.IMAGES.MODEL_JIMENG), // 需要在CDN.js中添加路径
      'lovart': getImageUrl(CDN.IMAGES.MODEL_LOVART), // Lovart logo
      'midjourney': getImageUrl(CDN.IMAGES.MODEL_MIDJOURNEY),
      'keling': getImageUrl(CDN.IMAGES.MODEL_KELING),
      'jimengvideo': getImageUrl(CDN.IMAGES.MODEL_JIMENG), // 需要在CDN.js中添加路径
      'lovartvideo': getImageUrl(CDN.IMAGES.MODEL_LOVART), // Lovart视频logo
      'runway': getImageUrl(CDN.IMAGES.MODEL_RUNWAY),
      'wanxiang': getImageUrl(CDN.IMAGES.MODEL_WANXIANG), // 通义万相logo
      'Sora2': getImageUrl(CDN.IMAGES.MODEL_SORA2)
    },

    // 添加模型显示控制
    modelVisibility: {
      midjourney: true,  // 设为false表示隐藏Midjourney
    },

    // 新增：快速复制提示词功能相关变量
    extractedPrompt: '', // 提取的完整提示词
    showQuickCopy: false, // 是否显示快速复制按钮
    promptExtracted: false, // 是否已提取完整提示词
    
    // 新增：输入模式切换
    inputMode: 'idea', // 'idea' 或 'reference'
    referenceImage: '', // 参考图片路径(本地)
    referenceImageUrl: '', // 参考图片URL(服务器)
    referenceText: '', // 参考模式下的输入文本

    // Stage 2 D018a: 上下文注入(C 方案)— 「✨ 基于此继续优化」最多 3 轮
    refinementRound: 0,            // 当前迭代轮次,0 = 初次生成,1-3 = 第 N 次基于上轮优化
    MAX_REFINEMENT_ROUNDS: 3,      // D018a 上限(前端硬约束,后端不感知)
    previousOutput: '',            // 上一轮 output(将作为下一轮 context_prompt 注入)
  },

  // Stage 2 D018a: 点击「✨ 基于此继续优化」— 把当前 result 注入下一次 generateContent 的 context_prompt
  onRefineFromCurrent: function() {
    if (this.data.refinementRound >= this.data.MAX_REFINEMENT_ROUNDS) {
      wx.showToast({ title: '已达 3 轮上限', icon: 'none' });
      return;
    }
    if (!this.data.fullContent) {
      wx.showToast({ title: '暂无可优化内容', icon: 'none' });
      return;
    }
    // 把当前轮的 fullContent 作为下一轮的上下文存起来,然后 +1 轮触发标准 generate 流程
    this.setData({
      previousOutput: this.data.fullContent,
      refinementRound: this.data.refinementRound + 1
    });
    // 走原 onGeneratePrompt(它会调 generateContent / generateImageDescription),由它在 body / URL 里挂 context_prompt
    this.onGeneratePrompt();
  },

  // 新增：切换风格的方法
  switchStyle: function(e) {
    const styleId = e.currentTarget.dataset.style;
    this.setData({
        currentStyle: styleId
    });
    // console.log('切换到风格:', styleId);

    this.updateCurrentSelectionText(); // ✅ 在每个切换方法的最后添加
  },

  // 新增：动态获取API端点的方法（在methods中添加）
  getApiEndpoint: function(modelName, styleId) {
    const baseEndpoints = {
        'non-reasoning': 'https://www.duyueai.com/botPromptStream',
        'reasoning': 'https://www.duyueai.com/reasoningStream',
        'ai-agent': 'https://www.duyueai.com/aiAgentStream',
        'GPT Image': 'https://www.duyueai.com/dalleStream',
        'flux': 'https://www.duyueai.com/fluxStream',
        'jimeng': 'https://www.duyueai.com/jimengpicStream',
        'lovart': 'https://www.duyueai.com/lovartpicStream',
        'midjourney': 'https://www.duyueai.com/midjourneyStream',
        'keling': 'https://www.duyueai.com/kelingStream',
        'jimengvideo': 'https://www.duyueai.com/jimengvidStream',
        'lovartvideo': 'https://www.duyueai.com/lovartvidStream',
        'runway': 'https://www.duyueai.com/runwayStream',
        'wanxiang': 'https://www.duyueai.com/wanxiangStream',
        'Sora2': 'https://www.duyueai.com/sora2Stream', // Sora2视频模型
    };
    
    // 修正：所有风格都使用相同的基础URL，通过style参数区分风格，不再拼接到URL
    return baseEndpoints[modelName];
  },
  updateCurrentSelectionText: function() {
    const typeName = this.data.modelTypeNames[this.data.currentModelType];
    const modelName = this.data.modelNames[this.data.currentModel];
    const styleOption = this.data.styleOptions.find(s => s.id === this.data.currentStyle);
    
    // 根据模型类型确定风格描述
    let styleDescription = '';
    if (this.data.currentModelType === 'text') {
      // 文生文的风格描述
      const textDescriptions = {
        'practical': '（解决问题）',
        'interesting': '（新意创作）', 
        'insightful': '（深度分析）'
      };
      styleDescription = textDescriptions[this.data.currentStyle] || '（解决问题）';
    } else {
      // 生图和生视频的风格描述
      const mediaDescriptions = {
        'practical': '（直接可用）',
        'interesting': '（创意吸睛）',
        'insightful': '（专业艺术）'
      };
      styleDescription = mediaDescriptions[this.data.currentStyle] || '（直接可用）';
    }
    
    const styleText = styleOption ? `${styleOption.name}${styleDescription}` : '有用（解决问题）';
    const selectionText = `${typeName} - ${modelName} - ${styleText}`;
    
    this.setData({
      currentSelectionText: selectionText
    });
  },

  // 2. 检查当前是否为生图或生视频模型
  isImageOrVideoModel: function() {
    return this.data.currentModelType === 'image' || this.data.currentModelType === 'video'||this.data.inputMode=='reference' ;
  },

  // 3. 重置快速复制相关状态
  resetQuickCopyState: function() {
    this.setData({
      extractedPrompt: '',
      showQuickCopy: false,
      promptExtracted: false
    });
  },

  // 添加切换模型类型的方法
  switchModelType: function(e) {
    const type = e.currentTarget.dataset.type;
    let defaultModel;
    
    // 根据类型设置默认模型
    switch(type) {
      case 'text':
        defaultModel = 'non-reasoning';
        break;
      case 'image':
        defaultModel = 'GPT Image';
        break;
      case 'video':
        defaultModel = 'keling';
        break;
      default:
        defaultModel = 'non-reasoning';
    }
    
    // 获取对应模型的提示文本
    const placeholder = this.data.modelPlaceholders[defaultModel];
    
    this.setData({
      currentModelType: type,
      currentModel: defaultModel,
      // 同时更新输入框提示文本
      currentPlaceholder: placeholder
    });

    this.updateCurrentSelectionText(); // ✅ 在每个切换方法的最后添加
  },

  // 修改selectModel方法
  selectModel: function(e) {
    const model = e.currentTarget.dataset.model;
    // 获取对应模型的提示文本
    const placeholder = this.data.modelPlaceholders[model];
    
    this.setData({
      currentModel: model,
      // 同时更新输入框提示文本
      currentPlaceholder: placeholder
    });

    this.updateCurrentSelectionText(); // ✅ 在每个切换方法的最后添加
  },

  // 新增：切换输入模式
  switchInputMode: function(e) {
    const mode = e.currentTarget.dataset.mode;
    // console.log('切换输入模式:', mode);
    
    // 重置所有状态
    this.setData({
      inputMode: mode,
      // 重置输入内容
      inputText: '',
      // 重置参考模式相关
      referenceImage: '',
      referenceImageUrl: '',
      referenceText: '',
      // 重置结果显示
      result: null,
      showResult: false,
      isGenerating: false
    });
    
    // 如果切换到参考模式,重置组件
    if (mode === 'reference') {
      // console.log('已切换到参考模式,重置组件');
      // 延迟执行,确保组件已渲染
      setTimeout(() => {
        const referenceInput = this.selectComponent('#referenceInput');
        if (referenceInput) {
          referenceInput.reset();
        }
      }, 100);
    } else {
      // console.log('已切换到想法模式');
    }
  },

  // 新增：处理参考图片选择
  onReferenceImageSelected: function(e) {
    const imagePath = e.detail.imagePath;
    // console.log('参考图片已选择:', imagePath);
    
    this.setData({
      referenceImage: imagePath
    });
  },

  // 新增：处理图片上传完成
  onReferenceImageUploaded: function(e) {
    const imageUrl = e.detail.imageUrl;
    // console.log('图片上传成功,URL:', imageUrl);
    
    // 只保存URL,不自动生成描述
    this.setData({
      referenceImageUrl: imageUrl
    });
    
    // console.log('等待用户点击"点亮灵感"按钮');
  },

  // 新增：处理参考图片移除
  onReferenceImageRemoved: function() {
    // console.log('参考图片已移除');
    
    this.setData({
      referenceImage: ''
    });
  },

  // 新增：处理参考模式输入变化
  onReferenceInputChange: function(e) {
    const text = e.detail.text;
    // console.log('参考模式输入变化:', text);

    var patch = { referenceText: text };
    // Stage 2 D018a: 用户改参考输入文本 → 视为开启新主题,重置上下文注入链
    if (this.data.refinementRound > 0) {
      patch.refinementRound = 0;
      patch.previousOutput = '';
    }
    this.setData(patch);
  },

  // 生成图片描述(SSE流式)
  generateImageDescription: function(imageUrl, content = '') {
    // console.log('开始生成图片描述,imageUrl:', imageUrl, 'content:', content);
    
    // 获取openid
    const openid = wx.getStorageSync('token');
    
    // 构建SSE请求URL,添加content参数
    let url = `https://www.duyueai.com/describeImageStream?openid=${openid}&image_url=${encodeURIComponent(imageUrl)}`;
    if (content) {
      url += `&content=${encodeURIComponent(content)}`;
    }
    // 🔑 Stage 2 D018a: 上下文注入(C 方案)— 仅在 refinementRound > 0 时挂 context_prompt
    if (this.data.refinementRound > 0 && this.data.previousOutput) {
      url += `&context_prompt=${encodeURIComponent(this.data.previousOutput)}`;
    }

    // console.log('请求URL:', url);
    
    // 🔑 生成会话ID，用于appendToBuffer验证
    const sessionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_img_desc';
    console.log('🚀 开始图片描述生成会话:', sessionId);
    
    // 初始化状态
    this.setData({
      generationSessionId: sessionId,  // 🔑 添加会话ID
      isGenerationActive: true,
      lastStateChangeTime: Date.now(),
      isGenerating: true,
      showScrollArrow:true,
      fullContent: '',
      bufferContent: '',
      isTyping: false,  // 🔑 重置打字状态
      result: {
        sections: [{
          title: '',
          level: 1,
          content: []
        }]
      },
      showResult: true,
      showCursor: true,
      streamEndSignal: false,
      currentRequestTask: null,
      lineBuffer: '',
      isCompletelyTerminated: false,
      userInitiatedStop: false  // 🔑 重置用户停止标记
    });
    
    // 重置跟踪变量
    this.hasReceivedAnyContent = false;
    this.lastDataReceivedTime = Date.now();
    this.pendingBuffer = '';
    
    // 设置超时检测
    let lastDataTime = Date.now();
    const timeoutChecker = setInterval(() => {
      const now = Date.now();
      if (now - lastDataTime > 30000) { // 30秒无数据
        // console.log('⏰ 30秒无数据,强制结束生成');
        clearInterval(timeoutChecker);
        this.completeImageDescriptionGeneration();
      }
    }, 5000);
    
    // 创建请求任务
    const requestTask = wx.request({
      url: url,
      method: 'GET',
      enableChunked: true,
      success: (res) => {
        // console.log('SSE请求完成,状态码:', res.statusCode);
        clearInterval(timeoutChecker);
        // 延迟一点确保所有数据都处理完
        setTimeout(() => {
          this.completeImageDescriptionGeneration();
        }, 500);
      },
      fail: (err) => {
        console.error('SSE请求失败:', err);
        clearInterval(timeoutChecker);
        wx.showToast({
          title: '生成失败',
          icon: 'none'
        });
        this.setData({
          isGenerating: false,
          isGenerationActive: false,
          showCursor: false
        });
      }
    });
      let  a =''
    
    // 监听数据块
    let buffer = '';
    requestTask.onChunkReceived((res) => {
      lastDataTime = Date.now(); // 更新最后接收数据时间
      
      const chunk = utf8Decode(res.data);
      buffer += chunk;
      
      // 处理SSE数据
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      lines.forEach(line => {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6).trim();
          
          // 检查是否是结束信号
          if (jsonStr === '[DONE]') {
            // console.log('✅ 收到[DONE]信号');
            clearInterval(timeoutChecker);
            this.completeImageDescriptionGeneration();
            return;
          }
          
          try {
          const data = JSON.parse(jsonStr);
          
          if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
            const content = data.choices[0].delta.content;
          
            this.appendToBuffer(content);
          
          }
        } catch (e) {
          console.error('解析SSE数据失败:', e, jsonStr);
        }
      }
    });
  });
    
    // 保存请求任务
    this.setData({
      currentRequestTask: requestTask
    });
  },

  // 完成图片描述生成
  completeImageDescriptionGeneration: function() {
    // console.log('✅ 完成图片描述生成');
    
    // 更新UI状态
    this.setData({
      isGenerating: false,
      isGenerationActive: false,
      showCursor: false,
      currentRequestTask: null,
      streamEndSignal: true,
      contentReceiveComplete: true
    });
    
    // console.log('🎉 图片描述生成完成,内容长度:', this.data.fullContent.length);
    
    // 🔑 设置保存中状态
    this.setData({
      isSaving: true
    });
    // console.log('📝 开始保存图片描述历史记录...');
    
    // 更新剩余次数
    const app = getApp();
    app.checkProStatus(true).catch(err => {
      console.error('更新剩余次数失败:', err);
    });
    
    // 🔑 主动保存历史记录
    setTimeout(async () => {
      try {
        // 生成一个临时ID用于保存
        const tempId = 'img_desc_' + Date.now();
        
        // 调用保存历史记录方法
        await this.saveHistoryRecord(tempId);
        
        // console.log('✅ 图片描述历史记录保存成功');
        
        // 延迟获取真实ID
        setTimeout(async () => {
          try {
            const historyId = await app.getLatestPromptIdFromHistory();
            if (historyId) {
              const formattedId = app.formatPromptId(historyId);
              if (formattedId) {
                // console.log('✅ 成功获取历史ID:', formattedId);
                this.setData({ 
                  currentPromptId: formattedId 
                });
                
                // 检查收藏状态
                this.checkFavoriteStatus();
              }
            }
          } catch (err) {
            console.error('获取历史ID失败:', err);
          }
          
          // 结束保存状态
          this.setData({
            isSaving: false,
            showScrollArrow: true
          });
        }, 2000);
        
      } catch (err) {
        console.error('保存图片描述历史记录失败:', err);
        
        // 即使保存失败也要结束保存状态
        this.setData({
          isSaving: false,
          showScrollArrow: true
        });
      }
    }, 500);
  },

  // 安全获取窗口信息的辅助函数
  getWindowInfoSafe: function() {
    try {
      // 使用新API
      return wx.getWindowInfo();
    } catch (error) {
      console.error('获取窗口信息失败:', error);
      // 返回一个合理的默认值
      return {
        windowHeight: 600,
        windowWidth: 375
      };
    }
  },

  // 添加一个辅助方法用于日志输出
  logDebug: function(message, data) {
    if (this.data.debugMode) {
      if (data) {
        // console.log(message, data);
      } else {
        // console.log(message);
      }
    }
  },

  onLoad() {
    // console.log('页面开始加载');
    
    // 第一阶段：基础组件初始化
    this.navbar = this.selectComponent('#navbar');
    
    // 第二阶段：关键数据初始化（输入框相关）
    this.setData({
      currentPlaceholder: this.data.modelPlaceholders[this.data.currentModel]
    });

    // 🔑 新增：检查是否有保存的内容需要恢复
    this.checkAndRestoreContent();
    
    // 第三阶段：延迟执行非关键初始化
    setTimeout(() => {
      this.checkInitialLoginStatus();
      this.performModelVisibilityCheck();
    }, 100);
    
    // 第四阶段：确保输入框完全准备好
    setTimeout(() => {
      this.ensureInputReady();
    }, 300);

    // 初始化当前选择文本
    this.updateCurrentSelectionText(); // ✅ 添加这行

    // 🔑 新增：初始化会话终止黑名单
    this.terminatedSessions = new Set();
  },

  // 🔑 新增：检查并恢复保存的内容
  checkAndRestoreContent: function() {
    try {
      const preservedData = wx.getStorageSync('preservedContent');
      
      if (preservedData && preservedData.savedAt) {
        const timeDiff = Date.now() - preservedData.savedAt;
        
        // 只恢复5分钟内保存的内容
        if (timeDiff < 5 * 60 * 1000) {
          // console.log('💾 恢复保存的内容，时间差:', Math.round(timeDiff/1000) + 's');
          
          // 恢复内容
          this.setData(preservedData);
          
          // 延迟显示滚动箭头
          setTimeout(() => {
            this.setData({ showScrollArrow: true });
          }, 500);
        }
        
        // 清除保存的内容（无论是否恢复）
        wx.removeStorageSync('preservedContent');
      }
    } catch (e) {
      console.error('恢复内容失败:', e);
      wx.removeStorageSync('preservedContent');
    }
  },
  
  // 新增：确保输入框准备就绪的方法
  ensureInputReady: function() {
    // console.log('确保输入框准备就绪');
    
    // 通过查询输入框来"激活"它
    const query = wx.createSelectorQuery();
    query.select('.input-box').fields({
      id: true,
      dataset: true,
      rect: true
    });
    query.exec((res) => {
      if (res && res[0]) {
        // console.log('输入框已准备就绪:', res[0]);
        // 设置一个内部标记，表示输入框已经准备好
        this.setData({
          inputReady: true
        });
      }
    });
  },
  
  // 抽取模型检查逻辑到独立方法
  performModelVisibilityCheck: function() {
    // 检查默认模型是否可见，如果不可见则自动切换
    if (this.data.currentModel === 'midjourney' && !this.data.modelVisibility.midjourney) {
      // console.log('自动切换：Midjourney已隐藏，切换到GPT Image');
      this.setData({
        currentModel: 'GPT Image',
        currentPlaceholder: this.data.modelPlaceholders['GPT Image']
      });
    }
  },

  onShow() {
    // console.log('页面显示');
    
    // 页面显示时也检查登录状态，处理从其他页面返回的情况
    this.checkInitialLoginStatus();
    
    // 确保输入框在页面显示时是准备就绪的
    if (!this.data.inputReady) {
      setTimeout(() => {
        this.ensureInputReady();
      }, 200);
    }
    
    // 添加一个延时检查，确保界面已渲染
    setTimeout(() => {
      this.checkScrollArrow();
    }, 500);

    // 🔑 关键添加：设置TabBar选中状态
    this.setTabBarSelectedIndex(0);
  },

  // 添加这个新方法到 pages/index/index.js
  setTabBarSelectedIndex(index) {
    if (typeof this.getTabBar === 'function') {
      const tabBar = this.getTabBar();
      if (tabBar) {
        // console.log('设置首页TabBar状态，索引:', index);
        tabBar.setSelectedIndex(index);
      } else {
        console.warn('TabBar组件未找到');
      }
    }
  },

  // 修改onUnload方法，清理所有定时器
  onUnload() {
    // console.log('页面卸载，开始清理所有资源');
    
    // 🔑 修复：清理会话终止黑名单的正确方式
    if (this.terminatedSessions) {
      this.terminatedSessions.clear();
      this.terminatedSessions = null;
      // console.log('页面卸载，清理会话终止黑名单');
    }

    // 🔑 新增：清理打字暂停定时器
    if (this.typingPauseTimer) {
      // console.log('页面卸载，清理打字暂停定时器');
      clearTimeout(this.typingPauseTimer);
      this.typingPauseTimer = null;
    }

    // 🔧 关键修复：清理状态守护机制
    if (this.stateGuardTimer) {
      // console.log('页面卸载，清理状态守护定时器');
      clearInterval(this.stateGuardTimer);
      this.stateGuardTimer = null;
    }
    
    if (this.data.typingTimer) {
      // console.log('页面卸载，清理打字定时器');
      clearTimeout(this.data.typingTimer);
      this.data.typingTimer = null;
    }
    
    // 清理统一完成检查定时器
    if (this.unifiedCompletionTimer) {
      // console.log('页面卸载，清理统一完成检查定时器');
      clearInterval(this.unifiedCompletionTimer);
      this.unifiedCompletionTimer = null;
    }
    
    if (this.dataCompletionTimer) {
      // console.log('页面卸载，清理数据完成检查定时器');
      clearInterval(this.dataCompletionTimer);
      this.dataCompletionTimer = null;
    }
    
    if (this.safetyTimer) {
      // console.log('页面卸载，清理安全定时器');
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
    
    if (this.data.currentRequestTask) {
      // console.log('页面卸载，中止请求');
      this.data.currentRequestTask.abort();
      this.data.currentRequestTask = null;
    }
  
    // 清理可能导致内存泄漏的引用
    this.lastDataReceivedTime = null;
    this.lastBufferLength = null;
    this.checkCount = null;
    this.typeCounter = null;
    this.hasReceivedContent = null;
    this.hasReceivedAnyContent = null;
    this.outsideClickHandler = null;
    
    // console.log('页面卸载清理完成');
  },

  // 焦点保护机制 - 在布局调整过程中保护输入框焦点
  protectInputFocus: function() {
    this.setData({
      inputFocusProtected: true
    });
    
    // 30秒后自动解除保护（防止状态永久锁定）
    setTimeout(() => {
      this.setData({
        inputFocusProtected: false
      });
    }, 30000);
  },

  // 新增：输入框准备完成事件处理
  //   onInputReady: function(e) {
  //     // console.log('输入框组件已准备完成');
  //     this.setData({
  //       inputReady: true
  //     });
  //   },

  // 修改现有的onInputFocus方法
  onInputFocus: function(e) {
    // console.log('输入框获得焦点，启动外部点击监听');
    
    // 🔑 修复：如果页面正在初始化，延迟处理
    if (this.pageInitializing) {
      // console.log("页面正在初始化，延迟处理焦点事件");
      setTimeout(() => {
        if (!this.pageInitializing) {
          this.onInputFocus(e);
        }
      }, 300);
      return;
    }    
    // 输入框现在在初始化时就设置为准备好，避免异步干扰焦点事件
    //     if (!this.data.inputReady) {
    //       // console.log('输入框尚未准备好，异步执行准备检查');
    //       // 延迟执行DOM查询，避免阻塞焦点事件
    //       setTimeout(() => {
    //         this.ensureInputReady();
    //       }, 0);
    //     }
    // 暂时注释掉光标设置，避免键盘自动消失问题
    // if (this.data.inputText && this.data.inputText.length > 0) {
    //   this.setData({
    //     cursorPosition: this.data.inputText.length
    //   });
    // }
    
        // 延迟设置状态标记，避免在focus事件期间立即重新渲染
    setTimeout(() => {
      this.setData({
        keyboardActive: true,
        isInputFocused: true,
        shouldCaptureOutsideClicks: true
      });
    }, 0);    
    // 延迟更长时间再启用外部点击捕获，确保键盘完全稳定
    setTimeout(() => {
      if (this.data.isInputFocused) {
        this.enableOutsideClickCapture();
      }
    }, 1200);  // 🔑 修复：从800ms改为1200ms
    
    // 清除任何可能存在的调整定时器
    if (this.layoutAdjustTimer) {
      clearTimeout(this.layoutAdjustTimer);
      this.layoutAdjustTimer = null;
    }
  },

  // 同时修改onInputBlur方法，重置光标位置
  onInputBlur: function(e) {
    // console.log('输入框失去焦点，停止外部点击监听');
    
    // 重置光标位置为不设置状态
    this.setData({
      keyboardActive: false,
      isInputFocused: false,
      shouldCaptureOutsideClicks: false,
      cursorPosition: -1 // 重置光标位置
    });
    
    // 禁用外部点击捕获
    this.disableOutsideClickCapture();
    
    // 确保定时器被清理
    if (this.layoutAdjustTimer) {
      clearTimeout(this.layoutAdjustTimer);
      this.layoutAdjustTimer = null;
    }
  },

  onInputChange(e) {
    var patch = { inputText: e.detail.value };
    // Stage 2 D018a: 用户改输入框文本 → 视为开启新主题,重置上下文注入链
    if (this.data.refinementRound > 0) {
      patch.refinementRound = 0;
      patch.previousOutput = '';
    }
    this.setData(patch);
  },

  // 启用外部点击捕获 - 当输入框获得焦点时调用
  enableOutsideClickCapture: function() {
    // console.log('启用外部点击捕获机制');
    
    // 为页面容器添加点击事件监听
    // 注意：这里我们使用capture模式来确保能够捕获到点击事件
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 存储事件处理函数的引用，以便后续移除
    this.outsideClickHandler = (e) => {
      this.handleOutsideClick(e);
    };
    
    // 设置一个标记，表明监听器已经激活
    this.setData({
      outsideClickListenerActive: true
    });
  },

  // 禁用外部点击捕获 - 当输入框失去焦点时调用
  disableOutsideClickCapture: function() {
    // console.log('禁用外部点击捕获机制');
    
    // 清理事件监听器引用
    this.outsideClickHandler = null;
    
    // 清除标记
    this.setData({
      outsideClickListenerActive: false
    });
  },

  // 处理外部点击事件的核心逻辑
  handleOutsideClick: function(e) {
    // console.log('检测到外部点击事件');
    
    // 确保当前确实在输入状态且应该响应外部点击
    if (!this.data.shouldCaptureOutsideClicks || !this.data.isInputFocused) {
      // console.log('当前状态不需要处理外部点击');
      return;
    }
    
    // console.log('执行输入框失焦操作');
    
    // 🔑 修复：使用DOM查询直接让textarea失焦
    const query = wx.createSelectorQuery();
    query.select('.input-box').fields({
      node: true,
      size: true
    });
    query.exec((res) => {
      if (res && res[0] && res[0].node) {
        // 直接调用blur方法让textarea失焦
        res[0].node.blur();
        // console.log('已通过DOM操作让输入框失焦');
      } else {
        // 备用方案：手动触发blur状态更新
        // console.log('使用备用方案触发失焦');
        this.setData({
          isInputFocused: false,
          keyboardActive: false,
          shouldCaptureOutsideClicks: false
        });
        this.disableOutsideClickCapture();
      }
    });
  },

  // 主动触发输入框失焦的方法
  triggerInputBlur: function() {
    // 使用选择器找到输入框并让其失焦
    const query = wx.createSelectorQuery();
    query.select('.input-box').fields({
      id: true,
      dataset: true
    });
    
    query.exec((res) => {
      if (res && res[0]) {
        // 通过设置一个临时的其他元素焦点来间接让输入框失焦
        // 这是微信小程序中可靠的失焦方法
        this.setData({
          shouldBlurInput: true
        }, () => {
          // 立即重置标记
          setTimeout(() => {
            this.setData({
              shouldBlurInput: false
            });
          }, 100);
        });
      }
    });
  },

  // 防止输入区域的点击触发外部点击处理
  // 🔑 新增：简单的阻止冒泡方法
  stopPropagation: function(e) {
    // console.log("✋ 输入区域被点击，阻止事件冒泡");
    // 仅阻止事件冒泡，不做其他处理
    // 这样点击输入区域不会触发外部点击处理
    e.stopPropagation && e.stopPropagation();
    return false;
  },

  // 🔑 简化的页面点击处理方法
  handlePageClick: function(e) {
  
    
    // 如果键盘已激活，直接收起键盘
    if (this.data.keyboardActive && this.data.isInputFocused) {
      // console.log('🎯 执行键盘收起操作');
      
      // 🔑 关键修复：手动触发onInputBlur事件
      this.onInputBlur({ detail: { value: this.data.inputText } });
    }
  },

  preventOutsideClickOnInput: function(e) {
    // console.log('输入区域被点击，阻止外部点击处理');
    // 这个方法的存在本身就足够了，它会阻止事件冒泡
    // 无需额外的处理逻辑
  },
  
  // 🔑 添加缺失的键盘高度监听方法
  onKeyboardHeightChange: function(e) {
    // console.log("键盘高度变化:", e.detail.height);
    const keyboardHeight = e.detail.height;
    
    if (keyboardHeight > 0) {
      // console.log("键盘弹出，高度:", keyboardHeight);
      this.setData({
        keyboardActive: true,
        keyboardHeight: keyboardHeight
      });
    } else {
      // console.log("键盘收起");
      this.setData({
        keyboardActive: false,
        keyboardHeight: 0
      });
    }
  },

  // 🛑 新增：处理停止生成的方法
  handleStopGeneration: function() {
    // console.log('🛑 用户点击停止生成按钮');
    
    // 检查是否正在生成
    if (!this.data.isGenerating) {
      // console.log('⚠️ 当前没有正在进行的生成任务');
      return;
    }

    // 记录当前会话ID到终止黑名单
    if (this.data.generationSessionId) {
      if (!this.terminatedSessions) {
        this.terminatedSessions = new Set();
      }
      this.terminatedSessions.add(this.data.generationSessionId);
      // console.log('🚫 会话已加入终止黑名单:', this.data.generationSessionId);
    }

    // 设置停止标记
    this.setData({
      isCompletelyTerminated: true,
      userInitiatedStop: true,
      shouldStopGeneration: true
    });

    // 中止当前请求
    if (this.data.currentRequestTask) {
      try {
        this.data.currentRequestTask.abort();
        // console.log('✅ 已中止当前请求');
      } catch (e) {
        console.error('中止请求失败:', e);
      }
      this.setData({ currentRequestTask: null });
    }

    // 清理所有定时器
    this.clearAllTimers();
    // console.log('✅ 已清理所有定时器');

    // 清理打字相关状态
    if (this.data.typingTimer) {
      clearTimeout(this.data.typingTimer);
      this.data.typingTimer = null;
    }

    // 清理缓冲区
    if (this.pendingBuffer) {
      this.pendingBuffer = '';
    }

    // 处理剩余缓冲内容（如果有的话）
    if (this.data.bufferContent.length > 0) {
      // console.log('📝 处理剩余缓冲内容，长度:', this.data.bufferContent.length);
      const finalContent = this.data.fullContent + this.data.bufferContent;
      this.setData({
        fullContent: finalContent,
        result: this.formatResult(finalContent),
        originalResponse: finalContent,
        bufferContent: ''
      });
    }

    // 更新UI状态
    this.setData({
      isGenerating: false,
      isGenerationActive: false,
      isTyping: false,
      showCursor: false,
      streamEndSignal: true,
      contentReceiveComplete: true
    });

    // console.log('🎉 生成已停止，最终内容长度:', this.data.fullContent.length);

    // 显示提示
    wx.showToast({
      title: '已停止生成',
      icon: 'success',
      duration: 1500
    });

    // 🔑 手动停止时不保存历史记录
    // console.log('⚠️ 用户手动停止，不保存内容到历史记录');

    // 显示滚动箭头
    setTimeout(() => {
      if (this.data.fullContent && this.data.fullContent.length > 0) {
        this.setData({ showScrollArrow: true });
      }
    }, 100);
  },

  // 1. 修改 startTypingEffect 方法中的打字暂停逻辑
  startTypingEffect: function() {
    if (!this.data.generationSessionId) {
      // console.log('🔤 无有效生成会话，跳过打字效果');
      return;
    }

    if (this.data.isTyping) {
      // console.log('🔤 打字效果已在运行，跳过启动');
      return;
    }
    
    if (this.data.shouldStopGeneration || this.data.userInitiatedStop) {
      // console.log('🛑 检测到停止信号，禁止启动打字效果');
      return;
    }
    
    if (this.data.bufferContent.length === 0) {
      // console.log('📝 缓冲区为空，暂无内容进行打字显示');
      return;
    }
    
    // console.log('🚀 启动打字效果，缓冲区内容长度:', this.data.bufferContent.length);

    this.setData({ 
      isTyping: true,
      showCursor: true,
      showResult: true
    });
    
    const typeNextChar = () => {
      if (this.data.shouldStopGeneration || this.data.userInitiatedStop) {
        // console.log('🛑 打字过程中检测到停止信号，终止打字');
        this.setData({ 
          isTyping: false,
          showCursor: false 
        });
        return;
      }
      if (this.data.bufferContent.length > 0) {
        // 正常打字逻辑
        const char = this.data.bufferContent.charAt(0);
        const remainingBuffer = this.data.bufferContent.substring(1);
        const newFullContent = this.data.fullContent + char;
        
        // 智能功能检测
        if (this.isImageOrVideoModel() && !this.data.promptExtracted) {
          this.checkPromptExtraction(newFullContent);
        }
        
        const formattedResult = this.formatResult(newFullContent);
        
        this.setData({
          bufferContent: remainingBuffer,
          fullContent: newFullContent,
          result: formattedResult,
          originalResponse: newFullContent
        });
        
        // 动态调整打字速度
        let dynamicSpeed = this.data.typingSpeed;
        if (remainingBuffer.length > 200) {
          dynamicSpeed = Math.max(this.data.typingSpeed * 0.5, 10);
        } else if (remainingBuffer.length > 50) {
          dynamicSpeed = Math.max(this.data.typingSpeed * 0.8, 15);
        }
        
        this.data.typingTimer = setTimeout(typeNextChar, dynamicSpeed);
        
        if (newFullContent.length % 50 === 0) {
          setTimeout(() => {
            this.checkScrollArrow();
          }, 100);
        }
        
      } else {
        // 🎯 关键修改：打字暂停逻辑
        // console.log('📝 打字暂停 - 缓冲区为空，启动6.8秒完成检测');
        
        this.setData({ 
          isTyping: false,
          showCursor: true  // 保持光标显示，表示还在等待
        });
        
        // 🔑 新逻辑：6.8秒后检查完成
        this.startTypingPauseCompletion();
      }
    };
    
    typeNextChar();
  },

  // 2. 新增：打字暂停后的完成检测机制
  startTypingPauseCompletion: function(retryCount = 0) {
    // 动态等待时间：首次6.8秒，之后每次重试增加2秒，最多12秒
    const waitTime = retryCount === 0 ? 6800 : Math.min(6800 + retryCount * 2000, 12000);
    // console.log(`⏰ 启动打字暂停完成检测 (${waitTime/1000}秒倒计时) - 重试次数: ${retryCount}`);
    
    // 清除可能存在的旧检测定时器
    if (this.typingPauseTimer) {
      clearTimeout(this.typingPauseTimer);
      this.typingPauseTimer = null;
    }
    
    // 记录暂停开始时间
    const pauseStartTime = Date.now();
    const pauseContentLength = this.data.fullContent.length;
    
    this.typingPauseTimer = setTimeout(() => {
      // 6.8秒后检查状态
      const currentTime = Date.now();
      const currentContentLength = this.data.fullContent.length;
      const hasNewContent = currentContentLength > pauseContentLength;
      const hasBufferContent = this.data.bufferContent.length > 0;
      const wasStoppedByUser = this.data.userInitiatedStop || this.data.shouldStopGeneration;
  
      
      if (hasNewContent || hasBufferContent) {
        // 有新内容，恢复打字
        // console.log('🔄 检测到新内容，恢复打字效果');
        if (!this.data.isTyping && !wasStoppedByUser) {
          this.startTypingEffect();
        }
      } else if (!wasStoppedByUser && this.data.isGenerating) {
        // 没有新内容且未被用户停止
        if (retryCount < 2 && currentContentLength < 100) {
          // 内容少于100字符且重试次数小于2，继续重试
          // console.log(`⏳ 内容较少(${currentContentLength}字符)，进行第${retryCount + 1}次重试`);
          this.startTypingPauseCompletion(retryCount + 1);
        } else {
          // 内容足够或超过重试次数，执行完成
          // console.log(`✅ 检测完成 - 内容长度: ${currentContentLength}，重试次数: ${retryCount}`);
          this.completeGenerationFromTypingPause();
        }
      } else {
        // console.log('⏳ 打字暂停检测：生成已停止或被用户终止');
      }
      
      // 清理定时器引用
      this.typingPauseTimer = null;
    }, waitTime);
  },

  // 3. 新增：从打字暂停触发的完成方法
  completeGenerationFromTypingPause: function() {
    // console.log('🎯 从打字暂停触发完成生成');
    
    // 清理打字暂停定时器
    if (this.typingPauseTimer) {
      clearTimeout(this.typingPauseTimer);
      this.typingPauseTimer = null;
    }
    
    // 🔑 在这里才真正重置UI状态
    this.setData({
      isGenerating: false,  // ✅ 现在重置UI是正确的时机
      showCursor: false
    });
    
    // 调用标准的完成生成方法
    this.completeGeneration();
  },

  // 5. 新增：提示词检测的核心方法
  checkPromptExtraction: function(currentContent) {
    // 查找第一个"###"的位置
   let firstHashIndex = currentContent.indexOf('###');
     if (firstHashIndex === -1) {
       firstHashIndex = currentContent.indexOf('##');;
    }
    
    if (firstHashIndex !== -1) {
      // 提取"###"之前的所有内容作为完整提示词
      const extractedPrompt = currentContent.substring(0, firstHashIndex).trim();
      
      // 确保提取的内容有足够长度且不为空
      if (extractedPrompt.length > 30) {
        // console.log('✅ 成功提取完整提示词，长度:', extractedPrompt.length);
        // console.log('提示词预览:', extractedPrompt.substring(0, 100) + '...');
        
        this.setData({
          extractedPrompt: extractedPrompt,
          showQuickCopy: true,
          promptExtracted: true
        });
        
        // 显示成功提示
        wx.showToast({
          title: '提示词就绪！',
          icon: 'success',
          duration: 1500
        });
        
        return true;
      }
    }
    
    return false;
  },

  // 6. 快速复制提示词的处理方法
  handleQuickCopyPrompt: function() {
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

  // 修改后的 appendToBuffer 方法 - 批量处理减少渲染次数
  appendToBuffer: function(text) {
    // 🔑 新增：检查会话ID有效性，防止处理已终止会话的数据
    if (this.terminatedSessions && this.terminatedSessions.has(this.data.generationSessionId)) {
       console.log('🚫 检测到已终止会话的数据，直接丢弃:', this.data.generationSessionId);
      return;
    }

    // 🔑 新增：检查完全终止标记
    if (this.data.isCompletelyTerminated) {
   console.log('🛑 appendToBuffer检测到终止标记，丢弃数据');
      return;
    }

    // 🔑 新增：检查会话ID是否存在，无会话ID的数据一律丢弃
    if (!this.data.generationSessionId) {
    console.log('🚫 无有效会话ID，丢弃数据');
      return;
    }

    const now = Date.now();
//     console.log('📨 接收数据，更新时间戳:', now, '内容长度:', text.length);
    
    // 首次接收内容标记，取消超时检查
    if (!this.hasReceivedAnyContent) {
      this.hasReceivedAnyContent = true;
       console.log('✅ 首次接收到内容，取消超时检查');
    }

    // 更新时间戳（这个必须立即更新）
    this.setData({
      lastDataTimestamp: now,
    });
    
    // 🔑 新增：批量累积机制，减少频繁的setData调用
    this.pendingBuffer = (this.pendingBuffer || '') + text;
    
    // 清除之前的批处理定时器
    if (this.bufferFlushTimer) {
      clearTimeout(this.bufferFlushTimer);
      this.bufferFlushTimer = null;
    }
    
    // 🔑 智能批处理策略：
    // 1. 如果是首次内容或累积内容较多，立即处理
    // 2. 否则等待30ms批量处理，提高响应性和性能的平衡
    const isFirstContent = this.data.fullContent === '' && this.data.bufferContent === '';
    if (isFirstContent || this.pendingBuffer.length >= 8) {
//       console.log('📦 立即处理缓冲内容，长度:', this.pendingBuffer.length);
      this.flushPendingBuffer();
    } else {
      this.bufferFlushTimer = setTimeout(() => {
        // console.log('📦 批量处理缓冲内容，长度:', this.pendingBuffer.length);
        this.flushPendingBuffer();
      }, 30);
    }
  },

  // 新增的 flushPendingBuffer 方法 - 批量刷新缓冲区
  flushPendingBuffer: function() {
    console.log('🚿 [Flush] 开始flush, pendingBuffer长度:', this.pendingBuffer ? this.pendingBuffer.length : 0);
    if (!this.pendingBuffer) return;
    
    // 清理定时器引用
    if (this.bufferFlushTimer) {
      clearTimeout(this.bufferFlushTimer);
      this.bufferFlushTimer = null;
    }
    
    // 合并到主缓冲区
    const newBufferContent = this.data.bufferContent + this.pendingBuffer;
    const isFirstContent = this.data.fullContent === '' && this.data.bufferContent === '';
    
    console.log('🚿 [Flush] 合并后bufferContent长度:', newBufferContent.length, 'isFirstContent:', isFirstContent);
    
    // 批量更新状态，减少渲染次数
    this.setData({
      bufferContent: newBufferContent,
      showResult: isFirstContent ? true : this.data.showResult
    });
    
    // 清空临时缓冲区
    this.pendingBuffer = '';
    
    // 🔑 打字暂停恢复逻辑：如果正在等待打字暂停完成，取消等待并立即恢复
    if (this.typingPauseTimer) {
      console.log('🔄 新数据到达,取消打字暂停等待,立即恢复打字');
      clearTimeout(this.typingPauseTimer);
      this.typingPauseTimer = null;
    }
    
    // 启动或恢复打字效果
    if (!this.data.isTyping && newBufferContent.length > 0 && !this.data.userInitiatedStop) {
      this.startTypingEffect();
    } else {
    }
  },

  // 3. 强化 completeGeneration 方法 - 确保状态正确更新
  completeGeneration: function() {
    // console.log('✅ 执行completeGeneration，会话:', this.data.generationSessionId);
    
    // 🔧 添加状态验证，防止重复调用
    if (!this.data.isGenerationActive && !this.data.isGenerating) {
      // console.log('⚠️ 生成已完成，跳过重复调用');
      return;
    }
    
    // 清理状态守护机制
    if (this.stateGuardTimer) {
      clearInterval(this.stateGuardTimer);
      this.stateGuardTimer = null;
    }
    
    // 清理所有定时器
    this.clearAllTimers();
    
    // 处理剩余缓冲内容
    if (this.data.bufferContent.length > 0) {
      // console.log('📝 处理剩余缓冲内容，长度:', this.data.bufferContent.length);
      const finalContent = this.data.fullContent + this.data.bufferContent;
      this.setData({
        fullContent: finalContent,
        result: this.formatResult(finalContent),
        originalResponse: finalContent,
        bufferContent: ''
      });
    }
    
    // 🔧 确保UI状态完全更新
    this.setData({
      isGenerating: false,          // 🔑 关键：停止生成按钮显示
      isGenerationActive: false,    // 清除严格标记
      generationSessionId: null,    // 清除会话ID
      streamEndSignal: true,        // 标记流结束
      showCursor: false,           // 隐藏光标
      isTyping: false,             // 停止打字状态
      contentReceiveComplete: true,
      completionCheckActive: false,
      lastStateChangeTime: Date.now()
    });
    
    // console.log('🎉 生成完成! 最终内容长度:', this.data.fullContent.length);
    // console.log('🎉 UI状态已更新: isGenerating =', this.data.isGenerating);

    // 🔑 设置保存中状态
    this.setData({
      isSaving: true
    });
    // console.log('📝 开始保存历史记录...');
    
    // 后续处理
    this.handlePostGeneration();
    
    // 🔧 强制触发页面更新
    setTimeout(() => {
      this.setData({
        showScrollArrow: true
      });
    }, 100);
  },

  // 更新打字速度
  updateTypingSpeed: function(e) {
    this.setData({
      typingSpeed: e.detail.value
    });
  },

  onGeneratePrompt: function() {    // ✅ 替换为这行
    // console.log('🚀 点击点亮灵感按钮');
        // 登录状态检查
      // 获取openid并严格检查
    const app = getApp();
    const openid = app.globalData.openid || wx.getStorageSync('token');
    if (!openid) {
      console.error('Missing openid, 需要重新登录');
      wx.showModal({
        title: '登录状态异常',
        content: '您的登录状态已失效，需要重新登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }
    // 检查是否在参考模式
    if (this.data.inputMode === 'reference') {
      // console.log('📸 参考模式:开始生成图片描述');
      
      // 检查是否有图片URL
      if (!this.data.referenceImageUrl) {
        wx.showToast({
          title: '请先上传图片',
          icon: 'none'
        });
        return;
      }
      
      // 调用图片描述生成,传递参考文本
      this.generateImageDescription(this.data.referenceImageUrl, this.data.referenceText);
      return;
    }
    
    // 原有的想法模式逻辑
    if (!this.data.inputText.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }
  
    // 🔑 **关键**：每次生成前都执行一次轻量级重置，确保完全干净
    this.ensureCleanStart();
  
    // 生成全新的会话ID，确保与之前的会话完全隔离
    const sessionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + Math.floor(Math.random() * 10000);
    // console.log('🚀 开始全新生成会话:', sessionId);
  
  
  

  
    // 重置日志状态
    LogManager.reset();
  
    // 重置快速复制状态
    this.resetQuickCopyState();
  
    // 🔑 关键优化：预热结果区域，避免首次渲染延迟
    const emptyResult = this.formatResult('');
  
  
    // 💡 立即保存会话ID与标签的映射关系
    if (this.data.currentSelectionText) {
      app.saveSessionLabel(sessionId, this.data.currentSelectionText);
      // console.log("🏷️ 保存会话标签映射:", sessionId, "->", this.data.currentSelectionText);
    } else {
      // console.log("⚠️ 未找到currentSelectionText，无法保存标签映射");
    }
    // 严格的状态初始化 - 使用原子操作避免竞态条件
    this.setData({ 
      // 生成会话管理
      generationSessionId: sessionId,
      isGenerationActive: true,
      lastStateChangeTime: Date.now(),
  
      // 🔑 **关键修改**：无条件清空前一次的ID，确保每次都是全新开始
      currentPromptId: null,
      currentShareId: null,
      isFavorited: false,  
      // 🔑 预热UI状态 - 提前准备结果显示结构
      showResult: true,  // 立即显示结果区域
      result: emptyResult,  // 空内容但结构已准备好
  
      // 原有状态重置
      isGenerating: true,
      bufferContent: '',
      fullContent: '',
      isTyping: false,
      streamEndSignal: false,
      showCursor: true,
      originalResponse: '',
      currentRequestTask: null,
      lineBuffer: '',
      generationFailed: false,
      
      // 重置检测相关状态
      lastDataTimestamp: Date.now(),
      completionCheckActive: false,
      contentReceiveComplete: false,
      
      // 重置完全终止标记
      isCompletelyTerminated: false
    });
    
    // 重置跟踪变量
    this.hasReceivedAnyContent = false;
    this.lastDataReceivedTime = Date.now();
    
    // 调用API
    this.callStreamAPI();
    
    // console.log('🚀 强化完成检测已启动，UI已预热');
  },
  
  // 🔑 **新增**：确保干净的开始
  ensureCleanStart: function() {
    // console.log('🧹 确保干净的开始');
    
    // 中止任何可能存在的连接
    if (this.data.currentRequestTask) {
      try {
        this.data.currentRequestTask.abort();
      } catch (e) {
        // console.log('清理残留连接失败:', e);
      }
      this.setData({ currentRequestTask: null });
    }
    
    // 清理所有定时器
    this.clearAllTimers();
    
    // 清理实例变量
    this.pendingBuffer = '';
    this.hasReceivedAnyContent = false;
    this.terminatedSessions = null;
    
    // console.log('✅ 开始状态已清理');
  },

  // 新增：处理生成后续工作的方法
  handlePostGeneration: function() {
    // console.log('处理生成后续工作');
    
    // 如果生成完成但没有ID，尝试再次获取
    if (!this.data.currentPromptId) {
      console.warn('生成完成但ID不存在，尝试从缓存中恢复');
      const app = getApp();
      if (app.lastGeneratedPromptId) {
        this.setData({
          currentPromptId: app.lastGeneratedPromptId
        });
        // console.log('从app缓存恢复ID:', app.lastGeneratedPromptId);
      }
    }

    // 记录生成的内容到全局
    getApp().recordGeneration(this.data.fullContent, this.data.currentSelectionText);
    
    if ((!this.data.currentPromptId || this.data.currentPromptId === "chatcmpl-customid") && this.data.fullContent) {
      // console.log('生成完成但ID不存在，尝试获取ID');
      
      // 首先检查是否可以从最后一个JSON块中获取
      if (this.lastJsonData && (this.lastJsonData.id || this.lastJsonData.prompt_id)) {
        const id = this.lastJsonData.id || this.lastJsonData.prompt_id;
        // console.log('从最后一个JSON数据中获取ID:', id);
        this.setData({ currentPromptId: id });
      } 
      // 否则尝试获取最近生成的ID
      else {
        this.retrieveContentId(this.data.inputText);
      }
    }

    // 检查收藏状态
    this.checkFavoriteStatus();
    
    // 更新剩余次数
    getApp().checkProStatus(true)
      .catch(err => {
        console.error('更新剩余次数失败:', err);
      });

    // 生成完成2秒后主动获取有效ID
    setTimeout(async () => {
      if ((!this.data.currentPromptId || this.data.currentPromptId === "chatcmpl-customid") && this.data.fullContent) {
   
        
        const app = getApp();
        try {
          const historyId = await app.getLatestPromptIdFromHistory();
          if (historyId) {
            // 🔑 关键修复：递增ID避免重复

            // 直接使用historyId，不要递增
            const nextId = historyId;

            const formattedId = app.formatPromptId(nextId);
            if (formattedId) {
              // console.log('成功获取历史ID:', historyId, '格式化为:', formattedId);
              
              
              // 🔗 关键：建立历史记录ID与会话ID的关联
              if (this.data.generationSessionId) {
                app.saveHistorySessionMapping(nextId, this.data.generationSessionId);
                // console.log("🔗 建立映射关系:", nextId, "->", this.data.generationSessionId);
              }
              // 保存历史记录ID与标签的映射关系
              if (this.data.currentSelectionText) {
                app.saveHistoryLabel(nextId, this.data.currentSelectionText);
                // console.log("保存历史标签映射:", nextId, this.data.currentSelectionText);
              }

              this.setData({ currentPromptId: formattedId });
              
              // 🔑 新增：主动保存历史记录到后端
              this.saveHistoryRecord(formattedId);
            }
          }
        } catch (err) {
          console.error('获取历史ID失败:', err);
        // 添加详细的错误诊断信息
             }
      }
      
      // console.log('最终ID状态:', this.data.currentPromptId);
    }, 5000);

    // 生成完成后延迟显示箭头
    setTimeout(() => {
      this.setData({
        showScrollArrow: true
      });
    }, 500);
  },

  // 🔑 新增：主动保存历史记录到后端
  saveHistoryRecord: function(promptId) {
    // console.log('🔄 获取历史记录中的真实ID，临时ID:', promptId);

    // 获取历史记录中的最新记录，确保获取真实的prompt_id和share_id
    const app = getApp();
    if (!app.globalData.openid) {
      // console.log('未登录，无法获取历史记录');
      return;
    }

    wx.request({
      url: 'https://www.duyueai.com/history',
      method: 'GET',
      data: {
        openid: app.globalData.openid,
        page: 1,
        limit: 1
      },
      success: (res) => {
        // console.log('获取最新历史记录响应:', res.data);

        if (res.data.code === 0 && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const latestRecord = res.data.data[0];
          // console.log('最新历史记录:', latestRecord);

          // 更新为真实的ID
          if (latestRecord.prompt_id) {
            // console.log('获取到历史记录 - prompt_id:', latestRecord.prompt_id, 'share_id:', latestRecord.share_id);

            // 🔑 关键：尝试不同的share_id字段名
            const realShareId = latestRecord.share_id || latestRecord.shareId || latestRecord.prompt_id;
            // console.log('检查share_id字段 - share_id:', latestRecord.share_id, 'shareId:', latestRecord.shareId, '使用:', realShareId);

            this.setData({
              currentPromptId: latestRecord.prompt_id,
              currentShareId: realShareId
            });

            // console.log('设置ID - currentPromptId:', latestRecord.prompt_id, 'currentShareId:', realShareId);
          }
        }

        // 通知历史页面刷新
        wx.setStorageSync('needRefreshHistory', true);
        // console.log('✅ 已通知历史页面刷新');

        // 🔑 完成保存，恢复按钮状态
        this.setData({
          isSaving: false
        });
        // console.log('📝 历史记录保存完成，按钮恢复可用');
      },
      fail: (err) => {
        console.error('获取历史记录失败:', err);
        // 通知历史页面刷新
        wx.setStorageSync('needRefreshHistory', true);

        // 🔑 即使失败也要恢复按钮状态
        this.setData({
          isSaving: false
        });
        // console.log('⚠️ 保存失败，按钮恢复可用');
      }
    });
  },

  // 添加缺失的登录状态检查方法
  checkInitialLoginStatus: function() {
    // console.log('检查初始登录状态');
    const app = getApp();
    const openid = app.globalData.openid || wx.getStorageSync('token');

    if (!openid) {
      // console.log('未登录状态，允许浏览但不能生成内容');
      // 🔑 移除强制跳转，允许未登录用户浏览
      // 设置登录状态标记，供其他功能判断使用
      this.setData({
        isLoggedIn: false
      });
      return;
    }

    // console.log('登录状态正常，openid:', openid);
    this.setData({
      isLoggedIn: true
    });
  },

  // 添加缺失的滚动箭头检查方法
  checkScrollArrow: function() {
    // 如果有生成的内容，显示滚动箭头
    if (this.data.showResult && this.data.fullContent && this.data.fullContent.length > 0) {
      // console.log('显示滚动箭头，内容长度:', this.data.fullContent.length);
      this.setData({
        showScrollArrow: true
      });
    } else {
      // console.log('隐藏滚动箭头');
      this.setData({
        showScrollArrow: false
      });
    }
  },

  // 添加简单哈希函数用于内容匹配
  simpleHash: function(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  },

  // 添加缺失的结果格式化方法
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

  // 解析行内Markdown语法
  parseInlineMarkdown: function(text) {
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

  // 添加缺失的收藏状态检查方法
  checkFavoriteStatus: function() {
    if (!this.data.currentPromptId) {
      // console.log('无有效ID，跳过收藏状态检查');
      return;
    }
    
    // console.log('检查收藏状态，ID:', this.data.currentPromptId);
    const app = getApp();
    
    try {
      const isFavorited = app.checkIsFavorite(this.data.currentPromptId);
      this.setData({ isFavorited });
      // console.log('收藏状态检查完成:', isFavorited);
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      // 出错时默认为未收藏
      this.setData({ isFavorited: false });
    }
  },

  // 添加缺失的定时器清理方法
  clearAllTimers: function() {
    // console.log('清理所有定时器');
    
    if (this.data.typingTimer) {
      clearTimeout(this.data.typingTimer);
      this.data.typingTimer = null;
    }
    
    if (this.typingPauseTimer) {
      clearTimeout(this.typingPauseTimer);
      this.typingPauseTimer = null;
    }
    
    if (this.bufferFlushTimer) {
      clearTimeout(this.bufferFlushTimer);
      this.bufferFlushTimer = null;
    }
    
    if (this.unifiedCompletionTimer) {
      clearInterval(this.unifiedCompletionTimer);
      this.unifiedCompletionTimer = null;
    }
    
    if (this.dataCompletionTimer) {
      clearInterval(this.dataCompletionTimer);
      this.dataCompletionTimer = null;
    }
    
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
    
    if (this.stateGuardTimer) {
      clearInterval(this.stateGuardTimer);
      this.stateGuardTimer = null;
    }
  },

  // 添加缺失的流式API调用方法
  callStreamAPI: function(retryCount = 0) {
    const maxRetries = 3;
    const app = getApp();
    const openid = app.globalData.openid || wx.getStorageSync('token');
    
    // 登录状态检查
    if (!openid) {
      console.error('未登录或登录状态已失效');
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
      this.handleError('请先登录');
      return;
    }
    
    const content = this.data.inputText;
    const modelType = this.data.currentModelType;
    const modelName = this.data.currentModel;
    
    // 根据当前选择的模型确定使用的API端点
    const apiEndpoint = this.getApiEndpoint(modelName, this.data.currentStyle);
    // console.log(`使用API端点: ${apiEndpoint}，模型: ${modelName}，风格: ${this.data.currentStyle}`);
    
    // 记录最后一次数据接收时间
    this.lastDataReceivedTime = Date.now();
    
    // 设置生成超时检查
    this.safetyTimer = setTimeout(() => {
      if (this.data.isGenerating) {
        // console.log('安全检查：生成时间超过236秒，强制完成');
        this.completeGeneration();
      }
    }, 236000); // 236秒安全超时
    
    // 💡 立即保存content与会话标签的映射，用于后续历史记录匹配
    if (this.data.currentSelectionText) {
      const app = getApp();
      app.saveContentLabel(content, this.data.currentSelectionText, this.data.generationSessionId);
      // console.log("🔑 保存内容标签映射:", content.substring(0, 20) + "...", "->", this.data.currentSelectionText);
    }
    
    // 记录请求开始时间
    const requestStartTime = Date.now();
    // console.log('🔔 请求开始时间:', requestStartTime);
    let firstChunkReceived = false;
    
    const requestTask = wx.request({
      url: apiEndpoint,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-Token': wx.getStorageSync('token')
      },
      data: {
        openid: openid,
        content: content,
        model_type: modelType,
        model_name: modelName,
        client_session: this.data.generationSessionId,  // 🔑 前端会话ID
        request_time: Date.now(),  // 🔑 请求时间
        user_label: this.data.currentSelectionText || '',  // 🔑 用户选择的完整标签
        // 🔑 Stage 2 D018a: 上下文注入(C 方案)— 仅在 refinementRound > 0 时挂 context_prompt
        ...(this.data.refinementRound > 0 && this.data.previousOutput
          ? { context_prompt: this.data.previousOutput }
          : {}),
        // 添加style参数支持
        ...((() => {
          const styleMapping = {
            'practical': '',     // 有用风格：不传style参数（默认）
            'interesting': 'fun', // 有趣风格：传fun
            'insightful': 'juicy' // 有料风格：传juicy
          };
          const styleParam = styleMapping[this.data.currentStyle] || '';
          // console.log(`风格参数映射: ${this.data.currentStyle} -> '${styleParam}'`);
          return styleParam ? { style: styleParam } : {};
        })())
      },
      enableChunked: true,
      success: (res) => {
        if (res.statusCode !== 200) {
          this.handleError(`请求失败: ${res.statusCode}`);
          return;
        }
        // console.log('API调用成功，状态码:', res.statusCode);
      },
      fail: (err) => {
        console.error('请求失败:', err);
        
        if (retryCount < maxRetries) {
          // console.log(`请求失败，${retryCount + 1}/${maxRetries} 次重试...`);
          setTimeout(() => {
            this.callStreamAPI(retryCount + 1);
          }, 1000 * (retryCount + 1));
        } else {
          this.handleError('网络请求失败，请检查网络连接后重试');
        }
      }
    });
    
    // 设置请求任务引用
    this.setData({ currentRequestTask: requestTask });
    
    // 处理数据块接收
    requestTask.onChunkReceived((res) => {
      try {
        // 记录第一次收到数据的时间并计算差值
        if (!firstChunkReceived) {
          const firstChunkTime = Date.now();
          const timeToFirstChunk = firstChunkTime - requestStartTime;
          // console.log(`✅ 从请求到第一次拿到数据耗时: ${timeToFirstChunk}ms`);
          firstChunkReceived = true;
        }
        // 🔑 **新增**：多重检查确保数据有效性
        
        // 检查1：是否已被完全终止
        if (this.data.isCompletelyTerminated) {
          // console.log('🛑 检测到完全终止标记，忽略接收的数据');
          return;
        }
        
        // 检查2：会话ID是否匹配当前会话
        if (!this.data.generationSessionId) {
          // console.log('🚫 无有效会话ID，忽略数据');
          return;
        }
        
        // 检查3：是否在终止黑名单中
        if (this.terminatedSessions && this.terminatedSessions.has(this.data.generationSessionId)) {
          // console.log('🚫 会话在终止黑名单中，忽略数据:', this.data.generationSessionId);
          return;
        }
        
        // 检查4：请求任务是否仍然有效
        if (!this.data.currentRequestTask) {
          // console.log('🚫 无有效请求任务，忽略数据');
          return;
        }
        
        const chunkText = this.decodeUTF8(res.data);
        if (chunkText) {
          this.processChunk(chunkText);
        }
      } catch (error) {
        console.error('处理数据块错误:', error);
      }
    });
  },

  // 添加UTF8解码方法
  decodeUTF8: function(arrayBuffer) {
    try {
      if (typeof arrayBuffer === 'string') {
        return arrayBuffer;
      }
      
      // 🔧 使用自定义UTF8解码函数，避免TextDecoder兼容性问题
      const result = utf8Decode(arrayBuffer);
      
      // 调试信息：检查解码结果
      if (result.includes('�') || result.length === 0) {
        console.warn('⚠️ UTF8解码可能存在问题，结果包含替换字符或为空');
      }
      
      return result;
    } catch (error) {
      console.error('UTF8解码失败:', error);
      console.error('输入数据类型:', typeof arrayBuffer, '长度:', arrayBuffer?.length);
      return '';
    }
  },

  // 添加数据块处理方法
  processChunk: function(text) {
    // 🔑 新增：检查会话ID有效性
    if (this.terminatedSessions && this.terminatedSessions.has(this.data.generationSessionId)) {
      // console.log('🚫 processChunk检测到已终止会话，停止处理:', this.data.generationSessionId);
      return;
    }

    // 🔑 新增：检查完全终止标记
    if (this.data.isCompletelyTerminated) {
      // console.log('🛑 processChunk检测到终止标记，停止处理');
      return;
    }

    // 🔑 新增：检查会话ID是否存在
    if (!this.data.generationSessionId) {
      // console.log('🚫 processChunk无有效会话ID，停止处理');
      return;
    }

    try {
      // 将新数据添加到行缓冲区
      const combinedText = this.data.lineBuffer + text;
      
      // 🔑 预分配数组，避免频繁扩容
      const jsonObjects = [];
      let processedUpTo = 0;
      let jsonStartPos = -1;
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      
      // 扫描字符串查找完整的JSON对象（核心解析逻辑保持不变）
      for (let i = 0; i < combinedText.length; i++) {
        const char = combinedText[i];
        
        // 处理字符串内的字符
        if (inString) {
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = false;
          }
          continue;
        }
        
        // 处理字符串外的字符
        if (char === '"') {
          inString = true;
          continue;
        }
        
        // 处理JSON对象的开始
        if (char === '{' && jsonStartPos === -1) {
          jsonStartPos = i;
          bracketCount = 1;
          continue;
        }
        
        // 跟踪嵌套括号
        if (jsonStartPos !== -1) {
          if (char === '{') {
            bracketCount++;
          } else if (char === '}') {
            bracketCount--;
            
            // 找到完整的JSON对象
            if (bracketCount === 0) {
              const jsonStr = combinedText.substring(jsonStartPos, i + 1);
              try {
                const jsonData = JSON.parse(jsonStr);
                // 🔑 改为批量收集，避免逐个处理的性能损耗
                jsonObjects.push(jsonData);
              } catch (jsonError) {
                console.error('解析JSON对象失败:', jsonError, jsonStr.substring(0, 100));
              }
              
              processedUpTo = i + 1;
              jsonStartPos = -1;
            }
          }
        }
      }
      
      // 🔑 批量处理所有JSON对象，减少函数调用开销
      if (jsonObjects.length > 0) {
        jsonObjects.forEach(jsonData => {
          this.processJsonData(jsonData);
        });
      }
      
      // 分离纯文本内容（非JSON部分）
      let pureText = '';
      let lastEnd = 0;
      
      // 重新扫描以提取纯文本
      jsonStartPos = -1;
      bracketCount = 0;
      inString = false;
      escapeNext = false;
      
      for (let i = 0; i < combinedText.length; i++) {
        const char = combinedText[i];
        
        if (inString) {
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          if (char === '"') {
            inString = false;
          }
          continue;
        }
        
        if (char === '"') {
          inString = true;
          continue;
        }
        
        if (char === '{' && jsonStartPos === -1) {
          // JSON开始前的文本
          const textBefore = combinedText.substring(lastEnd, i);
          if (textBefore.trim()) {
            pureText += textBefore;
          }
          jsonStartPos = i;
          bracketCount = 1;
          continue;
        }
        
        if (jsonStartPos !== -1) {
          if (char === '{') {
            bracketCount++;
          } else if (char === '}') {
            bracketCount--;
            if (bracketCount === 0) {
              lastEnd = i + 1;
              jsonStartPos = -1;
            }
          }
        }
      }
      
      // 添加最后剩余的文本
      if (lastEnd < combinedText.length) {
        const remainingText = combinedText.substring(lastEnd);
        if (remainingText.trim()) {
          pureText += remainingText;
        }
      }
      
      // 更新行缓冲区（保留未完成的JSON）
      if (jsonStartPos !== -1) {
        this.setData({
          lineBuffer: combinedText.substring(jsonStartPos)
        });
      } else {
        this.setData({
          lineBuffer: ''
        });
      }
      
      // 🔑 关键修复：严格过滤流式数据格式
      // OpenAI流式格式的内容应该通过JSON中的choices.delta.content提取
      // 移除所有SSE协议数据前缀（如"data:"）
      if (pureText && pureText.trim().length > 0) {
        // 清理所有SSE协议标记
        let cleanedText = pureText;
        
        // 移除所有以"data:"开头的行
        const lines = cleanedText.split('\n');
        const cleanedLines = lines.filter(line => {
          const trimmedLine = line.trim();
          // 过滤掉空行、"data:"前缀行、只包含空格的"data: "行
          return trimmedLine && 
                 !trimmedLine.startsWith('data:') && 
                 !trimmedLine.startsWith('data: ');
        });
        
        cleanedText = cleanedLines.join('\n').trim();
        
        // 只有清理后仍有内容的文本才添加到显示缓冲区
        if (cleanedText.length > 0) {
          // console.log('添加清理后的纯文本到缓冲区:', cleanedText.substring(0, 50) + '...');
          this.appendToBuffer(cleanedText);
        }
      }
      
    } catch (error) {
      console.error('processChunk处理失败:', error);
      // 出错时清空行缓冲区，避免积累错误数据
      this.setData({
        lineBuffer: ''
      });
    }
  },

  // 添加错误处理方法
  handleError: function(message) {
    console.error('❌ 生成错误:', message);
    
    // 清理所有定时器
    this.clearAllTimers();
    
    // 重置所有生成相关状态
    this.setData({
      isGenerating: false,
      isGenerationActive: false,
      generationSessionId: null,
      showResult: true,
      typingTimer: null,
      isTyping: false,
      showCursor: false,
      currentRequestTask: null,
      streamEndSignal: true,
      completionCheckActive: false,
      lastStateChangeTime: Date.now(),
      // 显示错误提示
      result: {
        sections: [{
          title: '',
          content: [{
            type: 'text',
            text: '生成失败: ' + message
          }]
        }]
      }
    });
    
    wx.showToast({
      title: message.length > 20 ? '生成失败，请重试' : message,
      icon: 'none',
      duration: 2000
    });
  },

  // 添加流式响应处理方法
  handleStreamResponse: function(response) {
    if (!response.data) return;
    
    let text = '';
    if (typeof response.data === 'string') {
      text = response.data;
      // console.log('🔄 流式数据类型: string, 长度:', text.length);
    } else if (response.data instanceof ArrayBuffer) {
      // 🔧 使用polyfill后的TextDecoder，真机兼容
      const decoder = new TextDecoder('utf-8');
      text = decoder.decode(response.data);
      // console.log('🔄 流式数据类型: ArrayBuffer, 解码后长度:', text.length);
      
      // 调试信息：检查解码结果
      if (text.includes('�')) {
        console.warn('⚠️ 流式数据解码包含替换字符，可能存在编码问题');
      }
    }
    
    if (text) {
      this.processStreamData(text);
    }
  },

  // 添加流式数据处理方法
  processStreamData: function(text) {
    // console.log('处理流式数据:', text.substring(0, 100) + '...');
    
    // 检查是否包含JSON数据
    try {
      if (text.includes('"id":') || text.includes('"prompt_id":')) {
        const jsonMatch = text.match(/\{[^}]*"id"[^}]*\}/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0]);
          this.processJsonData(jsonData);
        }
      }
    } catch (e) {
      // 忽略JSON解析错误
    }
    
    // 添加到缓冲区
    this.appendToBuffer(text);
  },

  // 添加JSON数据处理方法
  processJsonData: function(jsonData) {
    try {
      // console.log('处理JSON数据:', jsonData);
      
      // 保存最后的JSON数据
      this.lastJsonData = jsonData;
      
      // ID提取逻辑
      if (jsonData.id && !this.data.currentPromptId) {
        // console.log("从JSON数据中提取到ID:", jsonData.id);
        this.setData({ currentPromptId: jsonData.id });
      }
      
      if (jsonData.prompt_id && !this.data.currentPromptId) {
        // console.log("从JSON数据中提取到prompt_id:", jsonData.prompt_id);
        this.setData({ currentPromptId: jsonData.prompt_id });
      }
      
      if (jsonData.response && jsonData.response.id && !this.data.currentPromptId) {
        // console.log("从response对象中提取到ID:", jsonData.response.id);
        this.setData({ currentPromptId: jsonData.response.id });
      }
      
      // 🔑 关键修复：处理OpenAI格式的流式响应
      if (jsonData.choices && jsonData.choices.length > 0) {
        const choice = jsonData.choices[0];
        
        // 获取内容部分
        if (choice.delta && choice.delta.content) {
          const content = choice.delta.content;
          // console.log(`添加流式内容: "${content.length > 20 ? content.substring(0, 20) + '...' : content}"`);
          this.appendToBuffer(content);
        }
        
        // 保存ID（OpenAI格式的ID通常在最外层）
        if (jsonData.id && !this.data.currentPromptId) {
          // console.log("从OpenAI响应中提取到ID:", jsonData.id);
          this.setData({ currentPromptId: jsonData.id });
        }
        
        // 结束检测
        if (choice.finish_reason === 'stop') {
          // console.log('检测到OpenAI结束标记，设置流结束信号');
          setTimeout(() => {
            this.setData({ streamEndSignal: true });
          }, 1000);
        }
      }
      
      // 处理其他格式的响应
      if (jsonData.content && typeof jsonData.content === 'string') {
        // console.log(`添加直接内容: "${jsonData.content.length > 20 ? jsonData.content.substring(0, 20) + '...' : jsonData.content}"`);
        this.appendToBuffer(jsonData.content);
      }
      
    } catch (error) {
      console.error('处理JSON数据失败:', error);
    }
  },

  // 添加新方法来专门获取内容ID  
  retrieveContentId: function(originalInput) {
    // console.log("尝试获取内容ID...");
    
    // 暂时跳过此API调用，因为端点不存在
    // console.log("API端点不存在，跳过获取内容ID");
    
    // 直接尝试从app的方法获取历史记录ID
    const app = getApp();
    app.getLatestPromptIdFromHistory()
      .then(historyId => {
        if (historyId) {
          const formattedId = app.formatPromptId(historyId);
          if (formattedId) {
            // console.log('从历史记录获取到ID:', formattedId);
            this.setData({ currentPromptId: formattedId });
            this.checkFavoriteStatus();
          }
        }
      })
      .catch(err => {
        console.error('获取历史记录ID失败:', err);
      });
  },

  // 添加收藏方法
  toggleFavorite: async function() {
    // console.log('尝试收藏，当前ID:', this.data.currentPromptId);
    
    if (!this.data.result || !this.data.fullContent) {
      wx.showToast({
        title: '无可收藏内容',
        icon: 'none'
      });
      return;
    }
    
    const app = getApp();
    
    // 确保有有效的ID
    let idToUse = this.data.currentPromptId;
    
    // 如果没有currentPromptId，尝试从最后的JSON数据中获取
    if (!idToUse && this.lastJsonData) {
      if (this.lastJsonData.id) {
        idToUse = this.lastJsonData.id;
      } else if (this.lastJsonData.prompt_id) {
        idToUse = this.lastJsonData.prompt_id;
      }
    }
    
    // 如果还是没有ID，使用内容哈希作为备用ID
    if (!idToUse && this.data.fullContent) {
      const timestamp = Date.now();
      const contentHash = this.simpleHash(this.data.fullContent.substring(0, 100));
      idToUse = `local_${timestamp}_${contentHash}`;
      // console.log('生成本地ID用于收藏:', idToUse);
      // 保存这个ID供后续使用
      this.setData({ currentPromptId: idToUse });
    }
    
    if (!idToUse) {
      wx.showToast({
        title: '无法生成收藏ID',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({
        title: this.data.isFavorited ? '取消收藏中' : '收藏中',
        mask: true
      });
      
      if (this.data.isFavorited) {
        // 取消收藏
        await app.removeFavorite(idToUse);
        this.setData({ isFavorited: false });
        wx.hideLoading();
        wx.showToast({
          title: '已取消收藏',
          icon: 'success'
        });
      } else {
        // 添加收藏
        // 准备收藏数据
        const favoriteData = {
          id: idToUse,
          content: this.data.fullContent,
          original_input: this.data.inputText,
          model_type: this.data.currentModelType,
          model_name: this.data.currentModel,
          style: this.data.currentStyle,
          created_at: new Date().toISOString(),
          timestamp: Date.now()
        };
        
        // 调用app的收藏方法，传入完整数据
        await app.addFavoriteWithData(idToUse, favoriteData);
        this.setData({ isFavorited: true });
        wx.hideLoading();
        wx.showToast({
          title: '已收藏',
          icon: 'success'
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('收藏操作失败:', err);
      
      // 如果是"未找到该记录"错误，说明需要先保存到历史记录
      if (err.message && err.message.includes('未找到该记录')) {
        // 尝试本地收藏
        try {
          const localFavorites = wx.getStorageSync('local_favorites') || [];
          
          if (this.data.isFavorited) {
            // 从本地收藏中移除
            const index = localFavorites.findIndex(item => item.id === idToUse);
            if (index > -1) {
              localFavorites.splice(index, 1);
              wx.setStorageSync('local_favorites', localFavorites);
              this.setData({ isFavorited: false });
              wx.showToast({
                title: '已取消收藏',
                icon: 'success'
              });
            }
          } else {
            // 添加到本地收藏
            const favoriteItem = {
              id: idToUse,
              content: this.data.fullContent,
              original_input: this.data.inputText,
              model_type: this.data.currentModelType,
              model_name: this.data.currentModel,
              style: this.data.currentStyle,
              created_at: new Date().toISOString(),
              timestamp: Date.now()
            };
            
            localFavorites.unshift(favoriteItem);
            wx.setStorageSync('local_favorites', localFavorites);
            this.setData({ isFavorited: true });
            wx.showToast({
              title: '已收藏到本地',
              icon: 'success'
            });
          }
        } catch (localErr) {
          console.error('本地收藏失败:', localErr);
          wx.showToast({
            title: '收藏失败',
            icon: 'none'
          });
        }
      } else {
        // 其他错误
        wx.showToast({
          title: '收藏失败，请稍后再试',
          icon: 'none'
        });
      }
    }
  },

  // 添加复制方法
  handleCopy: function() {
    if (!this.data.originalResponse) {
      wx.showToast({
        title: '无可复制内容',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 去除 [图片描述] URL 格式的内容
    const imagePattern = /\[([^\]]+)\]\s+(https?:\/\/[^\s]+)/g;
    const cleanedContent = this.data.originalResponse.replace(imagePattern, '').trim();
    
    wx.setClipboardData({
      data: cleanedContent,
      success: () => {
        wx.showToast({
          title: '已全局复制',
          icon: 'success',
          duration: 2000
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'error',
          duration: 2000
        });
      }
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

  // 添加事件阻止冒泡方法
  stopPropagation: function(e) {
    // console.log("阻止分享按钮事件冒泡");
    e.stopPropagation && e.stopPropagation();
    return false;
  },

  // 保留原分享方法作为备用（现在使用原生按钮分享）
  handleShare: function() {
    // console.log('备用分享方法被调用');
    // 现在主要使用原生按钮分享，这个方法保留作为备用
  },

  // 添加滚动到底部的方法
  scrollToBottom: function() {
    // console.log('执行滚动到底部');
    
    // 简单粗暴的方法：直接滚动到很大的位置值
    try {
      wx.pageScrollTo({
        scrollTop: 99999, // 使用一个很大的值确保滚动到底部
        duration: 300
      });
      
      // 如果内容已生成完毕，滚动后隐藏箭头
      if (!this.data.isGenerating) {
        setTimeout(() => {
          this.setData({
            showScrollArrow: false
          });
        }, 500);
      }
    } catch (error) {
      console.error('滚动到底部失败:', error);
    }
  },

  // 添加分享到朋友的方法
  onShareAppMessage: function(res) {
    // console.log('分享给朋友', res);
    
    // 如果是从原生分享按钮触发的分享（与历史记录逻辑一致）
    if (res.from === 'button' && res.target && res.target.dataset) {
      const dataset = res.target.dataset;
      // console.log('使用原生按钮分享，数据:', dataset);
      
      // 获取分享数据 - 优先使用真实的share_id
      const shareId = dataset.shareId || this.data.currentShareId || this.data.currentPromptId;
      // console.log('分享ID获取 - dataset.shareId:', dataset.shareId, 'currentShareId:', this.data.currentShareId, '最终使用:', shareId);
      const modelType = dataset.modelType || this.data.currentModelType;
      const modelName = dataset.modelName || this.data.currentModel;
      const style = dataset.style || this.data.currentStyle;
      const inputText = dataset.input || this.data.inputText;
      
      // 获取模型标签（与历史记录逻辑一致）
      const typeName = this.data.modelTypeNames[modelType] || '文生文';
      const modelDisplayName = this.data.modelNames[modelName] || '通用模型';
      const styleName = this.data.styleOptions.find(s => s.id === style)?.name || '有用';
      const modelLabel = `${typeName} - ${modelDisplayName} - ${styleName}`;

      // 构建新的分享标题：分享的灵感 - 用户提示词 - 模型场景（风格）
      const userPrompt = inputText || this.data.inputText || this.data.userInput || '提示词';
      const shortPrompt = userPrompt.length > 20 ? userPrompt.substring(0, 20) + '...' : userPrompt;

      // 解析模型标签，将风格用括号包裹
      const modelParts = modelLabel.split(' - ');
      let formattedModel = modelLabel;
      if (modelParts.length >= 3) {
        // 格式：场景 - 模型 - 风格 -> 模型场景（风格）
        const [scene, model, style] = modelParts;
        formattedModel = `${model}${scene}（${style}）`;
      }

      const shareTitle = `分享的灵感 - ${shortPrompt} - ${formattedModel}`;

      return {
        title: shareTitle,
        path: `/pages/shared/shared?share_id=${shareId}&type=friend`,
        imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)
      };
    }
    
    // 如果没有内容，返回默认分享
    if (!this.data.fullContent) {
      // console.log('无可分享内容，使用默认分享');
      return {
        title: '序话 - AI提示词优化工具',
        path: '/pages/index/index',
        imageUrl: '/assets/icons/spark.png'
      };
    }

    // 生成分享ID（优先使用现有ID，否则生成临时ID）
    let shareId = this.data.currentShareId || this.data.currentPromptId;
    if (!shareId) {
      // 生成临时分享ID
      const timestamp = Date.now();
      const contentHash = this.simpleHash(this.data.fullContent.substring(0, 50));
      shareId = `share_${timestamp}_${contentHash}`;
      
      // 保存分享数据到本地存储，供分享页面读取
      const shareContent = {
        id: shareId,
        content: this.data.fullContent,
        input: this.data.inputText,
        modelType: this.data.currentModelType,
        modelName: this.data.currentModel,
        style: this.data.currentStyle,
        timestamp: timestamp
      };
      
      try {
        // 保存到本地存储
        let shareHistory = wx.getStorageSync('share_history') || {};
        shareHistory[shareId] = shareContent;
        wx.setStorageSync('share_history', shareHistory);
        // console.log('分享内容已保存，ID:', shareId);
      } catch (e) {
        console.error('保存分享内容失败:', e);
      }
    }
    
    const shareTitle = this.data.inputText && this.data.inputText.length > 0 
      ? `序话：${this.data.inputText.substring(0, 20)}${this.data.inputText.length > 20 ? '...' : ''}`
      : '我用序话点亮了一个提示词，快来看看吧！';
    
    return {
      title: shareTitle,
      path: `/pages/shared/shared?share_id=${shareId}`,
      imageUrl: '/assets/icons/spark.png'
    };
  },

  // 添加分享到朋友圈的方法  
  onShareTimeline: function() {
    // console.log('分享到朋友圈');
    
    // 如果是从分享按钮触发的分享
    if (this.data.shareFromButton && this.data.currentPromptId && this.data.fullContent) {
      // console.log('使用按钮分享到朋友圈，ID:', this.data.currentPromptId);
      
      // 重置分享标记
      this.setData({
        shareFromButton: false
      });
      
      // 获取模型标签（与历史记录逻辑一致）
      const typeName = this.data.modelTypeNames[this.data.currentModelType] || '文生文';
      const modelDisplayName = this.data.modelNames[this.data.currentModel] || '通用模型';
      const styleName = this.data.styleOptions.find(s => s.id === this.data.currentStyle)?.name || '有用';
      const modelLabel = `${typeName} - ${modelDisplayName} - ${styleName}`;

      // 构建新的分享标题：分享的灵感 - 用户提示词 - 模型场景（风格）
      const userPrompt = this.data.inputText || this.data.userInput || '提示词';
      const shortPrompt = userPrompt.length > 20 ? userPrompt.substring(0, 20) + '...' : userPrompt;

      // 解析模型标签，将风格用括号包裹
      const modelParts = modelLabel.split(' - ');
      let formattedModel = modelLabel;
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
          const subjectDesc = this.extractSubjectDescription(this.data.fullContent);
          if (subjectDesc) {
            shareTitle = `分享的灵感 - 识图 - ${subjectDesc}`;
          } else {
            shareTitle = `分享的灵感 - 识图 - GPT Image生图`;
          }
        }
      }

      return {
        title: shareTitle,
        query: `share_id=${this.data.currentShareId || this.data.currentPromptId}&type=timeline`,
        imageUrl: getImageUrl(CDN.IMAGES.SHARE_IMAGE)
      };
    }
    
    // 如果没有内容，返回默认分享
    if (!this.data.fullContent) {
      // console.log('无可分享内容，使用默认分享');
      return {
        title: '序话 - AI提示词优化工具',
        query: '',
        imageUrl: '/assets/icons/spark.png'
      };
    }

    // 生成分享ID（与onShareAppMessage保持一致）
    let shareId = this.data.currentShareId || this.data.currentPromptId;
    if (!shareId) {
      const timestamp = Date.now();
      const contentHash = this.simpleHash(this.data.fullContent.substring(0, 50));
      shareId = `share_${timestamp}_${contentHash}`;
      
      // 保存分享数据（与onShareAppMessage保持一致）
      const shareContent = {
        id: shareId,
        content: this.data.fullContent,
        input: this.data.inputText,
        modelType: this.data.currentModelType,
        modelName: this.data.currentModel,
        style: this.data.currentStyle,
        timestamp: timestamp
      };
      
      try {
        let shareHistory = wx.getStorageSync('share_history') || {};
        shareHistory[shareId] = shareContent;
        wx.setStorageSync('share_history', shareHistory);
      } catch (e) {
        console.error('保存分享内容失败:', e);
      }
    }
    
    const shareTitle = this.data.inputText && this.data.inputText.length > 0 
      ? `序话：${this.data.inputText.substring(0, 20)}${this.data.inputText.length > 20 ? '...' : ''}`
      : '我用序话点亮了一个提示词，快来看看吧！';
    
    return {
      title: shareTitle,
      query: `share_id=${shareId}`,
      imageUrl: '/assets/icons/spark.png'
    };
  }
});
