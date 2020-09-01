import * as vscode from 'vscode';
import * as fs from "fs";
import { createThunkContent } from './createThunkContent';
import { createActions } from './createActions';
import { getActions } from './getActions';
import { getActionTypesContent } from "./getActionTypesContent";
import { getReduxPath } from "./getReduxPath";
import { getReducer } from "./getReducer";
import { createCase } from './templates';
export function addActions(): any {
	return async () => {
		// The code you place here will be executed every time your command is executed
		const { reduxPath, useThunk } = getReduxPath();
		const reducername = await getReducer(reduxPath);
		if (reducername == undefined)
			return;
		var types = [];
		var newType;
		do {
			newType = await vscode.window.showInputBox({
				placeHolder: "ActionType to add in CamelCase (end with * to create an async action eg: signIn*)",
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

		var actionTypesContent = "\n" + getActionTypesContent(actions, reducername);
		var newActions = createActions(actions);
		// newActions += "\nexport type ActionsType = " + actions.map(a => "ReturnType<typeof " + a.actionName + ">").join(" |\n") + "|\n";
		var reducerContent = `${actions.map(createCase).join("\n\t\t")}`;

		fs.appendFileSync(reduxPath + "/" + reducername + "/types.ts", actionTypesContent);
		fs.appendFileSync(reduxPath + "/" + reducername + "/actions.ts", "\n" + newActions + "\n");
		var oldReducerContent = fs.readFileSync(reduxPath + "/" + reducername + "/reducer.ts").toString();
		var [reducerTop, reducerBottom] = oldReducerContent.split(/switch\s*\(\s*action.type\s*\)\s*{/);
		fs.writeFileSync(reduxPath + "/" + reducername + "/reducer.ts", reducerTop + "switch (action.type) {\n" + reducerContent + reducerBottom);
		if (useThunk) {
			let thunkContent = createThunkContent(actions);
			fs.appendFileSync(reduxPath + "/" + reducername + "/thunk.ts", "\n" + thunkContent);
		}
		vscode.window.showInformationMessage("Added Actions!!");
	};
}
