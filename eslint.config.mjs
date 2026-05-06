import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: ["lib/generated/**"],
  },
  ...nextVitals,
];

export default eslintConfig;
