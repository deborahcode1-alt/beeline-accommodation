import { prisma } from "@/lib/prisma";

// Small on/off switches the platform owner controls, kept in the database.

const STARTING_UP_KEY = "startingUpOffered";

/** Whether new hosts can choose the free "Starting up" tier. On unless the owner has switched it off. */
export async function startingUpOffered(): Promise<boolean> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: STARTING_UP_KEY } });
    return row?.value !== "off";
  } catch (err) {
    console.error("Could not read the Starting up setting:", err);
    return true;
  }
}

export async function setStartingUpOffered(offered: boolean) {
  await prisma.siteSetting.upsert({
    where: { key: STARTING_UP_KEY },
    update: { value: offered ? "on" : "off" },
    create: { key: STARTING_UP_KEY, value: offered ? "on" : "off" },
  });
}
