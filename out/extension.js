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
const cp = __importStar(require("child_process"));
function activate(context) {
    let disposable = vscode.commands.registerCommand('shiftavenue-ps-signer.signScript', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Kein Editor aktiv.');
            return;
        }
        if (editor.document.languageId !== 'powershell') {
            vscode.window.showErrorMessage('Dies ist keine PowerShell-Datei.');
            return;
        }
        // Save file if changes have been made
        if (editor.document.isDirty) {
            await editor.document.save();
        }
        const filePath = editor.document.fileName;
        // Load configuration
        const config = vscode.workspace.getConfiguration('shiftavenue-ps-signer');
        const certName = config.get('certSubjectName');
        const timestampUrl = config.get('timestampServer');
        if (!certName) {
            vscode.window.showErrorMessage('Bitte konfiguriere "ps-signer.certSubjectName" in den Einstellungen.');
            return;
        }
        // Construct PowerShell command
        // We search for the certificate in the “Current User -> My” store that is suitable for code signing.
        const psCommand = `
			\$cert = Get-ChildItem -Path Cert:\\CurrentUser\\My -CodeSigningCert | Where-Object { \$_.Subject -like '*${certName}*' } | Select-Object -First 1;
			if (-not \$cert) {
				return \\"No certificate found matching '${certName}'.\\";
			}
			\$result = Set-AuthenticodeSignature -FilePath '${filePath}' -Certificate \$cert -TimestampServer '${timestampUrl}';
			if (\$result.Status -eq 'Valid') {
				exit \$result.Status;
			} else {
				exit 0;

			}
		`.replace(/\n/g, ' '); // Remove line breaks for exec
        // Display status message
        vscode.window.setStatusBarMessage('$(sync~spin) Sign script...', 2000);
        // Run PowerShell process
        cp.exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`, (err, stdout, stderr) => {
            if (err) {
                vscode.window.showErrorMessage(`Error during signing: ${err}`);
                console.error(err);
                return;
            }
            // Check whether PowerShell has written an error to the stream
            if (stderr || stdout) {
                vscode.window.showErrorMessage(`Error: ${stderr} ${stdout}`);
            }
            else {
                vscode.window.showInformationMessage(`Successfully signed with: ${certName}`);
            }
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map