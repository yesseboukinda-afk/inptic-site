import 'server-only';
import { createReadStream } from 'node:fs';

export function createLibraryReadStream(filename: string, range?: { start: number; end: number }) {
  const source = createReadStream(filename, range);
  const iterator = source[Symbol.asyncIterator]();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const result = await iterator.next();
        if (result.done) controller.close();
        else controller.enqueue(result.value);
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      source.destroy();
      await iterator.return?.();
    },
  });
}
