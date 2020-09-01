import { ActionsType } from './ActionsType';
export function createActions(actions: ActionsType[]) {
	return actions.map(a => {
		
		const payloadName = a.actionTypeValue.endsWith("failure") ? "error" : "payload";

		return `export const ${a.actionName} = (${createActionParams(a)}) => {
\treturn ({
\t\ttype: ACTION_TYPES.${a.actionTypeConst} as typeof ACTION_TYPES.${a.actionTypeConst}${createPayloadName(a)}
\t})
}`;
	}).join("\n\n");
}


function createPayloadName(action: ActionsType): string{
	if(action.async && action.type === "error") return '\n\t\terror';
	if(action.async && action.type === "request") return '';
	return '\n\t\tpayload';
}


function createActionParams(action: ActionsType): string {
	if(action.async && action.type === "error") return 'error: any';
	if(action.async && action.type === "request") return '';
	return 'payload: any';
}