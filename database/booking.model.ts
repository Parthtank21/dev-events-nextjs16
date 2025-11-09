import { Schema, model, models, Document, Model, Types } from "mongoose";
import { Event } from "./event.model";

// Define the interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition with strong typing
const bookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: (email: string) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Please enter a valid email address",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Verify event exists before saving booking
bookingSchema.pre("save", async function (next) {
  if (this.isModified("eventId")) {
    const eventExists = await Event.exists({ _id: this.eventId });
    if (!eventExists) {
      return next(new Error("Event does not exist"));
    }
  }
  next();
});

// Export the Booking model
export const Booking: Model<IBooking> =
  models.Booking || model<IBooking>("Booking", bookingSchema);

export default Booking;
