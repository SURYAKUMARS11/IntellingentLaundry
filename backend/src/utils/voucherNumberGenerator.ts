import Expense from '../models/Expense';

export const generateVoucherNumber = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `EXP-${dateStr}-`;

  const lastExpense = await Expense.findOne({ voucherNumber: new RegExp(`^${prefix}`) })
    .sort({ createdAt: -1 })
    .exec();

  let nextNum = 1;
  if (lastExpense && lastExpense.voucherNumber) {
    const parts = lastExpense.voucherNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextNum = lastSeq + 1;
    }
  }

  const seqStr = nextNum.toString().padStart(4, '0');
  return `${prefix}${seqStr}`;
};
