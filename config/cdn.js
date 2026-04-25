const CDN = {
  BASE_URL: 'https://cdn.duyueai.com',
  IMAGES: {
    LOGO: '/prompt/logo.png',
    CUSTOMER_SERVICE_QR: '/prompt/xxwhkf.jpeg',
    SHARE_IMAGE: '/prompt/magicwand.jpg',  // 分享图片路径
    MODEL_REASONING: '/prompt/model-reasoning.png',
    MODEL_NON_REASONING: '/prompt/model-non-reasoning.png',
    MODEL_AI_AGENT: '/prompt/model-ai-agent.png', // 新增AI Agent模型图标
    MODEL_GPT_Image: '/prompt/model-gpt-image.png',
    MODEL_FLUX: '/prompt/model-flux.png',
    MODEL_JIMENG: '/prompt/model-jimeng.png', // 即梦AI生图模型图标
    MODEL_LOVART: '/prompt/model-lovart.png', // Lovart生图模型图标
    MODEL_MIDJOURNEY: '/prompt/model-midjourney.png',
    MODEL_KELING: '/prompt/model-keling.png',
    MODEL_JIMENGVIDEO: '/prompt/model-jimeng.png', // 即梦AI视频模型图标
    MODEL_RUNWAY: '/prompt/model-runway.png',
    MODEL_WANXIANG: '/prompt/model-wanxiang.png', // 通义万相模型图标
    MODEL_SORA2: '/prompt/model-sora2.png', // Sora2模型图标
    LIGHTNING: '/prompt/lightning.png', // 新增：快速复制按钮图标
    DEFAULT_AVATAR: '/prompt/default-avatar.png'  // 🔑 新增这一行
  }
};

const getImageUrl = (path) => {
  return CDN.BASE_URL + path;
};

module.exports = {
  CDN,
  getImageUrl
};