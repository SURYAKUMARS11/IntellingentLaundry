import { Request, Response } from 'express';
import LaundryItem from '../models/LaundryItem';

export const getItems = async (req: Request, res: Response) => {
  try {
    const items = await LaundryItem.find().sort({ category: 1, name: 1 });
    res.json({ success: true, items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const { name, defaultPrice, category, icon, isActive } = req.body;

    if (!name || defaultPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Item name and default price are required' });
    }

    const item = new LaundryItem({
      name,
      defaultPrice: Number(defaultPrice),
      category: category || 'Clothes',
      icon: icon || 'Shirt',
      isActive: isActive !== undefined ? isActive : true,
    });

    await item.save();

    res.status(201).json({ success: true, message: 'Laundry item created successfully', item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { name, defaultPrice, category, icon, isActive } = req.body;
    const item = await LaundryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (name) item.name = name;
    if (defaultPrice !== undefined) item.defaultPrice = Number(defaultPrice);
    if (category) item.category = category;
    if (icon) item.icon = icon;
    if (isActive !== undefined) item.isActive = isActive;

    await item.save();

    res.json({ success: true, message: 'Laundry item updated successfully', item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    await LaundryItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Laundry item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
