import { ActionsType } from './ActionsType';
export function getActions(types: string[]) {
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
			actionTypeValue: snake_case,
			async: false
		}];
	}).reduce((sum, cv) => [...sum, ...cv], []);
}
