import { Request, Response } from 'express';
import Service from '../models/Service';

const defaultCatalogServices = [
  { name: 'Wash and Fold', price: 40, unit: 'kg', estimatedHours: 24, description: 'Everyday machine wash & neat folding', isActive: true },
  { name: 'Ironing', price: 15, unit: 'piece', estimatedHours: 12, description: 'High-pressure steam press ironing', isActive: true },
  { name: 'Laundry', price: 50, unit: 'piece', estimatedHours: 24, description: 'Deep wash, fabric softener & steam press', isActive: true },
  { name: 'Premium Laundry', price: 80, unit: 'piece', estimatedHours: 24, description: 'Individual drum wash with luxury perfume finish', isActive: true },
  { name: 'Dry Cleaning', price: 150, unit: 'piece', estimatedHours: 48, description: 'Specialized chemical solvent cleaning', isActive: true },
  { name: 'Starch + Ironing', price: 30, unit: 'piece', estimatedHours: 12, description: 'Crisp starch treatment with steam press', isActive: true },
  { name: 'Wash + Starch + Ironing', price: 70, unit: 'piece', estimatedHours: 24, description: 'Complete wash, starch & steam press', isActive: true },
  { name: 'Saree Polishing', price: 100, unit: 'piece', estimatedHours: 36, description: 'Saree roll press & shine restoration', isActive: true },
  { name: 'Saree Pre-pleating', price: 120, unit: 'piece', estimatedHours: 24, description: 'Ready-to-wear pleating & box folding', isActive: true },
  { name: 'Shoes Cleaning', price: 200, unit: 'pair', estimatedHours: 48, description: 'Deep shoe scrubbing & whitening', isActive: true },
  { name: 'Bag Cleaning', price: 250, unit: 'piece', estimatedHours: 48, description: 'Leather & fabric bag deep restoration', isActive: true },

  // Highlight Kg Rates
  { name: 'Wash & Iron (Kg Rate)', price: 120, unit: 'kg', estimatedHours: 24, description: 'Wash & Iron Rate per Kg', isActive: true },
  { name: 'Express Laundry (Kg Rate)', price: 199, unit: 'kg', estimatedHours: 12, description: 'Express Laundry Rate per Kg', isActive: true },
  { name: 'Premium Laundry (Kg Rate)', price: 159, unit: 'kg', estimatedHours: 24, description: 'Premium Laundry Rate per Kg', isActive: true },
  { name: 'Premium Express Laundry (Kg Rate)', price: 299, unit: 'kg', estimatedHours: 12, description: 'Premium Express Laundry Rate per Kg', isActive: true },
];

export const getServices = async (req: Request, res: Response) => {
  try {
    let services = await Service.find().sort({ name: 1 });
    if (services.length < 10) {
      // Auto-upgrade database with complete catalog if missing items
      for (const s of defaultCatalogServices) {
        const exists = await Service.findOne({ name: s.name });
        if (!exists) {
          await Service.create(s);
        }
      }
      services = await Service.find().sort({ name: 1 });
    }
    res.json({ success: true, services });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const { name, price, unit, estimatedHours, description, isActive } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Service name and price are required' });
    }

    const service = new Service({
      name,
      price: Number(price),
      unit: unit || 'piece',
      estimatedHours: estimatedHours ? Number(estimatedHours) : 24,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
    });

    await service.save();

    res.status(201).json({ success: true, message: 'Service created successfully', service });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const { name, price, unit, estimatedHours, description, isActive } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (name) service.name = name;
    if (price !== undefined) service.price = Number(price);
    if (unit) service.unit = unit;
    if (estimatedHours !== undefined) service.estimatedHours = Number(estimatedHours);
    if (description !== undefined) service.description = description;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.json({ success: true, message: 'Service updated successfully', service });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleServiceStatus = async (req: Request, res: Response) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    service.isActive = !service.isActive;
    await service.save();

    res.json({
      success: true,
      message: `Service marked as ${service.isActive ? 'Active' : 'Inactive'}`,
      service,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
