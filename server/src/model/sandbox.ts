import mongoose, { ObjectId } from "mongoose";
<<<<<<< HEAD

export interface ISandboxFile {
  name: string;
  code: string;
  language: string;
}

=======
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
export interface ISandBox {
  code: string;
  output: string;
  userId: ObjectId;
  title: string;
  language: string;
<<<<<<< HEAD
  files: ISandboxFile[];
}

=======
}
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
const SandBoxSchema = new mongoose.Schema<ISandBox>(
  {
    code: {
      type: String,
<<<<<<< HEAD
=======
      min: 3,
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
      default: "",
    },
    output: {
      type: String,
      default: "",
    },
    userId: {
<<<<<<< HEAD
      type: mongoose.Schema.Types.ObjectId,
=======
      type: mongoose.Types.ObjectId,
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
      ref: "User",
      required: [true, "User id is required"],
    },
    title: {
      type: String,
      min: 3,
    },
    language: {
      type: String,
<<<<<<< HEAD
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

=======
      default: "",
    },
  },
  { timestamps: true }
);
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
export const SandBox = mongoose.model("SandBox", SandBoxSchema);
