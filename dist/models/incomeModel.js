import { Schema, model } from "mongoose";
const incomeSchema = new Schema({
    description: {
        type: String,
        required: true,
        trim: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true, // income for a particular user
    },
    type: {
        type: String,
        enum: ["income"],
        default: "income",
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
const incomeModel = model("Income", incomeSchema);
export default incomeModel;
