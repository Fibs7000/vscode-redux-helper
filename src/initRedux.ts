import * as vscode from 'vscode';
import * as fs from "fs";
import { storeTemplate, commonTemplate } from './templates';
import { writeConfig } from './Config';
export function initRedux(): any {
	return async () => {
		// The code you place here will be executed every time your command is executed
		var path;
		path = await vscode.window.showInputBox({
			placeHolder: "Relative path to containing folder for redux (./src/)",
			validateInput: (value: string | undefined) => {
				if (value === undefined)
					return null;

				if ((/\.\/.*\//.test(value)))
					return null;
				return "Value is not a relative Path!!";
			}
		});

		// if (vscode.workspace.workspaceFolders == undefined) {
		// 	vscode.window.showErrorMessage('No folders found!!');
		// 	return;
		// }
		if (path === undefined)
			return;

		var reduxFolderName = await vscode.window.showInputBox({
			placeHolder: "Redux Folder Name, default: redux"
		});

		if (reduxFolderName === undefined)
			return;

		if (reduxFolderName === "") {
			reduxFolderName = "redux";
		}

		const useThunk = await vscode.window.showInputBox({
			placeHolder: "Should a thunkAction for async actions automatically be created?",
			validateInput: (value: string | undefined) => {
				if (value === undefined)
					return null;

				if ((/^[YyNn]/.test(value)))
					return null;
				return "Type (Y)es or (N)o";
			}
		});

		if (useThunk === undefined)
			return;

		vscode.window.showInformationMessage('Creating folder: ' + path + reduxFolderName);
		const relPath = path.slice(1) + reduxFolderName;
		path = vscode.workspace.rootPath + path.slice(1) + reduxFolderName;
		try {
			fs.mkdirSync(path, { recursive: true });
		}
		catch (error) {
			vscode.window.showErrorMessage(error.message);
		}
		fs.writeFileSync(path + "/store.ts", storeTemplate);
		fs.writeFileSync(path + "/commmon.ts", commonTemplate);


		writeConfig(relPath, useThunk.toLowerCase()[0] == "y");
	};
}
