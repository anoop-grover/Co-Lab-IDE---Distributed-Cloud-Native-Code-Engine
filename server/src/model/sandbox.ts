import mongoose, { ObjectId } from "mongoose";

export interface ISandboxFile {
  name: string;
  code: string;
  language: string;
}

export interface ISandBox {
  code: string;
  output: string;
  userId: ObjectId;
  title: string;
  language: string;
  files: ISandboxFile[];
}

const SandBoxSchema = new mongoose.Schema<ISandBox>(
  {
    code: {
      type: String,
      default: "",
    },
    output: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User id is required"],
    },
    title: {
      type: String,
      min: 3,
    },
    language: {
      type: String,
      default: "javascript",
    },
    files: {
      type: [
        {
          name: { type: String, required: true },
          code: { type: String, default: "" },
          language: { type: String, default: "javascript" }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

export const SandBox = mongoose.model("SandBox", SandBoxSchema);
