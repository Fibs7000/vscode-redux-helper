import * as vscode from 'vscode';
import * as fs from "fs";


export function writeConfig(relPath: string, useThunk: boolean) {
	const config: Config = {
		reduxPath: relPath,
		useThunk,
	};

	fs.writeFileSync(vscode.workspace.rootPath + "/.redux-helper.json", JSON.stringify(config));
}

export type Config = {
	reduxPath: string,
	useThunk: boolean
};