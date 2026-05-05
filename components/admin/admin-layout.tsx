import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import styles from "./admin-layout.module.css";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div>
          <p className={styles.kicker}>MDB</p>
          <h1>Admin</h1>
        </div>

        <nav className={styles.nav} aria-label="Admin">
          <Link href="/admin">Vinos</Link>
          <Link href="/admin/new">Nuevo vino</Link>
          <Link href="/admin/import">Importar Excel</Link>
        </nav>

        <form action={logoutAction}>
          <button className="secondary" type="submit">
            Salir
          </button>
        </form>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
