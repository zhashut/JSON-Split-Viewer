/**
 * 弹窗页面交互逻辑
 */

// DOM 元素
const jsonInput = document.getElementById('jsonInput');
const jsonViewer = document.getElementById('jsonViewer');
const formatBtn = document.getElementById('formatBtn');
const loadDemoBtn = document.getElementById('loadDemoBtn');
const collapseAllBtn = document.getElementById('collapseAllBtn');
const expandAllBtn = document.getElementById('expandAllBtn');
const exportBtn = document.getElementById('exportBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchResult = document.getElementById('searchResult');
const historySelect = document.getElementById('historySelect');

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 格式化按钮
formatBtn.addEventListener('click', async () => {
    const input = jsonInput.value;
    JSONParser.parse(input, jsonViewer);
    
    // 保存到历史记录
    if (input.trim()) {
        await HistoryManager.save(input);
        await loadHistoryList();
    }
});

// 加载示例按钮
loadDemoBtn.addEventListener('click', () => {
    const demo = {
        "project": "ChromePlugin",
        "version": 1.0,
        "features": ["split-view", "copy-level", "tree-render"],
        "author": {
            "name": "Dev",
            "contact": {
                "email": "test@test.com",
                "github": "@user"
            }
        },
        "config": {
            "theme": "dark",
            "autoSave": true
        }
    };
    jsonInput.value = JSON.stringify(demo);
    JSONParser.parse(jsonInput.value, jsonViewer);
});

// 全部折叠按钮
collapseAllBtn.addEventListener('click', () => {
    JSONParser.toggleAll(false);
});

// 全部展开按钮
expandAllBtn.addEventListener('click', () => {
    JSONParser.toggleAll(true);
});

// 导出按钮
exportBtn.addEventListener('click', () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    JSONParser.exportJSON(`json-export-${timestamp}.json`);
});

// 搜索按钮
searchBtn.addEventListener('click', () => {
    performSearch();
});

// 清除搜索按钮
clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchResult.textContent = '';
    JSONParser.clearSearch();
});

// 搜索输入框回车
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
    }
});

// 搜索输入框实时搜索（防抖）
const debouncedSearch = debounce(() => {
    if (searchInput.value.trim()) {
        performSearch();
    }
}, 500);

searchInput.addEventListener('input', debouncedSearch);

// 执行搜索
function performSearch() {
    const keyword = searchInput.value.trim();
    if (!keyword) {
        searchResult.textContent = '';
        return;
    }

    const result = JSONParser.search(keyword);
    if (result.count > 0) {
        searchResult.textContent = `找到 ${result.count} 个匹配项`;
        searchResult.style.color = '#28a745';
    } else {
        searchResult.textContent = '未找到匹配项';
        searchResult.style.color = '#dc3545';
    }
}

// 历史记录下拉框
historySelect.addEventListener('change', async (e) => {
    const id = e.target.value;
    if (!id) return;

    const item = await HistoryManager.getById(id);
    if (item) {
        jsonInput.value = item.content;
        JSONParser.parse(item.content, jsonViewer);
    }

    // 重置下拉框
    historySelect.value = '';
});

// 加载历史记录列表
async function loadHistoryList() {
    const history = await HistoryManager.getAll();
    
    // 清空现有选项（保留第一个默认选项）
    historySelect.innerHTML = '<option value="">历史记录</option>';
    
    if (history.length === 0) {
        const option = document.createElement('option');
        option.disabled = true;
        option.textContent = '暂无历史记录';
        historySelect.appendChild(option);
        return;
    }

    // 添加历史记录选项
    history.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.date} - ${item.preview}`;
        historySelect.appendChild(option);
    });

    // 添加清空选项
    const clearOption = document.createElement('option');
    clearOption.value = 'clear';
    clearOption.textContent = '--- 清空历史记录 ---';
    clearOption.style.color = '#dc3545';
    historySelect.appendChild(clearOption);
}

// 处理清空历史记录
historySelect.addEventListener('change', async (e) => {
    if (e.target.value === 'clear') {
        if (confirm('确定要清空所有历史记录吗？')) {
            await HistoryManager.clear();
            await loadHistoryList();
            JSONParser.showToast('历史记录已清空');
        }
        historySelect.value = '';
        return;
    }

    const id = e.target.value;
    if (!id) return;

    const item = await HistoryManager.getById(id);
    if (item) {
        jsonInput.value = item.content;
        JSONParser.parse(item.content, jsonViewer);
    }

    historySelect.value = '';
});

// 快捷键支持
jsonInput.addEventListener('keydown', (e) => {
    // Ctrl+Enter 格式化
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        formatBtn.click();
    }
    
    // Ctrl+F 搜索
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Ctrl+S 导出
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        exportBtn.click();
    }
});

// 初始化
window.addEventListener('DOMContentLoaded', async () => {
    await loadHistoryList();
    loadDemoBtn.click();
});
