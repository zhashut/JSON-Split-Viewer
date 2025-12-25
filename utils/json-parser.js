/**
 * JSON 解析和渲染工具
 */

const JSONParser = {
    currentData: null,
    searchKeyword: '',
    
    /**
     * 解析并渲染 JSON 数据（带性能优化）
     */
    parse(jsonString, container, options = {}) {
        container.innerHTML = '';

        if (!jsonString.trim()) return;

        // 显示加载动画（大数据时）
        const size = new Blob([jsonString]).size;
        if (size > 1024 * 1024) { // 超过 1MB
            this.showLoading(container);
        }

        try {
            const data = JSON.parse(jsonString);
            this.currentData = data;

            // 使用 requestIdleCallback 进行渲染优化
            if (window.requestIdleCallback && size > 1024 * 100) { // 超过 100KB
                requestIdleCallback(() => {
                    this.renderTree(data, container);
                });
            } else {
                this.renderTree(data, container);
            }
        } catch (e) {
            container.innerHTML = `<div style="color:red; padding:10px;">JSON 解析错误: ${e.message}</div>`;
        }
    },

    /**
     * 渲染树状结构
     */
    renderTree(data, container) {
        container.innerHTML = '';
        const tree = this.renderNode(null, data, true);
        container.appendChild(tree);
    },

    /**
     * 显示加载动画
     */
    showLoading(container) {
        container.innerHTML = '<div style="padding:20px; text-align:center;"><div class="loading"></div><div style="margin-top:10px;">解析中...</div></div>';
    },

    /**
     * 递归渲染节点
     */
    renderNode(key, value, isLast = true) {
        const type = this.getType(value);
        const isComplex = type === 'object' || type === 'array';
        
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'jv-node';

        const lineDiv = document.createElement('div');
        lineDiv.className = 'jv-line';

        // 折叠图标
        const toggleSpan = document.createElement('span');
        toggleSpan.className = 'jv-toggle' + (isComplex ? '' : ' hidden');
        toggleSpan.innerText = '▶';
        lineDiv.appendChild(toggleSpan);

        // 键名
        if (key !== null) {
            const keySpan = document.createElement('span');
            keySpan.className = 'jv-key';
            keySpan.innerText = `"${key}":`;
            
            // 搜索高亮
            if (this.searchKeyword && this.matchSearch(key)) {
                keySpan.classList.add('search-highlight');
            }
            
            lineDiv.appendChild(keySpan);
        }

        // 值或开始括号
        if (isComplex) {
            const openBracket = document.createElement('span');
            openBracket.className = 'jv-pun';
            openBracket.innerText = type === 'array' ? '[' : '{';
            lineDiv.appendChild(openBracket);

            // 省略号
            const ellipsis = document.createElement('span');
            ellipsis.className = 'jv-ellipsis';
            ellipsis.innerText = `... ${type === 'array' ? value.length + ' items' : Object.keys(value).length + ' keys'} ...`;
            
            ellipsis.onclick = (e) => {
                e.stopPropagation();
                this.toggleNode(nodeDiv);
            };
            
            // 子节点容器
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'jv-children';
            
            // 递归处理子元素
            const keys = Object.keys(value);
            keys.forEach((k, index) => {
                const isLastChild = index === keys.length - 1;
                const childNode = this.renderNode(type === 'array' ? null : k, value[k], isLastChild);
                childrenDiv.appendChild(childNode);
            });

            // 闭合括号
            const closeDiv = document.createElement('div');
            closeDiv.className = 'jv-node';
            closeDiv.innerHTML = `<div class="jv-line" style="padding-left:24px"><span class="jv-pun">${type === 'array' ? ']' : '}'}${isLast ? '' : ','}</span></div>`;

            nodeDiv.appendChild(lineDiv);
            nodeDiv.appendChild(childrenDiv);
            nodeDiv.appendChild(ellipsis);
            nodeDiv.appendChild(closeDiv);

            // 绑定折叠事件
            const toggleAction = () => this.toggleNode(nodeDiv);
            toggleSpan.onclick = toggleAction;
            lineDiv.ondblclick = (e) => {
                e.stopPropagation();
                toggleAction();
            };

        } else {
            // 基本数据类型
            const valSpan = document.createElement('span');
            valSpan.className = `jv-${type}`;
            if (type === 'string') valSpan.innerText = `"${value}"`;
            else valSpan.innerText = value + '';
            
            // 搜索高亮
            if (this.searchKeyword && this.matchSearch(value)) {
                valSpan.classList.add('search-highlight');
            }
            
            lineDiv.appendChild(valSpan);

            // 逗号
            if (!isLast) {
                const comma = document.createElement('span');
                comma.className = 'jv-pun';
                comma.innerText = ',';
                lineDiv.appendChild(comma);
            }
            
            nodeDiv.appendChild(lineDiv);
        }

        // 添加复制菜单
        const menu = document.createElement('div');
        menu.className = 'action-menu';
        
        // 复制 Key
        if (key) {
            const btnKey = this.createActionBtn('复制 Key', () => this.copyText(key));
            menu.appendChild(btnKey);
        }
        
        // 复制 Value
        const btnVal = this.createActionBtn('复制 Value', () => {
            const text = isComplex ? JSON.stringify(value, null, 2) : value;
            this.copyText(text);
        });
        menu.appendChild(btnVal);

        lineDiv.appendChild(menu);

        return nodeDiv;
    },

    /**
     * 创建操作按钮
     */
    createActionBtn(text, onClick) {
        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.innerText = text;
        btn.onclick = (e) => {
            e.stopPropagation();
            onClick();
        };
        return btn;
    },

    /**
     * 获取值的类型
     */
    getType(val) {
        if (val === null) return 'null';
        if (Array.isArray(val)) return 'array';
        return typeof val;
    },

    /**
     * 切换节点折叠状态
     */
    toggleNode(nodeDiv) {
        const children = nodeDiv.querySelector('.jv-children');
        const toggleBtn = nodeDiv.querySelector('.jv-toggle');
        const closeDiv = nodeDiv.lastChild;
        
        if (!children) return;

        if (children.classList.contains('hidden')) {
            children.classList.remove('hidden');
            toggleBtn.classList.remove('collapsed');
            closeDiv.style.display = 'block';
        } else {
            children.classList.add('hidden');
            toggleBtn.classList.add('collapsed');
            closeDiv.style.display = 'none';
        }
    },

    /**
     * 全部折叠或展开
     */
    toggleAll(expand) {
        const allChildren = document.querySelectorAll('.jv-children');
        const allToggles = document.querySelectorAll('.jv-toggle');

        allChildren.forEach(el => {
            if (expand) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

        allToggles.forEach(el => {
            if (expand) {
                el.classList.remove('collapsed');
            } else {
                el.classList.add('collapsed');
            }
        });

        // 处理闭合括号的显示
        document.querySelectorAll('.jv-node').forEach(node => {
            const children = node.querySelector('.jv-children');
            if (children) {
                const closeDiv = node.lastChild;
                if (closeDiv && closeDiv.classList.contains('jv-node')) {
                    closeDiv.style.display = expand ? 'block' : 'none';
                }
            }
        });
    },

    /**
     * 复制文本到剪贴板
     */
    async copyText(text) {
        try {
            await navigator.clipboard.writeText(String(text));
            this.showToast('已复制!');
        } catch (err) {
            console.error('复制失败:', err);
            this.showToast('复制失败');
        }
    },

    /**
     * 显示提示消息
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.innerText = message;
        toast.style.cssText = 'position:fixed; top:20px; left:50%; background:rgba(0,0,0,0.7); color:#fff; padding:8px 16px; border-radius:4px; transform:translateX(-50%); z-index:9999;';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1500);
    },

    /**
     * 搜索功能
     */
    search(keyword) {
        this.searchKeyword = keyword.toLowerCase();
        
        if (!this.currentData) {
            return { count: 0, matches: [] };
        }

        // 重新渲染以应用高亮
        const container = document.getElementById('jsonViewer');
        if (container) {
            this.renderTree(this.currentData, container);
        }

        // 统计匹配数量
        const matches = this.countMatches(this.currentData, keyword);
        return matches;
    },

    /**
     * 清除搜索
     */
    clearSearch() {
        this.searchKeyword = '';
        const container = document.getElementById('jsonViewer');
        if (container && this.currentData) {
            this.renderTree(this.currentData, container);
        }
    },

    /**
     * 匹配搜索关键词
     */
    matchSearch(value) {
        if (!this.searchKeyword) return false;
        const str = String(value).toLowerCase();
        return str.includes(this.searchKeyword);
    },

    /**
     * 统计匹配数量
     */
    countMatches(obj, keyword) {
        let count = 0;
        const matches = [];
        const lowerKeyword = keyword.toLowerCase();

        const traverse = (value, path = '') => {
            if (value === null || value === undefined) return;

            const type = this.getType(value);
            
            if (type === 'object' || type === 'array') {
                const keys = Object.keys(value);
                keys.forEach(key => {
                    const newPath = path ? `${path}.${key}` : key;
                    
                    // 检查 key 是否匹配
                    if (String(key).toLowerCase().includes(lowerKeyword)) {
                        count++;
                        matches.push({ type: 'key', path: newPath, value: key });
                    }
                    
                    // 递归检查 value
                    traverse(value[key], newPath);
                });
            } else {
                // 检查基本类型的值
                if (String(value).toLowerCase().includes(lowerKeyword)) {
                    count++;
                    matches.push({ type: 'value', path, value });
                }
            }
        };

        traverse(obj);
        return { count, matches };
    },

    /**
     * 导出为 JSON 文件
     */
    exportJSON(filename = 'export.json') {
        if (!this.currentData) {
            this.showToast('没有可导出的数据');
            return;
        }

        try {
            const jsonString = JSON.stringify(this.currentData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showToast('导出成功！');
        } catch (err) {
            console.error('导出失败:', err);
            this.showToast('导出失败');
        }
    }
};
