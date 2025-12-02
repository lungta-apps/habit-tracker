import { build as viteBuild } from "vite";
import { rm } from "fs/promises";

async function buildClient() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();
}

buildClient().catch((err) => {
  console.error(err);
  process.exit(1);
});
