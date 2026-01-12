// components/reference-input/reference-input.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 可以从父组件传入初始值
    defaultImage: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    uploadedImage: '', // 上传的图片路径
    inputText: ''      // 输入的补充需求
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 选择图片
     */
    handleChooseImage() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          console.log('选择的图片路径:', tempFilePath);
          
          // 先显示本地预览
          this.setData({
            uploadedImage: tempFilePath
          });

          // 自动上传到服务器
          this.uploadImageToServer(tempFilePath);
          
          // 触发事件通知父组件(传递本地路径)
          this.triggerEvent('imageselected', {
            imagePath: tempFilePath
          });
        },
        fail: (err) => {
          console.error('选择图片失败:', err);
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 移除图片
     */
    handleRemoveImage(e) {
      console.log('点击移除图片按钮');
      
      this.setData({
        uploadedImage: ''
      });

      // 触发事件通知父组件
      this.triggerEvent('imageremoved');
      
      console.log('图片已移除,uploadedImage:', this.data.uploadedImage);
    },

    /**
     * 输入框内容变化
     */
    onInputChange(e) {
      this.setData({
        inputText: e.detail.value
      });

      // 触发事件通知父组件
      this.triggerEvent('inputchange', {
        text: e.detail.value
      });
    },

    /**
     * 上传图片到服务器
     * @param {String} filePath 本地图片路径
     */
    uploadImageToServer(filePath) {
      wx.showLoading({
        title: '上传中...',
        mask: true
      });

      wx.uploadFile({
        url: 'https://www.duyueai.com/upload_image',
        filePath: filePath,
        name: 'file',
        success: (res) => {
          wx.hideLoading();
          
          try {
            const data = JSON.parse(res.data);
            console.log('图片上传响应:', data);
            
            if (data.code === 0 && data.url) {
              console.log('图片上传成功,URL:', data.url);
              
              // 触发上传成功事件,传递服务器返回的URL
              this.triggerEvent('uploadcomplete', {
                imageUrl: data.url
              });
              
              wx.showToast({
                title: '上传成功',
                icon: 'success',
                duration: 1500
              });
            } else {
              console.error('上传失败:', data.msg || '未知错误');
              wx.showToast({
                title: data.msg || '上传失败',
                icon: 'none'
              });
            }
          } catch (e) {
            console.error('解析服务器响应失败:', e);
            wx.showToast({
              title: '解析响应失败',
              icon: 'none'
            });
          }
        },
        fail: (error) => {
          wx.hideLoading();
          console.error('图片上传失败:', error);
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 获取当前组件数据(供父组件调用)
     */
    getData() {
      return {
        image: this.data.uploadedImage,
        text: this.data.inputText
      };
    },

    /**
     * 重置组件数据
     */
    reset() {
      this.setData({
        uploadedImage: '',
        inputText: ''
      });
    }
  }
});
