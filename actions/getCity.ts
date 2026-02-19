import * as Location from "expo-location";

interface CityLocation {
    city: string;
    country: string;
};

export async function getCity(): Promise<CityLocation | null> {
    // Ask permission
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
        console.log("Permission denied");
        return null;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    // Reverse geocode (convert lat/lng -> address)
    const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
    });

    if (address.length > 0) {
        const city = address[0].city ?? undefined;
        const country = address[0].country ?? undefined;

        if (city && country) {
            return { city, country };
        }
    }

    return null;
}
