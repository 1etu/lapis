const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeCommand(command) {
    try {
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error.message);
        return false;
    }
}

function checkDependencies() {
    const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        console.log('📦 Installing dependencies...');
        if (!executeCommand('npm install')) {
            console.error('Failed to install dependencies');
            process.exit(1);
        }
        console.log('✅ Dependencies installed successfully');
    }
}

function buildProject() {
    console.log('🔨 Building project...');
    if (!executeCommand('npm run build')) {
        console.error('Failed to build project');
        process.exit(1);
    }
    console.log('✅ Build completed successfully');
}

function startProject() {
    console.log('🚀 Starting project...');
    executeCommand('npm start');
}

function main() {
    console.log('🔄 Starting build process...');
    
    checkDependencies();
    buildProject();
    startProject();
}

main();
