import * as vscode from 'vscode';
import * as fs from "fs";
import { reducerTemplate, indexTsTemplate, thunkTemplate } from './templates';
import { createThunkContent } from './createThunkContent';
import { createActions } from './createActions';
import { getActions } from './getActions';
import { getActionTypesContent } from "./getActionTypesContent";
import { getReduxPath } from "./getReduxPath";
import { appendReducer } from "./appendReducer";
export function createReducer(): any {
	return async () => {
		// The code you place here will be executed every time your command is executed
		const { reduxPath, useThunk } = getReduxPath();
		const reducername = await vscode.window.showInputBox({
			placeHolder: "Reducer name, like 'auth'",
			validateInput: (value: string | undefined) => {
				if (value === undefined)
					return null;
				if ((/^[\w0-9]+$/.test(value)))
					return null;
				return "Reducername must be just alphanumeric Letters";
			}
		});
		if (reducername == undefined)
			return;
		var types: string[] = [];
		var newType;
		do {
			newType = await vscode.window.showInputBox({
				placeHolder: "ActionType in CamelCase (end with * to create an async action eg: signIn*)",
				validateInput: (value: string | undefined) => {
					if (value == "")
						return null;

					if (value === undefined)
						return null;

					if ((/^[\w0-9]*\*?$/.test(value)))
						return null;
					return "ActionType must be just alphanumeric Letters";
				}
			});
			if (newType != "" && newType != undefined)
				types.push(newType);
		} while (newType != "" && newType !== undefined);
		if (newType == undefined)
			return;
		if (types.length == 0) {
			vscode.window.showErrorMessage("Add at least one Action!!");
			return;
		}
		const actions = getActions(types);

		var actionTypesContent = getActionTypesContent(actions, reducername);
		var actionsContent = "import * as ACTION_TYPES from './types'\n\n";
		actionsContent += createActions(actions);
		var reducerContent = reducerTemplate(reducername, actions);
		let indexContent = indexTsTemplate;
		if (useThunk)
			indexContent += "export * from './thunk'\n";

		fs.mkdirSync(reduxPath + "/" + reducername, { recursive: true });
		fs.writeFileSync(reduxPath + "/" + reducername + "/types.ts", actionTypesContent);
		fs.writeFileSync(reduxPath + "/" + reducername + "/actions.ts", actionsContent + "\n");
		fs.writeFileSync(reduxPath + "/" + reducername + "/reducer.ts", reducerContent);
		if (useThunk) {
			let thunkContent = thunkTemplate.header;
			thunkContent += createThunkContent(actions);
			fs.writeFileSync(reduxPath + "/" + reducername + "/thunk.ts", thunkContent);
		}
		fs.writeFileSync(reduxPath + "/" + reducername + "/index.ts", indexContent);
		vscode.window.showInformationMessage("Created reducer!!");
		appendReducer(reducername);
		vscode.window.showInformationMessage("Appended to Root Reducer");
	};
}
