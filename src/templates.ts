import { ActionsType } from "./ActionsType";
import { AsyncActionType } from "./AsyncActionType";

export const storeTemplate = `
import {createStore, combineReducers, compose, applyMiddleware} from 'redux';

//@redux-helper/rootReducer
const rootReducer = combineReducers({
});

export type StateType = ReturnType<typeof rootReducer>;
export function configureStore() {
	const middleware = [];
	// middleware.push(thunk);
  
	// if (process.env.NODE_ENV !== 'production') {
	//   middleware.push(createLogger());
	// }
  
	const store = createStore(rootReducer, compose(applyMiddleware(...middleware)));
	return store;
}

`

export const reducerTemplate = (reducername: string, actions: ActionsType[]) => `import * as ACTION_TYPES from './types'
import type * as ACTIONS from './actions'
import { FetchingType, createDefault, createFetching, createSuccess, createError } from '../common';


type ValueOf<T> = T[keyof T];
export type ActionsType = ValueOf<{[k in keyof typeof ACTIONS]: ReturnType<typeof ACTIONS[k]>}>


export type initialStateType = {
\tfetching:{
\t\t${actions.filter(a => a.async == true && a.type == "request").map(a => `${a.async && a.thunkAction}: FetchingType`).join(',\t\t')}
\t}
};

const initialState: initialStateType = {
\tfetching:{
\t\t${actions.filter(a => a.async == true && a.type == "request").map(a => `${a.async && a.thunkAction}: createDefault()`).join(',\t\t')}
\t}
}


export const ${reducername}Reducer = (state: initialStateType = initialState, action: ActionsType): initialStateType => {
\tswitch(action.type){
\t\t${actions.map(createCase).join("\n\t\t")}
\t\tdefault: return state;
\t}
}
`

const actionTypeToFetchingFunctionMap: { [key in AsyncActionType]: string } = {
	error: "createError(action.error)",
	request: "createFetching()",
	success: "createSuccess()"
}

export function createCase(action: ActionsType) {
	if (!action.async) return `case ACTION_TYPES.${action.actionTypeConst}: return {...state}`
	else {

		return `case ACTION_TYPES.${action.actionTypeConst}: return {
\t\t\t...state,
\t\t\tfetching: {
\t\t\t\t...state.fetching,
\t\t\t\t${action.thunkAction}: ${actionTypeToFetchingFunctionMap[action.type]}
\t\t\t}
		}`
	}
}

export const indexTsTemplate = `export * from './types'
export * from './reducer'
export * from './actions'
`;

export const thunkTemplate = {
	header: `import * as ACTIONS from './actions'
import type { ThunkAction } from 'redux-thunk';
import type { StateType } from '../store';
import type {ActionsType} from './reducer';

`
}

export const commonTemplate = `
export type FetchingType = {
    fetching: boolean,
    success: boolean,
    error: any
}

export const createFetching = (): FetchingType => ({ error: null, fetching: true, success: false })
export const createDefault = (): FetchingType => ({ error: null, fetching: false, success: false })
export const createSuccess = (): FetchingType => ({ error: null, fetching: false, success: true })
export const createError = (error: any): FetchingType => ({ error, fetching: false, success: false })
`






