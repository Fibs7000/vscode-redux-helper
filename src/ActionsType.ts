import { AsyncActionType } from "./AsyncActionType";

export type ActionsType = (BaseActionsType & { async: false; }) | (AsyncActionExtension & BaseActionsType);

export type AsyncActionExtension = {
	async: true;
	thunkAction: string;
	type: AsyncActionType;
}

export type BaseActionsType = {
	actionName: string;
	actionTypeConst: string;
	actionTypeValue: string;
}