"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";
import { SubmitButton } from "./submit-button";
import styles from "./login-form.module.css";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, {});

  return (
    <main className={styles.page}>
      <form action={formAction} className={styles.form}>
        <div>
          <p className={styles.kicker}>MDB Admin</p>
          <h1>Ingresar</h1>
        </div>

        {state.error ? <p className="alert error">{state.error}</p> : null}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>

        <SubmitButton label="Entrar" loadingLabel="Entrando..." />
      </form>
    </main>
  );
}
