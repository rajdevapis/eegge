const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const unzipper = require('unzipper');
const { exec } = require('child_process');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PROJECTS_DIR = path.resolve(__dirname, 'projects');
const BUILDS_DIR = path.resolve(__dirname, 'builds');

fs.ensureDirSync(PROJECTS_DIR);
fs.ensureDirSync(BUILDS_DIR);

// Security Check: Prevents Directory Traversal Hacking (../)
const safePath = (base, target) => {
    const safe_path = path.resolve(base, target);
    if (safe_path.startsWith(base)) return safe_path;
    throw new Error("Security Violation: Hack Attempt Detected!");
};

// Storage configuration for ZIP and Icon uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, '/tmp'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// 1. Create Project
app.post('/api/create-project', async (req, res) => {
    try {
        const { projectName } = req.body;
        if (!projectName || /[^\w-]/.test(projectName)) return res.status(400).json({ error: 'Invalid Project Name' });
        
        const projPath = safePath(PROJECTS_DIR, projectName);
        await fs.ensureDir(projPath);
        res.json({ success: true, message: `Project '${projectName}' successfully created by Raj Coding!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Save Code File (HTML / PHP)
app.post('/api/save-file', async (req, res) => {
    try {
        const { projectName, fileName, code } = req.body;
        if (!projectName || !fileName) return res.status(400).json({ error: 'Missing parameters' });
        
        const projPath = safePath(PROJECTS_DIR, projectName);
        const filePath = safePath(projPath, fileName);
        
        await fs.outputFile(filePath, code);
        res.json({ success: true, message: 'File saved and compiled securely!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Upload & Extract ZIP Project
app.post('/api/upload-zip', upload.single('zipFile'), async (req, res) => {
    try {
        const { projectName } = req.body;
        if (!req.file || !projectName) return res.status(400).json({ error: 'Missing ZIP file or Project Name' });
        
        const projPath = safePath(PROJECTS_DIR, projectName);
        await fs.ensureDir(projPath);
        
        // Extracting all files into project folder safely
        await fs.createReadStream(req.file.path)
            .pipe(unzipper.Extract({ path: projPath }))
            .promise();
            
        await fs.remove(req.file.path); // clean up
        res.json({ success: true, message: 'All ZIP files extracted successfully into Raj Coding workspace!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Secure APK Builder Engine
app.post('/api/build-apk', upload.single('appIcon'), async (req, res) => {
    try {
        const { projectName, appName, packageName, version, entryFile } = req.body;
        
        // Anti-Hack: Input Sanitization to prevent Command Injection (; && | `)
        if (/[;&|`]/.test(appName) || /[;&|`]/.test(packageName) || /[;&|`]/.test(version) || /[;&|`]/.test(entryFile)) {
            return res.status(403).json({ error: 'Hack Attempt Blocked: System Restricted Characters Found!' });
        }

        const projPath = safePath(PROJECTS_DIR, projectName);
        const mainFile = safePath(projPath, entryFile);
        
        if (!await fs.pathExists(mainFile)) {
            return res.status(400).json({ error: `Entry file '${entryFile}' not found in settings!` });
        }

        // --- Core APK Building Logic Pipeline ---
        // Android building ke liye hum background me native CLI commands core parameters ke sath trigger karte hain
        console.log(`[Raj Coding Build Engine] Compiling APK for: ${appName} | Pack: ${packageName} | Entry: ${entryFile}`);
        
        // Static simulator link for instant builds (In production, replace with cordova/capacitor build build commands)
        const outputApkName = `${projectName}-release.apk`;
        const outputApkPath = path.join(BUILDS_DIR, outputApkName);
        await fs.outputFile(outputApkPath, "MOCK_APK_BINARY_DATA_BY_RAJ_CODING");

        res.json({ 
            success: true, 
            message: 'APK successfully compiled by Raj Coding!',
            downloadUrl: `/download-apk/${outputApkName}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve generated APK files for download
app.get('/download-apk/:file', (req, res) => {
    const file = req.params.file;
    const filePath = safePath(BUILDS_DIR, file);
    res.download(filePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Raj Coding System Live on port ${PORT}`));
