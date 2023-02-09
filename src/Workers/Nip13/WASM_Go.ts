import './wasm_exec.js';
declare function WASM_GO_GeneratePoW(inpuut: string): Promise<string>;
console.log('Initializing PoW Worker')

const pending_events = new Array<MessageEvent<string>>()

self.onmessage = (e: MessageEvent<string>) => {
  pending_events.push(e)
}

const go = new Go();
WebAssembly.instantiateStreaming(fetch("/main.wasm"), go.importObject).then(results => {
  go.run(results.instance);

  const getPow = async (e: MessageEvent<string>) => {
    try {
      const powEvent = await WASM_GO_GeneratePoW(e.data);
      self.postMessage(powEvent)
    } catch(error) {
      self.reportError(error)
    }
  }

  self.onmessage = (e: MessageEvent<string>) => {
    getPow(e)
  }

  while(pending_events.length > 0) {
    const e = pending_events.pop();
    if (e === undefined) {
      break;
    }
    getPow(e)
  }

}).catch(e => {
  console.log('wasm error', e)
})