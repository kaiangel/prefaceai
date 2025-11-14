// pages/feedback/feedback.js
Page({
  data: {
    feedbackTypes: [
      { id: 1, name: '功能建议' },
      { id: 2, name: '体验问题' },
      { id: 3, name: '其他' }
    ],
    selectedType: 1,
    content: '',
    contact: '',
    images: [],
    submitting: false,
    // 字数限制
    maxContentLength: 500,
    maxContactLength: 50
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 选择反馈类型
  selectType(e) {
    this.setData({
      selectedType: e.currentTarget.dataset.type
    });
  },

  // 输入反馈内容
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 输入联系方式
  onContactInput(e) {
    this.setData({
      contact: e.detail.value
    });
  },

  // 选择图片
  chooseImage() {
    const remainCount = 3 - this.data.images.length;
    if (remainCount <= 0) {
      wx.showToast({
        title: '最多上传3张图片',
        icon: 'none'
      });
      return;
    }

    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          images: [...this.data.images, ...tempFilePaths]
        });
      }
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    images.splice(index, 1);
    this.setData({ images });
  },

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.src;
    wx.previewImage({
      current,
      urls: this.data.images
    });
  },

  // 提交反馈
  submitFeedback() {
    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    // TODO: 实际的提交逻辑
    setTimeout(() => {
      this.setData({ submitting: false });
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      });
    }, 1500);
  }
});