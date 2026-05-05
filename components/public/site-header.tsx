import Link from "next/link";
import styles from "./site-header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.logo} href="/">
        MDB Wines
      </Link>
      <nav aria-label="Principal">
        <Link href="/discover">Elegí tu vino</Link>
        <Link href="/wines">Vinos</Link>
        <Link href="/admin">Admin</Link>
      </nav>
    </header>
  );
}
