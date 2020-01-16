// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from "fs";

function getReduxPath() {
	try {
		const content = fs.readFileSync(vscode.workspace.rootPath + "/.redux-helper").toString();
		//@ts-ignore
		const path = (/redux-path: (.*),/.exec(content))[1];
		return vscode.workspace.rootPath + path;
	}
	catch (error) {
		throw new Error("Please run Redux-init before continuing");
	}
}

function appendReducer(reducerName: string) {
	try {
		const path = getReduxPath() + "/store.ts";
		const content = fs.readFileSync(path).toString();
		var [otherpart, reducerpart] = content.split("//@redux-helper/rootReducer");
		const matcher = /(const rootReducer = combineReducers\({)([\w:\s\n\r,]*?)(}\);)/;
		//@ts-ignore
		var res = matcher.exec(reducerpart)[2];
		const lines = res.replace("\r", "").split("\n").map(s => s.trim()).filter(s => s != "");
		lines.push(`${reducerName}: ${reducerName}Reducer`);
		res = lines.map(l => "\t" + l.replace(",","")).join(",\n");
		reducerpart = reducerpart.replace(matcher, "$1\n" + res + "\n$3");
		fs.writeFileSync(path, [otherpart, `import { ${reducerName}Reducer } from './${reducerName}'\n`, "//@redux-helper/rootReducer", reducerpart].join(""));
	}
	catch (error) {
		throw new Error("Appending Reducer to Root reducer failed!\nYou have to add it Manually");
	}
}

function getReducer(reduxpath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const quickPick = vscode.window.createQuickPick();
		quickPick.items = fs.readdirSync(reduxpath).map(f => ({ label: f.replace(/.*[/\\](\w+)/, "$1") }));
		if (quickPick.items.length == 0)
			reject("No reducers found!!");
		quickPick.onDidChangeSelection(selection => {
			if (selection[0]) {
				resolve(selection[0].label);
			} else reject();
		});
		quickPick.onDidHide(() => quickPick.dispose());
		quickPick.show();
	});
}

export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "redux-helper" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.initRedux', async () => {
		// The code you place here will be executed every time your command is executed
		var path;
		path = await vscode.window.showInputBox({
			placeHolder: "Relative path to containing folder for redux (./src/)",
			validateInput: (value: string | undefined) => {
				if (value === undefined) return null;

				if ((/\.\/.*\//.test(value))) return null;
				return "Value is not a relative Path!!";
			}
		});

		// if (vscode.workspace.workspaceFolders == undefined) {
		// 	vscode.window.showErrorMessage('No folders found!!');
		// 	return;
		// }

		if (path === undefined) return;

		var reduxFolderName = await vscode.window.showInputBox({
			placeHolder: "Redux Folder Name, default: redux"
		});

		if (reduxFolderName === undefined) return;

		if (reduxFolderName === "") {
			reduxFolderName = "redux";
		}
		vscode.window.showInformationMessage('Creating folder: ' + path + reduxFolderName);
		const relPath = path.slice(1) + reduxFolderName;
		path = vscode.workspace.rootPath + path.slice(1) + reduxFolderName;
		console.log(path);
		try {
			fs.mkdirSync(path);
		} catch (error) {
			vscode.window.showErrorMessage(error.message);
		}
		fs.writeFileSync(path + "/store.ts", `
import {createStore, combineReducers, compose, applyMiddleware} from 'redux';

//@redux-helper/rootReducer
const rootReducer = combineReducers({
});

export type StateType = ReturnType<typeof rootReducer>;
export function configureStore() {
	const middleware = [];
	// middleware.push(thunk);
  
	// if (process.env.NODE_ENV !== 'production') {
	//   middleware.push(createLogger());
	// }
  
	const store = createStore(rootReducer, compose(applyMiddleware(...middleware)));
	return store;
}
		`);
		fs.writeFileSync(vscode.workspace.rootPath + "/.redux-helper", "redux-path: " + relPath + ",");
		// vscode.window.showInformationMessage('Creating folder: ' + path + reduxFolderName);

	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.createReducer', async () => {
		// The code you place here will be executed every time your command is executed
		const reduxpath = getReduxPath();
		const reducername = await vscode.window.showInputBox({
			placeHolder: "Reducer name, like 'auth'",
			validateInput: (value: string | undefined) => {
				if (value === undefined) return null;
				if ((/^[\w0-9]+$/.test(value))) return null;
				return "Reducername must be just alphanumeric Letters";
			}
		});
		if (reducername == undefined) return;
		var types = [];
		var newType;
		do {
			newType = await vscode.window.showInputBox({
				placeHolder: "ActionType in CamelCase (end with * to create an async action eg: signIn*)",
				validateInput: (value: string | undefined) => {
					if (value == "") return null;

					if (value === undefined) return null;

					if ((/^[\w0-9]*\*?$/.test(value))) return null;
					return "ActionType must be just alphanumeric Letters";
				}
			});
			if (newType != "" && newType != undefined)
				types.push(newType);
		} while (newType != "" && newType !== undefined);
		if (newType == undefined) return;
		if (types.length == 0) {
			vscode.window.showErrorMessage("Add at least one Action!!");
			return;
		}
		const actions = getActions(types);
		console.log(actions);

		var actionTypesContent = getActionTypesContent(actions, reducername);
		var actionsContent = "import * as ACTION_TYPES from './types'\n\n";
		actionsContent += createActions(actions);
		actionsContent += "\n\nexport type ActionsType = " + actions.map(a => "ReturnType<typeof " + a.actionName + ">").join(" |\n") + ";\n";
		var reducerContent =
			`import * as ACTION_TYPES from './types'
import { ActionsType } from './actions'
export type initialStateType = {

};

const initialState: initialStateType = {

}
//@redux-helper/reducer
export const ${reducername}Reducer = (state: initialStateType, action: ActionsType) => {
	switch(action.type){
		${actions.map(a => `case ACTION_TYPES.${a.actionTypeConst}: return {...state}`).join("\n\t\t")}
		default: return state;
	}
}
`;
		const indexContent =
			`export * from './types'
export * from './reducer'
export * from './actions'
`;


		fs.mkdirSync(reduxpath + "/" + reducername);
		fs.writeFileSync(reduxpath + "/" + reducername + "/types.ts", actionTypesContent);
		fs.writeFileSync(reduxpath + "/" + reducername + "/actions.ts", actionsContent);
		fs.writeFileSync(reduxpath + "/" + reducername + "/reducer.ts", reducerContent);
		fs.writeFileSync(reduxpath + "/" + reducername + "/index.ts", indexContent);
		vscode.window.showInformationMessage("Created reducer!!");
		appendReducer(reducername);
		vscode.window.showInformationMessage("Appended to Root Reducer");
	});


	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.addFurtherActions', async () => {
		// The code you place here will be executed every time your command is executed
		const reduxpath = getReduxPath();
		const reducername = await getReducer(reduxpath);
		if (reducername == undefined) return;
		var types = [];
		var newType;
		do {
			newType = await vscode.window.showInputBox({
				placeHolder: "ActionType to add in CamelCase (end with * to create an async action eg: signIn*)",
				validateInput: (value: string | undefined) => {
					if (value == "") return null;

					if (value === undefined) return null;

					if ((/^[\w0-9]*\*?$/.test(value))) return null;
					return "ActionType must be just alphanumeric Letters";
				}
			});
			if (newType != "" && newType != undefined)
				types.push(newType);
		} while (newType != "" && newType !== undefined);
		if (newType == undefined) return;
		if (types.length == 0) {
			vscode.window.showErrorMessage("Add at least one Action!!");
			return;
		}
		const actions = getActions(types);
		console.log(actions);

		var actionTypesContent = "\n"+ getActionTypesContent(actions, reducername);
		var newActions = createActions(actions);
		newActions += "\nexport type ActionsType = " + actions.map(a => "ReturnType<typeof " + a.actionName + ">").join(" |\n") + "|\n";
		var reducerContent = `${actions.map(a => `case ACTION_TYPES.${a.actionTypeConst}: return {...state}`).join("\n\t\t")}`;

		fs.appendFileSync(reduxpath + "/" + reducername + "/types.ts", actionTypesContent);
		var oldActionContent = fs.readFileSync(reduxpath + "/" + reducername + "/actions.ts").toString();
		var [actionPart, typesPart] = oldActionContent.split("\nexport type ActionsType = ");
		fs.writeFileSync(reduxpath + "/" + reducername + "/actions.ts", actionPart + newActions + typesPart);
		var oldReducerContent = fs.readFileSync(reduxpath + "/" + reducername + "/reducer.ts").toString();
		var [reducerTop, reducerBottom] = oldReducerContent.split(/switch\s*\(\s*action.type\s*\)\s*{/);
		fs.writeFileSync(reduxpath + "/" + reducername + "/reducer.ts", reducerTop +"switch (action.type) {\n"+ reducerContent + reducerBottom);
		vscode.window.showInformationMessage("Added Actions!!");
	});


	context.subscriptions.push(disposable);


}

function createActions(actions: { actionName: string; actionTypeConst: string; actionTypeValue: string; }[]) {
	return actions.map(a => `export const ${a.actionName} = (payload: any) => ({
\ttype: ACTION_TYPES.${a.actionTypeConst} as typeof ACTION_TYPES.${a.actionTypeConst},
\tpayload
})`).join("\n\n");
}

function getActionTypesContent(actions: { actionName: string; actionTypeConst: string; actionTypeValue: string; }[], reducername: string) {
	return actions.map(a => `export const ${a.actionTypeConst} = "${reducername}/${a.actionTypeValue}"`).join("\n");
}

function getActions(types: string[]) {
	return types.map(v => {
		var snake_case = v.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
		const isAsync = /\*$/.test(v);
		if (isAsync) {
			snake_case = snake_case.replace(/(.*)\*/, "$1");
			v = v.replace(/(.*)\*/, "$1");
			return [
				{
					actionName: v + "Request" + "Action",
					actionTypeConst: snake_case.toUpperCase() + "_REQUEST",
					actionTypeValue: snake_case + "_request"
				},
				{
					actionName: v + "Failure" + "Action",
					actionTypeConst: snake_case.toUpperCase() + "_FAILURE",
					actionTypeValue: snake_case + "_failure"
				},
				{
					actionName: v + "Success" + "Action",
					actionTypeConst: snake_case.toUpperCase() + "_SUCCESS",
					actionTypeValue: snake_case + "_success"
				}
			];
		}
		return [{
			actionName: v + "Action",
			actionTypeConst: snake_case.toUpperCase(),
			actionTypeValue: snake_case
		}];
	}).reduce((sum, cv) => [...sum, ...cv], []);
}

// this method is called when your extension is deactivated
export function deactivate() { }
