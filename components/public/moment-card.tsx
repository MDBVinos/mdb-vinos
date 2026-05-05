import Link from "next/link";
import styles from "./moment-card.module.css";

type MomentCardProps = {
  name: string;
  copy: string;
};

export function MomentCard({ name, copy }: MomentCardProps) {
  return (
    <Link className={styles.card} href={`/wines?moment=${encodeURIComponent(name)}`}>
      <span>{name}</span>
      <p>{copy}</p>
    </Link>
  );
}
