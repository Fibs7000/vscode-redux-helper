import * as fs from "fs";
import { getReduxPath } from "./getReduxPath";

export function appendReducer(reducerName: string) {
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
