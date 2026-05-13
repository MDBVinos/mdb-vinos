import Link from "next/link";
import { getHeaderWineries } from "@/lib/public/queries";
import { BodegaDropdown } from "./bodega-dropdown";
import { HeaderCartButton } from "./header-cart-button";
import styles from "./site-header.module.css";

export async function SiteHeader() {
  const wineries = await getHeaderWineries();

  return (
    <header className={styles.header}>
      <Link className={styles.logo} href="/">
        <span className={styles.logoMark} aria-hidden="true" />
        <strong>MDB Wines</strong>
      </Link>
      <nav aria-label="Principal">
        <Link href="/#recomendaciones">Recomendaciones</Link>
        <Link href="/wines">Catálogo</Link>
        <BodegaDropdown wineries={wineries} />
        <HeaderCartButton />
      </nav>
    </header>
  );
}
