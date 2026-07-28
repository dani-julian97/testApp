import { el } from "../ui/dom.js";
import { createShell } from "../ui/Shell.js";
import { createHoldButton } from "../ui/HoldButton.js";
import { CONTRACT_ITEMS } from "../data/flow.js";
import { setContractSigned } from "../core/store.js";

export function createContractView({ goNext }) {
  const hold = createHoldButton({
    onComplete: () => {
      setContractSigned(true);
      window.setTimeout(goNext, 350);
    }
  });

  const body = el("div", { className: "contract fade-in" }, [
    el("h1", { className: "screen-title screen-title--lg", text: "Make your contract" }),
    el("p", { className: "contract__lead", text: "From this day on, I commit to:" }),
    el(
      "ul",
      { className: "contract__list" },
      CONTRACT_ITEMS.map((item) => el("li", { text: item }))
    ),
    hold,
    el("p", { className: "contract__hint", text: "Press and hold to agree" }),
    el("p", {
      className: "contract__note",
      text: "Research shows that committing to a contract boosts follow-through and accountability."
    })
  ]);

  return createShell({ body });
}
