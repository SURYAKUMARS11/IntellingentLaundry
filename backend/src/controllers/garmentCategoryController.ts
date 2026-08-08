import { Request, Response } from 'express';
import GarmentCategory from '../models/GarmentCategory';
import LaundryItem from '../models/LaundryItem';

const defaultCategories = [
  { name: 'Regular', description: 'Everyday common garments like shirts, pants, dhotis & sarees', displayOrder: 1 },
  { name: 'Men', description: 'Gents apparel including suits, blazers, formal shirts & denim', displayOrder: 2 },
  { name: 'Women', description: 'Ladies wear including silk sarees, lehengas, tops & dresses', displayOrder: 3 },
  { name: 'Kids', description: 'Children wear including frocks, onesies, shorts & baby wear', displayOrder: 4 },
  { name: 'Household', description: 'Home items including bedsheets, blankets, curtains & towels', displayOrder: 5 },
  { name: 'Others', description: 'Footwear, bags, caps, gloves & miscellaneous items', displayOrder: 6 },
];

export const getGarmentCategories = async (req: Request, res: Response) => {
  try {
    let categories = await GarmentCategory.find().sort({ displayOrder: 1, name: 1 });
    if (categories.length === 0) {
      for (const cat of defaultCategories) {
        await GarmentCategory.create(cat);
      }
      categories = await GarmentCategory.find().sort({ displayOrder: 1, name: 1 });
    }

    // Attach item count to each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const itemCount = await LaundryItem.countDocuments({ category: cat.name });
        return {
          ...cat.toObject(),
          itemCount,
        };
      })
    );

    res.json({ success: true, categories: categoriesWithCount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGarmentCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, icon, displayOrder, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existing = await GarmentCategory.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category name already exists' });
    }

    const category = new GarmentCategory({
      name: name.trim(),
      description: description || '',
      icon: icon || 'Tag',
      displayOrder: displayOrder ? Number(displayOrder) : 99,
      isActive: isActive !== undefined ? isActive : true,
    });

    await category.save();

    res.status(201).json({ success: true, message: 'Garment category created successfully', category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGarmentCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, icon, displayOrder, isActive } = req.body;
    const category = await GarmentCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const oldName = category.name;
    if (name && name.trim() !== oldName) {
      const existing = await GarmentCategory.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }
      category.name = name.trim();

      // Update associated laundry items to new category name
      await LaundryItem.updateMany({ category: oldName }, { category: name.trim() });
    }

    if (description !== undefined) category.description = description;
    if (icon) category.icon = icon;
    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({ success: true, message: 'Category updated successfully', category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGarmentCategory = async (req: Request, res: Response) => {
  try {
    const category = await GarmentCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Reassign items in this category to 'Others'
    await LaundryItem.updateMany({ category: category.name }, { category: 'Others' });
    await GarmentCategory.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
