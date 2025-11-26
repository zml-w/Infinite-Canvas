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
    let selectedMedia = null;
    const resPopover = document.getElementById('res-popover');
    const dragOverlay = document.getElementById('drag-overlay');

    let COMFYUI_API_URL = localStorage.getItem('comfyui_address') || 'http://127.0.0.1:1230'; // 根据用户反馈更新默认端口
    COMFYUI_API_URL = COMFYUI_API_URL.replace(/\/$/, '');
    document.getElementById('comfyui-address').value = COMFYUI_API_URL;
    
    // 加载工作流设置
    if(localStorage.getItem('canvas_workflow_image')) document.getElementById('workflow-json-image').value = localStorage.getItem('canvas_workflow_image');
    if(localStorage.getItem('canvas_workflow_video')) document.getElementById('workflow-json-video').value = localStorage.getItem('canvas_workflow_video');

    // ================== 数据存储 ==================
    let presetLibrary = JSON.parse(localStorage.getItem('preset_library') || '[]');
    if(presetLibrary.length < 20) {
        for(let i=presetLibrary.length; i<20; i++) presetLibrary.push({ id: i, name: `预设 ${i+1}`, icon: 'Star', workflow: '' });
    }
    let activeSlotsImage = JSON.parse(localStorage.getItem('active_slots_image') || '[-1, -1, -1, -1, -1]');
    let activeSlotsVideo = JSON.parse(localStorage.getItem('active_slots_video') || '[-1, -1, -1, -1, -1]');
    let blankImagePresets = JSON.parse(localStorage.getItem('blank_image_presets') || '[{"width":832,"height":1216},{"width":1024,"height":1024}]');

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
        if (e.target === canvasContainer || e.target === canvas) {
            isDraggingCanvas = true; canvasContainer.style.cursor = 'grabbing';
            startX = e.clientX - translateX; startY = e.clientY - translateY;
            deselectMedia(); hidePopover();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isDraggingCanvas) { translateX = e.clientX - startX; translateY = e.clientY - startY; updateTransform(); }
    });
    window.addEventListener('mouseup', () => { isDraggingCanvas = false; canvasContainer.style.cursor = 'grab'; });
    function updateTransform() { canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`; }

    function autoResizeTextarea(element) { element.style.height = 'auto'; element.style.height = element.scrollHeight + 'px'; }
    document.getElementById('message-input').addEventListener('input', function() { autoResizeTextarea(this); });

    // ================== 媒体上传 ==================
    document.addEventListener('dragover', (e) => { e.preventDefault(); dragOverlay.classList.add('active'); });
    document.addEventListener('dragleave', (e) => { if(e.target === dragOverlay) dragOverlay.classList.remove('active'); });
    document.addEventListener('drop', (e) => {
        e.preventDefault(); dragOverlay.classList.remove('active');
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

    function handleFile(file, x=null, y=null) {
        if(file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (evt) => addMediaToCanvas(evt.target.result, 'image', x, y);
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            addMediaToCanvas(url, 'video', x, y, file);
        }
    }

    // ================== 媒体节点生成 ==================
    function addMediaToCanvas(src, type, x = null, y = null, fileObject = null) {
        console.log("addMediaToCanvas called with:", { src, type, x, y, fileObject });
        const container = document.createElement('div');
        container.className = 'draggable-media-container';
        container.dataset.type = type;
        container.dataset.resMax = "Disabled"; container.dataset.resRatio = "Disabled"; container.dataset.resMethod = "Center Crop";
        if(fileObject) container.fileObject = fileObject;

        const ix = x !== null ? x : (canvasContainer.offsetWidth / 2 - 100) / scale - translateX / scale;
        const iy = y !== null ? y : (canvasContainer.offsetHeight / 2 - 100) / scale - translateY / scale;
        container.style.left = `${ix}px`; container.style.top = `${iy}px`; container.style.width = '200px';

        const resLabel = document.createElement('div'); resLabel.className = 'res-label'; resLabel.innerText = 'Loading...'; 
        container.appendChild(resLabel);
        const fpsLabel = document.createElement('div'); fpsLabel.className = 'fps-label'; fpsLabel.style.display = 'none'; // 默认隐藏
        container.appendChild(fpsLabel);
        const spinner = document.createElement('div'); spinner.className = 'loading-spinner'; 
        container.appendChild(spinner);
        
        // 左下角类型标识
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
        
        // 添加错误处理
        mediaEl.onerror = () => {
            console.error("媒体加载失败:", mediaEl.src);
            spinner.remove(); // 移除加载动画
            resLabel.innerText = "加载失败";
            fpsLabel.style.display = 'none';
        };

        const onLoad = () => {
            const nw = mediaEl.naturalWidth || mediaEl.videoWidth;
            const nh = mediaEl.naturalHeight || mediaEl.videoHeight;
            if (nw && nh) {
                const ratio = nh / nw;
                container.style.height = (parseFloat(container.style.width) * ratio) + 'px';
                container.dataset.ratio = ratio;
                resLabel.innerText = `${nw} x ${nh}`;
                spinner.remove(); // 移除加载动画

                if (type === 'video') {
                    // 暂时使用固定帧率，直到加载问题解决
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
    }

    function createFloatBar(container) {
        const floatBar = document.createElement('div'); floatBar.className = 'media-float-bar';
        floatBar.innerHTML = `<textarea class="float-input" rows="1" placeholder="局部重绘/处理..."></textarea><button class="float-gen-btn">生成 ✨</button>`;
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
            { icon: '<path d="M21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM3 6h18v13H3V6zm3 10h2v2H6v-2zm0-4h2v2H6v-2zm0-4h2v2H6V8zm12 8h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2V8z"/>', title: '分辨率与处理', action: (btn) => showResPopover(btn, container) },
            { icon: ICON_LIB['Edit'], title: '显示输入框', action: (btn) => {
                const bar = container.querySelector('.media-float-bar');
                if(bar.classList.contains('show')) { bar.classList.remove('show'); btn.classList.remove('active-tool'); } 
                else { bar.classList.add('show'); btn.classList.add('active-tool'); bar.querySelector('textarea').focus(); }
            }},
            { icon: '<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>', title: '复制', action: () => {
                addMediaToCanvas(mediaEl.src, type, container.offsetLeft + 20, container.offsetTop + 20, container.fileObject);
            }},
            { icon: '<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>', title: '下载', action: () => { const a=document.createElement('a'); a.href=mediaEl.src; a.download=`media_${Date.now()}.${type==='video'?'mp4':'png'}`; a.click(); } },
            { icon: '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>', title: '删除', cls: 'delete', action: () => { container.remove(); if(selectedMedia===container) selectedMedia=null; hidePopover(); } }
        ];

        // 仅图片添加画笔
        if (type === 'image') {
             buttons.splice(1, 0, { icon: ICON_LIB['Palette'], title: '绘图 (Mask)', action: () => openPainter(mediaEl) });
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
        // 根据类型加载不同的侧边栏配置
        const slots = type === 'image' ? activeSlotsImage : activeSlotsVideo;
        
        slots.forEach(libIndex => {
            if(libIndex === -1) return;
            const conf = presetLibrary[libIndex];
            const btn = document.createElement('div'); btn.className = 'side-btn';
            btn.innerHTML = `<svg viewBox="0 0 24 24">${ICON_LIB[conf.icon] || ICON_LIB['Star']}</svg>`;
            btn.setAttribute('data-title', conf.name);
            btn.onmousedown = (e) => {
                e.stopPropagation();
                if(!conf.workflow) return alert(`请先配置 "${conf.name}" 工作流`);
                let txt = "";
                const floatBar = container.querySelector('.media-float-bar');
                if(floatBar && floatBar.classList.contains('show')) txt = floatBar.querySelector('textarea').value;
                runComfyWorkflow(container, conf.workflow, txt, btn);
            };
            sidebar.appendChild(btn);
        });
        return sidebar;
    }

    // ================== ComfyUI 执行逻辑 ==================
    document.getElementById('generate-button').onclick = () => {
        const txt = document.getElementById('message-input').value.trim();
        if(!selectedMedia) return alert("请先选中一个媒体");
        if(!txt) return alert("请输入提示词");
        const wf = selectedMedia.dataset.type === 'image' ? document.getElementById('workflow-json-image').value : document.getElementById('workflow-json-video').value;
        runComfyWorkflow(selectedMedia, wf, txt, document.getElementById('generate-button'));
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
                if (!container.fileObject) {
                    const blob = await (await fetch(mediaEl.src)).blob();
                    uploadName = await uploadBlob(blob, `vid_${Date.now()}.mp4`);
                } else {
                    uploadName = await uploadBlob(container.fileObject, `vid_${Date.now()}.mp4`);
                }
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
                            const url = `${COMFYUI_API_URL}/view?filename=${file.filename}&subfolder=${file.subfolder}&type=${file.type}`;
                            
                            // [关键修复] 严格的文件名判断
                            const fname = file.filename.toLowerCase();
                            const isVideo = fname.endsWith('.mp4') || fname.endsWith('.webm') || fname.endsWith('.mov') || fname.endsWith('.mkv');
                            
                            addMediaToCanvas(url, isVideo ? 'video' : 'image', container.offsetLeft + parseFloat(container.style.width) + 20, container.offsetTop);
                            done = true;
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
        const form = new FormData(); form.append("image", blob, filename); form.append("overwrite", "true");
        const res = await fetch(`${COMFYUI_API_URL}/upload/image`, {method:"POST", body:form});
        return (await res.json()).name;
    }

    // ================== 设置界面逻辑 (支持分离配置) ==================
    const settingsModal = document.getElementById('settings-modal');
    document.getElementById('settings-button').onclick = () => { populateEditorUI(); renderPresets(); settingsModal.classList.add('show'); };
    document.querySelector('.close-button').onclick = () => settingsModal.classList.remove('show');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active'); document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });

    // 侧边栏配置切换 (图像/视频)
    let configTarget = 'image'; // 'image' or 'video'
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            configTarget = btn.dataset.target;
            document.getElementById('current-config-label').innerText = configTarget === 'image' ? '图像' : '视频';
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
                slot.innerHTML = `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:currentColor;">${ICON_LIB[presetLibrary[libIndex].icon]}</svg><div class="slot-remove" onclick="event.stopPropagation(); removeSlot(${slotIdx})">&times;</div>`;
                if(currentEditingId === libIndex) slot.classList.add('active-slot');
            } else slot.innerHTML = `<span style="font-size:20px;opacity:0.3;">+</span>`;
            slotsContainer.appendChild(slot);
        });

        const libContainer = document.getElementById('preset-library-container'); libContainer.innerHTML = '';
        presetLibrary.forEach(item => {
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
        currentEditingId = id; const item = presetLibrary[id];
        document.getElementById('editor-panel').style.display = 'flex'; document.getElementById('editor-empty').style.display = 'none';
        document.getElementById('editor-id').innerText = `#${item.id + 1}`; document.getElementById('edit-name').value = item.name;
        document.getElementById('edit-workflow').value = item.workflow; document.getElementById('edit-icon').value = item.icon;
        document.getElementById('edit-icon').onchange(); populateEditorUI();
    }
    document.getElementById('save-editor-btn').onclick = () => {
        if(currentEditingId === null) return;
        const item = presetLibrary[currentEditingId];
        item.name = document.getElementById('edit-name').value;
        item.icon = document.getElementById('edit-icon').value;
        item.workflow = document.getElementById('edit-workflow').value;
        populateEditorUI(); alert("已暂存");
    };

    document.getElementById('save-settings-button').onclick = () => {
        localStorage.setItem('comfyui_address', document.getElementById('comfyui-address').value);
        localStorage.setItem('canvas_workflow_image', document.getElementById('workflow-json-image').value);
        localStorage.setItem('canvas_workflow_video', document.getElementById('workflow-json-video').value);
        localStorage.setItem('preset_library', JSON.stringify(presetLibrary));
        localStorage.setItem('active_slots_image', JSON.stringify(activeSlotsImage));
        localStorage.setItem('active_slots_video', JSON.stringify(activeSlotsVideo));
        localStorage.setItem('blank_image_presets', JSON.stringify(blankImagePresets));
        settingsModal.classList.remove('show'); alert("设置已保存");
    };

    // ================== 辅助功能 ==================
    function bindInteractions(el) {
        let isDrag = false, sx, sy, sl, st;
        el.addEventListener('mousedown', (e) => {
            if (e.target.closest('.resize-handle') || e.target.closest('.media-controls') || e.target.closest('.media-float-bar') || e.target.closest('.media-sidebar-left')) return;
            e.stopPropagation(); selectMedia(el);
            isDrag = true; sx=e.clientX; sy=e.clientY; sl=el.offsetLeft; st=el.offsetTop;
            el.style.cursor = 'grabbing';
            window.addEventListener('mousemove', drag); window.addEventListener('mouseup', endDrag);
            hidePopover();
        });
        function drag(e) { if(!isDrag)return; el.style.left=(sl+(e.clientX-sx)/scale)+'px'; el.style.top=(st+(e.clientY-sy)/scale)+'px'; }
        function endDrag() { isDrag=false; el.style.cursor='default'; window.removeEventListener('mousemove',drag); window.removeEventListener('mouseup',endDrag); }

        // 鼠标悬停显示/隐藏帧率
        el.addEventListener('mouseenter', () => {
            const fpsLabel = el.querySelector('.fps-label');
            if (fpsLabel && el.dataset.type === 'video') {
                fpsLabel.style.display = 'block';
            }
        });
        el.addEventListener('mouseleave', () => {
            const fpsLabel = el.querySelector('.fps-label');
            if (fpsLabel) {
                fpsLabel.style.display = 'none';
            }
        });

        el.querySelectorAll('.resize-handle').forEach(h => {
            h.addEventListener('mousedown', (e) => {
                e.stopPropagation(); e.preventDefault();
                const pos = h.dataset.pos, sx = e.clientX, sw = parseFloat(getComputedStyle(el).width), r = parseFloat(el.dataset.ratio)||1;
                const resize = (ev) => { let nw = sw + (ev.clientX - sx)/scale * (pos.includes('e')?1:-1); nw = Math.max(50, nw); el.style.width=nw+'px'; el.style.height=(nw*r)+'px'; };
                const stop = () => { window.removeEventListener('mousemove',resize); window.removeEventListener('mouseup',stop); };
                window.addEventListener('mousemove',resize); window.addEventListener('mouseup',stop);
            });
        });
    }
    function selectMedia(el) { if(selectedMedia) selectedMedia.classList.remove('selected'); selectedMedia=el; el.classList.add('selected'); }
    function deselectMedia() { if(selectedMedia) selectedMedia.classList.remove('selected'); selectedMedia=null; }
    
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
    document.getElementById('res-max').onchange = (e) => { if(currentResTarget) currentResTarget.dataset.resMax = e.target.value; };
    document.getElementById('res-ratio').onchange = (e) => { if(currentResTarget) currentResTarget.dataset.resRatio = e.target.value; };
    document.getElementById('res-method').onchange = (e) => { if(currentResTarget) currentResTarget.dataset.resMethod = e.target.value; };
    
    // 画笔与空白图
    let fabricCanvas = null;
    const painterModal = document.getElementById('painter-modal');
    function openPainter(img) {
        painterModal.classList.add('show');
        if(fabricCanvas) fabricCanvas.dispose();
        const w = img.naturalWidth, h = img.naturalHeight;
        const c = document.getElementById('paint-canvas'); c.width=w; c.height=h;
        fabricCanvas = new fabric.Canvas('paint-canvas', {isDrawingMode:true, width:w, height:h});
        const wrapper = document.querySelector('.canvas-wrapper');
        const cssScale = Math.min((wrapper.clientWidth-40)/w, (wrapper.clientHeight-40)/h, 1);
        c.parentElement.style.transform = `scale(${cssScale})`;
        fabric.Image.fromURL(img.src, (o)=>{ fabricCanvas.setBackgroundImage(o, fabricCanvas.renderAll.bind(fabricCanvas)); }, {crossOrigin:'anonymous'});
        const brush = new fabric.PencilBrush(fabricCanvas); fabricCanvas.freeDrawingBrush = brush;
        const updateBrush = () => { brush.color = document.getElementById('brush-color').value; brush.width = parseInt(document.getElementById('brush-size').value)/cssScale; };
        updateBrush();
        document.getElementById('brush-color').oninput=updateBrush; document.getElementById('brush-size').oninput=updateBrush;
        const saveBtn = document.getElementById('painter-save'), cancelBtn = document.getElementById('painter-cancel');
        const nSave = saveBtn.cloneNode(true), nCancel = cancelBtn.cloneNode(true);
        saveBtn.replaceWith(nSave); cancelBtn.replaceWith(nCancel);
        nSave.onclick = () => { img.src = fabricCanvas.toDataURL({format:'png',quality:1,multiplier:1}); painterModal.classList.remove('show'); };
        nCancel.onclick = () => painterModal.classList.remove('show');
    }

    const blankImageBtn = document.getElementById('blank-image-button');
    const blankDropdown = document.querySelector('.blank-image-dropdown-container');
    blankImageBtn.onclick = (e) => { e.stopPropagation(); blankDropdown.classList.toggle('show'); };
    document.addEventListener('click', (e) => { if(!blankDropdown.contains(e.target)) blankDropdown.classList.remove('show'); });
    blankDropdown.querySelectorAll('a').forEach(l => l.onclick = (e) => {
        e.preventDefault(); createBlankImage(parseInt(l.dataset.width), parseInt(l.dataset.height)); blankDropdown.classList.remove('show');
    });
    function createBlankImage(w, h) {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const ctx = c.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, w, h);
        addMediaToCanvas(c.toDataURL('image/png'), 'image');
    }
    function renderPresets() {
        const list = document.getElementById('blank-image-presets-list'); list.innerHTML = '';
        blankImagePresets.forEach((p, i) => {
            const div = document.createElement('div'); div.className = 'preset-item';
            div.innerHTML = `<span>${p.width} x ${p.height}</span><button class="remove-preset-button" data-index="${i}">删除</button>`;
            list.appendChild(div);
        });
        document.querySelectorAll('.remove-preset-button').forEach(b => b.onclick = (e) => { blankImagePresets.splice(e.target.dataset.index, 1); renderPresets(); });
    }
    document.getElementById('add-preset-button').onclick = () => {
        const w = parseInt(document.getElementById('new-preset-width').value), h = parseInt(document.getElementById('new-preset-height').value);
        if(w>0 && h>0) { blankImagePresets.push({width:w, height:h}); renderPresets(); }
    };
    renderPresets();
});
