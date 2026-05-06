import Link from "next/link";
import styles from "./moment-card.module.css";

type MomentCardProps = {
  name: string;
  copy: string;
  size?: "lg" | "sm";
};

export function MomentCard({ name, copy, size = "sm" }: MomentCardProps) {
  const className = size === "lg" ? `${styles.card} ${styles.lg}` : `${styles.card} ${styles.sm}`;

  return (
    <Link className={className} href={`/wines?moment=${encodeURIComponent(name)}`}>
      <p className="eyebrow">Para</p>
      <span className={styles.name}>
        {name}
        <i aria-hidden="true" className={styles.arrow}>
          {"\u2192"}
        </i>
      </span>
      <p className={styles.copy}>{copy}</p>
    </Link>
  );
}
