import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.5.1/types.ts";
import {
  collect,
  Denops,
  fn,
} from "https://deno.land/x/ddu_vim@v3.5.1/deps.ts";
import { ActionData } from "../@ddu-kinds/search_history.ts";

type Params = Record<string | number | symbol, never>;

export class Source extends BaseSource<Params> {
  kind = "search_history";
  gather(args: {
    denops: Denops;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          const histnr = await fn.histnr(args.denops, "search");
          if (histnr > 0) {
            const hists = await collect(args.denops, (denops) => {
              return [...Array(histnr)].map((_, i) =>
                fn.histget(denops, "search", i + 1)
              );
            });
            const items: Item<ActionData>[] = hists
              .filter((hist) => hist.trim() !== "")
              .map((hist, i) => {
                return {
                  word: hist,
                  action: { command: hist, index: i + 1 },
                };
              })
              .reverse();
            controller.enqueue(items);
          }
        } catch (e) {
          console.error(e);
        }
        controller.close();
      },
    });
  }

  params(): Params {
    return {};
  }
}
