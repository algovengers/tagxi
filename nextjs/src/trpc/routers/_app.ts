import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { usernameRouter, userRouter } from "./user";
export const appRouter = createTRPCRouter({
  user: userRouter,
  username: usernameRouter,
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
