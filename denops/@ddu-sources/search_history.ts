import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v2.9.2/types.ts";
import { Denops, fn, gather } from "https://deno.land/x/ddu_vim@v2.9.2/deps.ts";
import { ActionData } from "../@ddu-kinds/search_history.ts";

type Params = Record<never, never>;

export class Source extends BaseSource<Params> {
  kind = "search_history";
  gather(args: {
    denops: Denops;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const items: Item<ActionData>[] = [];
        try {
          const histnr = await fn.histnr(args.denops, "search") as number;
          const hists = await gather(args.denops, async (denops) => {
            for (let i = 1; i <= histnr; i++) {
              await fn.histget(denops, "search", i);
            }
          }) as string[];
          for (let i = 1; i <= histnr; i++) {
            const hist = hists[i - 1];
            if (hist.trim().length) {
              items.push({
                word: hist,
                action: { command: hist, index: i },
              });
            }
          }
          controller.enqueue(items.reverse());
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
