// Pin a non-UTC zone so local-day logic (e.g. split history day buckets) is
// exercised the same on CI (TZ unset => UTC) and on developer machines.
module.exports = async () => {
  Object.assign(process.env, { TZ: "Europe/Berlin" });
};
