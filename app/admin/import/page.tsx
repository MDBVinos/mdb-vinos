import { AdminLayout } from "@/components/admin/admin-layout";
import { ImportForm } from "@/components/admin/import-form";
import { requireUser } from "@/lib/admin/queries";
import styles from "../page.module.css";

export default async function ImportWinesPage() {
  await requireUser();

  return (
    <AdminLayout>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Importar Excel</p>
          <h2>Importar vinos</h2>
        </div>
      </div>

      <ImportForm />
    </AdminLayout>
  );
}
