import * as vscode from 'vscode';
import * as fs from "fs";

export function getReducer(reduxpath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const quickPick = vscode.window.createQuickPick();
		quickPick.items = fs.readdirSync(reduxpath).map(f => ({ label: f.replace(/.*[/\\](\w+)/, "$1") }));
		if (quickPick.items.length == 0)
			reject("No reducers found!!");
		quickPick.onDidChangeSelection(selection => {
			if (selection[0]) {
				resolve(selection[0].label);
			}
			else
				reject();
		});
		quickPick.onDidHide(() => quickPick.dispose());
		quickPick.show();
	});
}
