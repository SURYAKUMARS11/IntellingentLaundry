import mongoose, { Schema, Document } from 'mongoose';

export interface IGasCylinderLog extends Document {
  changeDate: Date;
  cost: number;
  vendorName?: string;
  cylinderSize?: string;
  totalCyclesCompleted?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GasCylinderLogSchema: Schema = new Schema(
  {
    changeDate: { type: Date, required: true, default: Date.now },
    cost: { type: Number, required: true, default: 1850 },
    vendorName: { type: String, default: 'LPG Gas Supplier' },
    cylinderSize: { type: String, default: '19kg Commercial' },
    totalCyclesCompleted: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IGasCylinderLog>('GasCylinderLog', GasCylinderLogSchema);
