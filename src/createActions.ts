import { ActionsType } from './ActionsType';
export function createActions(actions: ActionsType[]) {
	return actions.map(a => {
		
		const payloadName = a.actionTypeValue.endsWith("failure") ? "error" : "payload";

		return `export const ${a.actionName} = (${createActionParams(a)}) => {
\treturn ({
\t\ttype: ACTION_TYPES.${a.actionTypeConst} as typeof ACTION_TYPES.${a.actionTypeConst},
\t\t${payloadName}
\t})
}`;
	}).join("\n\n");
}



function createActionParams(action: ActionsType): string {
	if(action.type === "error") return 'error: any';
	if(action.type === "request") return '';
	return 'payload: any';
}