import { AdminLayout } from "@/components/admin/admin-layout";
import { DiscountsManager } from "@/components/admin/discounts-manager";
import { getAdminDiscountPageData } from "@/lib/admin/queries";
import styles from "../page.module.css";

type DiscountsPageProps = {
  searchParams: Promise<{
    created?: string;
    deleted?: string;
    updated?: string;
  }>;
};

export default async function DiscountsPage({ searchParams }: DiscountsPageProps) {
  const [{ discounts, wines }, params] = await Promise.all([getAdminDiscountPageData(), searchParams]);

  return (
    <AdminLayout>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>CMS interno</p>
          <h2>Descuentos</h2>
        </div>
      </div>

      {params.created ? <p className="alert success">Descuento creado correctamente.</p> : null}
      {params.updated ? <p className="alert success">Descuento actualizado correctamente.</p> : null}
      {params.deleted ? <p className="alert success">Descuento eliminado correctamente.</p> : null}

      <DiscountsManager discounts={discounts} wines={wines} />
    </AdminLayout>
  );
}
