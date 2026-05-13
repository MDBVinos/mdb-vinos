import { ThanksRedirect } from "@/components/public/thanks-redirect";
import { GENERAL_WHATSAPP_LINK } from "@/lib/public/whatsapp";
import styles from "./thanks.module.css";

export const dynamic = "force-dynamic";

type ThanksPageProps = {
  searchParams: Promise<{
    to?: string;
  }>;
};

export default async function ThanksPage({ searchParams }: ThanksPageProps) {
  const { to } = await searchParams;
  const whatsappUrl = to?.startsWith("https://wa.me/") ? to : GENERAL_WHATSAPP_LINK;

  return (
    <main className={styles.page}>
      <ThanksRedirect to={whatsappUrl} />
      <section className={styles.hero}>
        <img src="/brand/order-thanks.png" alt="Gracias por tu pedido. Te redireccionamos a Whatsapp." />
      </section>
    </main>
  );
}
