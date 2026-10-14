import mongoose from 'mongoose';

const FeatureSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    description: { type: String }
  },
  { timestamps: true }
);

export const FeatureSetting = mongoose.model('FeatureSetting', FeatureSettingSchema);
