import { API_ENDPOINTS } from '@/utils/constants';

export interface PlaceSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

export interface PlacesSearchResponse {
  success: boolean;
  data: PlaceSearchResult[];
  message: string;
}

export class PlacesService {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  static async searchPlaces(
    query: string,
    location?: { lat: number; lng: number },
    radius?: number
  ): Promise<PlaceSearchResult[]> {
    const params = new URLSearchParams({
      query,
    });

    if (location) {
      params.append('latitude', location.lat.toString());
      params.append('longitude', location.lng.toString());
    }

    if (radius) {
      params.append('radius', radius.toString());
    }

    const response = await fetch(`${API_ENDPOINTS.PLACES.SEARCH}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await this.handleResponse<PlacesSearchResponse>(response);
    return result.data;
  }
}

export const placesService = new PlacesService();

