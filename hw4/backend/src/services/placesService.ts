import { Client, LatLngLiteral, Place, TextSearchRequest } from "@googlemaps/google-maps-services-js";
import { ServiceResult } from "../types";

const client = new Client({});

interface PlaceSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

export class PlacesService {
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_MAPS_API_KEY is not set in environment variables.");
      throw new Error("GOOGLE_MAPS_API_KEY is not set.");
    }
    this.apiKey = apiKey;
  }

  async searchPlaces(
    query: string,
    location?: LatLngLiteral,
    radius?: number
  ): Promise<ServiceResult<PlaceSearchResult[]>> {
    try {
      const params: any = {
        query,
        key: this.apiKey,
      };

      if (location) {
        params.location = `${location.lat},${location.lng}`;
        params.radius = radius || 50000; // default 50km radius if location is provided
      }

      const response = await client.textSearch({
        params,
      });

      if (response.data.status !== "OK") {
        return {
          success: false,
          error: `Places API error: ${response.data.status}`,
        };
      }

      const places: PlaceSearchResult[] = response.data.results.map((place: Place) => ({
        name: place.name || "",
        address: place.formatted_address || "",
        latitude: place.geometry?.location.lat || 0,
        longitude: place.geometry?.location.lng || 0,
        placeId: place.place_id || "",
      }));

      return { success: true, data: places };
    } catch (error) {
      console.error("Error searching places:", error);
      return { success: false, error: "Failed to search places" };
    }
  }
}

export const placesService = new PlacesService();

