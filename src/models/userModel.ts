import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1 },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, select: false },
    verificationCodeExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

const userModel = mongoose.model("User", userSchema);
export default userModel;
