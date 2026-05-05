import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { WinesTable } from "@/components/admin/wines-table";
import { getAdminWines } from "@/lib/admin/queries";
import styles from "./page.module.css";

type AdminPageProps = {
  searchParams: Promise<{
    created?: string;
    imported?: string;
    updated?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const wines = await getAdminWines();
  const params = await searchParams;

  return (
    <AdminLayout>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>CMS interno</p>
          <h2>Vinos</h2>
        </div>
        <div className={styles.actions}>
          <Link className="button secondary" href="/admin/import">
            Importar Excel
          </Link>
          <Link className="button" href="/admin/new">
            Nuevo vino
          </Link>
        </div>
      </div>

      {params.created ? <p className="alert success">Vino creado correctamente.</p> : null}
      {params.updated ? <p className="alert success">Vino actualizado correctamente.</p> : null}
      {params.imported ? <p className="alert success">{params.imported} vinos importados correctamente.</p> : null}

      <WinesTable wines={wines} />
    </AdminLayout>
  );
}
