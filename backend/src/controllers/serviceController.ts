import { Request, Response } from 'express';
import Service from '../models/Service';

export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await Service.find().sort({ name: 1 });
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
