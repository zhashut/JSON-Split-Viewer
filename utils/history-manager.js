/**
 * 历史记录管理模块
 */

const HistoryManager = {
    maxHistory: 10,
    storageKey: 'json_history',

    /**
     * 保存 JSON 到历史记录
     */
    async save(jsonString) {
        if (!jsonString || !jsonString.trim()) return;

        try {
            const history = await this.getAll();
            const timestamp = Date.now();
            const preview = this.generatePreview(jsonString);

            const newItem = {
                id: timestamp,
                content: jsonString,
                preview: preview,
                timestamp: timestamp,
                date: new Date(timestamp).toLocaleString('zh-CN')
            };

            // 去重：如果内容相同则不添加
            const exists = history.some(item => item.content === jsonString);
            if (exists) return;

            // 添加到开头
            history.unshift(newItem);

            // 限制数量
            if (history.length > this.maxHistory) {
                history.splice(this.maxHistory);
            }

            await chrome.storage.local.set({ [this.storageKey]: history });
        } catch (err) {
            console.error('保存历史记录失败:', err);
        }
    },

    /**
     * 获取所有历史记录
     */
    async getAll() {
        try {
            const result = await chrome.storage.local.get(this.storageKey);
            return result[this.storageKey] || [];
        } catch (err) {
            console.error('获取历史记录失败:', err);
            return [];
        }
    },

    /**
     * 根据 ID 获取历史记录
     */
    async getById(id) {
        const history = await this.getAll();
        return history.find(item => item.id === parseInt(id));
    },

    /**
     * 清空历史记录
     */
    async clear() {
        try {
            await chrome.storage.local.remove(this.storageKey);
        } catch (err) {
            console.error('清空历史记录失败:', err);
        }
    },

    /**
     * 生成预览文本
     */
    generatePreview(jsonString) {
        const maxLength = 50;
        const preview = jsonString.replace(/\s+/g, ' ').trim();
        return preview.length > maxLength 
            ? preview.substring(0, maxLength) + '...' 
            : preview;
    }
};
