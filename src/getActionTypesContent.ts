import { ActionsType } from './ActionsType';

export function getActionTypesContent(actions: ActionsType[], reducername: string) {
	return actions.map(a => `export const ${a.actionTypeConst} = "${reducername}/${a.actionTypeValue}"`).join("\n");
}
