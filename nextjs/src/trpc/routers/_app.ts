import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { usernameRouter, userRouter } from "./user";
import { friendRequestRouter } from "./friendRequest";
import { settingsRouter } from "./settings";

export const appRouter = createTRPCRouter({
  user: userRouter,
  username: usernameRouter,
  friendRequest: friendRequestRouter,
  settings: settingsRouter,
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