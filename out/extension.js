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
        // 1. Datei speichern, falls Änderungen vorhanden sind
        if (editor.document.isDirty) {
            await editor.document.save();
        }
        const filePath = editor.document.fileName;
        // 2. Konfiguration laden
        const config = vscode.workspace.getConfiguration('shiftavenue-ps-signer');
        const certName = config.get('certSubjectName');
        const timestampUrl = config.get('timestampServer');
        if (!certName) {
            vscode.window.showErrorMessage('Bitte konfiguriere "ps-signer.certSubjectName" in den Einstellungen.');
            return;
        }
        // 3. PowerShell Befehl konstruieren
        // Wir suchen das Zertifikat im "Current User -> My" Store, das für Code Signing geeignet ist.
        const psCommand = `
			$cert = Get-ChildItem -Path Cert:\\CurrentUser\\My -CodeSigningCert | Where-Object { $_.Subject -like "*${certName}*" } | Select-Object -First 1;
			if ($null -eq $cert) {
				Write-Error "Kein Zertifikat gefunden, das '${certName}' entspricht.";
				exit 1;
			}
			$result=Set-AuthenticodeSignature -FilePath "${filePath}" -Certificate $cert -TimestampServer "${timestampUrl}";
			if ($result.Status -eq "Valid") {
				exit 0
			} else {
				exit $($result.Status)

			}

		`;
        // Statusmeldung anzeigen
        vscode.window.setStatusBarMessage('$(sync~spin) Signiere Skript...', 2000);
        // 4. Prozess ausführen
        cp.exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`, (err, stdout, stderr) => {
            if (err) {
                vscode.window.showErrorMessage(`Fehler beim Signieren: ${stderr || err.message}`);
                console.error(err);
                return;
            }
            // Prüfen ob PowerShell einen Fehler in den Stream geschrieben hat
            if (stderr) {
                vscode.window.showErrorMessage(`PowerShell Fehler: ${stderr}`);
            }
            else {
                vscode.window.showInformationMessage(`Erfolgreich signiert: ${certName}`);
            }
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map