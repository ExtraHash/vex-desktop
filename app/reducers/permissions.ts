import { createSlice } from "@reduxjs/toolkit";
import { IPermission } from "@vex-chat/vex";
import { AppThunk, RootState } from "../store";

const initialState: Record<string, IPermission> = {};

const permissionSlice = createSlice({
    name: "permissions",
    initialState,
    reducers: {
        set: (_state, action) => {
            return action.payload;
        },
        add: (state: Record<string, IPermission>, action) => {
            const permission: IPermission = action.payload;
            state[permission.resourceID] = permission;
            return state;
        },
        reset: () => {
            return initialState;
        },
    },
});

export const { add, set, reset } = permissionSlice.actions;

export const setPermissions = (permissions: IPermission[]): AppThunk => (
    dispatch
) => {
    const obj: Record<string, IPermission> = {};

    for (const permission of permissions) {
        obj[permission.resourceID] = permission;
    }
    dispatch(set(obj));
};

export const addPermission = (permission: IPermission): AppThunk => (
    dispatch
) => dispatch(add(permission));

export const resetPermissions = (): AppThunk => (dispatch) => {
    dispatch(reset());
};

export const selectPermissions = (
    state: RootState
): Record<string, IPermission> => state.permissions;

export default permissionSlice.reducer;
