// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from "fs";

type Config = {
	reduxPath: string,
	useThunk: boolean
};

function getReduxPath(): Config {
	try {
		const content = fs.readFileSync(vscode.workspace.rootPath + "/.redux-helper.json").toString();
		//@ts-ignore
		var Config: Config = JSON.parse(content);
		Config.reduxPath = vscode.workspace.rootPath + Config.reduxPath;
		return Config;
	}
	catch (error) {
		throw new Error("Please run Redux-init before continuing");
	}
}

function appendReducer(reducerName: string) {
	try {
		const cfg = getReduxPath();
		const path = cfg.reduxPath + "/store.ts";
		const content = fs.readFileSync(path).toString();
		var [otherpart, reducerpart] = content.split("\n//@redux-helper/rootReducer");
		const matcher = /(const rootReducer = combineReducers\({)([\w:\s\n\r,]*?)(}\);)/;
		//@ts-ignore
		var res = matcher.exec(reducerpart)[2];
		const lines = res.replace("\r", "").split("\n").map(s => s.trim()).filter(s => s != "");
		lines.push(`${reducerName}: ${reducerName}Reducer`);
		res = lines.map(l => "\t" + l.replace(",", "")).join(",\n");
		reducerpart = reducerpart.replace(matcher, "$1\n" + res + "\n$3");
		fs.writeFileSync(path, [otherpart, `import { ${reducerName}Reducer } from './${reducerName}'\n\n`, "//@redux-helper/rootReducer", reducerpart].join(""));
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

		const useThunk = await vscode.window.showInputBox({
			placeHolder: "Should a thunkAction for async actions automatically be created?",
			validateInput: (value: string | undefined) => {
				if (value === undefined) return null;

				if ((/^[YyNn]/.test(value))) return null;
				return "Type (Y)es or (N)o";
			}
		});

		if (useThunk === undefined) return;

		vscode.window.showInformationMessage('Creating folder: ' + path + reduxFolderName);
		const relPath = path.slice(1) + reduxFolderName;
		path = vscode.workspace.rootPath + path.slice(1) + reduxFolderName;
		console.log(path);
		try {
			fs.mkdirSync(path, { recursive: true });
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


		writeConfig(relPath, useThunk.toLowerCase()[0] == "y");
		// vscode.window.showInformationMessage('Creating folder: ' + path + reduxFolderName);

	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.createReducer', async () => {
		// The code you place here will be executed every time your command is executed
		const { reduxPath, useThunk } = getReduxPath();
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
		// actionsContent += "\n\nexport type ActionsType = " + actions.map(a => "ReturnType<typeof " + a.actionName + ">").join(" |\n") + ";\n";
		var reducerContent =
			`import * as ACTION_TYPES from './types'
import * as ACTIONS from './actions'


type ValueOf<T> = T[keyof T];
export type ActionsType = ValueOf<{[k in keyof typeof ACTIONS]: ReturnType<typeof ACTIONS[k]>}>


export type initialStateType = {

};

const initialState: initialStateType = {

}


export const ${reducername}Reducer = (state: initialStateType = initialState, action: ActionsType): initialStateType => {
\tswitch(action.type){
\t\t${actions.map(a => `case ACTION_TYPES.${a.actionTypeConst}: return {...state}`).join("\n\t\t")}
\t\tdefault: return state;
\t}
}
`;
		let indexContent =
			`export * from './types'
export * from './reducer'
export * from './actions'
`;
		if (useThunk) indexContent += "export * from './thunk'\n";

		fs.mkdirSync(reduxPath + "/" + reducername, { recursive: true });
		fs.writeFileSync(reduxPath + "/" + reducername + "/types.ts", actionTypesContent);
		fs.writeFileSync(reduxPath + "/" + reducername + "/actions.ts", actionsContent + "\n");
		fs.writeFileSync(reduxPath + "/" + reducername + "/reducer.ts", reducerContent);
		if (useThunk){
			let thunkContent = 
`import * as ACTIONS from './actions'
import { ThunkAction } from 'redux-thunk';
import { StateType } from '../store';
import {ActionsType} from './reducer';

`;
			thunkContent += createThunkContent(actions);
			fs.writeFileSync(reduxPath + "/" + reducername + "/thunk.ts", thunkContent);
		}
		fs.writeFileSync(reduxPath + "/" + reducername + "/index.ts", indexContent);
		vscode.window.showInformationMessage("Created reducer!!");
		appendReducer(reducername);
		vscode.window.showInformationMessage("Appended to Root Reducer");
	});


	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.addFurtherActions', async () => {
		// The code you place here will be executed every time your command is executed
		const { reduxPath, useThunk } = getReduxPath();
		const reducername = await getReducer(reduxPath);
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

		var actionTypesContent = "\n" + getActionTypesContent(actions, reducername);
		var newActions = createActions(actions);
		// newActions += "\nexport type ActionsType = " + actions.map(a => "ReturnType<typeof " + a.actionName + ">").join(" |\n") + "|\n";
		var reducerContent = `${actions.map(a => `\t\tcase ACTION_TYPES.${a.actionTypeConst}: return {...state}`).join("\n")}`;

		fs.appendFileSync(reduxPath + "/" + reducername + "/types.ts", actionTypesContent);
		fs.appendFileSync(reduxPath + "/" + reducername + "/actions.ts", "\n" + newActions + "\n");
		var oldReducerContent = fs.readFileSync(reduxPath + "/" + reducername + "/reducer.ts").toString();
		var [reducerTop, reducerBottom] = oldReducerContent.split(/switch\s*\(\s*action.type\s*\)\s*{/);
		fs.writeFileSync(reduxPath + "/" + reducername + "/reducer.ts", reducerTop + "switch (action.type) {\n" + reducerContent + reducerBottom);
		if (useThunk){
			let thunkContent = createThunkContent(actions);
			fs.appendFileSync(reduxPath + "/" + reducername + "/thunk.ts", "\n" + thunkContent);
		}
		vscode.window.showInformationMessage("Added Actions!!");
	});


	context.subscriptions.push(disposable);


}

type ActionsType = {
	actionName: string;
	actionTypeConst: string;
	actionTypeValue: string;
	async?: boolean;
	thunkAction?: string;
	type?: AsyncActionType;
};

type AsyncActionType = "request" | "success" |"error";

function createThunkContent(actions: ActionsType[]) {
	const thunks = actions.filter(a => a.async == true).reduce<{ [key: string]: {[t in AsyncActionType]?: string} }>((t, cv)  => {
		if (cv.thunkAction && cv.type) {
			if (!t[cv.thunkAction]) {
				t[cv.thunkAction] = {};
			}
			t[cv.thunkAction][cv.type] = (cv.actionName);
			return t;
		}
		return t;
	}, {});
	console.log(thunks);
	return Object.entries(thunks).map(([thunk, actions])=> 
`export const ${thunk} = (): ThunkAction<void, StateType, never, ActionsType> => async (dispatch, getState) => {
\ttry {
\t\t//dispatch(ACTIONS.${actions.request}(payload: any));
\t\t//dispatch(ACTIONS.${actions.success}(payload: any));
\t} catch (error) {
\t\tdispatch(ACTIONS.${actions.error}(error));
\t}
}
`).join("\n");

}

function writeConfig(relPath: string, useThunk: boolean) {
	const config: Config = {
		reduxPath: relPath,
		useThunk,

	};

	fs.writeFileSync(vscode.workspace.rootPath + "/.redux-helper.json", JSON.stringify(config));
}

function createActions(actions: ActionsType[]) {
	return actions.map(a => {
		const payloadName = a.actionTypeValue.endsWith("failure") ? "error" : "payload";
		return `export const ${a.actionName} = (${payloadName}: any) => {
\treturn ({
\t\ttype: ACTION_TYPES.${a.actionTypeConst} as typeof ACTION_TYPES.${a.actionTypeConst},
\t\t${payloadName}
\t})
}`;
	}).join("\n\n");
}

function getActionTypesContent(actions: ActionsType[], reducername: string) {
	return actions.map(a => `export const ${a.actionTypeConst} = "${reducername}/${a.actionTypeValue}"`).join("\n");
}

function getActions(types: string[]) {
	return types.map((v): ActionsType[] => {
		var snake_case = v.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
		const isAsync = /\*$/.test(v);
		if (isAsync) {
			snake_case = snake_case.replace(/(.*)\*/, "$1");
			v = v.replace(/(.*)\*/, "$1");
			return [
				{
					actionName: v + "Request" + "Action",
					actionTypeConst: snake_case.toUpperCase() + "_REQUEST",
					actionTypeValue: snake_case + "_request",
					async: true,
					thunkAction: v,
					type: "request"
				},
				{
					actionName: v + "Success" + "Action",
					actionTypeConst: snake_case.toUpperCase() + "_SUCCESS",
					actionTypeValue: snake_case + "_success",
					async: true,
					thunkAction: v,
					type: "success"
				},
				{
					actionName: v + "Failure" + "Action",
					actionTypeConst: snake_case.toUpperCase() + "_FAILURE",
					actionTypeValue: snake_case + "_failure",
					async: true,
					thunkAction: v,
					type: "error"
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
