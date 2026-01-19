"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.runPowerShell', async () => {
        // 1. Define the PowerShell command and arguments
        // Example: Script that exits with code 5
        const command = 'powershell.exe';
        const args = ['-Command', 'Write-Host "Hello from PS"; Start-Sleep -Seconds 1; exit 5'];
        try {
            // 2. Call the helper function
            const result = await runPowerShellCommand(command, args);
            // 3. Handle the result based on the Exit Code
            if (result.exitCode === 0) {
                vscode.window.showInformationMessage(`Success! Output: ${result.stdout}`);
            }
            else {
                vscode.window.showErrorMessage(`Failed with Error Code: ${result.exitCode}. Error: ${result.stderr}`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Execution failed: ${error.message}`);
        }
    });
    context.subscriptions.push(disposable);
}
/**
 * Runs a PowerShell command and returns a promise resolving to the Exit Code and Output.
 */
function runPowerShellCommand(command, args) {
    return new Promise((resolve, reject) => {
        // Spawn the process
        const child = (0, child_process_1.spawn)(command, args);
        let stdoutData = '';
        let stderrData = '';
        // Capture Standard Output
        child.stdout.on('data', (data) => {
            stdoutData += data.toString();
            console.log(`stdout: ${data}`); // Optional: Log to Debug Console
        });
        // Capture Standard Error
        child.stderr.on('data', (data) => {
            stderrData += data.toString();
            console.log(`stderr: ${data}`);
        });
        // Handle Process Error (e.g., command not found)
        child.on('error', (error) => {
            reject(error);
        });
        // Handle Process Exit
        child.on('close', (code) => {
            resolve({
                exitCode: code ?? 0, // 'code' is null if killed by signal, default to 0 or handled differently
                stdout: stdoutData.trim(),
                stderr: stderrData.trim()
            });
        });
    });
}
function deactivate() { }
//# sourceMappingURL=extension_1.js.map