import React from "react";
import { Coffee, ExternalLink, Heart, QrCode } from "lucide-react";
import { DropdownMenu } from "../../shared/components/DropdownMenu";
import { APP_NAME, DONATE_LINKS } from "../../core/constants/app";

function openExternalLink(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Shared Donate menu items (Action-First layout with compact footer),
 * reused across both desktop and mobile MenuBar surfaces.
 */
export const DonateMenuItems: React.FC = () => {
  return (
    <>
      <DropdownMenu.Item
        label="Buy Me a Coffee"
        icon={<Coffee className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />}
        onSelect={() => openExternalLink(DONATE_LINKS.BUY_ME_A_COFFEE)}
      />
      <DropdownMenu.Item
        label="GitHub Sponsors"
        icon={<Heart className="w-3.5 h-3.5 text-pink-500" />}
        onSelect={() => openExternalLink(DONATE_LINKS.GITHUB_SPONSOR)}
      />
      <DropdownMenu.Item
        label="VietQR (Bank Transfer)"
        icon={<QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />}
        onSelect={() => openExternalLink(DONATE_LINKS.VIETQR)}
      />
      <DropdownMenu.Item
        label="Author Website"
        icon={
          <ExternalLink className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
        }
        onSelect={() => openExternalLink(DONATE_LINKS.AUTHOR_DONATE)}
      />

      <DropdownMenu.Separator />
      <div className="px-3 py-1.5 text-[11px] text-[var(--text-muted)] max-w-[230px] leading-snug">
        <span className="font-semibold text-[var(--text-main)]">
          Support {APP_NAME}:
        </span>{" "}
        Free &amp; open-source. Every contribution helps keep it thriving.
      </div>
    </>
  );
};
