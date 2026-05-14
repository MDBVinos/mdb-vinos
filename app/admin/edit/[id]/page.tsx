import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { WineForm } from "@/components/admin/wine-form";
import { updateWineAction } from "@/lib/admin/actions";
import { getWineForEdit, getWineFormOptions } from "@/lib/admin/queries";
import styles from "../../page.module.css";

type EditWinePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditWinePage({ params }: EditWinePageProps) {
  const { id } = await params;
  const [options, wine] = await Promise.all([getWineFormOptions(), getWineForEdit(id)]);

  return (
    <AdminLayout>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Editar vino</p>
          <h2>{wine.name}</h2>
        </div>
        <div className={styles.actions}>
          <Link className="button secondary" href="/admin">
            Volver
          </Link>
        </div>
      </div>

      <WineForm action={updateWineAction} mode="edit" options={options} initialData={wine} />
    </AdminLayout>
  );
}
