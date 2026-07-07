const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const unzipper = require('unzipper');

const app = express();
app.use(express.json());
app.use(express.static('public')); // public folder se index.html serve hoga

const BASE_PROJECTS_DIR = path.resolve(__dirname, 'projects');
const BASE_BUILDS_DIR = path.resolve(__dirname, 'builds');

fs.ensureDirSync(BASE_PROJECTS_DIR);
fs.ensureDirSync(BASE_BUILDS_DIR);

// Global State Registry - Yeh track karega ki old app ka naya version aaya ya nahi
const globalBuildRegistryDB = {};

// 🛡️ ANTI-HACK: Directory Traversal Check (Kahin koi ../ karke server files na padh le)
const securePathVerification = (rootFolder, userInputPath) => {
    const fullyResolvedPath = path.resolve(rootFolder, userInputPath);
    if (fullyResolvedPath.startsWith(rootFolder)) {
        return fullyResolvedPath;
    }
    throw new Error("Security Threat System Alarm: Hack Attempt Blocked by Raj Coding!");
};

// ZIP aur Image upload setup
const fileUploadConfiguration = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, '/tmp'),
        filename: (req, file, cb) => cb(null, 'raj-chunk-' + Date.now() + '-' + file.originalname)
    })
});

// API 1: Naya Project Folder Banao
app.post('/api/create-project', async (req, res) => {
    try {
        const { projectName } = req.body;
        if (!projectName || /[^\w-]/.test(projectName)) {
            return res.status(400).json({ error: 'System Rules Rejection: Invalid Project Name' });
        }
        const isolatedPath = securePathVerification(BASE_PROJECTS_DIR, projectName);
        await fs.ensureDir(isolatedPath);
        res.json({ success: true, message: "Workspace initiated." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API 2: Code File Save Karo
app.post('/api/save-file', async (req, res) => {
    try {
        const { projectName, fileName, code } = req.body;
        if (!projectName || !fileName) return res.status(400).json({ error: 'Missing parameters.' });
        
        const projectPathScope = securePathVerification(BASE_PROJECTS_DIR, projectName);
        const fileTargetScope = securePathVerification(projectPathScope, fileName);
        
        await fs.outputFile(fileTargetScope, code);
        res.json({ success: true, message: 'Source chunk saved securely.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API 3: ZIP Extract Karo Folder Me
app.post('/api/upload-zip', fileUploadConfiguration.single('zipFile'), async (req, res) => {
    try {
        const { projectName } = req.body;
        if (!req.file || !projectName) return res.status(400).json({ error: 'Upload Failed.' });
        
        const runtimeProjectScope = securePathVerification(BASE_PROJECTS_DIR, projectName);
        await fs.ensureDir(runtimeProjectScope);
        
        await fs.createReadStream(req.file.path)
            .pipe(unzipper.Extract({ path: runtimeProjectScope }))
            .promise();
            
        await fs.remove(req.file.path); 
        res.json({ success: true, message: 'All file assets unpacked in Raj Coding local workspace!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API 4: App Build Karo Aur Update Track Karo
app.post('/api/build-apk', fileUploadConfiguration.single('appIcon'), async (req, res) => {
    try {
        const { projectName, appName, packageName, version, entryFile } = req.body;
        
        // Anti-Hack: Command Injection check
        if (/[;&|`]/.test(appName) || /[;&|`]/.test(packageName) || /[;&|`]/.test(version) || /[;&|`]/.test(entryFile)) {
            return res.status(403).json({ error: 'Command Injection Exploitation Blocked!' });
        }

        const projectFolderScope = securePathVerification(BASE_PROJECTS_DIR, projectName);
        const mainAssetTargetFile = securePathVerification(projectFolderScope, entryFile);
        
        if (!await fs.pathExists(mainAssetTargetFile)) {
            return res.status(400).json({ error: `Entry initialization target '${entryFile}' absent.` });
        }

        let isUpdateEventDetected = false;
        const lookupUniqueTrackingKey = `${appName.toLowerCase().replace(/\s+/g, '')}-${packageName}`;
        const previousStoredBuildProfile = globalBuildRegistryDB[lookupUniqueTrackingKey];

        // Version Validation - Old app user check
        if (previousStoredBuildProfile) {
            if (previousStoredBuildProfile.version !== version) {
                isUpdateEventDetected = true;
                console.log(`App Update Pipeline Triggered for ${packageName}`);
            }
        }

        // Fake APK generation for now (Replace with real build command later)
        const staticApkOutputName = `${projectName}-build-target-release.apk`;
        const localBinaryDiskWriteTarget = path.join(BASE_BUILDS_DIR, staticApkOutputName);
        await fs.outputFile(localBinaryDiskWriteTarget, "RAJ_CODING_COMPILER_V2_SECURE_BINARY");

        const dynamicDownloadUrlPath = `/download-target-apk/${staticApkOutputName}`;

        globalBuildRegistryDB[lookupUniqueTrackingKey] = {
            version: version,
            downloadPath: dynamicDownloadUrlPath,
            timestamp: Date.now()
        };

        res.json({
            success: true,
            updateTriggered: isUpdateEventDetected,
            updateUrl: dynamicDownloadUrlPath,
            downloadUrl: dynamicDownloadUrlPath
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API 5: APK Download link
app.get('/download-target-apk/:file', (req, res) => {
    try {
        const validDownloadLocation = securePathVerification(BASE_BUILDS_DIR, req.params.file);
        res.download(validDownloadLocation);
    } catch (err) {
        res.status(403).send("Forbidden Action Parameters Requested.");
    }
});

const APP_SERVER_PORT_LISTEN = process.env.PORT || 3000;
app.listen(APP_SERVER_PORT_LISTEN, () => console.log(`Raj Coding Engine Live on Port ${APP_SERVER_PORT_LISTEN}`));
