document.addEventListener('DOMContentLoaded', () => {
    // ================== 配置与常量 ==================
    const ICON_LIB = {
        "Magic": '<path d="M7.5 5.6L10 0l2.5 5.6L18 8l-5.5 2.4L10 16l-2.5-5.6L2 8l5.5-2.4z"/>',
        "Filter": '<path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>',
        "Face": '<path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21 1.01.33 2.05.33 3.14 0 3.92-2.77 7.19-6.52 7.87z"/>',
        "Upscale": '<path d="M12 7.4V2L8 6h3v1.4c-3.14.12-6.66 1.4-9.33 3.69l1.32 1.6C4.82 11.09 7.47 10.05 10 10v4l4-4-4-4v1.4zM22 19H2v2h20v-2zM16 9l4 4-4 4v-2.6c-2.31-.09-5.06.66-7.53 1.87l-1.12-1.78c3.27-1.61 6.84-2.45 10.65-2.49V9z"/>',
        "RemoveBG": '<path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-1.95.67-2.75 3.01-1.59 4.5L5.41 14H2v2h3.33l1.1 1.4c1.15 1.48 3.51 1.48 4.65 0l1.1-1.4H15v-2h-3.41l3.65-4.6c1.16-1.49.36-3.83-1.59-4.5L15 3.5l-2.5-1.66-2.5 1.66z"/>',
        "Palette": '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>',
        "Edit": '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
        "Star": '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>',
        "Bolt": '<path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/>'
    };

    const canvasContainer = document.getElementById('canvas-container');
    const canvas = document.getElementById('canvas');
    let scale = 1, translateX = 0, translateY = 0, isDraggingCanvas = false, startX, startY;
    let selectedMedia = []; // 数组，支持多选
    const resPopover = document.getElementById('res-popover');

    const API_BASE_URL = 'http://localhost:3030'; // 本地服务器地址

    let COMFYUI_API_URL = 'http://127.0.0.1:8188'; 
    document.getElementById('comfyui-address').value = COMFYUI_API_URL;
    
    // 应用主题
    const applyTheme = (theme) => {
        if(theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    };
    
    // 从服务器加载设置
    async function loadSettingsFromServer() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/settings`);
            const data = await response.json();
            if (data.success && data.data) {
                const settings = data.data;
                // 应用设置
                if (settings.comfyui_address) {
                    COMFYUI_API_URL = settings.comfyui_address;
                    document.getElementById('comfyui-address').value = settings.comfyui_address;
                }
                if (settings.canvas_workflow_image) document.getElementById('workflow-json-image').value = settings.canvas_workflow_image;
                if (settings.canvas_workflow_video) document.getElementById('workflow-json-video').value = settings.canvas_workflow_video;
                if (settings.theme) {
                    document.getElementById('theme-selector').value = settings.theme;
                    applyTheme(settings.theme);
                }
                if (settings.autosave_interval) document.getElementById('autosave-interval').value = settings.autosave_interval;
                
                // 加载预设库
                if (settings.preset_library_image) presetLibraryImage = settings.preset_library_image;
                if (settings.preset_library_video) presetLibraryVideo = settings.preset_library_video;
                if (settings.active_slots_image) activeSlotsImage = settings.active_slots_image;
                if (settings.active_slots_video) activeSlotsVideo = settings.active_slots_video;
                if (settings.blank_image_presets) blankImagePresets = settings.blank_image_presets;
            }
        } catch (err) {
            console.error('从服务器加载设置失败:', err);
            // 使用默认主题
            applyTheme('light');
        }
    }
    
    // 初始化时从服务器加载设置
    loadSettingsFromServer();
    
    // 初始化画布控制面板折叠功能
    const toggleCanvasControlsBtn = document.getElementById('toggle-canvas-controls');
    const canvasSelectorContainer = document.getElementById('canvas-selector-container');
    
    toggleCanvasControlsBtn.addEventListener('click', () => {
        canvasSelectorContainer.classList.toggle('collapsed');
        
        // 切换按钮图标
        if (canvasSelectorContainer.classList.contains('collapsed')) {
            toggleCanvasControlsBtn.textContent = '❯';
        } else {
            toggleCanvasControlsBtn.textContent = '❮';
        }
    });
    
    // 主题切换事件
    document.getElementById('theme-selector').addEventListener('change', (e) => {
        const theme = e.target.value;
        applyTheme(theme);
        // 主题会在用户点击"保存并应用"时保存到服务器
    });

    // ================== 画板管理 ==================
    const canvasSelector = document.getElementById('canvas-selector');
    const newCanvasButton = document.getElementById('new-canvas-button');
    let currentCanvasId = null; 
    let canvases = {}; // 存储元数据 {id: {name: 'xxx', id: 'xxx'}}

    // ================== 数据存储 ==================
    // 初始化为默认值，将在loadSettingsFromServer中被服务器数据覆盖
    // 图像预设库
    let presetLibraryImage = [];
    for(let i=0; i<20; i++) presetLibraryImage.push({ id: i, name: `图像预设 ${i+1}`, icon: 'Star', workflow: '' });
    // 视频预设库
    let presetLibraryVideo = [];
    for(let i=0; i<20; i++) presetLibraryVideo.push({ id: i, name: `视频预设 ${i+1}`, icon: 'Star', workflow: '' });
    
    let activeSlotsImage = [-1, -1, -1, -1, -1];
    let activeSlotsVideo = [-1, -1, -1, -1, -1];
    let blankImagePresets = [{"width":832,"height":1216},{"width":1024,"height":1024}];

    // ================== 画布交互 ==================


    canvasContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const oldScale = scale;
        scale = Math.min(Math.max(scale + (e.deltaY < 0 ? 0.1 : -0.1), 0.1), 5);
        const rect = canvasContainer.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        translateX = x - ((x - translateX) / oldScale) * scale;
        translateY = y - ((y - translateY) / oldScale) * scale;
        updateTransform(); hidePopover(); 
    }, { passive: false });

    canvasContainer.addEventListener('mousedown', (e) => {
        if (e.button === 1) { // 鼠标中键
            e.preventDefault(); // 阻止默认滚动行为
            isDraggingCanvas = true;
            startX = e.clientX - translateX; startY = e.clientY - translateY;
        }
    });
    
    // 点击画布空白区域时取消所有选中
    canvasContainer.addEventListener('click', (e) => {
        // 如果是鼠标中键，不执行任何操作
        if (e.button === 1) {
            return;
        }
        
        if (e.target === canvasContainer || e.target === canvas) {
            // 如果不是在拖动状态，直接取消选中
            if (!isDraggingCanvas) {
                deselectMedia();
            }
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isDraggingCanvas) {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        }
    });
    
    window.addEventListener('mouseup', () => {
        isDraggingCanvas = false;
    });
    
    // 阻止鼠标中键默认滚动行为
    canvasContainer.addEventListener('wheel', (e) => {
        if (e.button === 1) {
            e.preventDefault();
        }
    });
    function updateTransform() { canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`; }

    function autoResizeTextarea(element) { element.style.height = 'auto'; element.style.height = element.scrollHeight + 'px'; }
    document.getElementById('message-input').addEventListener('input', function() { autoResizeTextarea(this); });

    // ================== 画板数据保存与加载 (核心修改部分) ==================

    // 1. 保存当前画板
    async function saveCurrentCanvas() {
        if (!currentCanvasId) return;

        const mediaElements = Array.from(canvas.querySelectorAll('.draggable-media-container'));
        const canvasData = {
            id: currentCanvasId,
            name: canvases[currentCanvasId]?.name || '未命名画板',
            transform: { scale, translateX, translateY },
            data: mediaElements.map(el => {
                const mediaEl = el.querySelector('img, video');
                // 获取 src 的相对路径，移除 base URL
                let src = mediaEl.src;
                if (src.startsWith(API_BASE_URL)) {
                    src = src.replace(API_BASE_URL, '');
                } else if (src.startsWith(window.location.origin)) {
                     src = src.replace(window.location.origin, '');
                }

                return {
                    id: el.id,
                    src: src,
                    type: el.dataset.type,
                    left: el.style.left,
                    top: el.style.top,
                    width: el.style.width,
                    height: el.style.height,
                    ratio: el.dataset.ratio,
                    dataset: { ...el.dataset }, // 保存所有 data- 属性
                    prompt: el.querySelector('.float-input')?.value || ''
                };
            })
        };

        try {
            await fetch(`${API_BASE_URL}/api/canvases/${currentCanvasId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(canvasData)
            });
            console.log(`Canvas "${currentCanvasId}" saved.`);
        } catch (error) {
            console.error('Failed to save canvas:', error);
        }
    }

    // 2. 加载指定画板
    async function loadCanvas(canvasId) {
        // 如果正在从一个有效画板切换，先保存旧的
        if (currentCanvasId && currentCanvasId !== canvasId) {
            await saveCurrentCanvas();
        }

        currentCanvasId = canvasId;
        localStorage.setItem('current_canvas_id', currentCanvasId);
        deselectMedia();
        canvas.innerHTML = ''; // 清空画布
        
        updateCanvasList();

        try {
            const response = await fetch(`${API_BASE_URL}/api/canvases/${canvasId}`);
            const result = await response.json();

            if (!result.success || !result.data) {
                console.warn(`Canvas data for ID "${canvasId}" not found.`);
                return;
            }

            const canvasData = result.data;
            // 更新元数据缓存
            canvases[canvasId] = { id: canvasId, name: canvasData.name };

            // 恢复视图变换
            if (canvasData.transform) {
                scale = canvasData.transform.scale || 1;
                translateX = canvasData.transform.translateX || 0;
                translateY = canvasData.transform.translateY || 0;
                updateTransform();
            }
            
            // 更新画布列表
            updateCanvasList();

            // 重建媒体元素
            if (canvasData.data && Array.isArray(canvasData.data)) {
                canvasData.data.forEach(item => {
                    restoreMediaElement(item);
                });
            }
            
            // 更新画布列表
            updateCanvasList();

        } catch (error) {
            console.error('Error loading canvas:', error);
        }
    }

    // 辅助函数：根据保存的数据恢复 DOM 元素
    function restoreMediaElement(item) {
        const container = document.createElement('div');
        container.className = 'draggable-media-container';
        container.id = item.id || `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        container.dataset.type = item.type;
        
        // 恢复所有 dataset 属性
        const dataset = item.dataset || {};
        for (const key in dataset) {
            container.dataset[key] = dataset[key];
        }

        container.style.left = item.left;
        container.style.top = item.top;
        container.style.width = item.width;
        if (item.height) container.style.height = item.height;

        // 内部 UI 元素
        const resLabel = document.createElement('div'); resLabel.className = 'res-label'; resLabel.innerText = 'Loading...';
        container.appendChild(resLabel);
        const fpsLabel = document.createElement('div'); fpsLabel.className = 'fps-label'; fpsLabel.style.display = 'none';
        container.appendChild(fpsLabel);
        const spinner = document.createElement('div'); spinner.className = 'loading-spinner'; 
        container.appendChild(spinner);
        
        // 运行状态指示器
        const runningIndicator = document.createElement('div');
        runningIndicator.className = 'running-indicator';
        container.appendChild(runningIndicator);
        
        const typeBadge = document.createElement('div'); typeBadge.className = 'type-badge';
        typeBadge.innerText = item.type === 'image' ? 'IMAGE' : 'VIDEO';
        container.appendChild(typeBadge);

        // 媒体元素
        let mediaEl;
        // 处理相对路径：如果不是 http 开头，则补全 API 地址
        const fullSrc = item.src.startsWith('http') ? item.src : `${API_BASE_URL}${item.src}`;

        if (item.type === 'image') {
            mediaEl = document.createElement('img'); mediaEl.src = fullSrc;
        } else {
            mediaEl = document.createElement('video'); mediaEl.src = fullSrc;
            mediaEl.loop = true; mediaEl.muted = true; mediaEl.autoplay = true; mediaEl.playsInline = true;
        }
        mediaEl.crossOrigin = "anonymous";

        mediaEl.onerror = () => {
            console.error("媒体加载失败:", fullSrc);
            spinner.remove();
            resLabel.innerText = "资源丢失";
        };

        const onLoad = () => {
            const nw = mediaEl.naturalWidth || mediaEl.videoWidth;
            const nh = mediaEl.naturalHeight || mediaEl.videoHeight;
            if (nw && nh) {
                resLabel.innerText = `${nw} x ${nh}`;
                spinner.remove();
                if (item.type === 'video') fpsLabel.innerText = "30 FPS";
            }
        };

        if (item.type === 'image') mediaEl.onload = onLoad; else mediaEl.onloadedmetadata = onLoad;
        container.appendChild(mediaEl);

        // 手柄
        ['nw', 'ne', 'sw', 'se'].forEach(p => { 
            const h = document.createElement('div'); h.className = `resize-handle ${p}`; h.dataset.pos = p; container.appendChild(h); 
        });

        // 功能栏
        const floatBar = createFloatBar(container);
        floatBar.querySelector('.float-input').value = item.prompt || (item.dataset && item.dataset.prompt) || '';
        
        container.appendChild(createControls(container, mediaEl, item.type));
        container.appendChild(renderCustomSidebar(container, item.type));
        container.appendChild(floatBar);

        canvas.appendChild(container);
        bindInteractions(container);
    }

    // 3. 初始化：获取列表并加载
    async function initializeCanvases() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/canvases`);
            const result = await response.json();
            
            canvases = {};

            if (result.success && result.data.length > 0) {
                result.data.forEach(c => {
                    canvases[c.id] = c;
                });

                const lastId = localStorage.getItem('current_canvas_id');
                if (lastId && canvases[lastId]) {
                    loadCanvas(lastId);
                } else {
                    loadCanvas(result.data[0].id);
                }
            } else {
                // 无画板时创建默认
                const defaultId = 'canvas-default';
                const defaultName = '默认画板';
                canvases[defaultId] = { id: defaultId, name: defaultName };
                currentCanvasId = defaultId;
                
                await saveCurrentCanvas();
                updateCanvasList();
            }
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }

    // 更新画布列表
    function updateCanvasList() {
        const canvasListContainer = document.getElementById('canvas-list-container');
        if (!canvasListContainer) return;
        
        canvasListContainer.innerHTML = '';
        
        Object.values(canvases).forEach(canvasItem => {
            const listItem = document.createElement('div');
            listItem.className = `canvas-list-item ${currentCanvasId === canvasItem.id ? 'active' : ''}`;
            listItem.dataset.canvasId = canvasItem.id;
            listItem.innerText = canvasItem.name;
            
            listItem.addEventListener('click', () => {
                loadCanvas(canvasItem.id);
            });
            
            canvasListContainer.appendChild(listItem);
        });
        
        // 更新当前画板标题
        const canvasTitle = document.querySelector('.canvas-selector-title');
        if (canvasTitle && currentCanvasId) {
            canvasTitle.innerText = canvases[currentCanvasId]?.name || '未命名画板';
        }
    }
    
    // 重命名画板
    async function renameCanvas(canvasId) {
        if (!canvasId) return;
        
        const newName = prompt("请输入新的画板名称:", canvases[canvasId]?.name);
        if (newName && newName.trim()) {
            canvases[canvasId].name = newName.trim();
            
            try {
                await fetch(`${API_BASE_URL}/api/canvases/${canvasId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName.trim() })
                });
                
                updateCanvasList();
            } catch (error) {
                console.error('重命名画板失败:', error);
            }
        }
    }
    
    // 删除画板
    async function deleteCanvas(canvasId) {
        if (!canvasId || canvasId === 'canvas-default') {
            alert('默认画板无法删除！');
            return;
        }
        
        if (confirm(`确定要删除画板"${canvases[canvasId]?.name}"吗？`)) {
            try {
                await fetch(`${API_BASE_URL}/api/canvases/${canvasId}`, {
                    method: 'DELETE'
                });
                
                delete canvases[canvasId];
                
                // 如果删除的是当前画板，切换到第一个可用画板
                if (currentCanvasId === canvasId) {
                    const remainingCanvasIds = Object.keys(canvases);
                    if (remainingCanvasIds.length > 0) {
                        loadCanvas(remainingCanvasIds[0]);
                    }
                } else {
                    updateCanvasList();
                }
            } catch (error) {
                console.error('删除画板失败:', error);
            }
        }
    }
    
    // 新建画板
    newCanvasButton.addEventListener('click', async () => {
        const name = prompt("请输入新画板名称:", `画板 ${Object.keys(canvases).length + 1}`);
        if (name && name.trim()) {
            await saveCurrentCanvas(); // 保存当前
            
            const newId = `canvas-${Date.now()}`;
            canvases[newId] = { id: newId, name: name.trim() };
            
            // 切换状态
            currentCanvasId = newId;
            canvas.innerHTML = '';
            scale = 1; translateX = 0; translateY = 0; updateTransform();
            
            await saveCurrentCanvas(); // 立即保存新文件
            updateCanvasList();
        }
    });

    // 顶部重命名按钮
    document.getElementById('rename-canvas-button').addEventListener('click', () => {
        if (currentCanvasId) {
            renameCanvas(currentCanvasId);
        }
    });
    
    // 顶部删除按钮
    document.getElementById('delete-canvas-button').addEventListener('click', () => {
        if (currentCanvasId) {
            deleteCanvas(currentCanvasId);
        }
    });

    // 自动保存管理
    let autosaveIntervalId = null;
    
    function updateAutosaveInterval() {
        // 清除现有定时器
        if(autosaveIntervalId) {
            clearInterval(autosaveIntervalId);
            autosaveIntervalId = null;
        }
        
        // 获取保存间隔设置
        // 从DOM获取当前设置的自动保存间隔
    const interval = parseInt(document.getElementById('autosave-interval').value || '10');
        
        // 如果间隔大于0，设置新的定时器
        if(interval > 0) {
            autosaveIntervalId = setInterval(() => {
                if(currentCanvasId) {
                    saveCurrentCanvas();
                }
            }, interval * 1000);
        }
    }
    
    // 初始化自动保存
    updateAutosaveInterval();

    // ================== 媒体上传 ==================
    document.addEventListener('dragover', (e) => { e.preventDefault(); });
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const rect = canvasContainer.getBoundingClientRect();
            const x = (e.clientX - rect.left) / scale - translateX / scale - 100;
            const y = (e.clientY - rect.top) / scale - translateY / scale - 100;
            Array.from(e.dataTransfer.files).forEach((file, index) => handleFile(file, x + index*20, y + index*20));
        }
    });
    document.getElementById('upload-button').onclick = () => document.getElementById('upload-input').click();
    document.getElementById('upload-input').onchange = (e) => {
        Array.from(e.target.files).forEach((file) => handleFile(file)); e.target.value = '';
    };

    // 回到焦点功能
    document.getElementById('focus-button').onclick = () => {
        const mediaElements = Array.from(canvas.querySelectorAll('.draggable-media-container'));
        
        if (mediaElements.length === 0) {
            // 如果没有媒体元素，重置到默认视图
            animateToTransform(1, 0, 0);
            return;
        }
        
        // 计算所有媒体元素的边界框
        let minLeft = Infinity;
        let minTop = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;
        
        mediaElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const left = parseFloat(el.style.left);
            const top = parseFloat(el.style.top);
            const width = parseFloat(el.style.width);
            const height = parseFloat(el.style.height);
            
            minLeft = Math.min(minLeft, left);
            minTop = Math.min(minTop, top);
            maxRight = Math.max(maxRight, left + width);
            maxBottom = Math.max(maxBottom, top + height);
        });
        
        // 计算内容宽度和高度
        const contentWidth = maxRight - minLeft;
        const contentHeight = maxBottom - minTop;
        
        // 获取画布容器尺寸
        const containerWidth = canvasContainer.offsetWidth;
        const containerHeight = canvasContainer.offsetHeight;
        
        // 计算缩放比例，添加20%的边距
        const scaleX = containerWidth / (contentWidth * 1.2);
        const scaleY = containerHeight / (contentHeight * 1.2);
        const newScale = Math.min(scaleX, scaleY, 1); // 最大缩放比例为1
        
        // 计算新的平移位置，使内容居中
        const centerX = (minLeft + maxRight) / 2;
        const centerY = (minTop + maxBottom) / 2;
        const newTranslateX = (containerWidth / 2) - (centerX * newScale);
        const newTranslateY = (containerHeight / 2) - (centerY * newScale);
        
        // 平滑过渡到新视图
        animateToTransform(newScale, newTranslateX, newTranslateY);
    };
    
    // 平滑过渡动画
    function animateToTransform(targetScale, targetTranslateX, targetTranslateY, duration = 500) {
        const startTime = Date.now();
        const startScale = scale;
        const startTranslateX = translateX;
        const startTranslateY = translateY;
        
        function update() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用缓动函数
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            scale = startScale + (targetScale - startScale) * easeProgress;
            translateX = startTranslateX + (targetTranslateX - startTranslateX) * easeProgress;
            translateY = startTranslateY + (targetTranslateY - startTranslateY) * easeProgress;
            
            updateTransform();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        update();
    };

    async function handleFile(file, x=null, y=null) {
        const formData = new FormData();
        formData.append('media', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload-media`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                // 后端返回相对路径 /data/images/...，加上 API Base URL 显示
                const displayUrl = `${API_BASE_URL}${result.url}`;
                addMediaToCanvas(displayUrl, file.type.startsWith('image/') ? 'image' : 'video', x, y);
            } else {
                alert('文件上传失败: ' + result.message);
            }
        } catch (error) {
            console.error('上传文件时出错:', error);
            alert('上传文件时出错。');
        }
    }

    // ================== 媒体节点生成 ==================
    async function addMediaToCanvas(src, type, x = null, y = null, fileObject = null) {
        const container = document.createElement('div');
        container.className = 'draggable-media-container';
        container.dataset.type = type;
        container.dataset.resMax = "Disabled"; container.dataset.resRatio = "Disabled"; container.dataset.resMethod = "Center Crop";

        const ix = x !== null ? x : (canvasContainer.offsetWidth / 2 - 175) / scale - translateX / scale;
        const iy = y !== null ? y : (canvasContainer.offsetHeight / 2 - 175) / scale - translateY / scale;
        container.style.left = `${ix}px`; container.style.top = `${iy}px`; container.style.width = '350px';

        const resLabel = document.createElement('div'); resLabel.className = 'res-label'; resLabel.innerText = 'Loading...'; 
        container.appendChild(resLabel);
        const fpsLabel = document.createElement('div'); fpsLabel.className = 'fps-label'; fpsLabel.style.display = 'none'; 
        container.appendChild(fpsLabel);
        const spinner = document.createElement('div'); spinner.className = 'loading-spinner'; 
        container.appendChild(spinner);
        
        // 运行状态指示器
        const runningIndicator = document.createElement('div');
        runningIndicator.className = 'running-indicator';
        container.appendChild(runningIndicator);
        
        const typeBadge = document.createElement('div');
        typeBadge.className = 'type-badge';
        typeBadge.innerText = type === 'image' ? 'IMAGE' : 'VIDEO';
        container.appendChild(typeBadge);

        let mediaEl;
        if (type === 'image') {
            mediaEl = document.createElement('img'); mediaEl.src = src;
        } else {
            mediaEl = document.createElement('video'); mediaEl.src = src;
            mediaEl.loop = true; mediaEl.muted = true; mediaEl.autoplay = true; mediaEl.playsInline = true;
        }
        mediaEl.crossOrigin = "anonymous";
        
        mediaEl.onerror = () => {
            console.error("媒体加载失败:", mediaEl.src);
            spinner.remove();
            resLabel.innerText = "加载失败";
        };

        const onLoad = () => {
            const nw = mediaEl.naturalWidth || mediaEl.videoWidth;
            const nh = mediaEl.naturalHeight || mediaEl.videoHeight;
            if (nw && nh) {
                const ratio = nh / nw;
                const maxDimension = 350; // 最大边长
                
                if (ratio > 1) {
                    // 竖图 (高>宽)，固定高度，计算宽度
                    container.style.height = `${maxDimension}px`;
                    container.style.width = `${maxDimension / ratio}px`;
                } else {
                    // 横图 (宽>=高)，固定宽度，计算高度
                    container.style.width = `${maxDimension}px`;
                    container.style.height = `${maxDimension * ratio}px`;
                }
                
                container.dataset.ratio = ratio;
                resLabel.innerText = `${nw} x ${nh}`;
                spinner.remove();

                if (type === 'video') {
                    const fps = 30; 
                    fpsLabel.innerText = `${fps} FPS`;
                }
            }
        };
        if(type === 'image') mediaEl.onload = onLoad; else mediaEl.onloadedmetadata = onLoad;
        container.appendChild(mediaEl);
        
        ['nw', 'ne', 'sw', 'se'].forEach(p => { const h = document.createElement('div'); h.className = `resize-handle ${p}`; h.dataset.pos = p; container.appendChild(h); });
        
        container.appendChild(createControls(container, mediaEl, type));
        container.appendChild(renderCustomSidebar(container, type));
        container.appendChild(createFloatBar(container));
        
        canvas.appendChild(container);
        bindInteractions(container);
        selectMedia(container);
        saveCurrentCanvas(); // 添加后自动保存
    }

    function createFloatBar(container) {
        const floatBar = document.createElement('div'); floatBar.className = 'media-float-bar';
        floatBar.innerHTML = `<textarea class="float-input" rows="1" placeholder="在此输入提示词"></textarea><button class="float-gen-btn">▶</button>`;
        const floatInput = floatBar.querySelector('textarea');
        const floatBtn = floatBar.querySelector('button');
        floatInput.addEventListener('input', function() { autoResizeTextarea(this); });
        floatBar.addEventListener('mousedown', (e) => e.stopPropagation());
        floatBtn.onclick = () => {
            const txt = floatInput.value.trim();
            if(!txt) return alert("请输入提示词");
            const wf = container.dataset.type === 'image' ? document.getElementById('workflow-json-image').value : document.getElementById('workflow-json-video').value;
            runComfyWorkflow(container, wf, txt, floatBtn);
        };
        return floatBar;
    }

    function createControls(container, mediaEl, type) {
        const controls = document.createElement('div'); controls.className = 'media-controls';
        const buttons = [
            { icon: '<path d="M21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM3 6h18v13H3V6zm3 10h2v2H6v-2zm0-4h2v2H6v-2zm0-4h2v2H6V8zm12 8h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2V8z"/>', title: '分辨率与处理', action: (btn) => {
                // 只对当前元素显示分辨率设置面板
                // 但应用设置时会作用于所有选中的元素
                showResPopover(btn, container);
            } },
            { icon: ICON_LIB['Edit'], title: '显示输入框', cls: 'show-input', action: (btn) => {
                const bar = container.querySelector('.media-float-bar');
                if(bar.classList.contains('show')) { bar.classList.remove('show'); btn.classList.remove('active-tool'); } 
                else { bar.classList.add('show'); btn.classList.add('active-tool'); bar.querySelector('textarea').focus(); }
            }},
            { icon: '<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>', title: '复制', action: () => {
                // 如果有选中元素，复制所有选中的元素
                if (selectedMedia.length > 0) {
                    selectedMedia.forEach(element => {
                        const src = element.querySelector('img, video').src;
                        const mediaType = element.dataset.type;
                        addMediaToCanvas(src, mediaType, element.offsetLeft + 20, element.offsetTop + 20, element.fileObject);
                    });
                } else {
                    // 否则只复制当前元素
                    addMediaToCanvas(mediaEl.src, type, container.offsetLeft + 20, container.offsetTop + 20, container.fileObject);
                }
            }},
            { icon: '<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>', title: '下载', action: () => { const a=document.createElement('a'); a.href=mediaEl.src; a.download=`media_${Date.now()}.${type==='video'?'mp4':'png'}`; a.click(); } },
            { icon: '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>', title: '删除', cls: 'delete', action: () => {
                // 如果有选中元素，删除所有选中的元素
                if (selectedMedia.length > 0) {
                    selectedMedia.forEach(element => {
                        element.remove();
                    });
                    // 清除选中状态
                    selectedMedia = [];
                } else {
                    // 否则只删除当前元素
                    container.remove();
                }
                hidePopover();
                saveCurrentCanvas();
            }}
        ];

        if (type === 'image') {
             // 绘图功能已移除
        }

        buttons.forEach(b => {
            const btn = document.createElement('button'); btn.className = `icon-btn ${b.cls||''}`; btn.title = b.title;
            btn.innerHTML = `<svg viewBox="0 0 24 24">${b.icon}</svg>`;
            btn.onmousedown = (e) => { e.stopPropagation(); b.action(btn); };
            controls.appendChild(btn);
        });
        return controls;
    }

    function renderCustomSidebar(container, type) {
        const sidebar = document.createElement('div'); sidebar.className = 'media-sidebar-left';
        const slots = type === 'image' ? activeSlotsImage : activeSlotsVideo;
        
        slots.forEach(libIndex => {
            if(libIndex === -1) return;
            const currentPresetLibrary = type === 'image' ? presetLibraryImage : presetLibraryVideo;
            const conf = currentPresetLibrary[libIndex];
            const btn = document.createElement('div'); btn.className = 'side-btn';
            btn.innerHTML = `<svg viewBox="0 0 24 24">${ICON_LIB[conf.icon] || ICON_LIB['Star']}</svg>`;
            btn.setAttribute('data-title', conf.name);
            btn.onmousedown = (e) => {
                e.stopPropagation();
                if(!conf.workflow) return alert(`请先配置 "${conf.name}" 工作流`);
                let txt = "";
                const floatBar = container.querySelector('.media-float-bar');
                if(floatBar && floatBar.classList.contains('show')) {
                    // 如果开启了图像专属消息框，使用专属的内容
                    txt = floatBar.querySelector('textarea').value;
                } else {
                    // 否则使用固定消息输入框的内容
                    txt = document.getElementById('message-input').value;
                }
                
                // 如果有选中元素，对所有选中的元素执行操作
                if (selectedMedia.length > 0) {
                    selectedMedia.forEach(element => {
                        runComfyWorkflow(element, conf.workflow, txt, btn);
                    });
                } else {
                    // 否则只对当前元素执行操作
                    runComfyWorkflow(container, conf.workflow, txt, btn);
                }
            };
            sidebar.appendChild(btn);
        });
        return sidebar;
    }

    // ================== ComfyUI 执行逻辑 ==================
    document.getElementById('generate-button').onclick = () => {
        const txt = document.getElementById('message-input').value.trim();
        if(selectedMedia.length === 0) return alert("请先选中至少一个媒体");
        if(!txt) return alert("请输入提示词");
        
        // 对所有选中的媒体执行操作
        selectedMedia.forEach(element => {
            const wf = element.dataset.type === 'image' ? document.getElementById('workflow-json-image').value : document.getElementById('workflow-json-video').value;
            runComfyWorkflow(element, wf, txt, document.getElementById('generate-button'));
        });
    };

    async function runComfyWorkflow(container, workflowStr, promptText, btnElement) {
        if (!workflowStr) return alert("工作流 JSON 为空");
        let originalText = "";
        if(btnElement.tagName === 'BUTTON' || btnElement.classList.contains('side-btn')) {
            originalText = btnElement.innerText || "";
            if(btnElement.classList.contains('side-btn')) btnElement.style.opacity = "0.5"; else btnElement.innerText = "⏳";
            btnElement.disabled = true;
        }
        container.classList.add('loading');

        try {
            const type = container.dataset.type;
            const mediaEl = container.querySelector(type === 'image' ? 'img' : 'video');
            let uploadName = "";

            if (type === 'image') {
                const c = document.createElement('canvas'); c.width = mediaEl.naturalWidth; c.height = mediaEl.naturalHeight;
                c.getContext('2d').drawImage(mediaEl, 0, 0);
                const blob = await (await fetch(c.toDataURL('image/png'))).blob();
                uploadName = await uploadBlob(blob, `img_${Date.now()}.png`);
            } else {
                // 对于视频，重新获取Blob或者使用已上传的URL（如果ComfyUI支持URL则更好，但通常需要upload）
                // 这里简化为fetch src转blob再上传给ComfyUI
                const blob = await (await fetch(mediaEl.src)).blob();
                uploadName = await uploadBlob(blob, `vid_${Date.now()}.mp4`);
            }

            let workflow = JSON.parse(workflowStr);
            for (const id in workflow) {
                const node = workflow[id];
                if (type === 'image' && node.class_type === "CanvasImageInput") node.inputs.image = uploadName;
                if (type === 'video' && node.class_type === "CanvasVideoInput") node.inputs.video = uploadName;
                if (node.class_type === "CanvasTextInput" && promptText) node.inputs.text = promptText;
                
                if (node.class_type === "CanvasResolutionSelector") {
                    node.inputs.max_resolution = container.dataset.resMax || "Disabled"; 
                    node.inputs.aspect_ratio = container.dataset.resRatio || "Disabled"; 
                    node.inputs.method = container.dataset.resMethod || "Center Crop";
                    if(!node.inputs.image) {
                        const imgNode = Object.keys(workflow).find(k=>workflow[k].class_type==="CanvasImageInput");
                        const vidNode = Object.keys(workflow).find(k=>workflow[k].class_type==="CanvasVideoInput");
                        if(type==='image' && imgNode) node.inputs.image = [imgNode, 0];
                        if(type==='video' && vidNode) node.inputs.image = [vidNode, 0];
                    }
                }
                
                if (node.class_type === "CanvasRandomSeed") {
                    const seedTypeSelector = document.getElementById('seed-type');
                    node.inputs.seed_type = seedTypeSelector.value === 'random' ? "Random" : "Fixed";
                    // 如果是随机种子模式，生成一个随机种子
                    // 如果是固定种子模式，设置固定种子值为0
                    node.inputs.fixed_seed = seedTypeSelector.value === 'random' ? Math.floor(Math.random() * (2**31 - 1)) : 0;
                }
            }

            const qRes = await fetch(`${COMFYUI_API_URL}/prompt`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({prompt: workflow}) });
            const pid = (await qRes.json()).prompt_id;
            
            let done = false, attempts = 0;
            while(!done && attempts < 120) {
                await new Promise(r=>setTimeout(r,1000));
                const hRes = await fetch(`${COMFYUI_API_URL}/history/${pid}`);
                const hData = await hRes.json();
                if(hData[pid]?.outputs) {
                    for(let nid in hData[pid].outputs) {
                        const output = hData[pid].outputs[nid].images;
                        if(output?.length) {
                            const file = output[0];
                            const comfyuiImageUrl = `${COMFYUI_API_URL}/view?filename=${file.filename}&subfolder=${file.subfolder}&type=${file.type}`;
                            
                            const fname = file.filename.toLowerCase();
                            const isVideo = fname.endsWith('.mp4') || fname.endsWith('.webm') || fname.endsWith('.mov') || fname.endsWith('.mkv');

                            const response = await fetch(comfyuiImageUrl);
                            const blob = await response.blob();
                            const mediaType = isVideo ? 'video' : 'image';
                            const uploadFilename = `${mediaType}_${Date.now()}.${isVideo ? 'mp4' : 'png'}`;
                            
                            const formData = new FormData();
                            formData.append('media', blob, uploadFilename);

                            const uploadResponse = await fetch(`${API_BASE_URL}/api/upload-media`, {
                                method: 'POST',
                                body: formData
                            });
                            const uploadResult = await uploadResponse.json();

                            if (uploadResult.success) {
                                // 修正 URL
                                const displayUrl = `${API_BASE_URL}${uploadResult.url}`;
                                addMediaToCanvas(displayUrl, mediaType, container.offsetLeft + parseFloat(container.style.width) + 20, container.offsetTop);
                                done = true;
                            } else {
                                console.error('上传 ComfyUI 生成的媒体文件失败:', uploadResult.message);
                                alert('上传 ComfyUI 生成的媒体文件失败。');
                            }
                        }
                    }
                }
                attempts++;
            }
        } catch(e) { console.error(e); alert("生成失败: " + e.message); }
        
        if(originalText || btnElement.classList.contains('side-btn')) {
             if(btnElement.classList.contains('side-btn')) btnElement.style.opacity = "1"; else btnElement.innerText = originalText;
        }
        btnElement.disabled = false; container.classList.remove('loading');
    }

    async function uploadBlob(blob, filename) {
        try {
            const form = new FormData(); form.append("image", blob, filename); form.append("overwrite", "true");
            const res = await fetch(`${COMFYUI_API_URL}/upload/image`, {method:"POST", body:form});
            if (!res.ok) {
                throw new Error(`ComfyUI连接失败: ${res.status} ${res.statusText}`);
            }
            return (await res.json()).name;
        } catch (error) {
            console.error('上传文件到ComfyUI失败:', error);
            throw new Error(`无法连接到ComfyUI，请检查ComfyUI是否正在运行以及地址是否正确 (当前地址: ${COMFYUI_API_URL})`);
        }
    }

    // ================== 设置界面逻辑 ==================
    const settingsModal = document.getElementById('settings-modal');
    document.getElementById('settings-button').onclick = () => { populateEditorUI(); renderPresets(); settingsModal.classList.add('show'); };
    document.querySelector('.close-button').onclick = () => settingsModal.classList.remove('show');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active'); document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });

    let configTarget = 'image';
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.onclick = () => {
            // 在切换预设类型之前，保存当前正在编辑的预设内容
            if (currentEditingId !== null) {
                const currentPresetLibrary = configTarget === 'image' ? presetLibraryImage : presetLibraryVideo;
                const currentItem = currentPresetLibrary[currentEditingId];
                currentItem.name = document.getElementById('edit-name').value;
                currentItem.icon = document.getElementById('edit-icon').value;
                currentItem.workflow = document.getElementById('edit-workflow').value;
            }
            
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            configTarget = btn.dataset.target;
            document.getElementById('current-config-label').innerText = configTarget === 'image' ? '图像' : '视频';
            // 切换预设类型后，重置当前编辑的预设ID
            currentEditingId = null;
            populateEditorUI();
        }
    });

    let currentEditingId = null;
    function populateEditorUI() {
        const slotsContainer = document.getElementById('active-slots-container'); slotsContainer.innerHTML = '';
        const currentSlots = configTarget === 'image' ? activeSlotsImage : activeSlotsVideo;

        currentSlots.forEach((libIndex, slotIdx) => {
            const slot = document.createElement('div'); slot.className = `slot-item ${libIndex !== -1 ? 'has-content' : ''}`;
            slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('drag-over'); });
            slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
            slot.addEventListener('drop', (e) => {
                e.preventDefault(); slot.classList.remove('drag-over');
                const id = parseInt(e.dataTransfer.getData('text/plain'));
                if(!isNaN(id)) { 
                    if(configTarget === 'image') activeSlotsImage[slotIdx] = id; 
                    else activeSlotsVideo[slotIdx] = id;
                    populateEditorUI(); 
                }
            });
            slot.onclick = () => { if(libIndex !== -1) loadIntoEditor(libIndex); };
            if(libIndex !== -1) {
                const currentPresetLibrary = configTarget === 'image' ? presetLibraryImage : presetLibraryVideo;
                slot.innerHTML = `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:currentColor;">${ICON_LIB[currentPresetLibrary[libIndex].icon]}</svg><div class="slot-remove" onclick="event.stopPropagation(); removeSlot(${slotIdx})">&times;</div>`;
                if(currentEditingId === libIndex) slot.classList.add('active-slot');
            } else slot.innerHTML = `<span style="font-size:20px;opacity:0.3;">+</span>`;
            slotsContainer.appendChild(slot);
        });

        const libContainer = document.getElementById('preset-library-container'); libContainer.innerHTML = '';
        const currentPresetLibrary = configTarget === 'image' ? presetLibraryImage : presetLibraryVideo;
        currentPresetLibrary.forEach(item => {
            const box = document.createElement('div'); box.className = `lib-item ${currentEditingId === item.id ? 'selected' : ''}`;
            box.draggable = true;
            box.innerHTML = `<svg viewBox="0 0 24 24" style="fill:#6b7280;">${ICON_LIB[item.icon]}</svg><span>${item.name}</span>`;
            box.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', item.id));
            box.onclick = () => loadIntoEditor(item.id);
            libContainer.appendChild(box);
        });

        const iconSelect = document.getElementById('edit-icon');
        if(iconSelect.options.length === 0) {
            for(let k in ICON_LIB) { const o = document.createElement('option'); o.value = k; o.text = k; iconSelect.appendChild(o); }
            iconSelect.onchange = () => document.getElementById('edit-icon-preview').innerHTML = `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:#333;">${ICON_LIB[iconSelect.value]}</svg>`;
        }
    }

    window.removeSlot = (idx) => { 
        if(configTarget === 'image') activeSlotsImage[idx] = -1; else activeSlotsVideo[idx] = -1; 
        populateEditorUI(); 
    };
    function loadIntoEditor(id) {
        // 在切换预设之前，保存当前正在编辑的预设内容
        if (currentEditingId !== null) {
            const currentPresetLibrary = configTarget === 'image' ? presetLibraryImage : presetLibraryVideo;
            const currentItem = currentPresetLibrary[currentEditingId];
            currentItem.name = document.getElementById('edit-name').value;
            currentItem.icon = document.getElementById('edit-icon').value;
            currentItem.workflow = document.getElementById('edit-workflow').value;
        }
        
        currentEditingId = id;
        const currentPresetLibrary = configTarget === 'image' ? presetLibraryImage : presetLibraryVideo;
        const item = currentPresetLibrary[id];
        document.getElementById('editor-panel').style.display = 'flex'; document.getElementById('editor-empty').style.display = 'none';
        document.getElementById('editor-id').innerText = `#${item.id + 1}`; document.getElementById('edit-name').value = item.name;
        document.getElementById('edit-workflow').value = item.workflow; document.getElementById('edit-icon').value = item.icon;
        document.getElementById('edit-icon').onchange(); populateEditorUI();
    }
    document.getElementById('save-settings-button').onclick = async () => {
        // 如果当前正在编辑预设，先保存预设
        if(currentEditingId !== null) {
            const currentPresetLibrary = configTarget === 'image' ? presetLibraryImage : presetLibraryVideo;
            const item = currentPresetLibrary[currentEditingId];
            item.name = document.getElementById('edit-name').value;
            item.icon = document.getElementById('edit-icon').value;
            item.workflow = document.getElementById('edit-workflow').value;
            populateEditorUI();
        }
        // 收集所有设置
        const settings = {
            comfyui_address: document.getElementById('comfyui-address').value,
            canvas_workflow_image: document.getElementById('workflow-json-image').value,
            canvas_workflow_video: document.getElementById('workflow-json-video').value,
            theme: document.getElementById('theme-selector').value,
            autosave_interval: document.getElementById('autosave-interval').value,
            preset_library_image: presetLibraryImage,
            preset_library_video: presetLibraryVideo,
            active_slots_image: activeSlotsImage,
            active_slots_video: activeSlotsVideo,
            blank_image_presets: blankImagePresets
        };
        
        try {
            // 发送到服务器保存
            const response = await fetch(`${API_BASE_URL}/api/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });
            
            const result = await response.json();
            if (result.success) {
                // 应用主题
                applyTheme(document.getElementById('theme-selector').value);
                
                // 更新自动保存间隔
                updateAutosaveInterval();
                
                // 立即更新COMFYUI_API_URL变量
                COMFYUI_API_URL = settings.comfyui_address;
                
                settingsModal.classList.remove('show'); 
                alert("设置已保存");
            } else {
                alert("保存设置失败: " + result.message);
            }
        } catch (err) {
            console.error('保存设置失败:', err);
            alert("保存设置失败，请检查服务器是否运行");
        }
    };

    // ================== 辅助功能 ==================
    function bindInteractions(el) {
        let isDrag = false, sx, sy, sl, st;
        let initialPositions = [];
        
        el.addEventListener('mousedown', (e) => {
            // 如果是鼠标中键，不执行任何操作，让事件冒泡到画布处理
            if (e.button === 1) {
                return;
            }
            
            if (e.target.closest('.resize-handle') || e.target.closest('.media-controls') || e.target.closest('.media-float-bar') || e.target.closest('.media-sidebar-left')) return;
            e.stopPropagation();
            
            // 简单选择当前元素，支持Ctrl键多选
            if (!selectedMedia.includes(el)) {
                selectMedia(el, e.ctrlKey);
            }
            
            isDrag = true;
            sx = e.clientX;
            sy = e.clientY;
            sl = el.offsetLeft;
            st = el.offsetTop;
            
            // 记录所有选中元素的初始位置
            initialPositions = selectedMedia.map(selEl => ({
                element: selEl,
                left: parseFloat(getComputedStyle(selEl).left),
                top: parseFloat(getComputedStyle(selEl).top)
            }));
            
            el.style.cursor = 'grabbing';
            window.addEventListener('mousemove', drag);
            window.addEventListener('mouseup', endDrag);
            hidePopover();
        });
        
        // 拖动时，所有选中的元素都按照相同的偏移量移动
        function drag(e) {
            if(!isDrag) return;
            
            // 计算偏移量
            const deltaX = (e.clientX - sx) / scale;
            const deltaY = (e.clientY - sy) / scale;
            
            // 移动所有选中的元素
            initialPositions.forEach(pos => {
                pos.element.style.left = (pos.left + deltaX) + 'px';
                pos.element.style.top = (pos.top + deltaY) + 'px';
            });
        }
        
        function endDrag() {
            isDrag = false;
            el.style.cursor = 'default';
            window.removeEventListener('mousemove', drag);
            window.removeEventListener('mouseup', endDrag);
            saveCurrentCanvas(); // 拖动结束保存
        }

        el.addEventListener('mouseenter', () => {
            const fpsLabel = el.querySelector('.fps-label');
            if (fpsLabel && el.dataset.type === 'video') fpsLabel.style.display = 'block';
        });
        el.addEventListener('mouseleave', () => {
            const fpsLabel = el.querySelector('.fps-label');
            if (fpsLabel) fpsLabel.style.display = 'none';
        });

        el.querySelectorAll('.resize-handle').forEach(h => {
            h.addEventListener('mousedown', (e) => {
                e.stopPropagation(); e.preventDefault();
                
                const pos = h.dataset.pos;
                const sx = e.clientX;
                const sw = parseFloat(getComputedStyle(el).width);
                const r = parseFloat(el.dataset.ratio) || 1;
                
                // 记录所有选中元素的初始宽度
                const initialWidths = selectedMedia.map(selEl => ({
                    element: selEl,
                    width: parseFloat(getComputedStyle(selEl).width),
                    ratio: parseFloat(selEl.dataset.ratio) || 1
                }));
                
                // 调整大小时，所有选中的元素都按照相同的比例调整
                const resize = (ev) => {
                    // 计算宽度变化比例
                    const deltaX = (ev.clientX - sx) / scale;
                    const newWidthForCurrent = sw + deltaX * (pos.includes('e') ? 1 : -1);
                    const widthRatio = newWidthForCurrent / sw;
                    
                    // 调整所有选中的元素
                    initialWidths.forEach(init => {
                        let nw = init.width * widthRatio;
                        nw = Math.max(50, nw);
                        init.element.style.width = nw + 'px';
                        init.element.style.height = (nw * init.ratio) + 'px';
                    });
                };
                
                const stop = () => {
                    window.removeEventListener('mousemove', resize);
                    window.removeEventListener('mouseup', stop);
                    saveCurrentCanvas(); // 调整结束保存
                };
                
                window.addEventListener('mousemove', resize);
                window.addEventListener('mouseup', stop);
            });
        });
    }
    // 修改selectMedia和deselectMedia函数以支持多选
    function selectMedia(element, ctrlPressed = false) {
        if (!ctrlPressed) {
            // 没有按住Ctrl键，移除当前所有选中状态，回到单选模式
            deselectMedia();
        } else {
            // 按住Ctrl键，检查是否已经选中该元素
            const index = selectedMedia.indexOf(element);
            if (index > -1) {
                // 已选中，移除选择
                selectedMedia.splice(index, 1);
                element.classList.remove('selected');
                
                // 隐藏该元素的工具栏
                const floatBar = element.querySelector('.media-float-bar');
                if (floatBar) {
                    floatBar.classList.remove('show');
                }
                
                // 如果移除的是第一个元素，且还有其他选中元素，则显示新的第一个元素的工具栏
                if (index === 0 && selectedMedia.length > 0) {
                    const firstElement = selectedMedia[0];
                    const showInputBtn = firstElement.querySelector('.icon-btn.show-input');
                    if (showInputBtn && showInputBtn.classList.contains('active-tool')) {
                        const floatBar = firstElement.querySelector('.media-float-bar');
                        if (floatBar) {
                            floatBar.classList.add('show');
                        }
                    }
                }
                
                return;
            }
        }
        
        // 添加新的选中状态
        selectedMedia.push(element);
        element.classList.add('selected');
        
        // 确保只有第一个选中的元素显示工具栏，其他元素的工具栏都隐藏
        if (selectedMedia.length > 1) {
            // 隐藏当前元素的工具栏（如果不是第一个）
            if (selectedMedia[0] !== element) {
                const floatBar = element.querySelector('.media-float-bar');
                if (floatBar) {
                    floatBar.classList.remove('show');
                }
            } else {
                // 如果是第一个元素，检查是否需要显示工具栏
                const showInputBtn = element.querySelector('.icon-btn.show-input');
                if (showInputBtn && showInputBtn.classList.contains('active-tool')) {
                    const floatBar = element.querySelector('.media-float-bar');
                    if (floatBar) {
                        floatBar.classList.add('show');
                    }
                }
            }
            
            // 确保其他选中元素的工具栏都隐藏
            for (let i = 1; i < selectedMedia.length; i++) {
                const floatBar = selectedMedia[i].querySelector('.media-float-bar');
                if (floatBar) {
                    floatBar.classList.remove('show');
                }
            }
        } else {
            // 单选时显示工具栏
            const showInputBtn = element.querySelector('.icon-btn.show-input');
            if (showInputBtn && showInputBtn.classList.contains('active-tool')) {
                const floatBar = element.querySelector('.media-float-bar');
                if (floatBar) {
                    floatBar.classList.add('show');
                }
            }
        }
    }
    
    function deselectMedia() {
        selectedMedia.forEach(element => {
            element.classList.remove('selected');
            // 同时隐藏图像专属消息输入框，但保留按钮的激活状态
            const floatBar = element.querySelector('.media-float-bar');
            if (floatBar) {
                floatBar.classList.remove('show');
                // 不再移除按钮的激活状态，这样再次选中时可以恢复输入框显示
            }
        });
        selectedMedia = [];
    }
    
    let currentResTarget = null;
    function showResPopover(btnElement, container) {
        if (currentResTarget === container && resPopover.style.display === 'block') { hidePopover(); return; }
        currentResTarget = container;
        document.getElementById('res-max').value = container.dataset.resMax || "Disabled";
        document.getElementById('res-ratio').value = container.dataset.resRatio || "Disabled";
        document.getElementById('res-method').value = container.dataset.resMethod || "Center Crop";
        resPopover.classList.add('show');
        const rect = btnElement.getBoundingClientRect(); resPopover.style.left = `${rect.left}px`; resPopover.style.top = `${rect.bottom + 10}px`;
    }
    function hidePopover() { resPopover.classList.remove('show'); currentResTarget = null; }
    document.getElementById('res-max').onchange = (e) => {
        if (currentResTarget) {
            // 如果有选中元素，将设置应用到所有选中的元素
            if (selectedMedia.length > 0) {
                selectedMedia.forEach(element => {
                    element.dataset.resMax = e.target.value;
                });
            } else {
                // 否则只应用到当前元素
                currentResTarget.dataset.resMax = e.target.value;
            }
            saveCurrentCanvas();
        }
    };
    document.getElementById('res-ratio').onchange = (e) => {
        if (currentResTarget) {
            // 如果有选中元素，将设置应用到所有选中的元素
            if (selectedMedia.length > 0) {
                selectedMedia.forEach(element => {
                    element.dataset.resRatio = e.target.value;
                });
            } else {
                // 否则只应用到当前元素
                currentResTarget.dataset.resRatio = e.target.value;
            }
            saveCurrentCanvas();
        }
    };
    document.getElementById('res-method').onchange = (e) => {
        if (currentResTarget) {
            // 如果有选中元素，将设置应用到所有选中的元素
            if (selectedMedia.length > 0) {
                selectedMedia.forEach(element => {
                    element.dataset.resMethod = e.target.value;
                });
            } else {
                // 否则只应用到当前元素
                currentResTarget.dataset.resMethod = e.target.value;
            }
            saveCurrentCanvas();
        }
    };
    
    // 绘图功能已移除

    const blankImageBtn = document.getElementById('blank-image-button');
    const blankDropdown = document.querySelector('.blank-image-dropdown-container');
    blankImageBtn.onclick = (e) => { e.stopPropagation(); blankDropdown.classList.toggle('show'); };
    document.addEventListener('click', (e) => { if(!blankDropdown.contains(e.target)) blankDropdown.classList.remove('show'); });
    blankDropdown.querySelectorAll('a').forEach(l => l.onclick = (e) => {
        e.preventDefault(); createBlankImage(parseInt(l.dataset.width), parseInt(l.dataset.height)); blankDropdown.classList.remove('show');
    });
    // 随机种子选择功能
    const seedTypeSelector = document.getElementById('seed-type');
    
    // 生成当前种子值
    function getCurrentSeed() {
        if (seedTypeSelector.value === 'random') {
            // 生成一个 31 位随机整数 (与后端保持一致，numpy的randint函数int32最大支持2**31-1)
            return Math.floor(Math.random() * (2**31 - 1));
        } else {
            // 固定种子使用一个默认值（这里使用0）
            return 0;
        }
    }
    
    function createBlankImage(w, h) {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const ctx = c.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, w, h);
        // 上传空白图以获得 URL
        c.toBlob(blob => {
            const formData = new FormData();
            formData.append('media', blob, 'blank.png');
            // 添加种子信息
            formData.append('seed', getCurrentSeed());
            fetch(`${API_BASE_URL}/api/upload-media`, {method: 'POST', body: formData})
                .then(r => r.json())
                .then(res => {
                    if(res.success) addMediaToCanvas(`${API_BASE_URL}${res.url}`, 'image');
                });
        });
    }
    function renderPresets() {
        const list = document.getElementById('blank-image-presets-list'); list.innerHTML = '';
        blankImagePresets.forEach((p, i) => {
            const div = document.createElement('div'); div.className = 'preset-item';
            div.innerHTML = `<span>${p.width} x ${p.height}</span><button class="remove-preset-button" data-index="${i}">删除</button>`;
            list.appendChild(div);
        });
        document.querySelectorAll('.remove-preset-button').forEach(b => b.onclick = (e) => { blankImagePresets.splice(e.target.dataset.index, 1); renderPresets(); saveSettings(); });
    }
    document.getElementById('add-preset-button').onclick = () => {
        const w = parseInt(document.getElementById('new-preset-width').value), h = parseInt(document.getElementById('new-preset-height').value);
        if(w>0 && h>0) { blankImagePresets.push({width:w, height:h}); renderPresets(); saveSettings(); }
    };
    renderPresets();

    // 启动
    initializeCanvases();
});