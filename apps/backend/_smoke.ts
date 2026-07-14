import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./src/utils/utils";
import { prisma } from "./prisma/db";

const user = await prisma.user.findFirst();
const job = await prisma.job.findFirst();
if (!user || !job) { console.log("NO_USER_OR_JOB"); process.exit(0); }
const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
console.log("JOBID=" + job.id);
console.log("TOKEN=" + token);
process.exit(0);
