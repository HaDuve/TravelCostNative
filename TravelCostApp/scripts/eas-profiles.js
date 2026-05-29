/** Branch + EAS environment aligned with eas.json build profiles. */

/** @type {Record<string, { branch: string, environment: string }>} */
const UPDATE_TARGETS = {
  production: { branch: "production", environment: "production" },
  alpha: { branch: "alpha", environment: "production" },
  staging: { branch: "staging", environment: "production" },
  dev: { branch: "dev", environment: "development" },
};

/** @type {Record<string, string>} */
const BUILD_PROFILE_ENVIRONMENT = {
  production: "production",
  alpha: "production",
  staging: "production",
  development: "development",
  "development-simulator": "development",
};

function getUpdateTarget(target) {
  const config = UPDATE_TARGETS[target];
  if (!config) {
    throw new Error(`Unknown update target "${target}"`);
  }
  return config;
}

function getBuildProfileEnvironment(profile) {
  const environment = BUILD_PROFILE_ENVIRONMENT[profile];
  if (!environment) {
    throw new Error(`Unknown build profile "${profile}" for EAS environment`);
  }
  return environment;
}

module.exports = {
  UPDATE_TARGETS,
  BUILD_PROFILE_ENVIRONMENT,
  getUpdateTarget,
  getBuildProfileEnvironment,
};
