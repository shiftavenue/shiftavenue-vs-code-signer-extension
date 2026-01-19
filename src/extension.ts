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
		// Save file if changes have been made
		if (editor.document.isDirty) {
			await editor.document.save();
		}

		const filePath = editor.document.fileName;
		// Load configuration
		const config = vscode.workspace.getConfiguration('shiftavenue-ps-signer');
		const certName = config.get<string>('certSubjectName');
		const timestampUrl = config.get<string>('timestampServer');

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

export function deactivate() {}
