
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from "@googlemaps/js-api-loader";
import { Event, Member } from '../types';

declare var google: any;

interface GoogleMapViewProps {
  event: Event;
  members: Member[];
  currentMemberId?: number;
  apiKey?: string;
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ event, members, currentMemberId, apiKey }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fix: Explicitly cast loader to 'any' to resolve the 'Property load does not exist on type Loader' error
  // while ensuring the runtime execution of the Google Maps API loader.
  useEffect(() => {
    if (!apiKey) return;
    const loader = new Loader({ apiKey, version: "weekly" });
    (loader as any).load().then(() => setIsLoaded(true)).catch((err: Error) => {
      console.error("Google Maps SDK failed to load:", err);
    });
  }, [apiKey]);

  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      const gMap = new google.maps.Map(mapRef.current, {
        center: { lat: event.meetingPointLat, lng: event.meetingPointLng },
        zoom: 16,
        disableDefaultUI: true,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }]
      });
      setMap(gMap);
    }
  }, [isLoaded, event, map]);

  if (!apiKey) {
      const centerLat = event.meetingPointLat;
      const centerLng = event.meetingPointLng;
      const SCALE = 45000;

      return (
        <div className="relative w-full h-full bg-slate-50 overflow-hidden">
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-5" 
                style={{ backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
            </div>
            
            {/* Pulsing Zone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                 <div className="pulse-ring"></div>
                 <div className="w-8 h-8 bg-blue-600 rounded-full shadow-lg border-4 border-white flex items-center justify-center relative z-10">
                     <span className="text-white text-[10px] font-bold">MEET</span>
                 </div>
            </div>

            {/* Stickers */}
            {members.map(member => {
                if(!member.lat || !member.lng || member.arrivalTime) return null;
                const dy = (centerLat - member.lat) * SCALE;
                const dx = (member.lng - centerLng) * SCALE;
                const isMe = member.id === currentMemberId;

                return (
                    <div key={member.id} className="absolute transition-all duration-1000 ease-in-out z-20 animate-bounce-subtle"
                        style={{ top: `calc(50% + ${dy}px)`, left: `calc(50% + ${dx}px)` }}>
                        <div className="sticker-container">
                            <div className={`sticker-avatar shadow-lg border-2 ${isMe ? 'border-blue-500' : 'border-slate-300'}`}>
                                <div className={`w-full h-full flex items-center justify-center text-lg ${isMe ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                                    {member.nickname[0].toUpperCase()}
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${member.shareLocation ? 'bg-green-500' : 'bg-slate-300'}`} />
                            </div>
                            <div className="sticker-tail" />
                        </div>
                    </div>
                );
            })}
        </div>
      );
  }

  return <div ref={mapRef} className="w-full h-full" />;
};

export default GoogleMapView;
