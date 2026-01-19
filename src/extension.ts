import * as vscode from 'vscode';
import * as cp from 'child_process';

export function activate(context: vscode.ExtensionContext) {

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
		const certName = config.get<string>('certSubjectName');
		const timestampUrl = config.get<string>('timestampServer');

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
				exit 0;
			} else {
				exit $($result.Status);

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
			} else {
				vscode.window.showInformationMessage(`Erfolgreich signiert: ${certName}`);
			}
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}