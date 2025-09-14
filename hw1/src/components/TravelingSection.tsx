'use client';

import React, { useState, useMemo } from 'react';
// @ts-ignore
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
// @ts-ignore
import ImageGallery from 'react-image-gallery';
import ReactCountryFlag from 'react-country-flag';
import { FaTimes, FaMapMarkerAlt, FaCalendarAlt, FaCamera, FaGlobeAmericas, FaPlay, FaImages, FaBlog, FaNewspaper, FaExternalLinkAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioViewModel } from '@/viewModels';
import { TravelDestination, TravelPhoto, TravelLink } from '@/types';
import 'react-image-gallery/styles/css/image-gallery.css';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country code mapping for flags
const countryCodeMap: { [key: string]: string } = {
  'Iceland': 'IS',
  'Nepal': 'NP',
  'Austria': 'AT',
  'Italy': 'IT',
  'Japan': 'JP',
  'United Kingdom': 'GB',
  'Philippines': 'PH',
  'Taiwan': 'TW',
  'Singapore': 'SG',
  'Hong Kong': 'HK'
};

// Link type icons
const getLinkIcon = (type: string) => {
  switch (type) {
    case 'vlog': return FaPlay;
    case 'album': return FaImages;
    case 'blog': return FaBlog;
    case 'article': return FaNewspaper;
    default: return FaExternalLinkAlt;
  }
};

const TravelingSection: React.FC = () => {
  const viewModel = PortfolioViewModel.getInstance();
  const travelDestinations = viewModel.travelDestinations;
  
  const [selectedDestination, setSelectedDestination] = useState<TravelDestination | null>(null);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Transform travel photos for react-image-gallery
  const galleryImages = useMemo(() => {
    if (!selectedDestination) return [];
    
    return selectedDestination.photos.map((photo: TravelPhoto) => ({
      original: photo.url,
      thumbnail: photo.url,
      description: photo.caption,
    }));
  }, [selectedDestination]);

  const handleMarkerClick = (destination: TravelDestination) => {
    setSelectedDestination(destination);
  };

  const handleCloseModal = () => {
    setSelectedDestination(null);
    setShowPhotoGallery(false);
  };

  const handleOpenGallery = (photoIndex: number = 0) => {
    setSelectedPhotoIndex(photoIndex);
    setShowPhotoGallery(true);
  };

  return (
    <section className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300" id="traveling">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <FaGlobeAmericas className="text-blue-600 text-3xl mr-3" />
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Travel Adventures
            </h2>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Exploring the world with grace and curiousity. Click on the pins to discover my travel stories and photo memories!
          </p>
        </motion.div>

        {/* World Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-12"
        >
          <div className="relative w-full h-96 lg:h-[500px]">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 120,
                center: [0, 10]
              }}
              width={800}
              height={400}
              className="w-full h-full"
            >
              <ZoomableGroup zoom={1} minZoom={0.5} maxZoom={8}>
                <Geographies geography={geoUrl}>
                  {({ geographies }: any) =>
                    geographies.map((geo: any) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#E5E7EB"
                        stroke="#9CA3AF"
                        strokeWidth={0.5}
                        className="outline-none hover:fill-gray-300 transition-colors duration-200 dark:fill-gray-600 dark:hover:fill-gray-500"
                      />
                    ))
                  }
                </Geographies>
                
                {/* Travel Destination Markers */}
                {travelDestinations.map((destination: TravelDestination) => (
                  <Marker
                    key={destination.id}
                    coordinates={[destination.coordinates.lng, destination.coordinates.lat]}
                  >
                    <motion.g
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="cursor-pointer"
                      onClick={() => handleMarkerClick(destination)}
                    >
                      <circle
                        r={8}
                        fill="#EF4444"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        className="drop-shadow-sm"
                      />
                      <circle
                        r={3}
                        fill="#FFFFFF"
                        className="pointer-events-none"
                      />
                    </motion.g>
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
          </div>
          
          {/* Map Legend */}
          <div className="mt-4 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
            <FaMapMarkerAlt className="text-red-500 mr-2" />
            <span>Click on the red pins to explore my travel destinations • Zoom and pan to explore</span>
          </div>
        </motion.div>
      </div>

      {/* Destination Details Modal */}
      <AnimatePresence>
        {selectedDestination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto mt-16"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <FaTimes className="text-gray-500 dark:text-gray-400" />
                </button>
                
                <div className="flex items-center mb-4">
                  {/* Country Flag */}
                  <div className="w-16 h-12 mr-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <ReactCountryFlag
                      countryCode={countryCodeMap[selectedDestination.country] || 'US'}
                      svg
                      style={{
                        width: '3rem',
                        height: '2.25rem',
                      }}
                      title={selectedDestination.country}
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedDestination.country}
                    </h3>
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
                      <FaCalendarAlt className="mr-2" />
                      <span>{selectedDestination.visitDate} • {selectedDestination.duration}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300">
                  {selectedDestination.description}
                </p>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Highlights */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Trip Highlights
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedDestination.highlights.map((highlight, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photo Grid */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Photo Memories
                    </h4>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <FaCamera className="mr-2" />
                      <span>
                        {selectedDestination.photos.length} photos
                        {selectedDestination.comingSoonPhotos && selectedDestination.comingSoonPhotos.length > 0 && 
                          ` + ${selectedDestination.comingSoonPhotos.length} coming soon`
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedDestination.photos.map((photo, index) => (
                      <motion.div
                        key={photo.id}
                        whileHover={{ scale: 1.05 }}
                        className="cursor-pointer rounded-lg overflow-hidden shadow-md"
                        onClick={() => handleOpenGallery(index)}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/profile.jpg";
                          }}
                        />
                      </motion.div>
                    ))}
                    
                    {/* Coming Soon Photos */}
                    {selectedDestination.comingSoonPhotos?.map((comingText, index) => (
                      <div
                        key={`coming-soon-${index}`}
                        className="rounded-lg overflow-hidden shadow-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center h-32"
                      >
                        <div className="text-center p-3">
                          <FaCamera className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {comingText}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Travel Links */}
                {selectedDestination.links && selectedDestination.links.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Travel Content
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedDestination.links.map((link, index) => {
                        const IconComponent = getLinkIcon(link.type);
                        return (
                          <motion.a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg hover:shadow-md transition-all duration-200 group"
                          >
                            <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-colors">
                              <IconComponent className="text-white text-sm" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {link.title}
                              </h5>
                              {link.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {link.description}
                                </p>
                              )}
                            </div>
                            <FaExternalLinkAlt className="text-gray-400 group-hover:text-blue-500 ml-2 transition-colors" />
                          </motion.a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Gallery Modal */}
      <AnimatePresence>
        {showPhotoGallery && selectedDestination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-60 flex items-center justify-center"
            onClick={() => setShowPhotoGallery(false)}
          >
            <div className="max-w-5xl w-full h-full p-4" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowPhotoGallery(false)}
                className="absolute top-6 right-6 z-70 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all"
              >
                <FaTimes size={20} />
              </button>
              
              <div className="h-full flex items-center justify-center">
                <ImageGallery
                  items={galleryImages}
                  startIndex={selectedPhotoIndex}
                  showThumbnails={true}
                  showPlayButton={true}
                  showFullscreenButton={true}
                  showNav={true}
                  autoPlay={false}
                  slideInterval={3000}
                  slideDuration={450}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default TravelingSection;
