import {
  ActionArguments,
  ActionFlags,
  Actions,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.5.1/types.ts";
import { batch, fn } from "https://deno.land/x/ddu_vim@v3.5.1/deps.ts";
import { register } from "https://deno.land/x/denops_std@v5.0.1/variable/register.ts";

type Params = Record<never, never>;

export type ActionData = {
  command: string;
  index: number;
};

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    execute: async ({ denops, items }: ActionArguments<Params>) => {
      const action = items[0]?.action as ActionData;
      await batch(denops, async (denops) => {
        await fn.histadd(denops, "search", action.command);
        await register.set(denops, "/", action.command);
        await fn.feedkeys(denops, "n", "n");
      });
      return ActionFlags.None;
    },
    edit: async ({ denops, items }: ActionArguments<Params>) => {
      const action = items[0]?.action as ActionData;
      await fn.feedkeys(denops, `/${action.command}`, "n");
      return ActionFlags.None;
    },
    delete: async ({ denops, items }: ActionArguments<Params>) => {
      await batch(denops, async (denops) => {
        for (const item of items) {
          const action = item?.action as ActionData;
          if (item.action) {
            await fn.histdel(denops, "search", action.index);
          }
        }
      });
      // Note: rviminfo! is broken in Vim8 before 8.2.2494
      if (
        await fn.has(denops, "nvim") ||
        await fn.has(denops, "patch-8.2.2494")
      ) {
        await denops.cmd("wviminfo! | rviminfo!");
      }
      return ActionFlags.RefreshItems;
    },
  };

  params(): Params {
    return {};
  }
}
