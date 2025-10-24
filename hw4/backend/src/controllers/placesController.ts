import { Request, Response, NextFunction } from "express";
import { placesService } from "../services/placesService";
import { ServiceResult } from "../types";

export const searchPlaces = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query, latitude, longitude, radius } = req.query;

    if (!query || typeof query !== "string") {
      res.status(400).json({
        success: false,
        error: "Query parameter is required and must be a string.",
      });
      return;
    }

    let location;
    if (latitude && longitude && typeof latitude === "string" && typeof longitude === "string") {
      location = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
    }

    let parsedRadius: number | undefined;
    if (radius && typeof radius === "string") {
      parsedRadius = parseInt(radius);
    }

    const result = await placesService.searchPlaces(query, location, parsedRadius);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: "Places retrieved successfully.",
    });
  } catch (error) {
    next(error);
  }
};

