import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  shopName: string;
  shopTagline?: string;
  logoUrl?: string;
  phone: string;
  email: string;
  address: string;
  gstNumber?: string;
  gstPercentage: number;
  currencySymbol: string;
  currencyCode: string;
  invoicePrefix: string;
  termsAndConditions?: string;
  upiId?: string;
  gpayNumber?: string;
  paymentQrUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema: Schema = new Schema(
  {
    shopName: { type: String, required: true, default: 'IntelligentLaundry & Dry Cleaners' },
    shopTagline: { type: String, default: 'Smart & Premium Laundry Management' },
    logoUrl: { type: String, default: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=200&auto=format&fit=crop&q=80' },
    phone: { type: String, required: true, default: '+91 98765 43210' },
    email: { type: String, required: true, default: 'contact@intelligentlaundry.com' },
    address: { type: String, required: true, default: '123 Sparkle Avenue, Suite 4B, Commercial Hub' },
    gstNumber: { type: String, default: '22AAAAA0000A1Z5' },
    gstPercentage: { type: Number, default: 0 },
    currencySymbol: { type: String, default: '₹' },
    currencyCode: { type: String, default: 'INR' },
    invoicePrefix: { type: String, default: 'ORD-' },
    termsAndConditions: { type: String, default: 'Items not collected within 30 days are subject to storage charges. Please report any discrepancy within 24 hours of pickup.' },
    upiId: { type: String, default: '9876543210@paytm' },
    gpayNumber: { type: String, default: '9876543210' },
    paymentQrUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<ISetting>('Setting', SettingSchema);
