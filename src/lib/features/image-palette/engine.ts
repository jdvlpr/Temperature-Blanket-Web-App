// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

import {
  createEngineCore,
  type EngineCore,
  type EngineMethod,
} from './engine-core';

type Args<M extends EngineMethod> = Parameters<EngineCore[M]>[0];
type Result<M extends EngineMethod> = ReturnType<EngineCore[M]>;

type Pending = {
  method: EngineMethod;
  args: unknown;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
};

/**
 * Runs the image palette engine in a worker, so analyzing a photo or
 * redrawing it never freezes the page. If the worker can't start, the same
 * engine runs on the main thread instead.
 */
export function createImagePaletteEngine() {
  let worker: Worker | null = null;
  let core: EngineCore | null = null;
  let nextId = 0;
  const pending = new Map<number, Pending>();
  // Replayed on the main thread if the worker fails
  let lastImage: Args<'setImage'> | null = null;
  let lastCandidates: Args<'setCandidates'> | null = null;

  const run = <M extends EngineMethod>(method: M, args: Args<M>): Result<M> =>
    (core![method] as (args: Args<M>) => Result<M>)(args);

  function useMainThread() {
    worker?.terminate();
    worker = null;
    if (!core) {
      core = createEngineCore();
      if (lastImage) core.setImage(lastImage);
      if (lastCandidates) core.setCandidates(lastCandidates);
    }
    for (const [id, call] of pending) {
      pending.delete(id);
      try {
        call.resolve(run(call.method, call.args as never));
      } catch (error) {
        call.reject(error);
      }
    }
  }

  try {
    worker = new Worker(new URL('./engine.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (
      event: MessageEvent<{ id: number; result?: unknown; error?: string }>,
    ) => {
      const call = pending.get(event.data.id);
      if (!call) return;
      pending.delete(event.data.id);
      if (event.data.error) call.reject(new Error(event.data.error));
      else call.resolve(event.data.result);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      useMainThread();
    };
  } catch {
    useMainThread();
  }

  function call<M extends EngineMethod>(
    method: M,
    args: Args<M>,
  ): Promise<Result<M>> {
    if (method === 'setImage') lastImage = args as Args<'setImage'>;
    if (method === 'setCandidates')
      lastCandidates = args as Args<'setCandidates'>;
    if (!worker) {
      try {
        return Promise.resolve(run(method, args));
      } catch (error) {
        return Promise.reject(error);
      }
    }
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, {
        method,
        args,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      worker!.postMessage({ id, method, args });
    });
  }

  return {
    setImage: (args: Args<'setImage'>) => call('setImage', args),
    setCandidates: (args: Args<'setCandidates'>) => call('setCandidates', args),
    autoPalette: (args: Args<'autoPalette'>) => call('autoPalette', args),
    locate: (args: Args<'locate'>) => call('locate', args),
    destroy() {
      worker?.terminate();
      worker = null;
      pending.clear();
    },
  };
}

export type ImagePaletteEngine = ReturnType<typeof createImagePaletteEngine>;
