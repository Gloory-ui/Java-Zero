import { cn } from "@/lib/cn";
import { CUSTOM_BANNER } from "@/lib/profile/cosmetics";

/**
 * Баннер профиля: встроенный CSS-фон или своя картинка. Снизу затемнение в цвет страницы,
 * чтобы аватар и имя читались поверх любого баннера.
 */
export function ProfileBanner({
  banner,
  bannerUrl,
  color,
  className,
}: {
  banner: string;
  bannerUrl: string | null;
  color: string;
  className?: string;
}) {
  const custom = banner === CUSTOM_BANNER && bannerUrl;
  return (
    <div
      className={cn("banner relative overflow-hidden", !custom && `banner-${banner}`, className)}
      style={
        {
          "--neon": color,
          ...(custom
            ? { backgroundImage: `url("${bannerUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }
            : {}),
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/10 to-bg" />
    </div>
  );
}
