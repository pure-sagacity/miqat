import { PrayerTimes, PrayerTimesResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getCity } from "./getCity";

export function usePrayerTimes() {
    // Get today's date in DD-MM-YYYY format (required by Aladhan API)
    const today = new Date();
    const date = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    return useQuery<PrayerTimes>({
        queryKey: ['prayerTimes'],
        queryFn: async () => {
            const location = await getCity();

            if (!location) {
                throw new Error('City not available');
            }

            console.log(`Fetching prayer times for ${location.city}, ${location.country} on ${date}`);

            const response = await fetch(
                `https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(location.city)}&country=${encodeURIComponent(location.country)}`
            );

            if (!response.ok) {
                throw new Error(response.statusText || 'Failed to fetch prayer times');
            }

            const data: PrayerTimesResponse = await response.json();

            return {
                Fajr: data.data.timings.Fajr,
                Sunrise: data.data.timings.Sunrise,
                Dhuhr: data.data.timings.Dhuhr,
                Asr: data.data.timings.Asr,
                Maghrib: data.data.timings.Maghrib,
                Isha: data.data.timings.Isha,
            };
        },
    });
};