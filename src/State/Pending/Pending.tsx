import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type PendingTypes = "pow";

// Redux typically works well with serializable objects.
// In order to make this state more generic a Serializable Object type was added.
type Serializable = undefined | string | number | boolean | SerializableObject | Array<Serializable>;

interface SerializableObject {
  [key: string]: Serializable;
}

interface Info {
  type: PendingTypes;
  info: SerializableObject;
}

export interface PendingInfo extends Info {
  id: string;
  status: "pending" | "success" | "failed" | "canceled";
  statusMessage?: string;
  start: number;
}

export interface PendingState {
  pending: Array<PendingInfo>;
}

export const InitState = {
  pending: [],
} as PendingState;

const PendingSlice = createSlice({
  name: "Pending",
  initialState: InitState,
  reducers: {
    addPending(state, action: PayloadAction<Omit<PendingInfo, "status" | "start">>) {
      deletePending(action.payload.id);
      state.pending.push({
        ...action.payload,
        status: "pending",
        start: new Date().getTime(),
      });
    },
    deletePending(state, action: PayloadAction<string>) {
      const pending = state.pending.find(n => n.id === action.payload);
      if (pending) {
        const index = state.pending.indexOf(pending);
        state.pending.splice(index, 1);
      }
    },
    setSuccess(state, action: PayloadAction<{ id: string; message?: string }>) {
      console.log("setting pending success", action.payload);
      const pending = state.pending.find(n => n.id === action.payload.id);
      if (pending) {
        const index = state.pending.indexOf(pending);
        pending.status = "success";
        pending.statusMessage = action.payload.message;
        state.pending.splice(index, 1);
        state.pending.push(pending);
      }
    },
    setFailed(state, action: PayloadAction<{ id: string; message?: string }>) {
      console.log("setting pending failed", action.payload);
      const pending = state.pending.find(n => n.id === action.payload.id);
      if (pending) {
        const index = state.pending.indexOf(pending);
        pending.status = "failed";
        pending.statusMessage = action.payload.message;
        state.pending.splice(index, 1);
        state.pending.push(pending);
      }
    },
    setCancel(state, action: PayloadAction<{ id: string; message?: string }>) {
      const pending = state.pending.find(n => n.id === action.payload.id);
      if (pending) {
        const index = state.pending.indexOf(pending);
        pending.status = "canceled";
        pending.statusMessage = action.payload.message;
        state.pending.splice(index, 1);
        state.pending.push(pending);
      }
    },
  },
});

export const {
  addPending,
  deletePending,
  setSuccess,
  setFailed,
  setCancel,
} = PendingSlice.actions;

export const reducer = PendingSlice.reducer;
