import { Schema } from "mongoose";
import { baseSchemaOptions, getModel } from "./base";

export interface UserDoc {
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  passwordHash?: string | null;
  /** User chose to set an email password later (Settings). */
  passwordSetupDeferred?: boolean | null;
  /** Remaining successful AI generations. Unlimited accounts ignore this. */
  aiCredits?: number | null;
  createdAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, default: null },
    email: { type: String, required: true },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },
    passwordHash: { type: String, default: null },
    passwordSetupDeferred: { type: Boolean, default: false },
    aiCredits: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  // strict:false so fields written by the Auth.js adapter are preserved.
  { ...baseSchemaOptions, strict: false, collection: "users" },
);

userSchema.index({ email: 1 }, { unique: true });

export const User = getModel<UserDoc>("User", userSchema);
