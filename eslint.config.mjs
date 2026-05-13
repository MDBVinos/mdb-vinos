import nextVitals from "eslint-config-next/core-web-vitals";

const nextVitalsWithoutReactRules = nextVitals.map((config) => ({
  ...config,
  rules: Object.fromEntries(
    Object.entries(config.rules ?? {}).filter(([rule]) => !rule.startsWith("react/")),
  ),
}));

const eslintConfig = [
  {
    ignores: [".cache/**", ".codex/**", ".next/**", "lib/generated/**"],
  },
  ...nextVitalsWithoutReactRules,
];

export default eslintConfig;
