/**
 * 历史记录调试工具
 * 用于诊断历史记录显示问题
 */

const DebugTools = {
  /**
   * 检查历史记录API响应
   */
  async testHistoryAPI(openid) {
    console.log('🔍 开始测试历史记录API...');
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://www.duyueai.com/history',
        method: 'GET',
        data: {
          openid: openid,
          page: 1
        },
        success: (res) => {
          console.log('📊 历史记录API测试结果:');
          console.log('  - 状态码:', res.statusCode);
          console.log('  - 响应码:', res.data?.code);
          console.log('  - 数据数量:', res.data?.data?.length || 0);
          console.log('  - 完整响应:', res.data);
          
          if (res.data?.data?.length > 0) {
            console.log('  - 最新记录详情:');
            const latest = res.data.data[0];
            console.log('    prompt_id:', latest.prompt_id);
            console.log('    share_id:', latest.share_id);
            console.log('    created_at:', latest.created_at);
            console.log('    model_type:', latest.model_type);
            console.log('    model_name:', latest.model_name);
            console.log('    content长度:', latest.content?.length || 0);
            console.log('    response长度:', latest.response?.length || 0);
          }
          
          resolve(res.data);
        },
        fail: (err) => {
          console.error('❌ 历史记录API调用失败:', err);
          reject(err);
        }
      });
    });
  },

  /**
   * 检查会话映射
   */
  checkSessionMappings() {
    const app = getApp();
    console.log('🔍 检查会话映射:');
    console.log('  - historySessionMapping:', app.globalData.historySessionMapping);
    console.log('  - historyLabels:', app.globalData.historyLabels);
    console.log('  - sessionLabels:', app.globalData.sessionLabels);
    console.log('  - contentLabels:', app.globalData.contentLabels);
  },

  /**
   * 模拟生成过程的完整调试
   */
  async simulateGenerationFlow(testPromptId = '1616') {
    console.log('🔍 模拟生成流程调试...');
    const app = getApp();
    
    // 1. 检查openid
    console.log('1. OpenID:', app.globalData.openid);
    
    // 2. 测试历史记录API
    try {
      const historyData = await this.testHistoryAPI(app.globalData.openid);
      
      // 3. 检查是否能找到指定ID的记录
      if (historyData.data && historyData.data.length > 0) {
        const found = historyData.data.find(record => record.prompt_id == testPromptId);
        console.log('3. 查找ID为', testPromptId, '的记录:', found ? '找到' : '未找到');
        if (found) {
          console.log('   记录详情:', found);
        }
      }
      
      // 4. 检查会话映射
      this.checkSessionMappings();
      
      // 5. 检查最新生成时间
      console.log('5. 最后生成时间:', new Date(app.globalData.lastGeneratedTimestamp || 0));
      console.log('   最后生成标签:', app.globalData.lastGeneratedLabel);
      
    } catch (err) {
      console.error('模拟流程出错:', err);
    }
  }
};

// 导出工具
module.exports = DebugTools;