interface conWorker {
  worker?: Worker;
  run?: {
    [key: string]: (...args: any[]) => any;
  };
}

interface spawnedWorkerOptions {
  imports?: string[],
  overwrite?: boolean;
}


export class Task {
  private static mc: MessageChannel = new MessageChannel();
  private static workerMap: Map<string, conWorker> = new Map<string, conWorker>();
  private static internalId = 0;

  //send message to self to queue task
  public static queueTask(cb: (...args: any[]) => void): void {
    //random id
    Task.internalId = (Task.internalId + 1) % 2147483647;
    Task.mc.port1.addEventListener('message', (e) => {
      if (e.data == Task.internalId) {
        cb();
      }
    }, {
      once: true
    });
    Task.mc.port2.postMessage(Task.internalId);
    Task.mc.port1.start();
  }

  //use new api to queue microtask
  public static queueMicroTask(cb: (...args: any[]) => void): void {
    queueMicrotask(cb);
  }

  public static async spawnWorker(id: string, functionArr: ((...args: any[]) => any) | ((...args: any[]) => any)[], options: spawnedWorkerOptions = {}): Promise<conWorker['run']> {
    if (!(functionArr instanceof Array)) {
      functionArr = [functionArr];
    }

    options = {
      imports: [],
      overwrite: false,
      ...options
    };

    //check if we already have a worker with this id
    if (!Task.workerMap.has(id)) {
      let funcIdx = 0;
      let funcStr: string;
      let funcName: string;
      const conWorker: conWorker = {};
      let workerBody = ``;

      // compose worker imports
      if (options.imports.length > 0) {
        workerBody += `
        importScripts(${options.imports.map(i => `'${i}'`).join(', ')});
        `;
      }

      //start composing worker
      workerBody += `
        const functionMap = new Map();
      `;

      //loop over functions and add functions to worker
      //also maps function to a name so that it would be easier to call
      for (const func of functionArr) {
        funcStr = func.toString();
        funcName = func.name;

        //check if function has a name
        if (!funcName || funcName == '') {
          funcName = `anFn${funcIdx}`;
        }

        //check if function is an arrow function
        if (Task.isArrowFunc(func)) {
          funcStr = `const ${funcName} = ${funcStr};`;
        }

        funcIdx++;
        workerBody += `
          ${funcStr}
          functionMap.set('${funcName}', ${funcName});
          \n`;
      }

      //compose worker post message
      workerBody += `
        self.addEventListener('message', async (e) => {
          const args = e.data.args;
          const func = functionMap.get(e.data.func);
          const result = {
            id: e.data.id,
            returnVal: await func(...args)
          }
          self.postMessage(result);
        });
      `;

      //create worker
      const blob = new Blob([workerBody], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);

      //initialize conWorker object
      conWorker.worker = new Worker(url, {
        name: id
      });
      conWorker.run = {};
      funcIdx = 0;

      //convert each function to a post message to worker that awaits result
      for (const func of functionArr) {
        funcName = func.name;

        if (!funcName || funcName == '') {
          funcName = `anFn${funcIdx}`;
        }

        //had to make a seperate function since functions use the latest values of variables in scope
        //funcName would always resolve to the last function in the array
        Task.setRunner(funcName, conWorker);
        funcIdx++;
      }

      //worker map to keep worker and function map
      Task.workerMap.set(id, conWorker);

      return conWorker.run;
    }
    else {
      if (options.overwrite) {
        Task.killWorker(id);
        Task.spawnWorker(id, functionArr);
      }
      else throw new Error(`worker with id ${id} already exists`);
    }
  }

  public static killWorker(id: string): void {
    if (Task.workerMap.has(id)) {
      Task.workerMap.get(id).worker.terminate();
      Task.workerMap.delete(id);
    }
    else throw new Error(`worker with id ${id} does not exist`);
  }

  private static isArrowFunc(func): boolean {
    return func.toString().indexOf('=>') !== -1;
  }

  public static worker(id: string): conWorker["run"] {
    if (Task.workerMap.has(id)) {
      return Task.workerMap.get(id).run;
    }
    else throw new Error(`worker with id ${id} does not exist`);
  }

  private static setRunner(fnName: string, conWorker: conWorker): void {
    conWorker.run[fnName] = (...args: any[]) => {
      return new Promise((resolve, reject) => {
        //generate id so that we can match the result with the correct function
        const execId = Math.random().toString(36).substring(2, 18);
        conWorker.worker.postMessage({
          func: fnName,
          args,
          id: execId
        });
        conWorker.worker.addEventListener('message', (e) => {
          if (e.data.id == execId) {
            resolve(e.data.returnVal);
          }
        });
      });
    };
  }

  public static async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  //TODO make a wrapper to wrap an existing worker file and make it's functions exposed to the mainthread
}

export default Task;
