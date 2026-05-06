import { AdminLayout } from "@/components/admin/admin-layout";
import { ImportForm } from "@/components/admin/import-form";
import { getWineImageOptions, requireUser } from "@/lib/admin/queries";
import styles from "../page.module.css";

type ImportWinesPageProps = {
  searchParams: Promise<{
    images?: string;
    imported?: string;
  }>;
};

export default async function ImportWinesPage({ searchParams }: ImportWinesPageProps) {
  await requireUser();
  const [params, imageWines] = await Promise.all([searchParams, getWineImageOptions()]);

  return (
    <AdminLayout>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Importar Excel</p>
          <h2>Importar vinos</h2>
        </div>
      </div>

      {params.imported ? <p className="alert success">{params.imported} vinos importados correctamente.</p> : null}
      {params.images ? <p className="alert success">{params.images} imagenes subidas correctamente.</p> : null}

      <ImportForm imageWines={imageWines} />
    </AdminLayout>
  );
}
