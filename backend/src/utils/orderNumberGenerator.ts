import Order from '../models/Order';
import Setting from '../models/Setting';

export const generateOrderNumber = async (): Promise<string> => {
  let prefix = 'ORD-';
  try {
    const setting = await Setting.findOne();
    if (setting && setting.invoicePrefix) {
      prefix = setting.invoicePrefix;
    }
  } catch (err) {
    // fallback
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Order.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');

  return `${prefix}${dateStr}-${sequence}`;
};
