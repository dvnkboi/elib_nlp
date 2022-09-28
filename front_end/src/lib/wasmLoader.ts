export interface functionExport {
  [x: string]: (...args: any[]) => any;
}

export class WasmLoader {
  private static instances = new Map<string, WebAssembly.Instance>();
  private instance: WebAssembly.Instance;

  public get exports(): WebAssembly.Exports {
    return this.instance.exports;
  }

  public get getFunctions(): functionExport {
    const functions: functionExport = {};
    for (const key in this.instance.exports) {
      if (this.instance.exports[key] instanceof Function) {
        functions[key] = this.instance.exports[key] as (...args: any[]) => any;
      }
    }
    return functions;
  }

  constructor (private wasmFile: string) { }

  public async loadWasm(): Promise<WebAssembly.Exports> {
    if (WasmLoader.instances.has(this.wasmFile)) {
      this.instance = WasmLoader.instances.get(this.wasmFile);
    }
    else {
      try {
        const { instance } = await WebAssembly.instantiateStreaming(fetch(this.wasmFile));
        if (!instance) throw new Error('Failed to load wasm module maybe the file doesnt exist');
        this.instance = instance;
        WasmLoader.instances.set(this.wasmFile, instance);
        return Promise.resolve(this.exports);
      }
      catch (e) {
        return Promise.reject('Failed to load wasm module maybe the file doesnt exist');
      }
    }
  }

  public get getInstance(): WebAssembly.Instance {
    return this.instance;
  }

  public get getWasmFile(): string {
    return this.wasmFile;
  }

  public get getInstances(): Map<string, WebAssembly.Instance> {
    return WasmLoader.instances;
  }

  public get getExports(): WebAssembly.Exports {
    return this.instance.exports;
  }

  public static isLoaded(file: string): boolean {
    return WasmLoader.instances.has(file);
  }
}

export default WasmLoader;
