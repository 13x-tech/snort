import { TaggedRawEvent } from "Nostr";
import Event from "Nostr/Event";
import { UserPreferences } from "State/Login";
import { RootState } from "State/Store";
import { addPending, deletePending, setFailed, setSuccess } from "State/Pending/Pending";
import { useDispatch, useSelector } from "react-redux";

export function useNip13() {
  const pref = useSelector<RootState, UserPreferences>(s => s.login.preferences);
  const dispatch = useDispatch();

  const useWorker = () => {
    switch(pref.nip13Engine) {
      case "wasm_go":
        return _WASMPoW();
      case "javascript":
        return _JavascriptPoW();
      default:
        return
    }
  }

  return {
    pow: async (difficulty: number, ev: Event, onComplete: (ev: Event) => Promise<void>) => {
      const worker =  useWorker();
      if(!worker) {
        throw Error('worker not defined in preferences')
      }

      const pendingId = await ev.CreateId();

      dispatch(
        addPending({
          id: pendingId,
          type: "pow",
          info: {
            event: ev.ToObject(),
            difficulty: difficulty,
          },
        })
      );

      worker.onmessage = (e: MessageEvent<string>) => {
        const parsedEvent: TaggedRawEvent = JSON.parse(e.data);
        const powEv = new Event(parsedEvent);
        const apply = async () => {
          worker.terminate();
          await onComplete(powEv);
          dispatch(setSuccess({ id: pendingId, message: "sent" }));
          setTimeout(() => {
            dispatch(deletePending(pendingId));
          }, 3500);
        };
        apply();
      };

      worker.onerror = (ev: ErrorEvent) => {
        let errorMessage: string | undefined;
        if (ev.message) {
          errorMessage = ev.message.includes("timeout") ? "timed out" : "unknown error";
        }
        dispatch(setFailed({ id: pendingId, message: errorMessage }));
        worker.terminate();
      };

      worker.onmessageerror = () => {
        dispatch(setFailed({ id: pendingId, message: "invalid" }));
        worker.terminate();
      };

      worker.postMessage(
        JSON.stringify({
          threads: 10,
          timeout: pref.nip13Timeout * 1000, // seconds to ms
          target: difficulty,
          event: ev.ToObject(),
        })
      );
    },
  };
}

//TODO: build these.
const _WASMPoW = (): Worker => {
  return new Worker(new URL("../Workers/Nip13/WASM_Go.ts", import.meta.url));
};

const _JavascriptPoW = (): Worker => {
  //TODO: Javascript Worker
  return new Worker("/pow_worker.js");
  // try {
  //     return JSGeneratePoW(target, this, timeout)
  // } catch (error) {
  //     throw new Error('timeout')
  // }
};

export const checkDifficulty = (data: Uint8Array, target: number) => {
  const leadingByteCount = Math.ceil(target / 8);
  let leadingByteString = "";
  let byteCount = 0;
  const dataSlice = data.slice(0, leadingByteCount);
  dataSlice.forEach(v => (leadingByteString += v.toString(2).padStart(8, "0")));
  for (let i = 0; i < leadingByteString.length; i++) {
    if (leadingByteString[i] === "0") {
      byteCount++;
      if (byteCount >= target) {
        break;
      }
      continue;
    }
    // break on first non matching bit
    break;
  }
  return byteCount >= target;
};

// const JSGeneratePoW = async (difficulty: number, ev: Event, timeout: number) => {
//   let timedOut = false;
//   const timer = setTimeout(() => {
//       timedOut = true;
//       throw new Error('timeout');
//   }, timeout);

//   let nonce = 0;
//   let data = await getData(ev, nonce, difficulty);
//   while (!timedOut && !checkDifficulty(data, difficulty)) {
//       nonce++;
//       data = await getData(ev, nonce, difficulty);
//   }

//   clearTimeout(timer)

//   let hash = secp.utils.bytesToHex(data);
//   if (ev.Id !== "" && hash !== ev.Id) {
//       throw Error('ID mismatch');
//   }
//   return ev;
// }

// const getData = (ev: Event, nonce: number, difficulty: number): Promise<Uint8Array> => {

//   const date = Math.floor(new Date().getTime() / 1000);
//   ev.CreatedAt = date;

//   const prevNonce = ev.Tags.findIndex((a) => a.Original[0] === "nonce");
//   if (prevNonce > 0) {
//       ev.Tags = [
//           ...ev.Tags.slice(0, prevNonce),
//           ...ev.Tags.slice(prevNonce + 1)
//       ];
//   }
//   ev.Tags.push(new Tag(["nonce", `${nonce}`, `${difficulty}`], ev.Tags.length));

//   // similar to ev.createId() but without serializing to string and a check
//   // done for efficiency as this is a pow algo
//   const payload = [
//       0,
//       ev.PubKey,
//       ev.CreatedAt,
//       ev.Kind,
//       ev.Tags.map(a => a.ToObject()).filter(a => a !== null),
//       ev.Content
//   ];
//   const payloadData = new TextEncoder().encode(JSON.stringify(payload));
//   return secp.utils.sha256(payloadData);
// }
