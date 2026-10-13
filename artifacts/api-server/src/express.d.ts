import { Hospital } from "@workspace/db/schema";

declare module "express-serve-static-core" {
  interface Request {
    hospital?: Hospital | null;
  }
}