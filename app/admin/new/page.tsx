import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { WineForm } from "@/components/admin/wine-form";
import { createWineAction } from "@/lib/admin/actions";
import { getWineFormOptions } from "@/lib/admin/queries";
import styles from "../page.module.css";

export default async function NewWinePage() {
  const options = await getWineFormOptions();

  return (
    <AdminLayout>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Nuevo vino</p>
          <h2>Crear vino</h2>
        </div>
        <div className={styles.actions}>
          <Link className="button secondary" href="/admin">
            Volver
          </Link>
        </div>
      </div>

      <WineForm action={createWineAction} mode="create" options={options} />
    </AdminLayout>
  );
}
