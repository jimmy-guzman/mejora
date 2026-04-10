const isInCi = ["CI", "CONTINUOUS_INTEGRATION"].some((key) => {
  return (
    process.env[key] && process.env[key] !== "0" && process.env[key] !== "false"
  );
});

export default isInCi;
