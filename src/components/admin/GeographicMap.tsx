import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface LocationData {
  lat: number;
  lng: number;
  orders: number;
  revenue: number;
  users: number;
  city?: string;
  country?: string;
}

interface GeographicMapProps {
  data: LocationData[];
  loading?: boolean;
}

export default function GeographicMap({ data, loading }: GeographicMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = async () => {
      try {
        // Fetch Mapbox token from edge function
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
          "get-mapbox-token"
        );

        if (tokenError || !tokenData?.token) {
          throw new Error("Failed to load map configuration");
        }

        mapboxgl.accessToken = tokenData.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/dark-v11",
          projection: "globe",
          zoom: 1.5,
          center: [0, 20],
          pitch: 30,
        });

        map.current.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          "top-right"
        );

        map.current.scrollZoom.disable();

        map.current.on("style.load", () => {
          map.current?.setFog({
            color: "rgb(15, 23, 42)",
            "high-color": "rgb(30, 41, 59)",
            "horizon-blend": 0.3,
          });
        });

        map.current.on("load", () => {
          setMapLoading(false);
        });

        // Slow rotation
        const secondsPerRevolution = 300;
        let userInteracting = false;

        function spinGlobe() {
          if (!map.current) return;
          const zoom = map.current.getZoom();
          if (!userInteracting && zoom < 4) {
            const distancePerSecond = 360 / secondsPerRevolution;
            const center = map.current.getCenter();
            center.lng -= distancePerSecond;
            map.current.easeTo({ center, duration: 1000, easing: (n) => n });
          }
        }

        map.current.on("mousedown", () => { userInteracting = true; });
        map.current.on("mouseup", () => { userInteracting = false; spinGlobe(); });
        map.current.on("touchend", () => { userInteracting = false; spinGlobe(); });
        map.current.on("moveend", spinGlobe);

        spinGlobe();
      } catch (err: any) {
        console.error("Map initialization error:", err);
        setError(err.message);
        setMapLoading(false);
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      map.current?.remove();
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current || mapLoading || !data.length) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Find max values for scaling
    const maxOrders = Math.max(...data.map((d) => d.orders), 1);
    const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

    data.forEach((location) => {
      // Scale marker size based on orders (min 20, max 60)
      const size = 20 + (location.orders / maxOrders) * 40;
      
      // Create custom marker element
      const el = document.createElement("div");
      el.className = "map-marker";
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, rgba(20, 184, 166, 0.8) 0%, rgba(20, 184, 166, 0.2) 70%);
        border: 2px solid rgba(20, 184, 166, 0.9);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${Math.max(10, size / 4)}px;
        font-weight: bold;
        color: white;
        box-shadow: 0 0 ${size / 2}px rgba(20, 184, 166, 0.5);
        transition: transform 0.2s, box-shadow 0.2s;
      `;
      el.textContent = location.orders.toString();
      
      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
        el.style.boxShadow = `0 0 ${size}px rgba(20, 184, 166, 0.8)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
        el.style.boxShadow = `0 0 ${size / 2}px rgba(20, 184, 166, 0.5)`;
      });

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        className: "map-popup",
      }).setHTML(`
        <div style="padding: 12px; min-width: 150px;">
          <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #14b8a6;">
            ${location.city || location.country || "Location"}
          </h3>
          <div style="display: grid; gap: 6px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Orders:</span>
              <span style="font-weight: 500; color: #f1f5f9;">${location.orders}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Revenue:</span>
              <span style="font-weight: 500; color: #10b981;">$${location.revenue.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Users:</span>
              <span style="font-weight: 500; color: #3b82f6;">${location.users}</span>
            </div>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [data, mapLoading]);

  if (error) {
    return (
      <div className="w-full h-[400px] rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="font-medium">Unable to load map</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      {(mapLoading || loading) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0" />
      <style>{`
        .mapboxgl-popup-content {
          background: rgb(30, 41, 59) !important;
          border-radius: 12px !important;
          border: 1px solid rgba(20, 184, 166, 0.3) !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
          padding: 0 !important;
        }
        .mapboxgl-popup-tip {
          border-top-color: rgb(30, 41, 59) !important;
        }
      `}</style>
    </div>
  );
}
