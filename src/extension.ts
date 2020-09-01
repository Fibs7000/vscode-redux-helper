// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { initRedux } from './initRedux';
import { addActions } from './addActions';
import { createReducer } from './createReducer';

export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "redux-helper" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.initRedux', initRedux());

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.createReducer', createReducer());


	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.addFurtherActions', addActions());


	context.subscriptions.push(disposable);


}

// this method is called when your extension is deactivated
export function deactivate() { }
