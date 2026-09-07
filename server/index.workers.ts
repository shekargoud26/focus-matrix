import { createApp } from './app.ts';
import { createD1Db } from './db/d1.ts';

import type { AppEnv } from './app.ts';

export type WorkersEnv = AppEnv['Bindings'] & {
  DB: unknown;
};

export default {
  async fetch(request: Request, env: WorkersEnv): Promise<Response> {
    const app = createApp(createD1Db(env.DB));
    return app.fetch(request, env);
  },
};
