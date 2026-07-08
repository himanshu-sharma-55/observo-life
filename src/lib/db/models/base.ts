import mongoose, { type Model, type Schema } from "mongoose";

/**
 * Shared schema options: strip __v and expose `id` (hex string) instead of
 * `_id` when serialized to JSON, which is what the client/API responses expect.
 *
 * Note: intentionally not annotated as `SchemaOptions` so it stays generic and
 * is structurally checked against each model's specialized schema type.
 */
export const baseSchemaOptions = {
  versionKey: false as const,
  toJSON: {
    virtuals: true,
    transform(_doc: unknown, ret: Record<string, unknown>) {
      if (ret._id != null) ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  },
  toObject: { virtuals: true },
};

/** Reuse an existing compiled model (avoids OverwriteModelError on hot reload). */
export function getModel<T>(name: string, schema: Schema): Model<T> {
  if (process.env.NODE_ENV !== "production" && mongoose.models[name]) {
    delete mongoose.models[name];
  }

  return (
    (mongoose.models[name] as Model<T>) ??
    (mongoose.model(name, schema) as unknown as Model<T>)
  );
}
