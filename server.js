const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3030;

// 定义路径
const IMAGES_DIR = path.join(__dirname, 'data', 'images');
const WORKFLOWS_DIR = path.join(__dirname, 'data', 'workflows');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

// 确保目录结构存在
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR);
}
if (!fs.existsSync(WORKFLOWS_DIR)) {
    fs.mkdirSync(WORKFLOWS_DIR);
}

// 中间件配置
app.use(cors()); // 允许跨域
app.use(express.json({ limit: '50mb' })); // 增加 JSON 大小限制，防止画布内容过多无法保存
app.use(express.static(__dirname)); // 托管当前目录静态文件
app.use('/data', express.static(path.join(__dirname, 'data'))); // 托管 data 目录

// Multer 配置：用于上传图片/视频
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, IMAGES_DIR);
    },
    filename: (req, file, cb) => {
        // 防止文件名冲突，添加时间戳
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${Date.now()}${ext}`);
    }
});
const upload = multer({ storage: storage });

// ================== API 路由 ==================

// 1. 上传媒体文件
app.post('/api/upload-media', upload.single('media'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    // 返回相对路径
    const fileUrl = `/data/images/${req.file.filename}`;
    res.json({ success: true, message: 'File uploaded successfully.', url: fileUrl });
});

// 2. 获取所有画板列表
app.get('/api/canvases', (req, res) => {
    fs.readdir(WORKFLOWS_DIR, (err, files) => {
        if (err) {
            console.error('无法读取工作流目录:', err);
            return res.status(500).json({ success: false, message: '无法读取画板列表' });
        }

        const canvasList = [];
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        // 简易处理：同步读取所有 JSON 头信息获取名称
        // 如果文件很多，建议改为仅返回 ID，名称由前端懒加载，或者使用数据库
        jsonFiles.forEach(file => {
            try {
                const filePath = path.join(WORKFLOWS_DIR, file);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(fileContent);
                canvasList.push({
                    id: path.basename(file, '.json'), // 文件名作为 ID
                    name: data.name || path.basename(file, '.json') // 获取内部名称或文件名
                });
            } catch (e) {
                console.error(`解析文件 ${file} 失败:`, e);
            }
        });

        res.json({ success: true, data: canvasList });
    });
});

// 3. 保存单个画板数据或更新名称
app.post('/api/canvases/:id', (req, res) => {
    const canvasId = req.params.id;
    const filePath = path.join(WORKFLOWS_DIR, `${canvasId}.json`);
    let canvasData = req.body;

    // 如果只更新名称，则先读取现有数据
    if (req.body.name && Object.keys(req.body).length === 1) {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: '画板不存在' });
        }
        
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`读取画板 ${canvasId} 失败:`, err);
                return res.status(500).json({ success: false, message: '读取失败' });
            }
            
            try {
                const existingData = JSON.parse(data);
                existingData.name = req.body.name;
                
                // 保存更新后的数据
                fs.writeFile(filePath, JSON.stringify(existingData, null, 2), (err) => {
                    if (err) {
                        console.error(`更新画板名称 ${canvasId} 失败:`, err);
                        return res.status(500).json({ success: false, message: '更新名称失败' });
                    }
                    res.json({ success: true, message: '画板名称已更新' });
                });
            } catch (e) {
                res.status(500).json({ success: false, message: 'JSON 解析错误' });
            }
        });
    } else {
        // 完整保存画布数据
        // 格式化 JSON 方便人类阅读（调试用），生产环境可去掉 null, 2
        fs.writeFile(filePath, JSON.stringify(canvasData, null, 2), (err) => {
            if (err) {
                console.error(`保存画板 ${canvasId} 失败:`, err);
                return res.status(500).json({ success: false, message: '保存失败' });
            }
            res.json({ success: true, message: '画板已保存' });
        });
    }
});

// 5. 删除单个画板
app.delete('/api/canvases/:id', (req, res) => {
    const canvasId = req.params.id;
    const filePath = path.join(WORKFLOWS_DIR, `${canvasId}.json`);
    
    // 不允许删除默认画板
    if (canvasId === 'canvas-default') {
        return res.status(400).json({ success: false, message: '默认画板无法删除' });
    }
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: '画板不存在' });
    }
    
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`删除画板 ${canvasId} 失败:`, err);
            return res.status(500).json({ success: false, message: '删除失败' });
        }
        res.json({ success: true, message: '画板已删除' });
    });
});

// 4. 加载单个画板数据
app.get('/api/canvases/:id', (req, res) => {
    const canvasId = req.params.id;
    const filePath = path.join(WORKFLOWS_DIR, `${canvasId}.json`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: '画板不存在' });
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`读取画板 ${canvasId} 失败:`, err);
            return res.status(500).json({ success: false, message: '读取失败' });
        }
        try {
            const parsedData = JSON.parse(data);
            res.json({ success: true, data: parsedData });
        } catch (e) {
            res.status(500).json({ success: false, message: 'JSON 解析错误' });
        }
    });
});

// 5. 保存设置到本地文件
app.post('/api/settings', (req, res) => {
    try {
        const settingsData = req.body;
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settingsData, null, 2), 'utf8');
        res.json({ success: true, message: '设置已保存到本地' });
    } catch (err) {
        console.error('保存设置失败:', err);
        res.status(500).json({ success: false, message: '保存设置失败' });
    }
});

// 6. 从本地文件加载设置
app.get('/api/settings', (req, res) => {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const settingsData = fs.readFileSync(SETTINGS_FILE, 'utf8');
            res.json({ success: true, data: JSON.parse(settingsData) });
        } else {
            res.json({ success: true, data: {} }); // 返回空对象表示没有设置
        }
    } catch (err) {
        console.error('加载设置失败:', err);
        res.status(500).json({ success: false, message: '加载设置失败' });
    }
});

// 启动服务
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Data directory: ${path.join(__dirname, 'data')}`);
});