import * as vscode from 'vscode';
import * as fs from "fs";
import { Config } from './Config';



export function getReduxPath(): Config {
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
