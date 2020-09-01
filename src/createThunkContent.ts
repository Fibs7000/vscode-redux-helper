import { ActionsType } from './ActionsType';
import { AsyncActionType } from './AsyncActionType';
export function createThunkContent(actions: ActionsType[]) {
	const thunks = actions.filter(a => a.async == true).reduce<{
		[key: string]: {
			[t in AsyncActionType]?: string;
		};
	}>((t, cv) => {
		if (cv.thunkAction && cv.type) {
			if (!t[cv.thunkAction]) {
				t[cv.thunkAction] = {};
			}
			t[cv.thunkAction][cv.type] = (cv.actionName);
			return t;
		}
		return t;
	}, {});
	return Object.entries(thunks).map(([thunk, actions]) => `export const ${thunk} = (): ThunkAction<void, StateType, never, ActionsType> => async (dispatch, getState) => {
\ttry {
\t\t//dispatch(ACTIONS.${actions.request}(payload: any));
\t\t//dispatch(ACTIONS.${actions.success}(payload: any));
\t} catch (error) {
\t\tdispatch(ACTIONS.${actions.error}(error));
\t}
}
`).join("\n");

}
